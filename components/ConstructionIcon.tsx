import React from "react";
type Mode = "curves" | "dimensions" | "spines" | "circles";
// All four illustrations share one cubic, so handles, normals and local radii agree.
function sample(t: number) {
  const q = 1 - t,
    p0 = { x: 19, y: 85 },
    p1 = { x: 23, y: 11 },
    p2 = { x: 101, y: 15 },
    p3 = { x: 101, y: 83 };
  const x =
    q * q * q * p0.x +
    3 * q * q * t * p1.x +
    3 * q * t * t * p2.x +
    t * t * t * p3.x;
  const y =
    q * q * q * p0.y +
    3 * q * q * t * p1.y +
    3 * q * t * t * p2.y +
    t * t * t * p3.y;
  const dx =
    3 * q * q * (p1.x - p0.x) +
    6 * q * t * (p2.x - p1.x) +
    3 * t * t * (p3.x - p2.x);
  const dy =
    3 * q * q * (p1.y - p0.y) +
    6 * q * t * (p2.y - p1.y) +
    3 * t * t * (p3.y - p2.y);
  const ddx =
    6 * q * (p2.x - 2 * p1.x + p0.x) + 6 * t * (p3.x - 2 * p2.x + p1.x);
  const ddy =
    6 * q * (p2.y - 2 * p1.y + p0.y) + 6 * t * (p3.y - 2 * p2.y + p1.y);
  const speed = Math.hypot(dx, dy),
    tx = dx / speed,
    ty = dy / speed,
    k = (dx * ddy - dy * ddx) / (speed * speed * speed);
  return { x, y, tx, ty, nx: -ty, ny: tx, k };
}
export function ConstructionIcon({ mode }: { mode: Mode }) {
  const r = sample(0.51),
    radius = 1 / r.k,
    cx = r.x + r.nx * radius,
    cy = r.y + r.ny * radius;
  return (
    <svg
      className="construction-icon"
      viewBox="0 0 120 110"
      fill="none"
      aria-hidden="true"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 99H110M10 99V10" opacity=".12" strokeWidth=".65" />
      {mode === "curves" && (
        <>
          <path d="M19 85L23 11M101 83V15" opacity=".5" strokeWidth="1" />
          {[
            [23, 11],
            [101, 15],
          ].map(([x, y]) => (
            <circle
              key={x}
              cx={x}
              cy={y}
              r="2.7"
              fill="var(--input)"
              strokeWidth="1.1"
            />
          ))}
        </>
      )}
      {mode === "dimensions" && <g strokeWidth=".9" opacity=".7">
        <path d="M19 85V102M101 83V102M19 96H101M15 100L23 92M97 100L105 92M101 30H114M101 83H114M110 30V83M107 33L113 27M107 86L113 80"/>
        <rect x="49" y="91" width="24" height="10" fill="var(--input)" stroke="none"/>
        <text x="61" y="99" textAnchor="middle" fontSize="8" stroke="none" fill="currentColor">82 u</text>
      </g>}
      {mode === "spines" && (
        <g strokeWidth="1">
          {[0.06, 0.26, 0.5, 0.74, 0.94].map((t) => {
            const p = sample(t);
            return (
              <g key={t}>
                <line
                  x1={p.x - p.tx * 15}
                  y1={p.y - p.ty * 15}
                  x2={p.x + p.tx * 15}
                  y2={p.y + p.ty * 15}
                  opacity=".55"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="1.7"
                  fill="currentColor"
                  stroke="none"
                />
              </g>
            );
          })}
        </g>
      )}
      {mode === "circles" && (
        <>
          <circle
            cx={cx}
            cy={cy}
            r={Math.abs(radius)}
            strokeWidth=".9"
            opacity=".45"
          />
          <path
            d={`M${cx - 4} ${cy}h8M${cx} ${cy - 4}v8M${cx} ${cy}L${r.x} ${r.y}`}
            strokeWidth=".8"
            opacity=".6"
          />
          <circle cx={r.x} cy={r.y} r="2.1" fill="currentColor" stroke="none" />
        </>
      )}
      <path d="M19 85C23 11 101 15 101 83" strokeWidth="1.9" />
      {mode === "curves" && (
        <g fill="var(--input)" strokeWidth="1.25">
          <rect x="16.2" y="82.2" width="5.6" height="5.6" />
          <rect x="98.2" y="80.2" width="5.6" height="5.6" />
        </g>
      )}
    </svg>
  );
}
