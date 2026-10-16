const TEASERS = [
  {
    title: "Paper-to-slide pipeline",
    folder: "CVPR2024",
    ref: "ref.jpg",
    outputs: [
      ["16:9", "teacher_16_9.png"],
      ["4:3", "teacher_4_3.png"],
      ["1:1", "teacher_1_1.png"],
      ["3:4", "teacher_3_4.png"],
      ["9:16", "teacher_9_16.png"]
    ]
  },
  {
    title: "Long-form visual pipeline",
    folder: "NeurIPS5",
    ref: "ref.jpeg",
    outputs: [
      ["16:9", "NeurIPS2025-00005_16_9.png"],
      ["3:2", "NeurIPS2025-00005_3_2.png"],
      ["1:1", "NeurIPS2025-00005_1_1.png"],
      ["2:3", "NeurIPS2025-00005_2_3.png"],
      ["9:16", "NeurIPS2025-00005_9_16.png"]
    ]
  },
  {
    title: "Multi-stage reasoning flow",
    folder: "ICLR10",
    ref: "ref.jpeg",
    outputs: [
      ["10:3", "ICLR2026-00010_10_3.png"],
      ["17:12", "ICLR2026-00010_17_12.png"],
      ["1:1", "ICLR2026-00010_1_1.png"],
      ["2:3", "ICLR2026-00010_2_3.png"],
      ["1:2", "ICLR2026-00010_1_2.png"]
    ]
  },
  {
    title: "Dense architecture diagram",
    folder: "ECCV23",
    ref: "ref.jpeg",
    outputs: [
      ["4:1", "ECCV2024-00023_4_1.png"],
      ["3:2", "ECCV2024-00023_3_2.png"],
      ["1:1", "ECCV2024-00023_1_1.png"],
      ["2:3", "ECCV2024-00023_2_3.png"],
      ["7:24", "ECCV2024-00023_7_24.png"]
    ]
  }
];

const CASES = [
  { id: "ECCV2024-00042", difficulty: "easy" },
  { id: "ECCV2024-00048", difficulty: "easy" },
  { id: "ECCV2024-00002", difficulty: "medium" },
  { id: "ECCV2024-00026", difficulty: "medium" },
  { id: "ICCV2025-00015", difficulty: "medium" },
  { id: "ICLR2026-00005-3", difficulty: "medium" },
  { id: "ECCV2024-00024", difficulty: "hard" },
  { id: "ECCV2024-00025", difficulty: "hard" },
  { id: "ICLR2026-00008", difficulty: "hard" },
  { id: "CVPR2025-00023", difficulty: "hard" }
];

const BASELINES = [
  { value: "autofigure", label: "AutoFigure-Edit" },
  { value: "gpt", label: "GPT Image 2.0" },
  { value: "nanobanana", label: "Nano Banana Pro" },
  { value: "paperbanana", label: "PaperBanana" }
];

const RATIOS = [
  { key: "1_1", label: "1:1" },
  { key: "3_2", label: "3:2" },
  { key: "16_9", label: "16:9" },
  { key: "2_3", label: "2:3" },
  { key: "9_16", label: "9:16" },
  { key: "2.39_1", label: "2.39:1", special: true, baseline: false },
  { key: "1_4", label: "1:4", special: true, baseline: false }
];

let currentIndex = 0;
let currentBaseline = "autofigure";
let currentTeaser = 0;
let currentStyle = "case1";

function imageWithFallback(paths, className, alt) {
  const wrapper = document.createElement("div");
  const img = document.createElement("img");
  const missing = document.createElement("div");
  img.className = className;
  img.alt = alt;
  img.loading = "lazy";
  missing.className = "missing";
  missing.textContent = "Image unavailable";
  wrapper.appendChild(img);
  wrapper.appendChild(missing);
  let index = 0;
  function tryNext() {
    if (index >= paths.length) {
      img.style.display = "none";
      missing.style.display = "flex";
      return;
    }
    img.src = paths[index];
    index += 1;
  }
  img.onload = () => {
    img.style.display = "block";
    missing.style.display = "none";
  };
  img.onerror = tryNext;
  tryNext();
  return { wrapper, img };
}

function teaserPath(item, file) {
  return `static/images/teaser/${item.folder}/${file}`;
}

function oursPath(caseId, ratio) {
  return `static/images/experiment_result/ours/${caseId}/${ratio}.jpg`;
}

function baselinePath(method, caseId, ratio) {
  return `static/images/experiment_result/${method}/${caseId}/${ratio}.jpg`;
}

function originalPaths(caseId) {
  return [
    `static/images/experiment_result/original_graph/${caseId}.jpeg`,
    `static/images/experiment_result/original_graph/${caseId}.jpg`
  ];
}

function renderTeasers() {
  const grid = document.getElementById("teaserGrid");
  if (!grid) return;
  const tabs = document.getElementById("teaserTabs");
  grid.replaceChildren();
  tabs.innerHTML = "";
  TEASERS.forEach((example, index) => {
    const slide = document.createElement("article");
    slide.className = "teaser-slide";
    slide.id = `teaserSlide${index}`;
    slide.setAttribute("aria-label", `Example ${index + 1}: ${example.title}`);
    slide.setAttribute("aria-roledescription", "slide");
    const composition = document.createElement("div");
    composition.className = "teaser-composition";
    const reference = document.createElement("div");
    reference.className = "teaser-reference";
    reference.appendChild(createTeaserFigure(example, "Original", example.ref));
    composition.appendChild(reference);
    const outputs = document.createElement("fieldset");
    outputs.className = "teaser-outputs";
    const legend = document.createElement("legend");
    legend.innerHTML = 'Ours <span class="editable-label"><i class="fas fa-hand-pointer" aria-hidden="true"></i><span>Editable in draw.io</span></span>';
    outputs.appendChild(legend);
    const ratios = document.createElement("div");
    ratios.className = "teaser-ratios";
    example.outputs.slice(1).forEach(([ratio, file]) => {
      const figure = createTeaserFigure(example, ratio, file);
      figure.dataset.ratio = ratio;
      ratios.appendChild(figure);
    });
    outputs.appendChild(ratios);
    const wide = createTeaserFigure(example, example.outputs[0][0], example.outputs[0][1]);
    wide.classList.add("teaser-wide");
    outputs.appendChild(wide);
    composition.appendChild(outputs);
    slide.appendChild(composition);
    grid.appendChild(slide);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "teaser-dot";
    button.title = `Example ${index + 1}: ${example.title}`;
    button.setAttribute("aria-label", button.title);
    button.setAttribute("aria-controls", slide.id);
    button.addEventListener("click", () => selectTeaser(index));
    tabs.appendChild(button);
  });
  const viewport = document.getElementById("teaserViewport");
  viewport.addEventListener("scroll", () => {
    if (!viewport.clientWidth) return;
    const index = Math.max(0, Math.min(TEASERS.length - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
    if (index !== currentTeaser) {
      currentTeaser = index;
      updateTeaserControls();
    }
  }, { passive: true });
  viewport.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    selectTeaser(event.key === "Home" ? 0 : event.key === "End" ? TEASERS.length - 1 :
      currentTeaser + (event.key === "ArrowRight" ? 1 : -1));
  });
  window.addEventListener("pageshow", () => {
    currentTeaser = 0;
    viewport.scrollTo({ left: 0, behavior: "instant" });
    updateTeaserControls();
  });
  viewport.scrollTo({ left: 0, behavior: "instant" });
  updateTeaserControls();
}

function createTeaserFigure(item, label, file) {
  const figure = document.createElement("figure");
  figure.className = "teaser-figure";
  figure.innerHTML = `<figcaption>${label}</figcaption><div class="figure-media"><img src="${teaserPath(item, file)}" alt="${item.title}: ${label}" decoding="async"></div>`;
  const img = figure.querySelector("img");
  const updateSize = () => img.style.setProperty("--natural-ratio", img.naturalWidth / img.naturalHeight);
  img.addEventListener("load", updateSize);
  if (img.complete && img.naturalWidth) updateSize();
  return figure;
}

function updateTeaserControls() {
  document.querySelectorAll("#teaserTabs .teaser-dot").forEach((button, index) => {
    button.classList.toggle("active", index === currentTeaser);
    button.setAttribute("aria-pressed", String(index === currentTeaser));
  });
  document.querySelectorAll(".teaser-slide").forEach((slide, index) => {
    slide.inert = index !== currentTeaser;
  });
}

function selectTeaser(index) {
  currentTeaser = (index + TEASERS.length) % TEASERS.length;
  const viewport = document.getElementById("teaserViewport");
  viewport.scrollTo({
    left: viewport.clientWidth * currentTeaser,
    behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth"
  });
  updateTeaserControls();
}

function createRatioCard(label, src, hoverSrc = "", special = false) {
  const card = document.createElement("article");
  card.className = `ratio-card${hoverSrc ? " hover-swap" : ""}${special ? " special" : ""}`;
  card.tabIndex = hoverSrc ? 0 : -1;
  card.innerHTML = `<h5>${label}</h5>`;
  const holder = document.createElement("div");
  holder.className = "image-holder";
  const loaded = imageWithFallback([src], "result-image", `${label} result`);
  if (hoverSrc) {
    loaded.wrapper.className = "swap-media";
    holder.appendChild(loaded.wrapper);
  } else {
    const media = document.createElement("div");
    media.className = "figure-media";
    media.append(...loaded.wrapper.childNodes);
    holder.appendChild(media);
  }
  if (hoverSrc) {
    const hint = document.createElement("span");
    hint.className = "comparison-hint";
    hint.setAttribute("aria-live", "polite");
    hint.textContent = selectedBaselineLabel();
    card.title = "Compare with Ours";
    loaded.wrapper.appendChild(hint);
    const showOurs = () => {
      loaded.img.src = hoverSrc;
      hint.textContent = "Ours";
      loaded.img.alt = `Ours: ${label} result`;
      hint.classList.add("is-ours");
    };
    const showBaseline = () => {
      loaded.img.src = src;
      hint.textContent = selectedBaselineLabel();
      loaded.img.alt = `${selectedBaselineLabel()}: ${label} result`;
      hint.classList.remove("is-ours");
    };
    card.addEventListener("mouseenter", showOurs);
    card.addEventListener("focus", () => {
      if (card.matches(":focus-visible")) showOurs();
    });
    card.addEventListener("mouseleave", showBaseline);
    card.addEventListener("blur", showBaseline);
    card.addEventListener("click", () => {
      if (loaded.img.getAttribute("src") === hoverSrc) showBaseline();
      else showOurs();
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        card.click();
      }
    });
  }
  card.appendChild(holder);
  return card;
}

function selectedBaselineLabel() {
  return BASELINES.find((item) => item.value === currentBaseline).label;
}

function createOriginalCard(caseId) {
  const card = createRatioCard("Original", originalPaths(caseId)[0]);
  const holder = card.querySelector(".figure-media");
  const loaded = imageWithFallback(originalPaths(caseId), "result-image", "Original diagram");
  holder.replaceChildren(...loaded.wrapper.childNodes);
  return card;
}

function renderBaseline(caseId) {
  const grid = document.getElementById("baselineGrid");
  const title = document.getElementById("baselineTitle");
  const selected = BASELINES.find((item) => item.value === currentBaseline);
  grid.innerHTML = "";
  grid.appendChild(createOriginalCard(caseId));
  title.textContent = selected.label;
  RATIOS.filter((ratio) => ratio.baseline !== false).forEach((ratio) => {
    grid.appendChild(
      createRatioCard(
        ratio.label,
        baselinePath(currentBaseline, caseId, ratio.key),
        oursPath(caseId, ratio.key),
        ratio.special
      )
    );
  });
}

function renderExplorer() {
  const track = document.getElementById("resultTrack");
  track.replaceChildren();
  CASES.forEach((item) => {
    const slide = document.createElement("article");
    slide.className = "carousel-slide";
    const grid = document.createElement("div");
    grid.className = "ratio-grid";
    grid.appendChild(createOriginalCard(item.id));
    RATIOS.filter((ratio) => ratio.baseline !== false).forEach((ratio) => {
      grid.appendChild(createRatioCard(ratio.label, oursPath(item.id, ratio.key)));
    });
    slide.appendChild(grid);
    track.appendChild(slide);
  });
  setupImageCarousel("result", CASES.length, (index) => {
    currentIndex = index;
    renderBaseline(CASES[index].id);
  });
}

function renderMoreResults() {
  const track = document.getElementById("moreTrack");
  CASES.forEach((item) => {
    const slide = document.createElement("article");
    slide.className = "carousel-slide more-slide";
    slide.appendChild(createOriginalCard(item.id));
    slide.appendChild(createRatioCard("2.39:1", oursPath(item.id, "2.39_1")));
    const tall = createRatioCard("1:4", oursPath(item.id, "1_4"));
    tall.classList.add("more-tall");
    slide.appendChild(tall);
    track.appendChild(slide);
  });
  setupImageCarousel("more", CASES.length);
}

function setupImageCarousel(prefix, count, onSelect = () => {}) {
  const viewport = document.getElementById(`${prefix}Viewport`);
  const slides = [...document.getElementById(`${prefix}Track`).children];
  const dots = document.getElementById(`${prefix}Dots`);
  let index = 0;
  let scrollTimer;
  const update = () => {
    slides.forEach((slide, position) => slide.inert = position !== index);
    [...dots.children].forEach((dot, position) => {
      dot.classList.toggle("active", position === index);
      dot.setAttribute("aria-pressed", String(position === index));
    });
    onSelect(index);
  };
  const select = (next) => {
    index = (next + count) % count;
    viewport.scrollTo({ left: viewport.clientWidth * index,
      behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
    update();
  };
  slides.forEach((slide, position) => {
    slide.setAttribute("aria-label", `Diagram ${position + 1}`);
    slide.setAttribute("aria-roledescription", "slide");
    const dot = document.createElement("button");
    dot.className = "teaser-dot";
    dot.type = "button";
    dot.title = `Diagram ${position + 1}`;
    dot.setAttribute("aria-label", dot.title);
    dot.addEventListener("click", () => select(position));
    dots.appendChild(dot);
  });
  document.getElementById(`${prefix}Prev`).addEventListener("click", () => select(index - 1));
  document.getElementById(`${prefix}Next`).addEventListener("click", () => select(index + 1));
  viewport.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    select(event.key === "Home" ? 0 : event.key === "End" ? count - 1 : index + (event.key === "ArrowRight" ? 1 : -1));
  });
  viewport.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      if (!viewport.clientWidth) return;
      const next = Math.max(0, Math.min(count - 1, Math.round(viewport.scrollLeft / viewport.clientWidth)));
      if (next !== index) { index = next; update(); }
    }, 120);
  }, { passive: true });
  let width = viewport.clientWidth;
  new ResizeObserver(() => {
    if (width === viewport.clientWidth) return;
    width = viewport.clientWidth;
    viewport.scrollTo({ left: width * index, behavior: "instant" });
  }).observe(viewport);
  window.addEventListener("pageshow", () => {
    clearTimeout(scrollTimer);
    index = 0;
    viewport.scrollTo({ left: 0, behavior: "instant" });
    update();
  });
  viewport.scrollTo({ left: 0, behavior: "instant" });
  update();
}

function setupBaselineSelect() {
  renderChoices("baselineTabs", BASELINES.map((baseline) => ({ id: baseline.value, label: baseline.label })), currentBaseline, (id) => {
    currentBaseline = id;
    setupBaselineSelect();
    renderBaseline(CASES[currentIndex].id);
  });
}

function copyBibTeX() {
  const bibtexElement = document.getElementById("bibtex-code");
  const button = document.querySelector(".copy-bibtex-btn");
  const copyText = button.querySelector(".copy-text");
  navigator.clipboard.writeText(bibtexElement.textContent).then(() => {
    button.classList.add("copied");
    copyText.textContent = "Copied";
    setTimeout(() => {
      button.classList.remove("copied");
      copyText.textContent = "Copy";
    }, 1600);
  });
}

function renderChoices(containerId, choices, selectedId, onSelect) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  choices.forEach((choice) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `choice-tab${choice.id === selectedId ? " active" : ""}`;
    button.textContent = choice.label;
    button.setAttribute("aria-pressed", String(choice.id === selectedId));
    button.addEventListener("click", () => {
      onSelect(choice.id);
      [...container.children].find((item) => item.textContent === choice.label)?.focus({ preventScroll: true });
    });
    container.appendChild(button);
  });
}

const RESEARCH_TABLES = {
  benchmark: {
    title: "Quantitative comparison on FlowchartRelayoutBench",
    note: "100 flowcharts, five target aspect ratios. Correctness is a pass rate (%); Layout and Style are average ranks (lower is better). Overall prioritizes Content Fidelity.",
    rows: [
      ["Nano Banana Pro", [49.8, 69.4, 41.4, 2.85, 1.35, 71.10]],
      ["GPT Image 2.0", [50.2, 75.4, 40.2, 3.17, 2.08, 71.10]],
      ["PaperBanana", [38.4, 18.6, 11.2, 2.14, 4.34, 39.05]],
      ["AutoFigure-Edit", [41.8, 41.4, 24.8, 3.63, 4.16, 47.90]],
      ["Ours", [74.2, 90.6, 68.6, 2.66, 2.98, 81.85]]
    ]
  },
  ablation: {
    title: "Quantitative ablation on 30 flowcharts",
    note: "The same 30 flowcharts and evaluation protocol are used for all variants. Layout, Style, and Overall are ranked jointly within this ablation and are not directly comparable with the main benchmark.",
    rows: [
      ["Direct Prompt Parse Stage", [53.3, 60.0, 33.3, 5.00, 7.67, 50.74]],
      ["Direct Prompt Layout Stage", [70.0, 93.3, 66.7, 4.07, 5.03, 69.26]],
      ["Direct VLM-to-XML (Gemini 3.1 Pro)", [43.3, 50.0, 33.3, 5.23, 6.87, 41.11]],
      ["Direct VLM-to-XML (GPT-5.5)", [33.3, 80.0, 30.0, 4.97, 7.77, 49.63]],
      ["w/o All Critic Agents", [60.0, 80.0, 46.7, 4.60, 5.50, 61.85]],
      ["w/o Parse Critic", [73.3, 80.0, 60.0, 4.83, 3.83, 63.33]],
      ["w/o Layout Critic", [66.7, 83.3, 60.0, 4.77, 4.40, 60.00]],
      ["w/o Style Stage", [73.3, 93.3, 70.0, 4.33, 2.53, 76.30]],
      ["w/ Graphviz (DOT) Layout", [43.3, 36.7, 20.0, 6.77, 9.67, 35.19]],
      ["Ours", [76.7, 96.7, 76.7, 3.90, 1.73, 87.04]]
    ]
  }
};

function renderResearchTable(id, config) {
  const headers = [
    ...(config.xml ? [{ label: "XML Fail.", lower: true, decimals: 1 }] : []),
    { label: "Relationship", decimals: 1 },
    { label: "Hallu.-free", decimals: 1 },
    { label: "Content", decimals: 1 },
    { label: "Layout", lower: true, decimals: 2 },
    { label: "Style", lower: true, decimals: 2 },
    { label: "Overall", decimals: config.xml ? 1 : 2 }
  ];
  const ranks = headers.map((header, column) =>
    [...new Set(config.rows.map((row) => row[1][column]))].sort((a, b) => header.lower ? a - b : b - a)
  );
  const container = document.getElementById(id);
  container.className = "table-block";
  container.innerHTML = `
    <p class="table-caption" id="${id}Title">${config.title}</p>
    <p class="table-hint" aria-hidden="true">Swipe sideways to see all metrics &rarr;</p>
    <div class="table-scroll" tabindex="0" role="region" aria-labelledby="${id}Title">
      <table class="research-table" aria-labelledby="${id}Title" aria-describedby="${id}Note">
        <thead>
          <tr class="metric-groups"><th></th>${config.xml ? '<th scope="col">Validity</th>' : ""}<th colspan="3" scope="colgroup">Correctness (%)</th><th colspan="2" scope="colgroup">Visual Quality</th><th scope="col">Score</th></tr>
          <tr><th scope="col">Method</th>${headers.map((header) => `<th scope="col">${header.label} <span aria-label="${header.lower ? "lower is better" : "higher is better"}">${header.lower ? "&darr;" : "&uarr;"}</span></th>`).join("")}</tr>
        </thead>
        <tbody>${config.rows.map(([name, values]) => `
          <tr class="${name.startsWith("Ours") ? "ours-row" : ""}">
            <th scope="row">${name}</th>
            ${values.map((value, column) => {
              const rank = ranks[column].indexOf(value);
              return `<td class="${rank === 0 ? "best" : rank === 1 ? "second" : ""}">${value.toFixed(headers[column].decimals)}</td>`;
            }).join("")}
          </tr>`).join("")}
        </tbody>
      </table>
    </div>
    <div class="table-footnote"><p id="${id}Note">${config.note}</p><div class="table-legend"><span class="best">Best</span><span class="second">Second</span></div></div>
  `;
}

const ABLATIONS = [
  {
    id: "direct_prompt_layout", label: "Direct Prompting", title: "Direct Prompt Layout Stage",
    description: "Direct prompting leaves substantial unused space and excessively shrinks components. Our method uses the available canvas more effectively while preserving component sizes and clear connector flow.",
    images: [["Original", "original.jpeg"], ["Direct Prompt Layout", "gemini-layout.png"], ["Ours", "ours.png"]]
  },
  {
    id: "parse", label: "Parse Critic", title: "Without Parse Critic",
    description: "Without the Parse Critic, incorrect shape types and mismatched connector attachment points remain uncorrected. Iterative feedback improves component geometry and edge anchoring.",
    images: [["Original", "original.jpeg"], ["Without Parse Critic", "wo_critic.png"], ["With Parse Critic", "w_critic.png"]]
  },
  {
    id: "style", label: "Style Stage", title: "Without Style Stage",
    description: "Removing the Style Stage introduces mismatched colors, simplified containers, inconsistent connector styles, and typography differences. Style reconstruction improves visual correspondence while retaining structure.",
    images: [["Original", "original.png"], ["Without Style Stage", "wo_style.png"], ["With Style Stage", "w_style.png"]]
  },
  {
    id: "layout", label: "Layout Critic", title: "Without Layout Critic",
    description: "The single-pass result has weaker space utilization and less natural arrow routing. Deterministic and visual feedback improves placement, compactness, and readability while preserving connectivity.",
    images: [["Original", "original.png"], ["Without Layout Critic", "wo_critic.png"], ["With Layout Critic", "w_critic.png"]]
  },
  {
    id: "graphiz", label: "Graphviz", title: "Replacing Layout Stage with Graphviz DOT",
    description: "Graphviz DOT leaves unused space and can lose relationships involving containers. Our Layout Stage accounts for the target canvas while maintaining those structural relationships.",
    images: [["Original", "original.jpeg"], ["Graphviz DOT", "graphviz.png"], ["Ours", "ours.png"]]
  }
];

function renderFigureComparison(containerId, entries) {
  const container = document.getElementById(containerId);
  container.replaceChildren();
  entries.forEach(([label, src]) => {
    const figure = document.createElement("figure");
    figure.className = "comparison-figure";
    const caption = document.createElement("figcaption");
    caption.textContent = label;
    if (label.startsWith("Ours") || label.startsWith("With ")) figure.classList.add("ours-figure");
    const media = document.createElement("div");
    media.className = "figure-media";
    const img = document.createElement("img");
    img.src = src;
    img.alt = label;
    img.loading = "lazy";
    media.appendChild(img);
    figure.append(caption, media);
    container.appendChild(figure);
  });
}

function renderAblation(id = "direct_prompt_layout") {
  const item = ABLATIONS.find((entry) => entry.id === id);
  const order = ["direct_prompt_layout", "parse", "layout", "style", "graphiz"];
  renderChoices("ablationTabs", order.map((key) => ABLATIONS.find((entry) => entry.id === key)), id, renderAblation);
  document.getElementById("ablationTitle").textContent = item.title;
  document.getElementById("ablationDescription").textContent = item.description;
  renderFigureComparison("ablationGallery", item.images.map(([label, file]) =>
    [label, `static/images/ablation/${item.id}/${file}`]));
}

function renderStyleTransfer(id = "case1") {
  currentStyle = id;
  const original = `static/images/style_transfer/${id}_original.png`;
  const transferred = `static/images/style_transfer/${id}_style_transferred.${id === "case1" ? "jpg" : "png"}`;
  const gallery = document.getElementById("styleGallery");
  gallery.innerHTML = `
    <figure class="style-reference comparison-figure">
      <figcaption>Style Reference</figcaption>
      <div class="figure-media"><img src="static/images/style_transfer/${id}_style_ref.png" alt="Style reference" loading="lazy"></div>
    </figure>
    <figure class="style-comparison">
      <figcaption class="style-labels"><span>Original</span><span class="style-flow-arrow" aria-hidden="true"></span><span>Style Transfer</span></figcaption>
      <div class="before-after" style="--reveal: 8%">
        <img class="before-image" src="${original}" alt="Original diagram" draggable="false">
        <div class="after-layer"><img class="after-image" src="${transferred}" alt="Style-transferred diagram" draggable="false"></div>
        <div class="compare-divider" aria-hidden="true"><span><i class="fas fa-arrows-alt-h"></i></span></div>
        <input class="compare-range" type="range" min="0" max="100" value="8" aria-label="Reveal transferred style" aria-valuetext="8% transferred">
      </div>
    </figure>
  `;
  const dots = document.getElementById("styleDots");
  dots.replaceChildren();
  ["case1", "case2"].forEach((caseId, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "teaser-dot";
    dot.classList.toggle("active", caseId === id);
    dot.title = `Style transfer ${index + 1}`;
    dot.setAttribute("aria-label", dot.title);
    dot.setAttribute("aria-pressed", String(caseId === id));
    dot.addEventListener("click", () => renderStyleTransfer(caseId));
    dots.appendChild(dot);
  });
  const range = gallery.querySelector(".compare-range");
  range.addEventListener("input", () => {
    gallery.querySelector(".before-after").style.setProperty("--reveal", `${range.value}%`);
    gallery.querySelector(".before-image").style.visibility = Number(range.value) === 100 ? "hidden" : "visible";
    gallery.querySelector(".after-layer").style.visibility = Number(range.value) === 0 ? "hidden" : "visible";
    range.setAttribute("aria-valuetext", `${range.value}% transferred`);
  });
}

function setupResearchSections() {
  Object.entries(RESEARCH_TABLES).forEach(([key, config]) => renderResearchTable(`${key}Table`, config));
  renderAblation();
  renderStyleTransfer();
  document.getElementById("stylePrev").addEventListener("click", () => renderStyleTransfer(currentStyle === "case1" ? "case2" : "case1"));
  document.getElementById("styleNext").addEventListener("click", () => renderStyleTransfer(currentStyle === "case1" ? "case2" : "case1"));
  renderMoreResults();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

window.addEventListener("scroll", () => {
  const scrollButton = document.querySelector(".scroll-to-top");
  if (window.scrollY > 360) {
    scrollButton.classList.add("visible");
  } else {
    scrollButton.classList.remove("visible");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  renderTeasers();
  document.getElementById("teaserPrev").addEventListener("click", () => selectTeaser(currentTeaser - 1));
  document.getElementById("teaserNext").addEventListener("click", () => selectTeaser(currentTeaser + 1));
  setupBaselineSelect();
  renderExplorer();
  setupResearchSections();
  let teaserWidth = document.getElementById("teaserViewport").clientWidth;
  new ResizeObserver(() => {
    const viewport = document.getElementById("teaserViewport");
    if (viewport.clientWidth === teaserWidth) return;
    teaserWidth = viewport.clientWidth;
    viewport.scrollTo({ left: teaserWidth * currentTeaser, behavior: "instant" });
  }).observe(document.getElementById("teaserViewport"));
});
