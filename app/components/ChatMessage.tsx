import { View, Text, Image, TouchableOpacity } from 'react-native';
import { useState } from 'react';

interface Message {
  id: string;
  content: string;
  type: string;
  form_type?: string;
  metadata?: any;
  created_at: string;
  user: {
    id: string;
    name: string;
    avatar_url?: string;
  };
}

interface ChatMessageProps {
  message: Message;
  onInterested?: (messageId: string) => void;
}

export default function ChatMessage({ message, onInterested }: ChatMessageProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('sv-SE', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      return date.toLocaleDateString('sv-SE', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const renderFormContent = () => {
    if (message.type !== 'form' || !message.metadata) return null;

    const { form_type, metadata } = message;
    
    switch (form_type) {
      case 'extra_work':
        return (
          <View className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <Text className="font-semibold text-green-800 mb-2">🕐 Extra arbete</Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Datum:</Text> {metadata.date}
            </Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Skift:</Text> {metadata.shift}
            </Text>
            <Text className="text-sm text-gray-700 mt-1">
              <Text className="font-medium">Beskrivning:</Text> {metadata.description}
            </Text>
            {onInterested && (
              <TouchableOpacity
                className="mt-3 bg-green-500 py-2 px-4 rounded-full self-start"
                onPress={() => onInterested(message.id)}
              >
                <Text className="text-white text-sm font-medium">Intresserad</Text>
              </TouchableOpacity>
            )}
          </View>
        );
        
      case 'shift_handover':
        return (
          <View className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <Text className="font-semibold text-orange-800 mb-2">🔄 Skiftöverlämning</Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Från skift:</Text> {metadata.from_shift}
            </Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Till skift:</Text> {metadata.to_shift}
            </Text>
            <Text className="text-sm text-gray-700 mt-1">
              <Text className="font-medium">Status:</Text> {metadata.status}
            </Text>
            <Text className="text-sm text-gray-700 mt-1">
              <Text className="font-medium">Kommentarer:</Text> {metadata.comments}
            </Text>
          </View>
        );
        
      case 'breakdown':
        return (
          <View className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <Text className="font-semibold text-red-800 mb-2">⚠️ Haveri</Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Maskin:</Text> {metadata.machine}
            </Text>
            <Text className="text-sm text-gray-700">
              <Text className="font-medium">Prioritet:</Text> {metadata.priority}
            </Text>
            <Text className="text-sm text-gray-700 mt-1">
              <Text className="font-medium">Problem:</Text> {metadata.problem}
            </Text>
            {metadata.estimated_fix_time && (
              <Text className="text-sm text-gray-700 mt-1">
                <Text className="font-medium">Uppskattad tid:</Text> {metadata.estimated_fix_time}
              </Text>
            )}
          </View>
        );
        
      default:
        return (
          <View className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <Text className="text-sm italic text-gray-600">
              Formulär: {form_type}
            </Text>
            {showDetails && (
              <Text className="text-xs text-gray-500 mt-1">
                {JSON.stringify(metadata, null, 2)}
              </Text>
            )}
          </View>
        );
    }
  };

  return (
    <View className="p-3 border-b border-gray-100">
      <View className="flex-row items-start">
        {/* Profilbild */}
        <View className="mr-3">
          {message.user.avatar_url ? (
            <Image
              source={{ uri: message.user.avatar_url }}
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <View className="w-10 h-10 bg-blue-500 rounded-full items-center justify-center">
              <Text className="text-white font-bold text-sm">
                {message.user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Meddelandeinnehåll */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="font-semibold text-gray-900">
              {message.user.name}
            </Text>
            <Text className="text-xs text-gray-500">
              {formatTime(message.created_at)}
            </Text>
          </View>

          {/* Textmeddelande */}
          {message.type === 'text' && (
            <Text className="text-gray-800 leading-5">
              {message.content}
            </Text>
          )}

          {/* Formulärmeddelande */}
          {message.type === 'form' && (
            <>
              <Text className="text-gray-800 mb-1">
                {message.content}
              </Text>
              {renderFormContent()}
            </>
          )}
        </View>
      </View>
    </View>
  );
}