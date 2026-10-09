const en = {
  title: "Airsc admin",
  tabs: { overview: "Overview", resources: "Resources", agents: "Agents & costs", allResources: "All resources", queued: "Waiting for agents", hidden: "Filtered out", site: "View site" },
  reasons: {
    not_relevant: "Not an agent resource (app, library or framework)",
    low_quality: "Quality score under 40",
    danger: "Safety scan: danger",
    manual: "Hidden by an admin",
  } as Record<string, string>,
  kpi: {
    published: "Published", queued: "Waiting for agents", hidden: "Filtered out", autoHidden: "by the Curator", new7d: "new in 7 days",
    views7d: "Views · 7 days", downloads7d: "GitHub opens · 7 days", users: "Users", fulltime: "Full-time",
    revenue: "Donations (Ko-fi)", orders: "supporters", credit: "AI credit left", spent30d: "Tracked agent spend · 30 days", gatewayUsed: "AI Gateway total used",
    pipeline: "Pipeline coverage", classified: "classified", video: "with video", demo: "demo verified",
  },
  charts: { views: "Page views per day", downloads: "GitHub opens per day", cost: "AI cost per day (USD)" },
  topViewed: "Most viewed · 7 days",
  lastRun: "Last agent run",
  none: "No data yet.",
  filters: {
    search: "Search name or owner/repo", allTypes: "All types", allStatus: "All statuses", allCategories: "All categories",
    allSafety: "All safety", allStages: "Any stage", apply: "Apply",
    stages: { unclassified: "Not classified", no_video: "Published, no video", has_video: "Has video", has_slideshow: "Has slideshow", demo_ok: "Demo verified", demo_failed: "Demo failed" } as Record<string, string>,
    sorts: { stars: "Stars", views: "Views", downloads: "Downloads", quality: "Quality", newest: "Newest" } as Record<string, string>,
  },
  table: { resource: "Resource", status: "Status", category: "Category", quality: "Score", pipeline: "Pipeline", views: "Views", downloads: "Downloads", stars: "Stars", seen: "Found" },
  actions: { publish: "Publish", hide: "Hide", recurate: "Re-classify", revideo: "Redo video", redemo: "Redo demo" },
  results: "resources",
  runs: "Runs", run: "Run now", runFull: "Full run (find new)", runContent: "Content only (skip Scout)",
  limits: "Limits per run", models: "Models", costByAgent: "Cost by agent · 30 days", log: "Latest run log",
  cols: { started: "Started", trigger: "Trigger", status: "Status", duration: "Duration", results: "Results", cost: "Cost" },
};

export type AdminCopy = typeof en;

const vi: AdminCopy = {
  title: "Quản trị Airsc",
  tabs: { overview: "Tổng quan", resources: "Tài nguyên", agents: "Agent & chi phí", allResources: "Tất cả", queued: "Chờ agent xử lý", hidden: "Agent đã lọc bỏ", site: "Xem trang web" },
  reasons: {
    not_relevant: "Không phải tài nguyên cho agent (app, thư viện, framework)",
    low_quality: "Điểm chất lượng dưới 40",
    danger: "Quét an toàn: nguy hiểm",
    manual: "Admin đã ẩn",
  },
  kpi: {
    published: "Đang hiển thị", queued: "Chờ agent xử lý", hidden: "Đã lọc bỏ", autoHidden: "do Curator", new7d: "mới trong 7 ngày",
    views7d: "Lượt xem · 7 ngày", downloads7d: "Lượt mở GitHub · 7 ngày", users: "Người dùng", fulltime: "Full-time",
    revenue: "Ủng hộ (Ko-fi)", orders: "người ủng hộ", credit: "Credit AI còn lại", spent30d: "Agent đã ghi nhận · 30 ngày", gatewayUsed: "Tổng đã dùng trên AI Gateway",
    pipeline: "Mức xử lý của agent", classified: "đã phân loại", video: "có video", demo: "demo đã kiểm chứng",
  },
  charts: { views: "Lượt xem mỗi ngày", downloads: "Lượt mở GitHub mỗi ngày", cost: "Chi phí AI mỗi ngày (USD)" },
  topViewed: "Xem nhiều nhất · 7 ngày",
  lastRun: "Lần chạy agent gần nhất",
  none: "Chưa có dữ liệu.",
  filters: {
    search: "Tìm theo tên hoặc owner/repo", allTypes: "Mọi loại", allStatus: "Mọi trạng thái", allCategories: "Mọi danh mục",
    allSafety: "Mọi mức an toàn", allStages: "Mọi bước", apply: "Lọc",
    stages: { unclassified: "Chưa phân loại", no_video: "Đã đăng, chưa có video", has_video: "Có video", has_slideshow: "Có slideshow", demo_ok: "Demo đạt", demo_failed: "Demo lỗi" },
    sorts: { stars: "Số sao", views: "Lượt xem", downloads: "Lượt tải", quality: "Điểm chất lượng", newest: "Mới nhất" },
  },
  table: { resource: "Tài nguyên", status: "Trạng thái", category: "Danh mục", quality: "Điểm", pipeline: "Agent", views: "Xem", downloads: "Tải", stars: "Sao", seen: "Phát hiện" },
  actions: { publish: "Đăng", hide: "Ẩn", recurate: "Phân loại lại", revideo: "Làm lại video", redemo: "Demo lại" },
  results: "tài nguyên",
  runs: "Các lần chạy", run: "Chạy ngay", runFull: "Chạy đầy đủ (tìm mới)", runContent: "Chỉ nội dung (bỏ Scout)",
  limits: "Giới hạn mỗi lần chạy", models: "Model", costByAgent: "Chi phí theo agent · 30 ngày", log: "Log lần chạy gần nhất",
  cols: { started: "Bắt đầu", trigger: "Kích hoạt", status: "Trạng thái", duration: "Thời gian", results: "Kết quả", cost: "Chi phí" },
};

export const adminCopy = (lang: string) => (lang === "vi" ? vi : en);
