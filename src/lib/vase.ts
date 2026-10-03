import * as ClipperLib from "clipper-lib";
import type { MultiPolygon, Pair, Ring } from "polygon-clipping";

// Simulates a spiral vase print: one line, `nozzle` wide, tracing the inside
// of the outline. Uses Clipper, the polygon library PrusaSlicer slices with.

// Clipper works on integers, so 1 unit is 1 µm.
const SCALE = 1000;
const ARC_TOLERANCE = 5;
// Keeps fins exactly two lines thick from leaving a zero-width hollow.
const SLIVER = 5;
// Hollows smaller than this (µm²) are rounding noise.
const MIN_HOLE = 1000;

// Two lines, out and back, fuse into one solid wall. Thin parts should be
// exactly this thick: thinner over-extrudes, thicker leaves a gap.
export function solidWall(nozzle: number) {
  return nozzle * 2;
}

function toPaths(shape: MultiPolygon): ClipperLib.Paths {
  return shape.flatMap((polygon) =>
    // Rings repeat their first point to close.
    polygon.map((ring) =>
      ring.slice(0, -1).map(([x, y]) => ({
        X: Math.round(x * SCALE),
        Y: Math.round(y * SCALE),
      }))
    )
  );
}

function toRing(path: ClipperLib.Path): Ring {
  const ring = path.map(({ X, Y }): Pair => [X / SCALE, Y / SCALE]);
  ring.push(ring[0]);
  return ring;
}

function toShape(tree: ClipperLib.PolyTree): MultiPolygon {
  return ClipperLib.JS.PolyTreeToExPolygons(tree).map(({ outer, holes }) => [
    toRing(outer),
    ...holes
      .filter((hole) => Math.abs(ClipperLib.Clipper.Area(hole)) > MIN_HOLE)
      .map(toRing),
  ]);
}

// Grows (positive) or shrinks (negative) by `delta` µm, rounding corners.
function offset(paths: ClipperLib.Paths, delta: number) {
  const clipper = new ClipperLib.ClipperOffset(2, ARC_TOLERANCE);
  clipper.AddPaths(
    paths,
    ClipperLib.JoinType.jtRound,
    ClipperLib.EndType.etClosedPolygon
  );
  const out: ClipperLib.Paths = [];
  clipper.Execute(out, delta);
  return out;
}

function difference(subject: ClipperLib.Paths, clip: ClipperLib.Paths) {
  const clipper = new ClipperLib.Clipper();
  clipper.AddPaths(subject, ClipperLib.PolyType.ptSubject, true);
  clipper.AddPaths(clip, ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  clipper.Execute(
    ClipperLib.ClipType.ctDifference,
    tree,
    ClipperLib.PolyFillType.pftNonZero,
    ClipperLib.PolyFillType.pftNonZero
  );
  return tree;
}

export type VasePrint = {
  walls: MultiPolygon;
  // Vase mode can only print one.
  loops: number;
};

export function vasePrint(shape: MultiPolygon, nozzle: number): VasePrint {
  const half = (nozzle / 2) * SCALE;
  // Where the middle of the nozzle travels.
  const path = offset(toPaths(shape), -half);
  const walls = difference(offset(path, half), offset(path, -half - SLIVER));

  return {
    walls: toShape(walls),
    loops: difference(path, []).ChildCount(),
  };
}
