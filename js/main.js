/* BYC – Top Singapore Universities webinar landing page */
(function () {
  "use strict";

  // Registrations are emailed to bookyourcampus@gmail.com via FormSubmit (formsubmit.co).
  // The very first submission from the live site sends an activation email to that inbox;
  // click "Activate Form" in it, and every registration after that arrives as an email.
  // Set to "" to only log submissions to the console.
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/bookyourcampus@gmail.com";

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
  const submitLabel = submitBtn.textContent;
  const phoneInput = $("#phone");

  // Event links (hero cards, Hyderabad section) pre-select the matching option in the form.
  $$("a[data-attend]").forEach((link) =>
    link.addEventListener("click", () => {
      const radio = $(`input[name="attend"][value="${link.dataset.attend}"]`, form);
      if (radio) radio.checked = true;
    })
  );

  const EVENTS = {
    webinar: "the Online Webinar on Saturday, 10 Oct 2026 at 8:00 PM IST. We'll send the webinar access details to",
    hyderabad: "the in-person session in Hyderabad on Sunday, 18 Oct 2026 (10 AM – 6 PM). We'll send your session confirmation to",
    both: "the Online Webinar (10 Oct, 8:00 PM IST) and the Hyderabad session (18 Oct, 10 AM – 6 PM). We'll send the details to",
  };
  const EVENT_NAMES = {
    webinar: "Top Singapore Universities | Online Webinar | 10 Oct 2026, 8:00 PM",
    hyderabad: "Top Singapore Universities | Hyderabad In-Person | 18 Oct 2026, 10 AM – 6 PM",
    both: "Top Singapore Universities | Online 10 Oct 2026 + Hyderabad 18 Oct 2026",
  };

  const ATTEND_LABELS = { webinar: "Online Webinar", hyderabad: "Hyderabad In-Person", both: "Both" };

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
    data.event = EVENT_NAMES[data.attend];
    data.submittedAt = new Date().toISOString();

    submitBtn.disabled = true;
    submitBtn.textContent = "Please wait…";
    setMsg("");

    try {
      if (FORM_ENDPOINT) {
        const res = await fetch(FORM_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(toEmail(data)),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || String(json.success) === "false") {
          throw new Error("Request failed: " + res.status + " " + (json.message || ""));
        }
      } else {
        console.log("Registration (no FORM_ENDPOINT set):", data);
      }

      remember(REGISTERED_KEY);
      form.innerHTML = `
        <div class="form-success">
          <div class="tick">✓</div>
          <h3>Your spot is saved, ${escapeHtml(data.parentName.split(" ")[0])}!</h3>
          <p>You're registered for ${EVENTS[data.attend]} ${escapeHtml(data.email)}.</p>
        </div>`;
    } catch (err) {
      console.error(err);
      setMsg("Something went wrong. Please try again.");
      submitBtn.disabled = false;
      submitBtn.textContent = submitLabel;
    }
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

  // Shapes a registration into the email BYC receives (one row per field, readable labels).
  function toEmail(data) {
    return {
      _subject: `New registration (${ATTEND_LABELS[data.attend]}): ${data.parentName}`,
      _template: "table",
      _captcha: "false",
      _replyto: data.email,
      "Attending": ATTEND_LABELS[data.attend],
      "Event": data.event,
      "Parent's Name": data.parentName,
      "Phone Number": `${data.countryCode} ${data.phone}`,
      "Email Address": data.email,
      "Student's Name": data.studentName,
      "Current Grade": data.grade,
      "School Name": data.school,
      "Submitted At (IST)": new Date(data.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      "Page": location.href,
    };
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
