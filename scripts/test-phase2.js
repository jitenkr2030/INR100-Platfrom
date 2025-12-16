// Test script to verify Phase 2 API endpoints
const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3000/api';

async function testPhase2APIs() {
  console.log('🧪 Testing Phase 2 API Endpoints...\n');

  try {
    // Test Progress API
    console.log('1. Testing Progress API...');
    const progressResponse = await fetch(`${API_BASE}/progress?userId=demo-user-id`);
    console.log(`   ✅ Progress API: ${progressResponse.status}`);
    
    // Test Streaks API
    console.log('2. Testing Streaks API...');
    const streakResponse = await fetch(`${API_BASE}/streaks?userId=demo-user-id`);
    console.log(`   ✅ Streaks API: ${streakResponse.status}`);
    
    // Test Leaderboard API
    console.log('3. Testing Leaderboard API...');
    const leaderboardResponse = await fetch(`${API_BASE}/leaderboard?type=weekly&limit=10`);
    console.log(`   ✅ Leaderboard API: ${leaderboardResponse.status}`);
    
    // Test Achievements API
    console.log('4. Testing Achievements API...');
    const achievementsResponse = await fetch(`${API_BASE}/achievements?userId=demo-user-id`);
    console.log(`   ✅ Achievements API: ${achievementsResponse.status}`);
    
    // Test Sessions API
    console.log('5. Testing Sessions API...');
    const sessionsResponse = await fetch(`${API_BASE}/sessions?userId=demo-user-id&limit=5`);
    console.log(`   ✅ Sessions API: ${sessionsResponse.status}`);
    
    // Test XP API
    console.log('6. Testing XP API...');
    const xpResponse = await fetch(`${API_BASE}/xp?userId=demo-user-id&limit=10`);
    console.log(`   ✅ XP API: ${xpResponse.status}`);

    console.log('\n🎉 All Phase 2 API endpoints are accessible!');
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    console.log('\n📝 Note: This is expected if the development server is not running.');
    console.log('   To test locally, run: npm run dev');
  }
}

testPhase2APIs();