# ⛳ Golf Tech - AI 골프 자세 분석 PWA

TensorFlow.js 기반의 실시간 골프 스윙 분석 Progressive Web Application입니다.

![Golf Tech Demo](https://images.unsplash.com/photo-1730372609335-beccc002cf44?w=800)

## 🎯 주요 기능

### 1. 체성분 기반 맞춤 분석
- InBody 스타일의 정밀한 체성분 데이터 관리
- BMI, 체지방률, 골격근량, 골밀도, 내장지방 레벨 등 측정
- 체형별 최적화된 스윙 자세 추천

### 2. AI 실시간 포즈 분석
- **TensorFlow.js PoseNet** 모델 기반 관절 인식
- 17개 주요 관절 포인트 실시간 추적
- 어깨 회전각, 골반 회전각, 무릎 굴곡 등 자동 계산
- 실시간 피드백 및 색상 코딩 (정상/개선필요)

### 3. 포토리얼 3D 비주얼
- Unreal Engine 스타일의 사실적인 데모
- 실제 골프 이미지 + AI 오버레이
- 7단계 스윙 시퀀스 (어드레스 → 피니시)
- 그라데이션 글로우 효과 관절 포인트

### 4. 모바일 우선 설계
- 완전한 반응형 디자인
- PWA - 앱처럼 설치 가능
- 오프라인 지원 준비
- 터치 최적화 UI

## 🚀 기술 스택

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4.0
- **AI/ML**: TensorFlow.js (PoseNet)
- **Icons**: Lucide React
- **Build**: Vite
- **State Management**: React Hooks (useState, useEffect)
- **Storage**: LocalStorage

## 📦 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 🎨 주요 컴포넌트

### `/App.tsx`
메인 애플리케이션 컴포넌트 - 탭 네비게이션 및 상태 관리

### `/components/Dashboard.tsx`
홈 대시보드 - 체성분 정보, 분석 요약, 빠른 액션

### `/components/ProfileSetup.tsx`
사용자 체성분 프로필 설정 및 전신 사진 AI 분석

### `/components/VideoCapture.tsx`
골프 스윙 영상 촬영 및 YouTube URL 입력

### `/components/PoseAnalyzer.tsx`
TensorFlow.js 기반 실시간 포즈 분석 엔진

### `/components/VideoPlayer.tsx`
분석 결과 영상 재생 + 스켈레톤 오버레이

### `/components/DemoSimulation.tsx`
포토리얼 3D 스타일 AI 분석 데모 시뮬레이션

### `/components/AnalysisResults.tsx`
AI 분석 결과 리포트 및 개선 제안

## 🎬 데모 시뮬레이션

홈 화면에서 "재생" 버튼을 클릭하면 7단계 골프 스윙 분석을 실시간으로 확인할 수 있습니다:

1. **어드레스** - 기본 자세
2. **테이크어웨이** - 클럽 들기 시작
3. **백스윙 톱** - 최고점
4. **다운스윙** - 하강 시작
5. **임팩트** - 공과 접촉
6. **팔로우스루** - 타격 후
7. **피니시** - 마무리 자세

## 🔬 AI 분석 지표

- ✅ **어깨 회전각** - 최적: 90° 이상
- ✅ **골반 회전각** - 최적: 60° 이상
- ✅ **무릎 굴곡** - 최적: 25-35°
- ✅ **척추 각도** - 최적: 35-40°

## 📱 PWA 기능

- ✅ 홈 화면에 추가 가능
- ✅ 앱과 같은 경험 제공
- ⏳ 오프라인 지원 (개발 중)
- ⏳ 푸시 알림 (개발 중)

## 🎯 로드맵

- [ ] 실제 카메라 촬영 기능 통합
- [ ] YouTube 영상 직접 분석
- [ ] 클라우드 저장소 연동 (Supabase)
- [ ] 프로 골퍼 스윙과 비교 기능
- [ ] 진행 기록 추적 및 통계
- [ ] 소셜 공유 기능
- [ ] 다국어 지원 (English, Japanese)

## 📄 라이선스

MIT License

## 👨‍💻 개발자

**Yoo Jun Seok** ([@lilyth-y](https://github.com/lilyth-y))

## 🙏 크레딧

- 골프 이미지: [Unsplash](https://unsplash.com)
- TensorFlow.js: Google
- UI 컴포넌트: Shadcn/ui
- 아이콘: Lucide

---

**Made with ❤️ for golfers**
