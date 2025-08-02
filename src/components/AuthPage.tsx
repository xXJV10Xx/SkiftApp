import React, { useState, useEffect } from 'react';
import { auth } from '../lib/supabase';
import { companyAPI } from '../lib/api';
import { MessageCircle, Users, Calendar, CheckCircle, Loader } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  location: string;
}

interface Department {
  id: string;
  name: string;
  company_id: string;
}

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompanySelection, setShowCompanySelection] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is already authenticated
    checkAuthStatus();
    
    // Listen for auth changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await handleAuthSuccess(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAuthStatus = async () => {
    const { session } = await auth.getCurrentSession();
    if (session?.user) {
      await handleAuthSuccess(session.user);
    }
  };

  const handleAuthSuccess = async (user: any) => {
    try {
      // Check if user already has company/department assigned
      const { data: existingUser } = await auth.createUserProfile(user);
      
      if (existingUser?.company_id) {
        // User already has company assigned, proceed to app
        onAuthSuccess();
      } else {
        // User needs to select company and department
        setPendingUser(user);
        await loadCompanies();
        setShowCompanySelection(true);
      }
    } catch (error) {
      console.error('Error handling auth success:', error);
      setError('Ett fel uppstod vid inloggning. Försök igen.');
    }
  };

  const loadCompanies = async () => {
    try {
      const companiesData = await companyAPI.getCompanies();
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error loading companies:', error);
      setError('Kunde inte ladda företag. Försök igen.');
    }
  };

  const loadDepartments = async (companyId: string) => {
    try {
      const departmentsData = await companyAPI.getDepartments(companyId);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading departments:', error);
      setError('Kunde inte ladda avdelningar. Försök igen.');
    }
  };

  const handleCompanySelect = async (companyId: string) => {
    setSelectedCompany(companyId);
    setSelectedDepartment('');
    if (companyId) {
      await loadDepartments(companyId);
    } else {
      setDepartments([]);
    }
  };

  const completeProfile = async () => {
    if (!pendingUser || !selectedCompany) return;

    setIsLoading(true);
    setError(null);

    try {
      await auth.createUserProfile(pendingUser, {
        company_id: selectedCompany,
        department_id: selectedDepartment || null
      });

      onAuthSuccess();
    } catch (error) {
      console.error('Error completing profile:', error);
      setError('Ett fel uppstod vid slutförande av profil. Försök igen.');
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithProvider = async (provider: 'google' | 'apple' | 'facebook') => {
    setIsLoading(true);
    setError(null);

    try {
      let result;
      switch (provider) {
        case 'google':
          result = await auth.signInWithGoogle();
          break;
        case 'apple':
          result = await auth.signInWithApple();
          break;
        case 'facebook':
          result = await auth.signInWithFacebook();
          break;
      }

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error) {
      console.error(`Error signing in with ${provider}:`, error);
      setError(`Ett fel uppstod vid inloggning med ${provider}. Försök igen.`);
    } finally {
      setIsLoading(false);
    }
  };

  if (showCompanySelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Välj ditt företag</h2>
            <p className="text-gray-600">Slutför din profil för att komma igång</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Företag *
              </label>
              <select
                value={selectedCompany}
                onChange={(e) => handleCompanySelect(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Välj företag</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name} {company.location && `- ${company.location}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Department Selection */}
            {departments.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avdelning (valfritt)
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Välj avdelning</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={completeProfile}
              disabled={!selectedCompany || isLoading}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Slutför profil...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Slutför profil</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ShiftChat</h1>
          <p className="text-gray-600">Chatta och hantera skift med ditt team</p>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-8">
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Gruppchatt med företag och avdelning</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Skiftöverlämningar och extra jobb</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Kalenderexport till Google/Apple</span>
          </div>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Realtidsmeddelanden och notifieringar</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Auth Buttons */}
        <div className="space-y-3">
          {/* Google Sign In */}
          <button
            onClick={() => signInWithProvider('google')}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Fortsätt med Google</span>
              </>
            )}
          </button>

          {/* Apple Sign In */}
          <button
            onClick={() => signInWithProvider('apple')}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
                <span>Fortsätt med Apple</span>
              </>
            )}
          </button>

          {/* Facebook Sign In */}
          <button
            onClick={() => signInWithProvider('facebook')}
            disabled={isLoading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <svg className="w-5 h-5 mr-3" fill="#1877F2" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Fortsätt med Facebook</span>
              </>
            )}
          </button>
        </div>

        {/* Terms */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Genom att fortsätta godkänner du våra{' '}
            <a href="#" className="text-blue-600 hover:underline">Användarvillkor</a>
            {' '}och{' '}
            <a href="#" className="text-blue-600 hover:underline">Integritetspolicy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;