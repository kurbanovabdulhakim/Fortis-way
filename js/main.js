// Immediate theme initialization to prevent flash
window.toggleTheme = function() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('fortisway_theme', newTheme);
  console.log('[FortisWay] Theme toggled to:', newTheme);
  if (window.updateAllSliderProgress) window.updateAllSliderProgress();
};

(function() {
  const savedTheme = localStorage.getItem('fortisway_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
})();

/* ==========================================================================
   SEAMLESS 2X TIME-LAPSE DUAL-VIDEO CROSSFADE CONTROLLER
   ========================================================================== */
function initSeamlessBackgroundVideos() {
  const containers = document.querySelectorAll('.seamless-video-container');
  if (!containers.length) return;

  containers.forEach(container => {
    const vidA = container.querySelector('.layer-a');
    const vidB = container.querySelector('.layer-b');
    if (!vidA || !vidB) return;

    const speed = parseFloat(container.dataset.speed) || 0.5;
    const fadeDurationSec = 1.2;
    const crossfadeLeadTime = fadeDurationSec * speed; // 2.4s in video timeline

    let active = vidA;
    let inactive = vidB;
    let crossfading = false;
    let isVisible = false;

    // Apply 2x speed and initial display states
    vidA.playbackRate = speed;
    vidB.playbackRate = speed;
    vidA.classList.add('active');
    vidB.classList.remove('active');

    function startPlayback() {
      if (!isVisible) return;
      active.playbackRate = speed;
      active.classList.add('active');
      active.play().catch(() => {});
    }

    function pauseAll() {
      vidA.pause();
      vidB.pause();
    }

    function triggerCrossfade() {
      if (crossfading) return;
      crossfading = true;

      inactive.currentTime = 0;
      inactive.playbackRate = speed;
      inactive.classList.add('active');
      active.classList.remove('active');
      inactive.play().catch(() => {});

      // After 1.2s crossfade completes, reset inactive and swap pointers
      setTimeout(() => {
        active.pause();
        active.currentTime = 0;
        const temp = active;
        active = inactive;
        inactive = temp;
        crossfading = false;
      }, (fadeDurationSec * 1000) + 50);
    }

    function checkCrossfade() {
      if (!isVisible || crossfading) return;
      const dur = active.duration;
      const cur = active.currentTime;

      if (dur && !isNaN(dur) && dur > crossfadeLeadTime && cur >= (dur - crossfadeLeadTime)) {
        triggerCrossfade();
      }
    }

    vidA.addEventListener('timeupdate', checkCrossfade);
    vidB.addEventListener('timeupdate', checkCrossfade);

    function onEnded() {
      if (!crossfading) {
        triggerCrossfade();
      }
    }
    vidA.addEventListener('ended', onEnded);
    vidB.addEventListener('ended', onEnded);

    // IntersectionObserver for 60fps performance & battery savings
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startPlayback();
          } else {
            pauseAll();
          }
        });
      }, { threshold: 0.1 });
      observer.observe(container.closest('.transport-section') || container);
    } else {
      isVisible = true;
      startPlayback();
    }
  });
}
/**
 * FortisWay — High-Tech Freight & Logistics Platform
 * Core Application Logic, Calculator & B2B Auth System
 */

document.addEventListener('DOMContentLoaded', () => {
  initScrollTransportTrackers();
  initSeamlessBackgroundVideos();
  initCalculator();
  initTransportScrollAnimations();
  initRequisitesAuth();
  initGeneralUI();
});

/* ==========================================================================
   1. EXPRESS CALCULATOR WITH SWAP BUTTON & TELEGRAM DISPATCH
   ========================================================================== */
function initCalculator() {
  const countryFrom = document.getElementById('countryFrom');
  const countryTo = document.getElementById('countryTo');
  const cityFrom = document.getElementById('cityFrom');
  const cityTo = document.getElementById('cityTo');
  const btnSwap = document.getElementById('btnSwapCities');

  const cargoWeight = document.getElementById('cargoWeight');
  const cargoVolume = document.getElementById('cargoVolume');
  const weightVal = document.getElementById('weightVal');
  const volumeVal = document.getElementById('volumeVal');

  const checkOversized = document.getElementById('checkOversized');
  const checkRef = document.getElementById('checkRef');

  const resTruckClass = document.getElementById('resTruckClass');
  const resTransitDays = document.getElementById('resTransitDays');
  const resRateAmount = document.getElementById('resRateAmount');
  const resTotalTrip = document.getElementById('resTotalTrip');
  const btnOrderTelegram = document.getElementById('btnOrderTelegram');
  const btnOrderEmail = document.getElementById('btnOrderEmail');

  if (!cargoWeight || !cargoVolume) return;

  // Dynamic Slider Track Progress Fill (Cyan active line up to thumb)
  function updateSliderTrackProgress(slider) {
    if (!slider) return;
    const min = parseFloat(slider.min) !== undefined ? parseFloat(slider.min) : 0;
    const max = parseFloat(slider.max) !== undefined ? parseFloat(slider.max) : 100;
    const val = parseFloat(slider.value) !== undefined ? parseFloat(slider.value) : 0;
    const pct = Math.max(0, Math.min(100, ((val - min) / (max - min)) * 100));

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const trackBg = isLight ? 'rgba(0, 0, 0, 0.12)' : 'rgba(255, 255, 255, 0.16)';
    const activeColor = '#00a6fb';

    slider.style.setProperty('--range-pct', pct + '%');
    slider.style.background = 'linear-gradient(to right, ' + activeColor + ' 0%, ' + activeColor + ' ' + pct + '%, ' + trackBg + ' ' + pct + '%, ' + trackBg + ' 100%)';
  }

  window.updateAllSliderProgress = function() {
    updateSliderTrackProgress(cargoWeight);
    updateSliderTrackProgress(cargoVolume);
  };


  // Route Database: +$10-$20 above reference market rates (Unity-Trans benchmarks)
  const routeDistances = {
    'Москва': { km: 3400, daysAuto: '5 – 7 дней', daysRail: '8 – 11 дней', baseRateUsd: 175 },
    'Санкт-Петербург': { km: 4100, daysAuto: '7 – 9 дней', daysRail: '10 – 13 дней', baseRateUsd: 205 },
    'Самара': { km: 2300, daysAuto: '4 – 5 дней', daysRail: '6 – 8 дней', baseRateUsd: 165 },
    'Казань': { km: 2600, daysAuto: '4 – 6 дней', daysRail: '7 – 9 дней', baseRateUsd: 175 },
    'Екатеринбург': { km: 2300, daysAuto: '4 – 5 дней', daysRail: '6 – 8 дней', baseRateUsd: 180 },
    'Алматы': { km: 810, daysAuto: '24 – 48 часов', daysRail: '3 – 4 дня', baseRateUsd: 100 },
    'Стамбул': { km: 4800, daysAuto: '10 – 14 дней', daysRail: '14 – 18 дней', baseRateUsd: 235 },
    'Урумчи': { km: 1200, daysAuto: '3 – 5 дней', daysRail: '5 – 7 дней', baseRateUsd: 155 }
  };

  function updateCalculation(isUserAction = false) {
    const weight = parseFloat(cargoWeight.value);
    const volume = parseInt(cargoVolume.value, 10);
    const isOversized = checkOversized ? checkOversized.checked : false;
    const isRef = checkRef ? checkRef.checked : false;

    if (weightVal) {
      weightVal.textContent = weight >= 1 ? `${weight.toFixed(1)} т` : `${(weight * 1000).toFixed(0)} кг`;
    }
    if (volumeVal) {
      volumeVal.textContent = `${volume} м³`;
    }

    // Vehicle Class Recommendation
    let vehicle = 'Еврофура Тент (20 тонн / 92 м³)';
    if (isOversized) {
      vehicle = 'Низкорамный спецтрал (негабарит до 60т)';
    } else if (isRef) {
      vehicle = 'Рефрижератор (-20°C..+12°C, 20т)';
    } else if (volume > 92 || (volume > 80 && weight <= 15)) {
      vehicle = 'Мегатрейлер (105 – 120 м³)';
    } else if (weight <= 2.5 && volume <= 16) {
      vehicle = 'Isuzu / Газель Next (малотоннажный до 3т)';
    } else if (weight <= 6 && volume <= 35) {
      vehicle = 'Isuzu NPR (среднетоннажный до 5т)';
    }

    // Rate Calculation (+10-20$ above reference sites)
    const targetCity = cityTo ? cityTo.value : 'Москва';
    const routeInfo = routeDistances[targetCity] || { km: 3400, daysAuto: '5 – 7 дней', baseRateUsd: 175 };

    let ratePerTon = routeInfo.baseRateUsd;
    if (isRef) ratePerTon += 45;
    if (isOversized) ratePerTon += 65;

    // Total estimated trip calculation
    let totalTripUsd = 0;
    if (weight < 1.5) {
      // Сборный груз (LTL)
      totalTripUsd = Math.max(350, Math.round(weight * 1000 * 1.6));
    } else {
      totalTripUsd = Math.round(weight * ratePerTon);
      const minVolExpected = weight * 4.2;
      if (volume > minVolExpected) {
        totalTripUsd += Math.round((volume - minVolExpected) * 16);
      }
      if (totalTripUsd < 450) totalTripUsd = 450;
    }

    if (resTruckClass) resTruckClass.textContent = vehicle;
    if (resTransitDays) resTransitDays.textContent = routeInfo.daysAuto;
    if (resRateAmount) resRateAmount.textContent = `от ${ratePerTon} $ / т`;
    if (resTotalTrip) resTotalTrip.textContent = `~${totalTripUsd.toLocaleString('ru-RU')} $`;

    updateSliderTrackProgress(cargoWeight);
    updateSliderTrackProgress(cargoVolume);

    // Stable Warning & Trust Slot state swap (Zero layout shift)
    const trustSlot = document.getElementById('calcSlotTrust');
    const warnBox = document.getElementById('calcWarningBox');
    if (isUserAction) {
      if (trustSlot) trustSlot.style.display = 'none';
      if (warnBox) warnBox.style.display = 'flex';
    } else {
      if (trustSlot) trustSlot.style.display = 'flex';
      if (warnBox) warnBox.style.display = 'none';
    }

    // Silent submission handler is available via submitCalcOrderSilently
  }

  // Explicit calculation button trigger
  window.triggerCalculatorAction = function() {
    updateCalculation(true);
  };

  // Silent Lead Submission Handler (Direct background transmission to Manager via AJAX / Telegram)
  window.submitCalcOrderSilently = async function(event) {
    if (event) event.preventDefault();
    updateCalculation(true);

    const clientPhoneInput = document.getElementById('calcClientPhone');
    const clientNameInput = document.getElementById('calcClientName');
    const submitBtn = document.getElementById('btnSubmitCalcOrder');
    const successCard = document.getElementById('calcOrderSuccess');

    const phone = clientPhoneInput ? clientPhoneInput.value.trim() : '';
    const name = clientNameInput ? clientNameInput.value.trim() : '';

    if (!phone || phone.length < 5) {
      if (clientPhoneInput) {
        clientPhoneInput.focus();
        clientPhoneInput.style.borderColor = '#ef4444';
        setTimeout(() => { clientPhoneInput.style.borderColor = ''; }, 3000);
      }
      showToast('Пожалуйста, укажите контактный телефон или Telegram.');
      return;
    }

    // Set button loading state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span> Отправка заявки...`;
    }

    // Prepare lead parameters
    const from = cityFrom ? cityFrom.value : 'Ташкент';
    const to = cityTo ? cityTo.value : 'Москва';
    const weight = parseFloat(cargoWeight.value);
    const volume = parseInt(cargoVolume.value, 10);
    const isOversized = checkOversized ? checkOversized.checked : false;
    const isRef = checkRef ? checkRef.checked : false;
    const routeInfo = routeDistances[to] || { km: 3400, daysAuto: '5 – 7 дней', baseRateUsd: 175 };
    
    let ratePerTon = routeInfo.baseRateUsd;
    if (isRef) ratePerTon += 45;
    if (isOversized) ratePerTon += 65;

    let totalTripUsd = 0;
    if (weight < 1.5) {
      totalTripUsd = Math.max(350, Math.round(weight * 1000 * 1.6));
    } else {
      totalTripUsd = Math.round(weight * ratePerTon);
      const minVolExpected = weight * 4.2;
      if (volume > minVolExpected) {
        totalTripUsd += Math.round((volume - minVolExpected) * 16);
      }
      if (totalTripUsd < 450) totalTripUsd = 450;
    }

    const modeStr = isRef ? 'Рефрижератор (-20..+12°C)' : (isOversized ? 'Негабаритный спецтрал' : 'Стандартный тент');
    const timestamp = new Date().toLocaleString('ru-RU');

    const leadDossier = {
      source: 'Онлайн-калькулятор FortisWay',
      dateTime: timestamp,
      route: `${from} → ${to} (~${routeInfo.km} км)`,
      weight: `${weight >= 1 ? weight + ' т' : (weight * 1000) + ' кг'}`,
      volume: `${volume} м³`,
      mode: modeStr,
      transitEstimate: routeInfo.daysAuto,
      calculatedRate: `от ${ratePerTon} $ / т`,
      totalEstimatedTrip: `~${totalTripUsd} $`,
      clientName: name || 'Не указано',
      clientContact: phone
    };

    // Save lead to local storage backup
    try {
      const storedLeads = JSON.parse(localStorage.getItem('fortisway_leads') || '[]');
      storedLeads.push(leadDossier);
      localStorage.setItem('fortisway_leads', JSON.stringify(storedLeads));
    } catch(e) {}

    // 1. Silent Local & Internal Dispatch
    console.log('[FortisWay Lead Dispatch]', leadDossier);

    // 2. Telegram Bot silent webhook dispatch if configured
    if (window.FORTIS_TELEGRAM_CONFIG && window.FORTIS_TELEGRAM_CONFIG.botToken && window.FORTIS_TELEGRAM_CONFIG.chatId) {
      const tgText = `🔔 ЗАЯВКА НА РАСЧЁТ ПЕРЕВОЗКИ (FortisWay)\n\n` +
        `📍 Маршрут: ${from} → ${to} (~${routeInfo.km} км)\n` +
        `⚖️ Вес: ${leadDossier.weight} | Объём: ${leadDossier.volume}\n` +
        `🚛 Режим: ${modeStr}\n` +
        `💵 Расчёт: ~${totalTripUsd} $ (ставка от ${ratePerTon} $/т)\n` +
        `⏱ Срок: ${routeInfo.daysAuto}\n` +
        `👤 Клиент: ${name || 'Клиент'}\n` +
        `📞 Телефон/Связь: ${phone}\n` +
        `⏰ Время: ${timestamp}`;

      fetch(`https://api.telegram.org/bot${window.FORTIS_TELEGRAM_CONFIG.botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: window.FORTIS_TELEGRAM_CONFIG.chatId,
          text: tgText
        })
      }).catch(() => {});
    }

    // Smooth UI update
    await new Promise(r => setTimeout(r, 600));

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `✓ Заявка передана логисту`;
      submitBtn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
      submitBtn.style.borderColor = '#10b981';
    }

    if (successCard) {
      successCard.style.display = 'block';
      successCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    showToast('✓ Заявка успешно принята! Наш специалист скоро свяжется с вами.');
  };

  // Swap Button Handler (⇄)
  if (btnSwap) {
    btnSwap.addEventListener('click', () => {
      if (countryFrom && countryTo) {
        const tempCountry = countryFrom.value;
        countryFrom.value = countryTo.value;
        countryTo.value = tempCountry;
      }

      const fromVal = cityFrom.value;
      const toVal = cityTo.value;

      let hasFromInTo = Array.from(cityTo.options).some(o => o.value === fromVal);
      if (!hasFromInTo) {
        cityTo.add(new Option(fromVal, fromVal));
      }
      let hasToInFrom = Array.from(cityFrom.options).some(o => o.value === toVal);
      if (!hasToInFrom) {
        cityFrom.add(new Option(toVal, toVal));
      }

      cityFrom.value = toVal;
      cityTo.value = fromVal;

      updateCalculation(true);
      showToast(`Направление изменено: ${toVal} → ${fromVal}`);
    });
  }

  // Bind Listeners with immediate slider fill update
  const onUserChange = () => updateCalculation(true);
  cargoWeight.addEventListener('input', () => {
    updateSliderTrackProgress(cargoWeight);
    updateCalculation(true);
  });
  cargoVolume.addEventListener('input', () => {
    updateSliderTrackProgress(cargoVolume);
    updateCalculation(true);
  });
  if (checkOversized) checkOversized.addEventListener('change', onUserChange);
  if (checkRef) checkRef.addEventListener('change', onUserChange);
  cityFrom.addEventListener('change', onUserChange);
  cityTo.addEventListener('change', onUserChange);

  const clientNameIn = document.getElementById('calcClientName');
  const clientPhoneIn = document.getElementById('calcClientPhone');
  if (clientNameIn) clientNameIn.addEventListener('input', onUserChange);
  if (clientPhoneIn) clientPhoneIn.addEventListener('input', onUserChange);

  // Initial slider fill and calculation without showing warning until user interacts
  updateSliderTrackProgress(cargoWeight);
  updateSliderTrackProgress(cargoVolume);
  updateCalculation(false);
}

// Global Route Setter from Table Matrix
window.applyRoute = function(from, to) {
  const cityFrom = document.getElementById('cityFrom');
  const cityTo = document.getElementById('cityTo');
  const heroCalc = document.getElementById('hero-calc');

  if (cityFrom && cityTo) {
    let hasFrom = Array.from(cityFrom.options).some(o => o.value === from);
    if (!hasFrom) cityFrom.add(new Option(from, from));
    cityFrom.value = from;

    let hasTo = Array.from(cityTo.options).some(o => o.value === to);
    if (!hasTo) cityTo.add(new Option(to, to));
    cityTo.value = to;

    cityFrom.dispatchEvent(new Event('change'));
  }

  if (heroCalc) {
    heroCalc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    heroCalc.style.transform = 'scale(1.02)';
    heroCalc.style.boxShadow = '0 0 40px rgba(0, 166, 251, 0.6)';
    setTimeout(() => {
      heroCalc.style.transform = '';
      heroCalc.style.boxShadow = '';
    }, 1200);
  }
};

/* ==========================================================================
   2. SCROLL-DRIVEN AMBIENT VEHICLE ANIMATIONS (IntersectionObserver)
   ========================================================================== */
function initTransportScrollAnimations() {
  const transportSections = document.querySelectorAll('.transport-section');
  if (!transportSections.length || !('IntersectionObserver' in window)) return;

  const observerOptions = {
    threshold: 0.25,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      } else {
        // Reset when scrolled past to allow re-trigger
        entry.target.classList.remove('in-view');
      }
    });
  }, observerOptions);

  transportSections.forEach(section => observer.observe(section));

  // High-Performance Parallax Scroll Effect for Backdrops
  const parallaxBackdrops = document.querySelectorAll('[data-parallax]');
  if (parallaxBackdrops.length) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          parallaxBackdrops.forEach(el => {
            const speed = parseFloat(el.getAttribute('data-parallax')) || 0.2;
            const parent = el.closest('section') || el.parentElement;
            if (parent) {
              const rect = parent.getBoundingClientRect();
              if (rect.top < window.innerHeight && rect.bottom > 0) {
                const yPos = (window.innerHeight - rect.top) * speed * 0.25;
                el.style.transform = 	ranslate3d(0,  + yPos.toFixed(1) + px, 0);
              }
            }
          });
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
}

/* ==========================================================================
   3. PROTECTED REQUISITES & 3-IN-1 B2B AUTH GATEWAY
   ========================================================================== */
function initRequisitesAuth() {
  const isAuth = sessionStorage.getItem('fortisway_partner_auth') === 'true';
  renderRequisitesState(isAuth);
}

function renderRequisitesState(isAuth) {
  const lockedBox = document.getElementById('reqLockedBox');
  const unlockedBox = document.getElementById('reqUnlockedBox');
  const navAuthBtn = document.getElementById('navAuthBtn');
  const contactAddr = document.getElementById('contactOfficeAddress');

  document.body.classList.toggle('authenticated', !!isAuth);
  if (contactAddr) {
    contactAddr.classList.toggle('locked-state', !isAuth);
  }

  if (!lockedBox || !unlockedBox) return;

  if (isAuth) {
    lockedBox.style.display = 'none';
    unlockedBox.style.display = 'block';
    if (navAuthBtn) {
      navAuthBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent-green);"><polyline points="20 6 9 17 4 12"></polyline></svg>
        <span>Партнёр (Вход выполнен)</span>
      `;
    }
  } else {
    lockedBox.style.display = 'block';
    unlockedBox.style.display = 'none';
    if (navAuthBtn) {
      navAuthBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        <span>ЛК / Реквизиты</span>
      `;
    }
  }
}

window.handleProtectedAddressClick = function() {
  const isAuth = sessionStorage.getItem('fortisway_partner_auth') === 'true';
  if (!isAuth) {
    openAuthModal();
  }
};

// Modal Open / Close
window.openAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('open');
};

window.closeAuthModal = function() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('open');
};

window.switchAuthTab = function(tabIndex) {
  const buttons = document.querySelectorAll('.auth-tab-btn');
  const panes = document.querySelectorAll('.auth-tab-pane');

  buttons.forEach((btn, idx) => {
    btn.classList.toggle('active', idx === tabIndex);
  });
  panes.forEach((pane, idx) => {
    pane.classList.toggle('active', idx === tabIndex);
  });
};

// Auth Handlers
window.handleQuickAuth = function(e) {
  e.preventDefault();
  sessionStorage.setItem('fortisway_partner_auth', 'true');
  renderRequisitesState(true);
  closeAuthModal();
  showToast('Доступ открыт! Добро пожаловать в партнёрский раздел FortisWay.');
  scrollToRequisites();
};

window.handleCredAuth = function(e) {
  e.preventDefault();
  const user = document.getElementById('loginUser').value.trim();
  const pass = document.getElementById('loginPass').value.trim();

  if (user === 'partner' && pass === '2026') {
    sessionStorage.setItem('fortisway_partner_auth', 'true');
    renderRequisitesState(true);
    closeAuthModal();
    showToast('Успешный вход руководителя! Все реквизиты разблокированы.');
    scrollToRequisites();
  } else {
    // Also allow any valid non-empty entry for demo convenience
    sessionStorage.setItem('fortisway_partner_auth', 'true');
    renderRequisitesState(true);
    closeAuthModal();
    showToast('Авторизация выполнена. Реквизиты доступны.');
    scrollToRequisites();
  }
};

window.simulateTgAuth = function() {
  sessionStorage.setItem('fortisway_partner_auth', 'true');
  renderRequisitesState(true);
  closeAuthModal();
  showToast('Верификация через Telegram запрошена. Доступ открыт.');
  scrollToRequisites();
};

window.logoutRequisites = function() {
  sessionStorage.removeItem('fortisway_partner_auth');
  renderRequisitesState(false);
  showToast('Вы вышли из партнёрского раздела. Данные скрыты.');
};

function scrollToRequisites() {
  const reqSection = document.getElementById('requisites');
  if (reqSection) {
    reqSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// Clipboard Helpers
window.copyText = function(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement.textContent;
    btnElement.textContent = '✓ Скопировано!';
    btnElement.style.background = 'var(--accent-green)';
    btnElement.style.color = '#fff';
    setTimeout(() => {
      btnElement.textContent = originalText;
      btnElement.style.background = '';
      btnElement.style.color = '';
    }, 2000);
  });
};

window.copyAllRequisites = function() {
  const reqText = 
`Реквизиты ООО «FORTISWAY»:
Полное наименование: Общество с ограниченной ответственностью «FORTISWAY» (OOO «FORTISWAY»)
Юридический / Почтовый адрес: Республика Узбекистан, г. Ташкент, Яшнабадский район, МСГ Тойтепа, ул. Садика Азимова, 3-й проезд, д. 20
ИНН: 313334329
ОКЭД: 49410 (Грузовые перевозки автомобильным транспортом)
Расчетный счет (сум): 20208000607538177001
Банк: АКИБ «Ipak Yo'li», Чиланзарский филиал
МФО: 01067
Контакты: +998 (93) 555-22-62 | Telegram: @LogisticsFortisway`;

  navigator.clipboard.writeText(reqText).then(() => {
    showToast('Все реквизиты ООО «FORTISWAY» скопированы в буфер обмена!');
  });
};

window.downloadRequisitesTxt = function() {
  const reqText = 
`КАРТОЧКА ПРЕДПРИЯТИЯ / РЕКВИЗИТЫ ООО «FORTISWAY»
======================================================
Полное наименование: Общество с ограниченной ответственностью «FORTISWAY» (OOO «FORTISWAY»)
Юридический адрес: Республика Узбекистан, г. Ташкент, Яшнабадский район, МСГ Тойтепа, ул. Садика Азимова, 3-й проезд, д. 20
ИНН: 313334329
ОКЭД: 49410 (Грузовые перевозки автомобильным транспортом)
Расчетный счет: 20208000607538177001
Банк: АКИБ «Ipak Yo'li», Чиланзарский филиал
МФО: 01067

Контакты диспетчерской:
Телефон: +998 (93) 555-22-62
Telegram: @LogisticsFortisway (https://t.me/LogisticsFortisway)
WhatsApp: +998 93 555 22 62
Электронная почта: info@fortisway.uz
Официальный сайт: FortisWay Freight & Logistics
======================================================`;

  const blob = new Blob([reqText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'rekvizity_fortisway.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Карточка предприятия rekvizity_fortisway.txt скачана.');
};

/* ==========================================================================
   4. GENERAL UI (Fast Order Modal, Feedback, Back to Top, Toast)
   ========================================================================== */
function initGeneralUI() {
  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.onclick = window.toggleTheme;
  }
  // Back to Top Button
  const backToTopBtn = document.getElementById('backToTopBtn');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 400) {
      backToTopBtn.classList.add('show');
    } else {
      backToTopBtn.classList.remove('show');
    }
  });
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Mobile menu toggle
  const mobileToggle = document.getElementById('mobileToggle');
  const navLinks = document.querySelector('.nav-links');
  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isVisible = navLinks.style.display === 'flex';
      navLinks.style.display = isVisible ? 'none' : 'flex';
      if (!isVisible) {
        navLinks.style.flexDirection = 'column';
        navLinks.style.position = 'absolute';
        navLinks.style.top = '100%';
        navLinks.style.left = '0';
        navLinks.style.width = '100%';
        navLinks.style.background = '#060b14';
        navLinks.style.padding = '20px';
        navLinks.style.borderBottom = '1px solid var(--border-subtle)';
      }
    });
  }
}

window.openFastOrderModal = function() {
  const modal = document.getElementById('fastOrderModal');
  if (modal) modal.classList.add('open');
};

window.closeFastOrderModal = function() {
  const modal = document.getElementById('fastOrderModal');
  if (modal) modal.classList.remove('open');
};

window.handleFastOrderSubmit = function(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]') ? form.querySelector('input[type="text"]').value.trim() : 'Представитель';
  const phone = form.querySelector('input[type="tel"]') ? form.querySelector('input[type="tel"]').value.trim() : '';
  closeFastOrderModal();

  const timestamp = new Date().toLocaleString('ru-RU');
  const payload = {
    source: 'Модальное окно: Запрос КП и договора',
    dateTime: timestamp,
    clientName: name,
    clientPhone: phone
  };

  // 1. Silent Local & Internal Dispatch
  console.log('[FortisWay Fast Order]', payload);

  // 2. Telegram Bot silent webhook
  if (window.FORTIS_TELEGRAM_CONFIG && window.FORTIS_TELEGRAM_CONFIG.botToken && window.FORTIS_TELEGRAM_CONFIG.chatId) {
    const text = `🔔 ЗАПРОС ОФИЦИАЛЬНОГО КП И ДОГОВОРА (FortisWay)\n\n` +
      `👤 Клиент / Организация: ${name}\n` +
      `📞 Телефон / Связь: ${phone}\n` +
      `⏰ Время: ${timestamp}`;

    fetch(`https://api.telegram.org/bot${window.FORTIS_TELEGRAM_CONFIG.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: window.FORTIS_TELEGRAM_CONFIG.chatId, text })
    }).catch(() => {});
  }

  showToast('✓ Запрос принят! Дежурный специалист свяжется с вами и направит официальное КП.');
  form.reset();
};

window.handleContactSubmit = function(e) {
  e.preventDefault();
  const form = e.target;
  const name = form.querySelector('input[type="text"]') ? form.querySelector('input[type="text"]').value.trim() : 'Клиент';
  const phone = form.querySelector('input[type="tel"]') ? form.querySelector('input[type="tel"]').value.trim() : '';
  const note = form.querySelector('textarea') ? form.querySelector('textarea').value.trim() : '';

  const timestamp = new Date().toLocaleString('ru-RU');
  const payload = {
    source: 'Форма обратной связи в контактах',
    dateTime: timestamp,
    clientName: name,
    clientPhone: phone,
    message: note || 'Прошу перезвонить'
  };

  // 1. Silent Local & Internal Dispatch
  console.log('[FortisWay Contact Message]', payload);

  // 2. Telegram Bot silent webhook
  if (window.FORTIS_TELEGRAM_CONFIG && window.FORTIS_TELEGRAM_CONFIG.botToken && window.FORTIS_TELEGRAM_CONFIG.chatId) {
    const text = `🔔 ЗАЯВКА С САЙТА FORTISWAY\n\n` +
      `👤 Имя: ${name}\n` +
      `📞 Телефон: ${phone}\n` +
      `📝 Сообщение: ${note || 'Прошу перезвонить'}\n` +
      `⏰ Время: ${timestamp}`;

    fetch(`https://api.telegram.org/bot${window.FORTIS_TELEGRAM_CONFIG.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: window.FORTIS_TELEGRAM_CONFIG.chatId, text })
    }).catch(() => {});
  }

  showToast('✓ Спасибо! Ваше сообщение принято, мы скоро свяжемся с вами.');
  form.reset();
};

window.showToast = function(message) {
  const toast = document.getElementById('toastNotice');
  const msgEl = document.getElementById('toastMessage');
  if (!toast || !msgEl) return;

  msgEl.textContent = message;
  toast.classList.add('show');

  setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
};


/* ==========================================================================
   SCROLL INTERACTIVE VEHICLE TRACKER CONTROLLER
   ========================================================================== */
function initScrollTransportTrackers() {
  const trackers = document.querySelectorAll('.scroll-tracker-container');
  if (!trackers.length) return;

  function updatePositions() {
    const winH = window.innerHeight;

    trackers.forEach(container => {
      const section = container.closest('.transport-section');
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const sectionH = rect.height;

      // Progress begins when section top enters near 75% of viewport
      // and reaches 100% when section bottom reaches 25% of viewport
      const startOffset = winH * 0.75;
      const endOffset = winH * 0.25;
      const totalDist = sectionH + startOffset - endOffset;
      const currentPos = startOffset - rect.top;

      let progress = currentPos / totalDist;
      progress = Math.max(0, Math.min(1, progress));

      const track = container.querySelector('.scroll-tracker-track');
      const vehicle = container.querySelector('.scroll-tracker-vehicle');
      const distLabel = container.querySelector('.tracker-distance-val');

      if (track && vehicle) {
        const trackW = track.clientWidth;
        const vehicleW = vehicle.clientWidth || 90;
        const maxTravel = Math.max(0, trackW - vehicleW - 12);
        const posX = 6 + (progress * maxTravel);

        vehicle.style.transform = `translate3d(${posX}px, -50%, 0)`;

        if (distLabel) {
          distLabel.textContent = `${Math.round(progress * 100)}%`;
        }
      }
    });
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updatePositions();
        ticking = false;
      });
      ticking = true;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updatePositions();
}


if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initScrollTransportTrackers();
}

/* Background Mode Switcher Handler */
window.onBgModeChanged = function(mode) {
  const containers = document.querySelectorAll('.seamless-video-container');
  containers.forEach(container => {
    const vids = container.querySelectorAll('video');
    vids.forEach(v => {
      if (mode === 'photo') {
        v.pause();
      } else {
        const speed = parseFloat(container.dataset.speed) || 0.5;
        v.playbackRate = speed;
        if (v.classList.contains('active')) {
          v.play().catch(() => {});
        }
      }
    });
  });
  if (window.showToast) {
    showToast(mode === 'photo' 
      ? '🖼️ Режим фона: Статичные 4K фото (все видео и анимации отключены)' 
      : '🎬 Режим фона: Плавное видео (0.5x замедление)');
  }
};
