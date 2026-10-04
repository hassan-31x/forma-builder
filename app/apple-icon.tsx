import { ImageResponse } from "next/og";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#18151d",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg width="110" height="110" viewBox="0 0 64 64">
        <path d="M17 12h34l-8 10H27v8h19l-8 10H27v12H17V12Z" fill="#cbc1df" />
      </svg>
    </div>,
    size,
  );
}
