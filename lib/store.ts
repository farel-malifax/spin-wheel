import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrizeConfig {
  name: string; // Nama hadiah (misalnya "Hadiah 1")
  winner?: string; // Target pemenang (opsional)
}

interface WheelStore {
  participants: string[]; // Daftar nama
  prizes: PrizeConfig[]; // Daftar hadiah & target pemenang
  setParticipants: (names: string[]) => void;
  setPrizes: (prizes: PrizeConfig[]) => void;
}

export const useWheelStore = create<WheelStore>()(
  persist(
    (set) => ({
      participants: [],
      prizes: [],
      setParticipants: (names) => set({ participants: names }),
      setPrizes: (prizes) => set({ prizes }),
    }),
    { name: "wheel-store" }
  )
);
