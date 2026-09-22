export function LoadingTerminal({ label = 'MONTAGE DU CANAL...' }: { label?: string }) {
  return <div className="loading-terminal"><span className="cursor">_</span> {label}</div>
}
