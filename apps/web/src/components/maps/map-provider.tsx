"use client";

import { createContext, useContext } from "react";

// OpenStreetMap tiles need no API key, so the map is always ready.
// Kept as a context (instead of deleting it) so call sites don't change
// if/when we swap back to a keyed provider like Google Maps later.
const MapsReadyContext = createContext(true);

export function MapsProvider({ children }: { children: React.ReactNode }) {
  return <MapsReadyContext.Provider value={true}>{children}</MapsReadyContext.Provider>;
}

export function useMapsReady() {
  return useContext(MapsReadyContext);
}
