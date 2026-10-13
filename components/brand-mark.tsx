/** Geometric 中国 seal, drawn as paths so it never depends on a CJK font. */
export function BrandMark({ className = '' }: { className?: string }) {
  return <svg className={`brand-seal ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
    <rect className="brand-seal-field" x="2" y="2" width="60" height="60" rx="13" />
    <rect x="6" y="6" width="52" height="52" rx="9" stroke="currentColor" strokeOpacity=".35" />
    <path d="M11 22h18v17H11zM20 15v34M36 16h18v32H36zM41 24h8M41 32h8M41 40h8M45 24v16M49 35l2 2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter" />
  </svg>;
}
