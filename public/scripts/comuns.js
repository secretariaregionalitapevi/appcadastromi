(function () {
  const fallbackCatalog = [];
  const fields = Array.from(document.querySelectorAll(".comum-field"));
  const modal = document.getElementById("comumModal");
  const closeBtn = document.getElementById("comumModalClose");
  const searchInput = document.getElementById("comumSearchInput");
  const results = document.getElementById("comumResults");
  const hint = document.getElementById("comumHint");

  if (!fields.length || !modal || !closeBtn || !searchInput || !results || !hint) return;

  let currentField = null;
  let filtered = [];
  let activeIndex = -1;
  let catalog = fallbackCatalog.slice();
  let catalogLoaded = false;
  let loadingCatalog = null;

  function normalize(text) {
    return String(text || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function escapeHtml(text) {
    return String(text || "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function normalizeCatalogItem(item) {
    const comum = String(item?.comum || item?.nome || item?.name || "").trim();
    const cidade = String(item?.cidade || item?.municipio || item?.localidade || "").trim();
    if (!comum) return null;
    return { comum, cidade };
  }

  async function ensureCatalog() {
    if (catalogLoaded) return catalog;
    if (loadingCatalog) return loadingCatalog;

    loadingCatalog = fetch("/api/comuns", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("catalog_fetch_failed");
        return response.json();
      })
      .then((data) => {
        const uniqueMap = new Map();
        (Array.isArray(data) ? data : [])
          .map(normalizeCatalogItem)
          .filter(Boolean)
          .forEach((item) => {
            const key = normalize(item.comum);
            if (!uniqueMap.has(key)) uniqueMap.set(key, item);
          });

        const loadedCatalog = Array.from(uniqueMap.values()).sort((a, b) =>
          a.comum.localeCompare(b.comum, "pt-BR", { sensitivity: "base" })
        );

        if (loadedCatalog.length) {
          catalog = loadedCatalog;
        }
        catalogLoaded = true;
        return catalog;
      })
      .catch(() => {
        catalogLoaded = true;
        return catalog;
      })
      .finally(() => {
        loadingCatalog = null;
      });

    return loadingCatalog;
  }

  function highlightMatch(text, query) {
    const q = query.trim();
    if (!q) return escapeHtml(text);

    const normalizedText = normalize(text);
    const normalizedQuery = normalize(q);
    const start = normalizedText.indexOf(normalizedQuery);
    if (start < 0) return escapeHtml(text);

    const end = start + normalizedQuery.length;
    const before = escapeHtml(text.slice(0, start));
    const match = escapeHtml(text.slice(start, end));
    const after = escapeHtml(text.slice(end));
    return `${before}<mark>${match}</mark>${after}`;
  }

  function filterCatalog(query) {
    const q = normalize(query);
    const source = Array.isArray(catalog) ? catalog : [];
    if (!q) return source.slice(0, 18);

    return source
      .filter((item) => normalize(item.comum).includes(q) || normalize(item.cidade).includes(q))
      .slice(0, 40);
  }

  function render() {
    results.innerHTML = "";

    if (!filtered.length) {
      const li = document.createElement("li");
      li.textContent = catalogLoaded ? "Nenhuma comum encontrada." : "Carregando comuns...";
      li.style.cursor = "default";
      results.appendChild(li);
      hint.textContent = catalogLoaded
        ? "Tente outro trecho. Exemplo: car, ita, vila, jardim."
        : "Consultando a tabela oficial de comuns...";
      activeIndex = -1;
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = `${highlightMatch(item.comum, searchInput.value)}${item.cidade ? `<br><small>${escapeHtml(item.cidade)}</small>` : ""}`;
      if (index === activeIndex) li.classList.add("is-active");
      li.addEventListener("click", () => select(item));
      fragment.appendChild(li);
    });
    results.appendChild(fragment);
    hint.textContent = `${filtered.length} resultado(s). Enter para selecionar.`;

    const activeEl = results.querySelector(".is-active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }

  async function openModal(field) {
    currentField = field;
    searchInput.value = field.value || "";
    filtered = [];
    activeIndex = -1;
    render();
    modal.classList.remove("hidden");
    setTimeout(() => searchInput.focus(), 0);

    await ensureCatalog();
    filtered = filterCatalog(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    render();
  }

  function closeModal() {
    modal.classList.add("hidden");
    currentField = null;
    filtered = [];
    activeIndex = -1;
  }

  function updateRelatedCityField(field, cidade) {
    const form = field?.form;
    if (!form || !cidade) return;
    const cityField = form.querySelector('[name="cidade"]');
    if (!cityField) return;
    cityField.value = cidade;
    cityField.dispatchEvent(new Event("input", { bubbles: true }));
    cityField.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function select(item) {
    if (!currentField || !item) return;
    currentField.value = item.comum;
    currentField.dispatchEvent(new Event("input", { bubbles: true }));
    currentField.dispatchEvent(new Event("change", { bubbles: true }));
    updateRelatedCityField(currentField, item.cidade);
    closeModal();
  }

  fields.forEach((field) => {
    field.setAttribute("readonly", "readonly");
    field.addEventListener("focus", () => openModal(field));
    field.addEventListener("click", () => openModal(field));
  });

  searchInput.addEventListener("input", () => {
    filtered = filterCatalog(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    render();
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!filtered.length) return;
      activeIndex = Math.min(activeIndex + 1, filtered.length - 1);
      render();
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!filtered.length) return;
      activeIndex = Math.max(activeIndex - 1, 0);
      render();
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      if (filtered.length && activeIndex >= 0) select(filtered[activeIndex]);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
    }
  });

  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target.dataset.closeComumModal === "true") closeModal();
  });

  ensureCatalog().then(() => {
    filtered = filterCatalog("");
    activeIndex = filtered.length ? 0 : -1;
  });
})();
