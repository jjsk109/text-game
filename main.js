let story = [];
let currentScene = null;
let flags = {};
let stats = { STR: 0, INT: 0, LUCK: 0 };
let party = [];

let openAIKey = "";

async function loadStory() {
    const res = await fetch('story_flow.json');
    story = await res.json();
    startGame();
}

function startGame() {
    flags = {};
    stats = { STR: 0, INT: 0, LUCK: 0 };
    party = [];
    document.getElementById('ending').innerText = '';
    document.getElementById('restart-btn').style.display = 'none';
    goToScene('scene_god_meeting');
}

function goToScene(sceneId) {
    currentScene = story.find(s => s.scene_id === sceneId);
    if (!currentScene) {
        document.getElementById('scene-id').innerText = '';
        document.getElementById('scene-desc').innerText = '에러: 해당 장면을 찾을 수 없습니다.';
        document.getElementById('choices').innerHTML = '';
        return;
    }
    document.getElementById('scene-id').innerText = `[${currentScene.scene_id}]`;
    document.getElementById('scene-desc').innerText = currentScene.description;
    document.getElementById('choices').innerHTML = '';
    if (currentScene.ending) {
        showEnding(currentScene.ending);
        return;
    }
    if (currentScene.choice) {
        currentScene.choice.forEach((ch) => {
            const btn = document.createElement('button');
            btn.className = 'choice-btn';
            btn.innerText = ch.text;
            btn.dataset.select = ch.next;
            btn.onclick = () => {
                // 능력치/스킬 선택 반영 예시 (원하면 확장)
                if (currentScene.scene_id === 'scene_choose_stats') {
                    if (ch.text.includes('힘')) stats.STR += 50;
                    if (ch.text.includes('마법')) stats.INT += 50;
                    if (ch.text.includes('운')) stats.LUCK += 50;
                }
                // 동료 모집 플래그 예시
                if (currentScene.scene_id === 'scene_find_party' && ch.text.includes('동료')) {
                    flags.joined_party = true;
                    party.push('동료');
                }
                // 길드 등록 플래그 예시
                if (currentScene.scene_id === 'scene_town' && ch.text.includes('모험가 등록')) {
                    flags.joined_guild = true;
                }
                console.log(ch);

                // next가 있으면 무조건 해당 scene_id로 이동
                if (ch.next) {
                    console.log(ch);

                    goToScene(ch.next);
                    return;
                }
                // next가 없고 ending이 있으면 showEnding
                if (ch.ending) {
                    showEnding(ch.ending);
                }
            };
            document.getElementById('choices').appendChild(btn);
        });
    }
}

function showEnding(ending) {
    let endingText = '';
    let isFinal = false;
    if (ending.startsWith('ending_')) isFinal = true;
    if (ending === 'ending_hero') endingText = '당신은 마왕을 토벌하고 영웅이 되었습니다!';
    else if (ending === 'ending_bad') endingText = '마왕 토벌에 실패하고 세상은 어둠에 잠겼습니다...';
    else if (ending === 'ending_peace') endingText = '여러 마을을 여행하며 평화로운 삶을 살았습니다.';
    else if (ending === 'ending_refuse') endingText = '신의 제안을 거절하고 이세계행을 포기했습니다.';
    else endingText = '게임 종료';
    if (isFinal) endingText += '\n\n[마지막 엔딩입니다. 게임이 종료되었습니다.]';
    document.getElementById('ending').innerText = endingText;
    document.getElementById('choices').innerHTML = '';
    document.getElementById('scene-id').innerText = '';
    document.getElementById('scene-desc').innerText = '';
    document.getElementById('restart-btn').style.display = 'block';
}

const 

document.getElementById('restart-btn').onclick = startGame;
loadStory();


