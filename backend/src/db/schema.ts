import { pgTable, uuid, varchar, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  globalBalance: integer("global_balance").notNull().default(1000), // Default 1000 starting chips
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 5 }).notNull().unique(),
  gameType: varchar("game_type", { length: 20 }).notNull().default("poker"),
  pot: integer("pot").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const players = pgTable("players", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id),
  name: varchar("name", { length: 100 }).notNull(),
  role: varchar("role", { length: 10 }).notNull(), // 'banker' | 'player'
  balance: integer("balance").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roomId: uuid("room_id")
    .notNull()
    .references(() => rooms.id, { onDelete: "cascade" }),
  senderId: uuid("sender_id")
    .notNull()
    .references(() => players.id),
  receiverId: uuid("receiver_id")
    .notNull()
    .references(() => players.id),
  amount: integer("amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type Player = typeof players.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
