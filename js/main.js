/* Les Jardins de l'Agout · Refonte
   SECTION 1 · Navbar : état au défilement, masquage intelligent, menu mobile, lien actif. */
(() => {
  const nav = document.querySelector(".nav");
  const toggle = document.querySelector(".nav__toggle");
  const menu = document.getElementById("menu");
  const behind = [document.getElementById("contenu"), document.querySelector(".footer")].filter(Boolean);
  if (!nav || !toggle || !menu) return;

  /* ---------- 1. Fond clair après 40 px, masquage en descendant ---------- */
  let lastY = window.scrollY;
  let ticking = false;

  const onScroll = () => {
    const y = window.scrollY;
    nav.dataset.state = y > 40 ? "scrolled" : "top";

    if (!nav.classList.contains("is-open")) {
      const goingDown = y > lastY;
      nav.classList.toggle("is-hidden", goingDown && y > 320);
    }
    lastY = y;
    ticking = false;
  };
  window.addEventListener("scroll", () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });
  onScroll();

  // Le clavier ne doit jamais tomber sur une barre cachée
  nav.addEventListener("focusin", () => nav.classList.remove("is-hidden"));

  /* ---------- 2. Menu mobile ---------- */
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    menu.classList.toggle("is-open", open);
    menu.inert = !open;
    behind.forEach((el) => { el.inert = open; });
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a")?.focus({ preventScroll: true });
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && nav.classList.contains("is-open")) { setOpen(false); toggle.focus(); }
  });
  // Repasser en desktop referme le menu
  matchMedia("(min-width: 961px)").addEventListener("change", (e) => e.matches && setOpen(false));

  /* ---------- 3. Lien actif selon la section visible ---------- */
  const links = [...document.querySelectorAll(".nav__link")];
  const sections = links
    .map((l) => document.querySelector(l.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.toggle("is-active", l.getAttribute("href") === "#" + en.target.id));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    sections.forEach((s) => io.observe(s));

    // En haut de page, aucun lien actif
    window.addEventListener("scroll", () => {
      if (window.scrollY < window.innerHeight * 0.5) links.forEach((l) => l.classList.remove("is-active"));
    }, { passive: true });
  }
})();

/* SECTION 3 · Points du carrousel mobile des prestations */
(() => {
  const track = document.querySelector(".services");
  if (!track) return;
  const cards = [...track.children];
  const dots = document.createElement("div");
  dots.className = "services__dots";
  dots.setAttribute("aria-label", "Choisir une prestation");
  cards.forEach((card, i) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "services__dot";
    b.setAttribute("aria-label", `Prestation ${i + 1} sur ${cards.length}`);
    b.addEventListener("click", () => track.scrollTo({ left: card.offsetLeft - track.offsetLeft - parseFloat(getComputedStyle(track).paddingLeft), behavior: "smooth" }));
    dots.append(b);
  });
  track.after(dots);

  const buttons = [...dots.children];
  const update = () => {
    const max = track.scrollWidth - track.clientWidth;
    const step = cards[1] ? cards[1].offsetLeft - cards[0].offsetLeft : 1;
    const i = track.scrollLeft >= max - 4 ? cards.length - 1 : Math.round(track.scrollLeft / step);
    buttons.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
  };
  let raf = 0;
  track.addEventListener("scroll", () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); }, { passive: true });
  update();
})();

/* SECTION 4 · Visionneuse de la galerie */
(() => {
  const box = document.querySelector(".lightbox");
  const buttons = [...document.querySelectorAll(".work__btn")];
  if (!box || !buttons.length || typeof box.showModal !== "function") return;

  const img = box.querySelector(".lightbox__img");
  const cap = box.querySelector(".lightbox__cap");
  let index = 0;
  let opener = null;

  const render = (i) => {
    index = (i + buttons.length) % buttons.length;
    const b = buttons[index];
    const thumb = b.querySelector("img");
    img.classList.remove("is-swapping");
    void img.offsetWidth; // relance l'animation
    img.src = b.dataset.full;
    img.alt = thumb.alt;
    img.classList.add("is-swapping");
    const title = b.querySelector(".work__cap strong").textContent;
    const meta = b.querySelector(".work__cap span").textContent;
    cap.innerHTML = "";
    cap.append(title);
    const small = document.createElement("span");
    small.textContent = `${meta} · ${index + 1} / ${buttons.length}`;
    cap.append(small);
  };

  buttons.forEach((b, i) => b.addEventListener("click", () => {
    opener = b;
    render(i);
    box.showModal();
    document.documentElement.style.overflow = "hidden";
  }));

  box.addEventListener("close", () => {
    document.documentElement.style.overflow = "";
    opener?.focus();
  });
  box.querySelector(".lightbox__close").addEventListener("click", () => box.close());
  box.querySelector(".lightbox__prev").addEventListener("click", () => render(index - 1));
  box.querySelector(".lightbox__next").addEventListener("click", () => render(index + 1));
  // Clic sur le fond : fermeture
  box.addEventListener("click", (e) => { if (e.target === box || e.target.classList.contains("lightbox__fig")) box.close(); });
  box.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") render(index - 1);
    if (e.key === "ArrowRight") render(index + 1);
  });

  // Balayage tactile
  let x0 = null;
  box.addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  box.addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) render(index + (dx < 0 ? 1 : -1));
    x0 = null;
  });
})();

/* SECTION 5 · Formulaire de devis (démo : rien n'est envoyé) */
(() => {
  const form = document.getElementById("devis-form");
  if (!form) return;
  const success = form.parentElement.querySelector(".form__success");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const phoneRe = /^(?:(?:\+|00)33\s?|0)[1-9](?:[\s.-]?\d{2}){4}$/;

  const rules = {
    nom: (f) => f.nom.value.trim().length < 2 ? "Indiquez votre nom." : "",
    contact: (f) => {
      const v = f.contact.value.trim();
      if (!v) return "Indiquez un téléphone ou un e-mail.";
      return emailRe.test(v) || phoneRe.test(v) ? "" : "Ce numéro ou cet e-mail semble incomplet.";
    },
    projet: (f) => f.querySelector("[name=projet]:checked") ? "" : "Choisissez un type de projet.",
  };

  const check = (name) => {
    const msg = rules[name](form);
    const err = document.getElementById("e-" + name);
    const input = form.querySelector(`[name=${name}]`);
    err.textContent = msg;
    input.closest(".field").classList.toggle("has-error", !!msg);
    form.querySelectorAll(`[name=${name}]`).forEach((el) => {
      el.setAttribute("aria-invalid", msg ? "true" : "false");
      el.setAttribute("aria-describedby", "e-" + name);
    });
    return !msg;
  };

  // Une fois signalée, l'erreur se met à jour pendant la saisie
  Object.keys(rules).forEach((name) => {
    form.querySelectorAll(`[name=${name}]`).forEach((el) =>
      el.addEventListener(el.type === "radio" ? "change" : "input", () => {
        if (el.getAttribute("aria-invalid") === "true" || el.type === "radio") check(name);
      }));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { form.querySelector('[aria-invalid="true"]')?.focus(); return; }
    // La carte garde sa hauteur : pas de saut de mise en page
    const card = form.parentElement;
    card.style.minHeight = card.offsetHeight + "px";
    form.hidden = true;
    success.hidden = false;
    success.focus();
  });
})();

/* SECTION 6 · Année du copyright */
document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });

/* Apparition des blocs au défilement (uniquement si les animations sont autorisées) */
(() => {
  const items = document.querySelectorAll("[data-reveal]");
  const show = (el) => el.classList.add("is-in");
  if (!document.documentElement.classList.contains("motion") || !("IntersectionObserver" in window)) {
    items.forEach(show);
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { show(en.target); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  items.forEach((el) => io.observe(el));
})();
