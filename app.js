const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

const initData = tg?.initData || "";

const balanceEl = document.getElementById("balance");
const tapsEl = document.getElementById("taps");
const coin = document.getElementById("coin");
const toast = document.getElementById("toast");
const withdrawBtn = document.getElementById("withdrawBtn");
const closeBtn = document.getElementById("closeBtn");

const checkBlock = document.getElementById("checkBlock");
const checkBtn = document.getElementById("checkBtn");

let maxBalance = 10;
let checkUrl = "https://t.me/checkbot_991";
let locked = false;

function setToast(text) {
  toast.textContent = text || "";
}

function showCheck(url) {
  checkUrl = url || checkUrl;
  checkBtn.href = checkUrl;
  checkBlock.classList.remove("hidden");
  locked = true;
  coin.style.pointerEvents = "none";
  setToast("⛔️ Тапы заблокированы до проверки");
}

function hideCheck() {
  checkBlock.classList.add("hidden");
  locked = false;
  coin.style.pointerEvents = "auto";
}

async function apiMe() {
  const r = await fetch(`/api/me?initData=${encodeURIComponent(initData)}`);
  return await r.json();
}

async function apiTap() {
  const r = await fetch(`/api/tap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initData })
  });
  if (!r.ok) throw new Error("tap failed");
  return await r.json();
}

function bump() {
  coin.classList.remove("bump");
  void coin.offsetWidth;
  coin.classList.add("bump");
}

function spawnParticles() {
  const rect = coin.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const nCoins = 5;
  for (let i = 0; i < nCoins; i++) {
    const el = document.createElement("div");
    el.className = "particle";
    el.style.left = `${cx}px`;
    el.style.top = `${cy}px`;

    const dx = (Math.random() * 240 - 120).toFixed(0) + "px";
    const dy = (-(160 + Math.random() * 190)).toFixed(0) + "px";
    el.style.setProperty("--dx", dx);
    el.style.setProperty("--dy", dy);

    const dur = (620 + Math.random() * 260).toFixed(0);
    el.style.animation = `fly ${dur}ms ease-out forwards`;

    document.body.appendChild(el);
    setTimeout(() => el.remove(), dur + 60);
  }

  const sparks = 8;
  for (let i = 0; i < sparks; i++) {
    const s = document.createElement("div");
    s.className = "spark";
    s.style.left = `${cx}px`;
    s.style.top = `${cy}px`;

    const dx = (Math.random() * 260 - 130).toFixed(0) + "px";
    const dy = (-(120 + Math.random() * 200)).toFixed(0) + "px";
    s.style.setProperty("--dx", dx);
    s.style.setProperty("--dy", dy);

    const dur = (460 + Math.random() * 220).toFixed(0);
    s.style.animation = `sparkle ${dur}ms ease-out forwards`;

    document.body.appendChild(s);
    setTimeout(() => s.remove(), dur + 60);
  }
}

async function init() {
  try {
    const me = await apiMe();
    maxBalance = me.max_balance ?? 10;
    checkUrl = me.check_url ?? checkUrl;

    if (!me.registered) {
      setToast("Открой /start в боте и укажи ник Roblox 🎮");
      return;
    }

    balanceEl.textContent = me.profile?.balance ?? 0;
    tapsEl.textContent = me.profile?.taps ?? 0;

    if ((me.profile?.balance ?? 0) >= maxBalance) {
      showCheck(checkUrl);
    } else {
      hideCheck();
      setToast("Тапай по кругу и увеличивай баланс 💎");
    }
  } catch (e) {
    setToast("Ошибка загрузки. Открой мини-апп через Telegram.");
  }
}

coin.addEventListener("click", async () => {
  if (locked) return;

  bump();
  spawnParticles();

  try {
    const data = await apiTap();
    balanceEl.textContent = data.balance;
    tapsEl.textContent = data.taps;

    if (data.need_check) {
      showCheck(data.check_url);
      return;
    }

    setToast(`💎 Ваш баланс был увеличен. Баланс: ${data.balance} робуксов`);
  } catch (e) {
    setToast("Ошибка тапа. Попробуй ещё раз.");
  }
});

withdrawBtn.addEventListener("click", () => {
  // По сценарию — вывод требует проверку
  showCheck(checkUrl);
});

checkBtn.addEventListener("click", (e) => {
  // В Telegram лучше открывать через openTelegramLink, но оставим и обычный href
  if (tg?.openTelegramLink) {
    e.preventDefault();
    tg.openTelegramLink(checkUrl);
  }
});

closeBtn?.addEventListener("click", () => {
  if (tg?.close) tg.close();
});

init();
