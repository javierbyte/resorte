import type { Container } from "@/components/designs/types";

export type Dimension = "thickness" | "width" | "height";

const VIEW_W = 168;
const VIEW_H = 112;
const FACE_MAX = 80;
const SLANT = Math.PI / 6;

// Fallback proportions (a phone in portrait) when width or height are unknown.
const FALLBACK = { width: 72, height: 148 };

// Oblique sketch of the container, drawn to proportion. Unknown dimensions
// are dashed and the dimension being edited is highlighted.
export function ContainerDiagram({
  container,
  focus,
}: {
  container: Container;
  focus: Dimension | null;
}) {
  const w = container.width ?? FALLBACK.width;
  const h = container.height ?? FALLBACK.height;
  const s = FACE_MAX / Math.max(w, h);

  const fw = w * s;
  const fh = h * s;
  const d = Math.min(Math.max(container.thickness * s, 4), 28);
  const dx = d * Math.cos(SLANT);
  const dy = d * Math.sin(SLANT);

  const x0 = (VIEW_W - fw - dx) / 2;
  const y0 = VIEW_H - (VIEW_H - fh - dy) / 2;

  const A = [x0, y0];
  const B = [x0 + fw, y0];
  const C = [x0 + fw, y0 - fh];
  const D = [x0, y0 - fh];
  const B2 = [B[0] + dx, B[1] - dy];
  const C2 = [C[0] + dx, C[1] - dy];
  const D2 = [D[0] + dx, D[1] - dy];

  const line = (...points: number[][]) =>
    "M" + points.map((p) => p.join(" ")).join("L");

  const edge = (dimension: Dimension, known: boolean) => ({
    stroke: focus === dimension ? "var(--fg)" : "var(--muted)",
    strokeWidth: focus === dimension ? 1.5 : 1,
    strokeDasharray: known ? undefined : "3 3",
  });

  const label = (dimension: Dimension) => ({
    fill: focus === dimension ? "var(--fg)" : "var(--muted)",
    fontSize: 10,
    fontFamily: "var(--font-mono)",
  });

  const hasWidth = container.width != null;
  const hasHeight = container.height != null;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      width="100%"
      fill="none"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={line(A, B)} {...edge("width", hasWidth)} />
      <path d={line(D, C)} {...edge("width", hasWidth)} />
      <path d={line(D2, C2)} {...edge("width", hasWidth)} />
      <path d={line(A, D)} {...edge("height", hasHeight)} />
      <path d={line(B, C)} {...edge("height", hasHeight)} />
      <path d={line(B2, C2)} {...edge("height", hasHeight)} />
      <path d={line(B, B2)} {...edge("thickness", true)} />
      <path d={line(C, C2)} {...edge("thickness", true)} />
      <path d={line(D, D2)} {...edge("thickness", true)} />

      <text x={(A[0] + B[0]) / 2} y={A[1] + 12} textAnchor="middle" {...label("width")}>
        W
      </text>
      <text x={A[0] - 8} y={(A[1] + D[1]) / 2} textAnchor="end" dominantBaseline="middle" {...label("height")}>
        H
      </text>
      <text x={(B[0] + B2[0]) / 2 + 8} y={(B[1] + B2[1]) / 2 + 6} {...label("thickness")}>
        T
      </text>
    </svg>
  );
}
