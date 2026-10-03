import polygonClipping from "polygon-clipping";
import type { MultiPolygon, Pair, Ring } from "polygon-clipping";

import type { Container, Seat } from "@/components/designs/types";

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function toRadians(degrees: number) {
  return (degrees / 180) * Math.PI;
}

export function rotatePoint(
  [x, y]: Pair,
  angle: number,
  [ox, oy]: Pair = [0, 0]
): Pair {
  const cos = Math.cos(toRadians(angle));
  const sin = Math.sin(toRadians(angle));
  const dx = x - ox;
  const dy = y - oy;
  return [ox + dx * cos - dy * sin, oy + dx * sin + dy * cos];
}

export function rect([width, height]: Pair, [x, y]: Pair = [0, 0]): Ring {
  return [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
}

// Snapped to a fine grid so points that should meet after rotating do.
const round = (n: number) => Math.round(n * 16384) / 16384;

export function rotateRings(rings: Ring[], angle: number, origin?: Pair) {
  return rings.map((ring) =>
    ring.map((point): Pair => {
      const [x, y] = rotatePoint(point, angle, origin);
      return [round(x), round(y)];
    })
  );
}

function close(ring: Ring): Ring {
  const [first, last] = [ring[0], ring[ring.length - 1]];
  return first[0] === last[0] && first[1] === last[1] ? ring : [...ring, first];
}

export function union(rings: Ring[]): MultiPolygon {
  return polygonClipping.union(rings.map((ring) => [close(ring)]));
}

// The leftmost, rightmost and lowest points. The first one found wins a tie.
export function extremes(shape: MultiPolygon) {
  let left: Pair = [Infinity, 0];
  let right: Pair = [-Infinity, 0];
  let bottom: Pair = [0, Infinity];
  for (const point of shape.flat(2)) {
    if (point[0] < left[0]) left = point;
    if (point[0] > right[0]) right = point;
    if (point[1] < bottom[1]) bottom = point;
  }
  return { left, right, bottom };
}

// A pie slice from one angle to another, in degrees. `through` adds a vertex
// at that exact angle, for points that can't be cut by a segment.
export function sectorRing(
  center: Pair,
  radius: number,
  from: number,
  to: number,
  through?: number
): Ring {
  const steps = 16;
  const angles = Array.from(
    { length: steps + 1 },
    (_, i) => from + ((to - from) * i) / steps
  );
  if (through != null && through > from && through < to) {
    angles.push(through);
    angles.sort((a, b) => a - b);
  }

  return [
    center,
    ...angles.map((angle): Pair => [
      center[0] + Math.cos(toRadians(angle)) * radius,
      center[1] + Math.sin(toRadians(angle)) * radius,
    ]),
  ];
}

// Rounds the convex corner at `vertex` with continuous curvature, so there's
// no kink where the curve meets the edges. `size` is capped at half of each edge.
export function smoothCorner(
  shape: MultiPolygon,
  vertex: Pair,
  size: number
): MultiPolygon {
  if (size <= 0) return shape;

  return shape.map(([outer, ...holes]) => [
    roundRing(outer, vertex, size),
    ...holes,
  ]);
}

function roundRing(ring: Ring, vertex: Pair, size: number): Ring {
  // Rings repeat their first point to close.
  const points = ring.slice(0, -1);
  const n = points.length;
  const i = points.findIndex(
    ([x, y]) => Math.hypot(x - vertex[0], y - vertex[1]) < 1e-4
  );
  if (i === -1) return ring;

  const curve = smoothCornerCurve(
    points[(i - 1 + n) % n],
    points[i],
    points[(i + 1) % n],
    size
  );
  const out = [...points.slice(0, i), ...curve, ...points.slice(i + 1)];
  out.push(out[0]);
  return out;
}

// Outer rings run counter-clockwise, so a convex corner turns left.
function smoothCornerCurve(prev: Pair, v: Pair, next: Pair, size: number) {
  const lenIn = Math.hypot(prev[0] - v[0], prev[1] - v[1]);
  const lenOut = Math.hypot(next[0] - v[0], next[1] - v[1]);
  const d = Math.min(size, lenIn / 2, lenOut / 2);

  const headingIn = Math.atan2(v[1] - prev[1], v[0] - prev[0]);
  const headingOut = Math.atan2(next[1] - v[1], next[0] - v[0]);
  let turn = headingOut - headingIn;
  turn = Math.atan2(Math.sin(turn), Math.cos(turn));
  if (d <= 0 || turn < 1e-3 || turn > Math.PI - 1e-3) {
    return [v];
  }

  // Walk a unit-length curve whose curvature follows sin².
  const steps = 48;
  const walk: Pair[] = [[0, 0]];
  for (let s = 0; s < steps; s++) {
    const t = (s + 0.5) / steps;
    const heading =
      headingIn + turn * (t - Math.sin(2 * Math.PI * t) / (2 * Math.PI));
    const [x, y] = walk[walk.length - 1];
    walk.push([x + Math.cos(heading) / steps, y + Math.sin(heading) / steps]);
  }

  // The curve is symmetric, so scale it until both ends sit `d` from the corner.
  const [ex, ey] = walk[walk.length - 1];
  const reach = Math.hypot(ex, ey) / (2 * Math.cos(turn / 2));
  const scale = d / reach;
  const start: Pair = [
    v[0] - Math.cos(headingIn) * d,
    v[1] - Math.sin(headingIn) * d,
  ];

  return walk.map(
    ([x, y]): Pair => [start[0] + x * scale, start[1] + y * scale]
  );
}

// Controls that mean the same in every style.

export const angleControl = {
  key: "angle",
  label: "Angle",
  min: 0,
  max: 90,
  step: 1,
  suffix: "°",
  default: 60,
  shared: true,
  hint: "Measured from the table.",
} as const;

export const widthControl = {
  key: "width",
  label: "Stand width",
  min: 10,
  max: 200,
  step: 1,
  suffix: "mm",
  default: 60,
  shared: true,
  auto: (container: Container) => container.width,
  hint: "Becomes the print height in vase mode.",
} as const;

export const toleranceControl = {
  key: "tolerance",
  label: "Pocket tolerance",
  min: 0,
  max: 3,
  step: 0.1,
  suffix: "mm",
  default: 0.5,
  advanced: true,
  shared: true,
  hint: "Extra room added to the thickness.",
} as const;

export const nozzleControl = {
  key: "nozzle",
  label: "Nozzle width",
  min: 0.2,
  max: 1.2,
  step: 0.05,
  suffix: "mm",
  default: 0.6,
  shared: true,
  print: true,
  hint: "Set the slicer's extrusion width to match. Lips and floors are two lines thick.",
} as const;

// The container's side outline: bottom-back, top-back, top-front, bottom-front.
export function containerCorners(
  seat: Seat,
  thickness: number,
  length: number
): [Pair, Pair, Pair, Pair] {
  const rad = toRadians(seat.angle);
  const along: Pair = [Math.cos(rad), Math.sin(rad)];
  const across: Pair = [-Math.sin(rad), Math.cos(rad)];
  const at = (a: number, b: number): Pair => [
    seat.origin[0] + along[0] * a + across[0] * b,
    seat.origin[1] + along[1] * a + across[1] * b,
  ];
  return [at(0, 0), at(length, 0), at(length, thickness), at(0, thickness)];
}

// Taken as the middle of the outline. Needs the height.
export function containerCenter(seat: Seat, container: Container): Pair | null {
  if (!container.height) return null;
  const [a, , c] = containerCorners(seat, container.thickness, container.height);
  return [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
}

// How far back the container reaches. Needs the height.
export function containerBackX(seat: Seat, container: Container) {
  if (!container.height) return null;
  const corners = containerCorners(seat, container.thickness, container.height);
  return Math.max(...corners.map(([x]) => x));
}

// Golden ratio of the container height.
export function autoBack(container: Container) {
  return container.height ? container.height * 0.618 : null;
}
