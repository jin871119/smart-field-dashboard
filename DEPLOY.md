# Vercel 배포 가이드

## 빠른 배포 (Vercel 웹 대시보드 - 권장)

### 1단계: Vercel 웹사이트 접속
https://vercel.com 에 접속하여 로그인

### 2단계: 새 프로젝트 생성
1. "Add New..." → "Project" 클릭
2. Git 저장소를 연결하거나 (GitHub/GitLab/Bitbucket)
3. 또는 "Import Git Repository" 클릭

### 3단계: 프로젝트 설정
- **Framework Preset**: Vite (자동 감지됨)
- **Root Directory**: `./` (기본값)
- **Build Command**: `npm run build` (자동 설정됨)
- **Output Directory**: `dist` (자동 설정됨)
- **Install Command**: `npm install` (자동 설정됨)

### 4단계: 배포
"Deploy" 버튼 클릭

배포가 완료되면 Vercel에서 제공하는 URL로 앱에 접근할 수 있습니다!

---

## 배포 방법

### 방법 1: Vercel CLI 사용

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
   - "Deploy" 클릭

## 중요 사항

1. **환경 변수**: 필요 없음. 데이터는 `public/data/*.json` 정적 파일이며 `python scripts/update_from_kg.py YYYY-MM-DD` 로 갱신한다.

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





