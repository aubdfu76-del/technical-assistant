async function testTechnicianRegister() {
    try {
        console.log('Testing Technician Registration Endpoint...');
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                employee_id: 'TECH_TEST_manual_4',
                full_name: 'Tech Manual Test',
                password: 'password123',
                email: 'tech.manual4@example.com',
                phone: '0501111111',
                role: 'technician'
            })
        });

        console.log('Status:', response.status);
        const data = await response.json();
        console.log('Response Data:', JSON.stringify(data, null, 2));

        // Now check the created user in DB
        // (I can't check DB directly from this script easily without pg/driver, so I'll rely on response)

    } catch (error) {
        console.log('Error:', error.message);
    }
}

testTechnicianRegister();
