# Vercel 배포 안내

## 🚀 빠른 배포 방법

### 옵션 1: Vercel 웹 대시보드 (가장 간단)

1. **GitHub/GitLab에 코드 푸시**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push
   ```

2. **Vercel 대시보드 접속**
   - https://vercel.com 접속 및 로그인
   - "Add New..." → "Project" 클릭
   - Git 저장소 선택 또는 연결

3. **프로젝트 설정**
   - Framework Preset: **Vite** (자동 감지)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Root Directory: `./`

4. **환경 변수 추가**
   - Settings → Environment Variables
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `AIzaSyBQTegE_sDejAAy1ogTVjwQsByqoEpHoak`
   - Environment: Production, Preview, Development 모두 선택

5. **배포 시작**
   - "Deploy" 버튼 클릭

### 옵션 2: Vercel CLI 사용

터미널에서 다음 명령어 실행:

```bash
# 1. 로그인 (브라우저가 열림)
vercel login

# 2. 프로젝트 디렉토리로 이동
cd "c:\Users\AD0883\AI\매장별_외근"

# 3. 배포
vercel --prod
```

**참고**: 첫 배포 시에는 대화형으로 설정을 확인하게 됩니다.

## ✅ 배포 전 확인사항

1. **빌드 테스트**
   ```bash
   npm run build
   ```
   - 오류가 없어야 합니다

2. **환경 변수 확인**
   - `VITE_GEMINI_API_KEY`가 설정되어 있어야 합니다
   - Vercel 대시보드에서 환경 변수를 설정해야 합니다

3. **필수 파일 확인**
   - `vercel.json` ✅
   - `package.json` ✅
   - `vite.config.ts` ✅

## 🔍 배포 후 확인

1. Vercel에서 제공하는 URL로 접속
2. 콘솔에서 에러 확인 (F12 → Console)
3. AI 인사이트 기능이 작동하는지 확인

## ⚙️ 현재 프로젝트 설정

- **Framework**: Vite + React
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **SPA Routing**: `vercel.json`에 rewrites 설정됨

## 🆘 문제 해결

**빌드 실패 시:**
```bash
npm run build
```
로컬에서 먼저 테스트해보세요.

**환경 변수 오류 시:**
- Vercel 대시보드 → Project → Settings → Environment Variables
- `VITE_GEMINI_API_KEY`가 올바르게 설정되어 있는지 확인

**라우팅 오류 시:**
- `vercel.json` 파일의 rewrites 설정 확인
