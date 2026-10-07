import type { Safety, SafetyNote } from "@/lib/types";

/**
 * Heuristic safety scan. Files the agent itself will read and act on
 * (SKILL.md, agent/command markdown, rules) are judged more strictly than
 * README install docs, because an agent may execute what they say.
 */
export type ScanFile = { path: string; content: string; role: "agent" | "script" | "manifest" | "readme" };

type Rule = {
  code: string;
  re: RegExp;
  roles: ScanFile["role"][];
  level: "caution" | "danger";
  en: string;
  vi: string;
};

const RULES: Rule[] = [
  {
    code: "prompt_injection",
    re: /ignore (all |any )?(previous|prior|above) instructions|disregard (the )?(system|previous) prompt|do not (tell|inform|mention (this )?to) the user|without (asking|telling|notifying) the user/i,
    roles: ["agent"],
    level: "caution",
    en: "Contains phrases used in prompt-injection attacks (may just be documentation about them). Read the file before installing.",
    vi: "Có cụm từ thường dùng trong tấn công prompt injection (có thể chỉ là tài liệu nói về nó). Đọc file trước khi cài.",
  },
  {
    code: "obfuscated_exec",
    re: /base64\s+(-d|--decode)[^\n|]*\|\s*(ba|z)?sh|eval\s*\(\s*(atob|Buffer\.from)\s*\(|exec\s*\(\s*base64|python3?\s+-c\s+["'][^"']*b64decode/i,
    roles: ["agent", "script", "manifest"],
    level: "danger",
    en: "Runs encoded (obfuscated) code.",
    vi: "Chạy đoạn code đã bị mã hoá (che giấu).",
  },
  {
    code: "secret_access",
    re: /~\/\.ssh|id_rsa|\.aws\/credentials|\.npmrc|keychain|\.config\/gh\/hosts|\.git-credentials/i,
    roles: ["agent", "script"],
    level: "caution",
    en: "Mentions credential files (SSH keys, cloud or npm tokens).",
    vi: "Có nhắc tới file chứa thông tin đăng nhập (SSH key, token cloud hoặc npm).",
  },
  {
    code: "destructive",
    re: /rm\s+-rf\s+(\/|~|\$HOME)(\s|$)|mkfs\.|dd\s+if=.*of=\/dev\//i,
    roles: ["agent", "script"],
    level: "danger",
    en: "Contains commands that can wipe files or disks.",
    vi: "Có lệnh có thể xoá sạch file hoặc ổ đĩa.",
  },
  {
    code: "remote_pipe_agent",
    re: /(curl|wget)[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh/i,
    roles: ["agent"],
    level: "caution",
    en: "Tells the agent to download and run a remote install script.",
    vi: "Bảo agent tải và chạy một script cài đặt từ xa.",
  },
  {
    code: "remote_pipe",
    re: /(curl|wget)[^\n|]*\|\s*(sudo\s+)?(ba|z)?sh/i,
    roles: ["script", "readme"],
    level: "caution",
    en: "Installer downloads a remote script and pipes it to the shell.",
    vi: "Trình cài đặt tải script từ xa và chạy thẳng bằng shell.",
  },
  {
    code: "install_hook",
    re: /"(preinstall|postinstall|install)"\s*:/,
    roles: ["manifest"],
    level: "caution",
    en: "npm package runs a script automatically on install.",
    vi: "Gói npm tự chạy script khi cài đặt.",
  },
  {
    code: "sudo",
    re: /(^|\s)sudo\s/m,
    roles: ["agent", "script"],
    level: "caution",
    en: "Asks for administrator (sudo) rights.",
    vi: "Yêu cầu quyền quản trị (sudo).",
  },
  {
    code: "outbound_env",
    re: /(fetch|axios|requests\.(post|get)|curl)[^\n]{0,120}(process\.env|os\.environ|\$\{?[A-Z_]*(KEY|TOKEN|SECRET))/i,
    roles: ["agent", "script"],
    level: "caution",
    en: "Sends environment variables or tokens over the network.",
    vi: "Gửi biến môi trường hoặc token qua mạng.",
  },
];

export function scanFiles(
  files: ScanFile[],
  meta: { license: string | null; pushedAt: string; archived: boolean },
): { safety: Safety; notes: SafetyNote[] } {
  const notes: SafetyNote[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    for (const rule of RULES) {
      if (!rule.roles.includes(file.role) || seen.has(rule.code)) continue;
      if (rule.re.test(file.content)) {
        seen.add(rule.code);
        notes.push({ level: rule.level, code: rule.code, file: file.path, en: rule.en, vi: rule.vi });
      }
    }
  }

  if (!meta.license || meta.license === "NOASSERTION") {
    notes.push({
      level: "caution",
      code: "no_license",
      en: "No clear license: check with the author before using it in a commercial product.",
      vi: "Không có giấy phép rõ ràng: hỏi tác giả trước khi dùng cho sản phẩm thương mại.",
    });
  }
  const ageDays = (Date.now() - new Date(meta.pushedAt).getTime()) / 86_400_000;
  if (meta.archived || ageDays > 365) {
    notes.push({
      level: "caution",
      code: "stale",
      en: meta.archived ? "Archived by the author." : "Not updated for over a year.",
      vi: meta.archived ? "Tác giả đã lưu trữ (ngừng phát triển)." : "Hơn một năm không cập nhật.",
    });
  }

  return finalizeSafety(notes);
}

/** Signals that are only alarming in combination: alone they are "caution" */
const RISK_SIGNALS = new Set(["prompt_injection", "secret_access", "remote_pipe_agent", "outbound_env"]);

/**
 * "Danger" is reserved for strong evidence: obfuscated execution, destructive commands,
 * or one file that both touches credential files and sends data over the network
 * (the exfiltration pattern). Everything else is "caution" with a neutral note.
 */
export function finalizeSafety(input: SafetyNote[]): { safety: Safety; notes: SafetyNote[] } {
  const filesWith = (code: string) => new Set(input.filter((n) => n.code === code).map((n) => n.file));
  const secretFiles = filesWith("secret_access");
  const exfilFiles = new Set([...filesWith("outbound_env")].filter((f) => secretFiles.has(f)));
  const notes = input.map((n) =>
    RISK_SIGNALS.has(n.code)
      ? {
          ...n,
          level: ((n.code === "secret_access" || n.code === "outbound_env") && exfilFiles.has(n.file)
            ? "danger"
            : "caution") as SafetyNote["level"],
        }
      : n,
  );
  const safety: Safety = notes.some((n) => n.level === "danger")
    ? "danger"
    : notes.some((n) => n.level === "caution")
      ? "caution"
      : "safe";
  return { safety, notes };
}

const OK_LICENSES = new Set([
  "MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause", "ISC", "0BSD", "Unlicense", "CC0-1.0",
  "CC-BY-4.0", "MPL-2.0", "GPL-2.0", "GPL-3.0", "LGPL-2.1", "LGPL-3.0", "AGPL-3.0", "Zlib", "BSL-1.0",
]);

export const licenseOk = (spdx: string | null) => !!spdx && OK_LICENSES.has(spdx);
