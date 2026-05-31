/** First two letters of the user's display name for avatars. */
export function getUserInitials(name?: string | null): string {
  const raw = (name || "Learner").trim();
  if (!raw) return "LE";

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return raw.slice(0, 2).toUpperCase();
}
