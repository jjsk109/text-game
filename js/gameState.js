// gameState.js
let currentCountry = null;
let companions = [];

// 나라 관련 getter / setter
export function setCountry(country) {
    currentCountry = country;
}

export function getCountry() {
    return currentCountry;
}

// 동료 관련
export function addCompanion(character) {
    companions.push(character);
}

export function getCompanions() {
    return companions;
}
