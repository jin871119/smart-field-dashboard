# Vercel 배포 가이드

## 배포 방법

### 방법 1: Vercel CLI 사용 (권장)

1. **Vercel에 로그인**
   ```bash
   vercel login
   ```

2. **프로젝트 배포**
   ```bash
   vercel
   ```
   
   첫 배포 시:
   - 프로젝트 이름 설정
   - 배포 설정 확인
   - 프로덕션 배포: `vercel --prod`

3. **환경 변수 설정**
   ```bash
   vercel env add VITE_GEMINI_API_KEY
   ```
   
   또는 Vercel 대시보드에서:
   - 프로젝트 → Settings → Environment Variables
   - `VITE_GEMINI_API_KEY` 추가
   - Value: `AIzaSyBQTegE_sDejAAy1ogTVjwQsByqoEpHoak`
   - Environment: Production, Preview, Development 모두 선택

### 방법 2: Vercel 웹 대시보드 사용

1. **GitHub/GitLab/Bitbucket에 코드 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **Vercel 대시보드에서 배포**
   - https://vercel.com 접속
   - "New Project" 클릭
   - Git 저장소 연결
   - 프로젝트 설정:
     - Framework Preset: Vite
     - Build Command: `npm run build`
     - Output Directory: `dist`
   - Environment Variables 추가:
     - `VITE_GEMINI_API_KEY` = `AIzaSyBQTegE_sDejAAy1ogTVjwQsByqoEpHoak`
   - "Deploy" 클릭

## 중요 사항

1. **환경 변수**: `.env.local` 파일은 Git에 커밋되지 않으므로, Vercel 대시보드에서 환경 변수를 반드시 설정해야 합니다.

2. **빌드 확인**: 배포 전 로컬에서 빌드 테스트
   ```bash
   npm run build
   npm run preview
   ```

3. **배포 후 확인**: 
   - AI 현장 분석 리포트가 작동하는지 확인
   - 브라우저 콘솔에서 에러 확인

## 문제 해결

- **API 키 오류**: Vercel 대시보드에서 환경 변수가 올바르게 설정되었는지 확인
- **빌드 실패**: 로컬에서 `npm run build` 실행하여 오류 확인
- **라우팅 오류**: `vercel.json`의 rewrites 설정 확인




