const ROUTES = [
  { prefix: '/scriptca', target: 'https://scriptca.ll3.kr' },
  { prefix: '/ui', target: 'https://ui.ll3.kr' },
];

function hubHtml() {
  return `<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>UniKit UI</title>
  <style>
    :root { color-scheme: light dark; }
    body { font-family: ui-sans-serif, system-ui, sans-serif; margin: 0; min-height: 100vh; display: grid; place-items: center; background: #0a0a0a; color: #fafafa; }
    main { width: min(36rem, calc(100% - 2rem)); }
    h1 { font-size: 1.75rem; letter-spacing: -0.03em; margin: 0 0 0.5rem; }
    p { color: #a3a3a3; margin: 0 0 1.5rem; }
    a { display: flex; justify-content: space-between; gap: 1rem; padding: 0.9rem 1rem; border: 1px solid #262626; border-radius: 0.75rem; color: inherit; text-decoration: none; margin-bottom: 0.6rem; }
    a:hover { border-color: #525252; background: #171717; }
    code { font-family: ui-monospace, monospace; font-size: 0.85em; color: #a3a3a3; }
  </style>
</head>
<body>
  <main>
    <h1>UniKit UI</h1>
    <p>Product hub for ll3.kr</p>
    <a href="/ui"><span>소개 · 카탈로그</span><code>/ui → ui.ll3.kr</code></a>
    <a href="/scriptca"><span>scriptca</span><code>/scriptca → scriptca.ll3.kr</code></a>
  </main>
</body>
</html>`;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    for (const { prefix, target } of ROUTES) {
      if (url.pathname === prefix || url.pathname.startsWith(prefix + '/')) {
        const rest = url.pathname.slice(prefix.length) || '/';
        const dest = new URL(rest, target.endsWith('/') ? target : target + '/');
        // URL(rest, base) when rest starts with / replaces path
        const out = new URL(target);
        out.pathname = rest === '/' ? '/' : rest;
        out.search = url.search;
        return Response.redirect(out.toString(), 302);
      }
    }
    if (url.pathname === '/' || url.pathname === '') {
      return new Response(hubHtml(), {
        headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'public, max-age=300' },
      });
    }
    return new Response('Not found', { status: 404 });
  },
};
