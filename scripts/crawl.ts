import { crawl } from "../src/lib/crawler/run";

const arg = (name: string) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

const started = Date.now();
crawl({
  limit: arg("limit") ? Number(arg("limit")) : undefined,
  minStars: arg("min-stars") ? Number(arg("min-stars")) : undefined,
  enrich: !process.argv.includes("--no-enrich"),
})
  .then((r) => console.log(`done in ${Math.round((Date.now() - started) / 1000)}s`, r))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
