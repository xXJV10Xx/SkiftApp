import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import Dashboard from './components/Dashboard'
import TeamView from './components/TeamView'
import Statistics from './components/Statistics'
import UniversalCalendar from './components/UniversalCalendar'
import UniversalCompanySelector from './components/UniversalCompanySelector'
import AuthModal from './components/auth/AuthModal'
import ProfileSetup from './components/auth/ProfileSetup'
import AppStatus from './components/AppStatus'
import AIChat from './components/AIChat'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Calendar as CalendarIcon, Users, BarChart3, Home, Menu, X, LogIn, LogOut, User, Crown, Building2 } from 'lucide-react'
import './App.css'

// Main App Content Component
const AppContent = () => {
  const { user, profile, loading, isAuthenticated, signOut } = useAuth()
  const location = useLocation()
  const [selectedCompany, setSelectedCompany] = useState('ssab_oxelosund') // Default to SSAB
  const [selectedTeam, setSelectedTeam] = useState('31')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [showProfileSetup, setShowProfileSetup] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  // Track current page for AI context
  useEffect(() => {
    const path = location.pathname
    if (path === '/') setCurrentPage('dashboard')
    else if (path === '/companies') setCurrentPage('companies')
    else if (path === '/calendar') setCurrentPage('calendar')
    else if (path === '/team') setCurrentPage('team')
    else if (path === '/statistics') setCurrentPage('statistics')
    else setCurrentPage('dashboard')
  }, [location.pathname])

  // Update selected team from profile when available
  useEffect(() => {
    if (profile?.selected_team) {
      setSelectedTeam(profile.selected_team)
    }
  }, [profile])

  // Check if user needs profile setup
  useEffect(() => {
    if (isAuthenticated && profile && !profile.full_name) {
      setShowProfileSetup(true)
    }
  }, [isAuthenticated, profile])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Laddar...</p>
        </div>
      </div>
    )
  }

  // Show profile setup if needed
  if (showProfileSetup) {
    return <ProfileSetup onComplete={() => setShowProfileSetup(false)} />
  }

  const teams = [
    { id: 31, name: 'Lag 31', color: '#FF6B6B' },
    { id: 32, name: 'Lag 32', color: '#4ECDC4' },
    { id: 33, name: 'Lag 33', color: '#45B7D1' },
    { id: 34, name: 'Lag 34', color: '#96CEB4' },
    { id: 35, name: 'Lag 35', color: '#FFEAA7' }
  ]

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Företag', href: '/companies', icon: Building2 },
    { name: 'Kalender', href: '/calendar', icon: CalendarIcon },
    { name: 'Lag', href: '/team', icon: Users },
    { name: 'Statistik', href: '/statistics', icon: BarChart3 }
  ]

  const handleSignOut = async () => {
    await signOut()
    setSelectedTeam(31) // Reset to default team
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <Router>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="header-title">
                🏭 Universal Skiftschema Premium
              </h1>
              <p className="header-subtitle">
                {isAuthenticated ? `Välkommen ${profile?.full_name || user?.email}` : 'Skiftschema för 30+ svenska företag'}
              </p>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="nav-desktop">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link key={item.name} to={item.href} className="nav-link">
                    <Icon size={20} />
                    {item.name}
                  </Link>
                )
              })}
              
              {/* Auth buttons */}
              {isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-lg">
                    <Crown size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-700">Premium</span>
                  </div>
                  <button onClick={handleSignOut} className="nav-link">
                    <LogOut size={20} />
                    Logga ut
                  </button>
                </div>
              ) : (
                <button onClick={() => setAuthModalOpen(true)} className="nav-link">
                  <LogIn size={20} />
                  Logga in
                </button>
              )}
            </nav>

            {/* Mobile menu button */}
            <button 
              className="mobile-menu-button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="nav-mobile">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link 
                  key={item.name} 
                  to={item.href} 
                  className="nav-link-mobile"
                  onClick={closeMobileMenu}
                >
                  <Icon size={20} />
                  {item.name}
                </Link>
              )
            })}
            
            {/* Mobile Auth */}
            {isAuthenticated ? (
              <button onClick={handleSignOut} className="nav-link-mobile">
                <LogOut size={20} />
                Logga ut
              </button>
            ) : (
              <button onClick={() => { setAuthModalOpen(true); closeMobileMenu(); }} className="nav-link-mobile">
                <LogIn size={20} />
                Logga in
              </button>
            )}
          </nav>
        )}

        {/* Universal Company/Team Selector */}
        {isAuthenticated && (
          <div className="p-4 bg-gray-50 border-b">
            <UniversalCompanySelector
              selectedCompany={selectedCompany}
              selectedTeam={selectedTeam}
              onCompanyChange={(company) => setSelectedCompany(company.id)}
              onTeamChange={setSelectedTeam}
            />
          </div>
        )}

        {/* Main Content */}
        <main className="main-content">
          {isAuthenticated ? (
            <Routes>
              <Route 
                path="/" 
                element={
                  <Dashboard 
                    selectedCompany={selectedCompany}
                    selectedTeam={selectedTeam} 
                    teams={teams}
                    currentDate={currentDate}
                  />
                } 
              />
              <Route 
                path="/companies" 
                element={
                  <div className="p-6">
                    <UniversalCompanySelector
                      selectedCompany={selectedCompany}
                      selectedTeam={selectedTeam}
                      onCompanyChange={(company) => setSelectedCompany(company.id)}
                      onTeamChange={setSelectedTeam}
                    />
                  </div>
                } 
              />
              <Route 
                path="/calendar" 
                element={
                  <div className="p-6">
                    <UniversalCalendar 
                      companyId={selectedCompany}
                      teamId={selectedTeam}
                      onDateSelect={setCurrentDate}
                    />
                  </div>
                } 
              />
              <Route 
                path="/team" 
                element={
                  <TeamView 
                    selectedCompany={selectedCompany}
                    selectedTeam={selectedTeam}
                    teams={teams}
                    currentDate={currentDate}
                  />
                } 
              />
              <Route 
                path="/statistics" 
                element={
                  <Statistics 
                    selectedCompany={selectedCompany}
                    selectedTeam={selectedTeam}
                    teams={teams}
                    currentDate={currentDate}
                  />
                } 
              />
            </Routes>
          ) : (
            // Landing page for non-authenticated users
            <div className="text-center py-12">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">
                  Universal Skiftschema Premium
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Den ultimata appen för att hantera skiftscheman för 30+ svenska företag med avancerade funktioner och premium-upplevelse
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                  <div className="card text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Smart Kalender</h3>
                    <p className="text-gray-600">Visualisera ditt schema med interaktiv kalender och exportfunktioner</p>
                  </div>
                  
                  <div className="card text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users size={32} className="text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Lagchat</h3>
                    <p className="text-gray-600">Chatta med ditt lag i realtid och håll er uppdaterade</p>
                  </div>
                  
                  <div className="card text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <BarChart3 size={32} className="text-purple-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Statistik</h3>
                    <p className="text-gray-600">Detaljerad analys av arbetstider och trender</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => setAuthModalOpen(true)}
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Kom igång - Logga in
                </button>
                
                {/* System Status */}
                <div className="mt-12">
                  <AppStatus />
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="footer">
          <p>© 2025 Universal Skiftschema Premium | Stöder 30+ svenska företag</p>
        </footer>

        {/* Auth Modal */}
        <AuthModal 
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
        />

        {/* AI Chat Assistant */}
        <AIChat 
          currentPage={currentPage}
          selectedCompany={selectedCompany}
          selectedTeam={selectedTeam}
        />
      </div>
    </Router>
  )
}

// Main App component with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

export default App