import { create } from "zustand";
import type { VentilatorParams } from "@/lib/types";

interface VentStore {
  params: VentilatorParams;
  setParam: <K extends keyof VentilatorParams>(key: K, value: VentilatorParams[K]) => void;
  setParams: (values: Partial<VentilatorParams>) => void;
  resetParams: () => void;
}

export const defaultParams: VentilatorParams = {
  peep:       5,
  pLimit:     30,
  resistance: 10,
  compliance: 50,
  ibw:        70,
  vaTarget:   5.0,
  pRamp:      50,
  peepiMeasured: 0,
  fSpont:     0,
};

export const useVentStore = create<VentStore>((set) => ({
  params: { ...defaultParams },

  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),

  setParams: (values) =>
    set((state) => ({ params: { ...state.params, ...values } })),

  resetParams: () => set({ params: { ...defaultParams } }),
}));
