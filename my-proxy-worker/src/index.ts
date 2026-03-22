interface Env {
  FASTAPI_SECRET_KEY: string;
  SUPABASE_SERVICE_KEY: string;
  FASTAPI_HOST: string;
  SUPABASE_URL: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api")) {
      return proxyFastAPI(request, url, env);
    }

    if (url.pathname.startsWith("/db")) {
      return proxySupabase(request, url, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function proxyFastAPI(request: Request, url: URL, env: Env): Promise<Response> {
  const targetURL = env.FASTAPI_HOST + url.pathname.slice(4) + url.search;

  const res = await fetch(targetURL, {
    method: request.method,
    headers: {
      ...Object.fromEntries(request.headers),
      "X-API-Key": env.FASTAPI_SECRET_KEY,
    },
    body: request.method !== "GET" ? request.body : undefined,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

async function proxySupabase(request: Request, url: URL, env: Env): Promise<Response> {
  const targetURL = env.SUPABASE_URL + url.pathname.slice(3) + url.search;

  const headers = new Headers(request.headers);
  headers.set("apikey", env.SUPABASE_SERVICE_KEY);

  if (!headers.get("Authorization")) {
    headers.set("Authorization", `Bearer ${env.SUPABASE_SERVICE_KEY}`);
  }

  const res = await fetch(targetURL, {
    method: request.method,
    headers,
    body: request.method !== "GET" ? request.body : undefined,
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}