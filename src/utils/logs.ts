export const APP_NAME = "finances_dashboard";

const ANSI = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
} as const;

const METHOD_COLORS: Record<string, string> = {
  GET: ANSI.blue,
  POST: ANSI.green,
  PUT: ANSI.yellow,
  PATCH: ANSI.magenta,
  DELETE: ANSI.red,
};

const SOURCE_LABELS: Record<LogSource, string> = {
  file: "BUN.FILE",
  render: "RENDER",
  json: "JSON",
  redirect: "REDIRECT",
};

const SOURCE_COLORS: Record<LogSource, string> = {
  file: ANSI.cyan,
  render: ANSI.green,
  json: ANSI.yellow,
  redirect: ANSI.blue,
};

const RESULT_COLORS: Record<LogResult, string> = {
  HTML: ANSI.green,
  JSON: ANSI.yellow,
  FILE: ANSI.cyan,
  REDIRECT: ANSI.blue,
  ERROR: ANSI.red,
};

export type LogSource = "file" | "render" | "json" | "redirect";

type LogResult = "HTML" | "JSON" | "FILE" | "REDIRECT" | "ERROR";

type LogHandler = (
  req: Request,
) => Response | Bun.BunFile | Promise<Response | Bun.BunFile>;

function paint(value: string, color: string): string {
  return `${color}${value}${ANSI.reset}`;
}

function localIsoTimestamp(date = new Date()): string {
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join("T");
}

function appLabel(): string {
  return `${ANSI.bold}${ANSI.cyan}[${APP_NAME}]${ANSI.reset}`;
}

function methodColor(method: string): string {
  return METHOD_COLORS[method] ?? ANSI.gray;
}

function statusColor(status: number): string {
  if (status >= 500) return ANSI.red;
  if (status >= 400) return ANSI.yellow;
  if (status >= 300) return ANSI.cyan;
  if (status >= 200) return ANSI.green;

  return ANSI.gray;
}

function resolveResult(source: LogSource, status: number): LogResult {
  if (status >= 400) return "ERROR";
  if (status === 304) return "FILE";
  if (status >= 300) return "REDIRECT";
  if (source === "render") return "HTML";
  if (source === "json") return "JSON";
  if (source === "file") return "FILE";

  return "REDIRECT";
}

function formatRequest(
  source: LogSource,
  req: Request,
  status: number,
): string {
  const method = req.method.toUpperCase();
  const path = new URL(req.url).pathname;
  const result = resolveResult(source, status);

  return [
    appLabel(),
    paint(localIsoTimestamp(), ANSI.dim),
    paint(method, methodColor(method)),
    path,
    paint(SOURCE_LABELS[source], SOURCE_COLORS[source]),
    paint(String(status), statusColor(status)),
    paint("→", ANSI.dim),
    paint(result, RESULT_COLORS[result]),
  ].join(" ");
}

function toResponse(value: Response | Bun.BunFile): Response {
  return value instanceof Response ? value : new Response(value);
}

export const log = {
  startup(url: string): void {
    console.log(
      [
        appLabel(),
        paint(localIsoTimestamp(), ANSI.dim),
        paint("SERVER STARTED", ANSI.green),
        url,
      ].join(" "),
    );
  },
};

export function withRequestLog(
  source: LogSource,
  handler: LogHandler,
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    try {
      const response = toResponse(await handler(req));
      const line = formatRequest(source, req, response.status);

      if (response.status >= 400) {
        console.error(line);
      } else {
        console.log(line);
      }

      return response;
    } catch (error) {
      console.error(formatRequest(source, req, 500));
      throw error;
    }
  };
}
