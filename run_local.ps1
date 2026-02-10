# سكربت تشغيل النظام على السيرفر المحلي
Write-Host "🚀 جاري تشغيل نظام المساعد الفني الذكي..." -ForegroundColor Green

# 1. تشغيل الباك إند في نافذة منفصلة
Write-Host "📦 تشغيل الخادم الخلفي (Backend)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WorkingDirectory $PSScriptRoot

# الانتظار قليلاً لضمان تشغيل الباك إند
Start-Sleep -Seconds 5

# 2. تشغيل الفرونت إند في نافذة منفصلة مع إتاحته للشبكة (--host)
Write-Host "🌐 تشغيل الواجهة الأمامية (Frontend)..." -ForegroundColor Cyan
Set-Location "$PSScriptRoot/frontend"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev -- --host"

Write-Host "✅ تم التشغيل بنجاح!" -ForegroundColor Green
Write-Host "📝 للوصول من أجهزة أخرى:" -ForegroundColor Yellow
Write-Host "   1. اعرف رقم IP جهازك (اكتب ipconfig في موجه الأوامر)"
Write-Host "   2. استخدم الرابط: http://YOUR_IP:5173"
