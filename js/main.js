/* BYC – Top Singapore Universities webinar landing page */
(function () {
  "use strict";

  // FormSubmit delivers registrations and the attendee confirmation email.
  const FORM_ENDPOINT = "https://formsubmit.co/bookyourcampus@gmail.com";
  const WHATSAPP_GROUP_LINK = "{{WhatsApp Group Link}}";

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
  const countdownLabel = $(".countdown-label", countdown);
  const events = JSON.parse(countdown.dataset.events).map(([label, at]) => ({ label, at: new Date(at).getTime() }));
  const units = {
    days: $('[data-unit="days"]', countdown),
    hours: $('[data-unit="hours"]', countdown),
    minutes: $('[data-unit="minutes"]', countdown),
    seconds: $('[data-unit="seconds"]', countdown),
  };
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    // Count down to the next event; once all have started, stay on the last one.
    const next = events.find((ev) => ev.at > Date.now()) || events[events.length - 1];
    countdownLabel.textContent = next.label;
    const diff = Math.max(0, next.at - Date.now());
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

  /* ---------- Lightbox (Singapore admits wall) ---------- */
  const wallItems = $$(".wall-item");
  const lightbox = $("#lightbox");
  const lbImg = $("#lbImg");
  let current = 0;

  function openLightbox(index) {
    current = (index + wallItems.length) % wallItems.length;
    const img = $("img", wallItems[current]);
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

  wallItems.forEach((item, i) => item.addEventListener("click", () => openLightbox(i)));
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

  // Event links (hero cards, Hyderabad section) pre-select the matching option in the form.
  $$("a[data-attend]").forEach((link) =>
    link.addEventListener("click", () => {
      const radio = $(`input[name="attend"][value="${link.dataset.attend}"]`, form);
      if (radio) radio.checked = true;
    })
  );


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

  form.addEventListener("submit", (e) => {
    if (!validate()) {
      e.preventDefault();
      setMsg("Please fill all the required fields!");
      $(".field.invalid input, .field.invalid select", form)?.focus();
      return;
    }
    if (!$("#terms").checked) {
      e.preventDefault();
      setMsg("Please accept terms and conditions to proceed.");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());
    const response = `Dear ${data.parentName},\n\nThank you for registering for the BookYourCampus Singapore UG Admissions Session.\n\nYour seat is confirmed. Please find the event details below:\n\nDate: 17 October 2026\nTime: 10 AM – 6 PM\nLocation: Bangalore\n\nDuring the session, you can connect with the BYC team to understand university selection, admissions expectations, profile building and application strategy for Singapore universities.\n\nJoin the WhatsApp group for event updates:\n${WHATSAPP_GROUP_LINK}\n\nWe look forward to meeting you and helping you plan your child’s undergraduate journey.\n\nRegards,\nTeam BookYourCampus (BYC)\nwww.bookyourcampus.com`;
    form.action = FORM_ENDPOINT;
    form.method = "POST";
    ["_autoresponse", "_subject", "_template", "_replyto"].forEach((name) => {
      let field = form.querySelector(`[name="${name}"]`);
      if (!field) {
        field = document.createElement("input");
        field.type = "hidden";
        field.name = name;
        form.appendChild(field);
      }
      field.value = name === "_autoresponse" ? response : name === "_subject" ? "Your BookYourCampus Singapore UG Admissions Session is confirmed" : name === "_replyto" ? data.email : "table";
    });
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";
    setMsg("");
    remember(REGISTERED_KEY);
  });

  /* ---------- Registration popup ---------- */
  // Opens shortly after every page load / refresh (but not once the visitor has registered).
  // The real form is moved into the popup and put back in #register when it closes.
  const POPUP_DELAY_MS = 3000;
  const REGISTERED_KEY = "byc_registered";
  const popup = $("#popup");
  const popupSlot = $(".popup-slot", popup);
  const formHome = form.parentNode;
  const formNext = form.nextSibling;
  let lastFocus = null;

  function remember(key) {
    try { sessionStorage.setItem(key, "1"); } catch (e) { /* storage unavailable */ }
  }
  function recalled(key) {
    try { return sessionStorage.getItem(key) === "1"; } catch (e) { return false; }
  }

  function openPopup() {
    if (popup.classList.contains("open")) return;
    lastFocus = document.activeElement;
    form.classList.add("in");
    popupSlot.appendChild(form);
    popup.classList.add("open");
    popup.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    $(".popup-close", popup).focus();
  }
  function closePopup() {
    if (!popup.classList.contains("open")) return;
    formHome.insertBefore(form, formNext);
    popup.classList.remove("open");
    popup.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    lastFocus?.focus?.();
  }

  // Every "Save Your Spot" / "Reserve Your Session" link opens the popup instead of scrolling to the form.
  $$('a[href="#register"]').forEach((link) =>
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openPopup();
    })
  );

  $(".popup-close", popup).addEventListener("click", closePopup);
  popup.addEventListener("click", (e) => { if (e.target === popup) closePopup(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopup(); });

  if (!recalled(REGISTERED_KEY)) setTimeout(openPopup, POPUP_DELAY_MS);

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
