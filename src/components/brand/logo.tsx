type MarkProps = {
  className?: string;
  color?: string;
};

/**
 * Official Eleven mark, extracted from the brand's vector artwork
 * (eleven_logo_horizontal_refeito.svg).
 */
export function EleveMark({ className, color = "currentColor" }: MarkProps) {
  return (
    <svg
      viewBox="24.25 24.25 437.25 446.25"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M 461.50,30.00 L 343.00,65.25 L 342.25,67.75 L 361.00,85.25 L 361.00,88.50 L 113.25,336.00 L 113.25,337.75 L 246.00,470.50 L 248.75,470.50 L 291.50,427.75 L 291.50,426.00 L 202.75,337.50 L 202.75,335.25 L 407.25,130.75 L 428.25,150.75 L 431.75,151.50 Z"
        fill={color}
      />
      <path
        d="M 248.75,24.25 L 246.00,24.25 L 24.25,246.00 L 24.25,248.75 L 66.00,290.50 L 68.75,290.50 L 290.50,68.75 L 290.50,66.00 Z"
        fill={color}
      />
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
