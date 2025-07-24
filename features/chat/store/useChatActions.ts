import { useAuth } from '../../../context/AuthContext';
import { useChatStore } from './chatStore';

/**
 * Custom hook that provides chat actions with automatic user context
 * This makes it easier to use the chat store without having to pass user ID everywhere
 */
export const useChatActions = () => {
  const { user } = useAuth();
  const store = useChatStore();

  return {
    // State
    ...store,
    
    // Actions with automatic user context
    fetchChatRooms: () => {
      if (user?.id) {
        return store.fetchChatRooms(user.id);
      }
      return Promise.resolve();
    },
    
    sendMessage: (content: string, messageType?: string) => {
      if (user?.id) {
        return store.sendMessage(content, user.id, messageType);
      }
      return Promise.reject(new Error('User not authenticated'));
    },
    
    joinChatRoom: (roomId: string) => {
      if (user?.id) {
        return store.joinChatRoom(roomId, user.id);
      }
      return Promise.reject(new Error('User not authenticated'));
    },
    
    leaveChatRoom: (roomId: string) => {
      if (user?.id) {
        return store.leaveChatRoom(roomId, user.id);
      }
      return Promise.reject(new Error('User not authenticated'));
    },
    
    createChatRoom: (roomData: any) => {
      if (user?.id) {
        return store.createChatRoom(roomData, user.id);
      }
      return Promise.reject(new Error('User not authenticated'));
    },
  };
};