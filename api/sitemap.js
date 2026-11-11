const pages = ["/", "/features.html", "/download.html", "/docs.html", "/changelog.html", "/faq.html", "/about.html"];

module.exports = function handler(req, res) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (!host || !/^[a-z0-9.-]+$/i.test(host)) {
    return res.status(503).send("Sitemap is unavailable until the Vercel domain is assigned.");
  }

  const origin = `https://${host}`;
  const urls = pages.map(page => `  <url><loc>${origin}${page}</loc></url>`).join("\n");
  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
};