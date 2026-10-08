import type { Lang } from "./timeline";

/** `[[like this]]` marks the words shown as a highlighted chip */
export type Copy = {
  mock: string;
  hookA: { l1: string; l2: string };
  hookB: { l1: string; l2: string; prompt: string; kicker: string; deck: [string, string]; style: string };
  hookC: { caption: string };
  problem: { label: string; c1: string; c2: string; flagName: string; flagSub: string; flagChip: string };
  solution: { phrase: string; c1: string; c2: string; button: string; safe: string; caution: string; plugin: string; skill: string };
  preview: { c1: string; c2: string; tabResult: string; tabInstall: string; installed: string; deckNote: string };
  mcp: { tag: string; ask: string; tool: string; reply: string; done: string; c: string };
  cta: { headline: string; sub: string; url: string };
};

export const COPY: Record<Lang, Copy> = {
  vi: {
    mock: "mô phỏng minh hoạ",
    hookA: { l1: "Cài MCP lạ mà", l2: "[[chưa đọc code]]?" },
    hookB: {
      l1: "1 câu,",
      l2: "[[cả bộ slide]].",
      prompt: "làm pitch deck từ README",
      kicker: "PITCH DECK",
      deck: ["Startup AI của bạn,", "kể bằng slide."],
      style: "PHONG CÁCH",
    },
    hookC: { caption: "Chọn [[cái nào]]?" },
    problem: {
      label: "skill · MCP · plugin · rule",
      c1: "Có cả [[nghìn]] công cụ AI",
      c2: "Cái nào [[an toàn]]?",
      flagName: "fast-helper-mcp",
      flagSub: "★ 12 · không rõ nguồn",
      flagChip: "chưa ai kiểm tra",
    },
    solution: {
      phrase: "làm pitch deck từ README",
      c1: "Gõ bằng [[lời thường]]",
      c2: "Mỗi kết quả có [[nhãn an toàn]]",
      button: "Tìm",
      safe: "An toàn",
      caution: "Cẩn thận",
      plugin: "Plugin",
      skill: "Skill",
    },
    preview: {
      c1: "[[Xem trước]] kết quả",
      c2: "Cài bằng [[1 cú bấm]]",
      tabResult: "Kết quả",
      tabInstall: "Cài đặt",
      installed: "Đã cài",
      deckNote: "Bản xem trước các phong cách đã sẵn sàng.",
    },
    mcp: {
      tag: "Airsc MCP",
      ask: "tìm skill để test web trên iPhone",
      tool: 'search_resources { query: "browser testing" }',
      reply: "Chọn kết quả tốt nhất, kiểm tra nhãn an toàn. Đang cài.",
      done: "Đã cài: mcp-playwright",
      c: "[[Hỏi thẳng]] agent của bạn",
    },
    cta: { headline: "Tìm đúng công cụ [[AI]].", sub: "Miễn phí · Không cần tài khoản", url: "airsc.vercel.app" },
  },
  en: {
    mock: "illustrative simulation",
    hookA: { l1: "Installing a random", l2: "MCP [[without reading it]]?" },
    hookB: {
      l1: "One sentence,",
      l2: "[[a whole deck]].",
      prompt: "make a pitch deck from my README",
      kicker: "PITCH DECK",
      deck: ["Your AI startup,", "told in slides."],
      style: "STYLE",
    },
    hookC: { caption: "Which [[one]]?" },
    problem: {
      label: "skill · MCP · plugin · rule",
      c1: "[[Thousands]] of AI tools",
      c2: "Which are [[safe]]?",
      flagName: "fast-helper-mcp",
      flagSub: "★ 12 · unknown source",
      flagChip: "never reviewed",
    },
    solution: {
      phrase: "make a pitch deck from my README",
      c1: "Type it in [[plain words]]",
      c2: "Every result has a [[safety label]]",
      button: "Search",
      safe: "Safe",
      caution: "Caution",
      plugin: "Plugin",
      skill: "Skill",
    },
    preview: {
      c1: "[[Preview]] the result",
      c2: "Install in [[one click]]",
      tabResult: "Result",
      tabInstall: "Install",
      installed: "Installed",
      deckNote: "Style previews ready.",
    },
    mcp: {
      tag: "Airsc MCP",
      ask: "find a skill to test my site on an iPhone",
      tool: 'search_resources { query: "browser testing" }',
      reply: "Picking the top match and checking its safety label. Installing.",
      done: "Installed: mcp-playwright",
      c: "Just [[ask your agent]]",
    },
    cta: { headline: "Find the right [[AI tool]].", sub: "Free · No account needed", url: "airsc.vercel.app" },
  },
};
