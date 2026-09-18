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
     Hidden reveal artwork: a detailed, crisp algae illustration sits
     invisible under the hero. Moving the mouse drags a soft "torch"
     across it, briefly uncovering the artwork in a fading trail —
     the same reveal-on-hover trick as landonorris.com's helmet, but
     for a hand-drawn algae composition instead of a 3D model.
  ----------------------------------------------------------------*/
  (function () {
    var canvas = document.getElementById("revealCanvas");
    var hero = document.querySelector(".bold-hero");
    if (!canvas || !hero || reduceMotion) return;

    var ctx = canvas.getContext("2d");
    var mask = document.createElement("canvas");
    var mctx = mask.getContext("2d");
    var artwork = null;
    var mouseX = -9999, mouseY = -9999;
    var running = false;
    var rafId = null;

    function seededRandom(seed) {
      return function () {
        seed |= 0;
        seed = (seed + 0x6d2b79f5) | 0;
        var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    /* A dense, mottled, all-green texture built from overlapping soft
       clumps plus fine grain speckle — closer to a real algae culture
       photo (chaotic, clumpy, richly green) than a clean illustration,
       and deliberately distinct from the smooth ambient swirl canvas
       used elsewhere on the page. */
    function buildArtwork(width, height) {
      var off = document.createElement("canvas");
      off.width = width;
      off.height = height;
      var actx = off.getContext("2d");
      var rand = seededRandom(1337);

      var bg = actx.createLinearGradient(0, 0, width, height);
      bg.addColorStop(0, "hsl(148, 60%, 9%)");
      bg.addColorStop(0.5, "hsl(120, 55%, 13%)");
      bg.addColorStop(1, "hsl(90, 50%, 10%)");
      actx.fillStyle = bg;
      actx.fillRect(0, 0, width, height);

      var clumpCount = Math.max(10, Math.round((width * height) / 90000));
      for (var i = 0; i < clumpCount; i++) {
        var clumpX = rand() * width;
        var clumpY = rand() * height;
        var clumpR = 90 + rand() * 220;
        var blobCount = 35 + Math.floor(rand() * 45);

        for (var j = 0; j < blobCount; j++) {
          var angle = rand() * Math.PI * 2;
          var dist = Math.pow(rand(), 1.6) * clumpR;
          var bx = clumpX + Math.cos(angle) * dist;
          var by = clumpY + Math.sin(angle) * dist;
          var br = 5 + rand() * 34;
          var hue = 74 + rand() * 76; // yellow-green through deep teal-green
          var light = 16 + rand() * 34;
          var alpha = 0.4 + rand() * 0.45;
          var grad = actx.createRadialGradient(bx, by, 0, bx, by, br);
          grad.addColorStop(0, "hsla(" + hue + ", 72%, " + (light + 20) + "%, " + alpha + ")");
          grad.addColorStop(1, "hsla(" + (hue - 8) + ", 65%, " + light + "%, 0)");
          actx.fillStyle = grad;
          actx.beginPath();
          actx.arc(bx, by, br, 0, Math.PI * 2);
          actx.fill();
        }
      }

      var speckleCount = Math.floor((width * height) / 700);
      for (var s = 0; s < speckleCount; s++) {
        var sx = rand() * width;
        var sy = rand() * height;
        var sr = 0.5 + rand() * 2;
        var sHue = 78 + rand() * 70;
        actx.fillStyle = "hsla(" + sHue + ", 65%, " + (28 + rand() * 45) + "%, " + (rand() * 0.4) + ")";
        actx.beginPath();
        actx.arc(sx, sy, sr, 0, Math.PI * 2);
        actx.fill();
      }

      for (var v = 0; v < 10; v++) {
        var vx = rand() * width;
        var vy = rand() * height;
        actx.beginPath();
        actx.moveTo(vx, vy);
        var segs = 4 + Math.floor(rand() * 5);
        var cx = vx, cy = vy;
        for (var k = 0; k < segs; k++) {
          cx += (rand() - 0.5) * 130;
          cy += (rand() - 0.5) * 130;
          actx.lineTo(cx, cy);
        }
        actx.strokeStyle = "hsla(140, 55%, 6%, " + (0.2 + rand() * 0.25) + ")";
        actx.lineWidth = 1 + rand() * 2.5;
        actx.stroke();
      }

      return off;
    }

    function resize() {
      var rect = hero.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      mask.width = rect.width;
      mask.height = rect.height;
      artwork = buildArtwork(rect.width, rect.height);
    }

    function step() {
      if (!running) return;
      mctx.globalCompositeOperation = "destination-out";
      mctx.fillStyle = "rgba(0, 0, 0, 0.045)";
      mctx.fillRect(0, 0, mask.width, mask.height);

      if (mouseX > -999) {
        mctx.globalCompositeOperation = "source-over";
        var grad = mctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 150);
        grad.addColorStop(0, "rgba(255, 255, 255, 0.9)");
        grad.addColorStop(1, "rgba(255, 255, 255, 0)");
        mctx.fillStyle = grad;
        mctx.beginPath();
        mctx.arc(mouseX, mouseY, 150, 0, Math.PI * 2);
        mctx.fill();
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (artwork) ctx.drawImage(artwork, 0, 0);
      ctx.globalCompositeOperation = "destination-in";
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-over";

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
