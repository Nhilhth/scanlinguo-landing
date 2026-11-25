"use strict";

const $ = (selector, scope = document) => scope.querySelector(selector);
const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));
const icon = (name) => '<svg class="icon" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const words = {
  mug: { name: "Mug", label: "Cái cốc", ipa: "/mʌɡ/", meaning: "Cái cốc, cái ly", alt: "Chiếc cốc sứ màu kem có quai", example: "I drink coffee from my mug.", translation: "Tôi uống cà phê bằng chiếc cốc của mình." },
  plant: { name: "Plant", label: "Chậu cây", ipa: "/plænt/", meaning: "Cây, cây cảnh", alt: "Cây xanh trong một chiếc chậu trắng", example: "I water my plant every morning.", translation: "Tôi tưới cây mỗi sáng." },
  laptop: { name: "Laptop", label: "Máy tính", ipa: "/ˈlæp.tɑːp/", meaning: "Máy tính xách tay", alt: "Máy tính xách tay đang mở trên bàn", example: "I study English on my laptop.", translation: "Tôi học tiếng Anh trên máy tính xách tay." }
};
const hasWord = (id) => Object.prototype.hasOwnProperty.call(words, id);
const asset = (name) => "assets/" + name + ".webp";
const groups = { intro: "Làm quen", capture: "Quét & lưu", study: "Ôn tập", stats: "Tiến độ" };
const screens = [
  { id: "onboarding-scan", group: "intro", title: "Học từ đồ vật quanh bạn", desc: "Màn hình mở đầu giới thiệu cách dùng camera để biến một vật quen thuộc thành từ vựng tiếng Anh.", tone: "#ede6fd" },
  { id: "onboarding-cards", group: "intro", title: "Làm quen với flashcard", desc: "Người học khám phá cách lưu từ đã quét, ôn lại bằng flashcard và theo dõi tiến độ.", tone: "#f4e9e0" },
  { id: "home", group: "intro", title: "Trang chủ", desc: "Bắt đầu quét ngay, tìm lại từ vừa học hoặc khám phá từ vựng theo các chủ đề đồ dùng, công nghệ và thiên nhiên.", tone: "#e7eee9" },
  { id: "scan", group: "capture", title: "Quét vật thể", desc: "Đặt đồ vật vào khung ngắm rồi chạm nút chụp. Người học cũng có thể chọn ảnh từ thư viện.", tone: "#e7e5f2" },
  { id: "result", group: "capture", title: "Kết quả nhận diện", desc: "Xem tên tiếng Anh, phiên âm, nghĩa tiếng Việt và câu ví dụ. Nút loa cho phép nghe cách phát âm của từ.", tone: "#f0e9df" },
  { id: "saved", group: "capture", title: "Lưu từ vào bộ thẻ", desc: "Màn hình xác nhận từ vừa lưu và cho phép chuyển sang ôn tập, tiếp tục quét hoặc xem thư viện flashcard.", tone: "#e4eeec" },
  { id: "review", group: "study", title: "Nhìn hình, thử nhớ từ", desc: "Mặt trước của flashcard chỉ hiện ảnh. Người học thử gọi tên đồ vật bằng tiếng Anh trước khi lật thẻ.", tone: "#ece6f6" },
  { id: "answer", group: "study", title: "Lật thẻ xem đáp án", desc: "Đối chiếu câu trả lời với tên tiếng Anh, nghĩa và cách đọc rồi chọn “Chưa nhớ” hoặc “Đã nhớ”.", tone: "#eee7df" },
  { id: "complete", group: "study", title: "Kết quả buổi ôn", desc: "Xem số từ đã nhớ và số từ cần luyện thêm. Từ chưa nhớ có thể được ôn lại ngay trong một lượt mới.", tone: "#e2efe8" },
  { id: "progress", group: "stats", title: "Tiến độ học tập", desc: "Theo dõi chuỗi ngày học, số từ đã học, tỷ lệ ghi nhớ và những chủ đề được ôn nhiều nhất.", tone: "#e5e7f7" }
];

const nav = $("#primary-nav");
const menu = $(".menu-btn");
function setMenu(open) {
  nav.classList.toggle("open", open);
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute("aria-label", open ? "Đóng menu" : "Mở menu");
  menu.innerHTML = icon(open ? "close" : "menu");
}
menu.addEventListener("click", () => setMenu(!nav.classList.contains("open")));
document.addEventListener("click", (event) => {
  if (nav.classList.contains("open") && (!event.target.closest(".site-header") || event.target.closest("a, [data-demo]"))) setMenu(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && nav.classList.contains("open")) {
    setMenu(false);
    menu.focus();
  }
});
window.matchMedia("(min-width: 48rem)").addEventListener("change", (event) => { if (event.matches) setMenu(false); });

function showDialog(dialog) {
  if (dialog.open) return;
  dialog.showModal();
  dialog.scrollTop = 0;
}
function closeDialog(dialog) {
  if (dialog.open) dialog.close();
}
$$("dialog").forEach((dialog) => {
  $("[data-close]", dialog).addEventListener("click", () => closeDialog(dialog));
  dialog.addEventListener("click", (event) => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) closeDialog(dialog);
  });
});

// The gallery preserves the design flow inside each filter.
const rail = $("#screen-rail");
const prevRail = $("#rail-prev");
const nextRail = $("#rail-next");
const screenDialog = $("#screen-dialog");
let visibleScreens = screens;
let screenIndex = 0;
function updateRail() {
  const maximum = Math.max(0, rail.scrollWidth - rail.clientWidth);
  const position = Math.max(0, Math.min(rail.scrollLeft, maximum));
  prevRail.disabled = position <= 2;
  nextRail.disabled = position >= maximum - 2;
  const ratio = rail.clientWidth / Math.max(rail.scrollWidth, 1);
  const thumb = $("#track-thumb");
  thumb.style.width = (Math.min(ratio, 1) * 100) + "%";
  thumb.style.marginLeft = (maximum ? position / maximum * (1 - ratio) * 100 : 0) + "%";
}
function drawGallery(filter) {
  visibleScreens = filter === "all" ? screens : screens.filter((screen) => screen.group === filter);
  rail.innerHTML = visibleScreens.map((screen) =>
    '<button type="button" class="screen-tile" data-screen="' + screen.id + '" aria-label="Xem màn hình ' + screen.title + '">' +
      '<span class="tile-art" style="--tile-tone:' + screen.tone + '"><img src="' + asset(screen.id) + '" alt="" width="780" height="1688" loading="lazy">' +
      '<span class="tile-zoom" aria-hidden="true">' + icon("expand") + '</span></span>' +
      '<span class="tile-caption"><small>' + groups[screen.group] + '</small><strong>' + screen.title + '</strong></span></button>'
  ).join("");
  $("#gallery-count").textContent = visibleScreens.length + " màn hình";
  $$(".filter").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
  rail.scrollLeft = 0;
  updateRail();
  requestAnimationFrame(updateRail);
}
function scrollRail(direction) {
  const card = rail.querySelector(".screen-tile");
  if (!card) return;
  const stride = card.offsetWidth + parseFloat(getComputedStyle(rail).columnGap);
  const visibleCards = Math.max(1, Math.round(rail.clientWidth / stride));
  rail.scrollBy({left: stride * visibleCards * direction, behavior: reducedMotion.matches ? "instant" : "smooth"});
}
function showScreen(index) {
  screenIndex = (index + visibleScreens.length) % visibleScreens.length;
  const screen = visibleScreens[screenIndex];
  const img = $("#lightbox-img");
  img.src = asset(screen.id);
  img.alt = "Màn hình " + screen.title + " của ứng dụng Scanlinguo";
  $("#lightbox-group").textContent = groups[screen.group];
  $("#lightbox-title").textContent = screen.title;
  $("#lightbox-desc").textContent = screen.desc;
  $("#lightbox-count").textContent = (screenIndex + 1) + " / " + visibleScreens.length;
  $("#lightbox-prev").disabled = $("#lightbox-next").disabled = visibleScreens.length < 2;
  showDialog(screenDialog);
}
$(".filters").addEventListener("click", (event) => {
  const button = event.target.closest("[data-filter]");
  if (button) drawGallery(button.dataset.filter);
});
rail.addEventListener("click", (event) => {
  const button = event.target.closest("[data-screen]");
  if (button) showScreen(visibleScreens.findIndex((screen) => screen.id === button.dataset.screen));
});
rail.addEventListener("scroll", updateRail, {passive: true});
new ResizeObserver(updateRail).observe(rail);
prevRail.addEventListener("click", () => scrollRail(-1));
nextRail.addEventListener("click", () => scrollRail(1));
$("#lightbox-prev").addEventListener("click", () => showScreen(screenIndex - 1));
$("#lightbox-next").addEventListener("click", () => showScreen(screenIndex + 1));
screenDialog.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  showScreen(screenIndex + (event.key === "ArrowRight" ? 1 : -1));
});
drawGallery("all");

let player;
let soundButton;
function stopSound() {
  if (player) { player.onended = player.onerror = null; player.pause(); }
  soundButton?.classList.remove("playing");
  player = null;
  soundButton = null;
}
function pronounce(id, button) {
  if (!hasWord(id)) return;
  stopSound();
  const current = new Audio("assets/" + id + ".mp3");
  player = current;
  soundButton = button;
  button.classList.add("playing");
  $("#audio-status").textContent = "Đang phát âm từ " + words[id].name;
  current.onended = () => { if (player === current) stopSound(); };
  current.play().catch(() => {
    if (player !== current) return;
    stopSound();
    $("#audio-status").textContent = "Trình duyệt chưa phát được âm thanh.";
  });
}
document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-sound]");
  if (button) pronounce(button.dataset.sound, button);
});

// Only the small sample deck and its review flags are stored on this device.
const storageKey = "scanlinguo.sample-deck.v1";
const cleanIds = (ids) => Array.isArray(ids) ? Array.from(new Set(ids.filter(hasWord))) : [];
let deck = { saved: [], missed: [] };
function readDeck() {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw === null) return;
    const value = JSON.parse(raw);
    const saved = cleanIds(value?.saved);
    deck = { saved, missed: cleanIds(value?.missed).filter((id) => saved.includes(id)) };
  } catch { /* Private browsing can restrict storage. Keep the current in-memory deck. */ }
}
function writeDeck() { try { localStorage.setItem(storageKey, JSON.stringify(deck)); } catch { /* The session still works in memory. */ } }
readDeck();
window.addEventListener("storage", (event) => {
  if (event.key !== null && event.key !== storageKey) return;
  if (event.newValue === null) deck = { saved: [], missed: [] };
  else readDeck();
});

const demoDialog = $("#demo-dialog");
const demoContent = $("#demo-content");
let selected = "mug";
let scanTimer;
let session = { queue: [], index: 0, missed: [], known: 0 };
function title(text, lang = "vi") {
  return '<h2 id="demo-title" tabindex="-1" lang="' + lang + '">' + text + '</h2>';
}
function action(name, label, symbol, style = "primary") {
  return '<button type="button" class="btn ' + style + '" data-action="' + name + '">' + (symbol ? icon(symbol) : "") + label + '</button>';
}
function textAction(name, label) {
  return '<button type="button" class="text-button" data-action="' + name + '">' + label + '</button>';
}
function audioButton(id) {
  return '<button type="button" class="audio-btn" data-sound="' + id + '" aria-label="Nghe phát âm từ ' + words[id].name + '">' + icon("sound") + '</button>';
}
function photo(id, variant = "", showFocus = false, revealName = true) {
  const alt = revealName ? words[id].alt : "Ảnh vật mẫu cần gọi tên bằng tiếng Anh";
  return '<div class="demo-visual ' + (id === "mug" ? "" : "thumb-object ") + variant + '"><img src="' + asset(id) + '" alt="' + alt + '">' +
    (showFocus ? '<div class="focus-box" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="scan-stripe" aria-hidden="true"></div>' : "") + '</div>';
}
function wordDetails(id, useHeading) {
  const word = words[id];
  const name = useHeading ? title(word.name, "en") : '<strong class="answer-name" lang="en">' + word.name + '</strong>';
  return '<div class="word-head"><div>' + name + '<div class="ipa">' + word.ipa + ' · Danh từ</div></div>' + audioButton(id) + '</div>' +
    '<p class="meaning">' + word.meaning + '</p><div class="example"><b lang="en">' + word.example + '</b><small>' + word.translation + '</small></div>';
}
function renderDemo(html, focusTitle = true) {
  demoContent.innerHTML = html;
  demoDialog.scrollTop = 0;
  if (focusTitle && demoDialog.open) $("#demo-title")?.focus({preventScroll: true});
}
function chooseObject(focusTitle = true) {
  clearTimeout(scanTimer);
  readDeck();
  const choices = Object.entries(words).map(([id, word]) =>
    '<button type="button" class="object-choice" data-object="' + id + '" aria-pressed="' + (id === selected) + '"><img src="' + asset(id) + '" alt="">' + word.label + '</button>'
  ).join("");
  renderDemo(title("Quét vật mẫu") + '<p class="demo-help">Chọn một ảnh mẫu rồi nhấn quét để khám phá từ tiếng Anh.</p>' +
    '<div class="object-options" role="group" aria-label="Chọn vật mẫu">' + choices + '</div>' + photo(selected, "", true) +
    '<div class="demo-bottom">' + action("scan", "Quét vật mẫu", "scan") +
    (deck.saved.length ? textAction("review", "Ôn " + deck.saved.length + " từ đã lưu") : "") + '</div>', focusTitle);
}
function startScan(button) {
  $$(".object-choice", demoContent).forEach((choice) => choice.disabled = true);
  button.disabled = true;
  button.textContent = "Đang quét…";
  $(".demo-visual", demoContent).classList.add("scanning");
  scanTimer = setTimeout(() => {
    if (!demoDialog.open) return;
    renderDemo(photo(selected, "result-img") + wordDetails(selected, true) + '<div class="demo-bottom">' +
      action("save", deck.saved.includes(selected) ? "Xem từ đã lưu" : "Lưu vào flashcard", "cards") + textAction("choose", "Chọn vật mẫu khác") + '</div>');
  }, reducedMotion.matches ? 0 : 620);
}
function saveWord() {
  readDeck();
  const exists = deck.saved.includes(selected);
  if (!exists) { deck.saved.push(selected); writeDeck(); }
  const word = words[selected];
  renderDemo('<div class="state-check">' + icon("check") + '</div>' + title(exists ? "Từ đã có trong bộ thẻ" : "Đã lưu từ mới!") +
    '<p class="demo-help">Bộ thẻ hiện có ' + deck.saved.length + ' từ. Bạn có thể ôn ngay hoặc quét thêm một đồ vật.</p>' +
    '<div class="saved-word"><img src="' + asset(selected) + '" alt=""><span><b lang="en">' + word.name + '</b><small>' + word.meaning + '</small></span></div>' +
    '<div class="demo-bottom">' + action("review", "Ôn tập ngay", "book") + textAction("choose", "Quét thêm đồ vật") + '</div>');
}
function startReview(ids) {
  if (!ids.length) { chooseObject(); return; }
  session = { queue: ids.slice(), index: 0, missed: [], known: 0 };
  reviewFront();
}
function progress() {
  const step = session.index + 1;
  return '<div class="review-progress"><progress aria-label="Tiến độ ôn tập" value="' + step + '" max="' + session.queue.length + '"></progress><span>' + step + '/' + session.queue.length + '</span></div>';
}
function reviewFront() {
  const id = session.queue[session.index];
  renderDemo(title("Ôn tập flashcard") + progress() + photo(id, "", false, false) +
    '<div class="review-prompt"><b>Bạn nhớ từ này không?</b><p class="demo-help">Thử gọi tên đồ vật bằng tiếng Anh trước khi lật thẻ.</p></div>' +
    '<div class="demo-bottom">' + action("flip", "Lật thẻ xem đáp án", "flip") + '</div>');
}
function flipCard() {
  const id = session.queue[session.index];
  renderDemo(title("Đáp án flashcard") + progress() + wordDetails(id, false) +
    '<div class="demo-bottom"><div class="button-row">' + action("forgot", "Chưa nhớ", "", "soft") + action("known", "Đã nhớ", "check") + '</div></div>');
}
function rate(known) {
  const id = session.queue[session.index];
  readDeck();
  // A different tab could have changed the saved deck during this review.
  if (deck.saved.includes(id)) {
    deck.missed = deck.missed.filter((value) => value !== id);
    if (!known) deck.missed.push(id);
    writeDeck();
  }
  if (known) session.known += 1;
  else session.missed.push(id);
  session.index += 1;
  if (session.index < session.queue.length) { reviewFront(); return; }
  const missed = session.missed.length;
  renderDemo('<div class="state-check">' + icon("check") + '</div>' + title("Hoàn thành lượt ôn!") +
    '<p class="demo-help">Bạn đã ôn ' + session.queue.length + ' từ trong lượt này.</p>' +
    '<div class="stat-pair"><div><b>' + session.known + '</b><span>Đã nhớ</span></div><div><b>' + missed + '</b><span>Cần ôn lại</span></div></div>' +
    '<div class="demo-bottom">' + (missed ? action("retry", "Ôn lại " + missed + " từ chưa nhớ", "repeat") + textAction("choose", "Tiếp tục quét") : action("choose", "Tiếp tục quét", "scan")) + textAction("exit", "Về landing page") + '</div>');
}
demoContent.addEventListener("click", (event) => {
  const object = event.target.closest("[data-object]");
  if (object) {
    selected = object.dataset.object;
    chooseObject(false);
    $('[data-object="' + selected + '"]', demoContent).focus({preventScroll: true});
    return;
  }
  const button = event.target.closest("[data-action]");
  if (!button) return;
  switch (button.dataset.action) {
    case "scan": startScan(button); break;
    case "save": saveWord(); break;
    case "choose": chooseObject(); break;
    case "review":
      readDeck();
      startReview([...deck.missed, ...deck.saved.filter((id) => !deck.missed.includes(id))]);
      break;
    case "flip": flipCard(); break;
    case "forgot": rate(false); break;
    case "known": rate(true); break;
    case "retry": startReview(session.missed); break;
    case "exit": closeDialog(demoDialog); break;
  }
});
$$("[data-demo]").forEach((button) => button.addEventListener("click", () => {
  selected = "mug";
  chooseObject(false);
  showDialog(demoDialog);
  $("#demo-title").focus({preventScroll: true});
}));
demoDialog.addEventListener("close", () => { clearTimeout(scanTimer); stopSound(); });
