require('dotenv').config();
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

console.log('\n🔍 Finding available Gemini models...\n');

// List of models to try
const modelsToTry = [
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-pro-vision'
];

let successCount = 0;

async function testModel(modelName) {
    return new Promise((resolve) => {
        const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

        const postData = JSON.stringify({
            contents: [{
                parts: [{
                    text: 'مرحباً'
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
                    console.log(`✅ ${modelName} - WORKS!`);
                    successCount++;

                    try {
                        const response = JSON.parse(data);
                        if (response.candidates && response.candidates[0]) {
                            const text = response.candidates[0].content.parts[0].text;
                            console.log(`   Response: ${text.substring(0, 50)}...\n`);
                        }
                    } catch (e) { }

                    resolve(modelName);
                } else {
                    console.log(`❌ ${modelName} - Not available (${res.statusCode})`);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.log(`❌ ${modelName} - Error: ${error.message}`);
            resolve(null);
        });

        req.setTimeout(5000, () => {
            console.log(`⏱️  ${modelName} - Timeout`);
            req.destroy();
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
}

async function testAllModels() {
    console.log('Testing models...\n');

    for (const model of modelsToTry) {
        await testModel(model);
        await new Promise(r => setTimeout(r, 500)); // Small delay between requests
    }

    console.log('\n═══════════════════════════════════════');
    if (successCount > 0) {
        console.log(`✅ Found ${successCount} working model(s)!`);
        console.log('═══════════════════════════════════════\n');
        console.log('Update your .env file with a working model name');
        console.log('Example: GEMINI_MODEL=gemini-1.5-flash-latest\n');
    } else {
        console.log('❌ No working models found');
        console.log('═══════════════════════════════════════\n');
        console.log('Possible issues:');
        console.log('1. API key might be invalid');
        console.log('2. API key might not have access to Gemini models');
        console.log('3. Try creating a new API key at:');
        console.log('   https://aistudio.google.com/app/apikey\n');
    }
}

testAllModels();
