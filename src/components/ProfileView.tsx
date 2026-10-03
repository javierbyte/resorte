"use client";

import type { MultiPolygon, Pair } from "polygon-clipping";

import { toRadians } from "@/components/designs/shared";
import type { Seat } from "@/components/designs/types";
import { formatMm, snapScale, type Analysis } from "@/lib/model";
import { useElementSize } from "@/lib/useElementSize";

import styles from "./View.module.css";

// Never zoom in closer than this many mm across, so the grid stays meaningful.
const MIN_EXTENT = 160;

// White over the black panel.
const INK = {
  strong: "rgba(255,255,255,0.92)",
  mid: "rgba(255,255,255,0.5)",
  soft: "rgba(255,255,255,0.28)",
  faint: "rgba(255,255,255,0.07)",
  ghost: "rgba(255,255,255,0.035)",
  // INK.strong over the stand's fill, made opaque.
  wall: "rgb(235,235,235)",
};

// World y points up, SVG y points down.
const sy = (y: number) => -y;

// To the micron. Trig can differ in the last bit between the server and the
// browser, and unrounded coordinates would then fail hydration.
export const roundMm = (n: number) => Math.round(n * 1000) / 1000;

export function shapeToPath(shape: MultiPolygon) {
  return shape
    .flat()
    .map(
      (ring) =>
        "M" +
        ring.map(([x, y]) => `${roundMm(x)} ${roundMm(sy(y))}`).join("L") +
        "Z"
    )
    .join("");
}

function polyline(points: Pair[]) {
  return points.map(([x, y]) => `${x},${sy(y)}`).join(" ");
}

export function ProfileView({
  shape,
  walls,
  seat,
  analysis,
}: {
  shape: MultiPolygon;
  // What the printer lays down, drawn over the outline.
  walls: MultiPolygon;
  seat: Seat;
  analysis: Analysis;
}) {
  const [ref, size] = useElementSize<HTMLDivElement>();

  const { bounds, frame, contact, ghost, centerOfMass } = analysis;

  // Leave room around the frame for dimensions and labels.
  const frameW = Math.max(frame.maxX - frame.minX, MIN_EXTENT) * 1.35;
  const frameH = Math.max(frame.maxY - frame.minY, MIN_EXTENT) * 1.35;

  const ready = size.width > 0 && size.height > 0;
  const scale = ready
    ? snapScale(Math.min(size.width / frameW, size.height / frameH))
    : 1;
  // One screen pixel, in mm.
  const px = 1 / scale;

  const cx = (frame.minX + frame.maxX) / 2;
  const cy = (frame.minY + frame.maxY) / 2;
  const vbW = size.width * px;
  const vbH = size.height * px;
  const vbX = cx - vbW / 2;
  const vbY = sy(cy) - vbH / 2;

  // Aligned to the table and to x = 0.
  const ground = bounds.minY;
  const gridLines: { d: string; major: boolean }[] = [];
  if (ready) {
    for (let x = Math.ceil(vbX / 10) * 10; x <= vbX + vbW; x += 10) {
      gridLines.push({
        d: `M${x} ${vbY}V${vbY + vbH}`,
        major: Math.round(x) % 50 === 0,
      });
    }
    const top = cy + vbH / 2;
    const bottom = cy - vbH / 2;
    for (let y = ground + Math.floor((top - ground) / 10) * 10; y >= bottom; y -= 10) {
      gridLines.push({
        d: `M${vbX} ${sy(y)}H${vbX + vbW}`,
        major: Math.round(y - ground) % 50 === 0,
      });
    }
  }

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  const dimGap = 22 * px;
  const tick = 4 * px;
  const font = 10 * px;

  // Width dimension, under the table line.
  const dimY = sy(ground) + dimGap;
  // Height dimension, right of the stand.
  const dimX = bounds.maxX + dimGap;

  // Angle marker at the seat.
  const arcR = 26 * px;
  const rad = toRadians(seat.angle);
  const [ox, oy] = seat.origin;
  const arcEnd: Pair = [ox + Math.cos(rad) * arcR, oy + Math.sin(rad) * arcR];
  const labelR = arcR + 14 * px;
  const labelAt: Pair = [
    ox + Math.cos(rad / 2) * labelR,
    oy + Math.sin(rad / 2) * labelR,
  ];

  const [g0, g1, g2, g3] = ghost.corners;
  const dash = `${4 * px} ${3 * px}`;

  return (
    <div ref={ref} className={styles.canvas}>
      {ready && (
        <svg
          width={size.width}
          height={size.height}
          viewBox={`${vbX} ${vbY} ${vbW} ${vbH}`}
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
          role="img"
          aria-label={`Side profile, ${formatMm(width)} by ${formatMm(height)} mm`}
        >
          <g strokeWidth={px}>
            {gridLines.map((line, i) => (
              <path
                key={i}
                d={line.d}
                stroke={line.major ? INK.faint : INK.ghost}
              />
            ))}
          </g>

          {/* table */}
          <path
            d={`M${vbX} ${sy(ground)}H${vbX + vbW}`}
            stroke={INK.soft}
            strokeWidth={px}
          />

          {/* container */}
          <polyline
            points={polyline(ghost.open ? [g1, g0, g3, g2] : [g0, g1, g2, g3, g0])}
            stroke={INK.mid}
            strokeWidth={px}
            strokeDasharray={dash}
          />

          {/* stand */}
          <path
            d={shapeToPath(shape)}
            fill="rgba(255,255,255,0.04)"
            fillRule="evenodd"
            stroke={INK.soft}
            strokeWidth={px}
          />
          <path d={shapeToPath(walls)} fill={INK.strong} fillRule="evenodd" />
          {/* contact: just under the table, overlapping the walls by half a
              pixel so no seam shows */}
          <path
            d={`M${contact[0]} ${sy(ground) + px}H${contact[1]}`}
            stroke={INK.wall}
            strokeWidth={3 * px}
            strokeLinecap="butt"
          />

          {/* angle */}
          <g stroke={INK.mid} strokeWidth={px}>
            {/* starts clear of the seat, which can sit right on the base */}
            <path
              d={`M${ox + arcR * 0.5} ${sy(oy)}H${ox + arcR * 1.4}`}
              strokeDasharray={dash}
            />
            <path
              d={`M${ox + arcR} ${sy(oy)}A${arcR} ${arcR} 0 0 0 ${arcEnd[0]} ${sy(arcEnd[1])}`}
            />
          </g>
          <text
            x={labelAt[0]}
            y={sy(labelAt[1])}
            className={styles.svgLabel}
            fontSize={font}
            textAnchor="middle"
            dominantBaseline="middle"
          >
            {Math.round(seat.angle)}°
          </text>

          {centerOfMass && (
            <CenterOfMass at={centerOfMass} ground={ground} px={px} dash={dash} />
          )}

          {/* dimensions */}
          <g stroke={INK.mid} strokeWidth={px}>
            <path
              d={`M${bounds.minX} ${dimY}H${bounds.maxX}M${bounds.minX} ${dimY - tick}v${2 * tick}M${bounds.maxX} ${dimY - tick}v${2 * tick}`}
            />
            <path
              d={`M${dimX} ${sy(bounds.minY)}V${sy(bounds.maxY)}M${dimX - tick} ${sy(bounds.minY)}h${2 * tick}M${dimX - tick} ${sy(bounds.maxY)}h${2 * tick}`}
            />
          </g>
          <text
            x={(bounds.minX + bounds.maxX) / 2}
            y={dimY + 12 * px}
            className={styles.svgLabel}
            fontSize={font}
            textAnchor="middle"
            dominantBaseline="hanging"
          >
            {formatMm(width)}
          </text>
          <text
            x={dimX + 12 * px}
            y={sy((bounds.minY + bounds.maxY) / 2)}
            className={styles.svgLabel}
            fontSize={font}
            textAnchor="start"
            dominantBaseline="middle"
          >
            {formatMm(height)}
          </text>
        </svg>
      )}

      {ready && <ScaleBar scale={scale} />}
    </div>
  );
}

// A crosshair at the center of mass, dropped to an x on the table.
function CenterOfMass({
  at,
  ground,
  px,
  dash,
}: {
  at: Pair;
  ground: number;
  px: number;
  dash: string;
}) {
  const x = at[0];
  const y = sy(at[1]);
  const table = sy(ground);
  const r = 4 * px;
  return (
    <g stroke={INK.strong} strokeWidth={px}>
      <path d={`M${x} ${y}V${table}`} strokeDasharray={dash} stroke={INK.mid} />
      <circle cx={x} cy={y} r={r} fill="#000" />
      <path d={`M${x - r} ${y}h${2 * r}M${x} ${y - r}v${2 * r}`} />
      <path
        d={`M${x - r} ${table - r}l${2 * r} ${2 * r}M${x + r} ${table - r}l${-2 * r} ${2 * r}`}
      />
    </g>
  );
}

function ScaleBar({ scale }: { scale: number }) {
  const mm = [10, 20, 50, 100].find((n) => n * scale >= 60) ?? 100;
  return (
    <div className={styles.scaleBar}>
      <span style={{ width: mm * scale }} />
      {mm} mm
    </div>
  );
}
