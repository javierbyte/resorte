"use client";

import styles from "./page.module.css";

import { useEffect, useState } from "react";

import { CreatePoligono } from "@/components/poligono";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import { Control } from "@/components/Control";

import { SvgRender } from "@/components/SvgRender";
import { FiberRender } from "@/components/FiberRender";
import { HowToPrint } from "./HowToPrint";

import { designs } from "@/components/designs";

import type { ConfigType } from "@/components/designs/resorte";

function useVaseState<ParamsType extends ConfigType>(
  model: string,
  config: ParamsType
): {
  value: {
    [key in ParamsType[number]["key"]]: number;
  };
  onChange: (key: ParamsType[number]["key"], value: number) => void;
} {
  const defaultValues = config.reduce((acc, curr) => {
    // @ts-ignore
    acc[curr.key] = curr.default;
    return acc;
  }, {}) as {
    [key in ParamsType[number]["key"]]: number;
  };

  const [stateModel, setStateModel] = useState(model);
  const [state, setValue] = useState(defaultValues);

  function onChange(key: ParamsType[number]["key"], value: number) {
    setValue((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  useEffect(() => {
    const defaultValues = config.reduce((acc, curr) => {
      // @ts-ignore
      acc[curr.key] = curr.default;
      return acc;
    }, {}) as {
      [key in ParamsType[number]["key"]]: number;
    };

    setValue(defaultValues);
    setStateModel(model);
  }, [model, config]);

  const isSameModel = stateModel === model;
  const responseState = isSameModel ? state : defaultValues;

  return {
    value: responseState,
    onChange,
  };
}

export default function Home() {
  const designKeys = Object.keys(designs) as (keyof typeof designs)[];

  const [model, setModel] = useState<keyof typeof designs>(designKeys[0]);

  const currentDesign = designs[model];

  const configState = useVaseState<typeof currentDesign.config>(
    model,
    currentDesign.config
  );

  const renderedPolygon = currentDesign.path(configState.value);

  const compiledVase = CreatePoligono(renderedPolygon).getPath();

  return (
    <main className={styles.main}>
      <div className={styles.cardContainer}>
        <Card className={styles.card}>
          <CardHeader>
            <CardTitle>Resorte</CardTitle>
            <CardDescription>
              Custom size phone / book stand generator to 3D print in vase mode.
            </CardDescription>

            <div className={styles.selectContainer}>
              <Select
                value={model}
                onValueChange={(value) => {
                  setModel(value as keyof typeof designs);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Model" />
                </SelectTrigger>
                <SelectContent>
                  {designKeys.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <p>Settings</p>

            <div className="grid gap-4 pt-2">
              {currentDesign.config
                .filter((value) => !value.advanced)
                .map((configLine) => {
                  const currentValue = configState.value[configLine.key];

                  return (
                    <Control
                      value={currentValue}
                      onChange={(value) =>
                        configState.onChange(configLine.key, value)
                      }
                      {...configLine}
                      key={configLine.key}
                    />
                  );
                })}

              <Accordion type="single" collapsible>
                <AccordionItem value="item-1">
                  <AccordionTrigger>Advanced Settings</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-4 pt-2">
                      {currentDesign.config
                        .filter((value) => value.advanced)
                        .map((configLine) => {
                          const currentValue =
                            configState.value[configLine.key];

                          return (
                            <Control
                              value={currentValue}
                              onChange={(value) =>
                                configState.onChange(configLine.key, value)
                              }
                              {...configLine}
                              key={configLine.key}
                            />
                          );
                        })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                onClick={() => {
                  if (window) {
                    let vaseName = "";
                    for (const [key, value] of Object.entries(
                      configState.value
                    )) {
                      if (vaseName.length > 0) {
                        vaseName += "_";
                      }
                      vaseName += `${key}:${value}`;
                    }
                    window.exportStl(vaseName);
                  }
                }}
              >
                Download STL
              </Button>

              <HowToPrint />
            </div>
          </CardContent>
          <CardFooter>
            <div>
              <p className="text-sm">
                Code available on{" "}
                <strong>
                  <a href="https://github.com/javierbyte/resorte">github</a>
                </strong>
                . Made by{" "}
                <strong>
                  <a href="https://javier.xyz">javierbyte</a>
                </strong>
                .
              </p>
            </div>
          </CardFooter>
        </Card>
      </div>

      <div className={styles.svgContainer}>
        <SvgRender compiledVase={compiledVase} />
      </div>
      <div className={styles.fiberContainer}>
        <FiberRender
          compiledVase={compiledVase}
          extrude={configState.value.extrude}
        />
      </div>
    </main>
  );
}
