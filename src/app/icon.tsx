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
        <svg width="46" height="46" viewBox="18.25 18.25 449.25 458.25">
          <path
            d="M 461.50,30.00 L 343.00,65.25 L 342.25,67.75 L 361.00,85.25 L 361.00,88.50 L 113.25,336.00 L 113.25,337.75 L 246.00,470.50 L 248.75,470.50 L 291.50,427.75 L 291.50,426.00 L 202.75,337.50 L 202.75,335.25 L 407.25,130.75 L 428.25,150.75 L 431.75,151.50 Z"
            fill="#4A0E17"
          />
          <path
            d="M 248.75,24.25 L 246.00,24.25 L 24.25,246.00 L 24.25,248.75 L 66.00,290.50 L 68.75,290.50 L 290.50,68.75 L 290.50,66.00 Z"
            fill="#4A0E17"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
