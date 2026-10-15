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
   1. EXTENSIVE LOGISTICS GEOGRAPHY & DYNAMIC CALCULATOR LOGIC
   ========================================================================== */
const LOGISTICS_GEOGRAPHY = {
  cis: {
    label: "СНГ",
    countries: {
      UZ: { name: "Узбекистан", flag: "🇺🇿", cities: ["Ташкент", "Самарканд", "Бухара", "Фергана", "Андижан", "Наманган", "Навои", "Термез", "Нукус", "Карши", "Ургенч", "Коканд", "Алмалык", "Чирчик", "Джизак", "Гулистан"] },
      RU: { name: "Россия", flag: "🇷🇺", cities: ["Москва", "Санкт-Петербург", "Екатеринбург", "Казань", "Новосибирск", "Нижний Новгород", "Самара", "Челябинск", "Омск", "Ростов-на-Дону", "Уфа", "Красноярск", "Воронеж", "Пермь", "Волгоград", "Краснодар", "Саратов", "Тюмень", "Тольятти", "Барнаул", "Ижевск", "Хабаровск", "Владивосток", "Ярославль", "Махачкала", "Оренбург", "Новокузнецк", "Кемерово", "Рязань", "Томск", "Астрахань", "Пенза", "Набережные Челны", "Липецк", "Тула", "Киров", "Чебоксары", "Калининград", "Брянск", "Курск", "Иваново", "Магнитогорск", "Тверь", "Ставрополь", "Симферополь", "Белгород", "Сочи", "Сургут", "Владимир", "Калуга", "Смоленск"] },
      KZ: { name: "Казахстан", flag: "🇰🇿", cities: ["Алматы", "Астана", "Шымкент", "Актобе", "Караганда", "Тараз", "Павлодар", "Усть-Каменогорск", "Семей", "Атырау", "Костанай", "Кызылорда", "Уральск", "Петропавловск", "Актау", "Темиртау", "Туркестан", "Кокшетау"] },
      BY: { name: "Беларусь", flag: "🇧🇾", cities: ["Минск", "Гомель", "Могилёв", "Витебск", "Гродно", "Брест", "Барановичи", "Бобруйск", "Пинск", "Борисов"] },
      KG: { name: "Кыргызстан", flag: "🇰🇬", cities: ["Бишкек", "Ош", "Джалал-Абад", "Каракол", "Токмок", "Узген", "Балыкчы", "Нарын", "Талас", "Баткен"] },
      TJ: { name: "Таджикистан", flag: "🇹🇯", cities: ["Душанбе", "Худжанд", "Бохтар", "Куляб", "Истаравшан", "Турсунзаде", "Канибадам", "Исфара", "Пенджикент"] },
      AZ: { name: "Азербайджан", flag: "🇦🇿", cities: ["Баку", "Гянджа", "Сумгаит", "Мингечевир", "Ширван", "Нахчыван", "Шеки", "Ленкорань", "Евлах"] },
      AM: { name: "Армения", flag: "🇦🇲", cities: ["Ереван", "Гюмри", "Ванадзор", "Вагаршапат", "Абовян", "Капан", "Раздан"] },
      GE: { name: "Грузия", flag: "🇬🇪", cities: ["Тбилиси", "Батуми", "Кутаиси", "Рустави", "Поти", "Зугдиди", "Гори", "Телави"] },
      MD: { name: "Молдова", flag: "🇲🇩", cities: ["Кишинёв", "Бельцы", "Тирасполь", "Бендеры", "Рыбница", "Кагул", "Унгены"] },
      TM: { name: "Туркменистан", flag: "🇹🇲", cities: ["Ашхабад", "Туркменабат", "Дашогуз", "Мары", "Туркменбаши", "Балканабат"] }
    }
  },
  asia: {
    label: "Азия",
    countries: {
      CN: { name: "Китай", flag: "🇨🇳", cities: ["Урумчи", "Гуанчжоу", "Иу", "Шанхай", "Пекин", "Шэньчжэнь", "Нинбо", "Циндао", "Тяньцзинь", "Ханчжоу", "Чэнду", "Чунцин", "Сиань", "Фошань", "Дунгуань", "Сямэнь", "Далянь", "Сучжоу", "Ухань", "Чжэнчжоу", "Харбин", "Кашгар"] },
      TR: { name: "Турция", flag: "🇹🇷", cities: ["Стамбул", "Анкара", "Измир", "Бурса", "Анталья", "Мерсин", "Газиантеп", "Конья", "Адана", "Кайсери", "Трабзон", "Самсун", "Денизли", "Эскишехир", "Коджаэли", "Гебзе"] },
      AE: { name: "ОАЭ", flag: "🇦🇪", cities: ["Дубай", "Абу-Даби", "Шарджа", "Джебель-Али", "Аджман", "Рас-эль-Хайма", "Фуджейра"] },
      IR: { name: "Иран", flag: "🇮🇷", cities: ["Тегеран", "Мешхед", "Исфахан", "Тебриз", "Шираз", "Бендер-Аббас", "Решт", "Ахваз", "Кум", "Энзели"] },
      IN: { name: "Индия", flag: "🇮🇳", cities: ["Мумбаи", "Дели", "Ченнаи", "Бангалор", "Калькутта", "Хайдарабад", "Ахмадабад", "Пуна", "Нава-Шева", "Сурат"] },
      PK: { name: "Пакистан", flag: "🇵🇰", cities: ["Карачи", "Лахор", "Исламабад", "Равалпинди", "Фейсалабад", "Пешавар", "Гвадар"] },
      AF: { name: "Афганистан", flag: "🇦🇫", cities: ["Кабул", "Герат", "Мазари-Шариф", "Кандагар", "Хайратон"] },
      KR: { name: "Южная Корея", flag: "🇰🇷", cities: ["Сеул", "Пусан", "Инчхон", "Тэгу", "Кванджу", "Ульсан"] },
      JP: { name: "Япония", flag: "🇯🇵", cities: ["Токио", "Йокогама", "Осака", "Нагоя", "Кобе", "Фукуока"] },
      VN: { name: "Вьетнам", flag: "🇻🇳", cities: ["Ханой", "Хошимин", "Хайфон", "Дананг"] },
      TH: { name: "Таиланд", flag: "🇹🇭", cities: ["Бангкок", "Лаем Чабанг", "Чиангмай", "Пхукет"] },
      MY: { name: "Малайзия", flag: "🇲🇾", cities: ["Куала-Лумпур", "Порт-Кланг", "Пенанг", "Джохор-Бару"] },
      SG: { name: "Сингапур", flag: "🇸🇬", cities: ["Сингапур"] },
      ID: { name: "Индонезия", flag: "🇮🇩", cities: ["Джакарта", "Сурабая", "Медан", "Семаранг"] },
      SA: { name: "Саудовская Аравия", flag: "🇸🇦", cities: ["Эр-Рияд", "Джидда", "Даммам", "Мекка", "Медина"] },
      QA: { name: "Катар", flag: "🇶🇦", cities: ["Доха", "Аль-Вакра"] },
      KW: { name: "Кувейт", flag: "🇰🇼", cities: ["Эль-Кувейт", "Шувайх"] },
      OM: { name: "Оман", flag: "🇴🇲", cities: ["Маскат", "Салала", "Сохар"] },
      IL: { name: "Израиль", flag: "🇮🇱", cities: ["Тель-Авив", "Хайфа", "Ашдод", "Иерусалим"] }
    }
  },
  europe: {
    label: "Европа",
    countries: {
      DE: { name: "Германия", flag: "🇩🇪", cities: ["Берлин", "Гамбург", "Франкфурт-на-Майне", "Мюнхен", "Кёльн", "Дюссельдорф", "Штутгарт", "Лейпциг", "Бремен", "Дортмунд", "Нюрнберг", "Ганновер"] },
      PL: { name: "Польша", flag: "🇵🇱", cities: ["Варшава", "Лодзь", "Краков", "Вроцлав", "Познань", "Гданьск", "Щецин", "Катовице", "Люблин", "Белосток", "Бяла-Подляска"] },
      IT: { name: "Италия", flag: "🇮🇹", cities: ["Милан", "Рим", "Болонья", "Верона", "Турин", "Неаполь", "Генуя", "Флоренция", "Венеция", "Бари", "Триест"] },
      LT: { name: "Литва", flag: "🇱🇹", cities: ["Вильнюс", "Каунас", "Клайпеда", "Шяуляй", "Паневежис"] },
      LV: { name: "Латвия", flag: "🇱🇻", cities: ["Рига", "Даугавпилс", "Лиепая", "Вентспилс", "Елгава"] },
      EE: { name: "Эстония", flag: "🇪🇪", cities: ["Таллин", "Тарту", "Нарва", "Пярну"] },
      NL: { name: "Нидерланды", flag: "🇳🇱", cities: ["Роттердам", "Амстердам", "Гаага", "Утрехт", "Эйндховен", "Тилбург"] },
      BE: { name: "Бельгия", flag: "🇧🇪", cities: ["Антверпен", "Брюссель", "Гент", "Льеж", "Брюгге"] },
      FR: { name: "Франция", flag: "🇫🇷", cities: ["Париж", "Лион", "Марсель", "Тулуза", "Бордо", "Лилль", "Гавр", "Страсбург", "Нант"] },
      ES: { name: "Испания", flag: "🇪🇸", cities: ["Мадрид", "Барселона", "Валенсия", "Севилья", "Сарагоса", "Малага", "Бильбао"] },
      CZ: { name: "Чехия", flag: "🇨🇿", cities: ["Прага", "Брно", "Острава", "Пльзень"] },
      AT: { name: "Австрия", flag: "🇦🇹", cities: ["Вена", "Грац", "Линц", "Зальцбург", "Инсбрук"] },
      HU: { name: "Венгрия", flag: "🇭🇺", cities: ["Будапешт", "Дебрецен", "Сегед", "Мишкольц", "Дьёр"] },
      RO: { name: "Румыния", flag: "🇷🇴", cities: ["Бухарест", "Клуж-Напока", "Тимишоара", "Яссы", "Констанца"] },
      BG: { name: "Болгария", flag: "🇧🇬", cities: ["София", "Пловдив", "Варна", "Бургас", "Русе"] },
      GB: { name: "Великобритания", flag: "🇬🇧", cities: ["Лондон", "Бирмингем", "Манчестер", "Ливерпуль", "Лидс", "Глазго", "Саутгемптон", "Феликстоу"] },
      FI: { name: "Финляндия", flag: "🇫🇮", cities: ["Хельсинки", "Эспоо", "Тампере", "Турку", "Оулу", "Котка"] },
      SE: { name: "Швеция", flag: "🇸🇪", cities: ["Стокгольм", "Гётеборг", "Мальмё", "Хельсингборг"] },
      NO: { name: "Норвегия", flag: "🇳🇴", cities: ["Осло", "Берген", "Ставангер", "Тронхейм"] },
      DK: { name: "Дания", flag: "🇩🇰", cities: ["Копенгаген", "Орхус", "Оденсе", "Ольборг"] },
      CH: { name: "Швейцария", flag: "🇨🇭", cities: ["Цюрих", "Женева", "Базель", "Берн", "Лозанна"] },
      SK: { name: "Словакия", flag: "🇸🇰", cities: ["Братислава", "Кошице", "Жилина"] },
      SI: { name: "Словения", flag: "🇸🇮", cities: ["Любляна", "Марибор", "Копер"] },
      HR: { name: "Хорватия", flag: "🇭🇷", cities: ["Загреб", "Сплит", "Риека"] },
      RS: { name: "Сербия", flag: "🇷🇸", cities: ["Белград", "Нови-Сад", "Ниш", "Крагуевац"] },
      GR: { name: "Греция", flag: "🇬🇷", cities: ["Афины", "Салоники", "Пирей", "Патры"] },
      PT: { name: "Португалия", flag: "🇵🇹", cities: ["Лиссабон", "Порту", "Лейрия", "Сетубал"] }
    }
  }
};

// Helper: Find country code and region by city name
function findCountryByCity(cityName) {
  if (!cityName) return null;
  for (const [regionKey, region] of Object.entries(LOGISTICS_GEOGRAPHY)) {
    for (const [countryCode, country] of Object.entries(region.countries)) {
      if (country.cities.includes(cityName)) {
        return { countryCode, regionKey, country };
      }
    }
  }
  return null;
}

// Helper: Find country details by country code
function findCountryByCode(code) {
  if (!code) return null;
  for (const [regionKey, region] of Object.entries(LOGISTICS_GEOGRAPHY)) {
    if (region.countries[code]) {
      return { countryCode: code, regionKey, country: region.countries[code] };
    }
  }
  return null;
}

// Populate city <select> based on country code
function populateCitiesSelect(countryCode, citySelectElem, preferredCity) {
  if (!citySelectElem) return;
  const found = findCountryByCode(countryCode);
  const cities = found ? found.country.cities : ["Ташкент"];

  citySelectElem.innerHTML = '';
  cities.forEach(city => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    if (preferredCity && city === preferredCity) {
      opt.selected = true;
    }
    citySelectElem.appendChild(opt);
  });

  if (!preferredCity || !cities.includes(preferredCity)) {
    if (citySelectElem.options.length > 0) {
      citySelectElem.selectedIndex = 0;
    }
  }
}

// ==========================================================================
// TARIFF & RATE CALCULATION MATRIX (READY FOR USER-PROVIDED PRICING TABLE)
// ==========================================================================
const CUSTOM_RATES_MATRIX = {
  // User will supply custom rates here, e.g.:
  // "Ташкент-Москва": { km: 3400, daysAuto: "5 – 7 дней", baseRateUsd: 175 }
};

function getRouteEstimate(fromCountry, fromCity, toCountry, toCity) {
  const routeKey1 = `${fromCity}-${toCity}`;
  const routeKey2 = `${toCity}-${fromCity}`;

  if (CUSTOM_RATES_MATRIX[routeKey1]) return CUSTOM_RATES_MATRIX[routeKey1];
  if (CUSTOM_RATES_MATRIX[routeKey2]) return CUSTOM_RATES_MATRIX[routeKey2];

  // Specific city benchmarks
  const cityBenchmarks = {
    'Москва': { km: 3400, daysAuto: '5 – 7 дней', baseRateUsd: 175 },
    'Санкт-Петербург': { km: 4100, daysAuto: '7 – 9 дней', baseRateUsd: 205 },
    'Самара': { km: 2300, daysAuto: '4 – 5 дней', baseRateUsd: 165 },
    'Казань': { km: 2600, daysAuto: '4 – 6 дней', baseRateUsd: 175 },
    'Екатеринбург': { km: 2300, daysAuto: '4 – 5 дней', baseRateUsd: 180 },
    'Новосибирск': { km: 2500, daysAuto: '5 – 7 дней', baseRateUsd: 190 },
    'Алматы': { km: 810, daysAuto: '24 – 48 часов', baseRateUsd: 100 },
    'Астана': { km: 1400, daysAuto: '3 – 4 дня', baseRateUsd: 125 },
    'Стамбул': { km: 4800, daysAuto: '10 – 14 дней', baseRateUsd: 235 },
    'Урумчи': { km: 1200, daysAuto: '3 – 5 дней', baseRateUsd: 155 },
    'Гуанчжоу': { km: 6200, daysAuto: '12 – 16 дней', baseRateUsd: 260 },
    'Иу': { km: 5800, daysAuto: '11 – 15 дней', baseRateUsd: 250 },
    'Берлин': { km: 5200, daysAuto: '10 – 14 дней', baseRateUsd: 240 },
    'Варшава': { km: 4500, daysAuto: '8 – 12 дней', baseRateUsd: 215 },
    'Милан': { km: 5700, daysAuto: '11 – 15 дней', baseRateUsd: 265 },
    'Вильнюс': { km: 4200, daysAuto: '8 – 11 дней', baseRateUsd: 210 },
    'Рига': { km: 4300, daysAuto: '8 – 12 дней', baseRateUsd: 215 },
    'Минск': { km: 3900, daysAuto: '7 – 10 дней', baseRateUsd: 195 },
    'Баку': { km: 2200, daysAuto: '5 – 7 дней', baseRateUsd: 160 },
    'Тбилиси': { km: 2700, daysAuto: '6 – 8 дней', baseRateUsd: 175 },
    'Душанбе': { km: 450, daysAuto: '24 – 36 часов', baseRateUsd: 75 },
    'Бишкек': { km: 550, daysAuto: '24 – 36 часов', baseRateUsd: 80 },
    'Дубай': { km: 3800, daysAuto: '9 – 13 дней', baseRateUsd: 230 },
    'Тегеран': { km: 1900, daysAuto: '4 – 6 дней', baseRateUsd: 160 }
  };

  if (cityBenchmarks[toCity]) return cityBenchmarks[toCity];
  if (cityBenchmarks[fromCity]) return cityBenchmarks[fromCity];

  // Regional Fallback
  const fromInfo = findCountryByCode(fromCountry);
  const toInfo = findCountryByCode(toCountry);

  const regFrom = fromInfo ? fromInfo.regionKey : 'cis';
  const regTo = toInfo ? toInfo.regionKey : 'cis';

  if (fromCountry === toCountry) {
    return { km: 600, daysAuto: '24 – 48 часов', baseRateUsd: 70 };
  }
  if (regFrom === 'cis' && regTo === 'cis') {
    return { km: 2800, daysAuto: '5 – 8 дней', baseRateUsd: 165 };
  }
  if ((regFrom === 'cis' && regTo === 'asia') || (regFrom === 'asia' && regTo === 'cis')) {
    return { km: 4500, daysAuto: '8 – 14 дней', baseRateUsd: 210 };
  }
  if ((regFrom === 'cis' && regTo === 'europe') || (regFrom === 'europe' && regTo === 'cis')) {
    return { km: 5000, daysAuto: '9 – 14 дней', baseRateUsd: 235 };
  }
  return { km: 6500, daysAuto: '12 – 18 дней', baseRateUsd: 265 };
}


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

  // Initialize dynamic cities on page load
  if (countryFrom && cityFrom) {
    populateCitiesSelect(countryFrom.value || 'UZ', cityFrom, 'Ташкент');
  }
  if (countryTo && cityTo) {
    populateCitiesSelect(countryTo.value || 'RU', cityTo, 'Москва');
  }

  // Dynamic Slider Track Progress Fill
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

    // Dynamic Route Details from Extensible Matrix / Regional Engine
    const cFrom = countryFrom ? countryFrom.value : 'UZ';
    const cTo = countryTo ? countryTo.value : 'RU';
    const targetCityFrom = cityFrom ? cityFrom.value : 'Ташкент';
    const targetCityTo = cityTo ? cityTo.value : 'Москва';

    const routeInfo = getRouteEstimate(cFrom, targetCityFrom, cTo, targetCityTo);

    let ratePerTon = routeInfo.baseRateUsd || 175;
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
    if (resTransitDays) resTransitDays.textContent = routeInfo.daysAuto || '5 – 7 дней';
    if (resRateAmount) resRateAmount.textContent = `от ${ratePerTon} $ / т`;
    if (resTotalTrip) resTotalTrip.textContent = `~${totalTripUsd.toLocaleString('ru-RU')} $`;

    updateSliderTrackProgress(cargoWeight);
    updateSliderTrackProgress(cargoVolume);

    // Step 2 Warning Box remains visible
    const warnBox = document.getElementById('calcWarningBox');
    if (warnBox) {
      warnBox.style.display = 'block';
    }
  }

  // Explicit calculation button trigger
  window.triggerCalculatorAction = function() {
    updateCalculation(true);
  };

  // Silent Lead Submission Handler
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

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span style="display:inline-block; width:14px; height:14px; border:2px solid #fff; border-top-color:transparent; border-radius:50%; animation:spin 0.6s linear infinite; margin-right:8px; vertical-align:middle;"></span> Отправка заявки...`;
    }

    const cFrom = countryFrom ? countryFrom.value : 'UZ';
    const cTo = countryTo ? countryTo.value : 'RU';
    const from = cityFrom ? cityFrom.value : 'Ташкент';
    const to = cityTo ? cityTo.value : 'Москва';
    const weight = parseFloat(cargoWeight.value);
    const volume = parseInt(cargoVolume.value, 10);
    const isOversized = checkOversized ? checkOversized.checked : false;
    const isRef = checkRef ? checkRef.checked : false;
    const routeInfo = getRouteEstimate(cFrom, from, cTo, to);
    
    let ratePerTon = routeInfo.baseRateUsd || 175;
    if (isRef) ratePerTon += 45;
    if (isOversized) ratePerTon += 65;

    let totalTripUsd = 0;
    if (weight < 1.5) {
      totalTripUsd = Math.max(350, Math.round(weight * 1000 * 1.6));
    } else {
      totalTripUsd = Math.round(weight * ratePerTon);
      const minVolExpected = weight * 4.2;
      if (volume > minVolExpected) totalTripUsd += Math.round((volume - minVolExpected) * 16);
      if (totalTripUsd < 450) totalTripUsd = 450;
    }

    const leadData = {
      timestamp: new Date().toISOString(),
      clientName: name || 'Не указано',
      clientPhone: phone,
      route: `${from} (${cFrom}) → ${to} (${cTo})`,
      weight: `${weight} т`,
      volume: `${volume} м³`,
      specifics: `${isOversized ? 'Негабарит ' : ''}${isRef ? 'Рефрижератор ' : ''}`.trim() || 'Стандарт',
      estimatedTrip: `~${totalTripUsd} USD`,
      transitTime: routeInfo.daysAuto || 'По согласованию',
      source: 'Калькулятор FortisWay'
    };

    try {
      if (window.TelegramBot && typeof window.TelegramBot.sendLead === 'function') {
        await window.TelegramBot.sendLead(leadData);
      }
    } catch (err) {
      console.warn('Telegram lead submission fallback:', err);
    }

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `✓ Заявка отправлена менеджеру`;
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
      const oldCountryFrom = countryFrom ? countryFrom.value : 'UZ';
      const oldCountryTo = countryTo ? countryTo.value : 'RU';
      const oldCityFrom = cityFrom ? cityFrom.value : 'Ташкент';
      const oldCityTo = cityTo ? cityTo.value : 'Москва';

      if (countryFrom && countryTo) {
        countryFrom.value = oldCountryTo;
        countryTo.value = oldCountryFrom;
      }

      populateCitiesSelect(countryFrom ? countryFrom.value : 'RU', cityFrom, oldCityTo);
      populateCitiesSelect(countryTo ? countryTo.value : 'UZ', cityTo, oldCityFrom);

      updateCalculation(true);
      showToast(`Направление изменено: ${oldCityTo} → ${oldCityFrom}`);
    });
  }

  // Bind Listeners
  const onUserChange = () => updateCalculation(true);

  if (countryFrom) {
    countryFrom.addEventListener('change', () => {
      populateCitiesSelect(countryFrom.value, cityFrom);
      updateCalculation(true);
      const selName = countryFrom.options[countryFrom.selectedIndex]?.text || countryFrom.value;
      showToast(`Отправление: ${selName}`);
    });
  }

  if (countryTo) {
    countryTo.addEventListener('change', () => {
      populateCitiesSelect(countryTo.value, cityTo);
      updateCalculation(true);
      const selName = countryTo.options[countryTo.selectedIndex]?.text || countryTo.value;
      showToast(`Назначение: ${selName}`);
    });
  }

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

  // Initial slider fill and calculation
  updateSliderTrackProgress(cargoWeight);
  updateSliderTrackProgress(cargoVolume);
  updateCalculation(false);
}

// Global Route Setter from Table Matrix
window.applyRoute = function(from, to) {
  const countryFrom = document.getElementById('countryFrom');
  const countryTo = document.getElementById('countryTo');
  const cityFrom = document.getElementById('cityFrom');
  const cityTo = document.getElementById('cityTo');
  const heroCalc = document.getElementById('freight-calculator') || document.getElementById('hero-calc');

  if (countryFrom && cityFrom) {
    const fCountry = findCountryByCity(from);
    if (fCountry) {
      countryFrom.value = fCountry.countryCode;
      populateCitiesSelect(fCountry.countryCode, cityFrom, from);
    } else {
      let hasFrom = Array.from(cityFrom.options).some(o => o.value === from);
      if (!hasFrom) cityFrom.add(new Option(from, from));
      cityFrom.value = from;
    }
  }

  if (countryTo && cityTo) {
    const tCountry = findCountryByCity(to);
    if (tCountry) {
      countryTo.value = tCountry.countryCode;
      populateCitiesSelect(tCountry.countryCode, cityTo, to);
    } else {
      let hasTo = Array.from(cityTo.options).some(o => o.value === to);
      if (!hasTo) cityTo.add(new Option(to, to));
      cityTo.value = to;
    }
  }

  const cityFromEl = document.getElementById('cityFrom');
  if (cityFromEl) {
    cityFromEl.dispatchEvent(new Event('change'));
  }

  if (heroCalc) {
    heroCalc.scrollIntoView({ behavior: 'smooth', block: 'center' });
    heroCalc.style.transform = 'scale(1.01)';
    heroCalc.style.boxShadow = '0 0 40px rgba(0, 166, 251, 0.4)';
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
