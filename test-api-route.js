const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/repair/media/999999', // Random ID
    method: 'DELETE',
};

console.log('🔍 Testing DELETE route availability...');

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    if (res.statusCode === 404) {
        console.log('❌ Route NOT FOUND (Server not updated yet)');
    } else if (res.statusCode === 401) {
        console.log('✅ Route EXISTS (Got 401 Unauthorized, which means endpoint is there)');
    } else {
        console.log(`ℹ️ Route responded with ${res.statusCode} (Endpoint exists)`);
    }
});

req.on('error', (e) => {
    console.error(`❌ Connection Error: ${e.message}`);
});

req.end();
