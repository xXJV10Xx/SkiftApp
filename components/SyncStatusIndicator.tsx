import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Wifi, WifiOff, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react-native';
import { useOfflineChatStore } from '../stores/OfflineChatStore';

interface SyncStatusIndicatorProps {
  style?: any;
  showDetails?: boolean;
}

export const SyncStatusIndicator: React.FC<SyncStatusIndicatorProps> = ({ 
  style, 
  showDetails = false 
}) => {
  const { 
    isOnline, 
    syncing, 
    lastSyncResult, 
    syncData, 
    checkOnlineStatus 
  } = useOfflineChatStore();

  const handleManualSync = async () => {
    if (!syncing) {
      await syncData();
    }
  };

  const handleRefreshStatus = async () => {
    await checkOnlineStatus();
  };

  const getStatusColor = () => {
    if (syncing) return '#007AFF';
    if (!isOnline) return '#FF3B30';
    if (lastSyncResult?.success) return '#34C759';
    if (lastSyncResult?.success === false) return '#FF9500';
    return '#8E8E93';
  };

  const getStatusText = () => {
    if (syncing) return 'Synkroniserar...';
    if (!isOnline) return 'Offline';
    if (lastSyncResult?.success) return 'Synkroniserad';
    if (lastSyncResult?.success === false) return 'Synkfel';
    return 'Väntar på synk';
  };

  const getStatusIcon = () => {
    const color = getStatusColor();
    const size = 16;

    if (syncing) {
      return <RefreshCw size={size} color={color} className="animate-spin" />;
    }
    if (!isOnline) {
      return <WifiOff size={size} color={color} />;
    }
    if (lastSyncResult?.success) {
      return <CheckCircle size={size} color={color} />;
    }
    if (lastSyncResult?.success === false) {
      return <AlertCircle size={size} color={color} />;
    }
    return <Wifi size={size} color={color} />;
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={styles.statusButton}
        onPress={isOnline ? handleManualSync : handleRefreshStatus}
        disabled={syncing}
      >
        <View style={styles.statusContent}>
          {getStatusIcon()}
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
        </View>
      </TouchableOpacity>

      {showDetails && lastSyncResult && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Meddelanden: ↓{lastSyncResult.messagesDownloaded} ↑{lastSyncResult.messagesUploaded}
          </Text>
          <Text style={styles.detailText}>
            Team: ↓{lastSyncResult.teamsDownloaded} ↑{lastSyncResult.teamsUploaded}
          </Text>
          <Text style={styles.detailText}>
            Rum: ↓{lastSyncResult.chatRoomsDownloaded}
          </Text>
          {lastSyncResult.error && (
            <Text style={styles.errorText}>{lastSyncResult.error}</Text>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 8,
    margin: 4,
  },
  statusButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  details: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  detailText: {
    fontSize: 10,
    color: '#8E8E93',
    marginBottom: 2,
  },
  errorText: {
    fontSize: 10,
    color: '#FF3B30',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default SyncStatusIndicator;