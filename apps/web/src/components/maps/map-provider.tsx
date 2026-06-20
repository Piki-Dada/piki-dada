"use client";

import { useLoadScript } from "@react-google-maps/api";
import { createContext, useContext } from "react";

const libraries: ("places")[] = ["places"];

const MapsReadyContext = createContext(false);

export function MapsProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
    libraries,
  });
  return <MapsReadyContext.Provider value={isLoaded}>{children}</MapsReadyContext.Provider>;
}

export function useMapsReady() {
  return useContext(MapsReadyContext);
}
