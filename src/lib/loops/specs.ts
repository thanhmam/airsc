/**
 * The loops that make Airsc run itself. Each one has the same four parts, from the loop-engineering practice the
 * Claude team describes: a trigger, a goal a machine can check, a verifier that is code before it is a model, and
 * stop rules. `status` says how much of it exists today; /admin/engine shows them next to their numbers.
 */
type L = { en: string; vi: string };

export type LoopSpec = {
  id: string;
  name: L;
  status: "live" | "partial" | "planned";
  trigger: L;
  goal: L;
  verifier: L;
  stop: L;
  learns: L;
  /** where it lives in the code, or the plan phase that will add it */
  where: string;
};

export const LOOPS: LoopSpec[] = [
  {
    id: "discovery",
    name: { en: "Discovery", vi: "Tìm tài nguyên mới" },
    status: "partial",
    trigger: { en: "Daily run (cron, hour set in /admin/agents)", vi: "Chạy hằng ngày (cron, giờ đặt ở /admin/agents)" },
    goal: { en: "New resources that pass the bar every day; searches with no result get an answer", vi: "Mỗi ngày có tài nguyên mới đạt chuẩn; tìm không ra thì có câu trả lời" },
    verifier: { en: "Repo exists, not a fork or archived, license, safety scan, Curator quality gate", vi: "Repo tồn tại, không phải fork hay đã lưu trữ, giấy phép, quét an toàn, cổng chất lượng của Curator" },
    stop: { en: "Per-run dollar cap, batch limits, AI balance floor", vi: "Trần chi phí mỗi lần chạy, giới hạn mỗi batch, mức số dư AI tối thiểu" },
    learns: { en: "Today: nothing. Planned (P4): yield of each Scout query, and the searches that found nothing", vi: "Hiện tại: chưa. Sắp tới (P4): hiệu suất từng truy vấn của Scout và các lượt tìm không ra kết quả" },
    where: "src/lib/engine/agents/scout.ts",
  },
  {
    id: "classify",
    name: { en: "Classify and rank", vi: "Phân loại và xếp hạng" },
    status: "partial",
    trigger: { en: "After discovery, in the same run", vi: "Sau bước tìm, trong cùng lần chạy" },
    goal: { en: "Every published resource has a category, jobs, quality and a safety label", vi: "Mọi tài nguyên hiển thị đều có danh mục, nghề, điểm chất lượng và nhãn an toàn" },
    verifier: { en: "Schema-checked output (zod); the gate in curator.ts decides publish or hide", vi: "Kết quả được kiểm bằng schema (zod); cổng trong curator.ts quyết định đăng hay ẩn" },
    stop: { en: "Run cap; failed batches are logged and retried next run", vi: "Trần mỗi lần chạy; batch lỗi được ghi log và thử lại lần sau" },
    learns: { en: "Today: nothing. Planned (P2, P4): golden cases from admin corrections; ranking weights tuned on clicks", vi: "Hiện tại: chưa. Sắp tới (P2, P4): case chuẩn từ chỗ admin sửa nhãn; trọng số xếp hạng chỉnh theo lượt click" },
    where: "src/lib/engine/agents/curator.ts",
  },
  {
    id: "content",
    name: { en: "Content", vi: "Nội dung" },
    status: "live",
    trigger: { en: "Daily run; hourly cron posts at the set times", vi: "Chạy hằng ngày; cron mỗi giờ đăng đúng giờ đã đặt" },
    goal: { en: "Guides, the weekly digest, Today's picks and X drafts stay fresh; X views and engagement rise", vi: "Guide, bản tin tuần, Chọn lọc hôm nay và bài nháp X luôn mới; lượt xem và tương tác trên X tăng" },
    verifier: { en: "Writing rules checked in code; applied posts need a human; X numbers read back from the API", vi: "Luật viết được kiểm bằng code; bài applied cần người duyệt; số liệu X đọc lại từ API" },
    stop: { en: "Slots per day, run cap, an unapproved post goes out without the @", vi: "Số khung giờ mỗi ngày, trần mỗi lần chạy, bài chưa duyệt đăng không kèm @" },
    learns: { en: "Every three days the review reads the numbers and rewrites the writing guidance", vi: "Mỗi ba ngày bản đánh giá đọc số liệu và viết lại hướng dẫn viết" },
    where: "src/lib/social/review.ts",
  },
  {
    id: "playbooks",
    name: { en: "Playbooks", vi: "Lộ trình theo nghề" },
    status: "partial",
    trigger: { en: "Weekly (planned P5); today a pick that is hidden is replaced on the next page view", vi: "Hằng tuần (dự kiến P5); hiện tại pick bị ẩn được thay ngay ở lần xem trang kế tiếp" },
    goal: { en: "Every step has a Safe pick with quality 85 or more, updated in the last 90 days", vi: "Mỗi bước có pick An toàn, chất lượng từ 85, cập nhật trong 90 ngày" },
    verifier: { en: "Deterministic rules on catalog data", vi: "Luật xác định trên dữ liệu thư viện" },
    stop: { en: "Changes to the main pick wait for a human", vi: "Đổi pick chính phải chờ người duyệt" },
    learns: { en: "Planned: rising topics become new playbooks", vi: "Dự kiến: chủ đề đang lên thành lộ trình mới" },
    where: "src/lib/playbooks.ts",
  },
  {
    id: "eval",
    name: { en: "Evals", vi: "Eval (gác cổng)" },
    status: "planned",
    trigger: { en: "Every pull request that touches a prompt or model, plus a nightly sample", vi: "Mỗi pull request đụng tới prompt hoặc model, cộng một mẫu chạy mỗi đêm" },
    goal: { en: "No agent scores lower than its baseline", vi: "Không agent nào chấm thấp hơn mức nền của nó" },
    verifier: { en: "Code grader, then a different model, then a human label", vi: "Chấm bằng code, rồi model khác, rồi nhãn của người" },
    stop: { en: "A failing check blocks the merge", vi: "Check lỗi sẽ chặn merge" },
    learns: { en: "Each correction in the admin becomes a new case", vi: "Mỗi lần sửa trong admin thành một case mới" },
    where: "P2",
  },
  {
    id: "harness",
    name: { en: "Self-improvement harness", vi: "Harness tự cải tiến" },
    status: "planned",
    trigger: { en: "Weekly GitHub Action running Claude Code", vi: "GitHub Action hằng tuần chạy Claude Code" },
    goal: { en: "One backlog item closed per session, every check green", vi: "Mỗi phiên đóng một mục trong backlog, mọi check đều xanh" },
    verifier: { en: "tsc, eslint, stack lock, product docs, evals", vi: "tsc, eslint, khoá stack, product docs, eval" },
    stop: { en: "One item and a turn cap per session; it never merges itself", vi: "Một mục và trần số lượt mỗi phiên; không bao giờ tự merge" },
    learns: { en: "engine/PROGRESS.md and engine/backlog.json carry the work across sessions", vi: "engine/PROGRESS.md và engine/backlog.json giữ công việc xuyên các phiên" },
    where: "P7",
  },
];
