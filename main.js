import { moveCountry } from "./country.js";

/** =========================
 *  Constants & Types
 *  ========================= */
const SCENE_ID = {
    GOD_MEETING: "scene_god_meeting",
    INTRO_0: "intro_0",
    INTRO_1: "intro_1",
    INTRO_2: "intro_2",
    CHOOSE_STATS: "scene_choose_stats",
    CHOOSE_SKILL: "scene_choose_skill",
};

const ENDING_ID = {
    HERO: "ending_hero",
    BAD: "ending_bad",
    PEACE: "ending_peace",
    REFUSE: "ending_refuse",
};

const NON_COUNTRY_SCENES = new Set([
    SCENE_ID.GOD_MEETING,
    SCENE_ID.INTRO_0,
    SCENE_ID.INTRO_1,
    SCENE_ID.INTRO_2,
    SCENE_ID.CHOOSE_STATS,
    SCENE_ID.CHOOSE_SKILL,
]);

/** =========================
 *  State
 *  ========================= */
const GameState = {
    story: [],
    sceneIndex: new Map(), // scene_id -> scene
    currentScene: null,
    flags: {},
    stats: { STR: 0, INT: 0, LUCK: 0 },
    party: [],
};

/** =========================
 *  DOM Cache
 *  ========================= */
const $ = (id) => document.getElementById(id);
const dom = {
    sceneId: $("scene-id"),
    sceneDesc: $("scene-desc"),
    choices: $("choices"),
    ending: $("ending"),
    restartBtn: $("restart-btn"),
    stage: $("stage"),
};

/** =========================
 *  Utilities
 *  ========================= */
function safeSetText(el, text = "") {
    if (!el) return;

    el.innerText = text;

    // TTS (Text-to-Speech) 실행
    if ('speechSynthesis' in window) {
        console.log(text);
        const voices = speechSynthesis.getVoices();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ko-KR";  // 한국어
        utterance.rate = 1;      // 말 속도 (0.1 ~ 10, 기본값 1)
        utterance.pitch = 0.2;   // 높낮이 (0 ~ 2)
        // 남자 목소리 우선 선택 (이름에 'Male', '남성', 'man' 들어간 경우)
        const maleVoice = voices.find(v =>
            v.lang.startsWith("ko") && (
                v.name.toLowerCase().includes("male") ||
                v.name.includes("남성") ||
                v.name.toLowerCase().includes("man")
            )
        );

        if (maleVoice) {
            utterance.voice = maleVoice;
        }
        speechSynthesis.cancel(); // 이전 음성 중단
        speechSynthesis.speak(utterance);
    } else {
        console.warn("TTS 지원 안됨");
    }
}

function clearChoices() {
    if (!dom.choices) return;
    dom.choices.innerHTML = "";
}

function setStageHidden(hidden) {
    if (!dom.stage) return;
    dom.stage.classList.toggle("none", hidden);
}

function withFadeTransition(next) {
    // 예) 페이드 아웃 -> next() -> 페이드 인
    // 여기서 transition class를 add/remove 하도록 구현
    next();
}

/** =========================
 *  Data Loading
 *  ========================= */
async function loadStory() {
    try {
        const res = await fetch("story_flow.json", { cache: "no-store" });
        if (!res.ok) throw new Error(`스토리 로드 실패 (${res.status})`);
        const story = await res.json();
        if (!Array.isArray(story)) throw new Error("스토리 형식 오류");

        GameState.story = story;
        GameState.sceneIndex = new Map(story.map((s) => [s.scene_id, s]));
        startGame();
    } catch (err) {
        safeSetText(dom.sceneDesc, `에러: ${err.message}`);
        if (dom.restartBtn) dom.restartBtn.style.display = "block";
    }
}

/** =========================
 *  Game Lifecycle
 *  ========================= */
function resetState() {
    GameState.flags = {};
    GameState.stats = { STR: 0, INT: 0, LUCK: 0 };
    GameState.party = [];
}

function startGame() {
    resetState();
    safeSetText(dom.ending, "");
    if (dom.restartBtn) dom.restartBtn.style.display = "none";
    goToScene(SCENE_ID.GOD_MEETING);
}

/** =========================
 *  Scene Rendering
 *  ========================= */
function getScene(sceneId) {
    return GameState.sceneIndex.get(sceneId);
}

function goToScene(sceneId) {
    const nextScene = getScene(sceneId);
    if (!nextScene) {
        renderError("해당 장면을 찾을 수 없습니다.");
        return;
    }

    GameState.currentScene = nextScene;

    // safeSetText(dom.sceneId, `[${nextScene.scene_id}]`);
    safeSetText(dom.sceneDesc, nextScene.description || "");
    clearChoices();

    if (nextScene.ending) {
        showEnding(nextScene.ending);
        return;
    }

    renderChoices(nextScene);
}

function renderChoices(scene) {
    if (!Array.isArray(scene.choice) || scene.choice.length === 0) {
        // 선택지가 없을 때의 처리 (안내)
        safeSetText(dom.sceneDesc, (scene.description || "") + "\n(선택지가 없습니다)");
        return;
    }

    const frag = document.createDocumentFragment();

    scene.choice.forEach((ch) => {
        const btn = document.createElement("button");
        btn.className = "choice-btn";
        btn.type = "button";
        btn.innerText = ch.text;
        btn.setAttribute("aria-label", ch.text);

        btn.addEventListener("click", async () => {
            applyChoiceEffects(scene, ch);

            // 다음 장면으로 이동하기 전에 국가 전환 연출 판단
            const nextId = ch.next;
            if (nextId && !NON_COUNTRY_SCENES.has(nextId)) {
                // moveCountry가 비동기라면 await
                // 의도적으로 fire-and-forget이면 주석으로 남김
                await moveCountry().catch(() => {/* 연출 실패 무시 */ });
                // 전환 중 화면 잠깐 숨기거나 트랜지션
                setStageHidden(true);
            }

            if (nextId) {
                goToScene(nextId);
                setStageHidden(false);
                return;
            }

            if (ch.ending) {
                showEnding(ch.ending);
                return;
            }

            // 둘 다 없으면 사용자에게 알림
            alert("다음 분기(next/ending)가 정의되지 않았습니다.");
        });

        frag.appendChild(btn);
    });

    dom.choices.appendChild(frag);
}

/** =========================
 *  Choice Effects
 *  ========================= */
function applyChoiceEffects(scene, choice) {
    // 데이터 주도 개선 권장: choice.effects = [{ stat: 'STR', delta: 50 }]
    if (scene.scene_id === SCENE_ID.CHOOSE_STATS) {
        const t = choice.text;
        if (t.includes("힘")) GameState.stats.STR += 50;
        if (t.includes("마법")) GameState.stats.INT += 50;
        if (t.includes("운")) GameState.stats.LUCK += 50;
    }

    if (scene.scene_id === "scene_find_party" && choice.text.includes("동료")) {
        GameState.flags.joined_party = true;
        GameState.party.push("동료");
    }

    if (scene.scene_id === "scene_town" && choice.text.includes("모험가 등록")) {
        GameState.flags.joined_guild = true;
    }
}

/** =========================
 *  Ending
 *  ========================= */
function showEnding(endingId) {
    const map = {
        [ENDING_ID.HERO]: "당신은 마왕을 토벌하고 영웅이 되었습니다!",
        [ENDING_ID.BAD]: "마왕 토벌에 실패하고 세상은 어둠에 잠겼습니다...",
        [ENDING_ID.PEACE]: "여러 마을을 여행하며 평화로운 삶을 살았습니다.",
        [ENDING_ID.REFUSE]: "신의 제안을 거절하고 이세계행을 포기했습니다.",
    };

    let text = map[endingId] ?? "게임 종료";
    const isFinal = String(endingId).startsWith("ending_");
    if (isFinal) text += "\n\n[마지막 엔딩입니다. 게임이 종료되었습니다.]";

    safeSetText(dom.ending, text);
    clearChoices();
    safeSetText(dom.sceneId, "");
    safeSetText(dom.sceneDesc, "");
    if (dom.restartBtn) dom.restartBtn.style.display = "block";
}

/** =========================
 *  Error
 *  ========================= */
function renderError(msg) {
    safeSetText(dom.sceneId, "");
    safeSetText(dom.sceneDesc, `에러: ${msg}`);
    clearChoices();
    if (dom.restartBtn) dom.restartBtn.style.display = "block";
}

/** =========================
 *  Init
 *  ========================= */
dom.restartBtn?.addEventListener("click", startGame);
loadStory();
