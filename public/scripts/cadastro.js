(function () {
  const btnCrianca = document.getElementById("btnCrianca");
  const btnMonitor = document.getElementById("btnMonitor");
  const formCrianca = document.getElementById("formCrianca");
  const formMonitor = document.getElementById("formMonitor");
  const cadastroTitulo = document.getElementById("cadastroTitulo");
  const cadastroSubtitulo = document.getElementById("cadastroSubtitulo");
  const cadastroPicker = document.getElementById("cadastroPicker");

  function show(tipo) {
    const isCrianca = tipo === "crianca";
    formCrianca.classList.toggle("hidden", !isCrianca);
    formMonitor.classList.toggle("hidden", isCrianca);
    btnCrianca.classList.toggle("active", isCrianca);
    btnMonitor.classList.toggle("active", !isCrianca);

    const url = new URL(window.location.href);
    url.searchParams.set("tipo", tipo);
    window.history.replaceState({}, "", url);
  }

  function setStatus(el, msg, type) {
    el.textContent = msg;
    el.classList.remove("ok", "err");
    if (type) el.classList.add(type);
  }

  function formToJSON(formEl) {
    const fd = new FormData(formEl);
    const obj = {};

    for (const [k, v] of fd.entries()) {
      if (obj[k] !== undefined) {
        if (!Array.isArray(obj[k])) obj[k] = [obj[k]];
        obj[k].push((v ?? "").toString().trim());
      } else {
        obj[k] = (v ?? "").toString().trim();
      }
    }

    const checkboxNames = ["de_acordo_voluntario", "autoriza_tratamento_dados"];
    checkboxNames.forEach((n) => {
      if (obj[n] === undefined) obj[n] = "";
    });

    return obj;
  }

  async function submitForm(formEl, endpoint, statusEl) {
    setStatus(statusEl, "Enviando...");
    const payload = formToJSON(formEl);

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data?.error ? `${data.error}` : `Erro ao enviar (${res.status}).`;
        setStatus(statusEl, msg, "err");
        return;
      }

      const webhookInfo = data.forwarded ? " Webhook recebido." : " Salvo localmente.";
      setStatus(statusEl, "Cadastro enviado com sucesso." + webhookInfo, "ok");
      formEl.reset();
    } catch {
      setStatus(statusEl, "Falha de conexão com o servidor.", "err");
    }
  }

  btnCrianca.addEventListener("click", () => show("crianca"));
  btnMonitor.addEventListener("click", () => show("monitor"));

  formCrianca.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("statusCrianca");
    const btn = document.getElementById("btnEnviarCrianca");
    btn.disabled = true;
    await submitForm(formCrianca, "/api/cadastros/crianca", status);
    btn.disabled = false;
  });

  formMonitor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const status = document.getElementById("statusMonitor");
    const btn = document.getElementById("btnEnviarMonitor");
    btn.disabled = true;
    await submitForm(formMonitor, "/api/cadastros/monitor", status);
    btn.disabled = false;
  });

  const searchTipo = new URLSearchParams(window.location.search).get("tipo");
  const path = window.location.pathname.toLowerCase();
  const pathTipo = path.endsWith("/monitor") ? "monitor" : path.endsWith("/crianca") ? "crianca" : null;
  const tipoSelecionado = pathTipo || searchTipo;

  if (pathTipo) {
    show(pathTipo);
    cadastroPicker.classList.add("hidden");
    if (pathTipo === "crianca") {
      cadastroTitulo.textContent = "Cadastro de Criança";
      cadastroSubtitulo.textContent = "Preencha os dados para o cadastro da criança.";
    } else {
      cadastroTitulo.textContent = "Cadastro de Monitor";
      cadastroSubtitulo.textContent = "Preencha os dados para o cadastro do monitor.";
    }
    return;
  }

  show(tipoSelecionado === "monitor" ? "monitor" : "crianca");
})();
