import type { Pair } from "polygon-clipping";

import type {
  Container,
  Design,
  PathFunction,
  Seat,
} from "@/components/designs/types";
import {
  angleControl,
  autoBack,
  containerBackX,
  nozzleControl,
  rect,
  rotatePoint,
  rotateRings,
  sectorRing,
  toRadians,
  toleranceControl,
  union,
  widthControl,
} from "@/components/designs/shared";
import { solidWall } from "@/lib/vase";

const config = [
  angleControl,
  widthControl,
  {
    key: "baseHeight",
    label: "Base height",
    min: minBaseHeight,
    max: 220,
    step: 1,
    suffix: "mm",
    default: 50,
    hint: "Height of the tower holding the pocket.",
  },
  {
    key: "baseDepth",
    label: "Base depth",
    min: 6,
    max: 180,
    step: 1,
    suffix: "mm",
    default: 50,
    auto: autoBaseDepth,
    hint: "Auto reaches back as far as the container.",
  },
  {
    key: "back",
    label: "Back height",
    min: 10,
    max: 180,
    step: 1,
    suffix: "mm",
    default: 60,
    auto: autoBack,
  },
  {
    key: "towerThickness",
    label: "Tower thickness",
    min: 6,
    max: 30,
    step: 1,
    suffix: "mm",
    default: 12,
    advanced: true,
  },
  {
    key: "towerPosition",
    label: "Tower position",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    default: 50,
    advanced: true,
  },
  {
    key: "plate",
    label: "Base thickness",
    min: (params: Record<string, number>) => solidWall(params.nozzle),
    max: 30,
    step: 0.1,
    suffix: "mm",
    default: 2,
    auto: (_: Container, params: Record<string, number>) =>
      solidWall(params.nozzle),
    advanced: true,
    hint: "Auto is two lines, printed solid. Thicker prints hollow.",
  },
  {
    key: "lip",
    label: "Lip height",
    min: 0,
    max: 60,
    step: 0.5,
    suffix: "mm",
    default: 2,
    hint: "How far the front lip rises above the pocket floor.",
  },
  toleranceControl,
  nozzleControl,
] as const;

// The holder rotates about the top of the tower, so its front swings down.
// Its lowest point is the front-bottom corner of the back.
function holderDrop(params: Record<string, number>) {
  const { back, angle, towerThickness } = params;
  const rad = toRadians(angle);
  return (back / 2) * Math.sin(rad) + towerThickness * Math.cos(rad);
}

// Keeps the holder one solid wall clear of the base plate, so the two never
// merge into a shape the vase path can't print cleanly.
function minBaseHeight(params: Record<string, number>) {
  const { plate, nozzle } = params;
  return Math.ceil(plate + solidWall(nozzle) + holderDrop(params));
}

function seatOnTower(towerTop: Pair, params: Record<string, number>): Seat {
  const { back, angle, nozzle } = params;
  const wall = solidWall(nozzle);
  return {
    origin: rotatePoint(
      [towerTop[0] - back / 2 + wall, towerTop[1]],
      angle,
      towerTop
    ),
    angle,
  };
}

// Puts the back of the plate under the back of the container. The tower moves
// as the plate grows: depth = p * (depth - towerThickness) + reach.
function autoBaseDepth(container: Container, params: Record<string, number>) {
  const { baseHeight, towerThickness, towerPosition } = params;
  const p = towerPosition / 100;
  if (!container.height || p >= 1) return null;

  const seat = seatOnTower([0, baseHeight], params);
  const reach = containerBackX(seat, container)!;
  return (reach - p * towerThickness) / (1 - p);
}

const path: PathFunction<typeof config> = function (params, container) {
  const {
    back,
    plate,
    baseDepth,
    angle,
    baseHeight,
    towerThickness,
    lip,
    nozzle,
    towerPosition,
    tolerance,
  } = params;

  // The pocket floor and the lip are solid fins, exactly two lines.
  const wall = solidWall(nozzle);
  const pocket = container.thickness + tolerance;

  const towerX = (baseDepth - towerThickness) * (towerPosition / 100);
  const towerTop: Pair = [towerX, baseHeight];
  const backX = towerX - back / 2;
  const bend: Pair = [backX + wall, baseHeight + pocket];

  const holder = rotateRings(
    [
      // back
      rect([back, towerThickness], [backX, baseHeight - towerThickness]),
      // floor
      rect([wall, pocket + towerThickness], [backX, baseHeight - towerThickness]),
      ...(lip > 0 ? [rect([lip, wall], bend)] : []),
      // Rounded bend, so it stays one solid wall thick.
      sectorRing(bend, wall, 90, 180),
    ],
    angle,
    towerTop
  );

  return {
    shape: union([
      rect([baseDepth, plate]),
      rect([towerThickness, baseHeight], [towerX, 0]),
      ...holder,
    ]),
    seat: seatOnTower(towerTop, params),
  };
};

const stand: Design<typeof config> = {
  name: "Stand",
  description: "Pocket on a tower. Light, open look.",
  config,
  path,
};

export default stand;
