import type { MultiPolygon, Pair } from "polygon-clipping";

import type {
  Container,
  Control,
  Design,
  Seat,
} from "@/components/designs/types";
import {
  clamp,
  containerCenter,
  containerCorners,
} from "@/components/designs/shared";

export type Overrides = Record<string, number>;

export function overrideSlot(style: string, control: Control) {
  return control.shared ? control.key : `${style}.${control.key}`;
}

export function minOf(control: Control, params: Record<string, number>) {
  return typeof control.min === "function" ? control.min(params) : control.min;
}

export function resolveParams(
  style: string,
  design: Design,
  container: Container,
  overrides: Overrides
): Record<string, number> {
  let params: Record<string, number> = {};
  for (const control of design.config) {
    params[control.key] = control.default;
  }

  // Autos and minimums read other params that may be derived themselves, so
  // repeat until nothing changes.
  for (let pass = 0; pass < 5; pass++) {
    const next: Record<string, number> = {};
    for (const control of design.config) {
      const value =
        overrides[overrideSlot(style, control)] ??
        control.auto?.(container, params) ??
        control.default;
      next[control.key] = clamp(value, minOf(control, params), control.max);
    }
    const settled = design.config.every(
      (control) => next[control.key] === params[control.key]
    );
    params = next;
    if (settled) break;
  }

  // In case it didn't settle, make sure every value is still in range.
  for (const control of design.config) {
    params[control.key] = clamp(
      params[control.key],
      minOf(control, params),
      control.max
    );
  }
  return params;
}

export type Bounds = { minX: number; minY: number; maxX: number; maxY: number };

function boundsOf(points: Pair[]): Bounds {
  const b = {
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  };
  for (const [x, y] of points) {
    b.minX = Math.min(b.minX, x);
    b.minY = Math.min(b.minY, y);
    b.maxX = Math.max(b.maxX, x);
    b.maxY = Math.max(b.maxY, y);
  }
  return b;
}

// Rings repeat their first point to close, so consecutive pairs cover every edge.
function ringLength(ring: Pair[]) {
  let length = 0;
  for (let i = 1; i < ring.length; i++) {
    length += Math.hypot(
      ring[i][0] - ring[i - 1][0],
      ring[i][1] - ring[i - 1][1]
    );
  }
  return length;
}

export type Analysis = {
  bounds: Bounds;
  // The stand plus the container.
  frame: Bounds;
  contact: [number, number];
  parts: number;
  holes: number;
  // Outer outlines only, since vase mode doesn't print holes.
  perimeter: number;
  // Without a known height the far edge is unknown, so the outline is open.
  ghost: { corners: [Pair, Pair, Pair, Pair]; open: boolean };
  centerOfMass: Pair | null;
  balance: Balance | null;
};

export type Balance = {
  status: "stable" | "tips-forward" | "tips-back";
  margin: number;
};

const GROUND_EPSILON = 0.01;

// Where the stand touches the table, as an x range.
export function groundContact(shape: MultiPolygon): [number, number] {
  const points = shape.flatMap((polygon) => polygon.flat());
  const minY = Math.min(...points.map(([, y]) => y));
  const xs = points
    .filter(([, y]) => y - minY < GROUND_EPSILON)
    .map(([x]) => x);
  return [Math.min(...xs), Math.max(...xs)];
}

export function analyze(
  shape: MultiPolygon,
  seat: Seat,
  container: Container,
  back: number
): Analysis {
  const points = shape.flatMap((polygon) => polygon.flat());
  const bounds = boundsOf(points);
  const contact = groundContact(shape);

  const length = container.height ?? Math.max(back * 1.5, 60);
  const corners = containerCorners(seat, container.thickness, length);
  const centerOfMass = containerCenter(seat, container);

  let balance: Balance | null = null;
  if (centerOfMass) {
    const x = centerOfMass[0];
    const margin = Math.min(x - contact[0], contact[1] - x);
    balance = {
      status:
        margin >= 0 ? "stable" : x < contact[0] ? "tips-forward" : "tips-back",
      margin,
    };
  }

  const frame = boundsOf([
    [bounds.minX, bounds.minY],
    [bounds.maxX, bounds.maxY],
    ...corners,
  ]);

  return {
    bounds,
    frame,
    contact,
    parts: shape.length,
    holes: shape.reduce((sum, polygon) => sum + polygon.length - 1, 0),
    perimeter: shape.reduce((sum, [outer]) => sum + ringLength(outer), 0),
    ghost: { corners, open: !container.height },
    centerOfMass,
    balance,
  };
}

// Quarter-octave steps, so the views don't re-zoom on every slider tick.
export function snapScale(scale: number) {
  return Math.pow(2, Math.floor(Math.log2(scale) * 4) / 4);
}

export function formatMm(n: number) {
  return (Math.round(n * 10) / 10).toString();
}
