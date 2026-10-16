/* Editable results: an "Edit in draw.io" button on every figure that has a sibling .xml,
   and an embedded draw.io editor (embed mode, JSON protocol) to open them in. */
(() => {
  "use strict";
  const ORIGIN = "https://embed.diagrams.net";
  const EDITOR_URL = `${ORIGIN}/?embed=1&proto=json&spin=1&ui=min&libraries=1&noSaveBtn=1&noExitBtn=1&saveAndExit=0&lang=en`;
  const section = document.getElementById("playground");
  const host = document.getElementById("drawioHost");
  const select = document.getElementById("drawioSample");
  const upload = document.getElementById("drawioUpload");
  const downloadButton = document.getElementById("drawioDownload");
  const fullscreenButton = document.getElementById("drawioFullscreen");
  const status = document.getElementById("drawioStatus");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const probes = new Map();
  const state = { frame: null, ready: false, pending: null, loading: null, current: null, xml: "", samples: [], unsettled: 0 };
  let order = 0;

  const xmlPathFor = (imagePath) => imagePath.replace(/\.(png|jpe?g)$/i, ".xml");
  const setStatus = (text) => { status.textContent = text; };

  function hasXml(url) {
    if (!probes.has(url)) {
      probes.set(url, fetch(url, { method: "HEAD", cache: "no-cache" }).then((response) => response.ok).catch(() => false));
    }
    return probes.get(url);
  }

  // Relative image paths inside a diagram must become absolute, since the editor runs on another origin.
  function absolutizeImages(xml, base) {
    const root = new URL(base, location.href);
    if (root.protocol === "file:") return xml;
    return xml.replace(/image=([^;"&]+)/g, (match, path) =>
      /^(data:|https?:)/.test(path) ? match : `image=${new URL(path, root).href}`);
  }

  function ensureEditor() {
    if (state.frame) return;
    const frame = document.createElement("iframe");
    frame.className = "drawio-frame";
    frame.src = EDITOR_URL;
    frame.title = "draw.io diagram editor";
    frame.allow = "clipboard-read; clipboard-write";
    // diagrams.net refuses embeds whose referrer is a local origin; sending none keeps local previews working.
    frame.referrerPolicy = "no-referrer";
    host.replaceChildren(frame);
    state.frame = frame;
    setStatus("Starting draw.io…");
  }

  function post(message) {
    state.frame.contentWindow.postMessage(JSON.stringify(message), ORIGIN);
  }

  function showDocument(doc) {
    state.current = doc;
    state.xml = doc.xml;
    downloadButton.disabled = false;
    syncSelect();
    setStatus(`Editing: ${doc.label}`);
    if (!state.ready) { state.pending = doc; ensureEditor(); return; }
    state.pending = null;
    post({ action: "load", xml: doc.xml, autosave: 1, title: doc.file });
  }

  async function openSample(sample, scroll = true) {
    if (scroll) section.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    ensureEditor();
    state.loading = sample.url;
    setStatus(`Loading ${sample.label}…`);
    try {
      const response = await fetch(sample.url);
      if (!response.ok) throw new Error(String(response.status));
      const xml = absolutizeImages(await response.text(), sample.url);
      if (state.loading === sample.url) showDocument({ ...sample, file: sample.url.split("/").pop(), xml });
    } catch {
      if (state.loading === sample.url) setStatus(`Could not load ${sample.label}.`);
    } finally {
      if (state.loading === sample.url) state.loading = null;
    }
  }

  function syncSelect() {
    if (!state.samples.length) return;
    select.value = state.current?.url ?? "";
    if (!state.current?.url) select.selectedIndex = -1;
  }

  function renderSamples() {
    if (!state.samples.length) {
      if (!state.unsettled) select.replaceChildren(new Option("No example diagrams available"));
      return;
    }
    const groups = new Map();
    state.samples.forEach((sample) => {
      if (!groups.has(sample.group)) groups.set(sample.group, []);
      groups.get(sample.group).push(sample);
    });
    select.replaceChildren(...[...groups].map(([name, items]) => {
      const group = document.createElement("optgroup");
      group.label = name;
      items.forEach((sample) => group.append(new Option(sample.label, sample.url)));
      return group;
    }));
    select.disabled = false;
    syncSelect();
  }

  function registerSample(sample) {
    if (state.samples.some((item) => item.url === sample.url)) return;
    state.samples.push(sample);
    state.samples.sort((a, b) => a.order - b.order);
    renderSamples();
    if (state.ready && !state.current && !state.pending && !state.loading) openSample(state.samples[0], false);
  }

  // Public: called by index.js for each result figure. The button appears only when the XML exists.
  window.attachDrawioEdit = (media, imagePath, label, group) => {
    const sample = { url: xmlPathFor(imagePath), label, group, order: order++ };
    state.unsettled += 1;
    hasXml(sample.url).then((ok) => {
      state.unsettled -= 1;
      if (!ok) { renderSamples(); return; }
      registerSample(sample);
      const button = document.createElement("button");
      button.type = "button";
      button.className = "drawio-edit";
      button.title = "Edit in draw.io";
      button.setAttribute("aria-label", `Edit ${label} in draw.io`);
      button.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i><span>Edit in draw.io</span>';
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openSample(sample);
      });
      media.classList.add("has-drawio");
      media.appendChild(button);
    });
  };

  window.addEventListener("message", (event) => {
    if (!state.frame || event.source !== state.frame.contentWindow || event.origin !== ORIGIN) return;
    let message;
    try { message = JSON.parse(event.data); } catch { return; }
    if (message.event === "init") {
      state.ready = true;
      if (state.pending) showDocument(state.pending);
      else if (state.samples.length && !state.loading) openSample(state.samples[0], false);
      else if (!state.loading) {
        post({ action: "load", xml: "", autosave: 1 });
        setStatus("Load a .drawio or .xml file to start.");
      }
    }
    if ((message.event === "autosave" || message.event === "save") && state.current) state.xml = message.xml;
  });

  select.addEventListener("change", () => {
    const sample = state.samples.find((item) => item.url === select.value);
    if (sample) openSample(sample, false);
  });

  document.getElementById("drawioUploadButton").addEventListener("click", () => upload.click());
  upload.addEventListener("change", async () => {
    const file = upload.files[0];
    upload.value = "";
    if (!file) return;
    const xml = await file.text();
    if (!/<mxfile|<mxGraphModel/.test(xml)) { setStatus(`${file.name} is not a draw.io diagram.`); return; }
    state.loading = null;
    showDocument({ label: file.name, file: file.name, xml });
  });

  downloadButton.addEventListener("click", () => {
    if (!state.current) return;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([state.xml], { type: "application/xml" }));
    link.download = `${state.current.file.replace(/\.(xml|drawio)$/i, "")}.drawio`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  });

  if (document.fullscreenEnabled) {
    fullscreenButton.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else host.requestFullscreen();
    });
  } else {
    fullscreenButton.hidden = true;
  }

  // The editor is a few MB; start it only once the section is close to the viewport.
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      ensureEditor();
    }, { rootMargin: "600px 0px" });
    observer.observe(section);
  } else {
    ensureEditor();
  }
})();
