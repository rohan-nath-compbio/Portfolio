(() => {
  "use strict";

  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const supports = (property, value) => window.CSS && CSS.supports(property, value);
  const prefersReducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  const html = document.documentElement;
  const storageKey = "rn-theme";

  const storage = {
    get() {
      try {
        return localStorage.getItem(storageKey);
      } catch {
        return null;
      }
    },
    set(value) {
      try {
        localStorage.setItem(storageKey, value);
      } catch {
        /* Ignore private browsing and file permission storage failures. */
      }
    },
  };

  function setTheme(theme, { animate = false, persist = false } = {}) {
    const apply = () => {
      html.dataset.theme = theme;
      if (persist) storage.set(theme);
      const isDark = theme === "dark";
      const color = isDark ? "#111111" : "#fbfbfa";
      $$('meta[name="theme-color"]').forEach((meta) => meta.setAttribute("content", color));
      $("#themeBtn")?.setAttribute("aria-checked", String(isDark));
    };

    if (animate && document.startViewTransition && !prefersReducedMotion()) {
      document.startViewTransition(apply);
      return;
    }

    apply();
  }

  function initTheme() {
    const darkQuery = matchMedia("(prefers-color-scheme: dark)");
    const savedTheme = storage.get();
    setTheme(savedTheme || (darkQuery.matches ? "dark" : "light"));

    $("#themeBtn")?.addEventListener("click", () => {
      const next = html.dataset.theme === "dark" ? "light" : "dark";
      setTheme(next, { animate: true, persist: true });
    });

    const onSystemChange = (event) => {
      if (storage.get()) return;
      setTheme(event.matches ? "dark" : "light");
    };

    if (darkQuery.addEventListener) {
      darkQuery.addEventListener("change", onSystemChange);
    } else if (darkQuery.addListener) {
      darkQuery.addListener(onSystemChange);
    }
  }

  function initNavigation() {
    const hamburger = $("#hamburger");
    const navMenu = $("#navMenu");
    const navLinks = $$(".nav-link");
    const mobileQuery = matchMedia("(max-width: 720px)");

    if (!hamburger || !navMenu) return;

    const menuLinks = $$("a", navMenu);

    const closeNav = ({ restoreFocus = false } = {}) => {
      const wasOpen = navMenu.classList.contains("open");
      if (!wasOpen) return;
      navMenu.classList.remove("open");
      hamburger.setAttribute("aria-expanded", "false");
      if (restoreFocus) hamburger.focus();
    };

    const toggleNav = () => {
      const isOpen = navMenu.classList.toggle("open");
      hamburger.setAttribute("aria-expanded", String(isOpen));
    };

    hamburger.addEventListener("click", toggleNav);

    document.addEventListener("click", (event) => {
      if (!navMenu.classList.contains("open")) return;
      const target = event.target;
      if (target instanceof Node && !hamburger.contains(target) && !navMenu.contains(target)) {
        closeNav();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeNav({ restoreFocus: true });
    });

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", () => closeNav());
    } else if (mobileQuery.addListener) {
      mobileQuery.addListener(() => closeNav());
    }

    menuLinks.forEach((link) => link.addEventListener("click", () => closeNav()));

    const sections = $$("section[id]");
    const header = $(".header");

    const updateActiveNav = () => {
      if (!sections.length) return;
      const headerHeight = header ? header.getBoundingClientRect().height : 68;
      const nearBottom =
        Math.ceil(window.scrollY + window.innerHeight) >=
        document.documentElement.scrollHeight - 40;

      let activeId = sections[0].id;
      if (nearBottom) {
        activeId = sections[sections.length - 1].id;
      } else {
        const triggerY = headerHeight + 140;
        for (const section of sections) {
          if (section.getBoundingClientRect().top <= triggerY) {
            activeId = section.id;
          }
        }
      }

      navLinks.forEach((link) => {
        if (link.getAttribute("href") === `#${activeId}`) {
          link.setAttribute("aria-current", "location");
        } else {
          link.removeAttribute("aria-current");
        }
      });
    };

    addEventListener("scroll", updateActiveNav, { passive: true });
    addEventListener("resize", updateActiveNav, { passive: true });
    updateActiveNav();
  }

  function initReveal() {
    const revealItems = $$(".reveal");
    if (!revealItems.length) return;

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -24px 0px" },
    );

    revealItems.forEach((item) => observer.observe(item));
  }

  function initProgress() {
    const bar = $(".progress-bar");
    if (!bar) return;

    if (supports("animation-timeline", "scroll()")) {
      bar.dataset.cssDriven = "";
      return;
    }

    const update = () => {
      const maxScroll = document.documentElement.scrollHeight - innerHeight;
      const ratio = maxScroll > 0 ? Math.min(1, Math.max(0, scrollY / maxScroll)) : 0;
      bar.style.setProperty("--progress", String(ratio));
    };

    addEventListener("scroll", update, { passive: true });
    addEventListener("resize", update, { passive: true });
    update();
  }

  function initGallery() {
    const track = $("#galleryTrack");
    const dots = $("#galleryDots");
    const lightbox = $("#galleryLightbox");
    if (!track) return;

    const cards = $$(".gallery-card", track);
    if (!cards.length) return;

    let current = 0;

    if (dots) {
      const syncDots = () => {
        $$(".gallery-dot", dots).forEach((dot, index) => {
          const active = index === current;
          dot.classList.toggle("active", active);
          if (active) dot.setAttribute("aria-current", "true");
          else dot.removeAttribute("aria-current");
        });
      };

      const scrollToCard = (index) => {
        current = (index + cards.length) % cards.length;
        track.scrollTo({
          left: cards[current].offsetLeft - track.offsetLeft,
          behavior: prefersReducedMotion() ? "auto" : "smooth",
        });
        syncDots();
      };

      cards.forEach((_, index) => {
        const dot = document.createElement("button");
        dot.className = `gallery-dot${index === 0 ? " active" : ""}`;
        dot.type = "button";
        dot.setAttribute("aria-label", `View photo ${index + 1}`);
        if (index === 0) dot.setAttribute("aria-current", "true");
        dot.addEventListener("click", () => scrollToCard(index));
        dots.appendChild(dot);
      });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            current = cards.indexOf(entry.target);
            syncDots();
          });
        },
        { root: track, threshold: 0.6 },
      );

      cards.forEach((card) => observer.observe(card));
    }

    if (!(lightbox instanceof HTMLDialogElement)) return;

    const imgEl = $("#lightboxImg");
    const captionEl = $("#lightboxCaption");
    const closeBtn = $("#lightboxClose");
    const prevBtn = $("#lightboxPrev");
    const nextBtn = $("#lightboxNext");
    let activeIndex = 0;

    const showSlide = (index) => {
      activeIndex = (index + cards.length) % cards.length;
      const card = cards[activeIndex];
      const thumbImg = $("img", card);
      if (imgEl) {
        imgEl.src = card.dataset.full || thumbImg?.src || "";
        imgEl.alt = thumbImg?.alt || card.dataset.caption || "";
      }
      if (captionEl) {
        captionEl.textContent = card.dataset.caption || "";
      }
    };

    cards.forEach((card, index) => {
      card.addEventListener("click", () => {
        showSlide(index);
        lightbox.showModal();
      });
    });

    closeBtn?.addEventListener("click", () => lightbox.close());
    prevBtn?.addEventListener("click", () => showSlide(activeIndex - 1));
    nextBtn?.addEventListener("click", () => showSlide(activeIndex + 1));

    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) lightbox.close();
    });

    lightbox.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1);
      }
    });
  }

  function initPublicationFilters() {
    const filters = $("#publicationFilters");
    if (!filters) return;

    const groups = $$(".year-heading").map((heading) => ({
      year: heading.textContent.trim(),
      heading,
      list: heading.nextElementSibling,
      count: heading.nextElementSibling?.querySelectorAll(".pub-item").length || 0,
    })).filter(({ list }) => list?.classList.contains("pub-list"));

    if (groups.length < 2) return;

    const totalCount = groups.reduce((sum, group) => sum + group.count, 0);
    const options = [
      { key: "All", label: `All (${totalCount})` },
      ...groups.map(({ year, count }) => ({ key: year, label: `${year} (${count})` })),
    ];

    const buttons = options.map(({ key, label }, index) => {
      const button = document.createElement("button");
      button.className = "publication-filter";
      button.type = "button";
      button.textContent = label;
      button.setAttribute("aria-pressed", String(index === 0));
      button.addEventListener("click", () => {
        const showAll = key === "All";
        groups.forEach(({ year, heading, list }) => {
          const visible = showAll || year === key;
          heading.hidden = !visible;
          list.hidden = !visible;
          if (visible) {
            heading.classList.add("visible");
            $$(".reveal", list).forEach((item) => item.classList.add("visible"));
          }
        });
        buttons.forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      });
      return button;
    });

    filters.setAttribute("role", "group");
    filters.append(...buttons);
  }

  function initContactEmails() {
    const items = $$(".email-item[data-user][data-domain]");
    if (!items.length) return;

    items.forEach((item) => {
      const user = item.dataset.user;
      const domain = item.dataset.domain;
      if (!user || !domain) return;

      const email = `${user}@${domain}`;
      const link = $(".email-link", item);
      const textEl = $(".email-text", item);
      const copyBtn = $(".copy-btn", item);

      if (link) link.setAttribute("href", `mailto:${email}`);
      if (textEl) textEl.textContent = email;

      if (!copyBtn) return;

      let resetTimer = 0;
      const useEl = $("use", copyBtn);
      const labelEl = $(".copy-label", copyBtn);

      copyBtn.addEventListener("click", async () => {
        let copied = false;
        try {
          if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(email);
            copied = true;
          }
        } catch {
          copied = false;
        }

        if (!copied) {
          const helper = document.createElement("textarea");
          helper.value = email;
          helper.setAttribute("readonly", "");
          helper.style.position = "fixed";
          helper.style.opacity = "0";
          document.body.appendChild(helper);
          helper.select();
          try {
            copied = document.execCommand("copy");
          } catch {
            copied = false;
          }
          document.body.removeChild(helper);
        }

        if (!copied) return;

        copyBtn.dataset.copied = "true";
        if (useEl) useEl.setAttribute("href", "#icon-check");
        if (labelEl) labelEl.textContent = "Copied";
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => {
          delete copyBtn.dataset.copied;
          if (useEl) useEl.setAttribute("href", "#icon-copy");
          if (labelEl) labelEl.textContent = "Copy";
        }, 1800);
      });
    });
  }

  function initBackToTop() {
    const backTop = $("#backTop");
    const logoTopLink = $("#logoTopLink");

    const scrollTop = (event) => {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion() ? "auto" : "smooth",
      });
    };

    logoTopLink?.addEventListener("click", scrollTop);

    if (!backTop) return;
    backTop.addEventListener("click", scrollTop);

    const update = () => backTop.classList.toggle("visible", scrollY > 400);
    addEventListener("scroll", update, { passive: true });
    update();
  }

  initTheme();
  initNavigation();
  initReveal();
  initProgress();
  initGallery();
  initPublicationFilters();
  initContactEmails();
  initBackToTop();
})();
