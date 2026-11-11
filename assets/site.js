(() => {
  const repository = "moonlaunchermc/moonlauncher";
  const platformRules = {
    windows: /\.exe$/i,
    linux: /\.appimage$/i
  };
  const menuButton = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".main-nav");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const scrollProgress = document.createElement("div");
  scrollProgress.className = "scroll-progress";
  scrollProgress.setAttribute("aria-hidden", "true");
  document.body.append(scrollProgress);
  let scrollFrame = 0;
  const updateScrollProgress = () => {
    scrollFrame = 0;
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0;
    scrollProgress.style.transform = `scaleX(${progress})`;
  };
  window.addEventListener("scroll", () => {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollProgress);
  }, { passive: true });
  window.addEventListener("resize", updateScrollProgress, { passive: true });
  updateScrollProgress();

  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    const revealTargets = document.querySelectorAll("main .section-heading, main .feature-card, main .why-item, main .loader, main .platform-card, main .surface-card, main .release-card, main .doc-section, main .faq-item, main .about-panel, main .cta");
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });
    revealTargets.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-index", String(index % 5));
      revealObserver.observe(element);
    });
  }

  if (menuButton && navigation) {
    const closeMenu = () => {
      navigation.classList.remove("open");
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Buka menu");
    };
    menuButton.addEventListener("click", () => {
      const isOpen = menuButton.getAttribute("aria-expanded") === "true";
      menuButton.setAttribute("aria-expanded", String(!isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Buka menu" : "Tutup menu");
      navigation.classList.toggle("open", !isOpen);
    });
    navigation.addEventListener("click", event => {
      if (event.target.closest("a")) closeMenu();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth > 780) closeMenu();
    });
  }

  document.querySelectorAll("[data-year]").forEach(element => {
    element.textContent = new Date().getFullYear();
  });

  const search = document.querySelector("[data-doc-search]");
  if (search) {
    const sections = [...document.querySelectorAll(".doc-section")];
    const status = document.querySelector("[data-search-status]");
    search.addEventListener("input", () => {
      const term = search.value.trim().toLocaleLowerCase();
      let visible = 0;
      sections.forEach(section => {
        const matches = !term || section.textContent.toLocaleLowerCase().includes(term);
        section.hidden = !matches;
        if (matches) visible++;
      });
      if (status) status.textContent = term ? `${visible} bagian ditemukan` : "Cari topik dokumentasi";
    });
    document.querySelectorAll(".docs-sidebar a").forEach(link => {
      link.addEventListener("click", () => {
        document.querySelectorAll(".docs-sidebar a").forEach(item => item.classList.remove("active"));
        link.classList.add("active");
      });
    });
  }

  const formatDate = value => {
    if (!value) return "Tanggal tidak tersedia";
    return new Intl.DateTimeFormat("en", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(value));
  };
  const makeIcon = path => `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="${path}" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const downloadIcon = makeIcon("M12 3v12m0 0 4-4m-4 4-4-4M5 17v3h14v-3");

  async function getReleases() {
    const response = await fetch(`https://api.github.com/repos/${repository}/releases?per_page=30`, {
      headers: { Accept: "application/vnd.github+json" }
    });
    if (!response.ok) throw new Error(`GitHub API ${response.status}`);
    const releases = await response.json();
    if (!Array.isArray(releases)) throw new Error("Invalid release response");
    return releases.filter(release => !release.draft && release.assets?.some(asset => Object.values(platformRules).some(rule => rule.test(asset.name))));
  }

  function makeAssetLink(asset) {
    const link = document.createElement("a");
    link.className = "asset-link";
    link.href = asset.browser_download_url;
    link.setAttribute("download", asset.name);
    link.setAttribute("aria-label", `Download ${asset.name}`);
    const name = document.createElement("span");
    name.textContent = asset.name;
    const icon = document.createElement("span");
    icon.innerHTML = downloadIcon;
    link.append(name, icon);
    return link;
  }

  function latestAssetRelease(releases, platform) {
    return releases.find(release => release.assets?.some(asset => platformRules[platform].test(asset.name)));
  }

  function renderDownloadPage(releases) {
    document.querySelectorAll("[data-download-platform]").forEach(card => {
      const platform = card.dataset.downloadPlatform;
      const target = card.querySelector("[data-assets]");
      const state = card.querySelector("[data-platform-release]");
      if (!target || !platformRules[platform]) return;
      const release = latestAssetRelease(releases, platform);
      target.replaceChildren();
      if (!release) {
        const empty = document.createElement("p");
        empty.className = "empty-release";
        empty.textContent = "No official release available yet.";
        const button = document.createElement("button");
        button.className = "button-disabled";
        button.disabled = true;
        button.textContent = "Coming Soon";
        target.append(empty, button);
        if (state) state.textContent = "No release";
        return;
      }
      release.assets.filter(asset => platformRules[platform].test(asset.name)).forEach(asset => target.append(makeAssetLink(asset)));
      if (state) state.textContent = `${release.tag_name} · ${formatDate(release.published_at || release.created_at)}`;
    });

    const status = document.querySelector("[data-release-state]");
    if (status) {
      const available = Object.keys(platformRules).filter(platform => latestAssetRelease(releases, platform));
      status.textContent = available.length ? `${available.length} platform release${available.length === 1 ? "" : "s"} available` : "No official release available yet.";
    }
  }

  function renderChangelog(releases) {
    const target = document.querySelector("[data-changelog]");
    if (!target) return;
    target.replaceChildren();
    if (!releases.length) {
      const empty = document.createElement("div");
      empty.className = "surface-card";
      const title = document.createElement("h2");
      title.textContent = "No releases published yet";
      const text = document.createElement("p");
      text.textContent = "Official versions and their notes will appear here when the project publishes a GitHub Release.";
      empty.append(title, text);
      target.append(empty);
      return;
    }
    releases.forEach(release => {
      const article = document.createElement("article");
      article.className = "release-card";
      const head = document.createElement("div");
      head.className = "release-card-head";
      const title = document.createElement("h2");
      title.textContent = release.name || release.tag_name || "Release";
      const time = document.createElement("time");
      time.dateTime = release.published_at || release.created_at;
      time.textContent = formatDate(release.published_at || release.created_at);
      head.append(title, time);
      const tag = document.createElement("span");
      tag.className = "release-tag";
      tag.textContent = release.tag_name || "Release";
      article.append(head, tag);
      if (release.body) {
        const body = document.createElement("p");
        body.className = "release-body";
        body.textContent = release.body.trim().slice(0, 1800);
        article.append(body);
      }
      if (release.assets?.length) {
        const assets = document.createElement("div");
        assets.className = "release-assets";
        release.assets.filter(asset => Object.values(platformRules).some(rule => rule.test(asset.name))).forEach(asset => {
          const link = document.createElement("a");
          link.href = asset.browser_download_url;
          link.textContent = asset.name;
          link.setAttribute("download", asset.name);
          assets.append(link);
        });
        article.append(assets);
      }
      const source = document.createElement("a");
      source.className = "text-button";
      source.href = release.html_url;
      source.target = "_blank";
      source.rel = "noreferrer";
      source.textContent = "View official release notes ↗";
      article.append(source);
      target.append(article);
    });
  }

  const downloadsRoot = document.querySelector("[data-downloads-root]");
  const changelogRoot = document.querySelector("[data-changelog]");
  if (downloadsRoot || changelogRoot) {
    const state = document.querySelector("[data-release-state]");
    let cachedReleases = null;
    let renderedSignature = "";
    const makeReleaseSignature = releases => JSON.stringify(releases.map(release => [
      release.id,
      release.body,
      release.assets?.map(asset => [asset.id, asset.name, asset.updated_at]) || []
    ]));

    const refreshReleases = async () => {
      try {
        const releases = await getReleases();
        cachedReleases = releases;
        const signature = makeReleaseSignature(releases);
        if (signature !== renderedSignature) {
          renderDownloadPage(releases);
          renderChangelog(releases);
          renderedSignature = signature;
        }
        if (state) {
          const checkedAt = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date());
          state.textContent = `${Object.keys(platformRules).filter(platform => latestAssetRelease(releases, platform)).length} platform releases · Checked ${checkedAt}`;
        }
      } catch {
        if (cachedReleases) {
          if (state) state.textContent = "Could not refresh · showing last checked releases";
          return;
        }
        if (state) state.textContent = "Unable to check GitHub Releases";
        document.querySelectorAll("[data-download-platform]").forEach(card => {
          const target = card.querySelector("[data-assets]");
          if (!target) return;
          const empty = document.createElement("p");
          empty.className = "empty-release";
          empty.textContent = "Unable to load official releases right now.";
          const link = document.createElement("a");
          link.href = `https://github.com/${repository}/releases`;
          link.textContent = "View releases on GitHub";
          link.target = "_blank";
          link.rel = "noreferrer";
          target.replaceChildren(empty, link);
        });
        if (changelogRoot) {
          const fallback = document.createElement("p");
          fallback.className = "empty-release";
          fallback.textContent = "Unable to load release history. Visit the official GitHub Releases page.";
          changelogRoot.replaceChildren(fallback);
        }
      }
    };

    refreshReleases();
    window.setInterval(() => {
      if (!document.hidden) refreshReleases();
    }, 120000);
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) refreshReleases();
    });
  }
})();