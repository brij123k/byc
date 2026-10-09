/* BYC – Singapore undergrad admissions: shared script for the city landing pages.
   Each page sets its event on <body>:
     data-city="Bangalore" data-when="Saturday, 17 Oct 2026 (10 AM – 6 PM)"
     data-start="2026-10-17T10:00:00+05:30"                                   */
(function () {
  "use strict";

  // Registrations are emailed to bookyourcampus@gmail.com via FormSubmit (formsubmit.co).
  // Set to "" to only log submissions to the console.
  const FORM_ENDPOINT = "https://formsubmit.co/ajax/bookyourcampus@gmail.com";

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const CITY = document.body.dataset.city;
  const WHEN = document.body.dataset.when;
  const START = new Date(document.body.dataset.start).getTime();
  const EVENT_NAME = `Singapore Undergrad Admissions | ${CITY} In-Person | ${WHEN}`;

  /* ---------- Header shadow + sticky mobile CTA ---------- */
  const header = $(".site-header");
  const stickyCta = $("#stickyCta");
  const registerSection = $("#register");

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("scrolled", y > 10);
    const r = registerSection.getBoundingClientRect();
    const formVisible = r.top < window.innerHeight && r.bottom > 0;
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
  const units = {
    days: $('[data-unit="days"]', countdown),
    hours: $('[data-unit="hours"]', countdown),
    minutes: $('[data-unit="minutes"]', countdown),
    seconds: $('[data-unit="seconds"]', countdown),
  };
  const pad = (n) => String(n).padStart(2, "0");

  function tick() {
    const diff = Math.max(0, START - Date.now());
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
        const start = performance.now();
        function step(now) {
          const p = Math.min(1, (now - start) / 1600);
          el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );
  $$(".count").forEach((el) => counterObserver.observe(el));

  /* ---------- Profile readiness check (Bangalore page) ---------- */
  const check = $("#readyCheck");
  if (check) {
    const boxes = $$("input[type=checkbox]", check);
    const score = $("#readyScore");
    const bar = $("#readyBar");
    const verdict = $("#readyVerdict");
    const VERDICTS = [
      [0, "Starting from scratch? That's exactly who this session is for."],
      [3, "You've made a start. Let's find the gaps before applications open."],
      [5, "Good foundation. Now make it count with the right strategy."],
      [7, "Strong profile! Make sure you're targeting the right university and course."],
    ];
    function update() {
      const n = boxes.filter((b) => b.checked).length;
      score.textContent = `${n}/${boxes.length}`;
      bar.style.width = `${(n / boxes.length) * 100}%`;
      verdict.textContent = VERDICTS.filter(([min]) => n >= min).pop()[1];
    }
    boxes.forEach((b) => b.addEventListener("change", update));
    update();
  }

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

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  setMsg("");

  try {
    // 1. Send confirmation email to the registering user via EmailJS
    const emailResponse = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          service_id: "service_0fofcvx",
          template_id: "template_aekpoof",
          user_id: "lAued2DOO_MRwpQXK",
          template_params: {
            to_email: data.email,
            to_name: data.studentName,
            city: "Chennai",
            date: "24 Oct 2026",
            time:"10 AM – 6 PM"
          }
        })
      }
    );

    if (!emailResponse.ok) {
      throw new Error("Confirmation email failed. Please try again.");
    }

    // 2. Send registration details to your own email via FormSubmit
    const formResponse = await fetch(
      "https://formsubmit.co/ajax/bookyourcampus@gmail.com",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          _subject: `New ${CITY} Session Registration`,
          _template: "table",
          parentName: data.parentName,
          phone: `${data.countryCode} ${data.phone}`,
          email: data.email,
          studentName: data.studentName,
          grade: data.grade,
          school: data.school,
          city: CITY,
          eventDate: WHEN
        })
      }
    );

    if (!formResponse.ok) {
      throw new Error(
        "Confirmation email sent, but registration submission failed. Please contact BYC."
      );
    }

    const result = await formResponse.json();

    if (result.success === false || result.success === "false") {
      throw new Error("Registration could not be submitted to BYC.");
    }

    setMsg(
      "Registration successful! Your confirmation email has been sent.",
      true
    );

    remember(REGISTERED_KEY);
    form.reset();

  } catch (error) {
    console.error("Registration error:", error);
    setMsg(error.message || "Something went wrong. Please try again.");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Book My Slot →";
  }
});

  /* ---------- Registration popup ---------- */
  // Opens shortly after page load (not once the visitor has registered for this city).
  // The real form is moved into the popup and put back in #register when it closes.
  const POPUP_DELAY_MS = 3000;
  const REGISTERED_KEY = `byc_registered_${CITY.toLowerCase()}`;
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
      _subject: `New registration (${CITY}): ${data.parentName}`,
      _template: "table",
      _captcha: "false",
      _replyto: data.email,
      "City": CITY,
      "Event": data.event,
      "Parent's Name": data.parentName,
      "Phone Number": `${data.countryCode} ${data.phone}`,
      "Email Address": data.email,
      "Student's Name": data.studentName,
      "Current Class": data.grade,
      "School Name": data.school,
      "Submitted At (IST)": new Date(data.submittedAt).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
      "Page": location.href,
    };
  }

  function escapeHtml(str) {
    return str.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
})();
