async function testUpdate() {
    try {
        // 1. Login as Admin
        console.log('🔑 Logging in...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                employee_id: 'ADMIN001',
                password: 'password123'
            })
        });

        const loginData = await loginRes.json();
        const token = loginData.data.token;
        console.log('✅ Logged in successfully');

        // 2. Update item 1
        console.log('📝 Updating item 1 via API...');
        const updateRes = await fetch('http://localhost:3000/api/diagnosis/systems/items/1', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                title: 'فحص ضغط طرمبة الديزل (API TEST)',
                description: 'وصف محدث',
                estimated_time: '20 دقيقة',
                work_package_content: 'خطوة 1\nخطوة 2',
                required_tools: 'مفتاح 12',
                safety_procedures: 'سلامة API',
                workshop_requirements: 'ورشة API',
                technicians_count: 3
            })
        });

        const updateData = await updateRes.json();
        console.log('✅ Update result:', JSON.stringify(updateData, null, 2));

    } catch (err) {
        console.error('❌ Test failed:', err.message);
    }
}

testUpdate();
