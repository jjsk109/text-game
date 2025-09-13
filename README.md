# Text-RPG Game 🎮

> 이세계 판타지 세계관을 기반으로 한 **선택지 기반 텍스트 RPG** 프로젝트입니다.  
> 플레이어는 스탯과 스킬을 선택해 다양한 루트를 경험하며, 마왕 토벌, 신의 심판, 평화로운 여정 등 **멀티 엔딩**을 체험할 수 있습니다.

---

## 📖 Overview

- **프로젝트 목적**: 단순한 텍스트 게임을 넘어, JSON 기반의 스토리 관리 시스템으로 **확장 가능한 멀티 엔딩 RPG** 구현
- **핵심 가치**: 누구나 쉽게 새로운 시나리오를 추가하고, 플레이어는 무한한 분기를 즐길 수 있음
- **대상 사용자**: 게임 개발에 관심 있는 입문자, 선택형 스토리텔링을 즐기는 플레이어

---

## ⚙️ Tech Stack

- **Frontend**: Vanilla JS, HTML, CSS
- **Backend / Hosting**: Firebase, Vercel (고민중)
- **Tools**: Git, VSCode Live Server
- **Data Structure**: JSON 기반 스토리 플로우 (`story_flow.json` + `episodes/`)

---

## ✨ Features

- 🎭 선택지 기반 분기 스토리 (멀티 엔딩 지원)
- 📂 JSON 기반 시나리오 관리 → 스토리 확장성 보장
- 🔊 TTS(Text-to-Speech) 기능 → 몰입감 있는 플레이 (자유도에 따라 바뀔 수 있음)
- 🌍 다국어 지원 (한국어 / 영어)
- 💾 향후 세이브/로드 기능 예정

---

## 📂 Project Structure

```bash
├── story_flow.json      # 기본 스토리 흐름 정의
├── episodes/            # 특별 에피소드 모듈
│   ├── adversary-episode.json
│   └── angel-episode.json
├── index.html           # 메인 진입점
├── app.js               # 게임 로직
└── README.md
```
