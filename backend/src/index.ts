import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import "dotenv/config";
import { db } from "./db";
import { rooms, players, transactions, users } from "./db/schema";
import { eq, and, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { authRouter, requireAuth, AuthRequest } from "./routes/auth";
import jwt from "jsonwebtoken";

// ─── App Setup ───────────────────────────────────────────────────────────────

const app = express();
app.use(cors());
app.use(express.json());

// JSON parse error handler
app.use(((err, req, res, next) => {
  if (err instanceof SyntaxError && "status" in err && err.status === 400 && "body" in err) {
    res.status(400).json({ error: "Invalid JSON payload" });
    return;
  }
  next();
}) as express.ErrorRequestHandler);

// Auth Routes
app.use(["/api/auth", "/auth"], authRouter);

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  path: "/api/socket.io",
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const PORT = process.env.PORT ?? 3001;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: 5 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

async function getRoomState(roomCode: string) {
  const [room] = await db
    .select()
    .from(rooms)
    .where(eq(rooms.code, roomCode));
  if (!room) return null;

  const roomPlayers = await db
    .select()
    .from(players)
    .where(eq(players.roomId, room.id));

  return { room, players: roomPlayers };
}

// ─── REST Routes ─────────────────────────────────────────────────────────────

const roomRouter = express.Router();

/** POST /rooms – Create a new room with a banker */
roomRouter.post("/", requireAuth, async (req: AuthRequest, res) => {
  const { bankerName, gameType } = req.body as { bankerName: string; gameType: string };
  if (!bankerName?.trim()) {
    res.status(400).json({ error: "bankerName is required" });
    return;
  }
  
  const validGameType = gameType === 'blackjack' ? 'blackjack' : 'poker';

  try {
    let code: string;
    let attempts = 0;
    do {
      code = generateCode();
      attempts++;
      if (attempts > 10) {
        res.status(500).json({ error: "Could not generate unique room code" });
        return;
      }
      const existing = await db
        .select()
        .from(rooms)
        .where(eq(rooms.code, code));
      if (existing.length === 0) break;
    } while (true);

    const [room] = await db.insert(rooms).values({ code: code!, gameType: validGameType }).returning();

    const [banker] = await db
      .insert(players)
      .values({
        roomId: room.id,
        userId: req.user!.id,
        name: bankerName.trim(),
        role: "banker",
        balance: 0,
      })
      .returning();

    res.json({ room, banker });
  } catch (err) {
    console.error("[POST /rooms]", err);
    res.status(500).json({ error: "Failed to create room. Check DATABASE_URL and run db:push." });
  }
});

/** POST /rooms/join – Join an existing room */
roomRouter.post("/join", requireAuth, async (req: AuthRequest, res) => {
  const { code, playerName } = req.body as { code: string; playerName: string };
  if (!code?.trim() || !playerName?.trim()) {
    res.status(400).json({ error: "code and playerName are required" });
    return;
  }

  try {
    const [room] = await db
      .select()
      .from(rooms)
      .where(eq(rooms.code, code.toUpperCase().trim()));

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const [player] = await db
      .insert(players)
      .values({
        roomId: room.id,
        userId: req.user!.id,
        name: playerName.trim(),
        role: "player",
        balance: 0,
      })
      .returning();

    const state = await getRoomState(room.code);
    res.json({ room, player, state });
  } catch (err) {
    console.error("[POST /rooms/join]", err);
    res.status(500).json({ error: "Failed to join room. Check DATABASE_URL and run db:push." });
  }
});

/** GET /rooms/:code – Fetch full room state details */
roomRouter.get("/:code", requireAuth, async (req: AuthRequest, res) => {
  try {
    const state = await getRoomState((req.params.code as string).toUpperCase());
    if (!state) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.json(state);
  } catch (err) {
    console.error("[GET /rooms/:code]", err);
    res.status(500).json({ error: "Failed to fetch room state." });
  }
});

app.use(["/api/rooms", "/rooms"], roomRouter);

// ─── Socket.IO ───────────────────────────────────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || "dev-super-secret-jwt-key";

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error("Authentication error: No token provided"));
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string };
    (socket as any).user = decoded;
    next();
  } catch (err) {
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id, "User:", (socket as any).user?.username);

  /** Client joins a socket room by room code */
  socket.on("JOIN_ROOM", (roomCode: string) => {
    socket.join(roomCode.toUpperCase());
    console.log(`[socket] ${socket.id} joined room ${roomCode}`);
  });

  /**
   * TRANSFER event
   * Payload: { roomCode, senderId, receiverId, amount }
   * receiverId can be "POT" – in that case chips go to a virtual pot tracked
   * as the banker's balance (or a dedicated pot player determined by the frontend).
   */
  socket.on(
    "TRANSFER",
    async (payload: {
      roomCode: string;
      senderId: string;
      receiverId: string;
      amount: number;
    }) => {
      const { roomCode, senderId, receiverId, amount } = payload;

      if (!amount || amount <= 0) {
        socket.emit("ERROR", { message: "Invalid transfer amount" });
        return;
      }

      try {
        // Fetch sender
        const [sender] = await db
          .select()
          .from(players)
          .where(eq(players.id, senderId));

        if (!sender) {
          socket.emit("ERROR", { message: "Sender not found" });
          return;
        }

        if (sender.balance < amount) {
          socket.emit("ERROR", { message: "Insufficient balance" });
          return;
        }

        // Debit sender
        await db
          .update(players)
          .set({ balance: sender.balance - amount })
          .where(eq(players.id, senderId));
          
        if (sender.userId) {
          await db.update(users)
            .set({ globalBalance: sql`global_balance - ${amount}` })
            .where(eq(users.id, sender.userId));
        }

        // Credit receiver (skip if POT – pot is just chips removed from play)
        if (receiverId !== "POT") {
          const [receiver] = await db
            .select()
            .from(players)
            .where(eq(players.id, receiverId));

          if (!receiver) {
            socket.emit("ERROR", { message: "Receiver not found" });
            return;
          }

          await db
            .update(players)
            .set({ balance: receiver.balance + amount })
            .where(eq(players.id, receiverId));
            
          if (receiver.userId) {
            await db.update(users)
              .set({ globalBalance: sql`global_balance + ${amount}` })
              .where(eq(users.id, receiver.userId));
          }

          // Log transaction
          const [room] = await db
            .select()
            .from(rooms)
            .where(eq(rooms.code, roomCode.toUpperCase()));

          if (room) {
            await db.insert(transactions).values({
              roomId: room.id,
              senderId,
              receiverId,
              amount,
            });
          }
        }

        // Broadcast updated state to everyone in the room
        const state = await getRoomState(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit("STATE_UPDATE", state);
      } catch (err) {
        console.error("[TRANSFER error]", err);
        socket.emit("ERROR", { message: "Transfer failed" });
      }
    }
  );

  /**
   * MINT event – Banker mints new chips for a player (or themselves)
   * Payload: { roomCode, targetPlayerId, amount }
   */
  socket.on(
    "MINT",
    async (payload: {
      roomCode: string;
      targetPlayerId: string;
      amount: number;
    }) => {
      const { roomCode, targetPlayerId, amount } = payload;

      if (!amount || amount <= 0) {
        socket.emit("ERROR", { message: "Invalid mint amount" });
        return;
      }

      try {
        const [player] = await db
          .select()
          .from(players)
          .where(eq(players.id, targetPlayerId));

        if (!player) {
          socket.emit("ERROR", { message: "Player not found" });
          return;
        }

        await db
          .update(players)
          .set({ balance: player.balance + amount })
          .where(eq(players.id, targetPlayerId));

        if (player.userId) {
          await db.update(users)
            .set({ globalBalance: sql`global_balance + ${amount}` })
            .where(eq(users.id, player.userId));
        }

        const state = await getRoomState(roomCode.toUpperCase());
        io.to(roomCode.toUpperCase()).emit("STATE_UPDATE", state);
      } catch (err) {
        console.error("[MINT error]", err);
        socket.emit("ERROR", { message: "Mint failed" });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log(`[socket] disconnected: ${socket.id}`);
  });
});

// ─── Global JSON error handler ────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[unhandled]", err);
  res.status(500).json({ error: err.message ?? "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────

httpServer.listen(PORT, () => {
  console.log(`✅ Stackd backend running on http://localhost:${PORT}`);
});
