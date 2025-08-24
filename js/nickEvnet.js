/**
 * 이벤트 함수, 변수 관리하는 객체
 * 선언 후 생성
 * 1. 함수를 담아 관리
 * 다른 파일에서 사용 할 수 있도록 하는 방법 찾기
 * 2. 변수를 담아 관리
 * 다른 파일에서 사용 할 수 있도록 하는 방법 찾기
 */

/**
 * 이벤트 관리 객체
 */
// eventBus.js
const eventManager = (() => {
    const map = new Map(); // eventName -> Set<listener>

    function on(name, listener) {
        if (!map.has(name)) map.set(name, new Set());
        map.get(name).add(listener);
        // 구독 해제 함수 반환
        return () => off(name, listener);
    }

    function once(name, listener) {
        const wrapper = (...args) => {
            off(name, wrapper);
            listener(...args);
        };
        return on(name, wrapper);
    }

    function off(name, listener) {
        const set = map.get(name);
        if (!set) return;
        set.delete(listener);
        if (set.size === 0) map.delete(name);
    }

    function emit(name, ...args) {
        const set = map.get(name);
        if (!set) return 0;
        // 핸들러 중 off/once로 변경될 수 있으므로 복사본 순회
        [...set].forEach(fn => fn(...args));
        return set.size;
    }

    function listenerCount(name) {
        return map.get(name)?.size ?? 0;
    }

    return { on, once, off, emit, listenerCount };
})();


/**
 * 변수 관리 객체
 * get,set 필요가 없나?
 */
const DEFAULTS = Object.freeze({
    playerName: "",
    playerScore: 0,
    // 추후 필드는 여기서만 추가
});

const variablesManager = (() => {
    // 모듈 스코프에 은닉
    const state = { ...DEFAULTS };

    // 안전한 얕은 복사(참조 노출 방지). 깊은 구조면 structuredClone 고려
    function get() {
        return { ...state };
    }

    // 부분 업데이트(merge). null/undefined 처리 정책은 필요에 따라 조정
    function set(patch = {}) {
        Object.keys(patch).forEach((k) => {
            const v = patch[k];
            if (v !== undefined) state[k] = v;
        });
    }

    // 원자적 업데이트 헬퍼 (현재 스냅샷 기반 계산)
    function update(updater) {
        const next = updater(get());
        set(next);
    }

    // 초기화가 필요하면
    function reset(overrides = {}) {
        Object.keys(state).forEach(k => delete state[k]);
        Object.assign(state, { ...DEFAULTS, ...overrides });
    }

    return { get, set, update, reset };
})();


export default { eventManager, variablesManager };
