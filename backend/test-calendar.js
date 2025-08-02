const fetch = require('node-fetch');
require('dotenv').config();

// Test script för att testa kalenderfunktionaliteten
async function testCalendarExport() {
  console.log('🧪 Testar kalenderexport...');

  const testEventData = {
    user_email: 'test@example.com', // Ändra till din email
    event_data: {
      title: 'Test Skift',
      description: 'Detta är ett testskift exporterat från Skiftappen',
      start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Imorgon
      end_time: new Date(Date.now() + 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // 8 timmar senare
      location: 'Testarbetsplats',
      timezone: 'Europe/Stockholm'
    }
  };

  try {
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/calendar/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testEventData),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Kalenderexport lyckades!');
      console.log('📅 Event ID:', result.event_id);
      console.log('🔗 Länk:', result.event_link);
    } else {
      console.log('❌ Kalenderexport misslyckades:');
      console.log('Status:', response.status);
      console.log('Fel:', result.error);
      console.log('Detaljer:', result.details);
    }
  } catch (error) {
    console.error('❌ Nätverksfel:', error.message);
  }
}

// Test för att kontrollera server hälsa
async function testServerHealth() {
  console.log('🏥 Testar server hälsa...');

  try {
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3000'}/health`);
    const result = await response.json();

    if (response.ok) {
      console.log('✅ Server är igång!');
      console.log('Status:', result.status);
      console.log('Tid:', result.timestamp);
    } else {
      console.log('❌ Server problem:', response.status);
    }
  } catch (error) {
    console.error('❌ Kan inte nå servern:', error.message);
    console.log('💡 Kontrollera att backend-servern körs med: npm run dev');
  }
}

// Kör tester
async function runTests() {
  console.log('🚀 Startar tester för Skiftappen Google OAuth...\n');
  
  await testServerHealth();
  console.log('');
  await testCalendarExport();
  
  console.log('\n📋 Nästa steg:');
  console.log('1. Konfigurera Google OAuth i Google Cloud Console');
  console.log('2. Uppdatera .env-filen med dina credentials');
  console.log('3. Logga in via mobilappen eller webbappen');
  console.log('4. Testa kalenderexpert med din riktiga email');
}

// Kör om scriptet anropas direkt
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testCalendarExport,
  testServerHealth
};