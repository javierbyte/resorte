import styles from "./FiberRender.module.css";

import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { STLExporter } from "three/addons/exporters/STLExporter.js";
import React, { useState, useEffect, useMemo, useRef } from "react";
import { Canvas } from "@react-three/fiber";

const SCALE = 1;
const CANVAS_SIZE = 1024;
const SMALL_BREAKPOINT = 1200;
const SHADOW_QUALITY = 256;

interface FiberProps {
  compiledVase: {
    path: string;
    viewBox: string;
    width: number;
    height: number;
  };
}

declare global {
  interface Window {
    exportStl: any;
  }
}

function useInnerWidth() {
  const [innerWidth, setInnerWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    const handleResize = () => {
      setInnerWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    setInnerWidth(window.innerWidth);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return innerWidth;
}

export function FiberRender({
  compiledVase,
  extrude,
}: FiberProps & { extrude: number }) {
  const { path, viewBox, width, height } = compiledVase;

  const innerWidth = useInnerWidth();

  const svg = `<svg viewBox="${viewBox}" width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><path d="${path}" stroke="white" strokeWidth="0.25" /></svg>`;

  const [shape, shapeSet] = useState<any>(null);
  const meshRef = useRef<any>(null);

  const exportStl = useMemo(() => {
    return (vaseName: string) => {
      const mesh = meshRef.current;
      if (!mesh) return;
      const exporter = new STLExporter();
      const options = { binary: true };
      const result = exporter.parse(mesh, options);

      const blob = new Blob([result], { type: "application/octet-stream" });
      const link = document.createElement("a");
      link.style.display = "none";
      document.body.appendChild(link);
      link.href = URL.createObjectURL(blob);

      link.download = `${vaseName}.stl`;
      link.click();
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    };
  }, []);

  useEffect(() => {
    window.exportStl = exportStl;
  }, [exportStl]);

  useEffect(() => {
    const svgResult = new SVGLoader().parse(svg);
    const svgShape = svgResult.paths[0].toShapes(true);
    shapeSet(svgShape);
  }, [path]);

  if (!innerWidth) return null;

  const cameraDistanceMultiplier = 5;
  const baseTranslationX = -50;

  return (
    <Canvas
      className={styles.canvas}
      style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
      shadows={true}
      dpr={[1, 2]}
      gl={{
        alpha: true,
        antialias: true,
        stencil: false,
        preserveDrawingBuffer: true,
      }}
      camera={{
        position: [
          -100 * cameraDistanceMultiplier,
          25 * cameraDistanceMultiplier,
          100 * cameraDistanceMultiplier,
        ],
        zoom: innerWidth < SMALL_BREAKPOINT ? 2 : 4,
      }}
    >
      <hemisphereLight intensity={0.75} />

      <directionalLight
        intensity={1}
        position={[50, 150, 200]}
        castShadow // highlight-line
        shadow-mapSize-height={SHADOW_QUALITY}
        shadow-mapSize-width={SHADOW_QUALITY}
      />

      <directionalLight
        intensity={4}
        position={[-50, 75, -50]}
        castShadow // highlight-line
        shadow-mapSize-height={SHADOW_QUALITY}
        shadow-mapSize-width={SHADOW_QUALITY}
      />

      <directionalLight
        intensity={1}
        position={[10, 75, 10]}
        castShadow // highlight-line
        shadow-mapSize-height={SHADOW_QUALITY}
        shadow-mapSize-width={SHADOW_QUALITY}
      />

      <directionalLight
        intensity={2}
        position={[-50, 5, 25]}
        castShadow // highlight-line
        shadow-mapSize-height={SHADOW_QUALITY}
        shadow-mapSize-width={SHADOW_QUALITY}
      />

      {shape && (
        <mesh
          ref={meshRef}
          castShadow
          receiveShadow
          // position={[-48 - extrude / 8, 16 + extrude / 16 + height / 3, 0]}
          position={[baseTranslationX, height / 2, -extrude / 2]}
          scale={[SCALE, -SCALE, SCALE]}
        >
          <extrudeGeometry
            attach="geometry"
            args={[
              shape,
              {
                depth: extrude,
                bevelOffset: 0,
                bevelSize: 0,
                bevelThickness: 0,
                curveSegments: 0,
                steps: 16,
              },
            ]}
          />
          <meshPhysicalMaterial
            attach="material"
            metalness={0.8}
            roughness={0.5}
            reflectivity={0.55}
            color={"#888"}
          />
        </mesh>
      )}
    </Canvas>
  );
}
