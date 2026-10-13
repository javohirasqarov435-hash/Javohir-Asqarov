// Dars Taymeri — Übersicht uchun macOS ish stoli widgeti.
// O‘rnatish: shu "dars-taymeri.widget" papkasini Übersicht widgets papkasiga nusxalang
// (~/Library/Application Support/Übersicht/widgets/).

// Ikki soatlik (juft) darslar: jadvaldagi birlashgan kataklar bitta dars. Xona hammasida 410.
const SCHEDULE = {
  1: [["09:00", "10:35", "5 MELBOURNE", "410", "1–2"], ["10:50", "12:25", "8 COLUMBIA", "410", "3–4"], ["14:30", "16:05", "6 DUKE", "410", "7–8"]],
  2: [["09:00", "10:35", "9 CORNELL", "410", "1–2"], ["10:50", "12:25", "6 DUKE", "410", "3–4"], ["14:30", "16:05", "7 TUM", "410", "7–8"]],
  3: [["09:00", "10:35", "7 TUM", "410", "1–2"], ["10:50", "12:25", "8 COLUMBIA", "410", "3–4"], ["14:30", "16:05", "9 CORNELL", "410", "7–8"]],
  4: [["09:00", "10:35", "5 MELBOURNE", "410", "1–2"], ["10:50", "12:25", "6 DUKE", "410", "3–4"], ["13:35", "15:10", "8 COLUMBIA", "410", "6–7"]],
  5: [["09:00", "10:35", "9 CORNELL", "410", "1–2"], ["10:50", "12:25", "7 TUM", "410", "3–4"], ["14:30", "16:05", "5 MELBOURNE", "410", "7–8"]],
};
const DAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const TZ_OFFSET = 5 * 3600e3; // Asia/Tashkent, yozgi vaqt yo‘q

// Har soniyada yangilanadi; buyruq faqat qayta chizishni ishga tushiradi.
export const refreshFrequency = 1000;
export const command = "true";

// Joylashuv: ekranning o‘ng yuqori burchagi. top/right qiymatlarini o‘zgartirib siljiting.
export const className = `
  top: 40px;
  right: 24px;
  width: 340px;
  font-family: -apple-system, "SF Pro Text", "Helvetica Neue", sans-serif;
  color: #f3f6ef;
  -webkit-font-smoothing: antialiased;
`;

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

const C = { board: "rgba(28,58,44,0.88)", chalk: "#f2c84b", done: "#5cc08b", muted: "rgba(243,246,239,0.62)", line: "rgba(243,246,239,0.16)" };
const mono = { fontFamily: '"SF Mono", Menlo, monospace', fontVariantNumeric: "tabular-nums" };
const label = { fontSize: 10.5, fontWeight: 800, letterSpacing: "0.09em", textTransform: "uppercase" };

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

  return (
    <div style={{ background: C.board, borderRadius: 18, padding: 16, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.35)", backdropFilter: "blur(12px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontWeight: 800, fontSize: 15 }}>Shomirza Asqarov</div>
          <div style={{ fontSize: 11.5, color: C.muted }}>Matematika · xona 410</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ ...mono, fontWeight: 700, fontSize: 14 }}>{fmtClock(t)}</div>
          <div style={{ fontSize: 11, color: C.muted }}>{DAYS[today]}</div>
        </div>
      </div>

      {passed.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {passed.map((l) => (
            <div key={l.start} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 9, padding: "6px 10px" }}>
              <span style={{ ...label, fontSize: 9.5, color: C.done, border: `1px solid ${C.done}`, borderRadius: 99, padding: "1px 7px" }}>O‘tildi</span>
              <span style={{ flex: 1, textDecoration: "line-through" }}>{l.cls}</span>
              <span style={{ ...mono, fontSize: 11.5 }}>{l.s}–{l.e}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ background: "rgba(0,0,0,0.22)", borderRadius: 14, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ ...label, color: C.chalk }}>{live ? "Hozir dars · tugashiga" : "Keyingi dars · boshlanishiga"}</div>
        <div>
          <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1.1 }}>{main.cls}</div>
          <div style={{ fontSize: 12, color: C.muted }}>
            {main.para}-soat · {main.s}–{main.e} · xona {main.room}{main.offset ? ` · ${dayLabel(main)}` : ""}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
          {[[h, "soat"], [m, "daqiqa"], [s, "soniya"]].map(([n, u]) => (
            <div key={u} style={{ textAlign: "center", background: "rgba(0,0,0,0.25)", borderRadius: 10, padding: "8px 4px 6px" }}>
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
