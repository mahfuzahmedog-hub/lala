"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ProjectSlice, createProjectSlice } from "./slices/projectSlice";
import { SettingsSlice, createSettingsSlice } from "./slices/settingsSlice";

export type StoreState = ProjectSlice & SettingsSlice;

export const useAppStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createProjectSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: "vibecode-universal-storage-v2",
    }
  )
);
