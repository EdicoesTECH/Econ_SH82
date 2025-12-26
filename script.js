// script.js

const WEBHOOK_URL = "https://applications-n8n.ky0uhm.easypanel.host/webhook/Lanchonete_SH";

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("chat-form");
const inputEl = document.getElementById("message-input");
const quickButtons = document.querySelectorAll(".quick-btn");

const SESSION_KEY = "assistente_lanchonete_session_id";
let sessionId = localStorage.getItem(SESSION_KEY);
if (!sessionId) {
  sessionId = "sessao-" + Math.random().toString(36).substring(2, 12);
  localStorage.setItem(SESSION_KEY, sessionId);
}

window.addEventListener("DOMContentLoaded", () => {
  addBotMessage(
    "Olá! Sou o assistente da Lanchonete Shalom. " +
      "Descreva a realidade da sua lanchonete ou faça suas perguntas sobre vendas, ticket médio, desperdício, escala ou PEV, " +
      "e eu te ajudo com análise e próximos passos."
  );
});

formEl.addEventListener("submit", (event) => {
  event.preventDefault();
  handleSend();
});

inputEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
});

async function handleSend() {
  const text = inputEl.value.trim();
  if (!text) return;
  addUserMessage(text);
  inputEl.value = "";
  await sendToBackend(text);
}

quickButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const template = btn.getAttribute("data-template");
    if (!template) return;
    inputEl.value = template;
    inputEl.focus();
  });
});

function addUserMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row user";

  const msg = document.createElement("div");
  msg.className = "message user";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "Você";

  msg.appendChild(bubble);
  msg.appendChild(meta);
  row.appendChild(msg);
  chatEl.appendChild(row);
  scrollToBottom();
}

function addBotMessage(text) {
  const row = document.createElement("div");
  row.className = "message-row bot";

  const msg = document.createElement("div");
  msg.className = "message bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML = formatMarkdownLite(text);

  const meta = document.createElement("div");
  meta.className = "message-meta";
  meta.textContent = "Assistente da Lanchonete";

  msg.appendChild(bubble);
  msg.appendChild(meta);
  row.appendChild(msg);
  chatEl.appendChild(row);
  scrollToBottom();
}

function addTypingIndicator() {
  const row = document.createElement("div");
  row.className = "message-row bot";
  row.id = "typing-indicator-row";

  const msg = document.createElement("div");
  msg.className = "message bot";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.innerHTML =
    "<span class='typing-dot'></span><span class='typing-dot'></span><span class='typing-dot'></span>";

  msg.appendChild(bubble);
  row.appendChild(msg);
  chatEl.appendChild(row);
  scrollToBottom();
}

function removeTypingIndicator() {
  const row = document.getElementById("typing-indicator-row");
  if (row) row.remove();
}

function scrollToBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

async function sendToBackend(message) {
  addTypingIndicator();

  try {
    const payload = {
      sessionId,
      message,
      source: "assistente-lanchonete-web",
    };

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("Erro na requisição ao backend");
    }

    const data = await response.json();

    let reply =
      data.reply ||
      data.answer ||
      data.output ||
      (data.data && (data.data.reply || data.data.output));

    if (!reply) {
      reply = JSON.stringify(data, null, 2);
    }

    removeTypingIndicator();
    addBotMessage(reply);
  } catch (error) {
    console.error(error);
    removeTypingIndicator();
    addBotMessage(
      "Tive um problema para falar com o servidor agora. " +
        "Verifique o fluxo do n8n ou tente novamente em alguns instantes."
    );
  }
}

function formatMarkdownLite(text) {
  if (!text) return "";
  let html = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.*)$/gm, "<li>$1</li>");

  if (html.includes("<li>")) {
    html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  }

  html = html.replace(/\n/g, "<br />");
  return html;
}
