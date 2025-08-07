import React, { useState } from 'react'
import { X, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { signInWithGoogle, signInWithApple, signInWithEmail, signUpWithEmail, resetPassword } from '../../lib/supabase'

const AuthModal = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState(initialMode) // 'signin', 'signup', 'reset'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleClose = () => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
    onClose()
  }

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      const { error } = await signInWithGoogle()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Ett fel uppstod vid Google-inloggning')
    } finally {
      setLoading(false)
    }
  }

  const handleAppleSignIn = async () => {
    try {
      setLoading(true)
      setError('')
      const { error } = await signInWithApple()
      if (error) {
        setError(error.message)
      }
    } catch (err) {
      setError('Ett fel uppstod vid Apple-inloggning')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailAuth = async (e) => {
    e.preventDefault()
    
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Lösenorden matchar inte')
      return
    }

    if (password.length < 6) {
      setError('Lösenordet måste vara minst 6 tecken')
      return
    }

    try {
      setLoading(true)
      setError('')
      
      if (mode === 'signin') {
        const { error } = await signInWithEmail(email, password)
        if (error) {
          setError(error.message)
        } else {
          handleClose()
        }
      } else if (mode === 'signup') {
        const { error } = await signUpWithEmail(email, password, { full_name: fullName })
        if (error) {
          setError(error.message)
        } else {
          setSuccess('Konto skapat! Kontrollera din e-post för verifiering.')
        }
      }
    } catch (err) {
      setError('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    
    if (!email) {
      setError('Ange din e-postadress')
      return
    }

    try {
      setLoading(true)
      setError('')
      const { error } = await resetPassword(email)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('Återställningslänk skickad till din e-post!')
      }
    } catch (err) {
      setError('Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'signin' && 'Logga in'}
            {mode === 'signup' && 'Skapa konto'}
            {mode === 'reset' && 'Återställ lösenord'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-green-700 text-sm">{success}</span>
            </div>
          )}

          {/* OAuth Buttons */}
          {mode !== 'reset' && (
            <div className="space-y-3 mb-6">
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Fortsätt med Google
              </button>

              <button
                onClick={handleAppleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                Fortsätt med Apple
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">eller</span>
                </div>
              </div>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={mode === 'reset' ? handlePasswordReset : handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fullständigt namn
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                E-postadress
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lösenord
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bekräfta lösenord
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Laddar...' : (
                mode === 'signin' ? 'Logga in' :
                mode === 'signup' ? 'Skapa konto' : 'Skicka återställningslänk'
              )}
            </button>
          </form>

          {/* Mode Switches */}
          <div className="mt-6 text-center space-y-2">
            {mode === 'signin' && (
              <>
                <button
                  onClick={() => setMode('reset')}
                  className="text-blue-600 hover:text-blue-700 text-sm"
                >
                  Glömt lösenord?
                </button>
                <div className="text-sm text-gray-600">
                  Har du inget konto?{' '}
                  <button
                    onClick={() => setMode('signup')}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Skapa konto
                  </button>
                </div>
              </>
            )}

            {mode === 'signup' && (
              <div className="text-sm text-gray-600">
                Har du redan ett konto?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Logga in
                </button>
              </div>
            )}

            {mode === 'reset' && (
              <button
                onClick={() => setMode('signin')}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                Tillbaka till inloggning
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal