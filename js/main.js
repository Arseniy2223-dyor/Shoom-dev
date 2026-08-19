/* ==========================================================================
   Скрипты страницы: плееры, выбор авто, параллакс и текст по кругу.
   ========================================================================== */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------------
     1. Плееры YouTube
     На странице лежит только обложка; iframe создаётся по клику — иначе два
     ролика тянут ~1.5 МБ сторонних скриптов при каждом открытии страницы.
     ------------------------------------------------------------------------ */
  function mountPlayer(player) {
    var id = player.dataset.videoId;
    if (!id || player.dataset.mounted) return;

    var frame = document.createElement('iframe');
    frame.className = 'player__frame';
    frame.src = 'https://www.youtube-nocookie.com/embed/' + id +
                '?autoplay=1&rel=0&modestbranding=1';
    frame.title = 'Видео о шумоизоляции';
    frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; ' +
                  'gyroscope; picture-in-picture; web-share';
    frame.allowFullscreen = true;

    var poster = player.querySelector('[data-player-play]');
    if (poster) poster.remove();

    player.appendChild(frame);
    player.dataset.mounted = 'true';
    frame.focus({ preventScroll: true });
  }

  document.querySelectorAll('[data-player]').forEach(function (player) {
    var btn = player.querySelector('[data-player-play]');
    if (btn) btn.addEventListener('click', function () { mountPlayer(player); });
  });

  /* ------------------------------------------------------------------------
     2. Выбор автомобиля — раскрывающийся список с поиском
     Справочник вынесен сюда, чтобы его можно было заменить выгрузкой с бэкенда,
     не трогая разметку.
     ------------------------------------------------------------------------ */
  var CARS = {
    'Audi':        ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'Q8'],
    'BMW':         ['1 серия', '3 серия', '5 серия', 'X1', 'X3', 'X5', 'X7'],
    'Chery':       ['Tiggo 4', 'Tiggo 7 Pro', 'Tiggo 8 Pro', 'Arrizo 8'],
    'Exeed':       ['LX', 'TXL', 'VX', 'RX'],
    'Geely':       ['Atlas', 'Coolray', 'Monjaro', 'Tugella', 'Emgrand'],
    'Haval':       ['Jolion', 'F7', 'F7x', 'Dargo', 'H9'],
    'Hyundai':     ['Solaris', 'Creta', 'Tucson', 'Santa Fe', 'Elantra'],
    'Kia':         ['Rio', 'Rio X', 'Ceed', 'Sportage', 'Sorento', 'K5'],
    'Lada':        ['Vesta', 'Granta', 'Niva Travel', 'XRAY'],
    'Mazda':       ['3', '6', 'CX-5', 'CX-9'],
    'Mercedes-Benz': ['A-класс', 'C-класс', 'E-класс', 'GLC', 'GLE'],
    'Mitsubishi':  ['Lancer', 'Outlander', 'Pajero Sport', 'ASX'],
    'Nissan':      ['Juke', 'Qashqai', 'X-Trail', 'Almera', 'Terrano'],
    'Omoda':       ['C5', 'S5', 'C7'],
    'Renault':     ['Logan', 'Duster', 'Kaptur', 'Arkana'],
    'Skoda':       ['Octavia', 'Rapid', 'Kodiaq', 'Karoq', 'Superb'],
    'Toyota':      ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Highlander'],
    'Volkswagen':  ['Polo', 'Jetta', 'Tiguan', 'Touareg', 'Teramont']
  };

  function Combo(root) {
    this.root    = root;
    this.role    = root.dataset.comboRole;
    this.toggle  = root.querySelector('[data-combo-toggle]');
    this.valueEl = root.querySelector('[data-combo-value]');
    this.panel   = root.querySelector('[data-combo-panel]');
    this.search  = root.querySelector('[data-combo-search]');
    this.list    = root.querySelector('[data-combo-list]');
    this.empty   = root.querySelector('[data-combo-empty]');
    this.items   = [];
    this.value   = null;
    this.placeholder = this.valueEl.textContent.trim();

    this.toggle.addEventListener('click', this.onToggle.bind(this));
    this.search.addEventListener('input', this.filter.bind(this));
    this.root.addEventListener('keydown', this.onKeydown.bind(this));
  }

  Combo.prototype.setItems = function (items) {
    this.items = items;
    this.value = null;
    this.valueEl.textContent = this.placeholder;
    this.valueEl.classList.remove('combo__value--filled');
    this.toggle.disabled = items.length === 0;
    this.render(items);
  };

  Combo.prototype.render = function (items) {
    this.list.textContent = '';
    items.forEach(function (name) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'combo__option';
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', String(name === this.value));
      btn.textContent = name;
      btn.addEventListener('click', this.select.bind(this, name));
      li.appendChild(btn);
      this.list.appendChild(li);
    }, this);
    this.empty.hidden = items.length > 0;
  };

  Combo.prototype.filter = function () {
    var q = this.search.value.trim().toLowerCase();
    this.render(this.items.filter(function (name) {
      return name.toLowerCase().indexOf(q) !== -1;
    }));
  };

  Combo.prototype.open = function () {
    closeAll(this);
    this.panel.hidden = false;
    this.toggle.setAttribute('aria-expanded', 'true');
    this.search.value = '';
    this.render(this.items);
    this.search.focus();
  };

  Combo.prototype.close = function () {
    this.panel.hidden = true;
    this.toggle.setAttribute('aria-expanded', 'false');
  };

  Combo.prototype.onToggle = function () {
    if (this.panel.hidden) this.open(); else this.close();
  };

  Combo.prototype.select = function (name) {
    this.value = name;
    this.valueEl.textContent = name;
    this.valueEl.classList.add('combo__value--filled');
    this.close();
    this.toggle.focus();
    if (this.role === 'brand' && combos.model) {
      combos.model.setItems(CARS[name] || []);
    }
  };

  Combo.prototype.onKeydown = function (e) {
    if (e.key === 'Escape' && !this.panel.hidden) {
      this.close();
      this.toggle.focus();
    }
  };

  var all = [];
  var combos = {};

  function closeAll(except) {
    all.forEach(function (c) { if (c !== except) c.close(); });
  }

  document.querySelectorAll('[data-combo]').forEach(function (root) {
    var c = new Combo(root);
    all.push(c);
    combos[c.role] = c;
  });

  if (combos.brand) combos.brand.setItems(Object.keys(CARS));
  if (combos.model) combos.model.setItems([]);

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-combo]')) closeAll(null);
  });

  /* ------------------------------------------------------------------------
     3. Подсветка зон и смена ракурса
     У зоны есть свой ракурс (data-view). Выбор зоны с другой стороны кузова
     переключает кадр; галочки остальных зон при этом не трогаем.
     ------------------------------------------------------------------------ */
  var stage = document.querySelector('.carview-stage');
  if (stage) {
    var views = [].slice.call(stage.querySelectorAll('[data-view]'));

    var dots = [].slice.call(document.querySelectorAll('[data-dots] .carview-dots__item'));

    // На мобильном кадры стоят в ряд и листаются прокруткой
    function isSwipe() { return stage.scrollWidth > stage.clientWidth + 1; }

    function markActive(index) {
      dots.forEach(function (d, i) { d.classList.toggle('is-active', i === index); });
    }

    function showView(name) {
      var index = 0;
      views.forEach(function (v, i) {
        var on = v.dataset.view === name;
        if (on) index = i;
        v.classList.toggle('is-active', on);
        if (on) v.removeAttribute('aria-hidden');
        else v.setAttribute('aria-hidden', 'true');
      });
      document.querySelectorAll('[data-view-btn]').forEach(function (b) {
        if (b.dataset.viewBtn === name) b.setAttribute('aria-current', 'true');
        else b.removeAttribute('aria-current');
      });
      markActive(index);
      if (isSwipe()) {
        stage.scrollTo({ left: views[index].offsetLeft - stage.offsetLeft, behavior: 'smooth' });
      }
    }

    // Пролистали вручную — подсвечиваем нужную точку
    var scrollTimer = null;
    stage.addEventListener('scroll', function () {
      if (!isSwipe()) return;
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(function () {
        var i = Math.round(stage.scrollLeft / stage.clientWidth);
        markActive(Math.max(0, Math.min(views.length - 1, i)));
      }, 80);
    }, { passive: true });

    var viewBtns = [].slice.call(document.querySelectorAll('[data-view-btn]'));
    viewBtns.forEach(function (btn) {
      btn.addEventListener('click', function () { showView(btn.dataset.viewBtn); });
    });

    document.querySelectorAll('.zone__check').forEach(function (input) {
      var layer = stage.querySelector('[data-zone="' + input.value + '"]');

      function sync() { if (layer) layer.classList.toggle('is-on', input.checked); }

      input.addEventListener('change', function () {
        sync();
        // показываем тот кадр, где зона видна — но только когда её включили
        if (input.checked && input.dataset.view) showView(input.dataset.view);
        syncSummary();
      });
      sync();
    });
  }

  /* ------------------------------------------------------------------------
     3. Выбор тарифа
     ------------------------------------------------------------------------ */
  var tariffs = [].slice.call(document.querySelectorAll('.tariff'));
  tariffs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tariffs.forEach(function (other) {
        other.setAttribute('aria-pressed', String(other === btn));
      });
    });
  });

  /* ------------------------------------------------------------------------
     4. Итого в калькуляторе
     Пункт появляется и исчезает вместе с зоной, общая сумма — по видимым.
     Суммы берём из разметки, чтобы потом заменить их выдачей бэкенда.
     ------------------------------------------------------------------------ */
  var groups   = [].slice.call(document.querySelectorAll('[data-summary-group]'));
  var grandEl  = document.querySelector('[data-grand-total]');

  function money(str) { return parseInt(String(str).replace(/[^0-9]/g, ''), 10) || 0; }
  function spaced(n)  { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }

  var summaryBox = document.querySelector('.summary');

  function syncSummary() {
    var sum = 0, shown = 0;
    groups.forEach(function (g) {
      var on = document.querySelector('.zone__check[value="' + g.dataset.summaryGroup + '"]');
      var visible = !!(on && on.checked);
      g.hidden = !visible;
      if (visible) { shown++; sum += money(g.querySelector('[data-group-total]').textContent); }
    });
    if (grandEl) grandEl.textContent = spaced(sum) + ' \u20BD';
    // Ни одной зоны — подводить нечего: остаётся только кнопка
    if (summaryBox) summaryBox.classList.toggle('is-empty', shown === 0);
  }

  syncSummary();

  /* ------------------------------------------------------------------------
     4. Корзина
     Счётчик встаёт на место кнопки; сумма и количество в шапке пересчитываются
     по всем карточкам сразу, чтобы состояние не разъезжалось.
     ------------------------------------------------------------------------ */
  var cartItems = [].slice.call(document.querySelectorAll('[data-cart-item]'));
  var totalEl   = document.querySelector('[data-cart-total]');
  var countEl   = document.querySelector('[data-cart-count]');
  var cartLink  = document.querySelector('[data-cart-link]');

  function nbsp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'); }

  function refreshCart() {
    var sum = 0, qty = 0;
    cartItems.forEach(function (item) {
      var n = +item.dataset.qty || 0;
      qty += n;
      sum += n * (+item.dataset.price || 0);
    });
    if (totalEl) totalEl.textContent = nbsp(sum) + ' \u20BD';
    if (countEl) countEl.textContent = nbsp(qty) + ' шт';
    if (cartLink) {
      cartLink.setAttribute('aria-label',
        qty ? 'Корзина: ' + qty + ' шт на сумму ' + nbsp(sum) + ' рублей' : 'Корзина пуста');
    }
  }

  cartItems.forEach(function (item) {
    var add     = item.querySelector('[data-cart-add]');
    var stepper = item.querySelector('[data-stepper]');
    var valueEl = item.querySelector('[data-stepper-value]');
    item.dataset.qty = 0;

    function render() {
      var n = +item.dataset.qty;
      item.classList.toggle('is-active', n > 0);
      valueEl.textContent = n;
      refreshCart();
    }

    add.addEventListener('click', function () {
      item.dataset.qty = 1;
      render();
    });

    stepper.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-step]');
      if (!btn) return;
      item.dataset.qty = Math.max(0, +item.dataset.qty + (+btn.dataset.step));
      render();
      if (+item.dataset.qty === 0) add.focus();
    });

    render();
  });

  /* ------------------------------------------------------------------------
     4. Закрепление секций
     Секция ниже вьюпорта не может липнуть к top:0 — она застынет первым
     экраном, а остаток контента станет недостижим. Поэтому для высоких
     блоков прижимаем не верх, а низ: top = 100vh - высота.
     ------------------------------------------------------------------------ */
  var pins = [].slice.call(document.querySelectorAll('.pin'));

  function layoutPins() {
    pins.forEach(function (el) {
      var h = el.offsetHeight;
      el.style.top = h > window.innerHeight ? (window.innerHeight - h) + 'px' : '0px';
    });
  }

  if (pins.length) {
    layoutPins();
    window.addEventListener('resize', layoutPins);
    window.addEventListener('load', layoutPins);
  }

  /* ------------------------------------------------------------------------
     4. Параллакс дуги и появление лент
     Всё считаем в одном rAF-цикле, чтобы не дёргать layout на каждый скролл.
     ------------------------------------------------------------------------ */
  var frames  = [].slice.call(document.querySelectorAll('[data-frame]'));
  var ticking = false;

  // Насколько элемент прошёл через экран: 0 — только показался снизу,
  // 1 — полностью ушёл вверх. Всё за пределами обрезаем, иначе далёкие
  // блоки копят сотни градусов и процентов.
  function passed(box, vh) {
    var p = (vh - box.top) / (vh + box.height);
    return Math.max(0, Math.min(1, p));
  }

  function update() {
    ticking = false;
    var vh = window.innerHeight;

    // Рамка бегущего текста вокруг формы
    frames.forEach(function (frame) {
      var p = passed(frame.getBoundingClientRect(), vh);
      frame.style.setProperty('--shift', p.toFixed(3));
    });
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  if (!reduceMotion && frames.length) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    // Во вкладке на фоне rAF заморожен — пересчитываем, когда её открыли снова
    document.addEventListener('visibilitychange', function () {
      if (!document.hidden) update();
    });
    update();
  }

  /* ------------------------------------------------------------------------
     6. Ограниченный рывок за краями страницы
     Нативный отскок отключён (overscroll-behavior:none) — его дальность
     задаёт ОС и она не настраивается. Здесь свой: сдвиг затухает по
     экспоненте и упирается в потолок, потом плавно возвращается.
     ------------------------------------------------------------------------ */
  (function () {
    if (reduceMotion) return;

    var MAX = 80;          // максимум белой зоны, px
    var DAMP = 0.28;       // доля колеса, уходящая в рывок
    var page = document.body;
    var raw = 0;           // накопленный «нажим»
    var shown = 0;         // фактический сдвиг
    var releasing = false;
    var timer = null;

    function maxScroll() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }
    function atTop() { return window.scrollY <= 0; }
    function atBottom() { return window.scrollY >= maxScroll() - 1; }

    function paint(v) {
      shown = v;
      page.style.transform = v ? 'translate3d(0,' + v.toFixed(1) + 'px,0)' : '';
    }

    // экспоненциальное затухание: чем сильнее крутят, тем меньше прибавка
    function eased(v) {
      var sign = v < 0 ? -1 : 1;
      return sign * MAX * (1 - Math.exp(-Math.abs(v) / MAX));
    }

    function reset() { raw = 0; releasing = false; paint(0); }

    function release() {
      releasing = true;
      raw = 0;                                     // нажим снят сразу
      var from = shown, start = null;
      (function step(t) {
        if (start === null) start = t;
        var k = Math.min(1, (t - start) / 260);
        var e = 1 - Math.pow(1 - k, 3);            // плавное торможение
        paint(from * (1 - e));
        if (k < 1) requestAnimationFrame(step);
        else reset();
      })(performance.now());
    }

    // В фоновой вкладке rAF заморожен и возврат бы не доиграл — страница
    // осталась бы сдвинутой. Возвращаем её сразу при уходе и при возврате.
    document.addEventListener('visibilitychange', reset);

    window.addEventListener('wheel', function (e) {
      var up = e.deltaY < 0, down = e.deltaY > 0;
      if (!((up && atTop()) || (down && atBottom()))) {
        if (shown && !releasing) release();
        return;
      }
      e.preventDefault();
      releasing = false;
      raw -= e.deltaY * DAMP;
      paint(eased(raw));
      clearTimeout(timer);
      timer = setTimeout(release, 90);
    }, { passive: false });

    window.addEventListener('scroll', function () {
      if (shown && !releasing) release();
    }, { passive: true });
  })();


  /* ------------------------------------------------------------------------
     7. Выдвижное меню (мобильная шапка)
     ------------------------------------------------------------------------ */
  (function () {
    var toggle = document.querySelector('[data-menu-toggle]');
    var menu   = document.querySelector('[data-menu]');
    if (!toggle || !menu) return;

    function setOpen(open) {
      menu.hidden = !open;
      toggle.setAttribute('aria-expanded', String(open));
      // пока меню открыто, страница под ним не прокручивается
      document.body.style.overflow = open ? 'hidden' : '';
    }

    toggle.addEventListener('click', function () {
      setOpen(menu.hidden);
    });

    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setOpen(false);   // перешли по пункту — закрываем
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !menu.hidden) { setOpen(false); toggle.focus(); }
    });

    // На десктопе меню не нужно
    window.matchMedia('(min-width:768px)').addEventListener('change', function (m) {
      if (m.matches) setOpen(false);
    });
  })();

})();
