export async function fileResponse(
  req: Request,
  path: string,
): Promise<Response> {
  const file = Bun.file(path);

  if (!(await file.exists())) {
    return new Response("Not Found", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const headers = {
    "Last-Modified": new Date(file.lastModified).toUTCString(),
  };
  const ifModifiedSince = req.headers.get("if-modified-since");
  const canUseCache =
    req.method === "GET" || req.method === "HEAD";

  if (canUseCache && ifModifiedSince) {
    const since = new Date(ifModifiedSince);

    if (
      !Number.isNaN(since.getTime()) &&
      since.getTime() >= file.lastModified
    ) {
      return new Response(null, { status: 304, headers });
    }
  }

  return new Response(file, { headers });
}
