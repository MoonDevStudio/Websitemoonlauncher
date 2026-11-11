# Moon Launcher Website

Website multipage HTML/CSS/JavaScript untuk Moon Launcher, siap di-deploy ke Vercel tanpa build command. Halaman publik mengambil versi, tanggal, changelog, dan installer langsung dari GitHub Releases `moonlaunchermc/moonlauncher`.

Windows dan Linux tersedia untuk diunduh. Android berstatus **in development** dan tidak ditawarkan sebagai unduhan di website, meskipun repositori publik mungkin masih berisi APK beta lama.

## Pages

- `/` — Home
- `/features.html` — feature status by platform
- `/download.html` — real GitHub release assets only
- `/docs.html` — searchable installation, game management, modding, account, and troubleshooting guide
- `/changelog.html` — published release history
- `/faq.html` — accessible native FAQ disclosures
- `/about.html` — project background and independent-project disclaimer
- `/admin/` — protected release upload dashboard

Shared presentation and behavior live in `assets/site.css` and `assets/site.js`. Product claims follow the public launcher README; unverified mod-loader support is not shown as confirmed.

## Local preview

Run a static server from the repository root, for example:

```sh
python3 -m http.server 4173
```

Open `http://localhost:4173`. The serverless admin login endpoint requires Vercel environment configuration; a static local server cannot upload release assets.

## Manual screenshots

When browser automation is unavailable, start the local server above and open `http://localhost:4173` in Chrome or Edge. Open DevTools, enable the device toolbar, and set the viewport to `1440 × 900` for desktop or `390 × 844` for mobile. Use the DevTools command menu and select **Capture full size screenshot**. Repeat on `/download.html`, `/docs.html`, and `/features.html` if page screenshots are needed. Save genuine captures under `screenshots/`; do not use the design reference as a screenshot.

## Deploy to Vercel

Import this repository into Vercel, use the **Other** framework preset, and leave the build command empty. Vercel serves the static pages and deploys the Node.js handlers under `api/`. No custom domain or DNS changes are required. The robots and sitemap routes use Vercel's assigned project URL automatically.

## Configure admin uploads

Create a GitHub App and install it only on `moonlaunchermc/moonlauncher`. Give it **Contents: Read and write** permission. Add these environment variables to Vercel, then redeploy:

- `ADMIN_PASSWORD`: a unique, strong panel password.
- `GITHUB_APP_ID`: the GitHub App ID.
- `GITHUB_INSTALLATION_ID`: the App installation ID on the launcher repository.
- `GITHUB_APP_PRIVATE_KEY`: the PEM private key. Store it only in Vercel, never in the website or Git.

The server issues short-lived installation tokens restricted to the launcher repository and Contents permission. The browser uploads files directly to a selected GitHub Release draft, avoiding serverless request-size limits. Publish the release from the admin panel to make assets public. GitHub's maximum release asset size is 2 GB per file.