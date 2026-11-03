export function GlitchText({ children, className = '' }: { children: string; className?: string }) {
  return <span className={`glitch-text ${className}`} data-text={children}>{children}</span>
}
