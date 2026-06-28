export function parseTagsFromString(input: string): string[] {
  const parts = input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}
