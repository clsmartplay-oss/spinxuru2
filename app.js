(function () {
  'use strict';

  const SEGMENTS = [50, 100, 150, 200, 250, 300, 350];
  const DEG_PER_SEGMENT = 360 / 7;
  const MAX_BONUS_INDEX = 3;
  const SPIN_DURATION_MS = 4500;
  const FULL_TURNS = 5;

  const wheelEl = document.getElementById('wheel');
  const resultAnnounce = document.getElementById('result-announce');
  const resultValue = document.getElementById('result-value');
  const whatsappBtn = document.getElementById('whatsapp-btn');
  const notificationList = document.getElementById('notification-list');

  // CONFIG: Reemplaza con tu número (código país sin +, sin espacios). Ej: Argentina 54911 1234-5678
  const WHATSAPP_NUMBER = '5491176437469';
  const WHATSAPP_MESSAGE_TEMPLATE = 'Hola, quiero reclamar mi b0n0 del %BONUS%% en Uruguay.';

  const NOMBRES_ARGENTINOS = [
    'Sofía', 'Martín', 'Valentina', 'Santiago', 'Emma', 'Mateo', 'Mía', 'Lucas',
    'Lucía', 'Benjamín', 'Isabella', 'Thiago', 'Victoria', 'Felipe', 'Emilia', 'Dante',
    'Martina', 'Lautaro', 'Julieta', 'Bautista', 'Renata', 'Juan', 'Agustina', 'Tomás',
    'Camila', 'Franco', 'Rocío', 'Nicolás', 'Valentino', 'Lola', 'Joaquín', 'Elena',
    'Juan Cruz', 'María', 'Ignacio', 'Ana', 'Facundo', 'Carla', 'Gonzalo', 'Paula'
  ];

  const APELLIDOS = ['Pérez', 'González', 'Rodríguez', 'Fernández', 'López', 'Martínez', 'García', 'Romero', 'Díaz', 'Torres'];
  const CIUDADES = [
    'Montevideo', 'Salto', 'Paysandú', 'Las Piedras', 'Rivera', 'Maldonado', 'Tacuarembó', 'Melo',
    'Mercedes', 'Artigas', 'Minas', 'San José de Mayo', 'Durazno', 'Florida', 'Treinta y Tres', 'Rocha',
    'Colonia del Sacramento', 'Canelones', 'Pando', 'Ciudad de la Costa', 'Punta del Este', 'Trinidad',
    'Fray Bentos', 'Carmelo', 'Nueva Palmira', 'Bella Unión', 'Young', 'Progreso', 'La Paz', 'San Carlos'
  ];

  const TIEMPOS = ['hace 5 min', 'hace 12 min', 'hace 1 hora', 'hace 2 horas', 'hace 30 min'];

  const STORAGE_KEY = 'spin_uruguay_spun';
  const API_SPIN = '/api/spin';
  const API_CREATE_LEAD = '/api/create-whatsapp-lead';

  let currentBonus = null;
  let hasSpun = false;
  let alreadyParticipated = false;

  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function spinWheel(forcedBonus, isReplay) {
    if (hasSpun) return;
    hasSpun = true;

    var index;
    if (forcedBonus != null && SEGMENTS.indexOf(forcedBonus) !== -1) {
      index = SEGMENTS.indexOf(forcedBonus);
      currentBonus = forcedBonus;
    } else {
      index = getRandomInt(0, MAX_BONUS_INDEX);
      currentBonus = SEGMENTS[index];
    }

    /* Puntero a las 12; el segmento 0 empieza a las 3 (90°), centro del segmento i = 90° + (i - 0.5) * DEG */
    const segmentCenterFromTop = 90 + (index - 0.5) * DEG_PER_SEGMENT;
    const finalRotation = FULL_TURNS * 360 + (360 - segmentCenterFromTop);

    wheelEl.style.transform = 'rotate(0deg)';
    wheelEl.offsetHeight;
    wheelEl.classList.add('spinning');
    wheelEl.style.transform = 'rotate(' + finalRotation + 'deg)';

    setTimeout(function () {
      wheelEl.classList.remove('spinning');
      resultAnnounce.innerHTML = '¡Te tocó <strong id="result-value">' + currentBonus + '</strong>% de b0n0!';
      resultAnnounce.hidden = false;
      updateWhatsAppLink();
      whatsappBtn.classList.remove('pending');
      if (!isReplay) {
        saveSpunState(currentBonus);
        registerSpinOnServer(currentBonus);
      }
    }, SPIN_DURATION_MS);
  }

  function saveSpunState(bonus) {
    try {
      localStorage.setItem(STORAGE_KEY, String(bonus));
    } catch (e) {}
  }

  function getSavedBonus() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch (e) {
      return null;
    }
  }

  function registerSpinOnServer(bonus) {
    fetch(API_SPIN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bonus: bonus })
    }).catch(function () {});
  }

  function showAlreadyParticipated(bonus) {
    alreadyParticipated = true;
    hasSpun = true;
    currentBonus = bonus;
    resultAnnounce.textContent = bonus != null
      ? 'Ya participaste. Tu b0n0 fue ' + bonus + '%. Reclamalo por WhatsApp.'
      : 'Ya participaste. Reclamá tu b0n0 por WhatsApp.';
    resultAnnounce.hidden = false;
    updateWhatsAppLink();
    whatsappBtn.classList.remove('pending');
  }

  function updateWhatsAppLink() {
    var bonus = currentBonus != null ? currentBonus : getSavedBonus();
    var text = bonus != null
      ? WHATSAPP_MESSAGE_TEMPLATE.replace('%BONUS%', bonus)
      : 'Hola, quiero reclamar mi b0n0 en Uruguay.';
    whatsappBtn.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
  }

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function getLeadPayload() {
    var params = new URLSearchParams(window.location.search);
    return {
      fbclid: params.get('fbclid') || null,
      utm_source: params.get('utm_source') || null,
      utm_campaign: params.get('utm_campaign') || null,
      utm_medium: params.get('utm_medium') || null,
      utm_content: params.get('utm_content') || null,
      utm_term: params.get('utm_term') || null,
      _fbc: getCookie('_fbc') || null,
      _fbp: getCookie('_fbp') || null,
      current_url: window.location.href || null
    };
  }

  function trackWhatsAppClick() {
    try {
      if (typeof fbq === 'function') {
        fbq('track', 'Contact');
        fbq('trackCustom', 'WhatsAppReclamarBono', { bonus: currentBonus });
      }
    } catch (e) {}
  }

  whatsappBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (whatsappBtn.getAttribute('data-loading') === 'true') return;
    whatsappBtn.setAttribute('data-loading', 'true');
    whatsappBtn.classList.add('loading');
    whatsappBtn.setAttribute('aria-disabled', 'true');
    trackWhatsAppClick();

    var payload = getLeadPayload();
    fetch(API_CREATE_LEAD, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data.success && data.lead_token) {
          var text = 'Hola, quiero acceder. Código: ' + data.lead_token;
          window.location.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(text);
          return;
        }
        whatsappBtn.removeAttribute('data-loading');
        whatsappBtn.classList.remove('loading');
        whatsappBtn.removeAttribute('aria-disabled');
      })
      .catch(function () {
        whatsappBtn.removeAttribute('data-loading');
        whatsappBtn.classList.remove('loading');
        whatsappBtn.removeAttribute('aria-disabled');
      });
  });

  function showNotification() {
    const name = NOMBRES_ARGENTINOS[getRandomInt(0, NOMBRES_ARGENTINOS.length - 1)];
    const amount = getRandomInt(1000, 100000);
    const formatted = amount.toLocaleString('es-UY');
    const node = document.createElement('div');
    node.className = 'notification';
    node.setAttribute('role', 'status');
    node.innerHTML = '<strong>' + escapeHtml(name) + '</strong> acaba de g4nar <span class="amount">' + formatted + ' UYU</span>';
    notificationList.appendChild(node);
    setTimeout(function () {
      node.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(function () { node.remove(); }, 320);
    }, 6000);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function startNotifications() {
    showNotification();
    setInterval(showNotification, 4000);
  }

  function updateTestimonialCard() {
    var nameEl = document.getElementById('testimonial-name');
    var metaEl = document.getElementById('testimonial-meta');
    if (!nameEl || !metaEl) return;
    var nombre = NOMBRES_ARGENTINOS[getRandomInt(0, NOMBRES_ARGENTINOS.length - 1)];
    var apellido = APELLIDOS[getRandomInt(0, APELLIDOS.length - 1)];
    var ciudad = CIUDADES[getRandomInt(0, CIUDADES.length - 1)];
    var tiempo = TIEMPOS[getRandomInt(0, TIEMPOS.length - 1)];
    nameEl.textContent = nombre + ' ' + apellido;
    metaEl.textContent = 'Desde ' + ciudad + ' • ' + tiempo;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    whatsappBtn.classList.add('pending');
    startNotifications();
    updateTestimonialCard();
    setInterval(updateTestimonialCard, 8000);

    fetch(API_SPIN, { method: 'GET', credentials: 'same-origin' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        var savedBonus = data && data.canSpin === false && data.bonus != null ? data.bonus : getSavedBonus();
        if (data && data.canSpin === false) {
          if (savedBonus != null) {
            setTimeout(function () { spinWheel(savedBonus, true); }, 600);
          } else {
            showAlreadyParticipated(getSavedBonus());
          }
          return;
        }
        if (getSavedBonus() != null && !data) {
          setTimeout(function () { spinWheel(getSavedBonus(), true); }, 600);
          return;
        }
        setTimeout(function () { spinWheel(null, false); }, 600);
      })
      .catch(function () {
        if (getSavedBonus() != null) {
          setTimeout(function () { spinWheel(getSavedBonus(), true); }, 600);
        } else {
          setTimeout(function () { spinWheel(null, false); }, 600);
        }
      });
  }
})();
