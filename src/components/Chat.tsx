import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, Search, Users, Circle, Filter, Plus } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_image?: string;
  is_online: boolean;
  company_id: string;
  department_id?: string;
  team_id?: string;
}

interface Group {
  id: string;
  name: string;
  company_id: string;
  department_id?: string;
  created_by: string;
  is_private: boolean;
  member_count: number;
}

interface Message {
  id: string;
  sender_id: string;
  group_id: string;
  content: string;
  created_at: string;
  sender: User;
}

interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  accepted: boolean;
}

export default function Chat() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company' | 'department'>('all');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getCurrentUser();
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroup) {
      loadMessages();
      loadGroupMembers();
      subscribeToMessages();
    }
  }, [selectedGroup]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (userData) {
        setCurrentUser(userData);
        // Update online status
        await supabase
          .from('users')
          .update({ is_online: true, last_seen: new Date().toISOString() })
          .eq('id', user.id);
      }
    }
  };

  const loadGroups = async () => {
    if (!currentUser) return;

    let query = supabase
      .from('groups')
      .select(`
        *,
        group_members!inner(count)
      `)
      .eq('company_id', currentUser.company_id);

    if (filterType === 'department' && currentUser.department_id) {
      query = query.eq('department_id', currentUser.department_id);
    }

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`);
    }

    const { data } = await query;
    
    if (data) {
      const groupsWithMemberCount = data.map(group => ({
        ...group,
        member_count: group.group_members?.[0]?.count || 0
      }));
      setGroups(groupsWithMemberCount);
    }
  };

  const loadMessages = async () => {
    if (!selectedGroup) return;

    const { data } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users(*)
      `)
      .eq('group_id', selectedGroup.id)
      .order('created_at', { ascending: true })
      .limit(50);

    if (data) {
      setMessages(data);
    }
  };

  const loadGroupMembers = async () => {
    if (!selectedGroup) return;

    const { data } = await supabase
      .from('group_members')
      .select(`
        *,
        user:users(*)
      `)
      .eq('group_id', selectedGroup.id)
      .eq('accepted', true);

    if (data) {
      setGroupMembers(data.map(member => member.user));
    }
  };

  const subscribeToMessages = () => {
    if (!selectedGroup) return;

    const subscription = supabase
      .channel(`messages:${selectedGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${selectedGroup.id}`
        },
        async (payload) => {
          const { data: messageWithSender } = await supabase
            .from('messages')
            .select(`
              *,
              sender:users(*)
            `)
            .eq('id', payload.new.id)
            .single();

          if (messageWithSender) {
            setMessages(prev => [...prev, messageWithSender]);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedGroup || !currentUser) return;

    const { error } = await supabase
      .from('messages')
      .insert({
        content: newMessage,
        sender_id: currentUser.id,
        group_id: selectedGroup.id
      });

    if (!error) {
      setNewMessage('');
    }
  };

  const joinGroup = async (groupId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('group_members')
      .insert({
        group_id: groupId,
        user_id: currentUser.id,
        accepted: true
      });

    if (!error) {
      loadGroups();
    }
  };

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim() || !currentUser) return;

    const { data: newGroup, error } = await supabase
      .from('groups')
      .insert({
        name: newGroupName,
        company_id: currentUser.company_id,
        department_id: filterType === 'department' ? currentUser.department_id : null,
        created_by: currentUser.id
      })
      .select()
      .single();

    if (!error && newGroup) {
      // Add creator as member
      await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUser.id,
          accepted: true
        });

      setNewGroupName('');
      setShowCreateGroup(false);
      loadGroups();
    }
  };

  const filteredGroups = groups.filter(group => {
    if (searchTerm) {
      return group.name.toLowerCase().includes(searchTerm.toLowerCase());
    }
    return true;
  });

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Groups */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Chatt</h1>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Sök grupper..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 text-sm rounded-full ${
                filterType === 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Alla
            </button>
            <button
              onClick={() => setFilterType('company')}
              className={`px-3 py-1 text-sm rounded-full ${
                filterType === 'company'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Företag
            </button>
            <button
              onClick={() => setFilterType('department')}
              className={`px-3 py-1 text-sm rounded-full ${
                filterType === 'department'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Avdelning
            </button>
          </div>
        </div>

        {/* Groups List */}
        <div className="flex-1 overflow-y-auto">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGroup(group)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedGroup?.id === group.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <div className="flex items-center text-sm text-gray-500 mt-1">
                    <Users className="w-4 h-4 mr-1" />
                    {group.member_count} medlemmar
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    joinGroup(group.id);
                  }}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Gå med
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedGroup ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{selectedGroup.name}</h2>
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="w-4 h-4 mr-1" />
                    {groupMembers.length} medlemmar
                  </div>
                </div>
                
                {/* Online Members */}
                <div className="flex -space-x-2">
                  {groupMembers.slice(0, 5).map((member) => (
                    <div key={member.id} className="relative">
                      <img
                        src={member.profile_image || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.full_name)}&background=0ea5e9&color=fff`}
                        alt={member.full_name}
                        className="w-8 h-8 rounded-full border-2 border-white"
                      />
                      {member.is_online && (
                        <Circle className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500 fill-current" />
                      )}
                    </div>
                  ))}
                  {groupMembers.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-600">
                      +{groupMembers.length - 5}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.sender_id === currentUser?.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    {message.sender_id !== currentUser?.id && (
                      <div className="text-xs font-medium mb-1 opacity-75">
                        {message.sender.full_name}
                      </div>
                    )}
                    <div>{message.content}</div>
                    <div
                      className={`text-xs mt-1 ${
                        message.sender_id === currentUser?.id
                          ? 'text-blue-100'
                          : 'text-gray-500'
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString('sv-SE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Skriv ett meddelande..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Välj en grupp för att börja chatta</h3>
              <p className="text-gray-500">Sök efter grupper eller skapa en ny grupp för att komma igång.</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Skapa ny grupp</h3>
            <form onSubmit={createGroup}>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Gruppnamn"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateGroup(false);
                    setNewGroupName('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Skapa grupp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}