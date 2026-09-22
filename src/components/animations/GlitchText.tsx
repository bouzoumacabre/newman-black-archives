export function GlitchText({ children, active = true, className = '' }: { children: string; active?: boolean; className?: string }) {
  return (
    <span className={`${active ? 'glitch' : ''} ${className}`} data-text={children}>
      {children}
    </span>
  )
}
