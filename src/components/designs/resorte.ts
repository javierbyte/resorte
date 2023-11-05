import type { MultiPolygon } from "polygon-clipping";

export type ConfigType = readonly {
  key: string;
  label: string;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  default: number;
  advanced: boolean;
}[];

export type FunctionPathType<ParamsType extends ConfigType> = (arg0: {
  [key in ParamsType[number]["key"]]: number;
}) => MultiPolygon;
