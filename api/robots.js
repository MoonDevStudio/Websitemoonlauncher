module.exports = function handler(req, res) {
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (!host || !/^[a-z0-9.-]+$/i.test(host)) {
    return res.status(503).send("Robots metadata is unavailable until the Vercel domain is assigned.");
  }

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  return res.status(200).send(`User-agent: *\nAllow: /\nDisallow: /admin\nSitemap: https://${host}/sitemap.xml\n`);
};