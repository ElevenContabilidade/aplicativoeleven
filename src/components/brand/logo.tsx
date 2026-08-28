type MarkProps = {
  className?: string;
  color?: string;
};

/**
 * Vectorized recreation of the Eleven mark (two nested checkmarks + growth
 * arrow) traced from the official artwork.
 */
export function EleveMark({ className, color = "currentColor" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 150 150"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polyline
        points="14,84 42,112 74,60"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <polyline
        points="42,50 70,78 102,26"
        stroke={color}
        strokeWidth="16"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <polyline points="102,26 128,6" stroke={color} strokeWidth="16" strokeLinecap="square" />
      <polygon points="110,-4 140,0 136,30" fill={color} />
    </svg>
  );
}

type LogoProps = {
  className?: string;
  markClassName?: string;
  variant?: "wine" | "cream";
  showTagline?: boolean;
};

export function EleveLogo({
  className,
  markClassName = "h-8 w-8",
  variant = "wine",
  showTagline = false,
}: LogoProps) {
  const ink = variant === "wine" ? "text-wine-800" : "text-cream-100";
  const tagline = variant === "wine" ? "text-wine-600" : "text-cream-300";

  return (
    <div className={`flex items-center gap-2.5 ${className ?? ""}`}>
      <EleveMark className={`${markClassName} ${ink} shrink-0`} />
      <div className="leading-none">
        <span className={`font-display text-xl font-medium tracking-tight ${ink}`}>
          eleven<span className="text-wine-500">.</span>
        </span>
        {showTagline && (
          <p className={`mt-0.5 text-[9px] font-medium uppercase tracking-[0.16em] ${tagline}`}>
            Contabilidade &amp; Consultoria
          </p>
        )}
      </div>
    </div>
  );
}
