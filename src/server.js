const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { URL } = require("url");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "cadastros.ndjson");

const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_CRIANCA = process.env.WEBHOOK_CRIANCA || "";
const WEBHOOK_MONITOR = process.env.WEBHOOK_MONITOR || "";
const WEBHOOK_CADASTRO = process.env.WEBHOOK_CADASTRO || "https://workflows.rendamais.com.br/webhook/304a56e6-8f63-4b8c-9798-3e0a35f6be70-musicalizacao-infiantil";
const SUPABASE_URL = process.env.SUPABASE_URL || "https://sqamxlhfazulrisiptud.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxYW14bGhmYXp1bHJpc2lwdHVkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzM3NTg4NCwiZXhwIjoyMDgyOTUxODg0fQ.w92yMKGGh5-ewRq0q6Pdl8TstzGlx0sGms1FCRveDYc";
const SUPABASE_TABLE_CADASTROS = process.env.SUPABASE_TABLE_CADASTROS || "";
const SUPABASE_TABLE_CRIANCA = process.env.SUPABASE_TABLE_CRIANCA || "musicalizacao_criancas";
const SUPABASE_TABLE_MONITOR = process.env.SUPABASE_TABLE_MONITOR || "musicalizacao_monitores";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon"
};

function sendJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

async function readJsonBody(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_000_000) throw new Error("payload_too_large");
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf-8");
  if (!raw) return {};
  return JSON.parse(raw);
}

async function saveSubmission(tipo, payload) {
  const id = crypto.randomUUID();
  const entry = {
    id,
    uuid: id,
    tipo,
    createdAt: new Date().toISOString(),
    payload,
    persistedLocally: false
  };

  // Vercel serverless pode ter filesystem somente leitura.
  try {
    await fsp.mkdir(dataDir, { recursive: true });
    await fsp.appendFile(dataFile, JSON.stringify(entry) + "\n", "utf-8");
    entry.persistedLocally = true;
  } catch {
    entry.persistedLocally = false;
  }

  return entry;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function isEmailFieldName(fieldName) {
  if (!fieldName) return false;
  const normalized = String(fieldName).toLowerCase();
  return normalized === "email" || normalized.endsWith("_email");
}

function toUppercaseDeep(value, fieldName = "") {
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (isEmailFieldName(fieldName)) return trimmed;
    return trimmed.toUpperCase();
  }
  if (Array.isArray(value)) return value.map((item) => toUppercaseDeep(item, fieldName));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [key, toUppercaseDeep(entryValue, key)])
    );
  }
  return value;
}

function normalizeDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const slash = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) return `${slash[3]}-${slash[2]}-${slash[1]}`;

  const dash = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dash) return raw;

  return normalizeText(raw);
}

function nameTokens(value) {
  const stopWords = new Set(["de", "da", "do", "dos", "das", "e"]);
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token && !stopWords.has(token))
  );
}

function tokenSimilarity(a, b) {
  const tokensA = nameTokens(a);
  const tokensB = nameTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) intersection += 1;
  }

  return intersection / Math.max(tokensA.size, tokensB.size);
}

function namesLookSame(a, b) {
  const normalizedA = normalizeText(a);
  const normalizedB = normalizeText(b);
  if (!normalizedA || !normalizedB) return false;
  if (normalizedA === normalizedB) return true;
  if (normalizedA.includes(normalizedB) || normalizedB.includes(normalizedA)) return true;
  return tokenSimilarity(normalizedA, normalizedB) >= 0.6;
}

async function readSavedEntries() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return [];

  const table = SUPABASE_TABLE_CADASTROS || "";
  const endpoints = table
    ? [{ table, select: "id,registro_uuid,tipo,payload,created_at" }]
    : [
        { table: SUPABASE_TABLE_CRIANCA, select: "*" },
        { table: SUPABASE_TABLE_MONITOR, select: "*" }
      ];

  const allEntries = [];
  for (const endpoint of endpoints) {
    const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${endpoint.table}`);
    url.searchParams.set("select", endpoint.select);
    url.searchParams.set("limit", "1000");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!response.ok) {
      const bodyText = await response.text();
      throw new Error(`supabase_duplicate_check_failed:${response.status}:${bodyText}`);
    }

    const rows = await response.json();
    for (const row of rows) {
      if (row && typeof row === "object" && row.payload && row.tipo) {
        allEntries.push({
          id: row.registro_uuid || row.id || "",
          tipo: row.tipo,
          payload: row.payload
        });
        continue;
      }

      const inferredType = endpoint.table === SUPABASE_TABLE_MONITOR ? "monitor" : "crianca";
      allEntries.push({
        id: row.registro_uuid || row.id || "",
        tipo: inferredType,
        payload: row
      });
    }
  }

  return allEntries;
}

function detectDuplicate(tipo, payload, entries) {
  const sameTypeEntries = entries.filter((entry) => entry.tipo === tipo);
  const congregation = normalizeText(payload.comum_congregacao);

  for (const entry of sameTypeEntries) {
    const existing = entry.payload || {};
    const existingCongregation = normalizeText(existing.comum_congregacao);

    if (tipo === "monitor") {
      const email = normalizeText(payload.email);
      const existingEmail = normalizeText(existing.email);
      const phone = onlyDigits(payload.celular);
      const existingPhone = onlyDigits(existing.celular);
      const sameName = namesLookSame(payload.nome_completo, existing.nome_completo);

      if (email && existingEmail && email === existingEmail) {
        return { duplicate: true, matchedId: entry.id, reason: "email" };
      }

      if (phone && existingPhone && phone === existingPhone) {
        return { duplicate: true, matchedId: entry.id, reason: "celular" };
      }

      if (sameName && congregation && congregation === existingCongregation) {
        return { duplicate: true, matchedId: entry.id, reason: "nome_e_comum" };
      }
    }

    if (tipo === "crianca") {
      const childNameMatch = namesLookSame(payload.nome_crianca, existing.nome_crianca);
      const fatherNameMatch = namesLookSame(payload.nome_pai, existing.nome_pai);
      const motherNameMatch = namesLookSame(payload.nome_mae, existing.nome_mae);
      const guardianNameMatch = namesLookSame(payload.nome_responsavel, existing.nome_responsavel);
      const birthDate = normalizeDate(payload.data_nascimento);
      const existingBirthDate = normalizeDate(existing.data_nascimento);
      const phone = onlyDigits(payload.celular_responsavel);
      const existingPhone = onlyDigits(existing.celular_responsavel);

      const sameCongregation = congregation && congregation === existingCongregation;
      const samePhone = phone && existingPhone && phone === existingPhone;
      const sameBirthDate = birthDate && existingBirthDate && birthDate === existingBirthDate;

      if (samePhone && sameCongregation && (childNameMatch || guardianNameMatch || fatherNameMatch || motherNameMatch)) {
        return { duplicate: true, matchedId: entry.id, reason: "telefone_comum_nome" };
      }

      if (sameBirthDate && sameCongregation && (childNameMatch || (fatherNameMatch && motherNameMatch))) {
        return { duplicate: true, matchedId: entry.id, reason: "nascimento_comum_nome" };
      }

      if (sameCongregation && childNameMatch && guardianNameMatch) {
        return { duplicate: true, matchedId: entry.id, reason: "nome_crianca_responsavel" };
      }
    }
  }

  return { duplicate: false };
}

async function forwardToWebhook(tipo, payload, metadata = {}) {
  const webhookByType = tipo === "crianca" ? WEBHOOK_CRIANCA : WEBHOOK_MONITOR;
  const webhook = webhookByType || WEBHOOK_CADASTRO;
  if (!webhook) return { forwarded: false };

  const webhookPayload = {
    ...payload,
    tipo,
    registro_uuid: metadata.uuid || "",
    created_at: metadata.createdAt || new Date().toISOString()
  };

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(webhookPayload)
  });

  if (!response.ok) return { forwarded: false, webhookStatus: response.status };
  return { forwarded: true, webhookStatus: response.status };
}

function validateRequired(tipo, payload) {
  const requiredByType = {
    crianca: ["nome_crianca", "sexo", "data_nascimento", "comum_congregacao", "nome_responsavel", "celular_responsavel"],
    monitor: ["nome_completo", "comum_congregacao", "idade", "celular", "email", "polo_auxilio"]
  };

  const required = requiredByType[tipo] || [];
  return required.filter((field) => {
    const value = payload[field];
    return value === undefined || value === null || String(value).trim() === "";
  });
}

async function serveStatic(reqPath, res) {
  const normalized = path.normalize(reqPath).replace(/^([.][.][/\\])+/, "");
  const filePath = path.join(publicDir, normalized);

  if (!filePath.startsWith(publicDir)) {
    sendJson(res, 403, { error: "Acesso negado." });
    return;
  }

  let stat;
  try {
    stat = await fsp.stat(filePath);
  } catch {
    sendJson(res, 404, { error: "Arquivo não encontrado." });
    return;
  }

  if (stat.isDirectory()) {
    sendJson(res, 404, { error: "Arquivo não encontrado." });
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || "application/octet-stream";

  res.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": "no-store, no-cache, must-revalidate",
    Pragma: "no-cache",
    Expires: "0"
  });
  fs.createReadStream(filePath).pipe(res);
}

function routeToPage(pathname) {
  if (pathname === "/") return "index.html";
  if (pathname === "/cadastro") return "cadastro.html";
  if (pathname === "/cadastro/crianca") return "cadastro.html";
  if (pathname === "/cadastro/monitor") return "cadastro.html";
  return null;
}

async function handleRequest(req, res) {
  const host = req.headers.host || "localhost";
  const url = new URL(req.url, `http://${host}`);
  const pathname = url.pathname;

  try {
    if (req.method === "GET") {
      const page = routeToPage(pathname);
      if (page) {
        await serveStatic(page, res);
        return;
      }

      if (pathname.startsWith("/styles/") || pathname.startsWith("/scripts/") || pathname.startsWith("/assets/")) {
        await serveStatic(pathname.slice(1), res);
        return;
      }

      sendJson(res, 404, { error: "Rota não encontrada." });
      return;
    }

    if (req.method === "POST" && (pathname === "/api/cadastros/crianca" || pathname === "/api/cadastros/monitor")) {
      const tipo = pathname.endsWith("crianca") ? "crianca" : "monitor";
      const rawPayload = await readJsonBody(req);
      const payload = toUppercaseDeep(rawPayload);
      const missing = validateRequired(tipo, payload);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Campos obrigatórios ausentes.", missing });
        return;
      }

      const existingEntries = await readSavedEntries();
      const duplicateCheck = detectDuplicate(tipo, payload, existingEntries);
      if (duplicateCheck.duplicate) {
        sendJson(res, 409, {
          error: "Cadastro duplicado detectado.",
          duplicateOf: duplicateCheck.matchedId,
          duplicateReason: duplicateCheck.reason
        });
        return;
      }

      const saved = await saveSubmission(tipo, payload);
      const webhookResult = await forwardToWebhook(tipo, payload, {
        uuid: saved.id,
        createdAt: saved.createdAt
      });

      sendJson(res, 201, {
        message: "Cadastro recebido com sucesso.",
        id: saved.id,
        uuid: saved.uuid,
        createdAt: saved.createdAt,
        persistedLocally: saved.persistedLocally,
        ...webhookResult
      });
      return;
    }

    sendJson(res, 404, { error: "Rota não encontrada." });
  } catch (error) {
    if (error.message === "payload_too_large") {
      sendJson(res, 413, { error: "Payload excede 1MB." });
      return;
    }

    if (typeof error.message === "string" && error.message.startsWith("supabase_duplicate_check_failed:")) {
      sendJson(res, 502, { error: "Falha ao validar duplicidade no Supabase." });
      return;
    }

    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: "JSON inválido." });
      return;
    }

    console.error(error);
    sendJson(res, 500, { error: "Erro interno do servidor." });
  }
}

if (process.env.VERCEL) {
  module.exports = handleRequest;
} else {
  const server = http.createServer((req, res) => {
    handleRequest(req, res);
  });

  server.listen(PORT, () => {
    console.log(`Servidor iniciado em http://localhost:${PORT}`);
  });
}
