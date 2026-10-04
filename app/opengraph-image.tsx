import { ImageResponse } from "next/og";
export const alt = "Forma. Give your idea a home.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#0e0c12",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        color: "#eee9f2",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 32 }}
      >
        <svg width="40" height="40" viewBox="0 0 32 32">
          <path d="M6 5h21l-5 6H12v5h12l-5 6h-7v5H6V5Z" fill="#b8a6ce" />
        </svg>
        forma
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <div style={{ fontSize: 76, letterSpacing: -4, lineHeight: 1.1 }}>
          Give your idea a home.
        </div>
        <div style={{ fontSize: 28, color: "#9e8bac" }}>
          Start with AI. Make it yours. Put it out there.
        </div>
      </div>
      <div style={{ fontSize: 20, color: "#b8a6ce" }}>
        The website studio for your next idea.
      </div>
    </div>,
    size,
  );
}
