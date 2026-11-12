import { ImageResponse } from "next/og";
export const alt = "LEAP 3 — Pitch Your Startup. Unlock Opportunities.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        background: "#000000",
        padding: "70px 80px",
        color: "#ffffff",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontSize: 27,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        LEAP<span style={{ color: "#ff5c6c", marginLeft: 8 }}>3</span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 55,
          fontSize: 65,
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: -4,
          flexDirection: "column",
        }}
      >
        <span>PITCH YOUR STARTUP.</span>
        <span>
          UNLOCK <span style={{ color: "#ff5c6c" }}>OPPORTUNITIES.</span>
        </span>
      </div>
      <div
        style={{
          display: "flex",
          marginTop: 35,
          fontSize: 25,
          color: "#b8b4bc",
        }}
      >
        GUtech University’s Official Startup Pitching Event
      </div>
      <div
        style={{
          display: "flex",
          marginTop: "auto",
          fontSize: 20,
          justifyContent: "space-between",
        }}
      >
        <span>GUtech Entrepreneurship Society</span>
        <span>Free registration · Ideas welcome</span>
      </div>
    </div>,
    size,
  );
}
