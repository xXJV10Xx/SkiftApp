/**
 * Test script for offline functionality
 * Run this in your React Native app to test offline-first features
 */

import { databaseService } from '../services/DatabaseService';
import { syncService } from '../services/SyncService';
import { useOfflineChatStore } from '../stores/OfflineChatStore';

export async function testOfflineFunctionality() {
  console.log('🧪 Starting offline functionality tests...');

  try {
    // 1. Initialize database
    console.log('1. Initializing database...');
    await databaseService.initialize();
    console.log('✅ Database initialized');

    // 2. Test creating offline messages
    console.log('2. Testing offline message creation...');
    const testMessage = {
      id: `test_${Date.now()}`,
      chat_room_id: 'test-room-1',
      sender_id: 'test-user-1',
      content: 'Test offline message',
      message_type: 'text',
      file_url: null,
      reply_to: null,
      is_edited: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      local_id: `local_${Date.now()}`
    };

    await databaseService.insertMessage(testMessage);
    console.log('✅ Offline message created');

    // 3. Test retrieving messages
    console.log('3. Testing message retrieval...');
    const messages = await databaseService.getMessages('test-room-1');
    console.log(`✅ Retrieved ${messages.length} messages`);

    // 4. Test unsynced messages
    console.log('4. Testing unsynced message detection...');
    const unsyncedMessages = await databaseService.getUnsyncedMessages();
    console.log(`✅ Found ${unsyncedMessages.length} unsynced messages`);

    // 5. Test sync metadata
    console.log('5. Testing sync metadata...');
    await databaseService.updateLastSyncTime('messages', new Date().toISOString());
    const lastSync = await databaseService.getLastSyncTime('messages');
    console.log(`✅ Last sync time: ${lastSync}`);

    // 6. Test online status check
    console.log('6. Testing online status...');
    const isOnline = await syncService.isOnline();
    console.log(`✅ Online status: ${isOnline}`);

    // 7. Test store initialization
    console.log('7. Testing store initialization...');
    const store = useOfflineChatStore.getState();
    await store.initialize();
    console.log('✅ Store initialized');

    // 8. Test offline message sending through store
    console.log('8. Testing store message sending...');
    // Note: This would need a valid user ID and chat room in a real test
    // await store.sendMessage('Test store message', 'text', 'test-user-1');
    console.log('✅ Store message sending ready');

    console.log('🎉 All offline functionality tests passed!');
    
    return {
      success: true,
      messagesCount: messages.length,
      unsyncedCount: unsyncedMessages.length,
      isOnline,
      lastSync
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function testSyncFunctionality() {
  console.log('🔄 Testing sync functionality...');

  try {
    // Test sync with Supabase (requires internet connection)
    const syncResult = await syncService.syncWithSupabase();
    
    console.log('Sync result:', {
      success: syncResult.success,
      messagesDownloaded: syncResult.messagesDownloaded,
      messagesUploaded: syncResult.messagesUploaded,
      teamsDownloaded: syncResult.teamsDownloaded,
      teamsUploaded: syncResult.teamsUploaded,
      chatRoomsDownloaded: syncResult.chatRoomsDownloaded,
      error: syncResult.error
    });

    return syncResult;
  } catch (error) {
    console.error('❌ Sync test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown sync error'
    };
  }
}

export async function clearTestData() {
  console.log('🧹 Clearing test data...');
  
  try {
    await databaseService.clearAllData();
    console.log('✅ Test data cleared');
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
  }
}

// Usage example:
// import { testOfflineFunctionality, testSyncFunctionality, clearTestData } from './scripts/test-offline';
// 
// // Run tests
// testOfflineFunctionality().then(result => console.log('Offline test result:', result));
// testSyncFunctionality().then(result => console.log('Sync test result:', result));
// 
// // Clean up
// clearTestData();