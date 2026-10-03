"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";

import { designs, type StyleKey } from "@/components/designs";
import type { Container } from "@/components/designs/types";
import {
  ContainerDiagram,
  type Dimension,
} from "@/components/ContainerDiagram";
import { NumberField, SliderField } from "@/components/Fields";
import { ProfileView } from "@/components/ProfileView";
import { StylePicker } from "@/components/StylePicker";
import { extrudeProfile, downloadStl } from "@/lib/geometry";
import { solidWall, vasePrint, type VasePrint } from "@/lib/vase";
import {
  analyze,
  formatMm,
  minOf,
  overrideSlot,
  resolveParams,
  type Analysis,
  type Balance,
  type Overrides,
} from "@/lib/model";

import styles from "./page.module.css";

const ModelView = dynamic(
  () => import("@/components/ModelView").then((m) => m.ModelView),
  { ssr: false }
);

const styleKeys = Object.keys(designs) as StyleKey[];

export default function Home() {
  // Defaults to an iPhone 18 Pro, in portrait.
  const [container, setContainer] = useState<Container>({
    thickness: 8.75,
    width: 71.9,
    height: 150,
  });
  const [focus, setFocus] = useState<Dimension | null>(null);
  const [style, setStyle] = useState<StyleKey>("triangle");
  const [overrides, setOverrides] = useState<Overrides>({});

  const design = designs[style];
  const params = resolveParams(style, design, container, overrides);

  // `params` is a new object every render; key the geometry on its contents.
  const paramsKey = JSON.stringify(params);
  const { shape, seat } = useMemo(
    () => design.path(JSON.parse(paramsKey), container),
    [design, paramsKey, container]
  );
  const analysis = analyze(shape, seat, container, params.back);

  // The STL stays the solid profile. This is what the slicer turns it into.
  const print = useMemo(
    () => vasePrint(shape, params.nozzle),
    [shape, params.nozzle]
  );
  const geometry = useMemo(
    () => extrudeProfile(print.walls, params.width),
    [print, params.width]
  );
  useEffect(() => () => geometry.dispose(), [geometry]);

  const download = () => {
    const solid = extrudeProfile(shape, params.width);
    downloadStl(solid, filename);
    solid.dispose();
  };

  const styleOptions = styleKeys.map((key) => ({
    key,
    name: designs[key].name,
    description: designs[key].description,
    shape: designs[key].path(
      resolveParams(key, designs[key], container, overrides),
      container
    ).shape,
  }));

  const setDimension = (key: Dimension, value: number | null) =>
    setContainer((prev) => ({ ...prev, [key]: value }));
  const focusProps = (key: Dimension) => ({
    onFocus: () => setFocus(key),
    onBlur: () => setFocus(null),
  });

  const filename = `resorte_${style}_thickness-${formatMm(
    container.thickness
  )}_width-${formatMm(params.width)}_angle-${params.angle}.stl`;

  const warnings = getWarnings(analysis, print, params.nozzle);

  const renderControl = (control: (typeof design.config)[number]) => {
    const slot = overrideSlot(style, control);
    const hasAuto = control.auto?.(container, params) != null;
    const setOverride = (value: number | null) =>
      setOverrides((prev) => {
        const next = { ...prev };
        if (value == null) delete next[slot];
        else next[slot] = value;
        return next;
      });
    return (
      <SliderField
        key={control.key}
        label={control.label}
        hint={control.hint}
        value={params[control.key]}
        min={minOf(control, params)}
        max={control.max}
        step={control.step}
        suffix={control.suffix}
        auto={hasAuto ? !(slot in overrides) : undefined}
        // Turning auto off keeps the current value as the starting point.
        onAutoChange={(on) => setOverride(on ? null : params[control.key])}
        onChange={setOverride}
      />
    );
  };

  return (
    <main className={styles.main}>
      <aside className={styles.sidebar}>
        <header className={styles.header}>
          <h1>Resorte</h1>
          <p>
            Phone, book and tablet stands sized to what they hold. Printed in
            vase mode.
          </p>
        </header>

        <section className={styles.section}>
          <h2>
            <span>01</span>Container
          </h2>
          <div className={styles.diagram}>
            <ContainerDiagram container={container} focus={focus} />
          </div>
          <div className={styles.fields}>
            <NumberField
              label="Thickness"
              value={container.thickness}
              onChange={(v) => v != null && setDimension("thickness", v)}
              {...focusProps("thickness")}
              min={0.5}
              max={100}
              step={0.1}
              suffix="mm"
            />
            <NumberField
              label="Width"
              tag="optional"
              value={container.width}
              onChange={(v) => setDimension("width", v)}
              {...focusProps("width")}
              min={1}
              max={1000}
              step={1}
              suffix="mm"
              optional
            />
            <NumberField
              label="Height"
              tag="optional"
              value={container.height}
              onChange={(v) => setDimension("height", v)}
              {...focusProps("height")}
              min={1}
              max={1000}
              step={1}
              suffix="mm"
              optional
            />
          </div>
        </section>

        <section className={styles.section}>
          <h2>
            <span>02</span>Style
          </h2>
          <StylePicker
            value={style}
            onChange={setStyle}
            options={styleOptions}
          />
          <div className={styles.fields}>
            {design.config
              .filter((c) => !c.advanced && !c.print)
              .map(renderControl)}
          </div>
          <details className={styles.details}>
            <summary>Advanced</summary>
            <div className={styles.fields}>
              {design.config
                .filter((c) => c.advanced && !c.print)
                .map(renderControl)}
            </div>
          </details>
        </section>

        <section className={styles.section}>
          <h2>
            <span>03</span>Export
          </h2>
          <div className={styles.fields}>
            {design.config.filter((c) => c.print).map(renderControl)}
          </div>
          {warnings.length > 0 && (
            <ul className={styles.warnings}>
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          )}
          <button type="button" className={styles.download} onClick={download}>
            Download STL
          </button>
          <p className={styles.filename}>{filename}</p>
          <details className={styles.details}>
            <summary>How to print</summary>
            <ol className={styles.notes}>
              <li>Drop the STL in your slicer.</li>
              <li>
                Check the print height is{" "}
                <strong>{formatMm(params.width)} mm</strong>. The stand width
                becomes the height in vase mode.
              </li>
              <li>
                Turn on vase mode. In PrusaSlicer: Print Settings → Layers and
                perimeters → Spiral vase.
              </li>
              <li>
                Set the extrusion width to{" "}
                <strong>{formatMm(params.nozzle)} mm</strong>. Lips and floors
                are drawn {formatMm(solidWall(params.nozzle))} mm thick so the
                path going out and back fuses into one solid wall.
              </li>
              <li>Removing the bottom layers leaves the hollow look.</li>
            </ol>
          </details>
        </section>

        <footer className={styles.footer}>
          <a href="https://github.com/javierbyte/resorte">Source</a>
          <span>·</span>
          <a href="https://javier.xyz">javierbyte</a>
        </footer>
      </aside>

      <section className={`${styles.panel} ${styles.profile}`}>
        <div className={styles.panelHeader}>
          <span>A</span>Profile
        </div>
        <div className={styles.panelBody}>
          <ProfileView
            shape={shape}
            walls={print.walls}
            seat={seat}
            analysis={analysis}
          />
        </div>
        <dl className={styles.titleBlock}>
          <div>
            <dt>Footprint</dt>
            <dd>
              {formatMm(analysis.bounds.maxX - analysis.bounds.minX)} ×{" "}
              {formatMm(params.width)} mm
            </dd>
          </div>
          <div>
            <dt>Perimeter</dt>
            <dd>{formatMm(analysis.perimeter)} mm</dd>
          </div>
          <div>
            <dt>Print height</dt>
            <dd>{formatMm(params.width)} mm</dd>
          </div>
          <div>
            <dt>Balance</dt>
            <dd>{balanceLabel(analysis.balance)}</dd>
          </div>
        </dl>
      </section>

      <section className={`${styles.panel} ${styles.model}`}>
        <div className={styles.panelHeader}>
          <span>B</span>Model
          <em>drag to orbit</em>
        </div>
        <div className={styles.panelBody}>
          <ModelView
            geometry={geometry}
            depth={params.width}
            analysis={analysis}
            container={container}
            seat={seat}
          />
        </div>
      </section>
    </main>
  );
}

function getWarnings(analysis: Analysis, print: VasePrint, nozzle: number) {
  const { parts, holes, balance } = analysis;
  const line = `${formatMm(nozzle)} mm`;
  const warnings: string[] = [];

  if (parts > 1) {
    warnings.push(
      `The profile is split into ${parts} pieces. Vase mode needs a single outline.`
    );
  }
  if (holes > 0) {
    warnings.push("The profile has holes. Vase mode only prints the outer wall.");
  }
  if (print.loops > parts) {
    warnings.push(
      `A neck thinner than one line (${line}) splits the vase path into ${print.loops} loops.`
    );
  }
  if (print.loops < parts) {
    warnings.push(
      `Some pieces are thinner than one line (${line}) and won't print.`
    );
  }
  if (balance?.status === "tips-forward") {
    warnings.push(
      `Likely to tip forward: the container's center of mass is ${formatMm(-balance.margin)} mm in front of the base. Lower the angle or extend the base.`
    );
  }
  if (balance?.status === "tips-back") {
    warnings.push(
      `Likely to tip backwards: the container's center of mass is ${formatMm(-balance.margin)} mm behind the base. Raise the angle or extend the base.`
    );
  }
  return warnings;
}

function balanceLabel(balance: Balance | null) {
  if (!balance) return "needs height";
  if (balance.status === "stable") return `stable +${formatMm(balance.margin)}`;
  return balance.status === "tips-forward" ? "tips forward" : "tips back";
}
