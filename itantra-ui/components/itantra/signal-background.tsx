export function SignalBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {/* Top-right concentric transmission rings */}
      <svg
        className="absolute -right-40 -top-40 h-[36rem] w-[36rem] text-accent/40"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[60, 110, 160, 200].map((r, i) => (
          <circle
            key={r}
            cx="200"
            cy="200"
            r={r}
            stroke="currentColor"
            strokeWidth="1"
            className="itantra-pulse-arc"
            style={{ animationDelay: `${i * 0.8}s`, opacity: 0.12 }}
          />
        ))}
      </svg>

      {/* Bottom-left signal arcs */}
      <svg
        className="absolute -bottom-32 -left-32 h-[30rem] w-[30rem] text-primary/40"
        viewBox="0 0 400 400"
        fill="none"
      >
        {[70, 130, 190].map((r, i) => (
          <path
            key={r}
            d={`M ${200 - r} 200 A ${r} ${r} 0 0 1 200 ${200 - r}`}
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="itantra-pulse-arc"
            style={{ animationDelay: `${i * 1.1}s`, opacity: 0.14 }}
          />
        ))}
      </svg>

      {/* Subtle center vignette to keep focus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--background)_100%)]" />
    </div>
  )
}
