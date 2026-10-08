import { Config } from "@remotion/cli/config";
import path from "node:path";

// Videos are rendered standalone (not through Next), so teach the bundler the "@/" alias used across the repo.
Config.overrideWebpackConfig((config) => ({
  ...config,
  resolve: {
    ...config.resolve,
    alias: { ...(config.resolve?.alias as Record<string, string> | undefined), "@": path.resolve(process.cwd(), "src") },
  },
}));

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
Config.setCodec("h264");
Config.setCrf(18);
Config.setPixelFormat("yuv420p");
Config.setOverwriteOutput(true);
