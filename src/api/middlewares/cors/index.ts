const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function cors(req: Request) {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders, status: 204 });
}
