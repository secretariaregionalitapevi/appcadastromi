(function () {
  // Lista inicial de comuns (pode ser ampliada mantendo o mesmo formato)
  const comuns = [
    "BR-21-0797 - JABOTICABEIRA",
    "BR-21-0819 - ALTO DO PAULISTA",
    "BR-21-0840 - ALTO DO BOA VISTA",
    "BR-21-0983 - CIDADE SAO PEDRO - GLEBA B",
    "BR-21-0995 - POR DO SOL",
    "BR-21-1019 - ALTOS DE CAUCAIA",
    "BR-21-1020 - NHAMBUCA",
    "BR-21-1039 - CENTRAL DE ITAPEVI",
    "BR-21-1051 - CRISTAL PARK II",
    "BR-21-1124 - SITIO DO ROSARIO",
    "BR-21-1221 - ALPHAVILLE",
    "BR-21-1303 - CAPELA VELHA - SDRU",
    "BR-21-1310 - PARQUE SINAI",
    "BR-21-1311 - VILA UNARDO",
    "BR-21-1312 - SITIO JOSE TEIXEIRA",
    "BR-21-1317 - CHACARA RECANTO VERDE",
    "BR-21-1350 - SÃO LUIZ",
    "BR-21-1481 - JARDIM NOVA COTIA",
    "BR-21-1488 - JARDIM SÃO LUIZ",
    "BR-21-1527 - CRISTAL PARK IV",
    "BR-21-1528 - PARQUE PAIOL II",
    "BR-21-1529 - CIDADE SÃO PEDRO - GLEBA C",
    "BR-21-1542 - VILA BELMIRA",
    "BR-22-0072 - FAZENDINHA - STNA DE PARNAÍBA",
    "BR-22-0273 - JAGUARI",
    "BR-22-0413 - CENTRAL DE COTIA",
    "BR-22-0414 - MORRO GRANDE",
    "BR-22-0415 - CAPUTERA",
    "BR-22-0416 - MOINHO VELHO",
    "BR-22-0417 - PORTÃO VERMELHO",
    "BR-22-0418 - GRANJA VIANA",
    "BR-22-0420 - TUCURUVI",
    "BR-22-0421 - VILA ATALAIA",
    "BR-22-0422 - JARDIM PINHEIRO",
    "BR-22-0423 - CENTRAL DE CAUCAIA",
    "BR-22-0424 - PEDRAS (CHACARA SANTA MARIA)",
    "BR-22-0425 - JARDIM RIO COTIA",
    "BR-22-0426 - VILA SÃO ROQUE",
    "BR-22-0427 - JARDIM MARGARIDA",
    "BR-22-0428 - JARDIM DOS IPÊS",
    "BR-22-0429 - CHÁCARA SANTA MÔNICA",
    "BR-22-0430 - ROSELÂNDIA",
    "BR-22-0431 - JARDIM PANORAMA",
    "BR-22-0432 - PEREIRAS",
    "BR-22-0671 - NOVA ITAPEVI",
    "BR-22-0672 - JARDIM SOROCABANA",
    "BR-22-0673 - VILA DOUTOR CARDOSO",
    "BR-22-0674 - JARDIM GIÓIA",
    "BR-22-0675 - JARDIM PAULISTA - ITAPEVI",
    "BR-22-0676 - CURURUQUARA",
    "BR-22-0677 - CHÁCARA NOSSA SENHORA APARECIDINHA",
    "BR-22-0678 - JARDIM ALVORADA",
    "BR-22-0679 - JARDIM BELA VISTA - ITAPEVI",
    "BR-22-0680 - AMBUITÁ",
    "BR-22-0681 - AMADOR BUENO",
    "BR-22-0683 - JARDIM ROSEMARY",
    "BR-22-0684 - JARDIM SANTA RITA - ITAPEVI",
    "BR-22-0748 - JANDIRA - CENTRAL",
    "BR-22-0749 - SAGRADO CORAÇÃO",
    "BR-22-0750 - PARQUE SANTA TEREZA - JANDIRA",
    "BR-22-1074 - NOVA PIRAPORA",
    "BR-22-1251 - CENTRAL DE SANTANA DE PARNAÍBA",
    "BR-22-1252 - JARDIM ISAURA",
    "BR-22-1599 - JARDIM BOA ESPERANÇA",
    "BR-22-1574 - JARDIM COTIA",
    "BR-22-1581 - JARDIM OURO VERDE",
    "BR-22-1596 - ÁGUA ESPRAIADA",
    "BR-22-1598 - JARDIM DO ENGENHO",
    "BR-22-1622 - ARACAS",
    "BR-22-1653 - MONTE SERRAT",
    "BR-22-1656 - JARDIM SANTA IZABEL",
    "BR-22-1660 - JARDIM GABRIELA",
    "BR-22-1660 - RECANTO PAULISTANO",
    "BR-22-1668 - AGUASSAÍ",
    "BR-22-1609 - PARQUE ALEXANDRE",
    "BR-22-1676 - CAPELINHA",
    "BR-22-1705 - JARDIM JUREMA",
    "BR-22-1706 - VITAPOLIS I",
    "BR-22-1707 - SÃO JUDAS TADEU",
    "BR-22-1708 - VILA EUNICE",
    "BR-22-1722 - PORTAL DA PRIMAVERA",
    "BR-22-1739 - JARDIM MIRANDA",
    "BR-22-1768 - VILA ARCÁDIA",
    "BR-22-1802 - JARDIM PETRÓPOLIS",
    "BR-22-1803 - JARDIM SÃO MATEUS",
    "BR-22-1804 - JARDIM LAVARÉS DAS GRAÇAS",
    "BR-22-1806 - ITAQUARA PARQUE",
    "BR-22-1808 - JARDIM VALE DO SOL",
    "BR-22-1810 - JARDIM CRUZEIRO",
    "BR-22-1815 - SÍTIO TABULEIRO",
    "BR-22-1828 - JARDIM MARÍLIA",
    "BR-22-1891 - PARQUE MUNIZ MIZROLA",
    "BR-22-1892 - VILA BELIZÁRIO",
    "BR-22-1894 - SÍTIO TAQUARAL",
    "BR-22-1899 - JARDIM MONTE VERDE",
    "BR-22-1901 - JARDIM SAMAMBAIA",
    "BR-22-1902 - JARDIM DAS OLIVEIRAS",
    "BR-22-1955 - JARDIM SANDRA",
    "BR-22-1956 - JARDIM HONÓRIA",
    "BR-22-1950 - VILA SANTA RITA",
    "BR-22-2064 - CHÁCARA REGINA",
    "BR-22-2076 - JARDIM ITAPUÃ - ITAPEVI",
    "BR-22-2093 - ALTO DA COLINA - COHAB",
    "BR-22-2228 - JARDIM SÃO CARLOS",
    "BR-22-2236 - JARDIM SÃO MARCOS",
    "BR-22-2235 - JARDIM MARINGÁ",
    "BR-22-2292 - PARQUE SUBURBANO I",
    "BR-22-2294 - JARDIM SANTA CECÍLIA",
    "BR-22-2297 - CIDADE DA MELÔ",
    "BR-22-2313 - VILA GODINHO",
    "BR-22-2374 - CIDADE SÃO PEDRO - GLEBA A",
    "BR-22-2441 - JARDIM MURAKAMIO",
    "BR-22-2466 - SÍTIO JULINHO",
    "BR-22-2512 - JARDIM DA RAINHA",
    "BR-22-2521 - COLINAS DA ANHANGUERA",
    "BR-22-2567 - PARQUE SANTANA II",
    "BR-22-2594 - JARDIM NOVO HORIZONTE",
    "BR-22-2590 - MENDES",
    "BR-22-2596 - JARDIM NOVA AMADOR BUENO",
    "BR-22-2659 - PARQUE MIRANTE DA MATA",
    "BR-22-2722 - GERMANO",
    "BR-22-2797 - LAGEDO",
    "BR-22-2798 - PARQUE DO AGRESTE",
    "BR-22-2833 - PARQUE SANTANA I",
    "BR-22-2873 - PARQUE DO LAGO",
    "BR-22-2931 - JARDIM MASE",
    "BR-22-2934 - PARQUE SUBURBANO II",
    "BR-22-2935 - JARDIM GABRIELA I",
    "BR-22-2936 - REFÚGIO DOS BANDEIRANTES",
    "BR-22-2955 - JARDIM BOM JESUS",
    "BR-22-2956 - PARQUE PAJÓ",
    "BR-22-2959 - VILA DAS CHÁCARAS",
    "BR-22-3030 - RESSACA",
    "BR-22-3031 - HORIZONTAL PARK",
    "BR-22-3033 - CHÁCARA SANTA CECÍLIA",
    "BR-22-3034 - JARDIM SÃO JOÃO - LAGO DOS CISNES",
    "BR-22-3050 - JARDIM ROSEMARY II",
    "BR-22-3051 - VILA HOUM",
    "BR-22-3061 - JARDIM RUTH",
    "BR-22-3062 - JARDIM ALABAMA",
    "BR-22-3129 - PARQUE SUBURBANO III",
    "BR-22-3132 - JARDIM ITAPUÃ - STNA DE PARNAÍBA",
    "BR-22-3157 - PARQUE IGLESIAS",
    "BR-22-3168 - NARITA GARDEN",
    "BR-22-3179 - JARDIM ITAPARICA",
    "BR-22-3193 - DOROLES PASCHOALIM",
    "BR-22-3206 - JARDIM SANTA RITA II",
    "BR-22-3250 - RESIDENCIAL DAS FLORES",
    "BR-22-3270 - JARDIM STELA MARIS",
    "BR-22-3261 - JARDIM ANTÔNIO PORTO",
    "BR-22-3270 - JARDIM ITACOLOMI",
    "BR-22-3271 - JARDIM ARRAIALMA",
    "BR-22-3274 - VILA NOVA ESPERANÇA",
    "BR-22-3293 - JARDIM JAPÃO",
    "BR-22-3283 - JARDIM SÃO MIGUEL",
    "BR-22-3289 - SÍTIO GUARAPIRANGA",
    "BR-22-3366 - CHÁCARAS DAS GARÇAS",
    "BR-22-3376 - JARDIM PRIMAVERA - COTIA",
    "BR-22-3396 - MORADAS SANTA FÉ",
    "BR-22-3489 - INFANT'S GARDEN",
    "BR-22-3510 - SÃO JOÃO",
    "BR-22-3583 - PARQUE SUBURBANO IV",
    "BR-22-3628 - VILA ESMERALDA",
    "BR-22-3645 - VITÁPOLIS II",
    "BR-22-3601 - VALE DO SUL - ITAPEVI",
    "BR-22-3714 - JARDIM BARRO BRANCO",
    "BR-22-3754 - GRANJA ALVORADA",
    "BR-22-3756 - MONTE SERRAT II",
    "BR-22-3757 - RECANTO MARAVILHA II",
    "BR-22-3789 - PAISAGEM CASA GRANDE",
    "BR-22-3865 - JARDIM BANDEIRANTES",
    "BR-22-3908 - RECANTO VISTA ALEGRE",
    "BR-22-3911 - JARDIM BELA VISTA - PUNUNDUVA",
    "BR-22-3950 - SÍTIO LAGEADO",
    "BR-22-3951 - PARQUE ALVORADA",
    "BR-22-4006 - PORTAL DO QUILOMBO",
    "BR-22-4057 - UTHI MAIRIA",
    "BR-22-4116 - JARDIM EUROPA",
    "BR-22-4057 - BAIRRO 120",
    "BR-21-1563 - CURURUQUARA III",
    "BR-21-1588 - COLINAS DA ANHAGUERA II",
    "BR-21-1564 - CHÁCARA SOLARI I",
    "BR-21-1272 - REFÚGIO DOS BANDEIRANTES"
  ];

  const unique = Array.from(new Set(comuns.map((item) => item.trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );

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

  function normalize(text) {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function escapeHtml(text) {
    return text
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
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

  function filterComuns(query) {
    const q = normalize(query.trim());
    if (!q) return unique.slice(0, 18);

    return unique
      .filter((item) => normalize(item).includes(q))
      .slice(0, 40);
  }

  function render() {
    results.innerHTML = "";

    if (!filtered.length) {
      const li = document.createElement("li");
      li.textContent = "Nenhuma comum encontrada.";
      li.style.cursor = "default";
      results.appendChild(li);
      hint.textContent = "Tente outro trecho. Exemplo: car, ita, vila, jardim.";
      activeIndex = -1;
      return;
    }

    const fragment = document.createDocumentFragment();
    filtered.forEach((item, index) => {
      const li = document.createElement("li");
      li.innerHTML = highlightMatch(item, searchInput.value);
      if (index === activeIndex) li.classList.add("is-active");
      li.addEventListener("click", () => select(item));
      fragment.appendChild(li);
    });
    results.appendChild(fragment);
    hint.textContent = `${filtered.length} resultado(s). Enter para selecionar.`;

    const activeEl = results.querySelector(".is-active");
    if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
  }

  function openModal(field) {
    currentField = field;
    searchInput.value = field.value || "";
    filtered = filterComuns(searchInput.value);
    activeIndex = filtered.length ? 0 : -1;
    render();
    modal.classList.remove("hidden");
    setTimeout(() => searchInput.focus(), 0);
  }

  function closeModal() {
    modal.classList.add("hidden");
    currentField = null;
    filtered = [];
    activeIndex = -1;
  }

  function select(value) {
    if (!currentField) return;
    currentField.value = value;
    currentField.dispatchEvent(new Event("input", { bubbles: true }));
    currentField.dispatchEvent(new Event("change", { bubbles: true }));
    closeModal();
  }

  fields.forEach((field) => {
    field.setAttribute("readonly", "readonly");
    field.addEventListener("focus", () => openModal(field));
    field.addEventListener("click", () => openModal(field));
  });

  searchInput.addEventListener("input", () => {
    filtered = filterComuns(searchInput.value);
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
})();
