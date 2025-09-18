
/**
 * @file script.js
 * @author Jeremy King
 * @date 2025-09-18
 * @description This script handles the primary interactive logic for the site.
 * @license See LICENSE file for details (e.g., PolyForm Noncommercial 1.0.0)
 */
// --- MOCK API (replace with real fetch calls) ---
// Simulates network latency and returns JSON-like objects
function fetchClubs() {
  return new Promise((res) => {
    setTimeout(() => {
      res([
        { id: "coffee", title: "Coffee Club", requirement: "Buy 9, get 1 free", desc: "Fresh roast daily.", company: "RoastWorks", logo: "☕", colors: ["#ff9a8b", "#ff6a88"] },
        { id: "donut", title: "Donut Club", requirement: "10 stamps = 1 dozen", desc: "Glazed, filled, fritters.", company: "SweetLoop", logo: "🍩", colors: ["#f6d365", "#fda085"] },
        { id: "tea", title: "Tea & Boba", requirement: "Buy 6, get 1 free", desc: "Green, oolong, fruit teas.", company: "Leaf&Pearl", logo: "🧋", colors: ["#84fab0", "#8fd3f4"] },
        { id: "smooth", title: "Smoothie Pass", requirement: "8 blends = 1 free", desc: "Seasonal vitamins on tap.", company: "VitaBar", logo: "🥤", colors: ["#a18cd1", "#fbc2eb"] },
        { id: "espresso", title: "Espresso VIP", requirement: "9 shots = 1 free", desc: "Macchiatos & ristrettos.", company: "CremaLab", logo: "☕", colors: ["#30cfd0", "#330867"] },
        { id: "soda", title: "Soda Refill", requirement: "8 refills = 1 free", desc: "Crisp and fizzy.", company: "FizzCo", logo: "🥤", colors: ["#5ee7df", "#b490ca"] },
      ]);
    }, 500);
  });
}

// returns mapping {clubId: punches}
function fetchPunches() {
  return new Promise((res) => {
    setTimeout(() => {
      res({ coffee: 5, donut: 2, tea: 7, smooth: 3, espresso: 9, soda: 6 });
    }, 300);
  });
}

// --- UI rendering using data from mock API ---
const rail = document.getElementById("rail");
const loading = document.getElementById("loading");
let index = 0;
let clubData = [];
let punchData = {};

async function init() {
  loading.textContent = "Loading clubs…";
  const [clubs, punches] = await Promise.all([fetchClubs(), fetchPunches()]);
  clubData = clubs;
  punchData = punches;
  renderCards();
  layout();
  loading.style.display = "none";
}

function renderCards() {
  rail.innerHTML = "";
  clubData.forEach((c, i) => {
    const el = document.createElement("article");
    el.className = "card";
    el.setAttribute("tabindex", "0");
    el.setAttribute("role", "button");
    el.setAttribute("aria-label", c.title);
    el.dataset.idx = i;
    el.dataset.id = c.id;

    const punches = punchData[c.id] || 0;
    const tokenIcon = getIconForId(c.id);
    const punchesHtml = Array.from({ length: 10 })
      .map((_, k) => `<span class="token ${k < punches ? "filled" : ""}" data-token="${k}" aria-hidden="true">${tokenIcon}</span>`)
      .join("");

    el.innerHTML = `
          <div class="stripe" style="--c1:${c.colors[0]};--c2:${c.colors[1]}">
            <div class="title">${escapeHtml(c.title)}</div>
          </div>
          <div class="body">
            <div class="meta">
              <div class="req">${escapeHtml(c.requirement)}</div>
              <div class="brand">
                <div class="logo" aria-hidden="true">${escapeHtml(c.logo)}</div>
                <div class="company">${escapeHtml(c.company)}</div>
              </div>
            </div>
            <p>${escapeHtml(c.desc)}</p>
            <div class="punches" aria-label="punch row">${punchesHtml}</div>
          </div>`;

    el.addEventListener("click", (e) => {
      const tok = e.target.closest(".token");
      if (tok) {
        const clubId = el.dataset.id;
        const current = punchData[clubId] || 0;
        if (current < 10) {
          punchData[clubId] = current + 1;
          fakeSavePunches(clubId, punchData[clubId]);
          updateCardPunches(i);
        }
        return;
      }
      goTo(i);
    });

    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        goTo(i);
      }
    });

    rail.appendChild(el);
  });
}

function updateCardPunches(indexAt) {
  const el = rail.children[indexAt];
  if (!el) return;
  const id = el.dataset.id;
  const punches = punchData[id] || 0;
  const tokens = el.querySelectorAll(".token");
  tokens.forEach((t, k) => {
    t.classList.toggle("filled", k < punches);
  });
}

function updateAllPunches() {
  clubData.forEach((c, i) => updateCardPunches(i));
}

function getIconForId(id) {
  if (id === "coffee" || id === "espresso") return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h2a3 3 0 0 1 0 6h-2a6 6 0 0 1-12 0V6h13a1 1 0 0 1 1 1v1Zm0 2v2h2a1 1 0 0 0 0-2h-2ZM5 20h12a1 1 0 1 1 0 2H5a1 1 0 1 1 0-2Z"/></svg>`;
  if (id === "tea" || id === "smooth") return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 9h-2V6H4v6a6 6 0 0 0 6 6h2a6 6 0 0 0 6-6h2a3 3 0 1 0 0-6Zm0 2a1 1 0 1 1 0 2h-2v-2h2Z"/></svg>`;
  return `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 1 0 10 10A10.012 10.012 0 0 0 12 2Zm0 6a4 4 0 1 1-4 4 4.005 4.005 0 0 1 4-4Z"/></svg>`;
}

function fakeSavePunches(clubId, value) {
  console.log("Saving punches", clubId, value);
  return new Promise((res) => setTimeout(() => res({ ok: true, clubId, punches: value }), 250));
}

// layout (finite pyramid); minor mobile lift of side cards
function layout() {
  const children = [...rail.children];
  const gap = parseInt(getCss("--gap")) || 90;
  const depth = parseInt(getCss("--depth")) || 100;
  const isMobile = window.matchMedia("(max-width: 560px)").matches;
  children.forEach((el, j) => {
    const rel = j - index; // finite ends
    const dir = Math.sign(rel);
    const k = Math.abs(rel);
    const x = dir * (k * gap);
    const z = -Math.min(k * depth, 999);
    const s = Math.max(1 - k * 0.12, 0.65);
    const y = isMobile ? -Math.min(14, k * 14) : k * 8; // raise side cards on mobile
    el.style.zIndex = String(1000 - k);
    el.style.opacity = String(1 - Math.min(k * 0.18, 0.8));
    el.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${s}) translateZ(${z}px)`;
    el.classList.toggle("is-front", k === 0);
    el.setAttribute("aria-selected", k === 0 ? "true" : "false");
  });
  updateControls();
}

function getCss(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim().replace("px", "") || "0";
}

function goTo(i) {
  if (i < 0 || i >= rail.children.length) return;
  index = i;
  layout();
  updateAllPunches();
}
function next() {
  if (index < rail.children.length - 1) {
    index++;
    layout();
    updateAllPunches();
  }
}
function prev() {
  if (index > 0) {
    index--;
    layout();
    updateAllPunches();
  }
}

function updateControls() {
  document.getElementById("prev").disabled = index === 0;
  document.getElementById("next").disabled = index === rail.children.length - 1;
}

document.getElementById("next").addEventListener("click", next);
document.getElementById("prev").addEventListener("click", prev);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") next();
  else if (e.key === "ArrowLeft") prev();
});

// scroll wheel / trackpad (throttled)
let wheelLock = false;
window.addEventListener(
  "wheel",
  (e) => {
    if (wheelLock) return;
    wheelLock = true;
    setTimeout(() => (wheelLock = false), 140);
    const horiz = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    if (horiz) {
      e.deltaX > 0 ? next() : prev();
    } else {
      e.deltaY > 0 ? next() : prev();
    }
  },
  { passive: true }
);

// drag/swipe with snap + visual nudge
let dragging = false,
  startX = 0,
  deltaX = 0;
const start = (x) => {
  dragging = true;
  startX = x;
  deltaX = 0;
  rail.style.transition = "transform .08s ease";
};
const move = (x) => {
  if (!dragging) return;
  deltaX = x - startX;
  rail.style.transform = `translateX(${Math.max(-40, Math.min(40, deltaX * 0.15))}px)`;
};
const endDrag = () => {
  if (!dragging) return;
  dragging = false;
  rail.style.transform = "translateX(0px)";
  if (Math.abs(deltaX) > 50) {
    if (deltaX > 0) prev();
    else next();
  } else {
    layout();
  }
};

// Bind both to window and rail; use passive:false for touchmove so swipe is recognized
window.addEventListener("mousedown", (e) => start(e.clientX));
window.addEventListener("mousemove", (e) => move(e.clientX));
window.addEventListener("mouseup", endDrag);

rail.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
rail.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    move(e.touches[0].clientX);
  },
  { passive: false }
);
rail.addEventListener("touchend", endDrag);

window.addEventListener("touchstart", (e) => start(e.touches[0].clientX), { passive: true });
window.addEventListener(
  "touchmove",
  (e) => {
    e.preventDefault();
    move(e.touches[0].clientX);
  },
  { passive: false }
);
window.addEventListener("touchend", endDrag);

window.addEventListener("mouseleave", () => {
  if (dragging) endDrag();
});

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

init();
