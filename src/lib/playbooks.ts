import type { JobSlug } from "@/lib/taxonomy";

type L = { en: string; vi: string };

/**
 * One step of a playbook: the recommended resource and up to two alternatives, with why it is the pick and what
 * it needs to run. A recommended pick is rated safe with a quality of 85 or more; an alternative may be "caution"
 * (the page says so). When a pick is hidden or removed from the catalog, the first alternative still published
 * takes its place (resolvePlaybook in src/lib/data.ts), so a playbook never points at a dead page.
 */
export type PlaybookStep = { title: L; pick: string; alternatives: string[]; why: L; needs?: L };

export type Playbook = {
  job: JobSlug;
  slug: string;
  title: L;
  /** who it is for and what they end up with */
  intro: L;
  steps: PlaybookStep[];
  /** a caution shown above the steps (money, personal data, terms of service) */
  warning?: L;
};

/** Reviewed by hand on 2026-10-25 from the catalog (stars, quality, safety, last commit); see docs in /admin/pm */
export const PLAYBOOKS: Playbook[] = [
  {
    job: "engineering",
    slug: "build-with-an-agent",
    title: { en: "Build a project with an agent, from idea to ship", vi: "Xây dự án cùng agent, từ ý tưởng đến lúc ship" },
    intro: {
      en: "For a vibe coder whose project is growing faster than they can keep in their head: plan before code, keep context between sessions, test in a real browser, review before you ship.",
      vi: "Cho người vibe code có dự án lớn nhanh hơn khả năng nắm hết: lên kế hoạch trước khi code, giữ ngữ cảnh giữa các phiên, kiểm thử trên trình duyệt thật, review trước khi ship.",
    },
    steps: [
      {
        title: { en: "Clarify, write a spec and a plan", vi: "Làm rõ yêu cầu, viết spec và kế hoạch" },
        pick: "obra-superpowers",
        alternatives: ["othmanadi-planning-with-files", "addyosmani-agent-skills"],
        why: { en: "Makes the agent ask questions and write a spec before it codes; the plan lives in files, so it survives a full context.", vi: "Bắt agent hỏi lại và viết spec trước khi code; kế hoạch nằm trong file nên không mất khi hết context." },
      },
      {
        title: { en: "Up-to-date docs for every library", vi: "Tài liệu đúng phiên bản cho từng thư viện" },
        pick: "upstash-context7",
        alternatives: [],
        why: { en: "Pulls the docs of the version you use into the agent, so it stops inventing APIs.", vi: "Đưa tài liệu đúng phiên bản bạn dùng vào agent, để nó thôi bịa API." },
        needs: { en: "A free API key raises the limits", vi: "Có API key miễn phí thì giới hạn cao hơn" },
      },
      {
        title: { en: "Find your way in a large codebase", vi: "Tìm đường trong codebase lớn" },
        pick: "minishlab-semble",
        alternatives: ["oraios-serena", "deusdata-codebase-memory-mcp"],
        why: { en: "Code search in plain words that returns only the parts that matter, so the agent spends fewer tokens reading.", vi: "Tìm code bằng lời thường và chỉ trả về phần liên quan, nên agent tốn ít token đọc hơn." },
      },
      {
        title: { en: "Remember the project between sessions", vi: "Nhớ dự án giữa các phiên" },
        pick: "agricidaniel-claude-obsidian",
        alternatives: ["thedotmack-claude-mem"],
        why: { en: "Writes decisions and findings into linked Markdown notes you can read and edit yourself.", vi: "Ghi quyết định và phát hiện thành ghi chú Markdown có liên kết, bạn tự đọc và sửa được." },
      },
      {
        title: { en: "Keep the code small", vi: "Giữ code gọn" },
        pick: "dietrichgebert-ponytail",
        alternatives: ["jeffallan-claude-skills"],
        why: { en: "Steers the agent away from over-engineering: less code to read, review and pay for.", vi: "Kéo agent khỏi thói làm phức tạp: ít code hơn để đọc, review và trả tiền token." },
      },
      {
        title: { en: "A UI that does not look AI-made", vi: "Giao diện không mang dáng AI" },
        pick: "leonxlnx-taste-skill",
        alternatives: ["miqdadbadjuber-anti-slop", "zanwei-design-dna"],
        why: { en: "Art direction, references and a visual check in the browser. design-dna measures how far your colours drift from your brand.", vi: "Định hướng thẩm mỹ, ảnh tham khảo và kiểm tra bằng trình duyệt. design-dna đo màu đã lệch khỏi thương hiệu bao nhiêu." },
      },
      {
        title: { en: "Test in a real browser, on a phone too", vi: "Kiểm thử trên trình duyệt thật, cả điện thoại" },
        pick: "microsoft-playwright-mcp",
        alternatives: ["chromedevtools-chrome-devtools-mcp", "addyosmani-web-quality-skills"],
        why: { en: "The agent opens your pages, clicks through them and reads what is on screen. Airsc audits its own pages with it.", vi: "Agent mở trang, bấm thử và đọc những gì hiện trên màn hình. Airsc dùng nó để audit chính các trang của mình." },
      },
      {
        title: { en: "Review for security before you ship", vi: "Review bảo mật trước khi ship" },
        pick: "trailofbits-skills",
        alternatives: ["alibaba-open-code-review"],
        why: { en: "Skills from Trail of Bits, a security audit firm, for finding the bugs that matter.", vi: "Skill từ Trail of Bits, một hãng audit bảo mật, để tìm những lỗi đáng lo." },
      },
      {
        title: { en: "Ship and keep an eye on it", vi: "Ship và theo dõi" },
        pick: "github-github-mcp-server",
        alternatives: ["openstatushq-openstatus"],
        why: { en: "Issues, pull requests and CI from the agent; uptime and a status page once it is live.", vi: "Issue, pull request và CI ngay trong agent; uptime và trang trạng thái khi đã chạy thật." },
      },
      {
        title: { en: "See what the agent costs", vi: "Biết agent tốn bao nhiêu" },
        pick: "getagentseal-codeburn",
        alternatives: ["sirmalloc-ccstatusline"],
        why: { en: "Reads your session files locally and splits the spend by project, model and task.", vi: "Đọc file phiên làm việc ngay trên máy và chia chi phí theo dự án, model và tác vụ." },
      },
    ],
  },
  {
    job: "marketing",
    slug: "launch-marketing",
    title: { en: "Market a new product", vi: "Marketing cho sản phẩm mới" },
    intro: {
      en: "From positioning to the first posts and ads, with real data from your own accounts.",
      vi: "Từ định vị đến những bài đăng và quảng cáo đầu tiên, dựa trên số liệu thật từ tài khoản của bạn.",
    },
    warning: { en: "Ad tools spend real money: let the agent propose, and approve every change to a budget yourself.", vi: "Công cụ quảng cáo tiêu tiền thật: để agent đề xuất, còn mọi thay đổi ngân sách thì bạn tự duyệt." },
    steps: [
      {
        title: { en: "Positioning, copy and conversion", vi: "Định vị, copy và chuyển đổi" },
        pick: "coreyhaines31-marketingskills",
        alternatives: ["aaron-he-zhu-aaron-marketing-skills"],
        why: { en: "Skills for positioning, copywriting, landing pages and SEO. Airsc ran its seo-audit on its own site.", vi: "Skill cho định vị, viết copy, landing page và SEO. Airsc đã chạy seo-audit của nó trên chính site mình." },
      },
      {
        title: { en: "SEO from your real data", vi: "SEO từ số liệu thật" },
        pick: "ryze-ai-adgent-open-seo-mcp-skills",
        alternatives: ["iannuttall-seo"],
        why: { en: "Keyword research, rank tracking and audits that read your own Search Console.", vi: "Nghiên cứu từ khoá, theo dõi thứ hạng và audit dựa trên Search Console của chính bạn." },
        needs: { en: "Access to Google Search Console", vi: "Quyền truy cập Google Search Console" },
      },
      {
        title: { en: "Google and Meta ads", vi: "Quảng cáo Google và Meta" },
        pick: "irinabuht12-oss-google-ads-meta-ads-mcp",
        alternatives: ["pipeboard-co-meta-ads-mcp"],
        why: { en: "One connection to Google Ads, Meta Ads, GA4 and Search Console to read results and plan changes.", vi: "Một kết nối tới Google Ads, Meta Ads, GA4 và Search Console để đọc kết quả và lên kế hoạch thay đổi." },
      },
      {
        title: { en: "Posts on LinkedIn, X and Instagram", vi: "Bài đăng LinkedIn, X và Instagram" },
        pick: "sergebulaev-linkedin-skills",
        alternatives: ["sergebulaev-x-skills", "sergebulaev-instagram-skills"],
        why: { en: "Drafts in your voice and publishes only after you approve.", vi: "Viết nháp theo giọng của bạn và chỉ đăng khi bạn duyệt." },
      },
      {
        title: { en: "Remove the AI tone", vi: "Bỏ giọng văn AI" },
        pick: "blader-humanizer",
        alternatives: [],
        why: { en: "Rewrites the tells that make text read as machine-written, keeping the meaning.", vi: "Viết lại những dấu hiệu khiến văn bản nghe như máy viết, giữ nguyên ý." },
      },
      {
        title: { en: "A launch video", vi: "Video ra mắt" },
        pick: "heygen-com-hyperframes",
        alternatives: ["vincentwei1021-video-shotcraft"],
        why: { en: "Turns HTML and CSS into an MP4 from your agent: your real screens, animated.", vi: "Biến HTML và CSS thành MP4 ngay từ agent: chính màn hình thật của bạn, có chuyển động." },
      },
    ],
  },
  {
    job: "sales",
    slug: "lead-pipeline",
    title: { en: "A pipeline to find customers", vi: "Pipeline tìm khách hàng" },
    intro: {
      en: "From who to sell to, to a list of leads, enriched, contacted and tracked, then run on a schedule.",
      vi: "Từ việc xác định bán cho ai, đến danh sách khách tiềm năng, làm giàu thông tin, liên hệ và theo dõi, rồi cho chạy định kỳ.",
    },
    warning: {
      en: "Collect only public business data, follow anti-spam rules and the data-protection law where you sell, and read each site's terms before scraping it.",
      vi: "Chỉ thu thập dữ liệu doanh nghiệp công khai, tuân thủ luật chống spam và luật bảo vệ dữ liệu cá nhân nơi bạn bán hàng, và đọc điều khoản của từng trang trước khi thu thập.",
    },
    steps: [
      {
        title: { en: "Who to sell to", vi: "Bán cho ai" },
        pick: "gooseworks-ai-goose-skills",
        alternatives: ["ferdinandobons-startup-skill"],
        why: { en: "Go-to-market skills: ideal customer, positioning and lead generation in one pack.", vi: "Skill go-to-market: chân dung khách hàng, định vị và tìm khách trong một gói." },
      },
      {
        title: { en: "A list of local businesses", vi: "Danh sách doanh nghiệp địa phương" },
        pick: "apify-apify-mcp-server",
        alternatives: ["mahanaicoach-google-maps-scraper-kit", "gosom-google-maps-scraper"],
        why: { en: "Thousands of ready-made scrapers, Google Maps included: names, websites, phone numbers and reviews. The two alternatives run free on your own machine.", vi: "Hàng nghìn bộ thu thập dựng sẵn, có cả Google Maps: tên, website, số điện thoại và đánh giá. Hai lựa chọn thay thế chạy miễn phí ngay trên máy bạn." },
        needs: { en: "An Apify account, billed by usage", vi: "Tài khoản Apify, trả phí theo mức dùng" },
      },
      {
        title: { en: "Enrich each lead", vi: "Làm giàu thông tin từng khách" },
        pick: "firecrawl-firecrawl-mcp-server",
        alternatives: ["exa-labs-exa-mcp-server"],
        why: { en: "Reads each company's website into clean text: what they sell, who runs it, how to reach them.", vi: "Đọc website từng công ty thành văn bản sạch: họ bán gì, ai điều hành, liên hệ thế nào." },
        needs: { en: "An API key (free tier available)", vi: "Cần API key (có gói miễn phí)" },
      },
      {
        title: { en: "Write and send the first email", vi: "Viết và gửi email đầu tiên" },
        pick: "googleworkspace-cli",
        alternatives: ["devlikeapro-waha"],
        why: { en: "Gmail, Sheets and Calendar from the agent. Pair it with Humanizer so each email reads like you wrote it.", vi: "Gmail, Sheets và Calendar ngay trong agent. Kết hợp với Humanizer để mỗi email nghe như bạn tự viết." },
      },
      {
        title: { en: "Track every lead", vi: "Theo dõi từng khách" },
        pick: "haris-musa-excel-mcp-server",
        alternatives: ["xing5-mcp-google-sheets", "composiohq-composio"],
        why: { en: "A light CRM in a spreadsheet the agent can read and update. Composio connects HubSpot and other CRMs when you outgrow it.", vi: "CRM nhẹ trong bảng tính mà agent đọc và cập nhật được. Composio nối HubSpot và các CRM khác khi bạn cần nhiều hơn." },
      },
      {
        title: { en: "Run it every week", vi: "Cho chạy mỗi tuần" },
        pick: "czlonkowski-n8n-mcp",
        alternatives: ["n8n-io-n8n"],
        why: { en: "Lets the agent build and fix n8n workflows, so the whole pipeline runs on a schedule.", vi: "Cho agent dựng và sửa workflow n8n, để cả pipeline tự chạy theo lịch." },
      },
    ],
  },
  {
    job: "office",
    slug: "automate-office-work",
    title: { en: "Automate office work", vi: "Tự động hoá việc văn phòng" },
    intro: {
      en: "Email, calendar, documents and spreadsheets handled by your agent, and the repetitive parts turned into workflows.",
      vi: "Email, lịch, tài liệu và bảng tính do agent xử lý, phần lặp đi lặp lại biến thành luồng tự động.",
    },
    steps: [
      {
        title: { en: "Gmail, Drive and Calendar", vi: "Gmail, Drive và Calendar" },
        pick: "googleworkspace-cli",
        alternatives: ["taylorwilsdon-google-workspace-mcp"],
        why: { en: "Google's own command line for Workspace, with more than 40 agent skills.", vi: "Công cụ dòng lệnh chính chủ của Google cho Workspace, kèm hơn 40 skill cho agent." },
      },
      {
        title: { en: "Spreadsheets", vi: "Bảng tính" },
        pick: "haris-musa-excel-mcp-server",
        alternatives: ["xing5-mcp-google-sheets"],
        why: { en: "Creates, reads and formats Excel files without Excel installed.", vi: "Tạo, đọc và định dạng file Excel mà không cần cài Excel." },
      },
      {
        title: { en: "Good-looking PDFs and slides", vi: "PDF và slide đẹp" },
        pick: "tw93-kami",
        alternatives: ["anthropics-skills"],
        why: { en: "Layout rules and templates for documents that look designed, exported as PDF, PNG or PowerPoint.", vi: "Quy tắc dàn trang và mẫu để tài liệu trông như được thiết kế, xuất PDF, PNG hoặc PowerPoint." },
      },
      {
        title: { en: "Turn routines into workflows", vi: "Biến việc lặp lại thành luồng tự động" },
        pick: "czlonkowski-n8n-mcp",
        alternatives: ["zapier-zapier-mcp", "activepieces-activepieces"],
        why: { en: "The agent builds the workflow for you in n8n; Zapier when your apps are already there.", vi: "Agent dựng workflow giúp bạn trong n8n; dùng Zapier nếu các app của bạn đã nằm ở đó." },
      },
    ],
  },
  {
    job: "content",
    slug: "multichannel-content",
    title: { en: "Content for every channel", vi: "Nội dung đa kênh" },
    intro: {
      en: "One idea turned into a post, a deck and a short video, in your voice.",
      vi: "Một ý tưởng thành bài viết, bộ slide và video ngắn, theo giọng của bạn.",
    },
    steps: [
      {
        title: { en: "Write it in your voice", vi: "Viết theo giọng của bạn" },
        pick: "blader-humanizer",
        alternatives: [],
        why: { en: "Removes the patterns that make text sound AI-written. Airsc used it on its own summaries.", vi: "Bỏ những mẫu câu khiến văn bản nghe như AI viết. Airsc đã dùng nó cho các bản tóm tắt của mình." },
      },
      {
        title: { en: "Slides", vi: "Slide" },
        pick: "zarazhangrui-frontend-slides",
        alternatives: ["tw93-kami"],
        why: { en: "Decks as HTML, from scratch or from a PowerPoint. Airsc made its pitch deck styles with it.", vi: "Slide dạng HTML, làm mới hoặc chuyển từ PowerPoint. Airsc đã làm các mẫu slide giới thiệu bằng nó." },
      },
      {
        title: { en: "Video from your screens", vi: "Video từ chính màn hình của bạn" },
        pick: "heygen-com-hyperframes",
        alternatives: ["krillinai-opencreator", "jub0t-concat"],
        why: { en: "HTML and CSS rendered to MP4; OpenCreator adds voice-over and images; Concat edits clips.", vi: "HTML và CSS xuất thành MP4; OpenCreator thêm lồng tiếng và ảnh; Concat dựng các đoạn clip." },
      },
      {
        title: { en: "Publish to the platforms", vi: "Đăng lên các nền tảng" },
        pick: "dreammis-social-auto-upload",
        alternatives: [],
        why: { en: "Uploads videos to TikTok, YouTube and Bilibili from the agent.", vi: "Đăng video lên TikTok, YouTube và Bilibili ngay từ agent." },
      },
    ],
  },
  {
    job: "research",
    slug: "deep-research",
    title: { en: "Deep research with citations", vi: "Nghiên cứu sâu có trích dẫn" },
    intro: {
      en: "From a question to a sourced report, with your papers and notes kept in one place.",
      vi: "Từ một câu hỏi đến báo cáo có nguồn, cùng bài báo và ghi chú được giữ ở một nơi.",
    },
    steps: [
      {
        title: { en: "A report with sources", vi: "Báo cáo có nguồn" },
        pick: "assafelovic-gpt-researcher",
        alternatives: [],
        why: { en: "Searches the web and your files and writes a report that cites every claim.", vi: "Tìm trên web và trong file của bạn, rồi viết báo cáo có trích dẫn cho từng ý." },
      },
      {
        title: { en: "Your paper library", vi: "Thư viện bài báo của bạn" },
        pick: "54yyyu-zotero-mcp",
        alternatives: [],
        why: { en: "Search, read and cite the papers in your Zotero library from the agent.", vi: "Tìm, đọc và trích dẫn các bài báo trong thư viện Zotero ngay từ agent." },
      },
      {
        title: { en: "Turn a book into a skill", vi: "Biến một cuốn sách thành skill" },
        pick: "virgiliojr94-book-to-skill",
        alternatives: [],
        why: { en: "Converts a technical book or a folder of documents into a skill your agent can consult.", vi: "Chuyển một cuốn sách kỹ thuật hoặc thư mục tài liệu thành skill để agent tra cứu." },
      },
      {
        title: { en: "Papers and science databases", vi: "Bài báo và cơ sở dữ liệu khoa học" },
        pick: "blazickjp-arxiv-mcp-server",
        alternatives: ["k-dense-ai-scientific-agent-skills"],
        why: { en: "Reads arXiv papers, extracts BibTeX and watches topics, stored locally. K-Dense adds 177 skills over more than 100 scientific databases.", vi: "Đọc bài trên arXiv, lấy BibTeX và theo dõi chủ đề, lưu trên máy. K-Dense thêm 177 skill trên hơn 100 cơ sở dữ liệu khoa học." },
      },
    ],
  },
  {
    job: "data",
    slug: "collect-and-analyse",
    title: { en: "Collect and analyse data", vi: "Thu thập và phân tích dữ liệu" },
    intro: {
      en: "From pages on the web to a clean table and a chart you can share.",
      vi: "Từ các trang trên web đến một bảng sạch và biểu đồ để chia sẻ.",
    },
    steps: [
      {
        title: { en: "Collect from the web", vi: "Thu thập từ web" },
        pick: "d4vinci-scrapling",
        alternatives: ["firecrawl-firecrawl-mcp-server"],
        why: { en: "Adaptive scraping that survives layout changes, from one page to a full crawl.", vi: "Thu thập dữ liệu tự thích nghi khi trang đổi bố cục, từ một trang đến cả website." },
      },
      {
        title: { en: "Clean it in a spreadsheet", vi: "Làm sạch trong bảng tính" },
        pick: "haris-musa-excel-mcp-server",
        alternatives: [],
        why: { en: "The agent writes the table, formulas and formatting into a real Excel file.", vi: "Agent ghi bảng, công thức và định dạng vào file Excel thật." },
      },
      {
        title: { en: "Chart it", vi: "Vẽ biểu đồ" },
        pick: "antvis-mcp-server-chart",
        alternatives: [],
        why: { en: "More than 25 chart types from plain data.", vi: "Hơn 25 loại biểu đồ từ dữ liệu thô." },
      },
      {
        title: { en: "Query your warehouse", vi: "Truy vấn kho dữ liệu" },
        pick: "dbt-labs-dbt-mcp",
        alternatives: [],
        why: { en: "Gives the agent your dbt models and the semantic layer, so its numbers match your definitions.", vi: "Đưa model dbt và semantic layer cho agent, để số liệu khớp với định nghĩa của bạn." },
      },
    ],
  },
  {
    job: "product",
    slug: "idea-to-prd",
    title: { en: "From an idea to a PRD", vi: "Từ ý tưởng đến PRD" },
    intro: {
      en: "Check whether the idea exists, test it against real demand, then write the product brief.",
      vi: "Kiểm tra ý tưởng đã có ai làm chưa, thử với nhu cầu thật, rồi viết tài liệu sản phẩm.",
    },
    steps: [
      {
        title: { en: "Has someone built it already?", vi: "Đã có ai làm chưa?" },
        pick: "mnemox-ai-idea-reality-mcp",
        alternatives: [],
        why: { en: "Scans GitHub, Hacker News, npm, PyPI and Product Hunt and scores how taken the idea is.", vi: "Quét GitHub, Hacker News, npm, PyPI và Product Hunt rồi chấm mức độ ý tưởng đã bị làm." },
      },
      {
        title: { en: "Validate the market", vi: "Kiểm chứng thị trường" },
        pick: "ferdinandobons-startup-skill",
        alternatives: ["emotixco-claude-skills-founder"],
        why: { en: "Competitor analysis, market research and a plan, before any code.", vi: "Phân tích đối thủ, nghiên cứu thị trường và kế hoạch, trước khi viết dòng code nào." },
      },
      {
        title: { en: "Discovery to PRD", vi: "Từ khám phá đến PRD" },
        pick: "phuryn-pm-skills",
        alternatives: ["deanpeters-product-manager-skills"],
        why: { en: "More than 100 product-management skills covering discovery, strategy, execution and launch.", vi: "Hơn 100 skill quản lý sản phẩm cho khám phá, chiến lược, thực thi và ra mắt." },
      },
    ],
  },
  {
    job: "finance",
    slug: "financial-analysis",
    title: { en: "Financial analysis", vi: "Phân tích tài chính" },
    intro: {
      en: "Statements, ratios and market data analysed by your agent, with the method shown.",
      vi: "Báo cáo tài chính, chỉ số và dữ liệu thị trường được agent phân tích, có trình bày phương pháp.",
    },
    warning: {
      en: "Not investment advice. Some tools here can place real trades: keep them in paper-trading mode until you trust them.",
      vi: "Không phải lời khuyên đầu tư. Một số công cụ ở đây đặt lệnh thật được: giữ ở chế độ giao dịch thử cho đến khi bạn tin tưởng.",
    },
    steps: [
      {
        title: { en: "Statements and ratios", vi: "Báo cáo và chỉ số" },
        pick: "jerbouma-financetoolkit",
        alternatives: [],
        why: { en: "An open toolkit with more than 500 transparent financial methods.", vi: "Bộ công cụ mở với hơn 500 phương pháp tài chính minh bạch." },
      },
      {
        title: { en: "A research method for sectors", vi: "Phương pháp nghiên cứu ngành" },
        pick: "muxuuu-serenity-skill",
        alternatives: [],
        why: { en: "Supply-chain research for stock and fund directions, step by step.", vi: "Nghiên cứu chuỗi cung ứng để tìm hướng cổ phiếu và quỹ, từng bước." },
      },
      {
        title: { en: "Markets and trading", vi: "Thị trường và giao dịch" },
        pick: "alpacahq-alpaca-mcp-server",
        alternatives: ["atilaahmettaner-tradingview-mcp"],
        why: { en: "Market data, analysis and orders through Alpaca, with a paper-trading account.", vi: "Dữ liệu thị trường, phân tích và lệnh qua Alpaca, có tài khoản giao dịch thử." },
        needs: { en: "An Alpaca account", vi: "Tài khoản Alpaca" },
      },
    ],
  },
  {
    job: "security",
    slug: "check-before-install",
    title: { en: "Check before you install, audit before you ship", vi: "Kiểm tra trước khi cài, audit trước khi ship" },
    intro: {
      en: "Scan skills and MCP servers before they run with your permissions, then audit your own code.",
      vi: "Quét skill và MCP server trước khi chúng chạy với quyền của bạn, rồi audit chính code của bạn.",
    },
    steps: [
      {
        title: { en: "Scan a skill before installing it", vi: "Quét skill trước khi cài" },
        pick: "spiffy-oss-artguard",
        alternatives: ["cisco-ai-defense-skill-scanner", "nvidia-skillspector"],
        why: { en: "Scans skills, MCP configs and rule files for threats, privacy leaks and hidden instructions before they run.", vi: "Quét skill, cấu hình MCP và file rule để tìm mối đe doạ, rò rỉ dữ liệu và chỉ dẫn ẩn trước khi chúng chạy." },
      },
      {
        title: { en: "Run MCP servers in isolation", vi: "Chạy MCP server cách ly" },
        pick: "stacklok-toolhive",
        alternatives: [],
        why: { en: "Runs each MCP server in its own container with access policies, so one bad server cannot reach the rest of your machine.", vi: "Chạy mỗi MCP server trong container riêng có chính sách truy cập, để một server xấu không chạm được phần còn lại của máy." },
      },
      {
        title: { en: "Audit your code", vi: "Audit code của bạn" },
        pick: "trailofbits-skills",
        alternatives: ["alibaba-open-code-review"],
        why: { en: "Security-analysis skills from an audit firm, used the way their engineers use them.", vi: "Skill phân tích bảo mật từ một hãng audit, dùng theo cách kỹ sư của họ dùng." },
      },
    ],
  },
];

export const playbooksFor = (job: string) => PLAYBOOKS.filter((p) => p.job === job);
export const findPlaybook = (job: string, slug: string) => PLAYBOOKS.find((p) => p.job === job && p.slug === slug);
/** every slug a playbook mentions, for one catalog query */
export const playbookSlugs = (p: Playbook) => [...new Set(p.steps.flatMap((s) => [s.pick, ...s.alternatives]))];
