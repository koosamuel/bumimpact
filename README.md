# BUM Impact 공개 데모

공사 물량내역서(Bill of Quantities, BOQ)를 바탕으로 자재별 탄소배출량을 계산하고 비용·탄소 대안을 비교하는 신청서용 정적 데모입니다.

## 공개 주소

https://koosamuel.github.io/bumimpact/

## 데모 범위

- 공개 가능한 합성 물량내역서 사용
- 자재별 탄소 기여도 표시
- 기준안·비용 우선안·균형안 비교
- 모바일·태블릿·데스크톱 반응형 화면
- Mac 백엔드 미연결 시 GitHub의 합성 JSON으로 실행되는 정적 데모
- `data/api-config.json`에 공개 FastAPI 주소가 설정되면 실제 계산 엔진 연결

이 저장소에는 Python 계산 엔진, FastAPI 백엔드, SQLite 데이터베이스와 공공데이터 인증키를 포함하지 않습니다. 연결된 Mac 백엔드도 별도의 공개용 SQLite와 합성 fixture만 사용해야 합니다. 화면의 값은 기능 설명을 위한 시범 자료이며 실제 인증·규제·투자 판단에 사용할 수 없습니다.
