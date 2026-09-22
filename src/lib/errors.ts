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
  if (normalized.includes('pending_submission_once') || normalized.includes('duplicate key') && normalized.includes('submissions')) {
    return "TRANSMISSION DÉJÀ EN COURS — R-0 N'A PAS ENCORE TRAITÉ LE PAQUET PRÉCÉDENT"
  }
  if (normalized.includes('transmissions_one_per_phase')) {
    return 'UNE TRANSMISSION A DÉJÀ ÉTÉ ÉMISE POUR CE FRAGMENT'
  }
  if (normalized.includes('previous phase not cleared')) {
    return 'ACCÈS REFUSÉ — LA PHASE PRÉCÉDENTE N’EST PAS VALIDÉE'
  }
  if (normalized.includes('coordinates required')) {
    return 'COORDONNÉES REQUISES AVANT VALIDATION'
  }
  if (normalized.includes('coordinates too long')) {
    return 'COORDONNÉES TROP LONGUES'
  }
  if (normalized.includes('submission already reviewed')) {
    return 'TRANSMISSION DÉJÀ TRAITÉE — ACTUALISEZ LE CANAL'
  }
  if (normalized.includes('submission not found')) {
    return 'TRANSMISSION INTROUVABLE'
  }
  if (normalized.includes('player not found')) {
    return 'IDENTITÉ FANTÔME INTROUVABLE'
  }
  if (normalized.includes('message required')) {
    return 'MESSAGE R-0 REQUIS'
  }
  if (normalized.includes('message too long')) {
    return 'MESSAGE R-0 TROP LONG'
  }
  if (normalized.includes('access denied') || normalized.includes('permission denied') || normalized.includes('row-level security')) {
    return 'ACCESS DENIED'
  }
  if (normalized.includes('failed to fetch') || normalized.includes('network')) {
    return 'CANAL INJOIGNABLE — VÉRIFIEZ LA CONNEXION RÉSEAU'
  }
  return message || 'ERREUR SYSTÈME INCONNUE'
}
