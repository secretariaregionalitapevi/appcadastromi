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

  async function showSuccessModal() {
    if (!window.Swal) {
      window.alert("Cadastro enviado com sucesso.");
      return;
    }

    await window.Swal.fire({
      title: "Cadastro enviado!",
      text: "Dados enviados com sucesso.",
      icon: "success",
      confirmButtonText: "OK",
      timer: 4000,
      timerProgressBar: true
    });
  }

  async function showErrorModal(message) {
    if (!window.Swal) {
      window.alert(message);
      return;
    }

    await window.Swal.fire({
      title: "Erro ao enviar",
      text: message,
      icon: "error",
      confirmButtonText: "OK"
    });
  }

  async function showDuplicateModal(duplicate) {
    const nome = duplicate?.nome || "Cadastro";
    const comum = duplicate?.comum || "Comum não informada";
    const data = duplicate?.date || "--/--/----";
    const hora = duplicate?.time || "--:--:--";

    if (!window.Swal) {
      return window.confirm(`${nome} já possui cadastro. Deseja cadastrar mesmo assim?`);
    }

    const html = `
      <div style="text-align:left;max-width:340px;margin:0 auto;">
        <p style="margin:0 0 8px;"><strong>${nome}</strong><br/>de <strong>${comum}</strong><br/>já possui cadastro!</p>
        <p style="margin:0;color:#4b5563;">Data: ${data}<br/>Horário: ${hora}</p>
      </div>
    `;

    const result = await window.Swal.fire({
      title: "Cadastro Duplicado!",
      html,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Cadastrar Mesmo Assim",
      cancelButtonText: "Cancelar"
    });

    return result.isConfirmed;
  }

  async function submitForm(formEl, endpoint, btnEl, options = {}) {
    const { allowDuplicate = false } = options;
    btnEl.disabled = true;
    const payload = formToJSON(formEl);
    const requestBody = allowDuplicate ? { ...payload, _allowDuplicate: true } : payload;

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody)
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 && data?.duplicate) {
          const proceed = await showDuplicateModal(data.duplicate);
          if (proceed) {
            await submitForm(formEl, endpoint, btnEl, { allowDuplicate: true });
          }
          return;
        }

        const msg = data?.error ? `${data.error}` : `Erro ao enviar (${res.status}).`;
        await showErrorModal(msg);
        return;
      }

      await showSuccessModal();
      formEl.reset();
    } catch {
      await showErrorModal("Falha de conexão com o servidor.");
    } finally {
      btnEl.disabled = false;
    }
  }

  btnCrianca.addEventListener("click", () => show("crianca"));
  btnMonitor.addEventListener("click", () => show("monitor"));

  formCrianca.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnEnviarCrianca");
    await submitForm(formCrianca, "/api/cadastros/crianca", btn);
  });

  formMonitor.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = document.getElementById("btnEnviarMonitor");
    await submitForm(formMonitor, "/api/cadastros/monitor", btn);
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
