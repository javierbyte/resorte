import type { Pair } from "polygon-clipping";

import type {
  Container,
  Design,
  Params,
  PathFunction,
} from "@/components/designs/types";
import {
  angleControl,
  autoBack,
  containerBackX,
  containerCenter,
  extremes,
  nozzleControl,
  rect,
  rotatePoint,
  rotateRings,
  sectorRing,
  smoothCorner,
  toleranceControl,
  union,
  widthControl,
} from "@/components/designs/shared";
import { groundContact } from "@/lib/model";
import { solidWall } from "@/lib/vase";

const config = [
  angleControl,
  widthControl,
  {
    key: "baseHeight",
    label: "Base height",
    min: 0,
    max: 200,
    step: 1,
    suffix: "mm",
    default: 0,
    hint: "Lifts the holder off the table.",
  },
  {
    key: "baseDepth",
    label: "Base depth",
    min: 0,
    max: 400,
    step: 1,
    suffix: "mm",
    default: 100,
    auto: autoBaseDepth,
    hint: "Auto centers the base under the container, for the most balance.",
  },
  {
    key: "back",
    label: "Back height",
    min: 10,
    max: 400,
    step: 1,
    suffix: "mm",
    default: 50,
    auto: autoBackHeight,
    hint: "Auto leaves 61.8% of the container height resting flat on the back.",
  },
  {
    key: "lip",
    label: "Lip height",
    min: 0,
    max: 60,
    step: 0.5,
    suffix: "mm",
    default: 0,
    hint: "How far the front lip rises above the pocket floor.",
  },
  {
    key: "rounding",
    label: "Corner rounding",
    min: 0,
    max: 40,
    step: 1,
    suffix: "mm",
    default: 12,
    hint: "Smooths the back and bottom corners with continuous curvature.",
  },
  toleranceControl,
  nozzleControl,
] as const;

// The rotated pocket that holds the container, before the base is added.
function holder(params: Record<string, number>, container: Container) {
  const { back, angle, lip, nozzle, tolerance } = params;

  // The lip is a solid fin, and the bends are rounded to the same radius so
  // the back bend sits one solid wall under the seat.
  const wall = solidWall(nozzle);
  const pocket = container.thickness + tolerance;

  const rings = rotateRings(
    [
      // back
      [
        [back, wall],
        [wall, 0],
        [wall, wall],
      ],
      // floor
      rect([wall, pocket], [0, wall]),
      ...(lip > 0 ? [rect([lip, wall], [wall, pocket + wall])] : []),
      // Rounded bends, so they stay one solid wall thick. The lowest point of
      // the back bend sets the table, so it gets an exact vertex.
      sectorRing([wall, wall], wall, 180, 270, 270 - angle),
      sectorRing([wall, pocket + wall], wall, 90, 180),
    ],
    angle
  );

  const seat = { origin: rotatePoint([wall, wall], angle), angle };

  return { rings, seat, ...extremes(union(rings)) };
}

// Leaves 61.8% of the container height resting flat on the back, after the
// bend and the top corner's rounding.
function autoBackHeight(container: Container, params: Record<string, number>) {
  const contact = autoBack(container);
  if (contact == null) return null;

  const { right, bottom } = holder(params, container);
  const backCorner: Pair = [
    bottom[0] + params.baseDepth,
    bottom[1] - params.baseHeight,
  ];
  const backEdge = Math.hypot(
    backCorner[0] - right[0],
    backCorner[1] - right[1]
  );
  // smoothCorner caps the rounding at half of each edge.
  const trim = Math.min(params.rounding, contact, backEdge / 2);
  return contact + solidWall(params.nozzle) + trim;
}

// Centers the base's contact with the table under the container's center of
// mass. Rounding shifts the contact, so measure the real shape and correct.
function autoBaseDepth(container: Container, params: Record<string, number>) {
  const { seat, bottom } = holder(params, container);
  const center = containerCenter(seat, container);
  if (!center) return null;

  let depth = containerBackX(seat, container)! - bottom[0];
  for (let i = 0; i < 3; i++) {
    const next = { ...params, baseDepth: depth } as Params<typeof config>;
    const { shape } = path(next, container);
    const [front, back] = groundContact(shape);
    depth = Math.max(0, depth + 2 * center[0] - front - back);
  }
  return depth;
}

const path: PathFunction<typeof config> = function (params, container) {
  const { baseDepth, baseHeight, rounding } = params;
  const { rings, seat, left, right, bottom } = holder(params, container);

  const ground = bottom[1] - baseHeight;
  const backCorner: Pair = [bottom[0] + baseDepth, ground];
  const frontCorner: Pair = [left[0], ground];
  const underBottom: Pair = [bottom[0], ground];

  let shape = union([
    ...rings,
    // back triangle
    [bottom, right, backCorner, underBottom],
    // front triangle, with a vertical wall from the lip down to the table
    [left, bottom, underBottom, frontCorner],
  ]);
  shape = smoothCorner(shape, right, rounding);
  shape = smoothCorner(shape, backCorner, rounding);
  shape = smoothCorner(shape, frontCorner, rounding);

  return { shape, seat };
};

const triangle: Design<typeof config> = {
  name: "Triangle",
  description: "Two hollow triangles. Sturdy, low profile.",
  config,
  path,
};

export default triangle;
