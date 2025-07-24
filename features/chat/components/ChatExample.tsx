import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useChatActions } from '../store/useChatActions';

/**
 * Example component showing how to use the Zustand chat store
 * instead of the old React Context pattern
 */
export const ChatExample = () => {
  const {
    // State from store
    messages,
    chatRooms,
    currentChatRoom,
    loading,
    error,
    
    // Actions (automatically include user context)
    fetchChatRooms,
    sendMessage,
    setCurrentChatRoom,
    joinChatRoom,
  } = useChatActions();

  // Load chat rooms on mount
  useEffect(() => {
    fetchChatRooms();
  }, [fetchChatRooms]);

  const handleJoinRoom = async (room: any) => {
    try {
      await joinChatRoom(room.id);
      setCurrentChatRoom(room);
    } catch (error) {
      console.error('Failed to join room:', error);
    }
  };

  const handleSendMessage = async () => {
    try {
      await sendMessage('Hello from Zustand!');
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return <Text>Loading...</Text>;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat Rooms</Text>
      
      <FlatList
        data={chatRooms}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.roomItem}
            onPress={() => handleJoinRoom(item)}
          >
            <Text style={styles.roomName}>{item.name}</Text>
            <Text style={styles.roomDescription}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />

      {currentChatRoom && (
        <View style={styles.currentRoom}>
          <Text>Current Room: {currentChatRoom.name}</Text>
          <Text>Messages: {messages.length}</Text>
          
          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendMessage}
          >
            <Text>Send Test Message</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  roomItem: {
    padding: 12,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    borderRadius: 8,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  roomDescription: {
    fontSize: 14,
    color: '#666',
  },
  currentRoom: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e0f7fa',
    borderRadius: 8,
  },
  sendButton: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#2196F3',
    borderRadius: 4,
    alignItems: 'center',
  },
});