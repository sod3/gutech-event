import { useId } from "react";

// A resolution-independent ribbon: parallel contours sweep around a folded
// surface, with a shared light source. No canvas loop or downloaded asset needed.
export function Ribbon({ className = "" }: { className?: string }) {
  const id = useId().replaceAll(":", "");
  const contours = Array.from({ length: 58 }, (_, i) => {
    const t = i / 57;
    return `M ${135 + t * 100} ${390 + t * 40}
      C ${200 + t * 85} ${225 + t * 65}, ${653 - t * 105} ${-3 + t * 125}, ${765 - t * 50} ${116 + t * 105}
      C ${933 - t * 130} ${330 + t * 55}, ${333 + t * 120} ${603 - t * 155}, ${-180 + t * 30} ${615 - t * 20}`;
  });
  return (
    <svg
      className={`brand-ribbon ${className}`}
      viewBox="0 0 900 700"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-edge`} x1="30" y1="600" x2="700" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3b060d" stopOpacity="0" />
          <stop offset=".22" stopColor="#ab152a" />
          <stop offset=".48" stopColor="#ff5c6c" />
          <stop offset=".67" stopColor="#860e22" />
          <stop offset=".83" stopColor="#ff5c6c" />
          <stop offset=".94" stopColor="#fff0f2" />
          <stop offset="1" stopColor="#db2d49" />
        </linearGradient>
        <linearGradient id={`${id}-surface`} x1="300" y1="620" x2="700" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#38040e" stopOpacity="0" />
          <stop offset=".5" stopColor="#36030c" />
          <stop offset="1" stopColor="#a81b32" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#ff304e" stopOpacity=".17" />
          <stop offset="1" stopColor="#ff304e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="530" cy="340" rx="355" ry="270" fill={`url(#${id}-glow)`} />
      <g className="ribbon-contours">
        <path
          d={`${contours[0]} L -150 595 C 453 448, 803 385, 715 221 C 548 122, 285 290, 235 430 Z`}
          fill={`url(#${id}-surface)`}
        />
        {contours.map((d, i) => (
          <path key={i} d={d} stroke={`url(#${id}-edge)`} strokeWidth={i % 5 === 0 ? 1.8 : 1.05} opacity={0.6 + Math.sin((i / 57) * Math.PI) * 0.4} />
        ))}
      </g>
    </svg>
  );
}
