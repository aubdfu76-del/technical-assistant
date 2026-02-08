
async function testApi() {
    const BASE_URL = 'http://localhost:3000';
    const API_URL = 'http://localhost:3000/api';

    try {
        console.log('1. Checking Health...');
        const healthRes = await fetch(`${BASE_URL}/health`);
        const health = await healthRes.json();
        console.log('✅ Health Response:', health);

        console.log('2. Logging in...');
        let loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: 'ADMIN0011', password: 'password123' })
        });

        if (loginRes.status !== 200) {
            console.log('Using fallback password...');
            loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: 'ADMIN0011', password: 'password' })
            });
        }

        const loginData = await loginRes.json();

        if (!loginData.success) {
            console.error('❌ Login Failed:', loginData);
            return;
        }

        const token = loginData.data.token;
        console.log('✅ Login OK.');

        console.log('3. Fetching Vehicles...');
        const vehiclesRes = await fetch(`${API_URL}/vehicles?limit=50`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const vehiclesData = await vehiclesRes.json();

        if (vehiclesData.success) {
            console.log(`✅ Vehicles Fetched: ${vehiclesData.data.length} items`);
            if (vehiclesData.data.length > 0) {
                console.log('Sample:', vehiclesData.data[0].plate_number);
            }
        } else {
            console.error('❌ Failed to fetch vehicles:', vehiclesData);
            console.error('Status Code:', vehiclesRes.status);
        }

    } catch (error) {
        console.error('❌ Test Failed:', error);
    }
}

testApi();
