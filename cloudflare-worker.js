export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Your RSS target (hardcoded to prevent open-proxy abuse)
    const target =
      "https://www.newsminimalist.com/rss/0dfd299c-e672-47dc-972a-9cdacbe9e3d6/0ec434356e68c0426d161feaa4fba0ff";

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders(request),
      });
    }

    // Fetch RSS
    const upstream = await fetch(target, {
      headers: {
        // Optional, but sometimes helps servers return the expected format
        "Accept": "application/rss+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });

    // Pass through body + content-type
    const contentType = upstream.headers.get("content-type") || "application/xml; charset=utf-8";
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: {
        ...corsHeaders(request),
        "content-type": contentType,
        // Optional caching knobs (tweak to your needs)
        "cache-control": "public, max-age=60",
      },
    });
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,OPTIONS",
    "access-control-allow-headers": "Content-Type",
    "vary": "Origin",
  };
}
