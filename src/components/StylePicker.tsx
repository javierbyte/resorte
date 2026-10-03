import type { MultiPolygon } from "polygon-clipping";

import type { StyleKey } from "@/components/designs";
import { roundMm, shapeToPath } from "@/components/ProfileView";

import styles from "./StylePicker.module.css";

function Thumb({ shape }: { shape: MultiPolygon }) {
  const points = shape.flat(2);
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const minX = Math.min(...xs);
  const maxY = Math.max(...ys);
  const w = Math.max(...xs) - minX;
  const h = maxY - Math.min(...ys);
  const pad = Math.max(w, h) * 0.08;

  return (
    <svg
      viewBox={[minX - pad, -maxY - pad, w + pad * 2, h + pad * 2]
        .map(roundMm)
        .join(" ")}
      preserveAspectRatio="xMidYMax meet"
      aria-hidden
    >
      <path
        d={shapeToPath(shape)}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.25}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function StylePicker({
  value,
  onChange,
  options,
}: {
  value: StyleKey;
  onChange: (value: StyleKey) => void;
  options: { key: StyleKey; name: string; description: string; shape: MultiPolygon }[];
}) {
  return (
    <div className={styles.picker} role="radiogroup" aria-label="Style">
      {options.map((option) => (
        <button
          key={option.key}
          type="button"
          role="radio"
          aria-checked={option.key === value}
          className={styles.option}
          onClick={() => onChange(option.key)}
        >
          <div className={styles.thumb}>
            <Thumb shape={option.shape} />
          </div>
          <span className={styles.name}>{option.name}</span>
          <span className={styles.description}>{option.description}</span>
        </button>
      ))}
    </div>
  );
}
