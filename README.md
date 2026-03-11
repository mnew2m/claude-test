# Flowday

> 흐름 있는 하루를 만들어주는 할일 & 습관 트래커

<br>

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | React 19 + TypeScript |
| 빌드 도구 | Vite |
| 스타일링 | Tailwind CSS v4 |
| 라우팅 | React Router v7 |
| 백엔드 / DB | Supabase (Auth + PostgreSQL) |
| 날짜 처리 | date-fns |
| 차트 | Recharts |
| 알림 | Capacitor Local Notifications |
| iOS 배포 | Capacitor |
| ID 생성 | uuid |

<br>

## 주요 기능

- **할일 관리** — CRUD, 반복 설정(매일/매주/매월/커스텀), 카테고리·태그, 마감일
- **캘린더 뷰** — 월간 캘린더로 할일 확인 및 날짜별 추가
- **언젠가 목록** — 마감일 없는 할일 별도 관리
- **습관 트래커** — 일일 체크, 스트릭(연속 기록), 주간 완료 현황
- **통계** — 주간·월간 완료율 차트, 스트릭 순위
- **카테고리** — 할일·습관 분류, 아이콘·색상 커스터마이징
- **다크 / 라이트 모드** — 시스템 설정 연동 + 수동 전환
- **클라우드 동기화** — Supabase 기반 실시간 저장

<br>

## 앱 플로우

```
앱 실행
│
├─ 비로그인 상태
│   └─ 로그인 / 회원가입 화면
│       ├─ 이메일 (아이디 + 도메인 선택)
│       ├─ 비밀번호 입력
│       └─ Supabase Auth 처리 → 메인 진입
│
└─ 로그인 상태
    └─ 하단 탭 네비게이션
        ├─ [할일]
        │   ├─ 리스트 뷰 (필터: 오늘 / 전체 / 예정 / 언젠가 / 완료)
        │   ├─ 캘린더 뷰 (월간 달력 + 날짜별 할일)
        │   ├─ 할일 추가 / 수정 (제목, 설명, 마감일, 반복, 카테고리, 태그, 알림)
        │   ├─ 체크 완료 → 반복 설정 시 다음 항목 자동 생성
        │   └─ 좌로 스와이프 or 휴지통 버튼 → 삭제
        │
        ├─ [습관]
        │   ├─ 활성 습관 목록 (오늘 진행률 표시)
        │   ├─ 체크 버튼으로 오늘 완료 토글
        │   ├─ 스트릭 현황 (현재 / 최고 연속 기록)
        │   ├─ 7일 완료 점 표시
        │   ├─ 습관 추가 / 수정 (이름, 색상, 반복 요일, 카테고리, 알림)
        │   └─ 보관 탭으로 아카이브 관리
        │
        ├─ [통계]
        │   ├─ 할일 완료율 요약 카드
        │   ├─ 습관 완료율 요약 카드
        │   ├─ 주간 / 월간 할일 완료율 막대 차트
        │   ├─ 이번 주 습관 완료율 막대 차트
        │   └─ 습관별 스트릭 순위
        │
        └─ [설정]
            ├─ 프로필 (이메일 표시)
            ├─ 테마 전환 (라이트 / 다크)
            ├─ 카테고리 관리 (추가 / 수정 / 삭제)
            └─ 로그아웃
```

<br>

## 데이터 모델

```
auth.users (Supabase 기본 제공)
    │
    ├── categories
    │     id, user_id, name, color, icon
    │
    ├── todos
    │     id, user_id, category_id, title, description
    │     completed, due_date, completed_at, reminder_time
    │     recurrence_type, recurrence_interval, recurrence_days_of_week
    │     recurrence_day_of_month, recurrence_end_date
    │     parent_id (반복 원본 연결), tags[]
    │
    └── habits
          id, user_id, category_id, title, description
          color, recurrence_type, recurrence_days_of_week
          reminder_time, archived
              │
              └── habit_completions
                    id, habit_id, completed_date
                    UNIQUE(habit_id, completed_date)
```

<br>

## 프로젝트 구조

```
src/
├── types/          TypeScript 타입 정의
├── lib/            Supabase 클라이언트
├── context/        AuthContext, ThemeContext
├── hooks/          useTodos, useHabits, useCategories, useStats
├── pages/          TodosPage, HabitsPage, StatsPage, SettingsPage, AuthPage
├── components/
│   ├── auth/       LoginForm, SignUpForm, EmailInput
│   ├── todo/       TodoList, TodoItem, TodoForm, CalendarView, RecurrencePicker
│   ├── habit/      HabitList, HabitCard, HabitForm, StreakDisplay, WeeklyView
│   ├── stats/      CompletionChart, StreakSummary
│   ├── layout/     AppShell, BottomNav
│   └── common/     Modal, ConfirmDialog, EmptyState, CategoryPicker, TagInput
└── utils/          recurrence.ts, streaks.ts, dateHelpers.ts, notifications.ts
```

<br>

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 Supabase 프로젝트 정보 입력:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. 데이터베이스 설정

Supabase 대시보드 **SQL Editor**에서 실행:

```
supabase/migrations/001_initial_schema.sql
```

### 4. 개발 서버 실행

```bash
npm run dev
```

### 5. iOS 빌드 (macOS + Xcode 필요)

```bash
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

<br>

## 라이선스

MIT
