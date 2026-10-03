"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { toRadians } from "@/components/designs/shared";
import type { Container, Seat } from "@/components/designs/types";
import { snapScale, type Analysis } from "@/lib/model";

import styles from "./View.module.css";

const MIN_EXTENT = 160;
const CAMERA_DIRECTION = new THREE.Vector3(-1, 0.6, 1).normalize();
const CAMERA_DISTANCE = 1000;

function Rig({ extent }: { extent: number }) {
  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const size = useThree((state) => state.size);

  const zoom = snapScale(Math.min(size.width, size.height) / (extent * 1.5));

  useEffect(() => {
    const controls = new OrbitControls(camera, gl.domElement);
    controls.enablePan = false;
    controls.minZoom = 0.2;
    controls.maxZoom = 40;
    return () => controls.dispose();
  }, [camera, gl]);

  useEffect(() => {
    camera.position.copy(CAMERA_DIRECTION).multiplyScalar(CAMERA_DISTANCE);
    camera.lookAt(0, 0, 0);
    camera.zoom = zoom;
    camera.updateProjectionMatrix();
  }, [camera, zoom]);

  return null;
}

function Edges({
  geometry,
  color,
  opacity = 1,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  opacity?: number;
}) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 20), [geometry]);
  useEffect(() => () => edges.dispose(), [edges]);

  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    </lineSegments>
  );
}

function ContainerGhost({
  container,
  seat,
  depth,
}: {
  container: Container;
  seat: Seat;
  depth: number;
}) {
  const height = container.height ?? 0;
  const width = container.width ?? depth;

  const box = useMemo(
    () => new THREE.BoxGeometry(height, container.thickness, width),
    [height, container.thickness, width]
  );
  useEffect(() => () => box.dispose(), [box]);

  return (
    <group
      position={[seat.origin[0], seat.origin[1], 0]}
      rotation={[0, 0, toRadians(seat.angle)]}
    >
      <group position={[height / 2, container.thickness / 2, depth / 2]}>
        <mesh geometry={box}>
          <meshBasicMaterial
            color="#fff"
            transparent
            opacity={0.04}
            depthWrite={false}
          />
        </mesh>
        <Edges geometry={box} color="#fff" opacity={0.45} />
      </group>
    </group>
  );
}

export function ModelView({
  geometry,
  depth,
  analysis,
  container,
  seat,
}: {
  geometry: THREE.BufferGeometry;
  depth: number;
  analysis: Analysis;
  container: Container;
  seat: Seat;
}) {
  const { bounds, frame } = analysis;
  const showGhost = container.height != null;
  const view = showGhost ? frame : bounds;

  const center: [number, number, number] = [
    (view.minX + view.maxX) / 2,
    (view.minY + view.maxY) / 2,
    depth / 2,
  ];
  const extent = Math.max(
    Math.hypot(view.maxX - view.minX, view.maxY - view.minY, depth),
    MIN_EXTENT
  );

  return (
    <div className={styles.canvas}>
      <Canvas
        orthographic
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
        camera={{ near: 1, far: CAMERA_DISTANCE * 4 }}
      >
        <Rig extent={extent} />

        <ambientLight intensity={0.55} />
        <directionalLight intensity={2.2} position={[-60, 120, 80]} />
        <directionalLight intensity={0.5} position={[100, 20, -60]} />

        <group position={[-center[0], -center[1], -center[2]]}>
          <mesh geometry={geometry}>
            <meshStandardMaterial
              color="#d4d4d4"
              roughness={1}
              metalness={0}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          </mesh>
          <Edges geometry={geometry} color="#000" />

          {showGhost && (
            <ContainerGhost container={container} seat={seat} depth={depth} />
          )}

          <gridHelper
            args={[400, 40, "#333", "#1c1c1c"]}
            position={[center[0], bounds.minY - 0.01, center[2]]}
          />
        </group>
      </Canvas>
    </div>
  );
}
