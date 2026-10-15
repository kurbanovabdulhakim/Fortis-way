/**
 * FORTISWAY RUSSIA / INTERNATIONAL LOGISTICS - CORE CLIENT SCRIPT
 * High Performance, Zero External Dependencies, Smooth UX
 */

document.addEventListener('DOMContentLoaded', () => {
  initThemeToggle();
  initMobileMenu();
  initCalculator();
  initFaqAccordion();
  initModals();
  initScrollButtons();
  initCookieBanner();
  initForms();
});

/* ==========================================================================
   1. THEME SWITCHER (Light / Dark)
   ========================================================================== */
function initThemeToggle() {
  const toggleBtn = document.getElementById('themeToggleBtn');
  const savedTheme = localStorage.getItem('fortis_theme') || 'light';
  
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('fortis_theme', newTheme);
      updateThemeIcon(newTheme);
    });
  }
}

function updateThemeIcon(theme) {
  const iconSpan = document.getElementById('themeIcon');
  if (!iconSpan) return;
  if (theme === 'dark') {
    iconSpan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
  } else {
    iconSpan.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
  }
}

/* ==========================================================================
   2. MOBILE MENU & DRAWER
   ========================================================================== */
function initMobileMenu() {
  const hamburger = document.getElementById('hamburgerBtn');
  const drawer = document.getElementById('mobileNavDrawer');
  const links = document.querySelectorAll('.mobile-nav-link');

  if (!hamburger || !drawer) return;

  function toggleMenu() {
    const isOpen = drawer.classList.contains('open');
    if (isOpen) {
      drawer.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    } else {
      drawer.classList.add('open');
      hamburger.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  }

  hamburger.addEventListener('click', toggleMenu);

  links.forEach(link => {
    link.addEventListener('click', () => {
      drawer.classList.remove('open');
      hamburger.classList.remove('active');
      document.body.style.overflow = '';
    });
  });
}

/* ==========================================================================
   3. INTERACTIVE LOGISTICS CALCULATOR
   ========================================================================== */
const DISTANCE_MATRIX = {
  'Москва': { 'Ташкент': 3400, 'Самарканд': 3550, 'Бухара': 3450, 'Фергана': 3700, 'Санкт-Петербург': 700, 'Казань': 820, 'Екатеринбург': 1780, 'Новосибирск': 3350 },
  'Санкт-Петербург': { 'Ташкент': 4100, 'Самарканд': 4250, 'Бухара': 4150, 'Фергана': 4400, 'Москва': 700, 'Казань': 1520, 'Екатеринбург': 2400 },
  'Екатеринбург': { 'Ташкент': 2350, 'Самарканд': 2500, 'Бухара': 2400, 'Фергана': 2650, 'Москва': 1780, 'Казань': 960 },
  'Казань': { 'Ташкент': 2750, 'Самарканд': 2900, 'Бухара': 2800, 'Фергана': 3050, 'Москва': 820, 'Екатеринбург': 960 },
  'Новосибирск': { 'Ташкент': 2450, 'Самарканд': 2600, 'Бухара': 2500, 'Москва': 3350 },
  'Ташкент': { 'Москва': 3400, 'Санкт-Петербург': 4100, 'Екатеринбург': 2350, 'Казань': 2750, 'Новосибирск': 2450, 'Самарканд': 310, 'Бухара': 580, 'Фергана': 310 },
  'Самарканд': { 'Москва': 3550, 'Санкт-Петербург': 4250, 'Екатеринбург': 2500, 'Ташкент': 310, 'Бухара': 270 },
  'Бухара': { 'Москва': 3450, 'Санкт-Петербург': 4150, 'Екатеринбург': 2400, 'Ташкент': 580, 'Самарканд': 270 },
  'Фергана': { 'Москва': 3700, 'Санкт-Петербург': 4400, 'Екатеринбург': 2650, 'Ташкент': 310 }
};

let currentCurrency = 'RUB';
const RATES = {
  RUB: { symbol: '₽', rate: 1 },
  UZS: { symbol: 'сум', rate: 135 },
  USD: { symbol: '$', rate: 0.0108 }
};

function initCalculator() {
  const cityFrom = document.getElementById('calcCityFrom');
  const cityTo = document.getElementById('calcCityTo');
  const swapBtn = document.getElementById('btnSwapCities');
  const transportSelect = document.getElementById('calcTransport');
  const weightRange = document.getElementById('calcWeight');
  const weightBadge = document.getElementById('calcWeightVal');
  const volumeRange = document.getElementById('calcVolume');
  const volumeBadge = document.getElementById('calcVolumeVal');
  
  const chkInsurance = document.getElementById('calcChkInsurance');
  const chkTemp = document.getElementById('calcChkTemp');
  const chkCustoms = document.getElementById('calcChkCustoms');

  const currBtns = document.querySelectorAll('.currency-btn');

  if (!cityFrom || !cityTo) return;

  function calculate() {
    const from = cityFrom.value;
    const to = cityTo.value;
    const transportType = transportSelect.value;
    const weight = parseFloat(weightRange.value);
    const volume = parseFloat(volumeRange.value);

    // Update slider badges
    if (weightBadge) weightBadge.textContent = `${weight} т`;
    if (volumeBadge) volumeBadge.textContent = `${volume} м³`;

    // Calculate distance
    let dist = 2800; // default fallback
    if (DISTANCE_MATRIX[from] && DISTANCE_MATRIX[from][to]) {
      dist = DISTANCE_MATRIX[from][to];
    } else if (DISTANCE_MATRIX[to] && DISTANCE_MATRIX[to][from]) {
      dist = DISTANCE_MATRIX[to][from];
    } else if (from === to) {
      dist = 50; // local
    }

    // Transit time
    let daysMin = Math.max(1, Math.round(dist / 650));
    let daysMax = daysMin + 2;
    if (dist < 200) {
      daysMin = 1;
      daysMax = 1;
    }

    // Base cost in RUB
    let basePerKm = 85;
    if (transportType === 'small') basePerKm = 38;
    else if (transportType === 'medium') basePerKm = 58;
    else if (transportType === 'eurotruck') basePerKm = 92;
    else if (transportType === 'reefer') basePerKm = 118;
    else if (transportType === 'oversized') basePerKm = 160;
    else if (transportType === 'ltl') basePerKm = 40;

    let totalRub = dist * basePerKm;

    // Weight & volume scaling
    if (transportType === 'ltl') {
      totalRub = (dist * 18) + (weight * 6500) + (volume * 1400);
    } else {
      totalRub += (weight * 1200) + (volume * 200);
    }

    // Addons
    if (chkInsurance && chkInsurance.checked) totalRub += totalRub * 0.03;
    if (chkTemp && chkTemp.checked) totalRub += totalRub * 0.15;
    if (chkCustoms && chkCustoms.checked) totalRub += 18000; // customs fee in rub

    totalRub = Math.round(totalRub / 500) * 500;

    // Convert to current currency
    const curr = RATES[currentCurrency];
    const convertedPrice = Math.round(totalRub * curr.rate);
    const formattedPrice = convertedPrice.toLocaleString('ru-RU') + ' ' + curr.symbol;

    // Update UI elements
    const distEl = document.getElementById('calcDistVal');
    const timeEl = document.getElementById('calcTimeVal');
    const transportEl = document.getElementById('calcTransportVal');
    const priceEl = document.getElementById('calcTotalPrice');

    if (distEl) distEl.textContent = `${dist.toLocaleString('ru-RU')} км`;
    if (timeEl) timeEl.textContent = dist < 200 ? 'От 2 до 6 часов' : `${daysMin}–${daysMax} дней`;
    if (transportEl) {
      const selectedOption = transportSelect.options[transportSelect.selectedIndex];
      transportEl.textContent = selectedOption ? selectedOption.text.split('(')[0].trim() : 'Тентованная еврофура';
    }
    if (priceEl) priceEl.textContent = formattedPrice;

    // Store state on book button
    const bookBtn = document.getElementById('btnBookFromCalc');
    if (bookBtn) {
      bookBtn.setAttribute('data-from', from);
      bookBtn.setAttribute('data-to', to);
      bookBtn.setAttribute('data-price', formattedPrice);
      bookBtn.setAttribute('data-weight', `${weight} т`);
      bookBtn.setAttribute('data-volume', `${volume} м³`);
    }
  }

  // Swap cities
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const temp = cityFrom.value;
      cityFrom.value = cityTo.value;
      cityTo.value = temp;
      calculate();
    });
  }

  // Event listeners
  [cityFrom, cityTo, transportSelect, weightRange, volumeRange, chkInsurance, chkTemp, chkCustoms].forEach(el => {
    if (el) {
      el.addEventListener('input', calculate);
      el.addEventListener('change', calculate);
    }
  });

  // Currency switcher
  currBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      currBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCurrency = btn.getAttribute('data-curr') || 'RUB';
      calculate();
    });
  });

  // Initialize first calculation
  calculate();
}

/* ==========================================================================
   4. FAQ ACCORDION
   ========================================================================== */
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    if (question) {
      question.addEventListener('click', () => {
        const isActive = item.classList.contains('active');
        // Close other items
        faqItems.forEach(other => {
          if (other !== item) other.classList.remove('active');
        });
        item.classList.toggle('active', !isActive);
      });
    }
  });
}

/* ==========================================================================
   5. MODALS & LEAD POPUPS
   ========================================================================== */
function initModals() {
  const overlay = document.getElementById('leadModalOverlay');
  const closeBtn = document.getElementById('modalCloseBtn');
  const bookBtn = document.getElementById('btnBookFromCalc');
  const openModalBtns = document.querySelectorAll('[data-open-modal="lead"]');
  const modalRouteInfo = document.getElementById('modalRouteInfo');

  function openModal(prefillData = null) {
    if (!overlay) return;
    if (prefillData && modalRouteInfo) {
      modalRouteInfo.textContent = `Маршрут: ${prefillData.from} → ${prefillData.to} (${prefillData.weight}, ${prefillData.volume}) | Ориентир: ${prefillData.price}`;
      modalRouteInfo.style.display = 'block';
      const commentInput = document.getElementById('modalComment');
      if (commentInput) {
        commentInput.value = `Расчет из калькулятора: ${prefillData.from} → ${prefillData.to}, вес ${prefillData.weight}, объем ${prefillData.volume}. Оценка: ${prefillData.price}`;
      }
    } else if (modalRouteInfo) {
      modalRouteInfo.style.display = 'none';
    }
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!overlay) return;
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  openModalBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openModal();
    });
  });

  if (bookBtn) {
    bookBtn.addEventListener('click', () => {
      const prefill = {
        from: bookBtn.getAttribute('data-from') || 'Москва',
        to: bookBtn.getAttribute('data-to') || 'Ташкент',
        price: bookBtn.getAttribute('data-price') || '',
        weight: bookBtn.getAttribute('data-weight') || '',
        volume: bookBtn.getAttribute('data-volume') || ''
      };
      openModal(prefill);
    });
  }

  // ESC key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open')) {
      closeModal();
    }
  });
}

/* ==========================================================================
   6. SCROLL BUTTONS (Top / Bottom)
   ========================================================================== */
function initScrollButtons() {
  const btnUp = document.getElementById('btnScrollTop');
  const btnDown = document.getElementById('btnScrollBottom');

  if (btnUp) {
    btnUp.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  if (btnDown) {
    btnDown.addEventListener('click', () => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }
}

/* ==========================================================================
   7. COOKIE BANNER
   ========================================================================== */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  const acceptBtn = document.getElementById('btnAcceptCookie');
  if (!banner || !acceptBtn) return;

  const accepted = localStorage.getItem('fortis_cookies_accepted');
  if (!accepted) {
    banner.style.display = 'flex';
  } else {
    banner.style.display = 'none';
  }

  acceptBtn.addEventListener('click', () => {
    localStorage.setItem('fortis_cookies_accepted', 'true');
    banner.style.opacity = '0';
    setTimeout(() => { banner.style.display = 'none'; }, 300);
  });
}

/* ==========================================================================
   8. FORMS VALIDATION & FEEDBACK
   ========================================================================== */
function initForms() {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const phoneInput = form.querySelector('input[type="tel"]');
      if (phoneInput && phoneInput.value.trim().length < 6) {
        showToast('Пожалуйста, укажите корректный номер телефона для связи', 'error');
        phoneInput.focus();
        return;
      }

      showToast('Спасибо за заявку! Наш дежурный логист свяжется с вами в течение 10 минут.');
      form.reset();

      // If in modal, close modal after short delay
      const overlay = document.getElementById('leadModalOverlay');
      if (overlay && overlay.classList.contains('open')) {
        setTimeout(() => {
          overlay.classList.remove('open');
          document.body.style.overflow = '';
        }, 1200);
      }
    });
  });
}

function showToast(message, type = 'success') {
  let toast = document.getElementById('siteToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'siteToast';
    toast.className = 'toast-msg';
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.style.background = type === 'error' ? '#ef4444' : '#10b981';
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}
