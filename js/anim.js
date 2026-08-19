/* ==========================================================================
   Анимации появления (GSAP + ScrollTrigger)

   Принципы:
   — анимируем только заголовки секций и обводки-градиенты, не всё подряд;
   — начальное состояние задано в CSS, поэтому нет вспышки «показали и спрятали»;
   — двигаем только transform и opacity, без пересчёта раскладки;
   — без JS и при prefers-reduced-motion страница остаётся статичной и целой.
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;

  // Библиотека не подгрузилась — снимаем предварительное скрытие,
  // иначе контент останется невидимым.
  if (!window.gsap || !window.ScrollTrigger) {
    root.classList.add('anim-off');
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  gsap.matchMedia().add({
    motion: '(prefers-reduced-motion: no-preference)',
    reduce: '(prefers-reduced-motion: reduce)'
  }, function (ctx) {

    if (ctx.conditions.reduce) {
      root.classList.add('anim-off');
      return;
    }

    /* ----------------------------------------------------------------------
       1. Первая загрузка: шапка и первый экран
       В фоновой вкладке requestAnimationFrame заморожен: вступление не
       проиграется и первый экран останется невидимым. Поэтому там просто
       показываем всё сразу.
       ---------------------------------------------------------------------- */
    if (document.hidden) {
      root.classList.add('anim-off');
      return;
    }

    gsap.timeline({ defaults: { duration: 0.9, ease: 'power2.out' } })
      .to('.site-header',    { y: 0, opacity: 1, duration: 0.6 })
      .to('.hero__title',    { y: 0, opacity: 1 }, '-=0.35')
      .to('.hero__card > *', { y: 0, opacity: 1, stagger: 0.1 }, '-=0.55');

    /* ----------------------------------------------------------------------
       2. Заголовки секций — по одному элементу на секцию.
       Раньше выбирались и .section-head, и вложенный в него h2: заголовок
       анимировался дважды и мерцал. Теперь метка .js-reveal стоит в разметке
       ровно один раз на блок.
       ---------------------------------------------------------------------- */
    gsap.utils.toArray('.js-reveal').forEach(function (el) {
      gsap.to(el, {
        y: 0, opacity: 1,
        duration: 1, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      });
    });

    /* ----------------------------------------------------------------------
       3. Плитки с цифрами и карточки кейсов
       Обводка у них — радиальный градиент: разводим его от центра к граням
       («расходящиеся лучи»), следом мягкая вспышка свечения.
       ---------------------------------------------------------------------- */
    gsap.utils.toArray('.gborder').forEach(function (el) {
      gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 88%', once: true } })
        .to(el, { opacity: 1, duration: 0.8, ease: 'power2.out' })
        .fromTo(el, { '--gb-spread': '0%' },
                    { '--gb-spread': '100%', duration: 1.4, ease: 'power2.out' }, '-=0.6')
        .fromTo(el, { '--gb-glow': 0 },
                    { '--gb-glow': 0.45, duration: 0.6, ease: 'power1.out' }, '-=0.9')
        .to(el, { '--gb-glow': 0, duration: 1.2, ease: 'power1.inOut' });
    });

    /* Раскладка меняется по мере загрузки картинок — пересчитываем триггеры */
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });

    return function () { root.classList.add('anim-off'); };
  });
})();
