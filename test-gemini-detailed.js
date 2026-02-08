require('dotenv').config();

async function testGemini() {
    console.log('\n🧪 Testing Gemini AI Connection...\n');

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your-gemini-api-key-here') {
        console.log('❌ API Key not configured properly');
        return;
    }

    console.log('✅ API Key found:', apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4));
    console.log('📏 Key length:', apiKey.length, 'characters\n');

    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');

        console.log('🔄 Initializing Gemini...');
        const genAI = new GoogleGenerativeAI(apiKey);

        console.log('🔄 Creating model instance...');
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash'
        });

        console.log('🔄 Sending test prompt...\n');

        const prompt = 'قل "مرحباً، أنا جاهز!" باللغة العربية فقط';
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('═══════════════════════════════════════');
        console.log('✅ SUCCESS! Gemini AI is working!');
        console.log('═══════════════════════════════════════\n');
        console.log('📥 Response from Gemini:');
        console.log('   ' + text);
        console.log('\n🎉 Your AI Assistant is ready!\n');
        console.log('Next steps:');
        console.log('1. Server is running at http://localhost:3000');
        console.log('2. Frontend is at http://localhost:5173');
        console.log('3. Go to "المساعد الذكي" page');
        console.log('4. Start asking questions!\n');

    } catch (error) {
        console.log('\n═══════════════════════════════════════');
        console.log('❌ ERROR connecting to Gemini');
        console.log('═══════════════════════════════════════\n');
        console.log('Error type:', error.constructor.name);
        console.log('Error message:', error.message);

        if (error.message.includes('API_KEY_INVALID')) {
            console.log('\n🔴 The API key appears to be invalid');
            console.log('\nSolutions:');
            console.log('1. Go to: https://aistudio.google.com/app/apikey');
            console.log('2. Delete the old key');
            console.log('3. Create a new API key');
            console.log('4. Copy it to .env file');
            console.log('5. Make sure there are no spaces or quotes');
        } else if (error.message.includes('models/gemini-1.5-flash')) {
            console.log('\n🔴 Model not available with this key');
            console.log('\nTrying alternative model...\n');
            await tryAlternativeModel(apiKey);
        } else if (error.message.includes('quota')) {
            console.log('\n🔴 API quota exceeded');
            console.log('Wait a few minutes and try again');
        } else {
            console.log('\n🔴 Unknown error');
            console.log('Full error:', error);
        }
    }
}

async function tryAlternativeModel(apiKey) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        console.log('🔄 Trying gemini-pro model...');
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const result = await model.generateContent('Say hello in Arabic');
        const response = await result.response;
        const text = response.text();

        console.log('✅ SUCCESS with gemini-pro!');
        console.log('Response:', text);
        console.log('\n💡 Update your .env file:');
        console.log('   GEMINI_MODEL=gemini-pro');

    } catch (err) {
        console.log('❌ gemini-pro also failed:', err.message);
    }
}

testGemini();
