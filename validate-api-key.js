require('dotenv').config();

async function validateAPIKey() {
    const apiKey = process.env.GEMINI_API_KEY;

    console.log('\n🔍 Validating Gemini API Key...\n');
    console.log('Key:', apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT FOUND');
    console.log('Length:', apiKey ? apiKey.length : 0, 'characters\n');

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        console.log('❌ API Key not configured\n');
        console.log('Get your key from: https://aistudio.google.com/app/apikey\n');
        return;
    }

    // Test with a simple HTTP request
    console.log('🔄 Testing API key validity...\n');

    try {
        const https = require('https');

        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

        const postData = JSON.stringify({
            contents: [{
                parts: [{
                    text: 'Hello'
                }]
            }]
        });

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': postData.length
            }
        };

        const req = https.request(testUrl, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                if (res.statusCode === 200) {
                    console.log('═══════════════════════════════════════');
                    console.log('✅ SUCCESS! API Key is VALID!');
                    console.log('═══════════════════════════════════════\n');

                    const response = JSON.parse(data);
                    if (response.candidates && response.candidates[0]) {
                        const text = response.candidates[0].content.parts[0].text;
                        console.log('📥 Response from Gemini:');
                        console.log('   ' + text + '\n');
                    }

                    console.log('🎉 Your Gemini AI is ready to use!\n');
                    console.log('Next steps:');
                    console.log('1. Restart the server if needed');
                    console.log('2. Open http://localhost:5173');
                    console.log('3. Go to "المساعد الذكي"');
                    console.log('4. Start asking questions!\n');

                } else {
                    console.log('❌ API Key validation failed\n');
                    console.log('Status:', res.statusCode);
                    console.log('Response:', data, '\n');

                    if (res.statusCode === 400) {
                        console.log('🔴 The API key appears to be invalid or disabled\n');
                        console.log('Solutions:');
                        console.log('1. Go to: https://aistudio.google.com/app/apikey');
                        console.log('2. Check if the key is enabled');
                        console.log('3. Try creating a new key');
                        console.log('4. Make sure you copied the entire key\n');
                    } else if (res.statusCode === 429) {
                        console.log('🔴 Rate limit exceeded');
                        console.log('Wait a few minutes and try again\n');
                    }
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Network error:', error.message, '\n');
            console.log('Check your internet connection\n');
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.log('❌ Error:', error.message, '\n');
    }
}

validateAPIKey();
