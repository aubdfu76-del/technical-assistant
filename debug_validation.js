const API_URL = 'http://localhost:3000/api';
const ADMIN_CREDENTIALS = {
    employee_id: 'ADMIN001',
    password: 'password123'
};

const FAILED_USER = {
    employee_id: '25252',
    full_name: 'SDS',
    password: 'password123',
    role: 'technician'
};

async function debugValidation() {
    try {
        console.log('🔄 Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ADMIN_CREDENTIALS)
        });
        const loginData = await loginRes.json();
        const token = loginData.data.token;

        console.log('🔄 Attempting to create user that failed for user...');
        const createRes = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(FAILED_USER)
        });

        const createData = await createRes.json();

        console.log('Status:', createRes.status);
        console.log('Response:', JSON.stringify(createData, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

debugValidation();
