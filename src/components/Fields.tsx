"use client";

import { useId, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import styles from "./Fields.module.css";

function parse(text: string) {
  const n = parseFloat(text.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function NumberInput({
  id,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  optional = false,
  disabled = false,
  onFocus,
  onBlur,
}: {
  id?: string;
  value: number | null;
  onChange: (value: number | null) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  optional?: boolean;
  disabled?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
}) {
  // Keep the raw text while typing so "8." or an empty field don't get rewritten.
  const [draft, setDraft] = useState<string | null>(null);
  // Auto values can be long decimals, show at most two.
  const text = draft ?? (value == null ? "" : String(+value.toFixed(2)));

  const parsed = parse(text);
  const empty = text.trim() === "";
  const invalid = empty
    ? !optional
    : parsed == null || parsed < min || parsed > max;

  return (
    <div
      className={styles.input}
      data-invalid={invalid || undefined}
      data-disabled={disabled || undefined}
    >
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        placeholder={optional ? "—" : undefined}
        disabled={disabled}
        value={text}
        onFocus={onFocus}
        onChange={(event) => {
          const next = event.target.value;
          setDraft(next);
          const n = parse(next);
          if (next.trim() === "" && optional) onChange(null);
          else if (n != null && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => {
          setDraft(null);
          onBlur?.();
        }}
      />
      {suffix && <span>{suffix}</span>}
    </div>
  );
}

export function NumberField({
  label,
  hint,
  tag,
  ...props
}: {
  label: string;
  hint?: string;
  tag?: string;
} & Omit<React.ComponentProps<typeof NumberInput>, "id">) {
  const id = useId();
  return (
    <div className={styles.field}>
      <div className={styles.row}>
        <label htmlFor={id} className={styles.label}>
          {label}
          {tag && <span className={styles.tag}>{tag}</span>}
        </label>
        <NumberInput id={id} {...props} />
      </div>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export function SliderField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
  auto,
  onAutoChange,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  // Only set when auto is available. While on, the value comes from the
  // container and can't be edited.
  auto?: boolean;
  onAutoChange?: (auto: boolean) => void;
}) {
  const id = useId();
  const locked = auto === true;
  return (
    <div className={styles.field}>
      <div className={styles.row}>
        <div className={styles.label}>
          <label htmlFor={id}>{label}</label>
          {auto != null && (
            <button
              type="button"
              className={styles.toggle}
              aria-pressed={auto}
              aria-label={`Auto ${label.toLowerCase()}`}
              onClick={() => onAutoChange?.(!auto)}
              title={auto ? "Set by hand" : "Size automatically"}
            >
              Auto
            </button>
          )}
        </div>
        <NumberInput
          id={id}
          value={value}
          onChange={(n) => n != null && onChange(n)}
          min={min}
          max={max}
          step={step}
          suffix={suffix}
          disabled={locked}
        />
      </div>
      <SliderPrimitive.Root
        className={styles.slider}
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={locked}
        onValueChange={([n]) => onChange(n)}
      >
        <SliderPrimitive.Track className={styles.track}>
          <SliderPrimitive.Range className={styles.range} />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb className={styles.thumb} aria-label={label} />
      </SliderPrimitive.Root>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}
