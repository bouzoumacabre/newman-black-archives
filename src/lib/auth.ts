export const USERNAME_RE = /^[a-z0-9_.-]{3,24}$/

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase()
}

export function isValidUsername(value: string) {
  return USERNAME_RE.test(normalizeUsername(value))
}

export function toInternalEmail(username: string) {
  return `${normalizeUsername(username)}@newman-archive.invalid`
}
