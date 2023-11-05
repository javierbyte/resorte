import type {
  ConfigType,
  FunctionPathType,
} from "@/components/designs/resorte";

import triangle from "@/components/designs/triangle";
import stand from "@/components/designs/stand";

export const designs = {
  Triangle: triangle,
  Stand: stand,
} as const satisfies { [key: string]: Design };

type Design = {
  config: ConfigType;
  path: FunctionPathType<any>;
};
