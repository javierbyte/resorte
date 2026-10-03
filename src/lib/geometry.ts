import * as THREE from "three";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import type { MultiPolygon, Ring } from "polygon-clipping";

function ringToPoints(ring: Ring) {
  // polygon-clipping closes rings by repeating the first point.
  return ring.slice(0, -1).map(([x, y]) => new THREE.Vector2(x, y));
}

// The profile lies flat on the bed and the stand width becomes the print height.
export function extrudeProfile(shape: MultiPolygon, depth: number) {
  const shapes = shape.map(([outer, ...holes]) => {
    const threeShape = new THREE.Shape(ringToPoints(outer));
    threeShape.holes = holes.map((hole) => new THREE.Path(ringToPoints(hole)));
    return threeShape;
  });

  return new THREE.ExtrudeGeometry(shapes, {
    depth,
    bevelEnabled: false,
    steps: 1,
  });
}

export function downloadStl(geometry: THREE.BufferGeometry, filename: string) {
  const data = new STLExporter().parse(new THREE.Mesh(geometry), {
    binary: true,
  });

  const blob = new Blob([data], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
