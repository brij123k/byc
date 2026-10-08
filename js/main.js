/* BYC – Careers in Design landing page */
(function () {
  "use strict";

  // Set this to your form backend (Google Apps Script, Formspree, CRM webhook, etc.).
  // While empty, submissions are only logged to the console.
  const FORM_ENDPOINT = "";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ---------- Header shadow + sticky mobile CTA ---------- */
  const header = $(".site-header");
  const stickyCta = $("#stickyCta");
  const registerSection = $("#register");

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);

    const formTop = registerSection.getBoundingClientRect().top;
    const formBottom = registerSection.getBoundingClientRect().bottom;
    const formVisible = formTop < window.innerHeight && formBottom > 0;
    stickyCta.classList.toggle("show", y > 500 && !formVisible);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          revealObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  $$(".reveal").forEach((el) => revealObserver.observe(el));

  /* ---------- Countdown ---------- */
  const countdown = $("#countdown");
  const target = new Date(countdown.dataset.target).getTime();
  const units = {
    days: $('[data-unit="days"]', countdown),
    hours: $('[data-unit="hours"]', countdown),
    minutes: $('[data-unit="minutes"]', countdown),
    seconds: $('[data-unit="seconds"]', countdown),
  };
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = Math.max(0, target - Date.now());
    units.days.textContent = pad(Math.floor(diff / 86400000));
    units.hours.textContent = pad(Math.floor((diff / 3600000) % 24));
    units.minutes.textContent = pad(Math.floor((diff / 60000) % 60));
    units.seconds.textContent = pad(Math.floor((diff / 1000) % 60));
    if (diff === 0) {
      countdown.classList.add("ended");
      clearInterval(timer);
    }
  }
  const timer = setInterval(tick, 1000);
  tick();

  /* ---------- Animated counters ---------- */
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const el = e.target;
        const to = Number(el.dataset.to);
        const suffix = el.dataset.suffix || "";
        const duration = 1600;
        const start = performance.now();
        function step(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(to * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$(".count").forEach((el) => counterObserver.observe(el));

  /* ---------- Success wall filters ---------- */
  const filters = $$(".filter");
  const wallItems = $$(".wall-item");

  filters.forEach((btn) =>
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const f = btn.dataset.filter;
      wallItems.forEach((item) => {
        const cats = item.dataset.cat.split(" ");
        item.classList.toggle("hide", f !== "all" && !cats.includes(f));
      });
    })
  );

  /* ---------- Lightbox ---------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  let current = 0;

  const visibleItems = () => wallItems.filter((i) => !i.classList.contains("hide"));

  function openLightbox(index) {
    const items = visibleItems();
    current = (index + items.length) % items.length;
    const img = $("img", items[current]);
    lbImg.src = img.src;
    lbImg.alt = img.alt;
    lightbox.classList.add("open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeLightbox() {
    lightbox.classList.remove("open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  wallItems.forEach((item) =>
    item.addEventListener("click", () => openLightbox(visibleItems().indexOf(item)))
  );
  $(".lb-close").addEventListener("click", closeLightbox);
  $(".lb-prev").addEventListener("click", (e) => { e.stopPropagation(); openLightbox(current - 1); });
  $(".lb-next").addEventListener("click", (e) => { e.stopPropagation(); openLightbox(current + 1); });
  lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!lightbox.classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") openLightbox(current - 1);
    if (e.key === "ArrowRight") openLightbox(current + 1);
  });

  /* ---------- Registration form ---------- */
  const form = $("#regForm");
  const msg = $("#formMsg");
  const submitBtn = $("#submitBtn");
  const phoneInput = $("#phone");

  phoneInput.addEventListener("input", () => {
    phoneInput.value = phoneInput.value.replace(/\D/g, "").slice(0, 15);
  });

  function setMsg(text, ok = false) {
    msg.textContent = text;
    msg.classList.toggle("ok", ok);
  }

  function validate() {
    let valid = true;
    $$("[required]", form).forEach((input) => {
      const field = input.closest(".field");
      let ok = input.value.trim() !== "";
      if (ok && input.type === "email") ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (ok && input.id === "phone") ok = input.value.length >= 7;
      field.classList.toggle("invalid", !ok);
      if (!ok) valid = false;
    });
    return valid;
  }

  $$("input, select", form).forEach((el) =>
    el.addEventListener("input", () => el.closest(".field")?.classList.remove("invalid"))
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validate()) {
      setMsg("Please fill all the required fields!");
      $(".field.invalid input, .field.invalid select", form)?.focus();
      return;
    }
    if (!$("#terms").checked) {
      setMsg("Please accept terms and conditions to proceed.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    data.event = "CCS – Careers in Design | Hyderabad | 10 Oct 2026";
    data.submittedAt = new Date().toISOString();

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait…";
    setMsg("");

    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error("Request failed: " + res.status);
      } else {
        console.log("Registration (no FORM_ENDPOINT set):", data);
      }

      form.innerHTML = `
        <div class="form-success">
          <div class="tick">✓</div>
          <h3>You're registered, ${escapeHtml(data.fullName.split(" ")[0])}!</h3>
          <p>We've saved your seat for <strong>Careers in Design</strong> on Sat, 10 Oct 2026 at 1:30 PM IST, Hyatt Place, Hyderabad.
          Our team will reach out to you shortly.</p>
        </div>`;
    } catch (err) {
      console.error(err);
      setMsg("Something went wrong. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit";
    }
  });

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
