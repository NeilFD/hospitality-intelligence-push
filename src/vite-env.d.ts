
/// <reference types="vite/client" />

import { Store } from "zustand";

interface BevStore {}

declare global {
  interface Window {
    bevStore: BevStore;
  }
}
