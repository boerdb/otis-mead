import { create } from "zustand";
import type { VentilatorParams } from "@/lib/types";

interface VentStore {
  params: VentilatorParams;
  setParam: <K extends keyof VentilatorParams>(key: K, value: VentilatorParams[K]) => void;
  resetParams: () => void;
}

export const defaultParams: VentilatorParams = {
  peep:       5,
  autoPeep:   0,
  pLimit:     30,
  resistance: 10,
  rcExp:      0.5,
  ibw:        70,
  vaTarget:   5.0,
};

export const useVentStore = create<VentStore>((set) => ({
  params: { ...defaultParams },

  setParam: (key, value) =>
    set((state) => ({ params: { ...state.params, [key]: value } })),

  resetParams: () => set({ params: { ...defaultParams } }),
}));
