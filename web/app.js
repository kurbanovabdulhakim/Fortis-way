// FortisWay Telegram WebApp (ATI.SU + Vault & Documents)
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

let catalogData = window.FORTIS_CATALOG_DATA || {
  updated_at: "—",
  ati_loads: [],
  documents: [],
  items: []
};

let state = {
  mode: "ati",       // "ati" | "docs"
  category: "all",   // for ati: "all" | "selected" | "Китай" | "Турция / Иран / Польша" | "РФ / СНГ / Европа"
  sub: "all",        // "all" | "Импорт" | "Экспорт" | "тент" | "реф"
  search: ""
};

function updateHeaderCounts() {
  const atiCount = (catalogData.ati_loads || []).length;
  const docsCount = (catalogData.documents || []).length + (catalogData.items || []).length;
  document.getElementById("cnt-ati").textContent = atiCount;
  document.getElementById("cnt-docs").textContent = docsCount;
  document.getElementById("sync-status").textContent =
    `Обновлено: ${catalogData.updated_at || "—"} | ATI.SU: ${atiCount} | Документов: ${docsCount}`;
}

function openExternalUrl(url) {
  if (tg && typeof tg.openLink === "function") {
    tg.openLink(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}

function copyText(text, btn) {
  const orig = btn.textContent;
  const markCopied = () => {
    btn.textContent = "Скопировано";
    btn.classList.add("copied");
    setTimeout(() => {
      btn.textContent = orig;
      btn.classList.remove("copied");
    }, 1400);
  };

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(markCopied).catch(() => fallbackCopy(text, markCopied));
  } else {
    fallbackCopy(text, markCopied);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); } catch (e) {}
  document.body.removeChild(ta);
  cb();
}

function formatGroupText(x) {
  const vol = x.volume_m3 ? `${x.volume_m3} м3` : "не указан";
  const temp = x.temp_regime ? ` (${x.temp_regime})` : "";
  return [
    `Откуда — Куда: ${x.from_location} — ${x.to_location}`,
    `Груз: ${x.cargo_name}`,
    `Вес / Объём: ${x.weight_t} т / ${vol}`,
    `Транспорт: ${x.trucks_count} авто, ${x.truck_type}${temp}`,
    `Код ТН ВЭД: ${x.tnved_code || "Не указан на сайте"}`,
    `Документы: ${x.documents_req || "Дополнительных документов не требуется"}`,
    `Погрузка: ${x.loading_date}`
  ].join("\n");
}

function formatFullText(x) {
  const vol = x.volume_m3 ? `${x.volume_m3} м3` : "не указан";
  const dist = x.distance_km ? `${x.distance_km} км` : "не указано";
  const temp = x.temp_regime ? ` (${x.temp_regime})` : "";
  return [
    `Категория: ${x.category} (${x.direction})`,
    `Откуда — Куда: ${x.from_location} — ${x.to_location}`,
    `Расстояние: ${dist}`,
    `Груз: ${x.cargo_name}`,
    `Вес / Объём: ${x.weight_t} т / ${vol}`,
    `Транспорт: ${x.trucks_count} авто, ${x.truck_type}${temp}`,
    `Код ТН ВЭД: ${x.tnved_code || "Не указан на сайте"}`,
    `Документы: ${x.documents_req || "Дополнительных документов не требуется"}`,
    `Погрузка: ${x.loading_date}`,
    `Ставка: ${x.rate_info} (${x.payment_terms})`,
    `На сайте: ${x.days_on_site} дн. (осталось ${x.days_remaining_10d} дн.)`,
    `Ссылка ATI.SU: ${x.ati_url}`
  ].join("\n");
}

function render() {
  const container = document.getElementById("items-container");
  const atiFilters = document.getElementById("ati-filters");
  const subFilters = document.getElementById("sub-filters");

  if (state.mode === "ati") {
    atiFilters.style.display = "flex";
    subFilters.style.display = "flex";
    renderAtiLoads(container);
  } else {
    atiFilters.style.display = "none";
    subFilters.style.display = "none";
    renderDocsAndVault(container);
  }
}

function renderAtiLoads(container) {
  const loads = (catalogData.ati_loads || []).filter(x => {
    if (state.category === "selected" && x.is_selected !== 1) return false;
    if (state.category !== "all" && state.category !== "selected" && x.category !== state.category) return false;

    if (state.sub === "Импорт" && !x.direction.includes("Импорт")) return false;
    if (state.sub === "Экспорт" && !x.direction.includes("Экспорт")) return false;
    if (state.sub === "тент" && !x.truck_type.toLowerCase().includes("тент")) return false;
    if (state.sub === "реф" && !x.truck_type.toLowerCase().includes("реф")) return false;

    if (state.search) {
      const hay = `${x.from_location} ${x.to_location} ${x.cargo_name} ${x.category} ${x.weight_t} ${x.tnved_code} ${x.truck_type}`.toLowerCase();
      if (!hay.includes(state.search)) return false;
    }
    return true;
  });

  if (loads.length === 0) {
    container.innerHTML = `<div class="empty-box">По вашему фильтру грузы не найдены.</div>`;
    return;
  }

  container.innerHTML = "";
  loads.forEach(x => {
    const vol = x.volume_m3 ? `${x.volume_m3} м³` : "не указан";
    const temp = x.temp_regime ? ` (${x.temp_regime})` : "";
    const dist = x.distance_km ? `${x.distance_km} км` : "—";

    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-header">
        <span class="item-badge">${x.category} • ${x.direction}</span>
        <span class="item-date">${x.days_on_site} дн. на сайте</span>
      </div>
      <div class="item-title">${x.from_location} — ${x.to_location}</div>
      <div class="item-meta-grid">
        <div><strong>Груз:</strong> ${x.cargo_name}</div>
        <div><strong>Вес / Объём:</strong> ${x.weight_t} т / ${vol} | <strong>Расст.:</strong> ${dist}</div>
        <div><strong>Транспорт:</strong> ${x.trucks_count} авто, ${x.truck_type}${temp}</div>
        <div><strong>Код ТН ВЭД:</strong> ${x.tnved_code || "Не указан на сайте"}</div>
        <div><strong>Документы:</strong> ${x.documents_req || "Дополнительных документов не требуется"}</div>
        <div><strong>Погрузка:</strong> ${x.loading_date} | <strong>Ставка:</strong> ${x.rate_info}</div>
      </div>
      <div class="card-actions">
        <button class="btn-action" data-copy="group">Для группы</button>
        <button class="btn-action" data-copy="full">Расширенный</button>
        <button class="btn-action primary" data-open="ati">ATI.SU</button>
      </div>
    `;

    card.querySelector('[data-copy="group"]').addEventListener("click", (e) => copyText(formatGroupText(x), e.target));
    card.querySelector('[data-copy="full"]').addEventListener("click", (e) => copyText(formatFullText(x), e.target));
    card.querySelector('[data-open="ati"]').addEventListener("click", () => openExternalUrl(x.ati_url));

    container.appendChild(card);
  });
}

function renderDocsAndVault(container) {
  const vaultItems = (catalogData.items || []).map(it => ({
    badge: `${it.country} • ${it.category}`,
    date: it.date || "",
    title: it.title,
    desc: it.desc || "",
    meta: `Файл: ${it.file} (${it.size})`
  }));

  const docs = (catalogData.documents || []).map(d => ({
    badge: `${d.category || "Документ"} • ${(d.file_format || "").toUpperCase()}`,
    date: d.file_size_kb ? `${Math.round(d.file_size_kb)} КБ` : "",
    title: d.title,
    desc: d.description || "",
    meta: `Путь: ${d.file_path || ""}`
  }));

  const combined = [...vaultItems, ...docs].filter(item => {
    if (!state.search) return true;
    const hay = `${item.badge} ${item.title} ${item.desc} ${item.meta}`.toLowerCase();
    return hay.includes(state.search);
  });

  if (combined.length === 0) {
    container.innerHTML = `<div class="empty-box">Документы по запросу не найдены.</div>`;
    return;
  }

  container.innerHTML = "";
  combined.slice(0, 60).forEach(it => {
    const card = document.createElement("div");
    card.className = "item-card";
    card.innerHTML = `
      <div class="item-header">
        <span class="item-badge">${it.badge}</span>
        <span class="item-date">${it.date}</span>
      </div>
      <div class="item-title">${it.title}</div>
      <div class="item-meta-grid">
        ${it.desc ? `<div>${it.desc}</div>` : ""}
        <div><strong>Детали:</strong> ${it.meta}</div>
      </div>
    `;
    container.appendChild(card);
  });
}

// Event Listeners
document.querySelectorAll(".mode-tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".mode-tab").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.mode = btn.dataset.mode;
    render();
  });
});

document.querySelectorAll("#ati-filters .filter-pill").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#ati-filters .filter-pill").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.category = btn.dataset.cat;
    render();
  });
});

document.querySelectorAll("#sub-filters .chip").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll("#sub-filters .chip").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    state.sub = btn.dataset.sub;
    render();
  });
});

document.getElementById("search-input").addEventListener("input", (e) => {
  state.search = e.target.value.toLowerCase().trim();
  render();
});

// Init from catalog.js immediately, then refresh via catalog.json
updateHeaderCounts();
render();

fetch(`catalog.json?t=${Date.now()}`)
  .then(r => r.ok ? r.json() : null)
  .then(data => {
    if (data && (data.ati_loads?.length || data.documents?.length || data.items?.length)) {
      catalogData = data;
      updateHeaderCounts();
      render();
    }
  })
  .catch(() => {});
