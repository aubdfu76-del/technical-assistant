require('dotenv').config();

const apiKey = process.env.GEMINI_API_KEY;

console.log('\n=== Gemini Configuration Check ===\n');

if (!apiKey) {
    console.log('Status: API Key NOT FOUND in .env file');
} else if (apiKey === 'your-gemini-api-key-here') {
    console.log('Status: API Key is still the DEFAULT value');
    console.log('\nYou need to:');
    console.log('1. Open .env file');
    console.log('2. Replace: GEMINI_API_KEY=your-gemini-api-key-here');
    console.log('3. With: GEMINI_API_KEY=YOUR-ACTUAL-KEY');
    console.log('4. Save the file (Ctrl+S)');
    console.log('5. Restart server: npm run dev');
} else {
    const masked = apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
    console.log('Status: API Key is CONFIGURED');
    console.log('Masked Key:', masked);
    console.log('Length:', apiKey.length, 'characters');
    console.log('\nTesting connection...');

    testConnection();
}

async function testConnection() {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const result = await model.generateContent('Say hello in Arabic');
        const response = await result.response;
        const text = response.text();

        console.log('\nSUCCESS! Gemini responded:');
        console.log(text);
        console.log('\nYour AI is ready to use!');
    } catch (error) {
        console.log('\nERROR:', error.message);
        console.log('\nCheck:');
        console.log('- API key is correct');
        console.log('- Internet connection');
        console.log('- API quota limits');
    }
}
