import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "iASV Simulator — Hamilton Otis-Mead",
    short_name: "iASV",
    description:
      "Interactieve simulator voor Intelligent Adaptive Support Ventilation op basis van de Otis- en Mead-formules.",
    lang: "nl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    // Android-opstartscherm: dezelfde blauwe tint als het icoon.
    background_color: "#1e6f9f",
    theme_color: "#030712",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
