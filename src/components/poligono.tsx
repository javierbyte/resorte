"use client";

import polygonClipping from "polygon-clipping";

import type { Pair, Ring, MultiPolygon } from "polygon-clipping";

export function polar2cartesian({
  distance,
  angle,
}: {
  distance: number;
  angle: number;
}) {
  return {
    x: distance * Math.cos(angle),
    y: distance * Math.sin(angle),
  };
}

export function cartesian2polar({ x, y }: { x: number; y: number }) {
  return {
    distance: Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)),
    angle: Math.atan2(y, x),
  };
}

function round(n: number): number {
  const precision = 16384;
  return Math.round(n * precision) / precision;
}

const hackTotalOffset = 10000;

export function CreatePoligono(initialPolygon?: MultiPolygon) {
  let polygon: MultiPolygon = initialPolygon || [];
  let currentRing: Ring = [];

  return {
    start(x: number, y: number) {
      if (currentRing.length > 0) {
        throw new Error("Cannot start a new polygon without ending the last");
      }
      currentRing = [[x + hackTotalOffset, y + hackTotalOffset]];
    },
    line(x: number, y: number) {
      currentRing.push([x + hackTotalOffset, y + hackTotalOffset]);
    },
    pushRing(ring: Ring, translation: Pair = [0, 0]) {
      if (
        ring[0][0] !== ring[ring.length - 1][0] ||
        ring[0][1] !== ring[ring.length - 1][1]
      ) {
        ring.push(ring[0]);
      }

      const translatedRing = ring.map((pair) => {
        return [pair[0] + translation[0], pair[1] + translation[1]];
      }) as Ring;

      polygon.push([translatedRing]);
    },
    rotate(angle: number, origin: Pair = [0, 0]) {
      polygon = polygon.map((polygon) =>
        polygon.map((ring) => {
          return ring.map((pair) => {
            const { distance, angle: angle2 } = cartesian2polar({
              x: pair[0] - origin[0],
              y: pair[1] - origin[1],
            });
            const { x, y } = polar2cartesian({
              distance,
              angle: angle2 + (angle / 360) * Math.PI * 2,
            });

            return [round(x + origin[0]), round(y + origin[1])];
          });
        })
      );
    },
    close() {
      currentRing.push(currentRing[0]);
      polygon.push([currentRing]);

      currentRing = [];
    },

    pushTriangle([pointA, pointB, pointC]: [Pair, Pair, Pair]) {
      const triangleRing: Ring = [pointA, pointB, pointC, pointA];

      polygon.push([triangleRing]);
    },

    pushSquare([width, height]: Pair, translation: Pair = [0, 0]) {
      const squareRing: Ring = [
        [translation[0], translation[1]],
        [translation[0] + width, translation[1]],
        [translation[0] + width, translation[1] + height],
        [translation[0], translation[1] + height],
        [translation[0], translation[1]],
      ];

      polygon.push([squareRing]);
    },
    get(): MultiPolygon {
      return polygon.map((polygon) =>
        polygon.map((ring) => {
          return ring.map((pair) => {
            return [pair[0], pair[1]];
          });
        })
      );
    },
    getUnion(): MultiPolygon {
      const layersCopy = this.get();
      return polygonClipping.union(layersCopy);
    },
    getMinMax() {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      let topPoint: Pair = [0, -Infinity];
      let bottomPoint: Pair = [0, Infinity];
      let leftPoint: Pair = [Infinity, 0];
      let rightPoint: Pair = [-Infinity, 0];

      const unionPolygon = this.getUnion();

      // first we find min, max to offset
      for (const polygon of unionPolygon) {
        for (const ring of polygon) {
          for (const pair of ring) {
            minX = Math.min(minX, pair[0]);
            minY = Math.min(minY, pair[1]);
            maxX = Math.max(maxX, pair[0]);
            maxY = Math.max(maxY, pair[1]);

            if (pair[1] > topPoint[1]) {
              topPoint = pair;
            }
            if (pair[1] < bottomPoint[1]) {
              bottomPoint = pair;
            }
            if (pair[0] < leftPoint[0]) {
              leftPoint = pair;
            }
            if (pair[0] > rightPoint[0]) {
              rightPoint = pair;
            }
          }
        }
      }

      minX -= 1;
      minY -= 1;
      maxX += 1;
      maxY += 1;

      return {
        minX,
        minY,
        maxX,
        maxY,
        topPoint,
        bottomPoint,
        leftPoint,
        rightPoint,
      };
    },
    getPath({ union = true }: { union?: boolean } = {}) {
      let path = "";

      const { minX, minY, maxX, maxY } = this.getMinMax();

      const width = Math.ceil(maxX - minX);
      const height = Math.ceil(maxY - minY);

      const unionPolygon = union ? this.getUnion() : this.get();

      for (const polygon of unionPolygon) {
        for (const ring of polygon) {
          let firstOfRing = true;
          for (const pair of ring) {
            const x = pair[0] - minX;
            const y = pair[1] - minY;
            const invertedY = height - y;

            if (firstOfRing) {
              firstOfRing = false;

              path += `M${x} ${invertedY} `;
            } else {
              path += `L${x} ${invertedY} `;
            }
          }
        }
      }

      return {
        path,
        viewBox: `0 0 ${width} ${height}`,
        width,
        height,
      };
    },
  };
}
