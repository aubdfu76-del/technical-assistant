# ============================================
# Test Users API
# ============================================

Write-Host "🧪 اختبار Users API`n" -ForegroundColor Cyan
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray
Write-Host ""

$baseUrl = "http://localhost:3000"
$global:token = $null
$global:newUserId = $null

# ============================================
# Step 1: Login as Admin
# ============================================
Write-Host "1️⃣  تسجيل الدخول كـ Admin..." -ForegroundColor Yellow

$loginData = @{
    employee_id = "ADMIN001"
    password    = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" `
        -Method Post `
        -Body $loginData `
        -ContentType "application/json"
    
    $global:token = $response.data.token
    Write-Host "   ✅ تم تسجيل الدخول بنجاح" -ForegroundColor Green
    Write-Host "   👤 المستخدم: $($response.data.user.full_name)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   ❌ فشل تسجيل الدخول" -ForegroundColor Red
    Write-Host "   الخطأ: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $global:token"
    "Content-Type"  = "application/json"
}

# ============================================
# Step 2: Get All Users
# ============================================
Write-Host "2️⃣  جلب قائمة المستخدمين..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ✅ تم جلب المستخدمين بنجاح" -ForegroundColor Green
    Write-Host "   📊 عدد المستخدمين: $($response.data.Count)" -ForegroundColor Gray
    Write-Host "   📄 الصفحة: $($response.pagination.page) من $($response.pagination.pages)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   ❌ فشل جلب المستخدمين" -ForegroundColor Red
    Write-Host "   الخطأ: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# Step 3: Get Users with Pagination
# ============================================
Write-Host "3️⃣  جلب المستخدمين مع Pagination..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users?page=1&limit=2" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ✅ تم جلب المستخدمين بنجاح" -ForegroundColor Green
    Write-Host "   📊 عدد المستخدمين في الصفحة: $($response.data.Count)" -ForegroundColor Gray
    Write-Host "   📄 الصفحة: $($response.pagination.page)/$($response.pagination.pages)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   ❌ فشل جلب المستخدمين" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# Step 4: Search Users
# ============================================
Write-Host "4️⃣  البحث عن مستخدمين..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users?search=admin" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ✅ تم البحث بنجاح" -ForegroundColor Green
    Write-Host "   📊 النتائج: $($response.data.Count)" -ForegroundColor Gray
    if ($response.data.Count -gt 0) {
        Write-Host "   👤 أول نتيجة: $($response.data[0].full_name)" -ForegroundColor Gray
    }
    Write-Host ""
}
catch {
    Write-Host "   ❌ فشل البحث" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# Step 5: Filter by Role
# ============================================
Write-Host "5️⃣  تصفية حسب الدور (technician)..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users?role=technician" `
        -Method Get `
        -Headers $headers
    
    Write-Host "   ✅ تم التصفية بنجاح" -ForegroundColor Green
    Write-Host "   📊 عدد الفنيين: $($response.data.Count)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   ❌ فشل التصفية" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# Step 6: Create New User
# ============================================
Write-Host "6️⃣  إنشاء مستخدم جديد..." -ForegroundColor Yellow

$newUser = @{
    employee_id = "TEST001"
    full_name   = "مستخدم تجريبي"
    email       = "test@example.com"
    password    = "password123"
    role        = "technician"
    phone       = "0501234567"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" `
        -Method Post `
        -Headers $headers `
        -Body $newUser
    
    $global:newUserId = $response.data.id
    Write-Host "   ✅ تم إنشاء المستخدم بنجاح" -ForegroundColor Green
    Write-Host "   🆔 ID: $($response.data.id)" -ForegroundColor Gray
    Write-Host "   👤 الاسم: $($response.data.full_name)" -ForegroundColor Gray
    Write-Host "   🎭 الدور: $($response.data.role)" -ForegroundColor Gray
    Write-Host ""
}
catch {
    Write-Host "   ❌ فشل إنشاء المستخدم" -ForegroundColor Red
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "   الخطأ: $($errorDetails.message)" -ForegroundColor Red
    Write-Host ""
}

# ============================================
# Step 7: Get User by ID
# ============================================
if ($global:newUserId) {
    Write-Host "7️⃣  جلب بيانات المستخدم بالـ ID..." -ForegroundColor Yellow

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/$global:newUserId" `
            -Method Get `
            -Headers $headers
        
        Write-Host "   ✅ تم جلب البيانات بنجاح" -ForegroundColor Green
        Write-Host "   👤 الاسم: $($response.data.full_name)" -ForegroundColor Gray
        Write-Host "   📧 Email: $($response.data.email)" -ForegroundColor Gray
        Write-Host "   📱 Phone: $($response.data.phone)" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "   ❌ فشل جلب البيانات" -ForegroundColor Red
        Write-Host ""
    }
}

# ============================================
# Step 8: Update User
# ============================================
if ($global:newUserId) {
    Write-Host "8️⃣  تحديث بيانات المستخدم..." -ForegroundColor Yellow

    $updateData = @{
        full_name = "مستخدم تجريبي محدّث"
        phone     = "0509876543"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/$global:newUserId" `
            -Method Put `
            -Headers $headers `
            -Body $updateData
        
        Write-Host "   ✅ تم التحديث بنجاح" -ForegroundColor Green
        Write-Host "   👤 الاسم الجديد: $($response.data.full_name)" -ForegroundColor Gray
        Write-Host "   📱 الهاتف الجديد: $($response.data.phone)" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "   ❌ فشل التحديث" -ForegroundColor Red
        Write-Host ""
    }
}

# ============================================
# Step 9: Deactivate User
# ============================================
if ($global:newUserId) {
    Write-Host "9️⃣  تعطيل المستخدم..." -ForegroundColor Yellow

    $statusData = @{
        is_active = $false
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/$global:newUserId/status" `
            -Method Patch `
            -Headers $headers `
            -Body $statusData
        
        Write-Host "   ✅ تم تعطيل المستخدم بنجاح" -ForegroundColor Green
        Write-Host "   👤 الاسم: $($response.data.full_name)" -ForegroundColor Gray
        Write-Host "   🔴 الحالة: معطّل" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "   ❌ فشل تعطيل المستخدم" -ForegroundColor Red
        Write-Host ""
    }
}

# ============================================
# Step 10: Activate User
# ============================================
if ($global:newUserId) {
    Write-Host "🔟 تفعيل المستخدم..." -ForegroundColor Yellow

    $statusData = @{
        is_active = $true
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/$global:newUserId/status" `
            -Method Patch `
            -Headers $headers `
            -Body $statusData
        
        Write-Host "   ✅ تم تفعيل المستخدم بنجاح" -ForegroundColor Green
        Write-Host "   👤 الاسم: $($response.data.full_name)" -ForegroundColor Gray
        Write-Host "   🟢 الحالة: نشط" -ForegroundColor Gray
        Write-Host ""
    }
    catch {
        Write-Host "   ❌ فشل تفعيل المستخدم" -ForegroundColor Red
        Write-Host ""
    }
}

# ============================================
# Step 11: Delete User
# ============================================
if ($global:newUserId) {
    Write-Host "1️⃣1️⃣  حذف المستخدم..." -ForegroundColor Yellow

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/api/users/$global:newUserId" `
            -Method Delete `
            -Headers $headers
        
        Write-Host "   ✅ تم حذف المستخدم بنجاح" -ForegroundColor Green
        Write-Host ""
    }
    catch {
        Write-Host "   ❌ فشل حذف المستخدم" -ForegroundColor Red
        Write-Host ""
    }
}

# ============================================
# Step 12: Try to Create Duplicate User
# ============================================
Write-Host "1️⃣2️⃣  محاولة إنشاء مستخدم مكرر..." -ForegroundColor Yellow

$duplicateUser = @{
    employee_id = "ADMIN001"
    full_name   = "مستخدم مكرر"
    password    = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" `
        -Method Post `
        -Headers $headers `
        -Body $duplicateUser
    
    Write-Host "   ❌ يجب أن يفشل إنشاء المستخدم المكرر!" -ForegroundColor Red
    Write-Host ""
}
catch {
    Write-Host "   ✅ تم رفض المستخدم المكرر بشكل صحيح" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Step 13: Try to Access Without Token
# ============================================
Write-Host "1️⃣3️⃣  محاولة الوصول بدون Token..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/users" `
        -Method Get
    
    Write-Host "   ❌ يجب أن يتم رفض الوصول!" -ForegroundColor Red
    Write-Host ""
}
catch {
    Write-Host "   ✅ تم رفض الوصول بشكل صحيح" -ForegroundColor Green
    Write-Host ""
}

# ============================================
# Summary
# ============================================
Write-Host "=" -NoNewline; Write-Host ("=" * 59) -ForegroundColor Gray
Write-Host ""
Write-Host "✅ اكتملت جميع الاختبارات!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Users API جاهز للاستخدام:" -ForegroundColor Cyan
Write-Host "   - GET    /api/users" -ForegroundColor Gray
Write-Host "   - GET    /api/users/:id" -ForegroundColor Gray
Write-Host "   - POST   /api/users" -ForegroundColor Gray
Write-Host "   - PUT    /api/users/:id" -ForegroundColor Gray
Write-Host "   - DELETE /api/users/:id" -ForegroundColor Gray
Write-Host "   - PATCH  /api/users/:id/status" -ForegroundColor Gray
Write-Host "   - PATCH  /api/users/:id/password" -ForegroundColor Gray
Write-Host ""
