export function humanizeError(error: unknown): string {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '')
  const normalized = message.toLowerCase()

  if (normalized.includes('supabase not configured')) {
    return 'CONFIGURATION SUPABASE REQUISE — VOIR README.md'
  }
  if (normalized.includes('invalid login credentials')) {
    return "IDENTIFICATION REFUSÉE — ALIAS OU CLÉ D'ACCÈS INVALIDE"
  }
  if (normalized.includes('user already registered') || normalized.includes('already been registered')) {
    return 'IDENTITÉ DÉJÀ ENREGISTRÉE'
  }
  if (normalized.includes('invalid ghost alias')) {
    return 'ALIAS INVALIDE — EMPREINTE REJETÉE'
  }
  if (normalized.includes('recipient not found')) {
    return 'DESTINATAIRE INTROUVABLE'
  }
  if (normalized.includes('message not found')) {
    return 'MESSAGE INTROUVABLE OU SUPPRESSION NON AUTORISÉE'
  }
  if (normalized.includes('invalid target')) {
    return 'DESTINATAIRE INVALIDE'
  }
  if (normalized.includes('empty message')) {
    return 'MESSAGE VIDE'
  }
  if (normalized.includes('message too long')) {
    return 'MESSAGE TROP LONG'
  }
  if (normalized.includes('cannot edit self') || normalized.includes('admin role is manual')) {
    return 'OPÉRATION NON AUTORISÉE SUR CE COMPTE'
  }
  if (normalized.includes('mission not available')) {
    return 'MISSION INDISPONIBLE — DÉJÀ DÉCLARÉE OU NON ASSIGNÉE'
  }
  if (normalized.includes('not awaiting validation')) {
    return 'MISSION DÉJÀ TRAITÉE — ACTUALISEZ LE CANAL'
  }
  if (normalized.includes('access denied') || normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'ACCESS DENIED'
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'CANAL INJOIGNABLE — VÉRIFIEZ LA CONNEXION RÉSEAU'
  }
  return message || 'ERREUR SYSTÈME INCONNUE'
}
