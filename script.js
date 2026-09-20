(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Nav overlay toggle */
  var navToggle = document.getElementById("navToggle");
  var navOverlay = document.getElementById("navOverlay");
  if (navToggle && navOverlay) {
    navToggle.addEventListener("click", function () {
      var open = navOverlay.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navOverlay.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navOverlay.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* Scroll-reveal */
  var revealEls = document.querySelectorAll(".reveal-b");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* ---------------------------------------------------------------
     Reusable generative "algae swirl" canvas: soft, blurred, organic
     blobs in a multi-hue teal/gold/indigo palette, drifting slowly.
     Used as a full-bleed background (hero, Life section) and as a
     small placeholder fill inside gallery cards awaiting real photos.
  ----------------------------------------------------------------*/
  var HUES = [175, 168, 42, 226]; // teal, teal-green, gold, indigo

  function initSwirl(canvas, opts) {
    if (!canvas || !canvas.getContext || reduceMotion) return;
    opts = opts || {};
    var density = opts.density || 42000;
    var minCells = opts.minCells || 7;
    var maxCells = opts.maxCells || 16;
    var blurPx = opts.blur || 16;
    var alphaRange = opts.alpha || [0.18, 0.4];

    var ctx = canvas.getContext("2d");
    var cssWidth = 0, cssHeight = 0;
    var cells = [];
    var running = false;
    var rafId = null;
    var startTime = null;

    function rand(min, max) { return min + Math.random() * (max - min); }

    function buildCells() {
      var area = cssWidth * cssHeight;
      var count = Math.max(minCells, Math.min(maxCells, Math.round(area / density)));
      cells = [];
      for (var i = 0; i < count; i++) {
        var radius = rand(0.05, 0.16) * Math.min(cssWidth, cssHeight);
        cells.push({
          x: rand(0, cssWidth),
          y: rand(0, cssHeight),
          radius: radius,
          vx: rand(-1, 1) * 0.05,
          vy: rand(-1, 1) * 0.04,
          wobbleAmt: radius * rand(0.15, 0.3),
          phase: rand(0, Math.PI * 2),
          phase2: rand(0, Math.PI * 2),
          speed: rand(0.3, 0.7),
          hue: HUES[i % HUES.length] + rand(-6, 6),
          alpha: rand(alphaRange[0], alphaRange[1])
        });
      }
    }

    function resize() {
      var rect = canvas.parentElement.getBoundingClientRect();
      cssWidth = rect.width;
      cssHeight = rect.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(cssWidth * dpr);
      canvas.height = Math.round(cssHeight * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildCells();
    }

    function drawCell(cell, t) {
      var points = 10;
      ctx.beginPath();
      for (var i = 0; i <= points; i++) {
        var angle = (i / points) * Math.PI * 2;
        var wobble =
          Math.sin(angle * 3 + t * cell.speed + cell.phase) * cell.wobbleAmt +
          Math.cos(angle * 2 - t * cell.speed * 0.7 + cell.phase2) * cell.wobbleAmt * 0.6;
        var r = cell.radius + wobble;
        var px = cell.x + Math.cos(angle) * r;
        var py = cell.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      var hue = cell.hue + Math.sin(t * 0.15 + cell.phase) * 8;
      var grad = ctx.createRadialGradient(cell.x, cell.y, 0, cell.x, cell.y, cell.radius * 1.4);
      grad.addColorStop(0, "hsla(" + hue + ", 70%, 55%, " + cell.alpha + ")");
      grad.addColorStop(1, "hsla(" + (hue + 20) + ", 65%, 30%, 0)");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    function step(now) {
      if (!running) return;
      if (startTime === null) startTime = now;
      var t = (now - startTime) / 1000;

      ctx.clearRect(0, 0, cssWidth, cssHeight);
      ctx.filter = "blur(" + blurPx + "px)";
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i];
        cell.x += cell.vx;
        cell.y += cell.vy;
        var pad = cell.radius * 1.6;
        if (cell.x < -pad) cell.x = cssWidth + pad;
        if (cell.x > cssWidth + pad) cell.x = -pad;
        if (cell.y < -pad) cell.y = cssHeight + pad;
        if (cell.y > cssHeight + pad) cell.y = -pad;
        drawCell(cell, t);
      }
      ctx.filter = "none";
      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    }

    resize();
    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !document.hidden) start();
            else stop();
          });
        },
        { threshold: 0.01 }
      );
      obs.observe(canvas.parentElement);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
    window.addEventListener("resize", resize);
  }

  initSwirl(document.getElementById("swirlHero"), { density: 34000, maxCells: 18, blur: 20, alpha: [0.22, 0.42] });
  initSwirl(document.getElementById("swirlLife"), { density: 36000, maxCells: 16, blur: 18, alpha: [0.16, 0.32] });

  document.querySelectorAll(".swirl-canvas-small").forEach(function (c) {
    initSwirl(c, { density: 9000, minCells: 4, maxCells: 8, blur: 12, alpha: [0.35, 0.6] });
  });

  /* ---------------------------------------------------------------
     Reveal: moving the mouse over the portrait panel drags a soft
     mask that briefly uncovers a fluid-pour painting. In the space
     around her it shows in the painting's original colors; over her
     own portrait it shows a green version of the same painting.
  ----------------------------------------------------------------*/
  (function () {
    var canvas = document.getElementById("revealCanvas");
    var hero = document.querySelector(".portrait-panel");
    var portraitImg = document.querySelector(".hero-portrait");
    if (!canvas || !hero || !portraitImg || reduceMotion) return;

    function makeCanvas() { return document.createElement("canvas"); }
    var ctx = canvas.getContext("2d");
    var mask = makeCanvas(), mctx = mask.getContext("2d");
    var personMask = makeCanvas(), personMaskCtx = personMask.getContext("2d");
    var bgLayer = makeCanvas(), bgCtx = bgLayer.getContext("2d");
    var personLayer = makeCanvas(), personCtx = personLayer.getContext("2d");
    var artOriginal = null, artGreen = null;
    var mouseX = -9999, mouseY = -9999;
    var running = false, rafId = null;

    var art = new Image();
    var artReady = false;
    art.onload = function () { artReady = true; resize(); };
    art.src = "assets/img/pour-art.jpg";

    var personAlphaImg = new Image();
    var personAlphaReady = false;
    personAlphaImg.onload = function () { personAlphaReady = true; buildPersonMask(); };
    personAlphaImg.src = "assets/img/portrait-alpha.png";

    // Green ramp: luminance of the painting mapped from deep forest to pale lime.
    var RAMP = [
      [0.0, [3, 26, 10]], [0.35, [11, 90, 31]], [0.6, [47, 174, 58]],
      [0.82, [155, 232, 59]], [1.0, [239, 255, 196]]
    ];
    var LUT = [];
    for (var i = 0; i < 256; i++) {
      var t = Math.min(1, Math.max(0, (i / 255 - 0.06) / 0.88));
      var k = 0;
      while (k < RAMP.length - 2 && t > RAMP[k + 1][0]) k++;
      var a = RAMP[k], b = RAMP[k + 1];
      var f = (t - a[0]) / (b[0] - a[0]);
      LUT.push([0, 1, 2].map(function (c) { return Math.round(a[1][c] + (b[1][c] - a[1][c]) * f); }));
    }

    function coverDraw(target, w, h) {
      var s = Math.max(w / art.naturalWidth, h / art.naturalHeight);
      var dw = art.naturalWidth * s, dh = art.naturalHeight * s;
      target.drawImage(art, (w - dw) / 2, (h - dh) / 2, dw, dh);
    }

    function buildArtworks(w, h) {
      artOriginal = makeCanvas();
      artOriginal.width = w; artOriginal.height = h;
      coverDraw(artOriginal.getContext("2d"), w, h);

      artGreen = makeCanvas();
      artGreen.width = w; artGreen.height = h;
      var gctx = artGreen.getContext("2d");
      gctx.drawImage(artOriginal, 0, 0);
      var img = gctx.getImageData(0, 0, w, h), d = img.data;
      for (var p = 0; p < d.length; p += 4) {
        var lum = Math.round(0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]);
        var c = LUT[lum];
        d[p] = c[0]; d[p + 1] = c[1]; d[p + 2] = c[2];
      }
      gctx.putImageData(img, 0, 0);
    }

    function buildPersonMask() {
      var panelRect = hero.getBoundingClientRect();
      var imgRect = portraitImg.getBoundingClientRect();
      personMask.width = Math.round(panelRect.width);
      personMask.height = Math.round(panelRect.height);
      if (!personAlphaReady || !panelRect.width) return;
      personMaskCtx.drawImage(
        personAlphaImg,
        imgRect.left - panelRect.left, imgRect.top - panelRect.top,
        imgRect.width, imgRect.height
      );
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      var w = Math.round(rect.width), h = Math.round(rect.height);
      if (!w || !h) return;
      [canvas, mask, bgLayer, personLayer].forEach(function (c) { c.width = w; c.height = h; });
      if (artReady) buildArtworks(w, h);
      buildPersonMask();
    }

    var cur = { x: -9999, y: -9999 }, lastDraw = null;

    function blob(x, y, R, t) {
      mctx.beginPath();
      var n = 30;
      for (var i = 0; i <= n; i++) {
        var a = (i / n) * Math.PI * 2;
        var r = R * (1 + 0.16 * Math.sin(a * 3 + t * 0.004) + 0.1 * Math.sin(a * 5 - t * 0.003));
        var px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
        if (i === 0) mctx.moveTo(px, py); else mctx.lineTo(px, py);
      }
      mctx.closePath();
      mctx.fill();
    }

    function step(t) {
      if (!running) return;
      var w = canvas.width, h = canvas.height;
      var R = Math.max(110, portraitImg.getBoundingClientRect().width * 0.26);

      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = "rgba(0, 0, 0, 0.03)";
      mctx.fillRect(0, 0, w, h);
      mctx.globalCompositeOperation = "source-over";
      mctx.fillStyle = "#fff";

      if (mouseX > -999) {
        if (cur.x < -999) { cur.x = mouseX; cur.y = mouseY; lastDraw = null; }
        cur.x += (mouseX - cur.x) * 0.4;
        cur.y += (mouseY - cur.y) * 0.4;
        if (lastDraw) {
          var dx = cur.x - lastDraw.x, dy = cur.y - lastDraw.y;
          var steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) / (R * 0.35)));
          for (var s = 1; s <= steps; s++) blob(lastDraw.x + dx * s / steps, lastDraw.y + dy * s / steps, R, t);
        } else {
          blob(cur.x, cur.y, R, t);
        }
        lastDraw = { x: cur.x, y: cur.y };
      } else {
        cur.x = cur.y = -9999;
        lastDraw = null;
      }

      ctx.clearRect(0, 0, w, h);
      if (artOriginal && personAlphaReady) {
        // around her: original painting, cut away where she is
        bgCtx.globalCompositeOperation = "source-over";
        bgCtx.clearRect(0, 0, w, h);
        bgCtx.drawImage(artOriginal, 0, 0);
        bgCtx.globalCompositeOperation = "destination-in";
        bgCtx.drawImage(mask, 0, 0);
        bgCtx.globalCompositeOperation = "destination-out";
        bgCtx.drawImage(personMask, 0, 0);
        bgCtx.globalCompositeOperation = "source-over";

        // over her: green painting, kept only where she is
        personCtx.globalCompositeOperation = "source-over";
        personCtx.clearRect(0, 0, w, h);
        personCtx.drawImage(artGreen, 0, 0);
        personCtx.globalCompositeOperation = "destination-in";
        personCtx.drawImage(mask, 0, 0);
        personCtx.drawImage(personMask, 0, 0);
        personCtx.globalCompositeOperation = "source-over";

        ctx.drawImage(bgLayer, 0, 0);
        ctx.drawImage(personLayer, 0, 0);
      }

      rafId = window.requestAnimationFrame(step);
    }

    function start() {
      if (running) return;
      running = true;
      rafId = window.requestAnimationFrame(step);
    }
    function stop() {
      running = false;
      if (rafId) window.cancelAnimationFrame(rafId);
    }

    hero.addEventListener("mousemove", function (e) {
      var rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });
    hero.addEventListener("mouseleave", function () {
      mouseX = -9999;
      mouseY = -9999;
    });

    resize();
    window.addEventListener("resize", resize);
    if (portraitImg.complete) resize();
    else portraitImg.addEventListener("load", resize);

    if ("IntersectionObserver" in window) {
      var obs = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && !document.hidden) start();
            else stop();
          });
        },
        { threshold: 0.01 }
      );
      obs.observe(hero);
    } else {
      start();
    }
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) stop();
      else start();
    });
  })();
})();
