import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, Users, MessageCircle, AlertTriangle, Plus, Heart, User } from 'lucide-react';

interface User {
  id: string;
  email: string;
  full_name: string;
  profile_image?: string;
  company_id: string;
  department_id?: string;
}

interface ShiftForm {
  id: string;
  type: 'skiftöverlämning' | 'jobba extra' | 'haveri';
  user_id: string;
  date: string;
  shift?: string;
  description?: string;
  status: 'öppen' | 'besvarad';
  company_id: string;
  department_id?: string;
  interested_users: string[];
  created_at: string;
  user: User;
}

export default function ShiftForm() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [forms, setForms] = useState<ShiftForm[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedType, setSelectedType] = useState<'skiftöverlämning' | 'jobba extra' | 'haveri'>('skiftöverlämning');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShift, setSelectedShift] = useState('');
  const [description, setDescription] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'skiftöverlämning' | 'jobba extra' | 'haveri'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'öppen' | 'besvarad'>('all');

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadForms();
    }
  }, [currentUser, filterType, filterStatus]);

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
      }
    }
  };

  const loadForms = async () => {
    if (!currentUser) return;

    let query = supabase
      .from('shift_forms')
      .select(`
        *,
        user:users(*)
      `)
      .eq('company_id', currentUser.company_id)
      .order('created_at', { ascending: false });

    if (filterType !== 'all') {
      query = query.eq('type', filterType);
    }

    if (filterStatus !== 'all') {
      query = query.eq('status', filterStatus);
    }

    const { data } = await query;
    if (data) {
      setForms(data);
    }
  };

  const createForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !selectedDate) return;

    const { error } = await supabase
      .from('shift_forms')
      .insert({
        type: selectedType,
        user_id: currentUser.id,
        date: selectedDate,
        shift: selectedShift || null,
        description: description || null,
        company_id: currentUser.company_id,
        department_id: currentUser.department_id,
        interested_users: []
      });

    if (!error) {
      setShowCreateForm(false);
      setSelectedDate('');
      setSelectedShift('');
      setDescription('');
      loadForms();
    }
  };

  const toggleInterest = async (formId: string) => {
    if (!currentUser) return;

    const form = forms.find(f => f.id === formId);
    if (!form) return;

    const isInterested = form.interested_users.includes(currentUser.id);
    let updatedInterestedUsers;

    if (isInterested) {
      updatedInterestedUsers = form.interested_users.filter(id => id !== currentUser.id);
    } else {
      updatedInterestedUsers = [...form.interested_users, currentUser.id];
    }

    const { error } = await supabase
      .from('shift_forms')
      .update({ interested_users: updatedInterestedUsers })
      .eq('id', formId);

    if (!error) {
      loadForms();
    }
  };

  const startPrivateChat = async (otherUserId: string) => {
    if (!currentUser) return;

    // Create or find existing private group between users
    const groupName = `Privat chatt`;
    
    const { data: existingGroup } = await supabase
      .from('groups')
      .select('*')
      .eq('is_private', true)
      .eq('company_id', currentUser.company_id);

    // Check if private group exists between these users
    let privateGroupId = null;
    
    if (existingGroup) {
      for (const group of existingGroup) {
        const { data: members } = await supabase
          .from('group_members')
          .select('user_id')
          .eq('group_id', group.id);
        
        const memberIds = members?.map(m => m.user_id) || [];
        if (memberIds.includes(currentUser.id) && memberIds.includes(otherUserId) && memberIds.length === 2) {
          privateGroupId = group.id;
          break;
        }
      }
    }

    if (!privateGroupId) {
      // Create new private group
      const { data: newGroup, error } = await supabase
        .from('groups')
        .insert({
          name: groupName,
          company_id: currentUser.company_id,
          created_by: currentUser.id,
          is_private: true
        })
        .select()
        .single();

      if (!error && newGroup) {
        privateGroupId = newGroup.id;
        
        // Add both users to the group
        await supabase
          .from('group_members')
          .insert([
            { group_id: privateGroupId, user_id: currentUser.id, accepted: true },
            { group_id: privateGroupId, user_id: otherUserId, accepted: true }
          ]);
      }
    }

    // Redirect to chat (this would be handled by your router)
    console.log('Öppnar privat chatt med grupp ID:', privateGroupId);
  };

  const markAsAnswered = async (formId: string) => {
    const { error } = await supabase
      .from('shift_forms')
      .update({ status: 'besvarad' })
      .eq('id', formId);

    if (!error) {
      loadForms();
    }
  };

  const getFormIcon = (type: string) => {
    switch (type) {
      case 'skiftöverlämning':
        return <Clock className="w-5 h-5" />;
      case 'jobba extra':
        return <Plus className="w-5 h-5" />;
      case 'haveri':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Calendar className="w-5 h-5" />;
    }
  };

  const getFormColor = (type: string) => {
    switch (type) {
      case 'skiftöverlämning':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'jobba extra':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'haveri':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const shifts = ['Dag', 'Kväll', 'Natt', 'Helg'];

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Formulär</h1>
          <p className="text-gray-600 mt-2">Hantera skiftöverlämningar, extra jobb och haverier</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nytt formulär</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Typ</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alla typer</option>
              <option value="skiftöverlämning">Skiftöverlämning</option>
              <option value="jobba extra">Jobba extra</option>
              <option value="haveri">Haveri</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Alla status</option>
              <option value="öppen">Öppen</option>
              <option value="besvarad">Besvarad</option>
            </select>
          </div>
        </div>
      </div>

      {/* Forms List */}
      <div className="space-y-4">
        {forms.map((form) => (
          <div key={form.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg border ${getFormColor(form.type)}`}>
                    {getFormIcon(form.type)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 capitalize">{form.type}</h3>
                    <div className="flex items-center text-sm text-gray-500 space-x-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {formatDate(form.date)}
                      </span>
                      {form.shift && (
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {form.shift}
                        </span>
                      )}
                      <span className="flex items-center">
                        <User className="w-4 h-4 mr-1" />
                        {form.user.full_name}
                      </span>
                    </div>
                  </div>
                </div>

                {form.description && (
                  <p className="text-gray-700 mb-4 bg-gray-50 p-3 rounded-lg">{form.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Interest Button (only for "jobba extra") */}
                    {form.type === 'jobba extra' && form.user_id !== currentUser?.id && (
                      <button
                        onClick={() => toggleInterest(form.id)}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                          form.interested_users.includes(currentUser?.id || '')
                            ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${
                          form.interested_users.includes(currentUser?.id || '') ? 'fill-current' : ''
                        }`} />
                        <span>
                          {form.interested_users.includes(currentUser?.id || '') ? 'Inte intresserad' : 'Intresserad'}
                        </span>
                      </button>
                    )}

                    {/* Interested Users Count */}
                    {form.type === 'jobba extra' && form.interested_users.length > 0 && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        {form.interested_users.length} intresserade
                      </div>
                    )}

                    {/* Private Chat Button (for interested users) */}
                    {form.type === 'jobba extra' && form.interested_users.includes(currentUser?.id || '') && form.user_id !== currentUser?.id && (
                      <button
                        onClick={() => startPrivateChat(form.user_id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chatta</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 text-sm rounded-full ${
                      form.status === 'öppen'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}>
                      {form.status === 'öppen' ? 'Öppen' : 'Besvarad'}
                    </span>

                    {/* Mark as Answered Button */}
                    {form.status === 'öppen' && form.user_id === currentUser?.id && (
                      <button
                        onClick={() => markAsAnswered(form.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        Markera som besvarad
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {forms.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Inga formulär hittades</h3>
            <p className="text-gray-500 mb-6">Skapa ditt första formulär för att komma igång.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Skapa formulär
            </button>
          </div>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Skapa nytt formulär</h3>
            <form onSubmit={createForm} className="space-y-4">
              {/* Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Typ</label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="skiftöverlämning">Skiftöverlämning</option>
                  <option value="jobba extra">Jobba extra</option>
                  <option value="haveri">Haveri</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Shift (optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Skift (valfritt)</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Välj skift</option>
                  {shifts.map(shift => (
                    <option key={shift} value={shift}>{shift}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Beskrivning (valfritt)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Beskriv detaljer..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedDate('');
                    setSelectedShift('');
                    setDescription('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  disabled={!selectedDate}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Skapa formulär
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}