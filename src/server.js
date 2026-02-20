const http = require("http");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { URL } = require("url");

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "cadastros.ndjson");

const PORT = Number(process.env.PORT || 3000);
const WEBHOOK_CRIANCA = process.env.WEBHOOK_CRIANCA || "";
const WEBHOOK_MONITOR = process.env.WEBHOOK_MONITOR || "";
const WEBHOOK_CADASTRO = process.env.WEBHOOK_CADASTRO || "https://webhooks.rendamais.com.br/webhook/304a56e6-8f63-4b8c-9798-3e0a35f6be70-musicalizacao-infiantil";

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
  const entry = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
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

async function forwardToWebhook(tipo, payload) {
  const webhookByType = tipo === "crianca" ? WEBHOOK_CRIANCA : WEBHOOK_MONITOR;
  const webhook = webhookByType || WEBHOOK_CADASTRO;
  if (!webhook) return { forwarded: false };

  const webhookPayload = { ...payload, tipo };

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
      const payload = await readJsonBody(req);
      const missing = validateRequired(tipo, payload);

      if (missing.length > 0) {
        sendJson(res, 400, { error: "Campos obrigatórios ausentes.", missing });
        return;
      }

      const saved = await saveSubmission(tipo, payload);
      const webhookResult = await forwardToWebhook(tipo, payload);

      sendJson(res, 201, {
        message: "Cadastro recebido com sucesso.",
        id: saved.id,
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
