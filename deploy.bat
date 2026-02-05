@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   Vercel 배포
echo ========================================

REM 토큰 확인 (환경변수 또는 아래에 직접 입력)
if "%VERCEL_TOKEN%"=="" set VERCEL_TOKEN=여기에_토큰_입력

if "%VERCEL_TOKEN%"=="여기에_토큰_입력" (
    echo [오류] VERCEL_TOKEN을 설정해주세요.
    echo   1. deploy.bat 파일을 열어 12번 줄의 "여기에_토큰_입력"을 실제 토큰으로 변경
    echo   2. 또는 실행 전: set VERCEL_TOKEN=실제토큰
    goto :end
)

REM 손상된 .vercel 폴더 삭제
set "VERCEL_DIR=%~dp0.vercel"
echo 현재 경로: %~dp0

if exist "%VERCEL_DIR%" (
    rd /s /q "%VERCEL_DIR%"
    timeout /t 1 /nobreak >nul
    if exist "%VERCEL_DIR%" (
        echo [경고] .vercel 삭제 실패. 탐색기에서 수동으로 삭제 후 다시 시도하세요.
        echo        경로: %VERCEL_DIR%
        goto :end
    ) else (
        echo .vercel 폴더 삭제 완료.
    )
)

echo.
echo 배포 중...
vercel --token %VERCEL_TOKEN% --prod --yes

echo.
echo ========================================
if %ERRORLEVEL% neq 0 (
    echo 배포 실패. 위 오류 메시지를 확인하세요.
) else (
    echo 배포 완료!
)
echo ========================================

:end
echo.
pause
