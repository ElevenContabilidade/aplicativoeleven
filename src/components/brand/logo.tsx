type MarkProps = {
  className?: string;
  color?: string;
};

/**
 * Abstract recreation of the Eleven mark (nested chevrons + growth arrow).
 * Rebuilt as vector from the reference artwork — swap for the original
 * vector file when available.
 */
export function EleveMark({ className, color = "currentColor" }: MarkProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <polyline
        points="10,58 34,34 10,10"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <polyline
        points="32,80 56,56 32,32"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <polyline
        points="45,66 82,29"
        stroke={color}
        strokeWidth="11"
        strokeLinecap="square"
      />
      <polygon points="66,8 90,10 88,34" fill={color} />
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
