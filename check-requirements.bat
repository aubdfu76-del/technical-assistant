@echo off
chcp 65001 >nul
echo.
echo ═══════════════════════════════════════════════════════
echo 🔍 فحص المتطلبات - Intelligent Technical Assistant
echo ═══════════════════════════════════════════════════════
echo.

REM التحقق من Node.js
echo [1/4] التحقق من Node.js...
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js مثبت: %NODE_VERSION%
) else (
    echo ❌ Node.js غير مثبت!
    echo    قم بتحميله من: https://nodejs.org/
    set HAS_ERROR=1
)
echo.

REM التحقق من npm
echo [2/4] التحقق من npm...
where npm >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i
    echo ✅ npm مثبت: v%NPM_VERSION%
) else (
    echo ❌ npm غير مثبت!
    set HAS_ERROR=1
)
echo.

REM التحقق من SQL Server
echo [3/4] التحقق من SQL Server...
sc query MSSQLSERVER >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ SQL Server مثبت ويعمل
) else (
    sc query "MSSQL$SQLEXPRESS" >nul 2>&1
    if %ERRORLEVEL% EQU 0 (
        echo ✅ SQL Server Express مثبت ويعمل
    ) else (
        echo ⚠️  SQL Server غير مثبت أو لا يعمل
        echo    تحقق من تشغيل SQL Server
    )
)
echo.

REM التحقق من المكتبات
echo [4/4] التحقق من المكتبات...
if exist "node_modules\" (
    echo ✅ المكتبات مثبتة
) else (
    echo ⚠️  المكتبات غير مثبتة
    echo    قم بتشغيل: npm install
)
echo.

REM التحقق من ملف .env
echo [إضافي] التحقق من ملف .env...
if exist ".env" (
    echo ✅ ملف .env موجود
    findstr /C:"DB_PASSWORD=YourStrongPassword123!" .env >nul
    if %ERRORLEVEL% EQU 0 (
        echo ⚠️  تحذير: كلمة المرور لم يتم تغييرها!
        echo    عدّل DB_PASSWORD في ملف .env
    ) else (
        echo ✅ كلمة المرور تم تعديلها
    )
) else (
    echo ❌ ملف .env غير موجود!
)
echo.

echo ═══════════════════════════════════════════════════════
if defined HAS_ERROR (
    echo ❌ يوجد متطلبات ناقصة! راجع الأخطاء أعلاه.
) else (
    echo ✅ جميع المتطلبات متوفرة!
    echo.
    echo الخطوات التالية:
    echo   1. تأكد من تنفيذ schema.sql في SSMS
    echo   2. عدّل كلمة المرور في .env
    echo   3. شغل: npm run dev
)
echo ═══════════════════════════════════════════════════════
echo.
pause
