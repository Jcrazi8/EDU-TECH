/* ============================================================
   main.js — EduTech Global Tech Support Platform
   Handles: navbar scroll, hamburger menu, counter animation,
   scroll reveal, AI chat widget, contact form validation,
   PC build recommender, pricing calculator, active nav links.
   ============================================================ */

/* ---- AI ENDPOINT CONFIG (serverless proxy keeps secrets off the client) ---- */
const AI_ENDPOINT = "/.netlify/functions/ai";

async function requestAI(payload) {
  const response = await fetch(AI_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.error || "AI request failed. Please try again.");
  }

  return data.reply || "";
}

/* ============================================================
   NAVBAR — adds a stronger border when user scrolls down
   ============================================================ */
const navbar = document.getElementById("navbar");
if (navbar) {
  window.addEventListener("scroll", () => {
    navbar.style.borderBottomColor = window.scrollY > 50
      ? "rgba(255,255,255,0.1)"
      : "rgba(255,255,255,0.07)";
  });
}

/* ============================================================
   HAMBURGER MENU — toggles the mobile nav open/closed
   ============================================================ */
const hamburger  = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
if (hamburger && mobileMenu) {
  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
  });
}

/* ============================================================
   COUNTER ANIMATION — animates numbers from 0 to target
   Starts when element enters the viewport
   ============================================================ */
function animateCounter(el) {
  const target   = parseInt(el.dataset.target);
  const duration = 2000;
  const step     = target / (duration / 16);
  let current    = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      el.textContent = target.toLocaleString();
      clearInterval(timer);
    } else {
      el.textContent = Math.floor(current).toLocaleString();
    }
  }, 16);
}

/* Watch each counter element and trigger when 50% visible */
const counters = document.querySelectorAll(".num[data-target]");
if (counters.length) {
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterObs.unobserve(e.target); /* Only animate once per page load */
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(c => counterObs.observe(c));
}

/* ============================================================
   SCROLL REVEAL — elements fade + slide up as user scrolls
   ============================================================ */
const revealEls = document.querySelectorAll(
  ".mission-card, .step, .plan-card, .testimonial, .service-card, .cert-step, .perk-card, .team-card"
);

const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity   = "1";
      e.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.1 });

/* Set initial hidden state then observe each element */
revealEls.forEach((el, i) => {
  el.style.opacity    = "0";
  el.style.transform  = "translateY(30px)";
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
  revealObs.observe(el);
});

/* ============================================================
   AI CHAT WIDGET — floating chat bubble powered by Groq/Llama
   ============================================================ */
const chatToggle   = document.getElementById("chat-toggle");
const chatWindow   = document.getElementById("chat-window");
const chatClose    = document.getElementById("chat-close");
const chatInput    = document.getElementById("chat-input");
const chatSend     = document.getElementById("chat-send");
const chatMessages = document.getElementById("chat-messages");

/* Stores the full back-and-forth so the AI remembers context */
const conversationHistory = [];

if (chatToggle) {
  chatToggle.addEventListener("click", () => chatWindow.classList.toggle("hidden"));
  chatClose.addEventListener("click",  () => chatWindow.classList.add("hidden"));
}

/* Creates and appends a chat message bubble to the window */
function addMsg(text, role) {
  const div       = document.createElement("div");
  div.className   = `msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

/* Sends the user's message through the serverless AI endpoint */
async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  addMsg(text, "user");

  /* Add user message to history BEFORE sending */
  conversationHistory.push({ role: "user", content: text });

  const loadingDiv = addMsg("Thinking...", "bot loading");
  try {
    const reply = await requestAI({
      type: "chat",
      message: text,
      history: conversationHistory   /* full history sent each time */
    });
    loadingDiv.textContent = reply;
    loadingDiv.classList.remove("loading");

    /* Add the AI's reply to history so future messages have full context */
    conversationHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    loadingDiv.textContent = err.message || "AI assistant is unavailable right now. Please try again later.";
    loadingDiv.classList.remove("loading");

    /* Remove the failed user message from history so it doesn't corrupt context */
    conversationHistory.pop();
  }
}

/* Send on button click OR pressing Enter key */
if (chatSend)  chatSend.addEventListener("click",   sendMessage);
if (chatInput) chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

/* ============================================================
   CONTACT FORM — custom JS validation + simulated submit
   Validates: required fields, email format, message length
   ============================================================ */
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    /* Remove any previous error states before re-validating */
    contactForm.querySelectorAll(".field-error").forEach(el => el.remove());
    contactForm.querySelectorAll(".input-error").forEach(el => el.classList.remove("input-error"));

    let valid = true;

    /* Helper: shows a red error message under a field */
    function showError(input, message) {
      input.classList.add("input-error");
      const err       = document.createElement("span");
      err.className   = "field-error";
      err.textContent = message;
      input.parentNode.appendChild(err);
      valid = false;
    }

    /* Grab all form fields */
    const inputs    = contactForm.querySelectorAll("input, textarea, select");
    const firstName = inputs[0];
    const lastName  = inputs[1];
    const email     = inputs[2];
    const message   = contactForm.querySelector("textarea");

    /* Validate first name */
    if (!firstName.value.trim()) showError(firstName, "First name is required.");

    /* Validate last name */
    if (!lastName.value.trim())  showError(lastName, "Last name is required.");

    /* Validate email — must contain @ and a dot after it */
    const emailVal = email.value.trim();
    if (!emailVal) {
      showError(email, "Email address is required.");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showError(email, "Please enter a valid email address (e.g. you@example.com).");
    }

    /* Validate message — minimum 10 characters */
    if (!message.value.trim()) {
      showError(message, "Please write a message.");
    } else if (message.value.trim().length < 10) {
      showError(message, "Message must be at least 10 characters long.");
    }

    /* Stop here if any field failed */
    if (!valid) return;

    /* Log contact form submission to admin activity feed */
    if (typeof logActivity === 'function') {
      logActivity('contact_form', {
        name:    `${firstName.value.trim()} ${lastName.value.trim()}`,
        user:    emailVal,
        details: `${contactForm.querySelector('select') ? contactForm.querySelector('select').value : ''} — ${message.value.trim().substring(0, 80)}...`
      });
    }

    /* Simulate sending — show loading state then success */
    const btn = contactForm.querySelector(".btn-submit");
    btn.textContent = "Sending...";
    btn.disabled    = true;

    await new Promise(r => setTimeout(r, 1200));

    btn.textContent = "Message Sent!";
    const successEl = document.getElementById("formSuccess");
    if (successEl) successEl.style.display = "block";
    contactForm.reset();

    setTimeout(() => {
      btn.textContent = "Send Message";
      btn.disabled    = false;
      if (successEl) successEl.style.display = "none";
    }, 5000);
  });
}

/* ============================================================
   PC BUILD RECOMMENDER — AI-generated PC component lists
   Located on services.html
   ============================================================ */
const recommenderForm   = document.getElementById("pcRecommenderForm");
const recommenderResult = document.getElementById("recommenderResult");

if (recommenderForm) {
  recommenderForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const budget = document.getElementById("budget").value;
    const use    = document.getElementById("usecase").value;
    const level  = document.getElementById("level").value;

    /* Validate budget input */
    if (!budget || budget < 200) {
      alert("Please enter a budget of at least $200.");
      return;
    }

    recommenderResult.textContent = "Generating your personalized build...";
    recommenderResult.style.display = "block";

    try {
      const reply = await requestAI({
        type: "pc-build",
        budget,
        usecase: use,
        level
      });
      recommenderResult.textContent = reply || "Unable to generate recommendation.";
    } catch (err) {
      recommenderResult.textContent = err.message || "Error generating recommendation. Please try again.";
    }
  });
}

/* ============================================================
   PRICING CALCULATOR — estimates repair cost based on inputs
   Located on services.html (id="pricingCalculator")
   ============================================================ */
const pricingForm = document.getElementById("pricingCalculator");
if (pricingForm) {
  pricingForm.addEventListener("submit", function(e) {
    e.preventDefault();

    /* Read user selections */
    const device   = document.getElementById("calcDevice").value;
    const issue    = document.getElementById("calcIssue").value;
    const plan     = document.getElementById("calcPlan").value;

    /* Base prices per device type */
    const deviceBase = { laptop: 80, desktop: 60, phone: 50, tablet: 55, other: 65 };

    /* Issue multipliers */
    const issueMulti = { screen: 1.8, battery: 1.2, keyboard: 1.1, virus: 0.7, data: 1.5, board: 2.2, other: 1.0 };

    /* Calculate before discount */
    let base     = deviceBase[device]   || 65;
    let multi    = issueMulti[issue]    || 1.0;
    let subtotal = Math.round(base * multi);

    /* Apply subscriber discount */
    let discount = 0;
    let final    = subtotal;
    if (plan === "subscriber") {
      discount = Math.round(subtotal * 0.25);
      final    = subtotal - discount;
    }

    /* Shipping estimate */
    const shipping = 15;
    const total    = final + shipping;

    /* Build result HTML and inject into the result div */
    const resultEl = document.getElementById("calcResult");
    resultEl.style.display = "block";
    resultEl.innerHTML = `
      <div style="font-family:var(--font-display);font-size:1rem;font-weight:700;margin-bottom:1rem;color:var(--accent);">Estimated Repair Cost</div>
      <div style="display:flex;flex-direction:column;gap:0.5rem;font-size:0.9rem;">
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Base repair fee</span><span>$${subtotal}</span></div>
        ${discount > 0 ? `<div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Subscriber discount (25%)</span><span style="color:var(--accent);">-$${discount}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;"><span style="color:var(--muted);">Shipping (est.)</span><span>$${shipping}</span></div>
        <div style="display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:0.5rem;margin-top:0.3rem;">
          <strong>Estimated Total</strong><strong style="color:var(--accent);font-size:1.1rem;">$${total}</strong>
        </div>
      </div>
      <p style="font-size:0.75rem;color:var(--muted);margin-top:0.8rem;">* Estimate only. Final price confirmed after device inspection. Remote/software support is always free.</p>
    `;
  });
}

/* ============================================================
   ACTIVE NAV LINKS — highlights the current page in the navbar
   ============================================================ */
const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach(a => {
  const href = a.getAttribute("href");
  if (href === currentPage || (currentPage === "" && href === "index.html")) {
    a.classList.add("active");
  } else {
    a.classList.remove("active");
  }
});

/* ============================================================
   FAQ BUILDER — contact.html FAQ section (built from JS array)
   ============================================================ */
const faqs = [
  { q: "Is remote tech support really free?",         a: "Yes! Basic remote support sessions are completely free for all users. You only pay for hardware repair services (shipping + labor) or for our premium subscription plan." },
  { q: "How do I ship my device for repair?",         a: "After submitting a repair request through the platform, you'll receive a shipping label and instructions. Once repaired, we ship it back fully tested." },
  { q: "How do students apply for certification?",    a: "Students can apply directly through our contact form or through their school's IT department if EduTech is a partner. No prior experience is required." },
  { q: "Is EduTech available outside the US?",        a: "Yes! EduTech operates in 40+ countries. Remote support is available globally, and our student certification program is expanding worldwide." },
  { q: "How is the free tier funded?",                a: "EduTech is funded through federal grants, sponsorships from IT certification companies, institutional subscriptions, and community donations." },
];

const faqList = document.getElementById("faq-list");
if (faqList) {
  faqs.forEach(f => {
    /* Create a card for each FAQ item */
    const div = document.createElement("div");
    div.style.cssText = "background:var(--card);border:1px solid var(--border);border-radius:12px;overflow:hidden;";

    /* Toggle answer visibility when the button is clicked */
    div.innerHTML = `
      <button onclick="const ans=this.nextElementSibling; const open=ans.style.display==='block'; ans.style.display=open?'none':'block'; this.querySelector('i').style.transform=open?'rotate(0deg)':'rotate(180deg)'"
        style="width:100%;padding:1.2rem 1.5rem;background:none;border:none;color:var(--text);font-size:0.95rem;font-weight:600;cursor:pointer;display:flex;justify-content:space-between;align-items:center;text-align:left;font-family:var(--font-display);">
        ${f.q} <i class="fas fa-chevron-down" style="transition:transform 0.3s;flex-shrink:0;color:var(--accent)"></i>
      </button>
      <div style="display:none;padding:0 1.5rem 1.2rem;color:var(--muted);font-size:0.9rem;line-height:1.65;">${f.a}</div>
    `;
    faqList.appendChild(div);
  });
}