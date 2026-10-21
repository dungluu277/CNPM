import { useEffect, useRef, useState } from "react";

const LANG = { vi: { label: "Tiếng Việt", voice: "vi-VN" }, en: { label: "English", voice: "en-US" }, ja: { label: "日本語", voice: "ja-JP" } };
const CATS = { all: "Tất cả", historyCat: "Lịch sử", architecture: "Kiến trúc", culture: "Văn hóa", river: "Sông nước" };

export default function App() {
  const [page, setPage] = useState("home");
  const [places, setPlaces] = useState([]);
  const [cat, setCat] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("featured");
  const [auth, setAuth] = useState(() => JSON.parse(localStorage.getItem("auth") || "null"));
  const [favs, setFavs] = useState([]);
  const [hist, setHist] = useState([]);
  const [modal, setModal] = useState(null); // {type:'place'|'auth'|'scan', place}
  const [toast, setToast] = useState("");

  const say = (m) => { setToast(m); setTimeout(() => setToast(""), 3500); };
  const api = async (url, opt = {}) => {
    const r = await fetch("/api" + url, { ...opt, headers: { "Content-Type": "application/json", ...(auth ? { Authorization: "Bearer " + auth.token } : {}) } });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.detail || "Có lỗi xảy ra");
    return d;
  };

  // (a, b) xem danh sách + tìm kiếm
  useEffect(() => {
    const t = setTimeout(() => api(`/places?q=${encodeURIComponent(q)}&category=${cat}`).then(setPlaces).catch((e) => say(e.message)), 200);
    return () => clearTimeout(t);
  }, [q, cat]);
  useEffect(() => { if (auth) { api("/favorites").then(setFavs).catch(() => logout()); loadHist(); } else { setFavs([]); setHist([]); } }, [auth]);
  const loadHist = () => api("/history").then(setHist).catch(() => {});
  const logout = () => { localStorage.removeItem("auth"); setAuth(null); setPage("home"); };
  const needLogin = () => { say("Vui lòng đăng nhập để dùng chức năng này"); setModal({ type: "auth" }); };

  // (h) lưu yêu thích
  const toggleFav = async (id) => {
    if (!auth) return needLogin();
    const on = favs.includes(id);
    await api("/favorites/" + id, { method: on ? "DELETE" : "PUT" });
    setFavs(on ? favs.filter((x) => x !== id) : [...favs, id]);
    say(on ? "Đã bỏ lưu địa điểm" : "Đã lưu địa điểm");
  };
  const openPlace = (p) => setModal({ type: "place", place: p });
  const shown = [...(page === "saved" ? places.filter((p) => favs.includes(p.id)) : places)].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name, "vi");
    if (sort === "category") return (CATS[a.category] || "").localeCompare(CATS[b.category] || "", "vi");
    return 0;
  });

  return (
    <>
      <header>
        <button className="brand" onClick={() => setPage("home")}><span className="logo">◖</span><span>Sài Gòn Echo<small>Stories around you</small></span></button>
        <nav style={{ display: "flex" }}>
          {[["home", "Khám phá"], ["saved", "Đã lưu"], ["history", "Lịch sử nghe"]].map(([k, v]) => (
            <button key={k} className={page === k ? "active" : ""} onClick={() => (k !== "home" && !auth ? needLogin() : setPage(k))}>{v}</button>
          ))}
        </nav>
        <div className="header-right">
          <button className="btn small" onClick={() => setModal({ type: "scan" })}>▣ Quét QR</button>
          {auth ? <button className="btn small" onClick={logout}>{auth.username} · Đăng xuất</button> : <button className="btn small primary" onClick={() => setModal({ type: "auth" })}>Đăng nhập</button>}
        </div>
      </header>

      <main>
        <div className="container">
          {page === "history" ? <History hist={hist} places={places} api={api} reload={loadHist} openPlace={openPlace} say={say} /> : (
            <>
              {page === "home" && (
                <section className="hero">
                  <div>
                    <div className="eyebrow">SAIGON, IN YOUR LANGUAGE</div>
                    <h1>Nghe thành phố<br /><em>kể chuyện.</em></h1>
                    <p>Từ những mái ngói trăm năm đến nhịp sống bên sông. Chọn ngôn ngữ của bạn và để Sài Gòn dẫn lối.</p>
                    <div className="hero-actions">
                      <a className="btn primary" href="#destinations">Bắt đầu khám phá ↗</a>
                      <button className="btn" onClick={() => setModal({ type: "scan" })}>▣ Quét QR</button>
                    </div>
                    <div className="hero-note"><div className="avatars"><span>VI</span><span>EN</span><span>JP</span></div><span>3 ngôn ngữ · Một Sài Gòn, nhiều câu chuyện</span></div>
                  </div>
                  <div className="hero-art" style={{ background: "#d5ded0", display: "grid", placeItems: "center", fontSize: 120 }}>🏛️
                    <div className="floating"><div className="wave">{[...Array(7)].map((_, i) => <i key={i} />)}</div>
                      <div><strong>Dinh Độc Lập · Câu chuyện kiến trúc</strong><small>Chạm để nghe bằng ngôn ngữ của bạn</small></div>
                      <button className="play" onClick={() => places[0] && openPlace(places.find((p) => p.id === "dinh-doc-lap") || places[0])}>▶</button></div>
                  </div>
                </section>
              )}
              <section id="destinations">
                <div className="section-head"><div><div className="eyebrow">{page === "home" ? "HÀNH TRÌNH CỦA RIÊNG BẠN" : "ĐÃ LƯU"}</div><h2>{page === "home" ? "Những điểm đến, những câu chuyện" : "Địa điểm yêu thích"}</h2></div><span className="muted">{shown.length} địa điểm</span></div>
                <div className="toolbar">
                  <div className="chips">{Object.entries(CATS).map(([k, v]) => <button key={k} className={"chip " + (cat === k ? "active" : "")} onClick={() => setCat(k)}>{v}</button>)}</div>
                  <div className="search-tools">
                    <input className="search" placeholder="Tìm địa điểm, tên đường…" value={q} onChange={(e) => setQ(e.target.value)} />
                    <select className="sort" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sắp xếp địa điểm">
                      <option value="featured">Nổi bật</option>
                      <option value="name">Theo tên</option>
                      <option value="category">Theo danh mục</option>
                    </select>
                  </div>
                </div>
                <div className="grid">
                  {shown.length ? shown.map((p) => (
                    <article className="card" key={p.id}>
                      <div className="card-art" style={{ background: p.color, display: "grid", placeItems: "center", fontSize: 64 }}>
                        {{ palace: "🏛️", post: "📮", market: "🏪", opera: "🎭", street: "🚶", river: "⛴️" }[p.art]}
                        <span className="tag">{CATS[p.category]}</span>
                        <button className={"favorite " + (favs.includes(p.id) ? "saved" : "")} onClick={() => toggleFav(p.id)}>{favs.includes(p.id) ? "♥" : "♡"}</button>
                      </div>
                      <div className="card-body">
                        <button className="card-title" onClick={() => openPlace(p)}>{p.name}</button>
                        <p>{p.texts.vi.slice(0, 100)}…</p>
                        <div className="card-meta"><span>⌖ {p.address.split(",")[0]}</span></div>
                        <div className="card-bottom"><span className="languages">{Object.keys(LANG).filter((l) => p.texts[l]?.trim()).map((l) => l.toUpperCase()).join(" · ")}</span>
                          <button className="text-link" onClick={() => openPlace(p)}>Nghe câu chuyện ↗</button></div>
                      </div>
                    </article>
                  )) : <div className="empty">Chưa có địa điểm phù hợp.</div>}
                </div>
              </section>
            </>
          )}
        </div>
      </main>
      <footer className="footer"><span>© 2026 Sài Gòn Echo · Đồ án thuyết minh đa ngôn ngữ</span></footer>

      {modal && (
        <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setModal(null)}>
          <dialog open>
            <div className="modal-head"><strong>{{ place: modal.place?.name, auth: "Tài khoản", scan: "Quét QR · Mở câu chuyện" }[modal.type]}</strong><button className="close" onClick={() => setModal(null)}>×</button></div>
            <div className="modal-content">
              {modal.type === "place" && <PlaceDetail p={modal.place} fav={favs.includes(modal.place.id)} toggleFav={toggleFav} auth={auth} api={api} reload={loadHist} say={say} />}
              {modal.type === "auth" && <Auth setAuth={(a) => { localStorage.setItem("auth", JSON.stringify(a)); setAuth(a); setModal(null); say("Xin chào " + a.username); }} />}
              {modal.type === "scan" && <Scanner api={api} onFound={(p) => { say("Đã nhận diện địa điểm"); openPlace(p); }} say={say} />}
            </div>
          </dialog>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

// (c, d, e) chi tiết + chọn ngôn ngữ + nghe thuyết minh
function PlaceDetail({ p, fav, toggleFav, auth, api, reload, say }) {
  const [lang, setLang] = useState("vi");
  const [rate, setRate] = useState(1);
  const [state, setState] = useState("stopped");
  const [voices, setVoices] = useState([]);
  useEffect(() => {
    const loadVoices = () => setVoices(window.speechSynthesis?.getVoices() || []);
    loadVoices();
    window.speechSynthesis?.addEventListener("voiceschanged", loadVoices);
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", loadVoices);
  }, []);
  useEffect(() => () => speechSynthesis.cancel(), []);
  const stop = () => { speechSynthesis.cancel(); setState("stopped"); };
  const changeLang = (l) => { stop(); setLang(l); };
  const toggle = () => {
    if (state === "speaking") { speechSynthesis.pause(); return setState("paused"); }
    if (state === "paused") { speechSynthesis.resume(); return setState("speaking"); }
    if (!window.speechSynthesis) return say("Trình duyệt không hỗ trợ đọc văn bản");
    const v = voices.find((x) => x.lang.toLowerCase().startsWith(lang));
    if (!v && voices.length) return say("Thiết bị chưa có giọng đọc " + LANG[lang].label);
    const u = new SpeechSynthesisUtterance(p.texts[lang]);
    if (v) u.voice = v;
    u.lang = LANG[lang].voice; u.rate = rate; u.onend = () => setState("stopped");
    speechSynthesis.speak(u); setState("speaking");
    if (auth) api("/history", { method: "POST", body: JSON.stringify({ place_id: p.id, lang, kind: "tts" }) }).then(reload).catch(() => {});
  };
  return (
    <>
      <div className="detail-top">
        <div className="detail-art" style={{ background: p.color, display: "grid", placeItems: "center", fontSize: 80 }}>{{ palace: "🏛️", post: "📮", market: "🏪", opera: "🎭", street: "🚶", river: "⛴️" }[p.art]}</div>
        <div>
          <span className="eyebrow">{CATS[p.category]}</span>
          <h2 style={{ fontSize: 30 }}>{p.name}</h2>
          <div className="info-list">⌖ {p.address}<br />♫ {Object.keys(LANG).filter((l) => p.texts[l]?.trim()).length} ngôn ngữ thuyết minh<br />▣ Mã QR: <code>SGECHO:{p.id}</code></div>
          <div className="detail-actions">
            <a className="btn small" target="_blank" rel="noopener" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}`}>⌖ Chỉ đường ↗</a>
            <button className="btn small" onClick={() => toggleFav(p.id)}>{fav ? "♥ Đã lưu" : "♡ Lưu yêu thích"}</button>
          </div>
        </div>
      </div>
      <div className="map-card">
        <div><strong>Vị trí trên bản đồ</strong><span>{p.address}</span></div>
        <iframe
          title={"Bản đồ " + p.name}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.lon - 0.006}%2C${p.lat - 0.004}%2C${p.lon + 0.006}%2C${p.lat + 0.004}&layer=mapnik&marker=${p.lat}%2C${p.lon}`}
        />
      </div>
      <div className="player">
        <button className="play" onClick={toggle} disabled={!p.texts[lang]?.trim()}>{state === "speaking" ? "Ⅱ" : "▶"}</button>
        <div className="controls"><strong>Nghe câu chuyện</strong><p>Giọng đọc tổng hợp của thiết bị · không phải bản thu âm</p></div>
        <select value={lang} onChange={(e) => changeLang(e.target.value)}>{Object.entries(LANG).map(([l, v]) => <option key={l} value={l}>{v.label}</option>)}</select>
        <select value={rate} onChange={(e) => { stop(); setRate(+e.target.value); }}>{[0.8, 1, 1.2, 1.5].map((r) => <option key={r} value={r}>{r}×</option>)}</select>
        <button className="btn light small" onClick={stop}>■</button>
      </div>
      <div className="narration">{p.texts[lang]?.trim() || "Chưa có nội dung cho ngôn ngữ này."}</div>
      {!auth && <div className="notice" style={{ display: "block" }}>Đăng nhập để lưu lịch sử nghe và địa điểm yêu thích.</div>}
    </>
  );
}

// (g) lịch sử nghe
function History({ hist, places, api, reload, openPlace, say }) {
  return (
    <>
      <div className="admin-head"><div><div className="eyebrow">YOUR JOURNEY</div><h2>Lịch sử nghe</h2></div>
        <button className="btn small" onClick={async () => { await api("/history", { method: "DELETE" }); reload(); say("Đã xóa lịch sử"); }}>Xóa lịch sử</button></div>
      <div className="panel">{hist.length ? hist.map((h) => { const p = places.find((x) => x.id === h.place_id); return (
        <div className="history-row" key={h.id}><div><strong>{p?.name || "Địa điểm đã xóa"}</strong><div className="subtitle">{LANG[h.lang]?.label} · {new Date(h.time + "Z").toLocaleString("vi-VN")}</div></div>
          {p && <button className="btn small" onClick={() => openPlace(p)}>Nghe lại ↗</button>}</div>); }) : <div className="empty">Bạn chưa nghe bản thuyết minh nào.</div>}</div>
    </>
  );
}

function Auth({ setAuth }) {
  const [mode, setMode] = useState("login");
  const [f, setF] = useState({ username: "", password: "" });
  const [err, setErr] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    const r = await fetch("/api/" + mode, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const d = await r.json();
    r.ok ? setAuth(d) : setErr(d.detail || "Lỗi");
  };
  return (
    <form onSubmit={submit}>
      <div className="field"><label>Tên đăng nhập</label><input value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} required /></div>
      <div className="field"><label>Mật khẩu</label><input type="password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} required /></div>
      {err && <p className="delete-warning">{err}</p>}
      <div className="row"><button className="btn primary">{mode === "login" ? "Đăng nhập" : "Tạo tài khoản"}</button>
        <button type="button" className="text-link" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Chưa có tài khoản? Đăng ký" : "Đã có tài khoản? Đăng nhập"}</button></div>
    </form>
  );
}

// (f) quét QR: nhập mã, ảnh QR hoặc camera (BarcodeDetector)
function Scanner({ api, onFound, say }) {
  const [code, setCode] = useState("");
  const video = useRef(); const stream = useRef(); const raf = useRef();
  const resolve = async (c) => { try { stopCam(); onFound(await api("/qr/resolve?code=" + encodeURIComponent(c))); return true; } catch { say("Mã không thuộc địa điểm nào"); return false; } };
  const stopCam = () => { cancelAnimationFrame(raf.current); stream.current?.getTracks().forEach((t) => t.stop()); stream.current = null; };
  useEffect(() => stopCam, []);
  const detector = () => ("BarcodeDetector" in window ? new window.BarcodeDetector({ formats: ["qr_code"] }) : (say("Trình duyệt chưa hỗ trợ đọc QR. Hãy nhập mã."), null));
  const startCam = async () => {
    const d = detector(); if (!d) return;
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      video.current.hidden = false; video.current.srcObject = stream.current; await video.current.play();
      const tick = async () => { if (!stream.current) return; const r = await d.detect(video.current).catch(() => []); if (r[0] && (await resolve(r[0].rawValue))) return; raf.current = requestAnimationFrame(tick); };
      tick();
    } catch { say("Không bật được camera (cần HTTPS hoặc localhost)"); }
  };
  const fromFile = async (f) => { const d = detector(); if (!d || !f) return; const r = await d.detect(await createImageBitmap(f)).catch(() => []); r[0] ? resolve(r[0].rawValue) : say("Không tìm thấy QR trong ảnh"); };
  return (
    <>
      <video ref={video} className="scanner-video" playsInline muted hidden />
      <div className="row"><button className="btn primary" onClick={startCam}>◉ Bật camera</button>
        <label className="btn">↑ Chọn ảnh QR<input type="file" accept="image/*" hidden onChange={(e) => fromFile(e.target.files[0])} /></label></div>
      <div className="field" style={{ marginTop: 16 }}><label>Hoặc nhập mã QR</label>
        <div className="row"><input style={{ flex: 1 }} placeholder="SGECHO:dinh-doc-lap" value={code} onChange={(e) => setCode(e.target.value)} /><button className="btn" disabled={!code.trim()} onClick={() => resolve(code)}>Mở địa điểm</button></div></div>
      <button className="text-link" onClick={() => resolve("SGECHO:dinh-doc-lap")}>Thử ngay: Dinh Độc Lập ↗</button>
    </>
  );
}
