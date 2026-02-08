require('dotenv').config();
const https = require('https');
const fs = require('fs');

const apiKey = process.env.GEMINI_API_KEY;
let output = '';

function log(msg) {
    console.log(msg);
    output += msg + '\n';
}

log('\n🔍 Testing Gemini API...\n');
log('Key: ' + (apiKey ? apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4) : 'NOT FOUND'));

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        log('\nStatus: ' + res.statusCode);

        if (res.statusCode === 200) {
            try {
                const response = JSON.parse(data);
                if (response.models && response.models.length > 0) {
                    log('\n✅ API Key is VALID!\n');
                    log('Available models:');
                    response.models.forEach(model => {
                        log('  - ' + model.name);
                    });

                    // Save recommended model
                    const recommendedModel = response.models[0].name.replace('models/', '');
                    log('\n═══════════════════════════════════════');
                    log('✅ SUCCESS!');
                    log('═══════════════════════════════════════\n');
                    log('Recommended model: ' + recommendedModel);
                    log('\nUpdate your .env file:');
                    log('GEMINI_MODEL=' + recommendedModel);
                    log('\nThen restart: npm run dev\n');

                    // Save to file
                    fs.writeFileSync('gemini-test-result.txt', output);
                    log('Results saved to: gemini-test-result.txt');
                } else {
                    log('\n❌ No models found');
                }
            } catch (e) {
                log('\n❌ Error: ' + e.message);
            }
        } else {
            log('\n❌ Error: ' + res.statusCode);
            log('Response: ' + data.substring(0, 200));
        }

        fs.writeFileSync('gemini-test-result.txt', output);
    });
}).on('error', (error) => {
    log('\n❌ Network error: ' + error.message);
    fs.writeFileSync('gemini-test-result.txt', output);
});
