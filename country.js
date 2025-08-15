// contry.js  (※ 가능하면 파일명 country.js 로 교체 권장)
////////////////////////////////////////////////////////////////////////////////
// 목표
// - 전역 최소화(모듈 스코프에 캡슐화)
// - DOM 캐싱 & 중복 바인딩 방지
// - 애니메이션 유무/중복 전환에 안전
// - fetch 에러 방어 & 데이터 정규화
// - 접근성(a11y) 약간 보강
// - 디버그 로깅 토글
////////////////////////////////////////////////////////////////////////////////

/** @typedef {{ name?: string } | string} CountryItem */

const DEBUG = false;

/** =========================
 *  Selectors & DOM Cache
 *  ======================= */
const SEL = {
    historyList: "#history-list",
    countryList: "#country-list",
    panelCountry: "#country-panel",
    panelHistory: "#history-panel",
    backBtn: "#back-btn",
    gonfalon: "#gonfalon",
};

const $ = (sel) => document.querySelector(sel);
const DOM = {
    historyList: $(SEL.historyList),
    countryList: $(SEL.countryList),
    panelCountry: $(SEL.panelCountry),
    panelHistory: $(SEL.panelHistory),
    backBtn: $(SEL.backBtn), // 나중에 null 가드
    gonfalon: $(SEL.gonfalon), // 
};

/** =========================
 *  Local State (module scope)
 *  ======================= */
let _countries = [];          // string[] (정규화된 이름 리스트)
let _history = [];            // string[]
let _isSwapping = false;      // 패널 전환 중복 방지

/** =========================
 *  Utils
 *  ======================= */
function log(...args) {
    if (DEBUG) console.log("[country]", ...args);
}

function safeText(el, text = "") {
    if (el) el.textContent = String(text);
}

function ensureEl(el, label) {
    if (!el) throw new Error(`필수 DOM 요소가 없습니다: ${label}`);
    return el;
}

/**
 * 애니메이션 유무와 상관없이 resolve 보장.
 * - className 부여 → animationend → 클래스 제거는 호출 측에서.
 */
function playOnce(el, className, fallbackMs = 350) {
    return new Promise((resolve) => {
        if (!el) return resolve();
        let resolved = false;

        const onEnd = () => {
            if (resolved) return;
            resolved = true;
            el.removeEventListener("animationend", onEnd);
            resolve();
        };

        el.addEventListener("animationend", onEnd, { once: true });
        el.classList.add(className);

        // 안전장치: CSS 애니메이션이 없거나 이벤트 누락 시
        setTimeout(() => {
            if (resolved) return;
            resolved = true;
            el.removeEventListener("animationend", onEnd);
            resolve();
        }, fallbackMs);
    });
}

/**
 * 패널 전환: from → to
 * - 중복 호출/경합 방지
 * - anim-out → anim-in 순서 보장
 */
async function swapPanels(fromEl, toEl) {
    if (!fromEl || !toEl) return;

    if (_isSwapping || toEl.classList.contains("is-active")) {
        log("swap ignored:", { _isSwapping, toActive: toEl.classList.contains("is-active") });
        return;
    }
    _isSwapping = true;

    try {
        await playOnce(fromEl, "anim-out");
        fromEl.classList.remove("anim-out", "is-active");

        toEl.classList.add("is-active");
        await playOnce(toEl, "anim-in");
        toEl.classList.remove("anim-in");
    } finally {
        _isSwapping = false;
    }
}

/** =========================
 *  Renderers
 *  ======================= */
function renderHistory() {
    const ul = ensureEl(DOM.historyList, SEL.historyList);
    ul.innerHTML = "";
    const frag = document.createDocumentFragment();

    _history.forEach((name, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${name}`;
        frag.appendChild(li);
    });

    ul.appendChild(frag);
}

function renderCountries() {
    const wrap = ensureEl(DOM.countryList, SEL.countryList);
    wrap.innerHTML = "";
    const frag = document.createDocumentFragment();

    _countries.forEach((countrie) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "country-btn";
        btn.textContent = countrie.name;
        btn.setAttribute("aria-label", `나라 선택: ${countrie.name}`);
        btn.addEventListener("click", () => onSelectCountry(countrie), { once: false });
        frag.appendChild(btn);
    });

    wrap.appendChild(frag);
}

/** =========================
 *  Handlers
 *  ======================= */
async function onSelectCountry(countrie) {
    _history.push(countrie.name);
    renderHistory();
    gonfalon.style.backgroundImage = `url("${countrie.image}")`;
    await swapPanels(DOM.panelCountry, DOM.panelHistory);
}

async function backToCountry() {
    await swapPanels(DOM.panelHistory, DOM.panelCountry);
}

/** =========================
 *  Data Loading
 *  ======================= */
async function loadCountriesOnce() {
    if (_countries.length > 0) return; // 최초 1회만

    try {
        const res = await fetch("./story_flow_country.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`나라 목록 로드 실패(${res.status})`);

        /** @type {CountryItem[] | string[]} */
        const raw = await res.json();

        _countries = raw;

        if (_countries.length === 0) throw new Error("정상적인 나라 데이터가 없습니다.");
        log("countries loaded:", _countries);
    } catch (e) {
        // 실패 시 안전한 기본값
        console.warn(e);
        _countries = ["아리안트령", "마왕령", "에덴"];
    }
}

/** =========================
 *  Public API
 *  ======================= */
/**
 * 나라 선택 패널 표시 및 데이터 초기화(최초 1회 로드)
 * - 외부에서 호출: await moveCountry()
 */
export async function moveCountry() {
    // 필수 DOM 존재 보장(초기에 한 번만 검증)
    ensureEl(DOM.panelCountry, SEL.panelCountry);
    ensureEl(DOM.panelHistory, SEL.panelHistory);
    ensureEl(DOM.countryList, SEL.countryList);
    ensureEl(DOM.historyList, SEL.historyList);

    await loadCountriesOnce();
    renderCountries();

    // 나라 선택 패널을 보이도록
    const panel = DOM.panelCountry;
    if (!panel.classList.contains("is-active")) {
        panel.classList.add("is-active", "anim-in");
        // anim-in 제거는 일정 시간 후 처리(transition 완료 보장)
        setTimeout(() => panel.classList.remove("anim-in"), 300);
    }

    // 뒤로가기 버튼 바인딩(중복 방지)
    const backBtn = DOM.backBtn || $(SEL.backBtn);
    if (backBtn && !backBtn.dataset.bound) {
        backBtn.addEventListener("click", backToCountry);
        backBtn.dataset.bound = "1";
    }
}
