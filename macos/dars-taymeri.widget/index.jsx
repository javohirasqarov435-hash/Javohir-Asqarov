// Dars Taymeri — Übersicht uchun macOS ish stoli widgeti.
// O‘rnatish: shu "dars-taymeri.widget" papkasini Übersicht widgets papkasiga nusxalang
// (~/Library/Application Support/Übersicht/widgets/).

import { run } from "uebersicht";

// Ikki soatlik (juft) darslar: jadvaldagi birlashgan kataklar bitta dars. Xona hammasida 410.
const SCHEDULE = {
  1: [["09:00", "10:35", "5-Sh", "410", "1–2"], ["10:50", "12:25", "8-Sh", "410", "3–4"], ["14:30", "16:05", "6-Sh", "410", "7–8"]],
  2: [["09:00", "10:35", "9-Sh", "410", "1–2"], ["10:50", "12:25", "6-Sh", "410", "3–4"], ["14:30", "16:05", "7-Sh", "410", "7–8"]],
  3: [["09:00", "10:35", "7-Sh", "410", "1–2"], ["10:50", "12:25", "8-Sh", "410", "3–4"], ["14:30", "16:05", "9-Sh", "410", "7–8"]],
  4: [["09:00", "10:35", "5-Sh", "410", "1–2"], ["10:50", "12:25", "6-Sh", "410", "3–4"], ["13:35", "15:10", "8-Sh", "410", "6–7"]],
  5: [["09:00", "10:35", "9-Sh", "410", "1–2"], ["10:50", "12:25", "7-Sh", "410", "3–4"], ["14:30", "16:05", "5-Sh", "410", "7–8"]],
};
const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const TZ_OFFSET = 5 * 3600e3; // Asia/Tashkent, yozgi vaqt yo‘q

// Har soniyada yangilanadi; buyruq faqat qayta chizishni ishga tushiradi.
export const refreshFrequency = 1000;
export const command = "true";

export const className = `
  font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
  color: #f3f6ef;
  -webkit-font-smoothing: antialiased;
`;

// Joylashuv: widgetni sichqoncha bilan sudrab siljiting, joyi eslab qolinadi.
// Ikki marta bossangiz, o‘ng yuqori burchakka qaytadi.
const WIDTH = 340;
const POS_KEY = "dars-taymeri-pos";
const defaultPos = () => ({ x: window.innerWidth - WIDTH - 24, y: 40 });
let pos = (() => {
  try { return JSON.parse(localStorage.getItem(POS_KEY)) || null; } catch (e) { return null; }
})();
const savePos = () => { try { localStorage.setItem(POS_KEY, JSON.stringify(pos)); } catch (e) {} };

const startDrag = (e) => {
  if (e.button !== 0 || e.target.closest("[data-nodrag]")) return;
  const card = e.currentTarget;
  const r = card.getBoundingClientRect();
  const dx = e.clientX - r.left;
  const dy = e.clientY - r.top;
  card.style.cursor = "grabbing";
  const move = (ev) => {
    pos = {
      x: Math.min(Math.max(0, ev.clientX - dx), window.innerWidth - 60),
      y: Math.min(Math.max(0, ev.clientY - dy), window.innerHeight - 60),
    };
    card.style.left = pos.x + "px";
    card.style.top = pos.y + "px";
  };
  const up = () => {
    window.removeEventListener("mousemove", move);
    window.removeEventListener("mouseup", up);
    card.style.cursor = "grab";
    savePos();
  };
  window.addEventListener("mousemove", move);
  window.addEventListener("mouseup", up);
  e.preventDefault();
};

const resetPos = (e) => {
  pos = defaultPos();
  e.currentTarget.style.left = pos.x + "px";
  e.currentTarget.style.top = pos.y + "px";
  savePos();
};

const wallNow = () => Date.now() + TZ_OFFSET;
const dayStart = (t) => { const d = new Date(t); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const hm = (s) => { const [h, m] = s.split(":"); return (+h * 60 + +m) * 60e3; };
const pad = (n) => String(n).padStart(2, "0");
const fmtClock = (t) => { const d = new Date(t); return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`; };
const split = (ms) => { const x = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(x / 3600), Math.floor(x / 60) % 60, x % 60]; };
const words = (ms) => {
  const [h, m, s] = split(ms);
  const out = [];
  if (h) out.push(`${h} soat`);
  if (h || m) out.push(`${m} daq`);
  out.push(`${pad(s)} son`);
  return out.join(" ");
};

const lessonsFrom = (t, days) => {
  const base = dayStart(t);
  const list = [];
  for (let i = 0; i <= days; i++) {
    const d0 = base + i * 864e5;
    const wd = new Date(d0).getUTCDay();
    (SCHEDULE[wd] || []).forEach(([s, e, cls, room, para]) =>
      list.push({ start: d0 + hm(s), end: d0 + hm(e), s, e, cls, room, para, wd, offset: i }));
  }
  return list;
};
const dayLabel = (l) => (l.offset === 0 ? "bugun" : l.offset === 1 ? "ertaga" : DAYS[l.wd].toLowerCase());

const C = { board: "linear-gradient(160deg, rgba(31,111,120,0.94), rgba(43,140,138,0.94))", chalk: "#ffd166", done: "#4cc38a", danger: "#e35d5b", muted: "rgba(245,251,252,0.7)", line: "rgba(245,251,252,0.2)", tile: "rgba(255,255,255,0.12)" };
const mono = { fontFamily: '"SF Mono", Menlo, monospace', fontVariantNumeric: "tabular-nums" };
const label = { fontSize: 10.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" };

// Quiz / HW belgilari: har bir dars (sana + vaqt) uchun alohida saqlanadi.
const ITEMS = [
  ["quiz", "Quiz chiqarilmadi"],
  ["hw", "HW chiqarilmadi"],
  ["pquiz", "Oldingi quiz tekshirilmadi"],
  ["phw", "Oldingi HW tekshirilmadi"],
  ["slide", "Telegram tashlanmadi"],
  ["dav", "Davomat qilinmadi"],
];
const WARN_MIN = 10; // dars tugashiga shuncha daqiqa qolganda qattiq ogohlantirish
const lessonKey = (l) => `dars-taymeri:${new Date(l.start).toISOString().slice(0, 10)}:${l.s}`;
const loadChecks = (l) => { try { return JSON.parse(localStorage.getItem(lessonKey(l))) || {}; } catch (e) { return {}; } };
const saveChecks = (l, c) => { try { localStorage.setItem(lessonKey(l), JSON.stringify(c)); } catch (e) {} };
// "Oldingisi tekshirildimi?" faqat shu sinflarda (sinf raqami bo‘yicha).
const PREV_CHECKS = { 5: ["pquiz", "phw"], 6: ["pquiz", "phw"], 7: ["pquiz"] };
const prevFor = (l) => PREV_CHECKS[parseInt(l.cls, 10)] || [];
// "Telegram" (slayd) faqat shu sinflarda; davomat hamma sinfda.
const SLIDE_GRADES = [5, 6, 7];
const slideFor = (l) => SLIDE_GRADES.includes(parseInt(l.cls, 10));
const itemsFor = (l) => ITEMS.filter(([k]) =>
  k === "slide" ? slideFor(l) : !k.startsWith("p") || prevFor(l).includes(k));
const missingOf = (l) => { const c = loadChecks(l); return itemsFor(l).filter(([k]) => !c[k]).map(([, text]) => text); };

const chipCss = (on) => ({
  background: on ? C.done : "transparent",
  borderColor: on ? C.done : "rgba(243,246,239,0.45)",
  color: on ? "#0e1519" : "#f5fbfc",
});
const toggle = (e, l, k, text) => {
  e.stopPropagation();
  const c = loadChecks(l);
  c[k] = !c[k];
  saveChecks(l, c);
  // Darhol ko‘rsatish (keyingi soniyani kutmasdan)
  Object.assign(e.currentTarget.style, chipCss(c[k]));
  e.currentTarget.textContent = (c[k] ? "✓ " : "") + text;
};

const Chip = ({ l, k, text, c }) => (
  <div data-nodrag="1" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => toggle(e, l, k, text)}
    style={{ display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid", borderRadius: 7, padding: "4px 4px", fontSize: 11.5, fontWeight: 700, cursor: "pointer", ...chipCss(!!c[k]) }}>
    {(c[k] ? "✓ " : "") + text}
  </div>
);

const Checklist = ({ l }) => {
  const c = loadChecks(l);
  const row = { display: "grid", gridTemplateColumns: "1fr 62px 62px", alignItems: "center", gap: 5 };
  const lbl = { fontSize: 11, color: C.muted, minWidth: 0 };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <div style={row}><span style={lbl}>Chiqarildimi?</span><Chip l={l} k="quiz" text="Quiz" c={c} /><Chip l={l} k="hw" text="HW" c={c} /></div>
      {prevFor(l).length > 0 && (
        <div style={row}><span style={lbl}>Oldingisi tekshirildimi?</span>
          {prevFor(l).includes("pquiz") && <Chip l={l} k="pquiz" text="Quiz" c={c} />}
          {prevFor(l).includes("phw") && <Chip l={l} k="phw" text="HW" c={c} />}
        </div>
      )}
      <div style={row}><span style={lbl}>Qilindimi?</span>
        {slideFor(l) && <Chip l={l} k="slide" text="Tg" c={c} />}
        <Chip l={l} k="dav" text="Dav" c={c} />
      </div>
    </div>
  );
};

const Warn = ({ items, urgent }) => (
  <div style={{ borderRadius: 9, padding: "7px 10px", fontSize: 12, fontWeight: 700, lineHeight: 1.35, background: urgent ? C.danger : "rgba(255,209,102,0.2)", color: urgent ? "#fff" : C.chalk }}>
    ⚠ {items.join(", ")}
  </div>
);

// macOS bildirishnomasi: har bir dars uchun bir martadan.
const clean = (s) => s.replace(/["'\\]/g, "");
const firstTime = (id) => {
  const key = `dars-taymeri-notified:${id}`;
  try { if (localStorage.getItem(key)) return false; localStorage.setItem(key, "1"); return true; } catch (e) { return false; }
};
const notifyOnce = (id, title, msg) => {
  if (!firstTime(id)) return;
  run(`osascript -e 'display notification "${clean(msg)}" with title "${clean(title)}" sound name "Glass"'`).catch(() => {});
};

// Dars tugagach: "Telegram guruhga slayd tashlandimi?" oynasi.
// "Tashlandi" bosilsa, widgetda ham belgilanadi. Belgilanmaguncha 10 va 20 daqiqadan keyin yana so‘raydi.
const SLIDE_ROUNDS_MIN = [0, 10, 20];
const askSlide = (l, round) => {
  if (!firstTime(`${lessonKey(l)}:slide:${round}`)) return;
  const title = clean(`${l.cls} — dars tugadi`);
  const lines = [
    `osascript`,
    `-e 'display notification "Telegram guruhga slayd tashlandimi?" with title "${title}" sound name "Glass"'`,
    `-e 'tell application "System Events"'`,
    `-e 'activate'`,
    `-e 'display dialog "${clean(l.cls)}: Telegram guruhga slayd tashlandimi?" buttons {"Keyinroq", "Tashlandi"} default button "Tashlandi" with title "${title}" giving up after 540'`,
    `-e 'end tell'`,
  ];
  run(lines.join(" "))
    .then((out) => {
      if (String(out).includes("Tashlandi")) {
        const c = loadChecks(l);
        c.slide = true;
        saveChecks(l, c);
      }
    })
    .catch(() => {});
};

export const render = () => {
  const t = wallNow();
  const today = new Date(t).getUTCDay();
  const all = lessonsFrom(t, 7);
  const passed = all.filter((l) => l.offset === 0 && l.end <= t);
  const upcoming = all.filter((l) => l.end > t);
  const main = upcoming[0];
  const live = main.start <= t;
  const [h, m, s] = split((live ? main.end : main.start) - t);
  const progress = live ? Math.min(100, ((t - main.start) / (main.end - main.start)) * 100) : 0;

  const rest = upcoming.slice(1);
  let queue = rest.filter((l) => l.offset === main.offset);
  if (!queue.length && rest.length) queue = [rest[0]];

  const p = pos || defaultPos();

  const mainMissing = missingOf(main);
  const urgent = live && main.end - t <= WARN_MIN * 60e3;
  if (urgent && mainMissing.length) {
    notifyOnce(`${lessonKey(main)}:end`, `${main.cls}: ${WARN_MIN} daqiqa qoldi`, mainMissing.join(", "));
  }
  passed.forEach((l) => {
    const since = t - l.end;
    if (slideFor(l) && !loadChecks(l).slide) {
      const round = SLIDE_ROUNDS_MIN.filter((m) => since >= m * 60e3).length - 1;
      if (since < 30 * 60e3) askSlide(l, round);
    }
    const miss = missingOf(l).filter((text) => !text.startsWith("Telegram"));
    if (miss.length && since < 5 * 60e3) notifyOnce(`${lessonKey(l)}:after`, `${l.cls}: dars tugadi`, miss.join(", "));
  });

  return (
    <div onMouseDown={startDrag} onDoubleClick={resetPos} style={{ position: "fixed", left: p.x, top: p.y, width: WIDTH, cursor: "grab", userSelect: "none", background: C.board, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Javohir Asqarov</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Matematika · xona 410</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...mono, fontWeight: 700, fontSize: 14 }}>{fmtClock(t)}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{DAYS[today]}</div>
        </div>
      </div>

      {passed.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {passed.map((l) => {
            const miss = missingOf(l);
            return (
              <div key={l.start} style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12.5, color: C.muted, border: `1px solid ${miss.length ? C.danger : C.line}`, borderRadius: 9, padding: "6px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ ...label, fontSize: 9.5, color: C.done, border: `1px solid ${C.done}`, borderRadius: 99, padding: "1px 7px" }}>O‘tildi</span>
                  <span style={{ flex: 1, textDecoration: "line-through" }}>{l.cls}</span>
                  {!miss.length && <span style={{ color: C.done, fontWeight: 700 }}>✓ hammasi</span>}
                  <span style={{ ...mono, fontSize: 11.5 }}>{l.s}–{l.e}</span>
                </div>
                {miss.length > 0 && <Warn items={miss} urgent />}
                {miss.length > 0 && <Checklist l={l} />}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ background: C.tile, borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...label, color: C.chalk }}>{live ? "Hozir dars · tugashiga" : "Keyingi dars · boshlanishiga"}</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{main.cls}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {main.para}-soat · {main.s}–{main.e} · xona {main.room}{main.offset ? ` · ${dayLabel(main)}` : ""}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {[[h, "soat"], [m, "daqiqa"], [s, "soniya"]].map(([n, u]) => (
            <div key={u} style={{ textAlign: "center", background: C.tile, borderRadius: 10, padding: "8px 4px 6px" }}>
              <div style={{ ...mono, fontWeight: 700, fontSize: 30, lineHeight: 1, color: C.chalk }}>{pad(n)}</div>
              <div style={{ fontSize: 10, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginTop: 3 }}>{u}</div>
            </div>
          ))}
        </div>
        {live && (
          <div style={{ height: 5, borderRadius: 99, background: C.line, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: C.chalk }} />
          </div>
        )}
        <Checklist l={main} />
        {live && mainMissing.length > 0 && <Warn items={mainMissing} urgent={urgent} />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ ...label, color: C.muted }}>Undan keyin</div>
        {main.offset > 0 && passed.length > 0 && <div style={{ fontSize: 12, color: C.muted }}>Bugungi darslar tugadi.</div>}
        {queue.map((l) => (
          <div key={l.start} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, border: `1px solid ${C.line}`, borderRadius: 10, padding: "8px 11px" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14 }}>{l.cls}</div>
              <div style={{ fontSize: 11.5, color: C.muted }}>{l.s}–{l.e} · xona {l.room}{l.offset ? ` · ${dayLabel(l)}` : ""}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ ...mono, fontWeight: 700, fontSize: 13 }}>{words(l.start - t)}</div>
              <div style={{ fontSize: 10.5, color: C.muted }}>qoldi</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
