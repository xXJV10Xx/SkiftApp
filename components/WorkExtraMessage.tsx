import { Calendar, Clock, MapPin, MessageCircle, User, Users } from 'lucide-react-native';
import React from 'react';
import {
    Alert,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { WorkExtraRequest } from './WorkExtraForm';

interface WorkExtraMessageProps {
  data: WorkExtraRequest;
  onInterestedInWork?: (requestId: string, requesterId: string) => void;
  isOwnMessage?: boolean;
}

export default function WorkExtraMessage({ 
  data, 
  onInterestedInWork,
  isOwnMessage = false 
}: WorkExtraMessageProps) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'filled':
        return colors.success || '#10B981';
      case 'cancelled':
        return colors.error || '#EF4444';
      case 'interested':
        return colors.warning || '#F59E0B';
      default:
        return colors.primary;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'filled':
        return 'Tillsatt';
      case 'cancelled':
        return 'Inställt';
      case 'interested':
        return 'Intresse finns';
      default:
        return 'Tillgängligt';
    }
  };

  const handleInterestedInWork = () => {
    if (!data.id || !data.requester_id) return;
    
    Alert.alert(
      'Intresserad av extrajobb',
      'Vill du starta en privat chat för att diskutera detta extrajobb? En privat chatkanal kommer att skapas mellan dig och den som publicerat jobbet.',
      [
        { text: 'Avbryt', style: 'cancel' },
        { 
          text: 'Ja, starta chat', 
          style: 'default',
          onPress: () => onInterestedInWork?.(data.id!, data.requester_id)
        }
      ]
    );
  };

  const calculateDuration = () => {
    if (!data.start_time || !data.end_time) return '';
    
    const [startHour, startMin] = data.start_time.split(':').map(Number);
    const [endHour, endMin] = data.end_time.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    let duration = endMinutes - startMinutes;
    if (duration < 0) duration += 24 * 60; // Handle overnight shifts
    
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}min`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: '100%',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.text,
      marginLeft: 8,
    },
    statusBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      alignSelf: 'flex-start',
    },
    statusText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    section: {
      marginBottom: 12,
    },
    sectionRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 16,
    },
    sectionColumn: {
      flex: 1,
    },
    sectionTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
      textTransform: 'uppercase',
    },
    infoContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 8,
      borderRadius: 8,
      marginBottom: 4,
    },
    infoText: {
      fontSize: 14,
      color: colors.text,
      marginLeft: 6,
    },
    positionContainer: {
      backgroundColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      alignSelf: 'flex-start',
      marginBottom: 8,
    },
    positionText: {
      fontSize: 14,
      fontWeight: '600',
      color: 'white',
    },
    descriptionContainer: {
      backgroundColor: colors.background,
      padding: 12,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    descriptionText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    rateContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.success || '#10B981',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 12,
      alignSelf: 'flex-start',
      marginTop: 8,
    },
    rateText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'white',
    },
    buttonContainer: {
      marginTop: 12,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      gap: 8,
    },
    buttonText: {
      color: 'white',
      fontSize: 14,
      fontWeight: '600',
    },
    timestamp: {
      fontSize: 11,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: 8,
    },
    durationText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontStyle: 'italic',
      marginTop: 4,
    },
  });

  const canShowInterest = !isOwnMessage && data.status === 'open' && onInterestedInWork;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Users size={18} color={colors.primary} />
          <Text style={styles.title}>Extrajobb tillgängligt</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(data.status) }]}>
          <Text style={styles.statusText}>{getStatusText(data.status)}</Text>
        </View>
      </View>

      <View style={styles.positionContainer}>
        <Text style={styles.positionText}>{data.position}</Text>
      </View>

      <View style={styles.sectionRow}>
        <View style={styles.sectionColumn}>
          <Text style={styles.sectionTitle}>Datum & Tid</Text>
          <View style={styles.infoContainer}>
            <Calendar size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>{data.date}</Text>
          </View>
          <View style={styles.infoContainer}>
            <Clock size={16} color={colors.textSecondary} />
            <Text style={styles.infoText}>
              {data.start_time} - {data.end_time}
            </Text>
          </View>
          {calculateDuration() && (
            <Text style={styles.durationText}>
              Varaktighet: {calculateDuration()}
            </Text>
          )}
        </View>

        <View style={styles.sectionColumn}>
          {data.location && (
            <>
              <Text style={styles.sectionTitle}>Plats</Text>
              <View style={styles.infoContainer}>
                <MapPin size={16} color={colors.textSecondary} />
                <Text style={styles.infoText}>{data.location}</Text>
              </View>
            </>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Beskrivning</Text>
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{data.description}</Text>
        </View>
      </View>

      {data.hourly_rate && (
        <View style={styles.rateContainer}>
          <Text style={styles.rateText}>💰 {data.hourly_rate} kr/h</Text>
        </View>
      )}

      {canShowInterest && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleInterestedInWork}
          >
            <MessageCircle size={16} color="white" />
            <Text style={styles.buttonText}>Intresserad av jobbet</Text>
          </TouchableOpacity>
        </View>
      )}

      {data.created_at && (
        <Text style={styles.timestamp}>
          {new Date(data.created_at).toLocaleString('sv-SE')}
        </Text>
      )}
    </View>
  );
}