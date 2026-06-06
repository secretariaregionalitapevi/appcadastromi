(function () {
  const btnCrianca = document.getElementById("btnCrianca");
  const btnMonitor = document.getElementById("btnMonitor");
  const formCrianca = document.getElementById("formCrianca");
  const formMonitor = document.getElementById("formMonitor");
  const cadastroTitulo = document.getElementById("cadastroTitulo");
  const cadastroSubtitulo = document.getElementById("cadastroSubtitulo");
  const cadastroPicker = document.getElementById("cadastroPicker");
  let POLOS_OBJ = [];

  async function fetchPolos() {
    try {
      const res = await fetch("/api/polos");
      if (res.ok) {
        const data = await res.json();
        POLOS_OBJ = (Array.isArray(data) ? data : []).map(item => ({
          nome: String(item.polo || item.nome || item.name || "").trim(),
          cidade: String(item.cidade || item.municipio || item.localidade || "").trim()
        })).filter(p => p.nome && p.cidade).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
        
        const cidadeEl = document.querySelector('input[name="cidade"]');
        if (cidadeEl) hydratePoloSelects(cidadeEl.value);
        else hydratePoloSelects();
      }
    } catch (err) {
      console.error("Erro ao buscar polos:", err);
    }
  }

  fetchPolos();
  const poloParticipacaoSelect = document.querySelector('select[name="polo_participacao"]');
  const poloAuxilioSelect = document.querySelector('select[name="polo_auxilio"]');

  function hydratePoloSelect(selectEl, cidadeFiltro) {
    if (!selectEl) return;
    const selectedValue = (selectEl.value || "").trim();
    selectEl.innerHTML = "";

    const placeholderOption = document.createElement("option");
    placeholderOption.value = "";
    placeholderOption.textContent = "Selecione";
    selectEl.appendChild(placeholderOption);

    const filteredPolos = cidadeFiltro
      ? POLOS_OBJ.filter(p => p.cidade === String(cidadeFiltro).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim())
      : POLOS_OBJ;

    filteredPolos.forEach((polo) => {
      const option = document.createElement("option");
      option.value = polo.nome;
      option.textContent = polo.nome;
      selectEl.appendChild(option);
    });

    if (selectedValue && filteredPolos.some(p => p.nome === selectedValue)) {
      selectEl.value = selectedValue;
    }
  }

  function hydratePoloSelects(cidadeFiltro) {
    hydratePoloSelect(poloParticipacaoSelect, cidadeFiltro);
    hydratePoloSelect(poloAuxilioSelect, cidadeFiltro);
  }

  document.addEventListener('input', function(e) {
    if (e.target && e.target.name === 'cidade') {
        hydratePoloSelects(e.target.value);
    }
  });

  document.addEventListener('change', function(e) {
    if (e.target && e.target.name === 'cidade') {
        hydratePoloSelects(e.target.value);
    }
  });

  document.addEventListener('comumSelecionada', function(e) {
    const item = e.detail;
    if (item && item.cidade && e.target) {
      const form = e.target.closest('form');
      if (form && form.id === 'formMonitor') {
        hydratePoloSelect(poloAuxilioSelect, item.cidade);
      } else if (form && form.id === 'formCrianca') {
        hydratePoloSelect(poloParticipacaoSelect, item.cidade);
      }
    }
  });

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

    const isMonitor = formEl.id === "formMonitor";
    if (isMonitor) {
      const checkboxNames = ["de_acordo_voluntario", "autoriza_tratamento_dados"];
      checkboxNames.forEach((n) => {
        if (obj[n] === undefined) obj[n] = "";
      });
    }

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
      confirmButtonColor: "#0f4f77",
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
      title: "Ops...",
      text: message || "Ocorreu um erro inesperado.",
      icon: "error",
      confirmButtonText: "Fechar",
      confirmButtonColor: "#0f4f77"
    });
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  async function showDuplicateModal(duplicate) {
    const nome = escapeHtml(duplicate?.nome || "Cadastro");
    const comum = escapeHtml(duplicate?.comum || "Comum não informada");
    const polo = escapeHtml(duplicate?.polo || "Polo não informado");
    const data = escapeHtml(duplicate?.date || "--/--/----");
    const hora = escapeHtml(duplicate?.time || "--:--:--");
    const tipo = duplicate?.tipo === "monitor" ? "monitor" : "criança";

    if (!window.Swal) {
      window.alert(`${nome} já possui cadastro. Procurar o coordenador do Polo.`);
      return false;
    }

    const html = `
      <div style="text-align:left;max-width:360px;margin:0 auto;">
        <p style="margin:0 0 10px;line-height:1.35;">
          <strong>${nome}</strong> de <strong>${comum}</strong><br/>
          já foi cadastrado(a) como ${tipo}.
        </p>
        <p style="margin:0 0 10px;line-height:1.35;color:#334155;">
          <strong>Polo:</strong> ${polo}
        </p>
        <p style="margin:0;color:#4b5563;">Data: ${data}<br/>Horário: ${hora}</p>
        <p style="margin:12px auto 0;color:#C41E34;font-weight:700;text-align:center;line-height:1.35;max-width:320px;">Por favor, procure o Cooordenador (a) do Polo.</p>
      </div>
    `;

    await window.Swal.fire({
      title: "Cadastro Duplicado!",
      html,
      icon: "warning",
      showCancelButton: false,
      confirmButtonColor: "#6b7280",
      confirmButtonText: "✕ Cancelar"
    });

    return false;
  }

  async function submitForm(formEl, endpoint, btnEl, options = {}) {
    const { allowDuplicate = false } = options;
    btnEl.disabled = true;
    const payload = formToJSON(formEl);
    
    const isMonitor = formEl.id === "formMonitor";

    if (!isMonitor) {
      const nascimentoStr = payload["data_nascimento"] || payload["nascimento"] || "";
      const parts = nascimentoStr.split('/');
      if (parts.length === 3) {
        const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
        const today = new Date();
        let ageYears = today.getFullYear() - birthDate.getFullYear();
        let ageMonths = today.getMonth() - birthDate.getMonth();
        if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
          ageYears--;
          ageMonths += 12;
        }
        
        if (ageYears >= 12) {
          if (window.Swal) {
            await window.Swal.fire({
              title: "Limite de idade excedido",
              text: "Não pode ser registrada criança acima de 12 anos. O ministério deve ser consultado.",
              icon: "warning",
              confirmButtonText: "Entendi",
              confirmButtonColor: "#0f4f77"
            });
          } else {
            window.alert("Limite de idade excedido\\nNão pode ser registrada criança acima de 12 anos. O ministério deve ser consultado.");
          }
          btnEl.disabled = false;
          return;
        }
      }
    }

    const celularKey = isMonitor ? "celular" : "celular_responsavel";
    const celular = payload[celularKey] || "";
    const celularDigits = celular.replace(/\\D/g, "");
    
    if (celularDigits.length === 10) {
      const ddd = parseInt(celularDigits.substring(0, 2), 10);
      if (ddd < 70) {
        await showErrorModal("Para a sua região (DDD " + ddd + "), o 9º dígito no celular é obrigatório.");
        btnEl.disabled = false;
        return;
      }
    }

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
          await showDuplicateModal(data.duplicate);
          return;
        }

        const msg = data?.error ? `${data.error}` : `Erro ao enviar (${res.status}).`;
        const details = data?.details ? `\n\nDetalhes: ${data.details}` : "";
        await showErrorModal(msg + details);
        return;
      }

      if (data?.forwarded === false) {
        await showErrorModal("Falha ao encaminhar cadastro para a integração.");
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

  hydratePoloSelects();

  const inputNascimentoCrianca = formCrianca.querySelector('input[name="data_nascimento"]');
  if (inputNascimentoCrianca) {
    inputNascimentoCrianca.addEventListener("input", async (e) => {
      const v = e.target.value;
      if (v.length === 10) {
        const parts = v.split('/');
        if (parts.length === 3) {
          const birthDate = new Date(parts[2], parts[1] - 1, parts[0]);
          const today = new Date();
          let ageYears = today.getFullYear() - birthDate.getFullYear();
          let ageMonths = today.getMonth() - birthDate.getMonth();
          if (ageMonths < 0 || (ageMonths === 0 && today.getDate() < birthDate.getDate())) {
            ageYears--;
            ageMonths += 12;
          }
          if (ageYears >= 12) {
            e.target.value = "";
            if (window.Swal) {
              await window.Swal.fire({
                title: "Limite de idade excedido",
                text: "Não pode ser registrada criança acima de 12 anos. O ministério deve ser consultado.",
                icon: "warning",
                confirmButtonText: "Entendi",
                confirmButtonColor: "#0f4f77"
              });
            } else {
              window.alert("Limite de idade excedido\\nNão pode ser registrada criança acima de 12 anos. O ministério deve ser consultado.");
            }
          }
        }
      }
    });
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
