import type { Design } from "@/components/designs/types";

import triangle from "@/components/designs/triangle";
import stand from "@/components/designs/stand";

export const designs = {
  triangle: triangle as Design,
  stand: stand as Design,
} as const;

export type StyleKey = keyof typeof designs;
