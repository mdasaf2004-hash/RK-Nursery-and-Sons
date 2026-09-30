/* RK Nursery & Sons — interactions */
(function () {
  "use strict";

  var D = window.RK_DATA || { categories: [], products: [], life: [] };
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function scrollToEl(el, off) {
    var y = el.getBoundingClientRect().top + window.scrollY - (off == null ? 92 : off);
    window.scrollTo({ top: Math.max(0, y), behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------------- reveal on scroll ---------------- */
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
  }
  function watch(root) {
    var els = $$(".reveal", root || document);
    if (!io) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    els.forEach(function (e) { io.observe(e); });
  }

  /* ---------------- counters ---------------- */
  function runCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseInt(el.dataset.count, 10) || 0;
    var suffix = el.dataset.suffix || "";
    var plain = el.dataset.plain === "1";
    var from = plain ? target - 55 : 0;
    if (reduce) { el.textContent = (plain ? target : target.toLocaleString("en-IN")) + suffix; return; }
    var dur = 1500, t0 = performance.now();
    (function step(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      var v = Math.round(from + (target - from) * e);
      el.textContent = (plain ? v : v.toLocaleString("en-IN")) + suffix;
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.5 });
    $$("[data-count]").forEach(function (e) { cio.observe(e); });
  } else {
    $$("[data-count]").forEach(runCount);
  }

  /* ---------------- nav ---------------- */
  var nav = $("#nav"), burger = $("#burger"), menu = $("#menu"), bar = $("#bar"), totop = $("#totop");
  function onScroll() {
    var y = window.scrollY || 0;
    nav.classList.toggle("solid", y > 40);
    totop.classList.toggle("on", y > 700);
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  burger.addEventListener("click", function () {
    var on = menu.classList.toggle("on");
    burger.classList.toggle("on", on);
    burger.setAttribute("aria-expanded", on ? "true" : "false");
    document.body.style.overflow = on ? "hidden" : "";
  });
  $$("#menu a").forEach(function (a) {
    a.addEventListener("click", function () {
      menu.classList.remove("on"); burger.classList.remove("on");
      burger.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    });
  });
  totop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  });

  /* active link */
  var links = $$("#menu a[href^='#']");
  if ("IntersectionObserver" in window) {
    var sio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) {
          l.classList.toggle("active", l.getAttribute("href") === "#" + e.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    $$("main section[id]").forEach(function (s) { sio.observe(s); });
  }

  /* ---------------- lightbox ---------------- */
  var lb = $("#lb"), lbimg = $("#lbimg"), lbcap = $("#lbcap");
  var lbItems = [], lbIndex = 0, lastFocus = null;

  function openLB(items, i) {
    lbItems = items; lbIndex = i; lastFocus = document.activeElement;
    lb.hidden = false;
    requestAnimationFrame(function () { lb.classList.add("on"); });
    document.body.style.overflow = "hidden";
    show();
    $("#lbx").focus();
  }
  function show() {
    var it = lbItems[lbIndex];
    if (!it) return;
    lbimg.src = it.src; lbimg.alt = it.alt || "";
    lbcap.innerHTML = it.cap + (it.sub ? "<i>" + it.sub + "</i>" : "");
    var multi = lbItems.length > 1;
    $("#lbprev").style.display = multi ? "grid" : "none";
    $("#lbnext").style.display = multi ? "grid" : "none";
  }
  function closeLB() {
    lb.classList.remove("on");
    document.body.style.overflow = "";
    setTimeout(function () { lb.hidden = true; lbimg.src = ""; }, 320);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) { lbIndex = (lbIndex + d + lbItems.length) % lbItems.length; show(); }

  $("#lbx").addEventListener("click", closeLB);
  $("#lbprev").addEventListener("click", function () { step(-1); });
  $("#lbnext").addEventListener("click", function () { step(1); });
  lb.addEventListener("click", function (e) { if (e.target === lb) closeLB(); });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLB();
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  /* ---------------- plastic masonry ---------------- */
  var masonry = $("#masonry");
  var MASONRY_PAGE = 8;
  var masonryExpanded = false;
  var masonryMoreWrap = $("#masonryMoreWrap"), masonryMore = $("#masonryMore");
  var lifeItems = (D.life || []).map(function (l) {
    return { src: "assets/img/life/" + l.f, alt: "Roto moulded plastic planter", cap: "Roto moulded series", sub: "RK Nursery & Sons · Plastic pots" };
  });
  function lifeVisible() { return masonryExpanded ? lifeItems : lifeItems.slice(0, MASONRY_PAGE); }
  lifeItems.forEach(function (it, i) {
    var hid = i >= MASONRY_PAGE;
    var fig = document.createElement("figure");
    fig.className = "reveal" + (hid ? " hid" : "");
    fig.setAttribute("data-d", String(i % 5));
    if (hid) fig.setAttribute("data-anim", "zoom");
    fig.innerHTML = '<img loading="lazy" src="' + it.src + '" alt="' + it.alt + '">';
    fig.addEventListener("click", function () {
      var vis = lifeVisible();
      openLB(vis, vis.indexOf(it));
    });
    masonry.appendChild(fig);
  });
  function updateMasonryMore() {
    var hidden = Math.max(0, lifeItems.length - MASONRY_PAGE);
    if (!hidden) { masonryMoreWrap.hidden = true; masonry.classList.remove("expanded"); return; }
    masonryMoreWrap.hidden = false;
    masonry.classList.toggle("expanded", masonryExpanded);
    masonryMore.setAttribute("aria-expanded", masonryExpanded ? "true" : "false");
    masonryMore.querySelector("span").textContent = masonryExpanded ? "Show less" : "View more";
    masonryMore.querySelector("small").textContent = masonryExpanded
      ? "showing all " + lifeItems.length
      : "+" + hidden + " more";
  }
  masonryMore.addEventListener("click", function () {
    masonryExpanded = !masonryExpanded;
    updateMasonryMore();
    if (!masonryExpanded) scrollToEl(masonry);
  });
  updateMasonryMore();

  /* ---------------- gallery ---------------- */
  var grid = $("#grid"), filters = $("#filters"), search = $("#search"),
      countEl = $("#count"), empty = $("#empty");
  var gridMoreWrap = $("#gridMoreWrap"), gridMore = $("#gridMore");
  var GRID_PAGE = 12, expanded = false, lastTotal = 0;
  var cats = [{ id: "all", label: "All" }].concat(D.categories);
  var active = "all", query = "";

  var prodItems = (D.products || []).map(function (p, i) {
    return {
      src: "assets/img/products/" + p.f,
      alt: p.n + (p.s ? " (" + p.s + ")" : ""),
      cap: p.n,
      sub: [p.s, p.p ? "₹ " + p.p.replace(/\/-|\s+/g, " ").trim() : ""].filter(Boolean).join("   ·   "),
      raw: p, i: i
    };
  });

  cats.forEach(function (c) {
    var b = document.createElement("button");
    b.className = "chip" + (c.id === "all" ? " on" : "");
    b.type = "button";
    b.dataset.f = c.id;
    var n = c.id === "all" ? prodItems.length : prodItems.filter(function (x) { return x.raw.c === c.id; }).length;
    b.innerHTML = c.label + " <span style='opacity:.55'>" + n + "</span>";
    b.addEventListener("click", function () { setFilter(c.id); });
    filters.appendChild(b);
  });

  function setFilter(id, scroll) {
    active = id;
    $$(".chip", filters).forEach(function (b) { b.classList.toggle("on", b.dataset.f === id); });
    render();
    if (scroll) {
      var t = document.getElementById("gallery");
      if (t) window.scrollTo({ top: t.offsetTop - 70, behavior: reduce ? "auto" : "smooth" });
    }
  }

  function matches(x) {
    if (active !== "all" && x.raw.c !== active) return false;
    if (!query) return true;
    var hay = (x.raw.n + " " + x.raw.s + " " + x.raw.p + " " + x.raw.c).toLowerCase();
    return hay.indexOf(query) > -1;
  }

  function render() {
    var list = [];
    grid.innerHTML = "";
    prodItems.forEach(function (x) {
      if (!matches(x)) return;
      list.push(x);
      var n = list.length;
      var hid = n > GRID_PAGE;
      var b = document.createElement("button");
      b.className = "card" + (hid ? " hid" : "");
      b.type = "button";
      var pos = hid ? n - GRID_PAGE - 1 : n - 1;
      b.style.animationDelay = Math.min(pos, 24) * 0.022 + "s";
      b.innerHTML =
        '<span class="card-flag">Enlarge</span>' +
        '<span class="card-img"><img loading="lazy" src="' + x.src + '" alt="' + x.alt.replace(/"/g, "&quot;") + '"></span>' +
        '<span class="card-cap"><b>' + x.raw.n + '</b><span>' + x.raw.s + "<i>" +
        (x.raw.p || "").replace(/ · /g, " · ") + "</i></span></span>";
      b.addEventListener("click", function () {
        var vis = expanded ? list : list.slice(0, GRID_PAGE);
        openLB(vis.map(function (y) {
          return { src: y.src, alt: y.alt, cap: y.cap, sub: y.sub };
        }), vis.indexOf(x));
      });
      grid.appendChild(b);
    });
    lastTotal = list.length;
    countEl.textContent = list.length + " of " + prodItems.length + " planters";
    empty.hidden = list.length > 0;
    updateGridMore();
  }

  function updateGridMore() {
    var hidden = Math.max(0, lastTotal - GRID_PAGE);
    if (!hidden) {
      gridMoreWrap.hidden = true;
      grid.classList.remove("expanded");
      return;
    }
    gridMoreWrap.hidden = false;
    grid.classList.toggle("expanded", expanded);
    gridMore.setAttribute("aria-expanded", expanded ? "true" : "false");
    gridMore.querySelector("span").textContent = expanded ? "Show less" : "View more";
    gridMore.querySelector("small").textContent = expanded
      ? "showing all " + lastTotal
      : "+" + hidden + " more";
  }

  gridMore.addEventListener("click", function () {
    expanded = !expanded;
    updateGridMore();
    if (!expanded) scrollToEl(grid);
  });

  search.addEventListener("input", function () {
    query = search.value.trim().toLowerCase();
    render();
  });

  /* collection tiles → filter + scroll */
  $$("#tiles .tile").forEach(function (t) {
    t.addEventListener("click", function () { setFilter(t.dataset.filter, true); });
  });

  render();

  /* fill counts from data */
  $$("#tiles .tile").forEach(function (t) {
    var f = t.dataset.filter;
    var n = f === "all" ? prodItems.length
      : prodItems.filter(function (x) { return x.raw.c === f; }).length;
    var i = t.querySelector(".tile-meta i");
    if (i) i.textContent = n + (f === "all" ? " planters" : " designs");
  });
  var totalStat = $("#statTotal");
  if (totalStat) { totalStat.dataset.count = String(prodItems.length); totalStat.textContent = prodItems.length + "+"; }
  var heroTotal = $("#heroTotal");
  if (heroTotal) heroTotal.textContent = prodItems.length;

  /* layout probe (?probe): paint diagnostics over the page for QA screenshots */
  if (/[?&]probe\b/.test(location.search)) {
    document.documentElement.classList.add("shot");
    var runProbe = function () {
      var old = document.getElementById("probebox");
      if (old && old.parentNode) old.parentNode.removeChild(old);
      var vw = document.documentElement.clientWidth;
      var sw = document.documentElement.scrollWidth;
      var lines = ["vw=" + vw + "  sw=" + sw + "  overflow=" + (sw > vw + 1 ? "YES" : "no")];
      var els = document.body.querySelectorAll("*"), n = 0, i;
      for (i = 0; i < els.length && n < 22; i++) {
        var el = els[i];
        if (el.id === "probebox") continue;
        var cs = getComputedStyle(el);
        if (cs.position === "fixed" || cs.display === "none" || cs.visibility === "hidden" || +cs.opacity === 0) continue;
        var r = el.getBoundingClientRect();
        if (!r.width && !r.height) continue;
        if (r.right > vw + 1 || r.left < -1) {
          n++;
          lines.push(el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") +
            (typeof el.className === "string" && el.className ? "." + el.className.split(" ")[0] : "") +
            "  L" + Math.round(r.left) + " R" + Math.round(r.right) + " W" + Math.round(r.width));
        }
      }
      if (!n) lines.push("no overflowing elements");
      var imgs = document.images, miss = 0, pend = 0, j, badSrc = [];
      for (j = 0; j < imgs.length; j++) {
        if (imgs[j].complete && !imgs[j].naturalWidth) { miss++; badSrc.push(imgs[j].getAttribute("src")); }
        else if (!imgs[j].complete) pend++;
      }
      lines.push("imgs=" + imgs.length + " failed=" + miss + " pending=" + pend +
        (badSrc.length ? "  bad: " + badSrc.join(" | ") : ""));
      lines.push("cards=" + document.querySelectorAll("#grid .card").length +
        " tiles=" + document.querySelectorAll("#tiles .tile").length +
        " masonry=" + document.querySelectorAll("#masonry figure").length +
        " chips=" + document.querySelectorAll("#filters .chip").length);
      var box = document.createElement("div");
      box.id = "probebox";
      box.style.cssText = "position:absolute;left:0;top:0;z-index:99999;background:#fff;color:#000;" +
        "font:15px/1.45 Consolas,monospace;padding:10px 14px;border:2px solid #000;white-space:pre";
      box.textContent = lines.join("\n");
      document.body.appendChild(box);
    };
    runProbe();
    window.addEventListener("load", runProbe);
    setTimeout(runProbe, 700);
    setTimeout(runProbe, 1700);
    $("#yr").textContent = new Date().getFullYear();
    return;
  }

  /* preview mode (?shot): bring one section to the top without scrolling */
  if (/[?&]shot\b/.test(location.search)) {
    document.documentElement.classList.add("shot");
    var pin = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    if (pin) {
      var isolate = function () {
        var kids = document.querySelectorAll("main > *"), seen = false;
        for (var k = 0; k < kids.length; k++) {
          if (kids[k] === pin) { seen = true; kids[k].style.display = ""; continue; }
          kids[k].style.display = seen ? "" : "none";
        }
        var nv = document.getElementById("nav");
        if (nv) nv.classList.add("solid");
      };
      isolate();
      window.addEventListener("load", isolate);
    }
    $("#yr").textContent = new Date().getFullYear();
    return;
  }

  watch();
  $("#yr").textContent = new Date().getFullYear();

  /* land instantly on a deep link (no smooth fly-in from the top) */
  function landOnHash() {
    if (!location.hash) return;
    var t = document.getElementById(location.hash.slice(1));
    if (!t) return;
    var prev = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    window.scrollTo(0, Math.max(0, t.getBoundingClientRect().top + window.scrollY - 64));
    document.documentElement.style.scrollBehavior = prev;
  }
  landOnHash();
  window.addEventListener("load", landOnHash);

  /* re-watch anything injected later */
  setTimeout(watch, 60);
})();
