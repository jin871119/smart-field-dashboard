# Vercel 배포 스크립트
# 사용법: .\deploy.ps1
# 또는 토큰 지정: $env:VERCEL_TOKEN="your-token"; .\deploy.ps1

# 손상된 .vercel 폴더 삭제 (오류 "linked project does not have id" 해결)
if (Test-Path .vercel) {
    Remove-Item -Recurse -Force .vercel
    Write-Host ".vercel 폴더를 삭제했습니다." -ForegroundColor Yellow
}

# 배포 실행
if ($env:VERCEL_TOKEN) {
    vercel --token $env:VERCEL_TOKEN --prod --yes
} else {
    vercel --prod --yes
}
