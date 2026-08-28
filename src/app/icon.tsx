import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F0D89E",
          borderRadius: 14,
        }}
      >
        <svg width="46" height="46" viewBox="0 0 150 150" fill="none">
          <polyline
            points="14,84 42,112 74,60"
            stroke="#4A0E17"
            strokeWidth="18"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <polyline
            points="42,50 70,78 102,26"
            stroke="#4A0E17"
            strokeWidth="18"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <polyline points="102,26 128,6" stroke="#4A0E17" strokeWidth="18" strokeLinecap="square" />
          <polygon points="108,-6 142,-2 138,32" fill="#4A0E17" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
