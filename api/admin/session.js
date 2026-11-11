const crypto = require("node:crypto");

const repository = "moonlaunchermc/moonlauncher";

function encodeBase64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function createAppJwt(appId, privateKey) {
  const now = Math.floor(Date.now() / 1000);
  const header = encodeBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = encodeBase64Url(JSON.stringify({ iss: appId, iat: now - 60, exp: now + 8 * 60 }));
  const message = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(message);
  return `${message}.${signer.sign(privateKey).toString("base64url")}`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store, max-age=0");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ADMIN_PASSWORD, GITHUB_APP_ID, GITHUB_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY } = process.env;
  if (!ADMIN_PASSWORD || !GITHUB_APP_ID || !GITHUB_INSTALLATION_ID || !GITHUB_APP_PRIVATE_KEY) {
    return res.status(503).json({ error: "Panel admin belum dikonfigurasi di environment Vercel." });
  }

  const provided = Buffer.from(String(req.body?.password || ""));
  const expected = Buffer.from(ADMIN_PASSWORD);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return res.status(401).json({ error: "Kata sandi admin tidak cocok." });
  }

  try {
    const privateKey = GITHUB_APP_PRIVATE_KEY.replace(/\\n/g, "\n");
    const appJwt = createAppJwt(GITHUB_APP_ID, privateKey);
    const response = await fetch(`https://api.github.com/app/installations/${encodeURIComponent(GITHUB_INSTALLATION_ID)}/access_tokens`, {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${appJwt}`,
        "X-GitHub-Api-Version": "2022-11-28"
      },
      body: JSON.stringify({
        repositories: [repository.split("/")[1]],
        permissions: { contents: "write" }
      })
    });

    if (!response.ok) {
      return res.status(502).json({ error: "GitHub App gagal membuat token. Periksa instalasi dan izin Contents: write." });
    }

    const { token, expires_at: expiresAt } = await response.json();
    return res.status(200).json({ token, expiresAt });
  } catch {
    return res.status(500).json({ error: "Autentikasi GitHub gagal. Periksa private key GitHub App." });
  }
};