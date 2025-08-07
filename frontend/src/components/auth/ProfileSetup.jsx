import React, { useState } from 'react'
import { User, Building, Users, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

const ProfileSetup = ({ onComplete }) => {
  const { user, profile, updateProfile } = useAuth()
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    company_name: profile?.company_name || 'SSAB Oxelösund',
    company_type: profile?.company_type || 'ssab',
    selected_team: profile?.selected_team || 31,
    phone_number: profile?.phone_number || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const teams = [
    { id: 31, name: 'Lag 31', color: '#FF6B6B' },
    { id: 32, name: 'Lag 32', color: '#4ECDC4' },
    { id: 33, name: 'Lag 33', color: '#45B7D1' },
    { id: 34, name: 'Lag 34', color: '#96CEB4' },
    { id: 35, name: 'Lag 35', color: '#FFEAA7' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.full_name.trim()) {
      setError('Namn är obligatoriskt')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      const { error } = await updateProfile(formData)
      
      if (error) {
        setError(error.message || 'Ett fel uppstod vid uppdatering av profil')
      } else {
        setSuccess('Profil uppdaterad!')
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    } catch (err) {
      setError('Ett fel uppstod vid uppdatering av profil')
    } finally {
      setLoading(false)
    }
  }

  const selectedTeam = teams.find(t => t.id === formData.selected_team)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
        {/* Header */}
        <div className="p-8 border-b">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User size={32} className="text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Välkommen till SSAB Skiftschema Premium!
            </h1>
            <p className="text-gray-600">
              Slutför din profil för att komma igång
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle size={20} className="text-red-600" />
              <span className="text-red-700">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle size={20} className="text-green-600" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          <div className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <User size={20} />
                Personlig information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fullständigt namn *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ditt fullständiga namn"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefonnummer (valfritt)
                </label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => handleInputChange('phone_number', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="+46 70 123 45 67"
                />
              </div>
            </div>

            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Building size={20} />
                Företagsinformation
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Företag
                </label>
                <select
                  value={formData.company_type}
                  onChange={(e) => {
                    handleInputChange('company_type', e.target.value)
                    if (e.target.value === 'ssab') {
                      handleInputChange('company_name', 'SSAB Oxelösund')
                    } else {
                      handleInputChange('company_name', '')
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ssab">SSAB Oxelösund</option>
                  <option value="other">Annat företag</option>
                </select>
              </div>

              {formData.company_type === 'other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Företagsnamn
                  </label>
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleInputChange('company_name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ditt företags namn"
                    required
                  />
                </div>
              )}
            </div>

            {/* Team Selection */}
            {formData.company_type === 'ssab' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users size={20} />
                  Välj ditt lag
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      type="button"
                      onClick={() => handleInputChange('selected_team', team.id)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        formData.selected_team === team.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-full"
                          style={{ backgroundColor: team.color }}
                        />
                        <span className="font-semibold">{team.name}</span>
                        {formData.selected_team === team.id && (
                          <CheckCircle size={16} className="text-blue-600 ml-auto" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                {selectedTeam && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: selectedTeam.color }}
                      />
                      <div>
                        <div className="font-semibold">Valt lag: {selectedTeam.name}</div>
                        <div className="text-sm text-gray-600">
                          Du kommer få schema och notifieringar för detta lag
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Sparar...'
                ) : (
                  <>
                    <Save size={20} />
                    Spara och fortsätt
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProfileSetup