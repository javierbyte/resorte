import type { FunctionPathType } from "@/components/designs/resorte";
import { CreatePoligono } from "@/components/poligono";

const config = [
  {
    key: "angle",
    label: "Angle",
    min: 0,
    max: 90,
    suffix: "°",
    default: 60,
    step: 1,
    advanced: false,
  },
  {
    key: "extrude",
    label: "Holder Width (Extrusion)",
    min: 10,
    max: 200,
    suffix: "mm",
    default: 60,
    step: 1,
    advanced: false,
  },
  {
    key: "pocketDepth",
    label: "Pocket Depth",
    min: 0,
    max: 60,
    suffix: "mm",
    default: 9,
    step: 1,
    advanced: false,
  },
  {
    key: "baseHeight",
    label: "Base Thickness",
    min: 2,
    max: 30,
    suffix: "mm",
    default: 2,
    step: 1,
    advanced: true,
  },
  {
    key: "baseDepth",
    label: "Base Length",
    min: 6,
    max: 180,
    suffix: "mm",
    default: 50,
    step: 1,
    advanced: false,
  },
  {
    key: "towerHeight",
    label: "Tower Height",
    min: 5,
    max: 220,
    suffix: "mm",
    default: 50,
    step: 1,
    advanced: false,
  },
  {
    key: "towerThickness",
    label: "Tower Thickness",
    min: 6,
    max: 30,
    suffix: "mm",
    default: 12,
    step: 1,
    advanced: false,
  },
  {
    key: "towerPosition",
    label: "Tower Position",
    min: 0,
    max: 100,
    suffix: "%",
    default: 50,
    step: 1,
    advanced: false,
  },
  {
    key: "deviceHolderHeight",
    label: "Pocket Back Height",
    min: 50,
    max: 180,
    suffix: "mm",
    default: 60,
    step: 1,
    advanced: true,
  },
  {
    key: "deviceHolderTongue",
    label: "Clip Length",
    min: 0,
    max: 60,
    suffix: "mm",
    default: 2,
    step: 1,
    advanced: true,
  },
  {
    key: "deviceHolderTongueThickness",
    label: "Clip Thickness",
    min: 1,
    max: 30,
    suffix: "mm",
    default: 2,
    step: 1,
    advanced: true,
  },
] as const;

const path: FunctionPathType<typeof config> = function (params) {
  const {
    deviceHolderHeight,
    baseHeight,
    baseDepth,
    pocketDepth,
    angle,
    towerHeight,
    towerThickness,
    deviceHolderTongue,
    deviceHolderTongueThickness,
    towerPosition,
  } = params;

  const poligono = CreatePoligono();

  // base
  poligono.pushSquare([baseDepth, baseHeight]);

  // tower

  const towerDistanceFromBaseDepth =
    (baseDepth - towerThickness) * (1 - towerPosition / 100);

  poligono.pushSquare(
    [towerThickness, towerHeight],
    [baseDepth - towerDistanceFromBaseDepth - towerThickness, 0]
  );

  const towerTop: [number, number] = [
    baseDepth - towerDistanceFromBaseDepth - towerThickness,
    towerHeight,
  ];

  // device
  const deviceBackThickness = towerThickness;
  const devicePolygon = CreatePoligono();
  const deviceHolderThhickness = towerThickness;

  // back of the device
  devicePolygon.pushSquare(
    [deviceHolderHeight, deviceHolderThhickness],
    [towerTop[0] - deviceHolderHeight / 2, towerTop[1] - deviceHolderThhickness]
  );

  // base of the device
  devicePolygon.pushSquare(
    [
      deviceHolderTongueThickness,
      pocketDepth + deviceHolderTongueThickness + deviceBackThickness,
    ],
    [towerTop[0] - deviceHolderHeight / 2, towerTop[1] - deviceBackThickness]
  );

  // front of the device
  devicePolygon.pushSquare(
    [
      deviceHolderTongueThickness + deviceHolderTongue,
      deviceHolderTongueThickness,
    ],
    [towerTop[0] - deviceHolderHeight / 2, towerTop[1] + pocketDepth]
  );

  devicePolygon.rotate(angle, [towerTop[0], towerTop[1]]);

  const finalPolygon = CreatePoligono();
  finalPolygon.pushRing(poligono.getUnion()[0][0]);
  finalPolygon.pushRing(devicePolygon.getUnion()[0][0]);

  return finalPolygon.getUnion();
};

export default {
  config,
  path,
};
