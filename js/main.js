/* ============================================================
   Creative Network · main.js
   Preloader (Figma 188:59 → 243:127) → Hero reveal (191:184)
   → scrubbed hero stage (194:308 → 194:345) → menu (373:2384).
   ============================================================ */

(function () {
  "use strict";

  /* The browser restores the previous scroll position on reload before any
     of this runs. If that lands mid-page, initScrollStage()'s scrub timeline
     (built at boot, before the preloader even finishes) reads that leftover
     scrollY and snaps hero/header/showreel straight to their scrolled-away
     state — then run()'s scrollTo(0,0) yanks it back, reading as a jump on
     every reload after the first. Force top-of-page ourselves instead. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  var PICS = [
    "preloader/images/pic1.webp",
    "preloader/images/pic2.webp",
    "preloader/images/pic3.webp",
    "preloader/images/pic4.webp",
    "preloader/images/pic5.webp",
    "preloader/images/pic6.webp"
  ];

  var body = document.body;
  var preloader = document.getElementById("preloader");
  var site = document.getElementById("site");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var touchDevice = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  var hasGsap = typeof gsap !== "undefined";

  if (hasGsap && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
    // never auto-refresh on "load": it can fire mid-reveal while the
    // whole site is scaled down, poisoning every trigger's ranges
    ScrollTrigger.config({ autoRefreshEvents: "visibilitychange,resize" });
  }

  function S() { return window.innerWidth / 1440; }

  /* ============================================================
     Live clocks
     ============================================================ */
  function pad(n) { return String(n).padStart(2, "0"); }

  function updateClocks() {
    var now = new Date();
    var offsetMin = -now.getTimezoneOffset();
    var sign = offsetMin >= 0 ? "+" : "-";
    var offH = Math.floor(Math.abs(offsetMin) / 60);
    var local = pad(now.getHours()) + ":" + pad(now.getMinutes()) + ":" + pad(now.getSeconds());
    document.getElementById("clock-local").textContent =
      "Local Hour: " + local + " [GMT " + sign + offH + "]";
    try {
      var usa = new Intl.DateTimeFormat("en-GB", {
        timeZone: "America/New_York",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
      }).format(now);
      document.getElementById("clock-usa").textContent = "USA Hour: " + usa + " [GMT -5]";
    } catch (e) { /* keep static fallback */ }
  }
  updateClocks();
  setInterval(updateClocks, 1000);

  /* ============================================================
     Hero scroll stage · scrubbed 191:184 → 194:308 → 194:345
     ============================================================ */
  var stageInited = false;
  var stageST = null; // the stage's ScrollTrigger — paused while the reel is fullscreen

  function initScrollStage() {
    if (stageInited || !hasGsap || typeof ScrollTrigger === "undefined") return;
    stageInited = true;

    var header = document.getElementById("header");
    var heroCenter = document.getElementById("hero-center");
    var script = document.getElementById("hero-script");
    var showreel = document.getElementById("showreel");
    var curated = document.getElementById("curated");
    var stageEl = document.getElementById("scroll-stage");

    // Figma (194:345) puts the grown showreel's bottom edge at 560 and
    // "Curated talent…" at top:640/bottom:776 — an exact 80px gap. That's
    // authored against the 1440×900 canvas; .stage-sticky is real 100vh,
    // so on a wider/shorter-than-1440:900 viewport 776*S() alone can
    // exceed the actual viewport height. HFIT shrinks just this showreel
    // + curated pair (never the header/hero title above) so the 80px
    // gap — and everything else about the pair — stays exactly
    // proportional to Figma at any aspect ratio, instead of clipping or
    // drifting into an arbitrary hand-picked gap.
    var HFIT = 1;
    function computeHfit() {
      HFIT = Math.min(1, (window.innerHeight * 0.98) / (776 * S()));
      if (stageEl) stageEl.style.setProperty("--hfit", HFIT);
    }
    computeHfit();
    window.addEventListener("resize", computeHfit);

    gsap.set(curated, { xPercent: -50, x: 0, y: function () { return 420 * S() * HFIT; }, opacity: 0 });

    var stl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#scroll-stage",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2, // softer catch-up — wheel ticks glide instead of stepping

        invalidateOnRefresh: true
      }
    });

    /* phase 1 · 191:184 → 194:308 */
    stl.to(header, { y: function () { return -150 * S(); } , duration: 0.5 }, 0);
    stl.to(heroCenter, { y: function () { return -320 * S(); }, opacity: 0, duration: 0.45 }, 0);
    stl.to(script, { y: function () { return -440 * S(); }, duration: 1 }, 0);
    stl.to(showreel, {
      top: function () { return 509 * S() * HFIT; },
      width: function () { return 920 * S() * HFIT; },
      height: function () { return 530 * S() * HFIT; },
      duration: 1
    }, 0);

    /* phase 2 · 194:308 → 194:345 */
    stl.to(script, { y: function () { return -1150 * S(); }, duration: 1 }, 1);
    stl.to(showreel, {
      top: function () { return -180 * S() * HFIT; },
      width: function () { return 1280 * S() * HFIT; },
      height: function () { return 740 * S() * HFIT; },
      duration: 1
    }, 1);
    stl.to(curated, { y: 0, opacity: 1, duration: 0.7 }, 1.2);

    stageST = stl.scrollTrigger;
  }

  /* ============================================================
     About story stage · scrubbed (Figma 195:166 → 195:326)
     ============================================================ */
  var aboutInited = false;

  function initAboutStage() {
    if (aboutInited || !hasGsap || typeof ScrollTrigger === "undefined") return;
    aboutInited = true;

    var line1 = document.getElementById("about-line1");
    var line2 = document.getElementById("about-line2");
    var words = gsap.utils.toArray(line1.querySelectorAll(".aw"));
    var words2 = gsap.utils.toArray(line2.querySelectorAll(".aw2"));
    var bgRadial = document.querySelector(".about-bg--radial");
    var bgSolid = document.querySelector(".about-bg--solid");
    var build = document.getElementById("about-build");
    var chipsWrap = document.getElementById("about-chips");
    var chips = gsap.utils.toArray(chipsWrap.querySelectorAll(".chip"));

    /* the chip column is as wide as its widest pill */
    function measure() {
      var maxW = 0;
      chips.forEach(function (c) { maxW = Math.max(maxW, c.offsetWidth); });
      chipsWrap.style.width = maxW + "px";
    }
    measure();
    ScrollTrigger.addEventListener("refresh", measure);

    var bigword = document.getElementById("about-bigword");
    var BIG_WORDS = ["model", "for", "brand", "design"];

    gsap.set(line1, { xPercent: -50, yPercent: -50 });
    gsap.set(bigword, { xPercent: -50, yPercent: -50 });

    /* ---- phase 1 ----
       1) "A new" sweeps in at its final 52px size (195:166)
       2) model / for / brand / design pass by at a fixed 400px with
          the left-faint → right-blue gradient (195:201), no scaling
       3) the big word shrinks away and the full 52px sentence
          assembles, "design" staying blue (195:205)              */

    // gradient sweep of a small-sentence word: 100 → target
    function sweepWord(i, t, target) {
      var pos = 100 - (100 - target) * Math.max(0, Math.min(1, t));
      words[i].style.backgroundPosition = pos + "% 0";
    }

    var pA = { p: 0 };     // "A new"
    var pB = { t: 0 };     // big words cycle
    var pC = { p: 0 };     // sentence assembly
    var bigIdx = -1;

    function applyBigWords() {
      var idx = Math.min(Math.floor(pB.t), BIG_WORDS.length - 1);
      var local = pB.t - idx;
      if (idx !== bigIdx) {
        bigIdx = idx;
        bigword.textContent = BIG_WORDS[idx];
      }
      // reveal left → right with a soft, feathered edge (no hard clip
      // line): a moving mask gradient whose fade zone overshoots both
      // ends, so the word starts fully hidden and ends fully opaque
      // with never a crisp cut through a letterform
      var reveal = Math.min(local * 1.9, 1);
      var feather = 20; // % of word width — larger = softer edge
      var edge = -feather + reveal * (100 + 2 * feather);
      var mask = "linear-gradient(to right, #000 " + (edge - feather / 2) + "%, transparent " + (edge + feather / 2) + "%)";
      bigword.style.webkitMaskImage = mask;
      bigword.style.maskImage = mask;

      // freeze the drift once the final word is fully revealed, so the
      // hand-off to the "shrink into place" tween below is seamless
      var isFinal = idx === BIG_WORDS.length - 1;
      if (!(isFinal && reveal >= 1)) {
        gsap.set(bigword, { x: (70 - 150 * local) * S() });
      }
    }

    var p3 = { v: 0 };
    var CHIP_STEP = 96;

    function applyChips() {
      var step = CHIP_STEP * S();
      chips.forEach(function (chip, i) {
        var d = i - p3.v;
        gsap.set(chip, {
          y: d * step,
          opacity: Math.max(0, 1 - Math.abs(d) * 1.4),
          scale: 1 - Math.min(Math.abs(d) * 0.08, 0.16)
        });
      });
    }
    applyChips();

    /* ---- master scrub · 3400 scroll-units ---- */
    var atl = gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#about-stage",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.2,
        invalidateOnRefresh: true
      }
    });

    /* phase 1 · 0–1200 */
    // 1a · "A new" appears at final size, centred on screen (195:166)
    atl.set(line1, {
      x: function () {
        var W = line1.offsetWidth;
        var pairEnd = words[1].offsetLeft + words[1].offsetWidth;
        return (W - pairEnd) / 2;
      }
    }, 0);
    atl.set(line1, { x: 0 }, 400); // recentre while hidden
    atl.to(pA, {
      p: 1, duration: 150,
      onUpdate: function () {
        sweepWord(0, pA.p / 0.6, 0);
        sweepWord(1, (pA.p - 0.35) / 0.65, 0);
      }
    }, 0);
    // 1b · the sentence steps aside, big words fly through (195:201)
    atl.to(line1, { opacity: 0, duration: 50 }, 165);
    atl.set(bigword, { opacity: 1 }, 170);
    atl.to(pB, { t: 3.999, duration: 800, onUpdate: applyBigWords }, 170);
    // 1c · the giant "design" simply dissolves where it is — no morph,
    // no position-matching (that read as "already sitting in place"
    // and, since it relies on scaling 400px text down via a CSS
    // transform, it always looked soft/blurred). It fades out cleanly
    // and fully *before* the sentence below starts resolving, so the
    // small "design" gets to smoothly appear on its own, the same way
    // model/for/brand do — never overlapping, never scaled, never blurred.
    atl.to(bigword, {
      opacity: 0,
      duration: 90,
      ease: "power1.in"
    }, 950);
    // …and the full 52px sentence assembles (195:205)
    atl.to(line1, { opacity: 1, duration: 80 }, 1000);
    atl.to(pC, {
      p: 1, duration: 220,
      onUpdate: function () {
        sweepWord(2, (pC.p - 0.0) / 0.5, 0);
        sweepWord(3, (pC.p - 0.15) / 0.5, 0);
        sweepWord(4, (pC.p - 0.3) / 0.5, 0);
        sweepWord(5, (pC.p - 0.45) / 0.55, 0); // "design" resolves to flat solid blue (target 0 = the aw--blue gradient's flat zone, same convention as the other words)
      }
    }, 980);

    /* phase 2 · blue takeover 1180–2600 */
    atl.to(line1, { opacity: 0, duration: 140 }, 1220);
    atl.fromTo(bgRadial, { opacity: 0, scale: 0.7 }, { opacity: 1, scale: 1.12, duration: 520 }, 1300);
    atl.to(words2, { opacity: 1, duration: 200, stagger: 55 }, 1520);
    atl.to(bgSolid, { opacity: 1, duration: 320 }, 1980);
    atl.to(line2, { opacity: 0, duration: 180 }, 2380);
    atl.to([bgSolid, bgRadial], { opacity: 0, duration: 240 }, 2400);

    /* phase 3 · chips 2560–3400 */
    atl.to(build, { opacity: 1, duration: 160 }, 2580);
    atl.to(p3, { v: 3, duration: 620, onUpdate: applyChips }, 2700);
    atl.to({}, { duration: 80 }, 3320); // settle beat
  }

  /* ============================================================
     Artists / Designers · aurora block
     intro scrub (279:141 → 279:216 → 279:274) → directory (279:791)
     ============================================================ */
  var NAMES = [
    "Clara Hayes", "Maya Chen", "Theo Bennett",
    "Ethan Cole", "Daniel Ross", "Lena Ford",
    "Nina Walsh", "Emma Brooks", "Oscar Vale",
    "Oliver Grant", "Alex Turner", "Iris Walker",
    "Mila Carter", "Leo Morgan", "Max Rivera",
    "Julian Stone", "Sofia Reed", "Elena Hart",
    "Ava Monroe", "Noah Blake", "Felix Gray"
  ];
  var SENTENCE = "Meet designers behind every project";
  var CENTER = 10; // row 4, col 2 → Alex Turner, the zoom focus

  function c01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function sm(x) { x = c01(x); return x * x * (3 - 2 * x); }

  function decorHTML() {
    return '<span class="d-corner d-corner--tl"></span>' +
           '<span class="d-corner d-corner--tr"></span>' +
           '<span class="d-corner d-corner--bl"></span>' +
           '<span class="d-corner d-corner--br"></span>' +
           '<span class="d-ret d-ret--l"></span>' +
           '<span class="d-ret d-ret--r"></span>' +
           '<span class="d-ret d-ret--t"></span>' +
           '<span class="d-ret d-ret--b"></span>';
  }
  function avatarSrc(name) { return "main%20page/content/" + encodeURIComponent(name) + ".webp"; }
  function personHTML(name) {
    return '<span class="d-person">' +
             '<img class="d-person__avatar" src="' + avatarSrc(name) + '" alt="" loading="lazy" />' +
             '<span class="d-person__name">' + name + '</span>' +
           '</span>';
  }

  function buildField() {
    var field = document.getElementById("d-field");
    if (!field) return;
    var html = "";
    for (var i = 0; i < NAMES.length; i++) {
      html += '<div class="d-plaque">' + decorHTML() +
                '<span class="d-plaque__line">' + SENTENCE + '</span>' +
                '<span class="d-plaque__person">' + personHTML(NAMES[i]) + '</span>' +
              '</div>';
    }
    field.innerHTML = html;
  }

  var auroraInited = false;
  function initAurora() {
    if (auroraInited) return;
    var canvas = document.getElementById("fx-canvas");
    if (!canvas || !window.CNEffects) return;
    if (!CNEffects.mount(canvas)) return;
    auroraInited = true;
    if (hasGsap && typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.create({
        trigger: "#artists",
        start: "top bottom",
        end: "bottom top",
        onToggle: function (self) { CNEffects.setActive(self.isActive); },
        onRefresh: function (self) { CNEffects.setActive(self.isActive); }
      });
    } else {
      CNEffects.setActive(true);
    }
  }

  var artistsInited = false;
  function initArtistsIntro() {
    if (artistsInited || !hasGsap || typeof ScrollTrigger === "undefined") return;
    var field = document.getElementById("d-field");
    if (!field) return;
    artistsInited = true;

    var plaques = gsap.utils.toArray(field.querySelectorAll(".d-plaque"));
    var firstword = document.getElementById("d-firstword");
    var hint = document.querySelector(".d-scrollhint");
    var over = document.getElementById("d-over");
    var lines = plaques.map(function (p) { return p.querySelector(".d-plaque__line"); });
    var persons = plaques.map(function (p) { return p.querySelector(".d-plaque__person"); });

    /* timeline (v 0..1):
       .10 "All disciplines"→"Meet designers"  .18–.35 stacked plaques
       .30–.60 dolly out to the 21-grid, sentences→people (no overlap)
       .60–.80 HOLD — grid sits still (~2 scrolls)
       .80–.88 grid dissolves (quick)          .82–.94 OVER-100 panel rises */
    function render(v) {
      if (window.CNEffects) CNEffects.setProgress(c01((v - 0.1) / 0.5));

      var Z0 = 2.87; // 380-wide plaque × 2.87 = the 1090×220 opening frame
      var Z = v < 0.30 ? Z0
            : v < 0.60 ? Z0 + (1.0 - Z0) * sm((v - 0.30) / 0.30)
            : 1.0;
      // .d-sticky is real 100vh (see style.css) while --s only tracks
      // width, so on a wide/short window the 856px-tall field (at
      // native size) can exceed the real viewport height. Shrink Z
      // uniformly so the field — cards, gaps, text, all children
      // scale together via the same transform — always fits with a
      // comfortable margin, on any aspect ratio.
      var FIELD_H = 856, s = S();
      var fit = Math.min(1, (window.innerHeight * 0.88) / (FIELD_H * s));
      field.style.setProperty("--z", Z * fit);

      // sequential swaps — one part leaves before the next appears
      var fwOut = sm((v - 0.06) / 0.05);          // "All disciplines" out
      var centerIn = sm((v - 0.12) / 0.05);       // centre sentence in
      var lineOut = 1 - sm((v - 0.40) / 0.08);    // sentences out  [.40,.48]
      var personIn = sm((v - 0.49) / 0.08);       // people in      [.49,.57]
      var gridVis = 1 - sm((v - 0.80) / 0.07);    // grid dissolves (quick)

      if (firstword) firstword.style.opacity = String((1 - fwOut) * (1 - sm((v - 0.30) / 0.1)));
      if (hint) hint.style.opacity = String((1 - sm((v - 0.24) / 0.16)));

      var spread = c01((v - 0.14) / 0.42);
      for (var i = 0; i < plaques.length; i++) {
        var col = i % 3, row = (i / 3) | 0;
        var dRow = Math.abs(row - 3), dCol = Math.abs(col - 1);
        var cost = dRow * 0.11 + dCol * 0.42;
        var app = i === CENTER ? 1 : c01((spread - cost) / 0.14);

        plaques[i].style.opacity = String(app * gridVis);
        plaques[i].style.filter = (app >= 1 || gridVis < 1) ? "none" : "blur(" + ((1 - app) * 8 * S()) + "px)";

        var lineOp = app * lineOut;
        if (i === CENTER) lineOp = centerIn * lineOut;
        lines[i].style.opacity = String(lineOp);
        persons[i].style.opacity = String(app * personIn);
      }

      // OVER-100 panel rises from below as the grid clears
      if (over) {
        var rise = sm((v - 0.82) / 0.12);
        over.style.opacity = String(rise);
        over.style.transform = "translateY(" + ((1 - rise) * 60) + "%)";
      }
    }

    if (location.hash === "#dbg") window.__render = render;

    var proxy = { v: 0 };
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#d-stage",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1,
        invalidateOnRefresh: true
      }
    }).to(proxy, { v: 1, duration: 1, onUpdate: function () { render(proxy.v); } }, 0);

    render(0);
  }

  /* ============================================================
     Works · stat carousel → CREATE project showcase, ONE continuous
     pinned scrub (Figma 203:47 → 205:182 → 1395:248 → 205:276 → 205:295).
     "Brands created 50+" → "Industries served 12" → Instagram-style post
     photo settles in, with the CREATE word/labels/button appearing as
     part of the same frame → the photo grows in place, cross-dissolving
     into the Arko video as it fills the screen → further scroll
     crossfades project 1→2→3. This used to be two separate pinned
     sections (works-stage, projects-stage); merging them into one scrub
     is what makes the hand-off a single transition instead of a fresh
     scroll-in between two pins.
     ============================================================ */
  var worksInited = false;
  function initWorksStage() {
    if (worksInited || !hasGsap || typeof ScrollTrigger === "undefined") return;
    var stage = document.getElementById("works-stage");
    var inner = document.getElementById("works-inner");
    var sticky = document.getElementById("works-sticky");
    if (!stage || !inner || !sticky) return;
    worksInited = true;

    var bgLight = stage.querySelector(".works-bg--light");
    var bgBrown = stage.querySelector(".works-bg--brown");
    var cards = [
      document.getElementById("work-card-1"),
      document.getElementById("work-card-2")
    ];
    var num1 = cards[0].querySelector(".work-card__number");
    var num2 = cards[1].querySelector(".work-card__number");

    var mediaEl = document.getElementById("proj-media");
    var mediaImg = document.getElementById("proj-media-img");
    var mediaVideos = [
      document.getElementById("proj-media-video-1"),
      document.getElementById("proj-media-video-2"),
      document.getElementById("proj-media-video-3")
    ];
    var mediaTint = mediaEl.querySelector(".proj-media__tint");
    var postHead = document.getElementById("proj-post-head");
    var postCaps = [
      document.getElementById("proj-cap-l"),
      document.getElementById("proj-cap-r")
    ];
    var infos = [
      document.getElementById("proj-info-1"),
      document.getElementById("proj-info-2"),
      document.getElementById("proj-info-3")
    ];
    var word = document.getElementById("creat-word");
    var viewBtn = document.getElementById("proj-view-btn");

    // .works-sticky is real 100vh (see style.css) while --s only tracks
    // width, so on a wide/short window the 900px-tall composition (at
    // native size) can exceed the real viewport height. Shrink the whole
    // 1440×900 layers uniformly — set on .works-sticky so both .works-inner
    // and .proj-overlay (and the CREATE word inside it) inherit the same
    // --wfit and scale together, always fitting with a comfortable margin.
    function applyFit() {
      var fit = Math.min(1, (window.innerHeight * 0.94) / (900 * S()));
      sticky.style.setProperty("--wfit", fit);
    }
    applyFit();
    window.addEventListener("resize", applyFit);

    // SLOT: vertical gap between the two stat cards, tuned so each card's
    // edge peeks past the frame while the other is centred (Figma 205:182)
    var SLOT = 600;
    var RISE = 720; // px the inst post rises up from below as it enters

    gsap.set(cards, { xPercent: -50, yPercent: -50 });
    gsap.set([mediaEl, postHead], { xPercent: -50, yPercent: -50 });
    gsap.set([bgLight, bgBrown], { opacity: 0 });
    gsap.set([word, viewBtn], { opacity: 0 });

    // digit count-up plays in real time once a card comes on screen —
    // independent of scroll speed/direction — and resets so it can
    // replay if the user scrolls back up past it
    var counters = {
      1: { done: false, tween: null, el: num1, target: 50, suffix: "+" },
      2: { done: false, tween: null, el: num2, target: 12, suffix: "" }
    };
    function playCount(c) {
      if (c.tween) c.tween.kill();
      var proxy = { v: 0 };
      c.el.textContent = "0" + c.suffix;
      c.tween = gsap.to(proxy, {
        v: c.target, duration: 1.3, ease: "power2.out",
        onUpdate: function () { c.el.textContent = Math.round(proxy.v) + c.suffix; }
      });
    }
    function resetCount(c) {
      if (c.tween) c.tween.kill();
      c.el.textContent = "0" + c.suffix;
    }

    var mediaZoomed = false;
    var fromRect = null;

    /* phase A (vA 0..1):
       0    –.14  card 1 (50+) centred, card 2 (12) edge peeks from below
       .14  –.28  strip scrolls up one slot → card 1 edge at top, card 2 centred
       .28  –.42  card 2 (12) centred, nothing below
       .42  –.56  card 2 exits upward, inst post (205:197) rises from below
       .56  –.70  inst post settled (hold)
       .70  –1.0  post grows to full-bleed: header/caption fade, image→Arko
                  video, bg grey→brown, CREATE word + labels + button fade in */
    function renderA(v) {
      var s = S();

      // ---- stat carousel: strip 0→1→2 (card1 centred → card2 centred → gone).
      //      Each card's edge peeks past the frame; only two cards ever exist,
      //      so when card 2 is centred there is nothing below it. ----
      var strip = v < 0.14 ? 0
                : v < 0.28 ? sm((v - 0.14) / 0.14)
                : v < 0.42 ? 1
                : v < 0.56 ? 1 + sm((v - 0.42) / 0.14)
                : 2;
      gsap.set(cards[0], {
        y: (0 - strip) * SLOT * s,
        opacity: 1 - sm(c01((strip - 1.3) / 0.6)) // stays until it clears the top
      });
      gsap.set(cards[1], {
        y: (1 - strip) * SLOT * s,
        opacity: 1 - sm(c01((strip - 1.4) / 0.55)) // peeks from the very start
      });

      // ---- inst post rises from below into centre, then grows ----
      var settle = sm(c01((v - 0.42) / 0.14)); // 0→1 as it rises into place
      var grow = c01((v - 0.70) / 0.30);       // 0→1 full-bleed zoom

      // background: black (stats) → #e1e1e1 (inst post) → #512204 (CREATE)
      bgLight.style.opacity = String(settle);
      bgBrown.style.opacity = String(sm(grow));

      // the Instagram header rises with the image but NEVER grows or fades —
      // it stays put at its small size and is simply covered as the image
      // grows over it (image ends up on z-index:2, header on works-inner's
      // z-index:1). Only the image grows.
      gsap.set(postHead, { y: (1 - settle) * RISE * s, opacity: settle });

      // grow to full-bleed — reparented into .works-sticky (a full-viewport,
      // untransformed sticky box) rather than <body>: staying inside
      // .works-inner would fight that ancestor's scale transform, while
      // <body> would push it above every layer via root-level z-index.
      // Inside .works-sticky, z-index:2 sits above the header (works-inner,
      // z-index:1) and below the CREATE word (.proj-overlay, z-index:3).
      // When pinned, .works-sticky's top-left is the viewport origin, so the
      // screen-space fromRect doubles as its absolute coordinates.
      var z = grow;
      if (z > 0 && !mediaZoomed) {
        mediaZoomed = true;
        fromRect = mediaEl.getBoundingClientRect();
        sticky.appendChild(mediaEl);
        // drop the xPercent/yPercent centring + rise translate — from here
        // left/top are absolute pixels, a leftover translate would
        // double-offset the box
        gsap.set(mediaEl, { position: "absolute", xPercent: 0, yPercent: 0, y: 0, zIndex: 2 });
      } else if (z <= 0 && mediaZoomed) {
        mediaZoomed = false;
        gsap.set(mediaEl, {
          clearProps: "position,left,top,width,height,borderRadius,zIndex",
          xPercent: -50, yPercent: -50
        });
        inner.appendChild(mediaEl);
      }
      if (mediaZoomed) {
        var ez = z * z * z; // power-in — slow start, then a sharp accelerating grow
        gsap.set(mediaEl, {
          opacity: 1,
          left: fromRect.left * (1 - ez),
          top: fromRect.top * (1 - ez),
          width: fromRect.width + (window.innerWidth - fromRect.width) * ez,
          height: fromRect.height + (window.innerHeight - fromRect.height) * ez,
          // NO rounding while it grows — the full-bleed post must be square
          borderRadius: 0
        });
      } else {
        // docked in works-inner: rise up from below + fade in
        gsap.set(mediaEl, { y: (1 - settle) * RISE * s, opacity: settle });
      }

      // ---- image → Arko video crossfade — the swap to video begins once the
      //      post has grown ~50% (grow 0.5), completing near full-bleed ----
      var xf = sm(c01((grow - 0.50) / 0.40));
      mediaImg.style.opacity = String(1 - xf);
      gsap.set(mediaVideos[0], { opacity: xf, yPercent: 0 });
      mediaTint.style.opacity = String(sm(grow));

      // ---- split "Visual / System" caption: it lives in .proj-overlay (a
      //      stable, non-growing layer) at fixed composition coords, so it
      //      always reads at its original 52px and NEVER drifts horizontally.
      //      It only rises in with the card (matching the media's entrance)
      //      and fades out by the time the post has grown 15%. ----
      var capOp = settle * (1 - c01(grow / 0.15));
      gsap.set(postCaps, { xPercent: -50, yPercent: -50, y: (1 - settle) * RISE * s, opacity: capOp });

      // ---- CREATE word + Arko/Project labels + description + button fade in
      //      mid-grow (Figma 1395:248) once the brown bg + video give contrast ----
      var comp = sm(c01((grow - 0.30) / 0.35));
      gsap.set([word, viewBtn], { opacity: comp });
      gsap.set(infos[0], { opacity: comp, yPercent: 0 });
      infos[0].classList.toggle("is-active", comp > 0.5);

      // ---- count-ups fire as each number comes on screen ----
      if (v >= 0.02 && !counters[1].done) { counters[1].done = true; playCount(counters[1]); }
      else if (v < 0.02 && counters[1].done) { counters[1].done = false; resetCount(counters[1]); }

      if (v >= 0.20 && !counters[2].done) { counters[2].done = true; playCount(counters[2]); }
      else if (v < 0.20 && counters[2].done) { counters[2].done = false; resetCount(counters[2]); }
    }

    // ---- phase B: the next project's video SWIPES UP from below, pushing
    //      the current one off the top — a clear "new project" cut rather
    //      than a soft crossfade. Its label/description ride up with it.
    //      slide 0→1→2 = Arko → Artifact → Bad Decisions, with a hold on
    //      each so the swipe reads before the next begins.
    function renderB(vb) {
      var slide = vb < 0.15 ? 0
                : vb < 0.40 ? (vb - 0.15) / 0.25
                : vb < 0.55 ? 1
                : vb < 0.80 ? 1 + (vb - 0.55) / 0.25
                : 2;

      mediaImg.style.opacity = "0";

      // ONLY the video moves. The outgoing video stays put and the incoming one
      // rises up over it (higher index = higher z-index, see CSS) — "the new one
      // slides on top". The one underneath darkens a touch as it gets covered.
      for (var k = 0; k < 3; k++) {
        var rise = c01(k - slide); // 0 = arrived / at rest, 1 = still waiting below
        gsap.set(mediaVideos[k], { yPercent: rise * 100, opacity: 1, filter: "none" });
      }
      for (var d = 0; d < 2; d++) {
        var cover = 1 - c01((d + 1) - slide); // how far the next video has risen over d
        mediaVideos[d].style.filter = "brightness(" + (1 - 0.4 * cover) + ")";
      }

      // labels/description are FIXED — they never slide with the video, they
      // just crossfade in place to the project now on screen
      for (var m = 0; m < 3; m++) {
        gsap.set(infos[m], { yPercent: 0, opacity: c01(1 - Math.abs(m - slide) / 0.5) });
        infos[m].classList.toggle("is-active", Math.abs(m - slide) < 0.5);
      }
    }

    // Hw/Hp mirror the two former stages' scroll weight, so the pacing
    // of each phase is unchanged — only the hand-off between them is
    // now seamless (single pin) instead of a fresh scroll-in.
    var Hw = 2700, Hp = 3300, HTOTAL = Hw + Hp;
    var PA = Hw / HTOTAL, PB = Hp / HTOTAL;

    function render(p) {
      var vA = c01(p / PA);
      renderA(vA);
      if (vA >= 1) {
        renderB(c01((p - PA) / PB));
      } else {
        // phase A owns video 1 (the image→video morph); keep 2 & 3 parked
        // off-screen below so nothing peeks before the swipe phase
        gsap.set([mediaVideos[1], mediaVideos[2]], { opacity: 0, yPercent: 100 });
        gsap.set([infos[1], infos[2]], { opacity: 0, yPercent: 100 });
        infos[1].classList.remove("is-active");
        infos[2].classList.remove("is-active");
      }
    }

    if (location.hash === "#dbg") window.__worksRender = render;

    var proxy = { v: 0 };
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#works-stage",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1,
        invalidateOnRefresh: true
      }
    }).to(proxy, { v: 1, duration: 1, onUpdate: function () { render(proxy.v); } }, 0);

    render(0);
  }

  /* ============================================================
     Industries · "Built across markets" — ONE pinned scrub cycling three
     2×2 packs (Figma 205:336 → 205:461, 373:241 → 373:474). The active
     (settled) pack magnifies the hovered card while the others shrink by
     proximity — driven by animating the grid's column/row tracks, which
     reproduces the ref.digital feel and the measured Figma sizes — and
     reveals that corner's description + a pointer-following "Play showreel"
     pill. On scroll the current pack drifts to the top-left (shrinking +
     fading) while the next rises from the bottom-right into the centre.
     ============================================================ */
  var industriesInited = false;
  function initIndustriesStage() {
    if (industriesInited || reducedMotion || !hasGsap || typeof ScrollTrigger === "undefined") return;
    var stage = document.getElementById("industries-stage");
    var inner = document.getElementById("industries-inner");
    if (!stage || !inner) return;
    industriesInited = true;
    if (!touchDevice) stage.classList.add("is-wheel-driven");

    var packs = gsap.utils.toArray(inner.querySelectorAll(".ind-pack"));
    var pill = document.getElementById("ind-pill");
    var headEl = inner.querySelector(".ind-head");

    // fit the 1440×900 comp into the viewport height (mirrors .works --wfit)
    function applyFit() {
      var fit = Math.min(1, (window.innerHeight * 0.94) / (900 * S()));
      inner.style.setProperty("--ifit", fit);
    }
    applyFit();
    window.addEventListener("resize", applyFit);

    // per-card magnify (design px, measured from Figma). The hovered card
    // grows; its vertical neighbour (same column) and horizontal neighbour
    // (same row) shrink by different amounts, and the diagonal card shrinks
    // the most — so this is a per-card transform:scale, NOT a grid-track
    // animation (grid tracks can't give same-column vs same-row asymmetry).
    // e.g. hovering top-left: TL 280, BL 250, TR 244, BR 214 (rest 259).
    var REST = 259, S_HOVER = 280, S_VERT = 250, S_HORIZ = 244, S_DIAG = 214;
    function targetFor(hoverCorner, cardCorner) {
      if (cardCorner === hoverCorner) return S_HOVER;
      if (cardCorner[1] === hoverCorner[1]) return S_VERT;  // same column → above/below
      if (cardCorner[0] === hoverCorner[0]) return S_HORIZ; // same row → left/right
      return S_DIAG;                                        // diagonal
    }

    /* ---- pointer-following pill (no cursor arrow; sits just above the
       pointer, and only ever shows while the pointer is over the grid) ---- */
    var pillX = gsap.quickTo(pill, "x", { duration: 0.35, ease: "power3.out" });
    var pillY = gsap.quickTo(pill, "y", { duration: 0.35, ease: "power3.out" });
    function pillTarget(e) {
      var rect = inner.getBoundingClientRect();
      var fit = parseFloat(getComputedStyle(inner).getPropertyValue("--ifit")) || 1;
      var lx = (e.clientX - rect.left) / fit; // → inner-local (unscaled) px
      var ly = (e.clientY - rect.top) / fit;
      return {
        x: lx - pill.offsetWidth / 2,        // centred over the pointer,
        y: ly - pill.offsetHeight - 16 * S()  // floating just above it
      };
    }
    function showPill() { if (!touchDevice) gsap.to(pill, { opacity: 1, duration: 0.2 }); }
    function hidePill() { gsap.to(pill, { opacity: 0, duration: 0.2 }); }
    function movePill(e) {
      var t = pillTarget(e);
      pillX(t.x);
      pillY(t.y);
    }

    /* ---- per-pack hover magnify ---- */
    var activePack = -1;

    packs.forEach(function (pack, pi) {
      var grid = pack.querySelector(".ind-grid");
      var cards = gsap.utils.toArray(pack.querySelectorAll(".ind-card"));
      var labels = gsap.utils.toArray(pack.querySelectorAll(".ind-label"));
      var descs = {};
      pack.querySelectorAll(".ind-desc").forEach(function (d) {
        var m = d.className.match(/ind-desc--(\w\w)/);
        if (m) descs[m[1]] = d;
      });

      // GSAP owns the grid transform (centring + scroll tween), so seed the
      // -50%/-50% centring here instead of in CSS.
      gsap.set(grid, { xPercent: -50, yPercent: -50 });
      pack._grid = grid;
      pack._labels = labels;

      // pin each card's scale origin to the corner nearest the grid centre so
      // it grows outward around the fixed centre cross (matches Figma)
      var ORIGIN = { tl: "100% 100%", tr: "0% 100%", bl: "100% 0%", br: "0% 0%" };
      cards.forEach(function (c) { gsap.set(c, { transformOrigin: ORIGIN[c.dataset.corner] }); });

      // each card scales individually toward its target size on hover
      function magnify(corner) {
        cards.forEach(function (c) {
          gsap.to(c, { scale: targetFor(corner, c.dataset.corner) / REST, duration: 0.5, ease: "power3.out" });
        });
      }
      function resetCards() {
        cards.forEach(function (c) { gsap.to(c, { scale: 1, duration: 0.45, ease: "power3.out" }); });
      }
      function clearHover() {
        cards.forEach(function (c) { c.classList.remove("is-lifted"); });
        Object.keys(descs).forEach(function (k) { descs[k].classList.remove("is-shown"); });
      }
      pack._reset = resetCards;
      pack._clear = clearHover;

      cards.forEach(function (card) {
        var corner = card.dataset.corner;
        card.addEventListener("mouseenter", function () {
          if (activePack !== pi || touchDevice) return;
          magnify(corner);
          cards.forEach(function (c) { c.classList.toggle("is-lifted", c === card); });
          Object.keys(descs).forEach(function (k) { descs[k].classList.toggle("is-shown", k === corner); });
        });
      });

      // the pill lives strictly over the grid: it only appears while the
      // pointer is inside the card area, and leaving the grid resets everything.
      // Jump straight to the pointer (gsap.set, no easing) before fading in —
      // otherwise it starts from wherever quickTo last left it (its (0,0)
      // resting spot on a fresh hover) and visibly flies in from that corner.
      grid.addEventListener("mouseenter", function (e) {
        if (activePack !== pi || touchDevice) return;
        var t = pillTarget(e);
        gsap.set(pill, { x: t.x, y: t.y });
        showPill();
      });
      grid.addEventListener("mousemove", function (e) {
        if (activePack !== pi || touchDevice) return;
        movePill(e);
      });
      grid.addEventListener("mouseleave", function () {
        if (activePack !== pi) return;
        resetCards();
        clearHover();
        hidePill();
      });

      pack.style.pointerEvents = "none";
    });

    /* ---- scroll-driven pack cycling (Figma 373:241) ---- */
    // Packs keep full size and only translate + fade: the outgoing pack drifts
    // off to the top-left while fading out, the incoming one rises in from the
    // bottom-right (mirror image). Vectors in design px.
    var TL = { x: -620, y: -440 }; // exit end (top-left)
    var BR = { x: 620, y: 440 };   // enter start (bottom-right)

    // p → flow (0..N-1): holds at each integer (settle), linear ramps
    // between (transition). Hold windows are also where hover is enabled.
    var BP_P = [0, 0.14, 0.44, 0.58, 0.88, 1];
    var BP_F = [0, 0, 1, 1, 2, 2];
    function flowAt(p) {
      for (var i = 1; i < BP_P.length; i++) {
        if (p <= BP_P[i]) {
          var t = (p - BP_P[i - 1]) / (BP_P[i] - BP_P[i - 1]);
          return BP_F[i - 1] + (BP_F[i] - BP_F[i - 1]) * t;
        }
      }
      return BP_F[BP_F.length - 1];
    }

    // hold windows (in p) where a pack sits settled in the centre — the
    // category labels only fade in once a batch is fully centred and fade
    // out in place the moment scrolling drifts it away.
    var HOLDS = [[0, 0.14], [0.44, 0.58], [0.88, 1]];
    var FB = 0.04; // fade band, in p
    function settleAt(p, i) {
      var a = HOLDS[i][0], b = HOLDS[i][1];
      if (p < a || p > b) return 0;                    // transitioning → hidden
      // pack 0 is already on screen when the section appears (no entrance
      // animation) — it holds full opacity from the very start; later packs
      // fade their labels in once they've settled in the centre.
      if (i > 0 && p < a + FB) return sm((p - a) / FB);
      // the last batch's labels stay put — once we reach it they no longer fade
      var last = (i === HOLDS.length - 1);
      if (!last && p > b - FB) return sm((b - p) / FB); // fade out as it leaves
      return 1;
    }

    function render(p) {
      var flow = flowAt(p);
      var s = S();
      packs.forEach(function (pack, i) {
        var x, y, op;
        if (flow <= i) {
          // entering from the right (or parked off-right, en=0)
          var en = sm(c01(flow - (i - 1)));
          x = BR.x * (1 - en); y = BR.y * (1 - en);
          op = c01(en * 1.7); // reach full opacity before it centres
        } else {
          // exiting toward the top-left, fading out
          var ex = sm(c01(flow - i));
          x = TL.x * ex; y = TL.y * ex;
          op = 1 - ex;
        }
        // move + fade only the grid of cards; the labels stay put and just fade
        gsap.set(pack._grid, { x: x * s, y: y * s, opacity: op });
        var lop = settleAt(p, i);
        pack._labels.forEach(function (el) { el.style.opacity = lop; });
      });
      // "Industries" eyebrow + "Built across markets" stay put the whole time

      // enable hover only on the settled pack (inside a hold window)
      var act = (p < 0.14) ? 0 : (p >= 0.44 && p < 0.58) ? 1 : (p >= 0.88) ? 2 : -1;
      if (act !== activePack) {
        if (activePack >= 0) { packs[activePack]._reset(); packs[activePack]._clear(); }
        hidePill();
        activePack = act;
        packs.forEach(function (pack, i) { pack.style.pointerEvents = (i === act) ? "auto" : "none"; });
      }
    }

    if (location.hash === "#dbg") window.__indRender = render;

    if (touchDevice) {
      // touch has no wheel events to hijack — keep the original continuous
      // scroll-scrub so the tall (7200*s) stage still cycles all 3 packs
      var proxy = { v: 0 };
      gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.1,
          invalidateOnRefresh: true
        }
      }).to(proxy, { v: 1, duration: 1, onUpdate: function () { render(proxy.v); } }, 0);
      render(0);
      return;
    }

    /* ---- desktop: one wheel gesture = one full pack transition ----
       Rest points are the mid-point of each pack's HOLDS band (same p that
       render() already treats as "fully settled" — see settleAt/act above),
       reused as discrete stops instead of continuous scroll positions.
       The transition itself is untouched: still driven through render(p),
       just by a timed tween instead of scroll progress. */
    var sticky = stage.querySelector(".industries-sticky");
    var HOLD_P = [0.07, 0.51, 0.94];
    var stepIndex = 0;
    var stepping = false;
    var stepProxy = { v: HOLD_P[0] };

    // only hijack the wheel while this section is actually pinned (its
    // sticky child's top edge is stuck at the viewport top) — before/after
    // that, the wheel does nothing special and the page scrolls normally
    function isPinned() {
      var top = sticky.getBoundingClientRect().top;
      return top > -1 && top < 1;
    }

    function goTo(next) {
      stepping = true;
      gsap.to(stepProxy, {
        v: HOLD_P[next],
        duration: 0.9,
        ease: "power2.inOut",
        onUpdate: function () { render(stepProxy.v); },
        onComplete: function () { stepping = false; stepIndex = next; }
      });
    }

    function onWheel(e) {
      if (!isPinned()) return;
      if (stepping) { e.preventDefault(); return; } // swallow the rest of this gesture
      if (e.deltaY > 0) {
        if (stepIndex < packs.length - 1) { e.preventDefault(); goTo(stepIndex + 1); }
        // else: already on the last pack — let scroll continue past the section
      } else if (e.deltaY < 0) {
        if (stepIndex > 0) { e.preventDefault(); goTo(stepIndex - 1); }
        // else: already on the first pack — let scroll continue up out of it
      }
    }
    window.addEventListener("wheel", onWheel, { passive: false });

    render(stepProxy.v);
  }

  /* ============================================================
     Clients · "Chosen by industry leaders" (Figma 205:507 / 250:390).
     Heading + subtitle fade-up-blur in on scroll; the logo row is an
     infinite, drag-scrollable marquee; a pointer-following "Grab me" pill
     resolves its label with a text-scramble effect while hovering the row.
     ============================================================ */
  var clientsInited = false;
  function initClients() {
    if (clientsInited || !hasGsap) return;
    var section = document.getElementById("clients");
    var track = document.getElementById("cl-track");
    var marquee = document.getElementById("cl-marquee");
    if (!section || !track || !marquee) return;
    clientsInited = true;

    /* ---- content fade-up-blur (texts only, not the cards) ---- */
    var revealTargets = section.querySelectorAll(".cl-title, .cl-sub");
    if (reducedMotion || typeof ScrollTrigger === "undefined") {
      gsap.set(revealTargets, { clearProps: "all" });
    } else {
      gsap.set(revealTargets, { opacity: 0, y: 32, filter: "blur(12px)" });
      ScrollTrigger.create({
        trigger: section,
        start: "top 78%",
        once: true,
        onEnter: function () {
          gsap.to(revealTargets, {
            opacity: 1, y: 0, filter: "blur(0px)",
            duration: 0.9, ease: "power3.out", stagger: 0.12
          });
        }
      });
    }

    /* ---- infinite marquee (clone the set for a seamless loop) ---- */
    var set = track.querySelector(".cl-set");
    track.appendChild(set.cloneNode(true)); // second copy
    var CARD = 240, GAP = 20, N = 6;
    function setW() { return N * (CARD + GAP) * S(); } // width of one set in px
    var pos = 0;                    // current translateX (px)
    var SPEED = 0.55;               // design px/frame (moderate) — scaled by S()
    var dragging = false, lastX = 0, moved = 0;
    var paused = false;             // hover doesn't pause; only drag does

    function wrap(x) {
      var w = setW();
      x = x % w;
      if (x > 0) x -= w;            // keep within (-w, 0]
      return x;
    }
    function apply() { track.style.transform = "translateX(" + pos + "px)"; }

    var last = performance.now();
    function tick(now) {
      var dt = Math.min(2, (now - last) / 16.667); // frames elapsed (~1 at 60fps)
      last = now;
      if (!dragging && !paused && !reducedMotion) pos = wrap(pos - SPEED * S() * dt);
      apply();
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    window.addEventListener("resize", function () { pos = wrap(pos); apply(); });

    /* ---- drag left / right ---- */
    marquee.addEventListener("pointerdown", function (e) {
      dragging = true; moved = 0; lastX = e.clientX;
      marquee.classList.add("is-dragging");
      marquee.setPointerCapture && marquee.setPointerCapture(e.pointerId);
    });
    marquee.addEventListener("pointermove", function (e) {
      if (dragging) {
        var dx = e.clientX - lastX;
        lastX = e.clientX; moved += Math.abs(dx);
        pos = wrap(pos + dx);
        apply();
      }
      movePill(e);
    });
    function endDrag() {
      if (!dragging) return;
      dragging = false;
      marquee.classList.remove("is-dragging");
    }
    marquee.addEventListener("pointerup", endDrag);
    marquee.addEventListener("pointercancel", endDrag);

    /* ---- pointer-following "Grab me" pill + text scramble ---- */
    var pill = document.getElementById("cl-pill");
    var pillTxt = document.getElementById("cl-pill-txt");
    var pillX = gsap.quickTo(pill, "x", { duration: 0.3, ease: "power3.out" });
    var pillY = gsap.quickTo(pill, "y", { duration: 0.3, ease: "power3.out" });
    function movePill(e) {
      var r = section.getBoundingClientRect();
      pillX(e.clientX - r.left - pill.offsetWidth / 2);
      pillY(e.clientY - r.top - pill.offsetHeight - 14 * S());
    }
    var SCRAMBLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%&*";
    var scrRaf = 0;
    function scramble(target, dur) {
      var start = performance.now();
      cancelAnimationFrame(scrRaf);
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var reveal = p * target.length;
        var out = "";
        for (var i = 0; i < target.length; i++) {
          if (target[i] === " ") { out += " "; }
          else if (i < reveal) { out += target[i]; }
          else { out += SCRAMBLE[(Math.random() * SCRAMBLE.length) | 0]; }
        }
        pillTxt.textContent = out;
        if (p < 1) scrRaf = requestAnimationFrame(step);
        else pillTxt.textContent = target;
      }
      scrRaf = requestAnimationFrame(step);
    }
    marquee.addEventListener("mouseenter", function (e) {
      if (touchDevice) return;
      movePill(e);
      gsap.to(pill, { opacity: 1, duration: 0.2 });
      scramble("Grab me", 620);
    });
    marquee.addEventListener("mouseleave", function () {
      gsap.to(pill, { opacity: 0, duration: 0.2 });
    });
  }

  /* ============================================================
     FAQ · Figma 205:529 (question) / 250:136 (answer)
     Five numbered folder-tabs, each a Q&A. "Read answer" curtains
     the frosted answer panel up over the question (wembi.ai-style);
     "Close" collapses it. Prev/next cycle the tabs. Content is
     data-driven so only the text swaps between tabs.
     ============================================================ */
  var FAQ = [
    {
      cat: "Clients",
      q: "Do you work with startups\nor established companies?",
      a: "We partner with both early-stage startups and established brands looking to evolve or reposition."
    },
    {
      cat: "Process",
      q: "How does a typical\nproject start?",
      a: "Every engagement opens with a discovery call where we map your goals, audience and timeline — then we pair you with the designers best suited to the work."
    },
    {
      cat: "Timeline",
      q: "How long does a\nbranding project take?",
      a: "Most identity projects run four to eight weeks end to end, depending on scope. You'll have a clear schedule before anything kicks off."
    },
    {
      cat: "Pricing",
      q: "How is your pricing\nstructured?",
      a: "We scope each project individually and quote a fixed fee up front, so you always know the cost before we begin — no hourly surprises."
    },
    {
      cat: "Collaboration",
      q: "Can we keep working\ntogether after launch?",
      a: "Absolutely. Many clients stay on for ongoing design support, campaign work and future product launches once the core brand is in place."
    }
  ];
  var faqInited = false;
  function initFaq() {
    if (faqInited || !hasGsap) return;
    var section = document.getElementById("faq");
    var card = document.getElementById("faq-card");
    if (!section || !card) return;
    faqInited = true;

    var tabs = Array.prototype.slice.call(section.querySelectorAll(".faq-tab"));
    var elCat = document.getElementById("faq-cat");
    var elQ = document.getElementById("faq-question");
    var elA = document.getElementById("faq-answer-txt");
    var qBlock = document.getElementById("faq-q");
    var answer = document.getElementById("faq-answer");
    var glass = answer.querySelector(".faq-answer__glass");
    var readBar = document.getElementById("faq-read");
    var closeBtn = document.getElementById("faq-close");
    var prevBtn = section.querySelector(".faq-arrow--prev");
    var nextBtn = section.querySelector(".faq-arrow--next");

    var current = 0;
    var open = false;      // is the answer panel showing?
    var busy = false;      // guard while a transition runs

    function fillQuestion(i) {
      elCat.textContent = FAQ[i].cat;
      elQ.innerHTML = FAQ[i].q.split("\n").map(function (l) {
        return l;
      }).join("<br>");
      elA.textContent = FAQ[i].a;
      tabs.forEach(function (t, k) {
        t.classList.toggle("is-active", k === i);
        // the active tab jumps to the front, so its LEFT neighbour is now
        // the one covered in their shared ~20px overlap (see .faq-tab's
        // clip-path comment in style.css) — flip which side it clips
        t.classList.toggle("is-covered-r", k === i - 1);
      });
    }

    /* ---- open / close the answer curtain ---- */
    function openAnswer() {
      if (open || busy) return;
      busy = true; open = true;
      card.classList.add("is-answer");
      answer.classList.add("is-open");
      answer.setAttribute("aria-hidden", "false");
      // the question stays in place — the frosted glass drawer slides up
      // over it (its backdrop-blur veils the question behind). We reveal via
      // the glass's transform + the panel's overflow:hidden, NOT clip-path
      // on an ancestor — clip-path/filter on an ancestor kills backdrop-blur.
      var tl = gsap.timeline({ onComplete: function () { busy = false; } });
      tl.fromTo(glass,
          { yPercent: 100 },
          { yPercent: 0, duration: 0.55, ease: "power4.out" }, 0)
        .fromTo([elA, closeBtn],
          { opacity: 0 },
          { opacity: 1, duration: 0.45, ease: "power2.out", stagger: 0.06 }, 0.28);
    }
    function closeAnswer(instant) {
      if (!open && !instant) return;
      open = false;
      gsap.killTweensOf([glass, elA, closeBtn]);
      if (instant) {
        gsap.set(glass, { yPercent: 100 });
        card.classList.remove("is-answer");
        answer.classList.remove("is-open");
        answer.setAttribute("aria-hidden", "true");
        busy = false;
        return;
      }
      busy = true;
      answer.classList.remove("is-open");
      answer.setAttribute("aria-hidden", "true");
      var tl = gsap.timeline({ onComplete: function () {
        card.classList.remove("is-answer"); busy = false;
      } });
      tl.to([elA, closeBtn], { opacity: 0, duration: 0.2, ease: "power2.in" }, 0)
        .to(glass, { yPercent: 100, duration: 0.42, ease: "power4.in" }, 0.06);
    }

    /* ---- switch tab (crossfade the question, always close first) ---- */
    function goTo(i, dir) {
      i = (i + FAQ.length) % FAQ.length;
      if (i === current && !open) return;
      if (busy) return;
      var wasOpen = open;
      if (wasOpen) { closeAnswer(true); }
      current = i;
      // fade the question block out, swap text, fade back in (slide by dir)
      var dx = (dir || 0) * 40 * S();
      gsap.killTweensOf(qBlock);
      gsap.to(qBlock, {
        opacity: 0, x: -dx, filter: "blur(8px)", duration: 0.2, ease: "power2.in",
        onComplete: function () {
          fillQuestion(current);
          gsap.fromTo(qBlock,
            { opacity: 0, x: dx, filter: "blur(8px)" },
            { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.4, ease: "power3.out" });
        }
      });
    }

    fillQuestion(0);
    gsap.set(glass, { yPercent: 100 });

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        goTo(parseInt(t.getAttribute("data-i"), 10), t.getAttribute("data-i") > current ? 1 : -1);
      });
    });
    readBar.addEventListener("click", openAnswer);
    qBlock.addEventListener("click", openAnswer);
    closeBtn.addEventListener("click", function () { closeAnswer(false); });
    prevBtn.addEventListener("click", function () { goTo(current - 1, -1); });
    nextBtn.addEventListener("click", function () { goTo(current + 1, 1); });
    section.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && open) closeAnswer(false);
    });

    /* ---- reveal (fade-up-blur) on scroll, like the other sections ---- */
    var revealTargets = [section.querySelector(".faq-title"), section.querySelector(".faq-sub"), document.getElementById("faq-widget")];
    if (reducedMotion || typeof ScrollTrigger === "undefined") {
      gsap.set(revealTargets, { clearProps: "all" });
    } else {
      gsap.set(revealTargets, { opacity: 0, y: 32, filter: "blur(12px)" });
      ScrollTrigger.create({
        trigger: section, start: "top 74%", once: true,
        onEnter: function () {
          gsap.to(revealTargets, {
            opacity: 1, y: 0, filter: "blur(0px)",
            duration: 0.9, ease: "power3.out", stagger: 0.14,
            // strip the residual filter/transform off the widget — a leftover
            // filter on an ancestor would kill the answer glass's backdrop-blur
            onComplete: function () { gsap.set(revealTargets, { clearProps: "filter,transform" }); }
          });
        }
      });
    }
  }

  /* ============================================================
     CREATE word · the word starts as one intact "CREATE"; when the
     cursor comes near, each letter flees it (a damped spring per
     letter) and eases back to zero — the clean word — once the
     cursor leaves. Letters sit in natural inline flow, so "home" is
     just transform:none on the inner span; the physics only ever
     adds an offset/rotation on top.
     ============================================================ */
  var creatScatterInited = false;
  function initCreatScatter() {
    if (creatScatterInited || !hasGsap || touchDevice) return;
    var word = document.getElementById("creat-word");
    if (!word) return;
    creatScatterInited = true;

    var zone = document.getElementById("works-sticky") || word.parentElement;
    // outer .creat-letter = layout (its rect is the letter's rest position,
    // unaffected by the physics transform on the inner span); inner span
    // carries the transient translate/rotate
    var letters = gsap.utils.toArray(word.querySelectorAll(".creat-letter")).map(function (el) {
      return {
        outer: el,
        inner: el.querySelector(".creat-letter__in"),
        x: 0, y: 0, r: 0, vx: 0, vy: 0, vr: 0
      };
    });

    var RADIUS = 240;    // px — repulsion falloff radius
    var STRENGTH = 3200; // px/s² at the cursor, falling off to 0 at RADIUS
    var SPRING = 0.05;   // pull back toward home each frame
    var DAMP = 0.84;     // velocity damping each frame
    var SPIN = 0.06;     // how much lateral offset feeds a little rotation
    var REST = 0.05;     // below this a letter is considered settled

    var mouseX = -99999, mouseY = -99999;
    var running = false;

    // .proj-overlay (the word's ancestor) is scaled by --wfit (inherited
    // from .works-sticky); the physics offset is in screen px, so apply it
    // to the inner span divided by that scale (the span lives inside the
    // scaled ancestor)
    function scaleFactor() {
      var wf = parseFloat(getComputedStyle(word).getPropertyValue("--wfit"));
      return wf > 0 ? wf : 1;
    }

    function step() {
      var settled = true;
      var sc = scaleFactor();

      for (var i = 0; i < letters.length; i++) {
        var L = letters[i];
        // rest centre from the outer rect (layout only) + the current
        // physics offset (screen px) = where the letter is right now
        var rect = L.outer.getBoundingClientRect();
        var px = rect.left + rect.width / 2 + L.x;
        var py = rect.top + rect.height / 2 + L.y;
        var dx = px - mouseX, dy = py - mouseY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIUS && dist > 0.01) {
          var force = (1 - dist / RADIUS) * STRENGTH / dist;
          L.vx += dx * force * (1 / 60);
          L.vy += dy * force * (1 / 60);
        }
        L.vx += -L.x * SPRING;
        L.vy += -L.y * SPRING;
        L.vx *= DAMP;
        L.vy *= DAMP;
        L.x += L.vx;
        L.y += L.vy;
        // a touch of rotation from horizontal displacement so scattered
        // letters tilt instead of just sliding — springs back with them
        L.r = L.x * SPIN;

        gsap.set(L.inner, { x: L.x / sc, y: L.y / sc, rotate: L.r });

        if (Math.abs(L.vx) > REST || Math.abs(L.vy) > REST ||
            Math.abs(L.x) > REST || Math.abs(L.y) > REST) {
          settled = false;
        }
      }

      if (!settled || mouseX > -99999) {
        requestAnimationFrame(step);
      } else {
        running = false;
      }
    }

    function start() {
      if (!running) { running = true; requestAnimationFrame(step); }
    }

    if (location.hash === "#dbg") {
      window.__creatDbg = { letters: letters, step: step, setMouse: function (x, y) { mouseX = x; mouseY = y; } };
    }

    zone.addEventListener("mousemove", function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      start();
    });
    zone.addEventListener("mouseleave", function () {
      mouseX = -99999; mouseY = -99999;
      start();
    });
  }

  /* ============================================================
     Menu · Figma 373:2384, motion after rickallan.work
     ============================================================ */
  function initMenu() {
    var overlay = document.getElementById("menu-overlay");
    var panel = document.getElementById("menu-panel");
    var openBtn = document.getElementById("menu-btn");
    var closeBtn = document.getElementById("menu-close");
    var tabs = overlay.querySelectorAll(".menu-tab");
    var items = [
      panel.querySelector(".menu-panel__tabs"),
      panel.querySelector(".menu-panel__divider"),
      panel.querySelector(".menu-panel__hello"),
      panel.querySelector(".menu-panel__media"),
      panel.querySelector(".menu-panel__caption"),
      panel.querySelector(".menu-panel__socials"),
      panel.querySelector(".btn--contact")
    ];
    var isOpen = false;
    var mtl = null;

    tabs.forEach(function (tab) {
      tab.addEventListener("click", function () {
        tabs.forEach(function (t) { t.classList.remove("is-active"); });
        tab.classList.add("is-active");
      });
    });

    if (!hasGsap) {
      openBtn.addEventListener("click", function () {
        overlay.style.opacity = 1; overlay.style.visibility = "visible";
      });
      closeBtn.addEventListener("click", function () {
        overlay.style.opacity = 0; overlay.style.visibility = "hidden";
      });
      return;
    }

    function open() {
      if (isOpen) return;
      isOpen = true;
      body.classList.add("is-menu-open");
      overlay.setAttribute("aria-hidden", "false");
      if (mtl) mtl.kill();

      mtl = gsap.timeline();
      mtl.set(overlay, { visibility: "visible" }, 0);
      mtl.to(overlay, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0);
      // the panel unfolds from the Menu corner — quick, weighty, smooth
      mtl.fromTo(panel,
        { scaleX: 0.35, scaleY: 0.12, opacity: 0 },
        { scaleX: 1, scaleY: 1, opacity: 1, duration: 0.65, ease: "expo.out" }, 0.05);
      mtl.fromTo(items,
        { opacity: 0, y: 14 * S() },
        { opacity: 1, y: 0, duration: 0.45, ease: "power3.out", stagger: 0.05 }, 0.28);
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      overlay.setAttribute("aria-hidden", "true");
      if (mtl) mtl.kill();

      mtl = gsap.timeline({
        onComplete: function () {
          gsap.set(overlay, { visibility: "hidden" });
          body.classList.remove("is-menu-open");
        }
      });
      mtl.to(items, { opacity: 0, y: -8 * S(), duration: 0.2, ease: "power2.in", stagger: 0.02 }, 0);
      mtl.to(panel, { scaleX: 0.35, scaleY: 0.12, opacity: 0, duration: 0.4, ease: "expo.in" }, 0.05);
      mtl.to(overlay, { opacity: 0, duration: 0.3, ease: "power2.in" }, 0.25);
    }

    openBtn.addEventListener("click", open);
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function (e) {
      if (!panel.contains(e.target)) close();
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) close();
    });
  }

  /* ============================================================
     Showreel · chip follows the cursor, click → fullscreen
     ============================================================ */
  function initShowreel() {
    var card = document.getElementById("showreel");
    var video = card.querySelector(".showreel__video");
    var chip = card.querySelector(".btn--showreel");
    var expanded = false;
    var animating = false;
    var restRect = null; // rect captured at expand time

    video.play().catch(function () { /* retried after the reveal */ });

    if (!hasGsap) {
      card.addEventListener("click", function () {
        if (video.requestFullscreen) video.requestFullscreen();
      });
      return;
    }

    /* --- floating chip --- */
    var chipX = gsap.quickTo(chip, "x", { duration: 0.4, ease: "power3.out" });
    var chipY = gsap.quickTo(chip, "y", { duration: 0.4, ease: "power3.out" });

    if (!touchDevice) {
      card.addEventListener("mousemove", function (e) {
        if (expanded || animating) return;
        var r = card.getBoundingClientRect();
        chipX(e.clientX - r.left - chip.offsetWidth / 2);
        chipY(e.clientY - r.top - chip.offsetHeight / 2);
        gsap.to(chip, { opacity: 1, duration: 0.25 });
      });
      card.addEventListener("mouseleave", function () {
        gsap.to(chip, { opacity: 0, duration: 0.25 });
      });
    }

    /* --- expand / collapse --- */
    function expand() {
      if (animating) return;
      animating = true;
      expanded = true;

      if (stageST) stageST.disable(false); // freeze the scrub while fullscreen
      restRect = card.getBoundingClientRect();
      card.classList.add("is-expanded");
      body.classList.add("is-expanded");
      gsap.set(card, {
        position: "fixed",
        left: restRect.left, top: restRect.top,
        width: restRect.width, height: restRect.height,
        xPercent: 0, x: 0, y: 0, margin: 0
      });
      gsap.to(chip, { opacity: 0, duration: 0.15 });
      gsap.to(card, {
        left: 0, top: 0, width: window.innerWidth, height: window.innerHeight,
        borderRadius: 0,
        duration: 0.85, ease: "power3.inOut",
        onComplete: function () { animating = false; }
      });
      video.muted = false; // user gesture — enable sound
    }

    function collapse() {
      if (animating) return;
      animating = true;

      video.muted = true;
      gsap.to(card, {
        left: restRect.left, top: restRect.top,
        width: restRect.width, height: restRect.height,
        borderRadius: 12 * S(),
        duration: 0.8, ease: "power3.inOut",
        onComplete: function () {
          gsap.set(card, { clearProps: "position,left,top,width,height,transform,margin,borderRadius,zIndex" });
          card.classList.remove("is-expanded");
          body.classList.remove("is-expanded");
          expanded = false;
          animating = false;
          // re-apply the scrub-driven geometry for the current scroll
          if (stageST) stageST.enable(false);
          if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
        }
      });
    }

    card.addEventListener("click", function () {
      if (expanded) { collapse(); } else { expand(); }
    });
    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && expanded) collapse();
    });
  }

  /* ============================================================
     Reveal without motion (reduced motion / no GSAP)
     ============================================================ */
  function revealInstant() {
    if (preloader) preloader.remove();
    body.classList.remove("is-loading");
    body.classList.add("no-motion");
    site.style.visibility = "visible";
    initScrollStage();
    initAboutStage();
  }

  /* ============================================================
     Preloader helpers
     ============================================================ */
  function preloadImages(srcs) {
    return Promise.all(srcs.map(function (src) {
      return new Promise(function (resolve) {
        var img = new Image();
        img.onload = img.onerror = function () { resolve(); };
        img.src = src;
      });
    }));
  }

  /* Glow sweep: the purple band + caret travel across the phrase,
     revealing the text via clip-path. */
  function glowReveal(tl, opts) {
    var el = opts.el;
    var text = el.querySelector(".pl-phrase__text");
    var band = el.querySelector(".pl-phrase__band");
    var caret = el.querySelector(".pl-phrase__caret");
    var W = 0, caretX = 0;

    tl.call(function () {
      W = text.offsetWidth;             // layout width, unaffected by transforms
      caretX = W + 8 * S();
      gsap.set(caret, { x: caretX });
      gsap.set(band, { x: 0, width: caretX });
    }, null, opts.at);

    tl.to([band, caret], { opacity: 1, duration: 0.12, ease: "none" }, opts.at);

    var proxy = { p: 0 };
    tl.to(proxy, {
      p: 1,
      duration: opts.duration,
      ease: "power1.inOut",
      onUpdate: function () {
        var lead = proxy.p * W;
        text.style.clipPath = "inset(-10% " + Math.max(0, (1 - proxy.p) * 100) + "% -10% 0)";
        gsap.set(band, { x: lead, width: Math.max(caretX - lead, 0) });
      }
    }, opts.at);

    var end = opts.at + opts.duration;
    tl.to(band, {
      x: function () { return caretX; },
      width: 0, duration: 0.3, ease: "power2.inOut"
    }, end);
    tl.to(caret, { opacity: 0, duration: 0.2 }, end + 0.22);
    return end + 0.3;
  }

  /* ============================================================
     The preloader sequence
     ============================================================ */
  function run() {
    body.classList.add("is-loading");
    window.scrollTo(0, 0);

    var q = function (sel) { return preloader.querySelector(sel); };
    var phraseL = q(".pl-phrase--left");
    var phraseR = q(".pl-phrase--right");
    var grid = q(".pl-grid");
    var beam = q(".pl-beam");
    var media = q(".pl-media");
    var mediaImg = q(".pl-media__img");
    var mediaTint = q(".pl-media__tint");
    var textL = phraseL.querySelector(".pl-phrase__text");
    var textR = phraseR.querySelector(".pl-phrase__text");
    var cornersL = phraseL.querySelectorAll(".pl-corner");
    var cornersR = phraseR.querySelectorAll(".pl-corner");
    var heroWords = gsap.utils.toArray(site.querySelectorAll(".hero__title .w"));
    var header = document.getElementById("header");

    var s = S();
    var K_FROM = 90 / 48;   // phrase appears at 90px…
    var K_HOLD = 80 / 48;   // …settles at 80px during the sweep
    var WL = textL.offsetWidth;

    function centerX(k) { return 645 * s - (WL * k) / 2; }

    gsap.set([phraseL, phraseR], { yPercent: -50 });
    gsap.set(phraseL, { scale: K_FROM, x: centerX(K_FROM) });
    gsap.set(preloader, { "--imgw": 0 }); // door starts closed

    var tl = gsap.timeline({ defaults: { ease: "power2.out" }, onComplete: finish });
    window.__plTl = tl;
    if (location.hash === "#debug") tl.pause(0);

    /* Backgrounded tabs never fire requestAnimationFrame — GSAP's ticker
       (and every browser's) simply stops, so the timeline sits frozen at
       whatever point it reached the instant the tab lost focus, no matter
       how long the tab stays hidden. Left alone, a user who opens the site
       and immediately switches away comes back to a preloader that's still
       stuck mid-intro, waiting for them — exactly the "waits for me to
       return" behaviour that shouldn't happen. Track real wall-clock time
       instead: whenever the tab becomes visible again (including the very
       first time, if it started out backgrounded), jump the timeline to
       wherever it should already be based on elapsed real time — all the
       way to "done" if more time passed than the intro even takes, so the
       site is simply sitting there fully revealed, not replaying anything. */
    var plStartWall = Date.now();
    function catchUpToRealTime() {
      if (document.visibilityState !== "visible" || tl.paused()) return;
      var elapsed = (Date.now() - plStartWall) / 1000;
      if (elapsed > tl.time()) tl.time(Math.min(elapsed, tl.duration()), false);
    }
    document.addEventListener("visibilitychange", catchUpToRealTime);
    window.__plCatchUp = catchUpToRealTime; // exposed for the same reason __plTl is

    /* ===== Stage A · glow sweep reveals the phrase, 90px → 80px ===== */
    glowReveal(tl, { el: phraseL, at: 0.25, duration: 1.0 });
    tl.to(phraseL, {
      scale: K_HOLD, x: centerX(K_HOLD),
      duration: 1.0, ease: "power1.inOut"
    }, 0.25);

    /* ===== Stage B · one continuous morph to the left slot ===== */
    tl.to(phraseL, { scale: 1, x: 0, duration: 0.7, ease: "power3.inOut" }, 1.75);
    tl.to(cornersL, { opacity: 1, duration: 0.35, stagger: 0.04 }, 2.35);

    // the media door opens: --imgw 0 → 110, lines spread with it
    tl.set(media, { opacity: 1 }, 1.78);
    tl.to(grid, { opacity: 1, duration: 0.45 }, 1.8);
    tl.to(preloader, { "--imgw": 110, duration: 0.75, ease: "power3.inOut" }, 1.8);
    tl.to(beam, { opacity: 1, duration: 0.6 }, 2.2);

    /* ===== right phrase glow sweep ===== */
    tl.to(cornersR, { opacity: 1, duration: 0.35, stagger: 0.04 }, 2.5);
    glowReveal(tl, { el: phraseR, at: 2.5, duration: 0.8 });

    /* ===== Stage B2 · phrases recede, image grows to 230² ===== */
    tl.to(preloader, { "--imgw": 230, "--imgh": 230, duration: 0.65, ease: "power2.inOut" }, 3.7);
    tl.to([textL, textR], { color: "#a3a3a3", duration: 0.5 }, 3.7);
    tl.to(phraseL, { x: -92 * s, duration: 0.65, ease: "power2.inOut" }, 3.7);
    tl.to(phraseR, { x: 92 * s, duration: 0.65, ease: "power2.inOut" }, 3.7);
    tl.to([cornersL, cornersR], { opacity: 0, duration: 0.35 }, 3.75);

    /* ===== Stage C · continuous approach to fullscreen + flipbook ===== */
    var coverW = Math.ceil(window.innerWidth / s) + 60;
    var coverH = Math.ceil(window.innerHeight / s) + 60;

    tl.to(preloader, { "--imgw": coverW, "--imgh": coverH, duration: 0.9, ease: "power2.in" }, 4.35);
    tl.to([phraseL, phraseR], { opacity: 0, duration: 0.35 }, 4.5);
    tl.to(grid, { opacity: 0, duration: 0.35 }, 4.9);

    tl.to(mediaImg, { scale: 1.12, duration: 0.85, ease: "power1.in" }, 4.5);
    tl.to(mediaTint, { opacity: 0, duration: 0.25 }, 5.1);

    var flipStart = 5.35;
    var flipStep = 0.18;
    PICS.slice(1).forEach(function (src, i) {
      tl.call(function () {
        mediaImg.src = src;
        gsap.set(mediaImg, { scale: 1 });
      }, null, flipStart + i * flipStep);
    });
    var pic6At = flipStart + (PICS.length - 2) * flipStep;

    /* ===== Stage D · the page card grows over pic6 ===== */
    var cardAt = pic6At + 0.25;

    tl.call(function () {
      site.style.visibility = "visible";
      site.style.position = "relative";
      site.style.zIndex = "101";
    }, null, cardAt - 0.02);

    // the small card doesn't just pop into view — its content wipes open
    // left → right at its OWN (still tiny, 0.36-scale) fixed size, THEN
    // the whole card grows. Two distinct motions instead of one blurred one.
    tl.fromTo(site,
      { clipPath: "inset(0 100% 0 0)" },
      { clipPath: "inset(0 0% 0 0)", duration: 0.45, ease: "power2.inOut" },
      cardAt - 0.02);

    tl.fromTo(site,
      {
        scale: 0.36,
        borderRadius: 16,
        transformOrigin: "50% 50%",
        boxShadow: "0 40px 120px rgba(0,0,0,0.35)"
      },
      {
        scale: 1, borderRadius: 0,
        duration: 1.25, ease: "power3.inOut",
        onComplete: releasePreloader
      }, cardAt);

    var btnStart = site.querySelector(".btn--start");
    var script = site.querySelector(".hero__script");
    var showreel = site.querySelector(".showreel");

    // header rides along with the card the whole time (so its POSITION
    // never separately snaps into place), but stays invisible while it's
    // still small/illegible under power3.inOut's fast middle section, and
    // only fades in once it's already close to full size — so it reads as
    // "there from the start", not as something that visibly grows then
    // jumps into shape at the very end.
    tl.set(header, { opacity: 0 }, cardAt - 0.02);
    tl.to(header, { opacity: 1, duration: 0.35, ease: "power1.out" }, cardAt + 0.85);

    tl.set(heroWords, { color: "#c9c9c9" }, cardAt - 0.02);
    tl.from(heroWords, { opacity: 0, duration: 0.3, stagger: 0.055 }, cardAt + 0.2);
    tl.to(heroWords, { color: "#000", duration: 0.45, stagger: 0.05 }, cardAt + 0.6);
    tl.from(btnStart, { y: 16 * s, opacity: 0, duration: 0.5 }, cardAt + 0.85);
    tl.from(script, { y: 60 * s, opacity: 0, duration: 0.8, ease: "power3.out" }, cardAt + 0.8);
    tl.from(showreel, { y: 120 * s, duration: 0.9, ease: "power3.out" }, cardAt + 0.85);

    function releasePreloader() {
      if (!preloader.parentNode) return;
      document.removeEventListener("visibilitychange", catchUpToRealTime);
      preloader.remove();
      // clear only what GSAP animated — never the whole style attribute
      gsap.set(site, { clearProps: "transform,borderRadius,boxShadow,transformOrigin,clipPath" });
      gsap.set(header, { clearProps: "opacity" });
      site.style.position = "";
      site.style.zIndex = "";
      site.style.visibility = "";
      body.classList.remove("is-loading");
      window.scrollTo(0, 0);
      // stages were built at boot against the capped-height document —
      // re-measure one frame later, hidden under the content tweens
      requestAnimationFrame(function () {
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      });
    }

    function finish() {
      releasePreloader();
      var video = site.querySelector(".showreel__video");
      if (video && video.paused) video.play().catch(function () {});
    }
  }

  /* ============================================================
     Boot
     ============================================================ */
  function splitHeroWords() {
    site.querySelectorAll(".hero__line").forEach(function (line) {
      var words = line.textContent.trim().split(/\s+/);
      line.textContent = "";
      words.forEach(function (w, i) {
        var span = document.createElement("span");
        span.className = "w";
        span.textContent = w;
        line.appendChild(span);
        if (i < words.length - 1) line.appendChild(document.createTextNode(" "));
      });
    });
  }

  /* ============================================================
     Outro · brand reveal → project fly-out → CTA. ONE pinned scrub
     (Figma 205:546 lottie → 216:48114 word → 216:48174 / 48154 / 48188
      cards → 226:48205 CTA). The Lottie plays ONCE on entry and
      cross-fades — inside the exact same transformed box, so nothing
      shifts — into the white "Creative Network". As you scroll the word
      shrinks while the whole project-card collage dolly-zooms out from a
      point behind it, overflows the frame and flies past the camera;
      then the closing call to action fades up.
     ============================================================ */
  var outroInited = false;
  function initOutro() {
    if (outroInited || !hasGsap || typeof ScrollTrigger === "undefined") return;
    var stage = document.getElementById("outro-stage");
    var cardsWrap = document.getElementById("outro-cards");
    var word = document.getElementById("outro-word");
    var lottieBox = document.getElementById("cn-lottie");
    var text = document.getElementById("cn-text");
    var cta = document.getElementById("outro-cta");
    if (!stage || !cardsWrap || !word) return;
    outroInited = true;

    // final collage layout — Figma 216:48188 (1440×900 canvas): x, y, w, h.
    // 11 rects for the 11 unique videos (1..11.mp4, no repeats) — the three
    // dropped Figma rects were two fully off the right edge (x>1440) and one
    // in the densest overlap zone, so the silhouette stays intact. The
    // collage still overflows the frame on purpose.
    var RECTS = [
      [1219.20,   0.00, 385.58, 197.00],
      [1062.67, 257.77, 435.52, 324.51],
      [ 375.12, 638.96, 375.62, 261.04],
      [ 740.41, 527.53, 346.09, 372.47],
      [1121.42, 622.83, 483.35, 277.17],
      [ 944.42,  17.22, 236.51, 285.00],
      [   0.00,   0.00, 187.99, 241.30],
      [ 375.12,  17.22, 403.46, 253.32],
      [ 597.72, 214.00, 369.68, 276.00],
      [  80.00, 168.53, 238.63, 262.51],
      [   0.00, 512.45, 340.20, 307.19]
    ];
    // per-card depth for the cursor parallax: bigger card = closer to the
    // camera = moves faster; small index jitter keeps same-size cards from
    // moving in lockstep
    var maxArea = 0, DEPTH = [];
    RECTS.forEach(function (r) { maxArea = Math.max(maxArea, r[2] * r[3]); });
    for (var i = 0; i < RECTS.length; i++) {
      var r = RECTS[i];
      DEPTH[i] = 0.5 + (r[2] * r[3] / maxArea) * 0.9 + (i % 3) * 0.12;
      var card = document.createElement("div");
      card.className = "outro-card";
      card.style.left = "calc(" + r[0] + " * var(--s))";
      card.style.top = "calc(" + r[1] + " * var(--s))";
      card.style.width = "calc(" + r[2] + " * var(--s))";
      card.style.height = "calc(" + r[3] + " * var(--s))";
      var vid = document.createElement("video");
      // src withheld in data-src, not set directly: the outro sits at the very
      // bottom of a long page, so eagerly assigning .src to 11 videos at boot
      // would make the browser start fetching all of them immediately,
      // competing with the preloader's own critical assets. ensureCardVideos()
      // assigns the real src lazily, once, when the section is actually near.
      vid.dataset.src = "main%20page/content/" + (i + 1) + ".mp4";
      vid.muted = true; vid.loop = true; vid.playsInline = true;
      vid.setAttribute("playsinline", ""); vid.setAttribute("muted", "");
      vid.preload = "none";
      card.appendChild(vid);
      cardsWrap.appendChild(card);
    }
    var cardEls = gsap.utils.toArray(cardsWrap.querySelectorAll(".outro-card"));
    var vids = gsap.utils.toArray(cardsWrap.querySelectorAll("video"));
    var vidsSrcSet = false;
    function ensureCardVideos() {
      if (vidsSrcSet) return;
      vidsSrcSet = true;
      vids.forEach(function (v) { v.src = v.dataset.src; });
    }
    function playVids() { ensureCardVideos(); vids.forEach(function (v) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }); }
    function pauseVids() { vids.forEach(function (v) { v.pause(); }); }
    var N = RECTS.length;

    // Lottie — plays ONCE on first activation and STAYS as the word (no
    // swap to the plain #cn-text): the source file's own final frame is
    // what should show, brightness/colour to be finished on the asset
    // side — only if the lottie fails to load do we fall back to the
    // plain word.
    var anim = null, introStarted = false;
    function ensureLottie() {
      if (anim || typeof lottie === "undefined") return;
      // animationData (inlined via creative-network.js) starts synchronously
      // and works over file:// — the XHR that `path` would issue is blocked
      // there and the animation silently never loads. `path` stays as a
      // fallback; autoplay:true because a goToAndPlay fired synchronously
      // after loadAnimation is lost while the JSON is still fetching.
      var opts = { container: lottieBox, renderer: "svg", loop: false, autoplay: true };
      if (window.CN_LOTTIE_DATA) opts.animationData = window.CN_LOTTIE_DATA;
      else opts.path = "main%20page/content/creative-network.json";
      anim = lottie.loadAnimation(opts);
      anim.addEventListener("data_failed", function () { gsap.set(text, { opacity: 1 }); });
    }
    function playIntroOnce() {
      if (introStarted) return;
      introStarted = true;
      ensureLottie();
      if (!anim) gsap.set(text, { opacity: 1 }); // no lottie lib → plain word
    }

    /* pointer-driven camera WITH DEPTH — the frame pans with the cursor,
       but each card carries its own parallax factor (DEPTH[i]): closer
       (bigger) cards travel faster, farther ones lag — cursor moves read
       as a camera shifting through a 3D scene. Eased; recentres when the
       section is inactive */
    var camX = 0, camY = 0, tgtX = 0, tgtY = 0, camOn = false, camRAF = 0;
    function onPointer(e) {
      var nx = e.clientX / window.innerWidth - 0.5;
      var ny = e.clientY / window.innerHeight - 0.5;
      tgtX = -nx * 60 * S(); tgtY = -ny * 40 * S(); // camera looks toward the cursor
    }
    function camLoop() {
      camX += (tgtX - camX) * 0.06;
      camY += (tgtY - camY) * 0.06;
      for (var i = 0; i < cardEls.length; i++) {
        cardEls[i].style.setProperty("--px", (camX * DEPTH[i]).toFixed(1) + "px");
        cardEls[i].style.setProperty("--py", (camY * DEPTH[i]).toFixed(1) + "px");
      }
      var settled = Math.abs(tgtX - camX) < 0.1 && Math.abs(tgtY - camY) < 0.1;
      camRAF = (camOn || !settled) ? requestAnimationFrame(camLoop) : 0;
    }
    function camActivate(on) {
      camOn = on;
      if (!on) { tgtX = 0; tgtY = 0; }
      if (!camRAF) camRAF = requestAnimationFrame(camLoop);
    }
    window.addEventListener("pointermove", onPointer);

    /* card BURST — one sharp, self-running animation (reference video: one
       scroll past the word and the whole collage snaps in at once). ALL cards
       simultaneously: the collage pops in already at ~45% and grows to full
       while every card unfolds from a page-flip tilt (angled away from the
       centre, like a sheet mid-turn) to flat. Triggered ONCE on crossing the
       threshold, reversed quickly when scrolling back above it. */
    // burst grows the collage to 0.85 of full size, not 1 — a bit smaller
    // per feedback, still reads as a full "snap in"
    var BURST_Z = 0.85;
    var burstShown = false, burstTl = null;
    function killBurst() { if (burstTl) { burstTl.kill(); burstTl = null; } }
    function showBurst() {
      if (burstShown) return;
      burstShown = true;
      killBurst();
      burstTl = gsap.timeline();
      burstTl.fromTo(cardsWrap, { "--z": 0.45 }, { "--z": BURST_Z, duration: 0.9, ease: "expo.out" }, 0);
      for (var i = 0; i < N; i++) {
        var r = RECTS[i];
        // unfold direction follows the card's offset from the collage centre
        var fy = Math.max(-1, Math.min(1, (r[0] + r[2] / 2 - 720) / 720)) * 55;
        var fx = Math.max(-1, Math.min(1, (r[1] + r[3] / 2 - 450) / 450)) * -38;
        burstTl.fromTo(cardEls[i],
          { "--fx": fx + "deg", "--fy": fy + "deg", "--cs": 0.6, opacity: 0 },
          { "--fx": "0deg", "--fy": "0deg", "--cs": 1, opacity: 1,
            duration: 0.85, ease: "expo.out" }, 0);
      }
    }
    function hideBurst() {
      if (!burstShown) return;
      burstShown = false;
      killBurst();
      burstTl = gsap.timeline();
      burstTl.to(cardsWrap, { "--z": 0.45, duration: 0.3, ease: "power2.in" }, 0)
             .to(cardEls, { opacity: 0, duration: 0.25, ease: "power1.in" }, 0);
    }

    /* FOLD — the whole collage swipes left as ONE group and clears the
       screen (feedback: was a per-card flip/zoom before — now a single
       leftward swipe+fade), handing over to the CTA; reversed when
       scrolling back up. cardsWrap is 1440*s wide (== 100vw, since
       --s = vw/1440), so -1.3x its own width is enough to clear the left
       edge with margin regardless of viewport aspect. */
    var foldShown = false, foldTl = null;
    function showFold() {
      if (foldShown) return;
      foldShown = true;
      if (foldTl) foldTl.kill();
      var exitX = -1440 * 1.3 * S();
      foldTl = gsap.timeline();
      foldTl.to(cardsWrap, { "--ex": exitX + "px", opacity: 0, duration: 0.55, ease: "power2.in" }, 0);
    }
    function hideFold() {
      if (!foldShown) return;
      foldShown = false;
      if (foldTl) foldTl.kill();
      foldTl = gsap.timeline();
      foldTl.to(cardsWrap, { "--ex": "0px", opacity: 1, duration: 0.5, ease: "power2.out" }, 0);
    }

    /* CTA — a plain one-shot reveal (feedback: was tied to continuous
       scroll position — every scroll tick nudged it — now it just plays
       once, in full, the first time the fold has cleared the screen) */
    var ctaWords = gsap.utils.toArray(cta.querySelectorAll(".outro-cta__title .w"));
    var ctaBtn = cta.querySelector(".outro-cta__btn");
    gsap.set(cta, { opacity: 1 });
    var ctaShown = false, ctaTl = null;
    function showCta() {
      if (ctaShown) return;
      ctaShown = true;
      if (ctaTl) ctaTl.kill();
      cta.style.pointerEvents = "auto";
      ctaTl = gsap.timeline();
      ctaTl.to(ctaWords, { opacity: 1, duration: 0.35, ease: "power2.out", stagger: 0.12 }, 0)
           .fromTo(ctaBtn,
             { opacity: 0, y: 20 * S() },
             { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.15");
    }
    function hideCta() {
      if (!ctaShown) return;
      ctaShown = false;
      if (ctaTl) ctaTl.kill();
      cta.style.pointerEvents = "none";
      ctaTl = gsap.timeline();
      ctaTl.to(ctaWords, { opacity: 0, duration: 0.2, ease: "power1.in" }, 0)
           .to(ctaBtn, { opacity: 0, y: 20 * S(), duration: 0.2, ease: "power1.in" }, 0);
    }

    function render(v) {
      // WORD (lottie) — plays once, then shrinks to 50% and vanishes
      var wz = 1 - 0.5 * sm(c01((v - 0.05) / 0.13)); // 1 → 0.5  [.05,.18]
      word.style.setProperty("--wz", wz);
      word.style.opacity = String(1 - sm(c01((v - 0.15) / 0.07))); // out [.15,.22]

      // CARDS — sharp one-shot burst once the word has gone, then a fold
      // ~three scrolls later; both reversible
      if (v >= 0.22) showBurst(); else hideBurst();
      if (v >= 0.42) showFold(); else hideFold();

      // CTA — one-shot reveal once the fold has had time to clear
      if (v >= 0.55) showCta(); else hideCta();
    }

    if (location.hash === "#dbg") window.__outroRender = render;

    // the lottie is ~3s long and plays ONCE — starting it only at the pin
    // means a quick scroll skips right past it and all you ever catch is the
    // final white frame. Start it as soon as the section comes INTO VIEW
    // (the letters assemble while the black screen rises, like the
    // reference), guarded against the preloader phase when boot-time
    // degenerate ranges could fire triggers spuriously.
    function tryIntro() {
      if (!document.body.classList.contains("is-loading")) playIntroOnce();
    }
    ScrollTrigger.create({
      trigger: "#outro-stage",
      // fire once MOST of the section is on screen — at "top 85%" only a
      // sliver shows and a user lingering on the FAQ has the whole 3s play
      // out below the fold, arriving to an already-white word
      start: "top 40%",
      onEnter: tryIntro,
      onEnterBack: tryIntro // deep links / restored scroll below the stage
    });

    var proxy = { v: 0 };
    gsap.timeline({
      defaults: { ease: "none" },
      scrollTrigger: {
        trigger: "#outro-stage",
        start: "top top",
        end: "bottom bottom",
        scrub: 1.1,
        invalidateOnRefresh: true,
        onToggle: function (self) {
          if (self.isActive) { tryIntro(); playVids(); camActivate(true); }
          else { pauseVids(); camActivate(false); }
        }
      }
    }).to(proxy, { v: 1, duration: 1, onUpdate: function () { render(proxy.v); } }, 0);

    render(0);
  }

  /* ============================================================
     Footer (Figma 226:48581 / 250:220) · strip filmstrip on hover +
     liquid-glass ball cluster that scatters from the cursor and drifts
     back together (elvalabs-style).
     ============================================================ */
  var footerInited = false;
  function initFooter() {
    if (footerInited) return;
    var ft = document.getElementById("footer");
    var tilesWrap = document.getElementById("ft-tiles");
    var ballsWrap = document.getElementById("ft-balls");
    if (!ft || !tilesWrap || !ballsWrap) return;
    footerInited = true;

    var IMGS = ["01","02","03","04","05","06","07","08","09","010","011","012","013"];
    function src(i) { return "main%20page/content/" + IMGS[i] + ".webp"; }

    // image trail (nakedcityfilms footer): as the cursor travels along the
    // strip, case images STAMP at the cursor position and stay put while the
    // cursor moves on — each pops in, lingers, then fades away. The words
    // stay visible underneath.
    var strip = document.getElementById("ft-strip");
    var stampIdx = 0, travel = 0, lastX = null;
    function stamp(x) {
      var d = document.createElement("div");
      d.className = "ft-stamp";
      var tw = 140 * S();
      d.style.left = Math.max(0, Math.min(strip.offsetWidth - tw, x - tw / 2)) + "px";
      var im = document.createElement("img");
      im.src = src(stampIdx); im.alt = "";
      stampIdx = (stampIdx + 1) % IMGS.length;
      d.appendChild(im);
      tilesWrap.appendChild(d);
      // pop in → linger → fade out → remove
      requestAnimationFrame(function () { d.classList.add("in"); });
      setTimeout(function () { d.classList.add("out"); }, 550);
      setTimeout(function () { d.remove(); }, 1000);
      // keep the stack bounded during fast wiggles
      var stamps = tilesWrap.querySelectorAll(".ft-stamp");
      if (stamps.length > 7) stamps[0].remove();
    }
    strip.addEventListener("pointerenter", function (e) {
      lastX = null;
      var r = strip.getBoundingClientRect();
      stamp(e.clientX - r.left); // first image right where you enter
    });
    strip.addEventListener("pointermove", function (e) {
      var r = strip.getBoundingClientRect();
      var x = e.clientX - r.left;
      if (lastX !== null) {
        travel += Math.abs(x - lastX);
        if (travel > 110 * S()) { // a new stamp every ~110 design px
          travel = 0;
          stamp(x);
        }
      }
      lastX = x;
    });

    // pre-rendered liquid-glass spheres (already shaded/highlighted in the
    // PNG itself — see ft-ball CSS), one per Figma cluster position
    // (Group 31, all 16 groups), relative to the group's origin: x, y, diameter
    var BALLS = [
      [144.8, 101.7, 150.8], [295.6, 167.1,  99.8], [ 95.5, 247.3, 117.7],
      [198.0, 268.9,  83.7], [260.8, 265.1, 134.5], [ 49.8, 137.3, 118.6],
      [  0.0, 101.7,  95.5], [ 37.5, 233.2,  75.2], [256.8, 231.9,  75.2],
      [332.1,  51.4, 104.5], [237.9, 352.5,  85.1], [162.2,  30.2,  81.1],
      [ 40.1,   0.0, 137.9], [365.4, 155.9,  81.0], [225.8,  34.7, 139.5],
      [123.9, 346.9,  96.3]
    ];
    function ballSrc(i) { return "main%20page/content/ball%20" + (i + 1) + ".png"; }
    var balls = [];
    BALLS.forEach(function (b, i) {
      var d = document.createElement("div");
      d.className = "ft-ball";
      d.style.left = "calc(" + b[0] + " * var(--s))";
      d.style.top = "calc(" + b[1] + " * var(--s))";
      d.style.width = "calc(" + b[2] + " * var(--s))";
      d.style.height = "calc(" + b[2] + " * var(--s))";
      var im = document.createElement("img");
      im.src = ballSrc(i); im.alt = ""; im.loading = "lazy";
      d.appendChild(im);
      ballsWrap.appendChild(d);
      balls.push({ el: d, bx: b[0] + b[2] / 2, by: b[1] + b[2] / 2, r: b[2] / 2,
                   ox: 0, oy: 0, tx: 0, ty: 0,
                   phase: i * 1.7, speed: 0.5 + (i % 4) * 0.13 });
    });
    if (reducedMotion) return; // static cluster, no scatter

    // scatter: cursor pushes balls away (falloff by distance), they ease
    // back together when the cursor leaves
    var ftOn = false, raf = 0, px = -1e4, py = -1e4;
    ft.addEventListener("pointermove", function (e) {
      var r = ballsWrap.getBoundingClientRect();
      px = e.clientX - r.left; py = e.clientY - r.top;
    });
    ft.addEventListener("pointerleave", function () { px = -1e4; py = -1e4; });

    function tick(now) {
      var s = S(), t = now / 1000;
      // reference video: the cursor carves a hole through the cluster —
      // nearby balls get pushed a full diameter away, then drift back
      var RANGE = 250, MAX = 170;
      for (var i = 0; i < balls.length; i++) {
        var b = balls[i];
        // cursor is tracked in on-screen px; ball geometry in design px
        var cx = b.bx * s, cy = b.by * s;
        var dx = cx - px, dy = cy - py;
        var dist = Math.hypot(dx, dy);
        var f = Math.max(0, 1 - dist / (RANGE * s));
        f = f * f;
        if (dist > 0.001) {
          b.tx = (dx / dist) * f * MAX * s;
          b.ty = (dy / dist) * f * MAX * s;
        }
        b.ox += (b.tx - b.ox) * 0.065;
        b.oy += (b.ty - b.oy) * 0.065;
        // continuous slow orbit — the cluster never sits still (reference)
        var wx = Math.sin(t * b.speed + b.phase) * 7 * s;
        var wy = Math.cos(t * b.speed * 0.8 + b.phase * 1.3) * 6 * s;
        b.el.style.setProperty("--bx", (b.ox + wx).toFixed(1) + "px");
        b.el.style.setProperty("--by", (b.oy + wy).toFixed(1) + "px");
        b.el.style.setProperty("--bs", (1 + f * 0.05).toFixed(3));
      }
      raf = ftOn ? requestAnimationFrame(tick) : 0;
    }
    if (typeof ScrollTrigger !== "undefined") {
      ScrollTrigger.create({
        trigger: "#footer",
        start: "top bottom",
        end: "bottom top",
        onToggle: function (self) {
          ftOn = self.isActive;
          if (ftOn && !raf) raf = requestAnimationFrame(tick);
        }
      });
    } else {
      ftOn = true; raf = requestAnimationFrame(tick);
    }
  }

  /* ============================================================
     Lazy video loading — every <video data-src="…"> (showreel,
     works-stage project clips) withholds its real src until it's about
     to scroll into view. Autoplay video tags make browsers fetch eagerly
     REGARDLESS of the preload attribute, so a plain preload="none" hint
     isn't enough on its own; an IntersectionObserver with a generous
     rootMargin is what actually defers the request, while still starting
     the fetch early enough (~1 screen ahead) that there's no visible
     pop-in / black-frame moment by the time the section is reached.
     ============================================================ */
  function initLazyVideos() {
    var vids = document.querySelectorAll("video[data-src]");
    if (!vids.length) return;
    function activate(v) {
      v.src = v.dataset.src;
      v.removeAttribute("data-src");
      var p = v.play();
      if (p && p.catch) p.catch(function () {}); // retried elsewhere (e.g. initShowreel) if blocked
    }
    if (typeof IntersectionObserver === "undefined") {
      vids.forEach(activate); // no IO support → fall back to eager, still correct
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { activate(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: "1000px 0px" });
    vids.forEach(function (v) { io.observe(v); });
  }

  function boot() {
    splitHeroWords();
    buildField();
    initShowreel();
    initLazyVideos();
    initMenu();
    initScrollStage(); // built up-front so the reveal never re-measures
    initAboutStage();
    initArtistsIntro();
    initAurora();
    initWorksStage();
    initCreatScatter();
    initIndustriesStage();
    initClients();
    initFaq();
    initOutro();
    initFooter();

    if (reducedMotion || !hasGsap) {
      revealInstant();
      return;
    }
    Promise.all([
      document.fonts ? document.fonts.ready : Promise.resolve(),
      preloadImages(PICS)
    ]).then(run);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
