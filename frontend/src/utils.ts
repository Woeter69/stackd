export async function safeJson(res: Response) {
  try {
    const text = await res.text()
    if (!text) return {}
    try {
      return JSON.parse(text)
    } catch {
      return { error: text }
    }
  } catch (err: any) {
    return { error: err.message || 'Failed to read response' }
  }
}
