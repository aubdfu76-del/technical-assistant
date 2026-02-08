/**
 * Check Gemini Configuration
 * This script helps verify your Gemini API setup
 */

require('dotenv').config();

console.log('🔍 Checking Gemini Configuration...\n');
console.log('═══════════════════════════════════════════════════════════');

const apiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL;

console.log('\n📋 Environment Variables:');
console.log('─────────────────────────────────────────');

if (!apiKey) {
    console.log('❌ GEMINI_API_KEY: NOT FOUND');
    console.log('\n⚠️  The GEMINI_API_KEY is not set in your .env file!');
} else if (apiKey === 'your-gemini-api-key-here') {
    console.log('⚠️  GEMINI_API_KEY: DEFAULT VALUE (not configured)');
    console.log(`   Current value: "${apiKey}"`);
    console.log('\n📝 You need to replace this with your actual API key!');
} else {
    const maskedKey = apiKey.substring(0, 10) + '...' + apiKey.substring(apiKey.length - 4);
    console.log(`✅ GEMINI_API_KEY: Configured`);
    console.log(`   Masked value: ${maskedKey}`);
    console.log(`   Length: ${apiKey.length} characters`);
}

console.log(`\n✅ GEMINI_MODEL: ${model || 'gemini-1.5-flash (default)'}`);

console.log('\n─────────────────────────────────────────');

if (!apiKey || apiKey === 'your-gemini-api-key-here') {
    console.log('\n📝 NEXT STEPS:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n1️⃣  Get your API Key:');
    console.log('   Visit: https://aistudio.google.com/app/apikey');
    console.log('   Click "Create API Key" and copy it');
    console.log('\n2️⃣  Open the .env file in your editor');
    console.log('\n3️⃣  Find this line:');
    console.log('   GEMINI_API_KEY=your-gemini-api-key-here');
    console.log('\n4️⃣  Replace it with:');
    console.log('   GEMINI_API_KEY=YOUR-ACTUAL-KEY-HERE');
    console.log('\n5️⃣  Save the file (Ctrl+S)');
    console.log('\n6️⃣  Restart the server:');
    console.log('   - Stop: Ctrl+C');
    console.log('   - Start: npm run dev');
    console.log('\n7️⃣  Test again:');
    console.log('   npm run test:gemini');
    console.log('\n═══════════════════════════════════════════════════════════\n');
} else {
    console.log('\n✅ Configuration looks good!');
    console.log('\n🧪 Testing API connection...');

    testGeminiConnection(apiKey, model);
}

async function testGeminiConnection(apiKey, model) {
    try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);
        const geminiModel = genAI.getGenerativeModel({ model: model || 'gemini-1.5-flash' });

        console.log('📤 Sending test request to Gemini...\n');

        const result = await geminiModel.generateContent('قل "مرحباً، أنا جاهز للعمل!" باللغة العربية');
        const response = await result.response;
        const text = response.text();

        console.log('═══════════════════════════════════════════════════════════');
        console.log('✅ SUCCESS! Gemini AI is working!');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n📥 Response from Gemini:');
        console.log(`   "${text}"`);
        console.log('\n🎉 Your AI Assistant is ready to use!');
        console.log('\n💡 Next steps:');
        console.log('   1. Make sure the server is running (npm run dev)');
        console.log('   2. Open http://localhost:5173 in your browser');
        console.log('   3. Navigate to "المساعد الذكي" (AI Assistant)');
        console.log('   4. Start asking questions!');
        console.log('\n═══════════════════════════════════════════════════════════\n');

    } catch (error) {
        console.log('\n═══════════════════════════════════════════════════════════');
        console.log('❌ ERROR: Failed to connect to Gemini API');
        console.log('═══════════════════════════════════════════════════════════');
        console.log('\n🔴 Error details:');
        console.log(`   ${error.message}`);
        console.log('\n🔧 Possible solutions:');
        console.log('   1. Check if your API key is correct');
        console.log('   2. Verify you have internet connection');
        console.log('   3. Make sure the API key has proper permissions');
        console.log('   4. Check if you exceeded quota limits');
        console.log('   5. Try creating a new API key');
        console.log('\n📚 For help, visit:');
        console.log('   https://ai.google.dev/docs');
        console.log('\n═══════════════════════════════════════════════════════════\n');
    }
}
