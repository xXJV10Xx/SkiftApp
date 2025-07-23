import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ShiftTradeRequest, shiftApi } from '../lib/api/shiftApi';
import { useTheme } from '../context/ThemeContext';

interface TradeRequestCardProps {
  tradeRequest: ShiftTradeRequest;
  currentUserId: string;
  onInterestShown: (privateChatId: string) => void;
}

export default function TradeRequestCard({ 
  tradeRequest, 
  currentUserId, 
  onInterestShown 
}: TradeRequestCardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  const formatShiftTime = (startTime: string, endTime: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const sameDay = start.toDateString() === end.toDateString();
    
    if (sameDay) {
      return `${start.toLocaleDateString('sv-SE')} ${start.toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${end.toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    } else {
      return `${start.toLocaleDateString('sv-SE')} ${start.toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })} - ${end.toLocaleDateString('sv-SE')} ${end.toLocaleTimeString('sv-SE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return '#4CAF50';
      case 'pending_trade':
        return '#FF9500';
      case 'cancelled':
        return '#F44336';
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bekräftat';
      case 'pending_trade':
        return 'Väntar på byte';
      case 'cancelled':
        return 'Inställt';
      default:
        return status;
    }
  };

  const handleShowInterest = async () => {
    if (loading) return;

    // Kontrollera att användaren inte försöker visa intresse för sitt eget skift
    if (tradeRequest.requesting_user_id === currentUserId) {
      Alert.alert('Fel', 'Du kan inte visa intresse för ditt eget skift');
      return;
    }

    setLoading(true);
    try {
      const response = await shiftApi.showInterest(tradeRequest.id);
      
      Alert.alert(
        'Intresse registrerat!',
        'En privat chatt har skapats för att diskutera skiftbytet.',
        [
          {
            text: 'Gå till chatt',
            onPress: () => onInterestShown(response.data.privateChatId)
          },
          {
            text: 'OK',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      console.error('Error showing interest:', error);
      Alert.alert(
        'Fel',
        error instanceof Error ? error.message : 'Kunde inte registrera intresse'
      );
    } finally {
      setLoading(false);
    }
  };

  const isOwnRequest = tradeRequest.requesting_user_id === currentUserId;
  const shift = tradeRequest.shifts;

  if (!shift) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={[styles.requestType, { color: colors.primary }]}>
            🔄 Skiftbyte
          </Text>
          <View style={styles.statusContainer}>
            <View 
              style={[
                styles.statusDot, 
                { backgroundColor: getStatusColor(shift.status) }
              ]} 
            />
            <Text style={[styles.statusText, { color: colors.textSecondary }]}>
              {getStatusText(shift.status)}
            </Text>
          </View>
        </View>
        {isOwnRequest && (
          <Text style={[styles.ownRequestLabel, { color: colors.textSecondary }]}>
            Ditt skift
          </Text>
        )}
      </View>

      <View style={styles.shiftDetails}>
        <Text style={[styles.shiftTime, { color: colors.text }]}>
          {formatShiftTime(shift.start_time, shift.end_time)}
        </Text>
        
        {shift.position && (
          <Text style={[styles.shiftPosition, { color: colors.textSecondary }]}>
            📋 {shift.position}
          </Text>
        )}
        
        {shift.location && (
          <Text style={[styles.shiftLocation, { color: colors.textSecondary }]}>
            📍 {shift.location}
          </Text>
        )}
      </View>

      {tradeRequest.message && (
        <View style={[styles.messageContainer, { backgroundColor: colors.background }]}>
          <Text style={[styles.messageText, { color: colors.text }]}>
            "{tradeRequest.message}"
          </Text>
        </View>
      )}

      {!isOwnRequest && tradeRequest.status === 'open' && (
        <TouchableOpacity
          style={[
            styles.interestButton,
            { backgroundColor: colors.primary },
            loading && styles.buttonDisabled
          ]}
          onPress={handleShowInterest}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={styles.interestButtonText}>
              Visa intresse
            </Text>
          )}
        </TouchableOpacity>
      )}

      {isOwnRequest && (
        <View style={[styles.ownRequestInfo, { backgroundColor: colors.background }]}>
          <Text style={[styles.ownRequestText, { color: colors.textSecondary }]}>
            💡 Dina teamkamrater kan visa intresse och starta en privat chatt med dig
          </Text>
        </View>
      )}

      <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
        {new Date(tradeRequest.created_at).toLocaleString('sv-SE')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  requestType: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    textTransform: 'capitalize',
  },
  ownRequestLabel: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  shiftDetails: {
    marginBottom: 12,
  },
  shiftTime: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  shiftPosition: {
    fontSize: 14,
    marginBottom: 2,
  },
  shiftLocation: {
    fontSize: 14,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  interestButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  interestButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ownRequestInfo: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  ownRequestText: {
    fontSize: 12,
    lineHeight: 16,
  },
  timestamp: {
    fontSize: 12,
    textAlign: 'right',
  },
});