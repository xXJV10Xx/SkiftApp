import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase, getCurrentUser, getUserProfile, createUserProfile } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        loadUserProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      setLoading(true)
      const { data: profileData, error } = await getUserProfile(userId)
      
      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const user = await getCurrentUser()
        if (user.user) {
          const newProfileData = {
            email: user.user.email,
            full_name: user.user.user_metadata?.full_name || user.user.email,
            avatar_url: user.user.user_metadata?.avatar_url,
            selected_team: 31 // Default team
          }
          
          const { data: createdProfile, error: createError } = await createUserProfile(userId, newProfileData)
          if (!createError) {
            setProfile({ id: userId, ...newProfileData })
          }
        }
      } else if (!error) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates) => {
    if (!user) return { error: 'No user logged in' }
    
    try {
      const { updateUserProfile } = await import('../lib/supabase')
      const { data, error } = await updateUserProfile(user.id, updates)
      
      if (!error) {
        setProfile(prev => ({ ...prev, ...updates }))
      }
      
      return { data, error }
    } catch (error) {
      console.error('Error updating profile:', error)
      return { error: error.message }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (!error) {
        setUser(null)
        setProfile(null)
        setSession(null)
      }
      return { error }
    } catch (error) {
      console.error('Error signing out:', error)
      return { error: error.message }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    updateProfile,
    signOut,
    isAuthenticated: !!user,
    isSubscribed: profile?.subscription_status === 'active'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}