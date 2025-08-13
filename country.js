// contry.js
let countries = [];        // ["아리안트령","마왕령","에덴"] 형태 예상
let historyList = [];

function $(sel) { return document.querySelector(sel); }

function playOnce(el, className) {
    return new Promise((resolve) => {
        const onEnd = () => { el.removeEventListener('animationend', onEnd); resolve(); };
        el.addEventListener('animationend', onEnd, { once: true });
        el.classList.add(className);
        // 안전장치: 애니메이션이 없을 때도 resolve
        setTimeout(resolve, 350);
    });
}

async function swapPanels(fromEl, toEl) {
    // 이미 활성화 중이면 무시
    if (toEl.classList.contains('is-active')) return;

    await playOnce(fromEl, 'anim-out');
    fromEl.classList.remove('anim-out', 'is-active');

    toEl.classList.add('is-active');
    await playOnce(toEl, 'anim-in');
    toEl.classList.remove('anim-in');
}

function renderHistory() {
    const ul = $("#history-list");
    ul.innerHTML = "";
    historyList.forEach((name, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${name}`;
        ul.appendChild(li);
    });
}

function renderCountries() {
    const wrap = $("#country-list");
    wrap.innerHTML = "";
    countries.forEach((name) => {
        console.log(name);

        const btn = document.createElement("button");
        btn.textContent = name;
        btn.onclick = () => onSelectCountry(name);
        wrap.appendChild(btn);
    });
}

async function onSelectCountry(name) {
    historyList.push(name);
    renderHistory();

    const from = $("#country-panel");
    const to = $("#history-panel");
    // 패널 전환(페이드아웃 → 페이드인)
    void swapPanels(from, to);
}

async function backToCountry() {
    const from = $("#history-panel");
    const to = $("#country-panel");
    void swapPanels(from, to);
}

// 나라 목록 로딩 + 초기 렌더
export async function moveCountry() {
    // 최초 1회만 로드
    if (countries.length === 0) {
        try {
            const res = await fetch('./story_flow_contry.json');
            countries = await res.json();
            // 방어: JSON이 객체 배열일 수도 있음 → name 필드 추출
            if (Array.isArray(countries) && typeof countries[0] === 'object') {
                countries = countries.map(c => c.name ?? String(c));
                console.log("countries : ", countries);

            }
        } catch (e) {
            // 실패 시 기본값
            countries = ["아리안트령", "마왕령", "에덴"];
        }
    }

    renderCountries();
    // 나라 선택 패널이 보이도록 전환
    const countryPanel = $("#country-panel");
    if (!countryPanel.classList.contains('is-active')) {
        countryPanel.classList.add('is-active');
        countryPanel.classList.add('anim-in');
        setTimeout(() => countryPanel.classList.remove('anim-in'), 300);
    }

    // 뒤로가기 버튼
    const backBtn = $("#back-btn");
    if (backBtn && !backBtn._bound) {
        backBtn.addEventListener('click', backToCountry);
        backBtn._bound = true; // 중복 바인딩 방지
    }
}
