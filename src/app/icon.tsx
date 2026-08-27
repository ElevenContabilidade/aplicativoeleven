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
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none">
          <polyline
            points="10,58 34,34 10,10"
            stroke="#4A0E17"
            strokeWidth="13"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <polyline
            points="32,80 56,56 32,32"
            stroke="#4A0E17"
            strokeWidth="13"
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
          <polyline points="45,66 82,29" stroke="#4A0E17" strokeWidth="13" strokeLinecap="square" />
          <polygon points="64,6 92,9 89,36" fill="#4A0E17" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
