// FortisWay Vault WebApp
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const SAMPLE_ITEMS = [
  {
    id: 1,
    country: "Польша",
    flag: "🇵🇱",
    cargo: "BakanTex_01",
    type: "video",
    category: "03_Видео_Выгрузки",
    title: "Видео выгрузки хлопка на складе",
    desc: "20 тонн доставлено, пломбы целы, разгрузка завершена без повреждений.",
    date: "2026-11-20 16:30",
    size: "48.2 МБ",
    file: "video_unloading_bakan.mp4"
  },
  {
    id: 2,
    country: "Польша",
    flag: "🇵🇱",
    cargo: "BakanTex_01",
    type: "document",
    category: "01_Документы_CMR",
    title: "CMR Международная накладная",
    desc: "Подписанная CMR с отметками польской таможни и перевозчика.",
    date: "2026-11-20 14:15",
    size: "1.8 МБ",
    file: "cmr_poland_signed.pdf"
  },
  {
    id: 3,
    country: "Нидерланды",
    flag: "🇳🇱",
    cargo: "Rotterdam_Chem_04",
    type: "document",
    category: "01_Документы_CMR",
    title: "Инвойс и упаковочный лист",
    desc: "Химическое сырье из порта Роттердам, контейнерная отправка.",
    date: "2026-11-19 11:20",
    size: "850 КБ",
    file: "invoice_rotterdam.pdf"
  },
  {
    id: 4,
    country: "Узбекистан",
    flag: "🇺🇿",
    cargo: "Tashkent_Distr_02",
    type: "photo",
    category: "02_Фото_Погрузки",
    title: "Фото пломбирования фуры",
    desc: "Склад Ташкент, номер пломбы: UZ-889124, водитель принял груз.",
    date: "2026-11-18 09:40",
    size: "4.5 МБ",
    file: "seal_photo_tashkent.jpg"
  }
];

let currentItems = [...SAMPLE_ITEMS];

let selectedCountry = "all";
let selectedType = "all";
let searchQuery = "";

function updateStorageBar(stats) {
  if (!stats) return;
  const totBytes = stats.total_bytes || 0;
  const totGb = (totBytes / (1024 * 1024 * 1024)).toFixed(1);
  const freeGb = Math.max(5120.0 - (totBytes / (1024 * 1024 * 1024)), 0.0).toFixed(1);

  const storageLabel = document.getElementById("storage-percent");
  if (storageLabel) {
    storageLabel.textContent = `Занято: ${totGb} ГБ / 5 120 ГБ`;
  }
}

function loadLiveCatalog() {
  fetch(`catalog.json?t=${Date.now()}`)
    .then(resp => {
      if (resp.ok) return resp.json();
      throw new Error("Local catalog not available");
    })
    .then(data => {
      if (data.items && data.items.length > 0) {
        currentItems = data.items;
      }
      if (data.stats) {
        updateStorageBar(data.stats);
      }
      renderItems();
loadLiveCatalog();
    })
    .catch(() => {
      // Keep sample items gracefully
      renderItems();
loadLiveCatalog();
    });
}

function renderItems() {
  const container = document.getElementById("items-container");
  container.innerHTML = "";

  const filtered = currentItems.filter(item => {
    const matchCountry = selectedCountry === "all" || item.country === selectedCountry;
    const matchType = selectedType === "all" || item.type === selectedType;
    const matchSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery) ||
      item.desc.toLowerCase().includes(searchQuery) ||
      item.country.toLowerCase().includes(searchQuery) ||
      item.cargo.toLowerCase().includes(searchQuery);
    return matchCountry && matchType && matchSearch;
  });

  if (filtered.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: #64748b; padding: 24px;">🔍 По вашему фильтру материалы не найдены.</div>`;
    return;
  }

  filtered.forEach(it => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-header">
        <span class="item-badge">${it.flag} ${it.country} • ${it.cargo}</span>
        <span class="item-date">${it.date}</span>
      </div>
      <div class="item-title">${it.title}</div>
      <div class="item-desc">${it.desc}</div>
      <div class="item-footer">
        <span>📎 ${it.file}</span>
        <span>💾 ${it.size}</span>
      </div>
    `;
    container.appendChild(card);
  });
}

// Event Listeners
document.querySelectorAll(".country-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".country-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedCountry = btn.dataset.country;
    renderItems();
  });
});

document.querySelectorAll(".chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedType = btn.dataset.type;
    renderItems();
  });
});

document.getElementById("search-input").addEventListener("input", (e) => {
  searchQuery = e.target.value.toLowerCase().trim();
  renderItems();
});

renderItems();
loadLiveCatalog();
