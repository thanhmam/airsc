import { db } from "../src/lib/engine/db";
const wait = process.argv.includes("--wait");
for (let i = 0; i < (wait ? 60 : 1); i++) {
  const [r] = (await db.runs(1)) as { status: string; stats: object; log: { msg: string }[]; started_at: string }[];
  if (!wait || r.status !== "running" || i === 59) {
    console.log(r.status, JSON.stringify(r.stats));
    r.log.slice(-14).forEach((l) => console.log(" ·", l.msg.slice(0, 220)));
    break;
  }
  await new Promise((res) => setTimeout(res, 8000));
}
