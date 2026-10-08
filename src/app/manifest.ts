import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Airsc",
    short_name: "Airsc",
    description: "The safety-checked library of AI agent resources.",
    start_url: "/",
    display: "standalone",
    background_color: "#fafaf7",
    theme_color: "#5a3df0",
    icons: [
      { src: "/brand/airsc-app-icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/brand/airsc-app-icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
