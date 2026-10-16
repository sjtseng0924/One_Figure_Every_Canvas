/* Editable results: an "Edit in draw.io" button on every figure that has a sibling .xml,
   which opens that diagram in the embedded draw.io editor (embed mode, JSON protocol). */
(() => {
  "use strict";
  const ORIGIN = "https://embed.diagrams.net";
  const EDITOR_URL = `${ORIGIN}/?embed=1&proto=json&spin=1&ui=min&libraries=1&noSaveBtn=1&noExitBtn=1&saveAndExit=0&lang=en`;
  const section = document.getElementById("playground");
  const host = document.getElementById("drawioHost");
  const placeholder = document.getElementById("drawioStatus");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const state = { frame: null, ready: false, pending: null, loading: null };

  const xmlPathFor = (imagePath) => imagePath.replace(/\.(png|jpe?g)$/i, ".xml");
  const showMessage = (text) => { placeholder.textContent = text; placeholder.hidden = false; };

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
    host.appendChild(frame);
    state.frame = frame;
  }

  function post(message) {
    state.frame.contentWindow.postMessage(JSON.stringify(message), ORIGIN);
  }

  function showDocument(xml) {
    if (!state.ready) { state.pending = xml; ensureEditor(); return; }
    state.pending = null;
    post({ action: "load", xml, title: "diagram.drawio" });
  }

  async function openDiagram(url) {
    section.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    ensureEditor();
    state.loading = url;
    showMessage("Loading diagram…");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(String(response.status));
      const xml = absolutizeImages(await response.text(), url);
      if (state.loading === url) showDocument(xml);
    } catch {
      if (state.loading === url) showMessage("Could not load this diagram.");
    } finally {
      if (state.loading === url) state.loading = null;
    }
  }

  // Public: called by index.js for each of our result figures. The button appears only when the XML exists.
  window.attachDrawioEdit = (media, imagePath) => {
    const url = xmlPathFor(imagePath);
    fetch(url, { method: "HEAD", cache: "no-cache" }).then((response) => response.ok).catch(() => false).then((ok) => {
      if (!ok) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "drawio-edit";
      button.title = "Edit in draw.io";
      button.setAttribute("aria-label", "Edit this result in draw.io");
      button.innerHTML = '<i class="fas fa-edit" aria-hidden="true"></i><span>Edit in draw.io</span>';
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        openDiagram(url);
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
    }
    if (message.event === "load") placeholder.hidden = true;
  });

  // The editor is a few MB; warm it up only once the section is close to the viewport.
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
