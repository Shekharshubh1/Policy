/**
 * Cloudflare Worker for National Healthcare Policy Decision Intelligence System (NHP-DIS).
 * 
 * Features:
 * 1. Serves the React/Vite dashboard via Cloudflare Static Assets with SPA fallback.
 * 2. Optional reverse-proxy: If `BACKEND_API_URL` environment variable is set in Cloudflare,
 *    forwards all API calls (/simulate, /health, /forecast, etc.) seamlessly to the backend.
 */

const API_ROUTES = [
  "/health",
  "/summary",
  "/states",
  "/districts",
  "/district",
  "/simulate",
  "/compare",
  "/forecast",
  "/sensitivity",
  "/optimize",
  "/nl-query",
  "/dag"
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const isApiRoute = API_ROUTES.some(
      (route) => url.pathname === route || url.pathname.startsWith(route + "/")
    );

    // Optional reverse proxy to backend if BACKEND_API_URL is configured
    if (isApiRoute && env.BACKEND_API_URL) {
      const targetUrl = new URL(url.pathname + url.search, env.BACKEND_API_URL);
      const headers = new Headers(request.headers);
      headers.set("Host", targetUrl.host);
      const proxyRequest = new Request(targetUrl.toString(), {
        method: request.method,
        headers: headers,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : null,
        redirect: "follow"
      });
      return fetch(proxyRequest);
    }

    // Default: Serve frontend static assets with SPA fallback
    return env.ASSETS.fetch(request);
  }
};
