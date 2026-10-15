/* PPT artwork, original feedback, and independently selected stage animations. */
(() => {
  "use strict";
  const root = document.getElementById("methodPlayer");
  const ppt = window.METHOD_PPT;
  if (!root || !ppt) return;

  const variable = (letter, suffix = "") => `<span class="math-variable">${letter}</span>${suffix}`;
  const X = variable("X");
  const output = variable("X", "<sup>*</sup>");
  const captions = [
    `Given a raster flowchart ${variable("F", "<sub>0</sub>")} and target aspect ratio ${variable("r")}, our method produces draw.io-editable XML ${output} in three stages: <strong>(a) Parse</strong> reconstructs the diagram structure, <strong>(b) Style</strong> restores its visual appearance, and <strong>(c) Layout</strong> adapts it to the target canvas. Each stage pairs a main agent with a critic to refine the result while preserving the original structure, style, and content.`,
    `<strong>(a) The Parse Stage</strong> combines deterministic checks and VLM feedback to progressively correct out-of-bound components and edge errors, yielding the parsed XML ${X}.`,
    `<strong>(b) The Style Stage</strong> transfers colors, typography, and corner radius, while critic feedback corrects residual font and shape mismatches.`,
    `<strong>(c) The Layout Stage</strong> applies DAG-based hierarchical relayout and iteratively resolves boundary, overlap, and routing issues, producing the final layout ${output}.`,
  ];
  const stages = [
    { key: "overview", name: "Overview", color: "#576dc1", duration: 4.1 },
    { key: "parse", name: "(a) Parse Stage", color: "#37649d", duration: 4.8 },
    { key: "style", name: "(b) Style Stage", color: "#a45236", duration: 4.8 },
    { key: "layout", name: "(c) Layout Stage", color: "#6d51a1", duration: 4.8 },
  ];
  const viewport = document.getElementById("methodViewport");
  const tabs = [...root.querySelectorAll(".method-tab")];
  const playButton = document.getElementById("methodPlay");
  const caption = document.getElementById("methodCaption");
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const image = (art, alt, className = "") => `<img class="${className}" src="${art.src}" alt="${alt}" decoding="async" draggable="false">`;
  const build = (at, content, className = "") => `<div class="method-build ${className}" data-at="${at}">${content}</div>`;

  function feedbackMarkup(source) {
    const template = document.createElement("template");
    template.innerHTML = source;
    // Restyle the original runs without changing their text, lists, or MathML.
    template.content.querySelectorAll("[style]").forEach(element => {
      const color = element.style.color;
      if (color === "rgb(255, 0, 0)") element.classList.add("method-feedback-error");
      if (color === "rgb(255, 0, 255)") element.classList.add("method-feedback-detail");
      if (color === "rgb(0, 0, 0)") element.classList.add("method-feedback-neutral");
      element.style.removeProperty("color");
    });
    template.content.querySelectorAll("mstyle[mathcolor]").forEach(element => {
      const color = element.getAttribute("mathcolor").toLowerCase();
      if (color === "#000000") element.setAttribute("mathcolor", "#414e67");
    });
    const children = [...template.content.children];
    const title = children.shift();
    if (title) {
      title.classList.add("method-feedback-heading");
      title.classList.remove("method-feedback-error", "method-feedback-detail", "method-feedback-neutral");
      title.querySelectorAll("[style]").forEach(element => {
        element.classList.remove("method-feedback-error", "method-feedback-detail", "method-feedback-neutral");
        element.style.removeProperty("font-style");
        element.style.removeProperty("text-decoration");
      });
    }
    const body = document.createElement("div");
    body.className = "method-feedback-body";
    let section;
    children.forEach(element => {
      const text = element.textContent.trim();
      if (!text && !element.querySelector("math")) return;
      const label = /^(Deterministic Check:|Suggestion:)$/.test(text);
      if (label || !section) {
        section = document.createElement("div");
        section.className = "method-feedback-section";
        body.appendChild(section);
      }
      if (label) {
        element.classList.add("method-feedback-label");
        element.classList.remove("method-feedback-error", "method-feedback-detail", "method-feedback-neutral");
      }
      if (text === "PASS" || text === "Passed: True") element.classList.add("method-feedback-pass");
      if (text === "Passed: False") element.classList.add("method-feedback-error");
      section.appendChild(element);
    });
    return (title ? title.outerHTML : "") + body.outerHTML;
  }

  const iterationHeading = (name, outcome, accepted) => `<figcaption class="method-iteration-heading"><h4>${name}</h4>${outcome ? image(outcome, accepted ? "Accepted" : "Needs correction", "method-outcome") : ""}</figcaption>`;

  function renderDetails(stage) {
    const data = ppt[stage.key];
    const names = stage.key === "style" ? ["Parsed", "Iteration 1", "Iteration 2"] : ["Iteration 1", "Iteration 2", "Iteration 3"];
    const originalLabel = stage.key === "style" ? "Original" : stage.key === "layout" ? "Original Flowchart" : "Original Image";
    const original = stage.key === "style"
      ? build(0, `<figure class="method-iteration-figure">${iterationHeading(originalLabel)}<div class="method-art">${image(data.original, originalLabel)}</div></figure>`, "method-iteration method-style-original")
      : build(0, `<figure>${image(data.original, originalLabel)}<figcaption>${originalLabel}</figcaption></figure>`, "method-original");
    const feedback = [];
    return (stage.key === "style" ? "" : original) +
      `<div class="method-iterations">${stage.key === "style" ? original : ""}${data.iterations.map((item, index) => {
        const at = .25 + index * 1.4;
        if (item.feedback) feedback.push(`<div class="method-build method-feedback" data-at="${at + .65}" data-iteration="${index}">${feedbackMarkup(item.feedback)}</div>`);
        return `<article class="method-iteration method-build" data-at="${at}" data-iteration-index="${index}">
          <figure class="method-iteration-figure">${iterationHeading(names[index], item.outcome, index === 2)}<div class="method-art">${image(item.diagram, `${stage.name}: ${names[index]}, including every annotation from the PPT`)}</div></figure>
          ${item.zooms ? build(at + .3, image(item.zooms, `${names[index]}: all magnified regions and their original colored borders`), "method-zooms") : ""}
        </article>`;
      }).join("")}</div><div class="method-feedback-row${data.iterations.filter(item => item.feedback).length === 1 ? " is-single" : ""}">${feedback.join("")}</div>`;
  }

  const scenes = stages.map((stage, index) => {
    const scene = document.createElement("div");
    scene.className = `method-scene method-stage-${stage.key}`;
    scene.id = `methodScene${index}`;
    scene.setAttribute("role", "tabpanel");
    scene.setAttribute("aria-labelledby", `methodTab${index}`);
    scene.tabIndex = 0;
    scene.hidden = index !== 0;
    scene.innerHTML = index === 0 ? `<div class="method-overview">${ppt.overview}</div>` : renderDetails(stage);
    return scene;
  });
  viewport.replaceChildren(...scenes);
  root.querySelectorAll(".method-toolbar, .method-footer").forEach(element => { element.hidden = false; });
  const builds = scenes.map(scene => [...scene.querySelectorAll(".method-build")]);
  const completed = new Set();
  let motionOptIn = false;
  let current = 0;
  let elapsed = 0;
  let playing = !motion.matches;
  let visible = false;
  let frame = null;
  let lastTime = null;
  let followed = null;

  function controls() {
    playButton.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");
    playButton.title = playing ? "Pause animation" : "Play animation";
    playButton.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${playing ? '<path d="M9 6v12M15 6v12"/>' : '<path class="method-play-symbol" d="m9 5 11 7-11 7Z"/>'}</svg>`;
    root.classList.toggle("is-paused", !playing);
  }

  function draw() {
    let latest = null;
    builds[current].forEach(element => {
      const at = Number(element.dataset.at);
      const opacity = at === 0 || (motion.matches && !motionOptIn) || completed.has(current) ? 1 : Math.max(0, Math.min(1, (elapsed - at) / (motion.matches ? .01 : .28)));
      element.style.opacity = String(opacity);
      element.setAttribute("aria-hidden", String(opacity === 0));
      if (opacity > 0 && (!latest || at >= Number(latest.dataset.at))) latest = element;
    });
    tabs.forEach((tab, index) => tab.style.setProperty("--tab-progress", `${completed.has(index) ? 100 : index === current ? elapsed / stages[current].duration * 100 : 0}%`));
    if (playing && latest && latest !== followed && current > 0 && viewport.scrollWidth > viewport.clientWidth + 2) {
      const column = latest.closest(".method-iteration") || (latest.dataset.iteration !== undefined
        ? scenes[current].querySelector(`[data-iteration-index="${latest.dataset.iteration}"]`) : null);
      if (column) {
        const left = column.getBoundingClientRect().left - viewport.getBoundingClientRect().left + viewport.scrollLeft;
        viewport.scrollTo({ left: Math.max(0, left - (viewport.clientWidth - column.offsetWidth) / 2), behavior: "smooth" });
      }
      followed = latest;
    }
  }

  function schedule() {
    if (playing && visible && !document.hidden && frame === null) frame = requestAnimationFrame(tick);
    if (!playing || !visible || document.hidden) {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      lastTime = null;
    }
  }

  function tick(now) {
    frame = null;
    if (!playing || !visible || document.hidden) { lastTime = null; return; }
    if (lastTime !== null) elapsed += (now - lastTime) / 1000;
    lastTime = now;
    if (elapsed >= stages[current].duration) {
      elapsed = stages[current].duration;
      completed.add(current);
      playing = false;
      controls();
    }
    draw(); schedule();
  }

  function select(index, restart = false) {
    current = (index + stages.length) % stages.length;
    if (restart) completed.delete(current);
    elapsed = completed.has(current) || (motion.matches && !motionOptIn) ? stages[current].duration : 0;
    playing = !completed.has(current) && (!motion.matches || motionOptIn);
    followed = null;
    lastTime = null;
    scenes.forEach((scene, i) => { scene.hidden = i !== current; });
    tabs.forEach((tab, i) => {
      tab.setAttribute("aria-selected", String(i === current));
      tab.tabIndex = i === current ? 0 : -1;
    });
    root.dataset.stage = String(current);
    root.style.setProperty("--method-accent", stages[current].color);
    caption.innerHTML = captions[current];
    viewport.scrollTo({ left: 0, behavior: "instant" });
    controls(); draw(); schedule();
  }

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(index));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % stages.length;
      if (event.key === "ArrowLeft") next = (index + stages.length - 1) % stages.length;
      if (event.key === "Home") next = 0;
      if (event.key === "End") next = stages.length - 1;
      if (next === undefined) return;
      event.preventDefault(); select(next); tabs[next].focus();
    });
  });
  playButton.addEventListener("click", () => {
    if (motion.matches && !motionOptIn) { motionOptIn = true; select(current, true); return; }
    if (completed.has(current)) { select(current, true); return; }
    playing = !playing; lastTime = null; controls(); schedule();
  });
  document.getElementById("methodPrev").addEventListener("click", () => select(current - 1));
  document.getElementById("methodNext").addEventListener("click", () => select(current + 1));
  document.addEventListener("visibilitychange", () => { lastTime = null; schedule(); });
  motion.addEventListener("change", () => {
    if (motion.matches) { motionOptIn = false; playing = false; completed.add(current); elapsed = stages[current].duration; }
    controls(); draw(); schedule();
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => { visible = entry.isIntersecting && entry.intersectionRatio >= .12; lastTime = null; schedule(); }, { threshold: [0, .12] }).observe(root);
  } else { visible = true; }
  root.classList.add("is-ready");
  select(0);
})();
