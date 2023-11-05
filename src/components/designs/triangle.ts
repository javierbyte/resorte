import type { FunctionPathType } from "@/components/designs/resorte";
import { CreatePoligono, polar2cartesian } from "@/components/poligono";

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
    advanced: false,
  },
  {
    key: "holderDepth",
    label: "Holder Depth",
    min: 0,
    max: 60,
    suffix: "mm",
    default: 9,
    advanced: false,
  },
  {
    key: "holderHeight",
    label: "Holder Height",
    min: 10,
    max: 180,
    suffix: "mm",
    default: 50,
    advanced: false,
  },
  {
    key: "baseDepth",
    label: "Base Depth",
    min: 0,
    max: 200,
    suffix: "mm",
    default: 100,
    advanced: false,
  },
  {
    key: "clipLenght",
    label: "Clip Length",
    min: 0,
    max: 60,
    suffix: "mm",
    default: 3.5,
    step: 0.5,
    advanced: true,
  },
  {
    key: "clipThickness",
    label: "Clip Thickness",
    min: 1.8,
    max: 10,
    step: 0.1,
    suffix: "mm",
    default: 1.8,
    advanced: true,
  },

  {
    key: "towerHeight",
    label: "Tower Height",
    min: 0,
    max: 200,
    step: 1,
    suffix: "mm",
    default: 10,
    advanced: true,
  },
  {
    key: "towerInset",
    label: "Tower Inset",
    min: 0,
    max: 200,
    step: 1,
    suffix: "mm",
    default: 0,
    advanced: true,
  },
  {
    key: "printExtrusionWidth",
    label: "Print Extrusion Width",
    min: 0.6,
    max: 2,
    step: 0.05,
    suffix: "mm",
    default: 0.87,
    advanced: true,
  },
] as const;

const path: FunctionPathType<typeof config> = function (params) {
  const {
    holderHeight,
    holderDepth,
    angle,
    clipLenght,
    clipThickness,
    baseDepth,
    towerHeight,
    towerInset,
    printExtrusionWidth,
  } = params;

  // device
  const poligono = CreatePoligono();

  // back of the device
  // devicePolygon.pushSquare([holderHeight, clipThickness]);
  poligono.pushRing([
    [holderHeight, clipThickness],
    [0, 0],
    [0, clipThickness],
  ]);

  // base of the device
  poligono.pushSquare(
    [clipThickness, holderDepth + clipThickness + printExtrusionWidth / 2],
    [0, 0]
  );

  // front clip
  poligono.pushRing([
    [0, holderDepth + clipThickness + printExtrusionWidth * 2],
    [
      clipThickness + clipLenght,
      holderDepth + clipThickness + printExtrusionWidth,
    ],
    [clipThickness + clipLenght, holderDepth + clipThickness],
    [0, holderDepth + clipThickness],
  ]);

  // ROTATE
  poligono.rotate(angle);

  // BASE
  const rightPoint = poligono.getMinMax().rightPoint;
  const bottomPoint = poligono.getMinMax().bottomPoint;

  // devicePolygon.pushRing([
  //   bottomPoint,
  //   rightPoint,
  //   [bottomPoint[0] + baseDepth, bottomPoint[1]],
  //   bottomPoint,
  // ]);

  const insetChin = polar2cartesian({
    distance: towerInset,
    angle: (angle / 360) * Math.PI * 2,
  });

  const pointInsetChin: [number, number] = [
    bottomPoint[0] + insetChin.x,
    bottomPoint[1] + insetChin.y,
  ];

  poligono.pushRing([
    bottomPoint,
    rightPoint,
    // [bottomPoint[0] + baseDepth, bottomPoint[1] - towerHeight + printExtrusionWidth],
    [bottomPoint[0] + baseDepth, bottomPoint[1] - towerHeight],
    [pointInsetChin[0], bottomPoint[1] - towerHeight],
    pointInsetChin,
    bottomPoint,
  ]);

  // // LEFT SIDE
  // const leftPoint = devicePolygon.getMinMax().leftPoint;
  // devicePolygon.pushRing([
  //   bottomPoint,
  //   [leftPoint[0] + 0, leftPoint[1] + 0.0001],
  //   [(leftPoint[0] + bottomPoint[0]) / 2, bottomPoint[1]],
  //   bottomPoint,
  // ]);

  return poligono.getUnion();
};

export default {
  config,
  path,
};
