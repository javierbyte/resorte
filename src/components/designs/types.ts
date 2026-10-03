import type { MultiPolygon, Pair } from "polygon-clipping";

// What the stand holds. Width and height are optional and unlock the autos
// and the balance check.
export type Container = {
  thickness: number;
  width: number | null;
  height: number | null;
};

export type Control = {
  key: string;
  label: string;
  // Can depend on other params, like the nozzle.
  min: number | ((params: Record<string, number>) => number);
  max: number;
  step?: number;
  suffix?: string;
  default: number;
  advanced?: boolean;
  // A printer setting, shown with the export.
  print?: boolean;
  // Keeps its value when switching styles.
  shared?: boolean;
  // Null means auto isn't available, so `default` is used.
  auto?: (container: Container, params: Record<string, number>) => number | null;
  hint?: string;
};

export type ConfigType = readonly Control[];

// Where the container rests: `origin` is its bottom-back corner and `angle`
// (degrees) the direction its height runs. Thickness runs 90° counter-clockwise.
export type Seat = {
  origin: Pair;
  angle: number;
};

export type DesignOutput = {
  shape: MultiPolygon;
  seat: Seat;
};

export type Params<C extends ConfigType> = {
  [key in C[number]["key"]]: number;
};

export type PathFunction<C extends ConfigType> = (
  params: Params<C>,
  container: Container
) => DesignOutput;

export type Design<C extends ConfigType = ConfigType> = {
  name: string;
  description: string;
  config: C;
  path: PathFunction<C>;
};
