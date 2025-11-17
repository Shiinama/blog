export function slugifyHeading(value: string) {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/&/g, '-and-')
    .replace(/-{2,}/g, '-')
    .replace(/[^\p{Letter}\p{Number}\-]+/gu, '-') // keep unicode letters/numbers
    .replace(/^-+|-+$/g, '')
}
