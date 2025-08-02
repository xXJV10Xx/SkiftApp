import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { GroupMember, getOnlineGroupMembers } from '../lib/chatUtils';

interface OnlineMembersProps {
  groupId: string;
  onMemberPress?: (member: GroupMember) => void;
  refreshInterval?: number; // milliseconds
}

export default function OnlineMembers({ 
  groupId, 
  onMemberPress, 
  refreshInterval = 30000 // 30 seconds default
}: OnlineMembersProps) {
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOnlineMembers = async () => {
    try {
      const onlineMembers = await getOnlineGroupMembers(groupId);
      setMembers(onlineMembers);
    } catch (error) {
      console.error('Error fetching online members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnlineMembers();

    // Set up interval to refresh online members
    const interval = setInterval(fetchOnlineMembers, refreshInterval);

    return () => clearInterval(interval);
  }, [groupId, refreshInterval]);

  const getDisplayName = (member: GroupMember) => {
    const { users } = member;
    if (users.first_name && users.last_name) {
      return `${users.first_name} ${users.last_name}`;
    }
    return users.username || 'Okänd användare';
  };

  const getInitials = (member: GroupMember) => {
    const { users } = member;
    if (users.first_name && users.last_name) {
      return `${users.first_name[0]}${users.last_name[0]}`.toUpperCase();
    }
    if (users.username) {
      return users.username.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  const renderMember = (member: GroupMember) => {
    const displayName = getDisplayName(member);
    const initials = getInitials(member);

    return (
      <TouchableOpacity
        key={member.user_id}
        style={styles.memberContainer}
        onPress={() => onMemberPress?.(member)}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {member.users.avatar_url ? (
            <Image
              source={{ uri: member.users.avatar_url }}
              style={styles.avatar}
              onError={() => {
                // Fallback to placeholder if image fails to load
                console.log('Failed to load avatar image');
              }}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          )}
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.memberName} numberOfLines={1}>
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Online användare</Text>
        <Text style={styles.loadingText}>Laddar...</Text>
      </View>
    );
  }

  if (members.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Online användare</Text>
        <Text style={styles.emptyText}>Inga användare online</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Online användare ({members.length})
      </Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.membersContainer}
      >
        {members.map(renderMember)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  membersContainer: {
    paddingRight: 16,
  },
  memberContainer: {
    alignItems: 'center',
    marginRight: 16,
    width: 60,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0F0F0',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  memberName: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    maxWidth: 60,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingVertical: 20,
  },
});