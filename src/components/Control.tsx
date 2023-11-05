import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface ControlProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  suffix?: string;
  step?: number;
}

export function Control({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  suffix = "",
  step = 1,
}: ControlProps): JSX.Element {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="maxlength">{label}</Label>
        <span className="w-12 rounded-md border border-transparent px-2 py-0.5 text-right text-sm text-muted-foreground hover:border-border">
          {value}
          {suffix}
        </span>
      </div>
      <Slider
        value={[value]}
        id="maxlength"
        max={max}
        min={min}
        step={step}
        onValueChange={(valArr) => {
          onChange(valArr[0]);
        }}
        className="[&_[role=slider]]:h-4 [&_[role=slider]]:w-4"
        aria-label="Maximum Length"
      />
    </div>
  );
}
