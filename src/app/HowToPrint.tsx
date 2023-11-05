import styles from "./HowToPrint.module.css";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function HowToPrint() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline">How to print?</Button>
      </SheetTrigger>
      <SheetContent className={styles.sheet}>
        <SheetHeader>
          <SheetTitle>How to print.</SheetTitle>
          <SheetDescription>
            1. Download the STL and drop it in your slicer.
          </SheetDescription>
          <SheetDescription>
            2. <strong>Verify the print size</strong>. Make sure the height in
            your slicer matches the extrusion width you set, this value is also
            saved in the file name.
          </SheetDescription>
          <SheetDescription>
            3. Configure your slicer to print in Vase Mode. In PrusaSlicer this
            is called Spiral Vase. You can activate in Print Settings → Layers
            and perimeters → Spiral vase.
          </SheetDescription>
          <SheetTitle>Recommended settings</SheetTitle>
          <SheetDescription>
            I think 0.8mm provides strong enough walls, I would recommend this
            or 0.9mm if you have a 0.6mm nozzle, otherwise it is probably best
            to use 1.5x your nozzle size.
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
