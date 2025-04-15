import React, { createContext, useState, useContext, ReactNode } from "react";
import { Mode, RhythmPattern, SlurPattern } from "@/lib/Scales";

type ScaleOptions = {
  key: string;
  mode: Mode;
  rhythm: RhythmPattern;
  octaves: number;
  startOctave: number;
  slurPattern: SlurPattern;
};

type ScaleContextType = {
  options: ScaleOptions;
  updateOptions: (newOptions: Partial<ScaleOptions>) => void;
};

const defaultOptions: ScaleOptions = {
  key: "C",
  mode: "major",
  rhythm: "long octave",
  octaves: 1,
  startOctave: 4,
  slurPattern: "tongued",
};

const ScaleContext = createContext<ScaleContextType | undefined>(undefined);

export function ScaleProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ScaleOptions>(defaultOptions);

  const updateOptions = (newOptions: Partial<ScaleOptions>) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      ...newOptions,
    }));
  };

  return (
    <ScaleContext.Provider value={{ options, updateOptions }}>
      {children}
    </ScaleContext.Provider>
  );
}

export function useScaleOptions() {
  const context = useContext(ScaleContext);
  if (context === undefined) {
    throw new Error("useScaleOptions must be used within a ScaleProvider");
  }
  return context;
}

