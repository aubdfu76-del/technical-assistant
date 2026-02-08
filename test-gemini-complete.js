require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('\n🔍 Testing Gemini API Key with different endpoints...\n');
console.log('Key:', apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT FOUND');
console.log('Length:', apiKey ? apiKey.length : 0, 'characters\n');

// Test 1: List available models
function listModels() {
    return new Promise((resolve) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

        https.get(url, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log('📋 Listing available models...');
                console.log('Status:', res.statusCode);

                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        if (response.models && response.models.length > 0) {
                            console.log('\n✅ Available models:');
                            response.models.forEach(model => {
                                console.log(`   - ${model.name}`);
                            });
                            console.log('');
                            resolve(response.models);
                        } else {
                            console.log('❌ No models found\n');
                            resolve([]);
                        }
                    } catch (e) {
                        console.log('❌ Error parsing response:', e.message, '\n');
                        resolve([]);
                    }
                } else {
                    console.log('❌ Error:', res.statusCode);
                    console.log('Response:', data.substring(0, 200), '\n');
                    resolve([]);
                }
            });
        }).on('error', (error) => {
            console.log('❌ Network error:', error.message, '\n');
            resolve([]);
        });
    });
}

// Test 2: Try generating content with first available model
async function testGeneration(modelName) {
    return new Promise((resolve) => {
        const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${apiKey}`;

        const postData = JSON.stringify({
            contents: [{
                parts: [{
                    text: 'قل مرحباً بالعربية'
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

        const req = https.request(url, options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                console.log(`🧪 Testing ${modelName}...`);
                console.log('Status:', res.statusCode);

                if (res.statusCode === 200) {
                    try {
                        const response = JSON.parse(data);
                        if (response.candidates && response.candidates[0]) {
                            const text = response.candidates[0].content.parts[0].text;
                            console.log('✅ SUCCESS!');
                            console.log('Response:', text);
                            console.log('');
                            resolve(true);
                        }
                    } catch (e) {
                        console.log('❌ Error parsing response\n');
                        resolve(false);
                    }
                } else {
                    console.log('❌ Failed:', data.substring(0, 100), '\n');
                    resolve(false);
                }
            });
        });

        req.on('error', (error) => {
            console.log('❌ Error:', error.message, '\n');
            resolve(false);
        });

        req.write(postData);
        req.end();
    });
}

async function main() {
    // Step 1: List available models
    const models = await listModels();

    if (models.length > 0) {
        console.log('═══════════════════════════════════════');
        console.log('🎉 API Key is VALID!');
        console.log('═══════════════════════════════════════\n');

        // Step 2: Test first model
        console.log('Testing content generation...\n');
        const firstModel = models[0].name;
        const success = await testGeneration(firstModel);

        if (success) {
            console.log('═══════════════════════════════════════');
            console.log('✅ Gemini AI is fully working!');
            console.log('═══════════════════════════════════════\n');
            console.log('Recommended model:', firstModel);
            console.log('\nUpdate your .env file:');
            console.log(`GEMINI_MODEL=${firstModel.replace('models/', '')}\n`);
            console.log('Then restart the server: npm run dev\n');
        }
    } else {
        console.log('═══════════════════════════════════════');
        console.log('❌ API Key Issue');
        console.log('═══════════════════════════════════════\n');
        console.log('Possible problems:');
        console.log('1. API key is invalid or expired');
        console.log('2. Generative Language API is not enabled');
        console.log('3. API key restrictions are blocking access\n');
        console.log('Solutions:');
        console.log('1. Go to: https://aistudio.google.com/app/apikey');
        console.log('2. Delete old key and create a new one');
        console.log('3. Enable API at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
        console.log('4. Make sure there are no API restrictions\n');
    }
}

main();
