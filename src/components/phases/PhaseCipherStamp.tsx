const STAMPS: Record<number, string> = {
  1: 'אמת',
  2: 'צפון',
  3: 'שער',
  4: 'סוף',
}

export function PhaseCipherStamp({ phaseNo }: { phaseNo: number }) {
  const value = STAMPS[phaseNo]
  if (!value) return null
  return <span className="phase-cipher-stamp" dir="rtl" lang="he" aria-label="fragment chiffré">{value}</span>
}
