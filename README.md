# 두미 · DOOMI

Vanilla HTML/CSS/JS 공개 SPA + 기존 Supabase 어드민/OBS 오버레이.

## 공개 경로

- /#intro: 3분할 사선 이미지 인트로
- /#home: 메인과 기존 프로필·VOD
- /#schedule, /#song, /#upbo: 기존 기능을 유지하는 공개 뷰
- /#home/profile, /#home/message: 메인 내 섹션
- /?embed#schedule: 임베드 진입 예시

각 공개 뷰는 동일 문서에 유지되며 최초 진입 시 데이터 로직을 한 번 초기화한다. 뷰 이동은 화면 가시성·스타일만 전환한다. 검색과 페이지 상태는 유지하고 모달은 닫는다. 재생 중인 VOD는 화면을 떠날 때 중단한다.

옛 /home/, /schedule/, /song/, /upbo/ 주소는 query를 보존하여 해시 화면으로 연결한다. /admin/과 /overlay/는 별도 기능으로 유지한다.

## 에셋 교체

- 인트로: assets/intro/doomi-portrait.png. js/views/intro.js의 INTRO_ART에서 파일과 중심 좌표를 지정한다. 3개 패널 모두 같은 이미지·좌표를 사용한다.
- 메인: assets/main/character.png. 현재는 기존 두미 키비주얼을 사용한다. 투명 배경 세로형 원화로 교체할 수 있다.
- 1.png와 2.png는 로컬 디자인 레퍼런스이며 배포에는 포함하지 않는다.

## 실행

D:/dumi에서 `python -m http.server 8766 --bind 127.0.0.1` 실행 후 http://127.0.0.1:8766 으로 접속한다. 이 정적 서버는 Pages Functions를 실행하지 않으므로 SOOP 프록시 통합 확인은 Cloudflare에서 진행한다. Supabase는 기존 운영 프로젝트에 연결된다.

## 이번 변경의 근거

기준 코드: e80a5c9. 히라 저장소 hira260624-source/hira의 d9a9df7에서 hashchange·뷰 유지·최초 로드 패턴을 확인하고 두미 기능에 맞게 적용했다. 히라 콘텐츠·데이터는 가져오지 않았다.

변경 전 전체 Git 작업 사본과 레퍼런스를 D:/dumi-backups/dumi-before-redesign-20260907-112642.zip에 백업했고, 43개 원본 파일을 대조했다.

## 검증

Chromium에서 5개 화면 렌더, 중복 ID와 런타임 오류 검사, 메인 문서 요청 1회 유지, 뒤로 가기, 검색값 보존, 노래 페이지 넘김, 랜덤 모달 정리, UUID 업보 모달·Escape, 일정 목록 7개와 옛 경로·embed 리다이렉트를 확인했다. 운영 DB를 변경하지 않고 데이터가 필요한 상호작용은 요청 목업으로 검증했다.

추가 검증: 940px 임베드에서 6주 달+7개 일정의 푸터 하단 1716.1px(1800px 이내), 가로 오버플로 없음, 일정 모달 및 동작 줄이기 설정 확인.
