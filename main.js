const GROQ_API_KEY = "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";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // Free model on Groq

const SYSTEM_CONTEXT = `You are EduTech AI, a helpful assistant for a virtual tech support company called EduTech. 
EduTech provides: free remote IT support, hardware repair services, IT certification programs for students, and tech support for elderly users.
Be friendly, concise, and helpful. Answer tech questions, explain services, help troubleshoot issues, and guide users.
Keep responses under 3 sentences when possible. Always be warm and accessible.`;

// ===== NAVBAR SCROLL =====
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 50) navbar.style.borderBottomColor = "rgba(255,255,255,0.1)";
  else navbar.style.borderBottomColor = "rgba(255,255,255,0.07)";
});

// ===== HAMBURGER MENU =====
const hamburger = document.getElementById("hamburger");
const mobileMenu = document.getElementById("mobileMenu");
if (hamburger) {
  hamburger.addEventListener("click", () => mobileMenu.classList.toggle("open"));
}

// ===== COUNTER ANIMATION =====
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const duration = 2000;
  const step = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) { el.textContent = target.toLocaleString(); clearInterval(timer); }
    else el.textContent = Math.floor(current).toLocaleString();
  }, 16);
}

const counters = document.querySelectorAll(".num[data-target]");
if (counters.length) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { animateCounter(e.target); obs.unobserve(e.target); } });
  }, { threshold: 0.5 });
  counters.forEach(c => obs.observe(c));
}

// ===== SCROLL REVEAL =====
const revealEls = document.querySelectorAll(".mission-card, .step, .plan-card, .testimonial, .service-card, .cert-step, .perk-card, .team-card");
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = "1";
      e.target.style.transform = "translateY(0)";
    }
  });
}, { threshold: 0.1 });

revealEls.forEach((el, i) => {
  el.style.opacity = "0";
  el.style.transform = "translateY(30px)";
  el.style.transition = `opacity 0.5s ease ${i * 0.05}s, transform 0.5s ease ${i * 0.05}s`;
  revealObs.observe(el);
});

// ===== AI CHAT =====
const chatToggle = document.getElementById("chat-toggle");
const chatWindow = document.getElementById("chat-window");
const chatClose = document.getElementById("chat-close");
const chatInput = document.getElementById("chat-input");
const chatSend = document.getElementById("chat-send");
const chatMessages = document.getElementById("chat-messages");

if (chatToggle) {
  chatToggle.addEventListener("click", () => chatWindow.classList.toggle("hidden"));
  chatClose.addEventListener("click", () => chatWindow.classList.add("hidden"));
}

function addMsg(text, role) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  addMsg(text, "user");

  const loadingDiv = addMsg("Thinking...", "bot loading");

  if (GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
    loadingDiv.textContent = "⚠️ Add your free Groq API key in main.js. Get yours free (no credit card) at console.groq.com";
    loadingDiv.classList.remove("loading");
    return;
  }

  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: SYSTEM_CONTEXT },
          { role: "user", content: text }
        ],
        max_tokens: 300
      })
    });
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content || "Sorry, I couldn't process that. Please try again!";
    loadingDiv.textContent = reply;
    loadingDiv.classList.remove("loading");
  } catch (err) {
    loadingDiv.textContent = "Connection error. Please check your API key and try again.";
    loadingDiv.classList.remove("loading");
  }
}

if (chatSend) chatSend.addEventListener("click", sendMessage);
if (chatInput) chatInput.addEventListener("keydown", e => { if (e.key === "Enter") sendMessage(); });

// ===== CONTACT FORM =====
const contactForm = document.getElementById("contactForm");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector(".btn-submit");
    btn.textContent = "Sending...";
    btn.disabled = true;
    await new Promise(r => setTimeout(r, 1200));
    btn.textContent = "Message Sent!";
    document.getElementById("formSuccess").style.display = "block";
    contactForm.reset();
    setTimeout(() => { btn.textContent = "Send Message"; btn.disabled = false; }, 4000);
  });
}

// ===== PC RECOMMENDER =====
const recommenderForm = document.getElementById("pcRecommenderForm");
const recommenderResult = document.getElementById("recommenderResult");
if (recommenderForm) {
  recommenderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const budget = document.getElementById("budget").value;
    const use = document.getElementById("usecase").value;
    const level = document.getElementById("level").value;
    recommenderResult.textContent = "Generating recommendation...";
    recommenderResult.style.display = "block";

    if (GROQ_API_KEY === "YOUR_GROQ_API_KEY_HERE") {
      recommenderResult.textContent = "⚠️ Add your free Groq API key in main.js. Get it free at console.groq.com";
      return;
    }

    try {
      const prompt = `You are a PC hardware expert. Recommend a PC build for someone with:
- Budget: $${budget}
- Use case: ${use}
- Experience level: ${level}
List 5 key components (CPU, GPU, RAM, Storage, Motherboard) with specific part names. Keep it brief and practical.`;

      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "user", content: prompt }],
          max_tokens: 400
        })
      });
      const data = await res.json();
      recommenderResult.textContent = data?.choices?.[0]?.message?.content || "Unable to generate recommendation.";
    } catch {
      recommenderResult.textContent = "Error generating recommendation. Please try again.";
    }
  });
}

// ===== ACTIVE NAV =====
const currentPage = window.location.pathname.split("/").pop() || "index.html";
document.querySelectorAll(".nav-links a").forEach(a => {
  const href = a.getAttribute("href");
  if (href === currentPage || (currentPage === "" && href === "index.html")) a.classList.add("active");
  else a.classList.remove("active");
});
