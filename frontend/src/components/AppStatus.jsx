import React from 'react'
import { CheckCircle, XCircle, AlertTriangle, Server, Database, Shield } from 'lucide-react'

const AppStatus = () => {
  const [apiStatus, setApiStatus] = React.useState('checking')
  const [authStatus, setAuthStatus] = React.useState('checking')

  React.useEffect(() => {
    checkApiStatus()
    checkAuthStatus()
  }, [])

  const checkApiStatus = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/health')
      if (response.ok) {
        setApiStatus('connected')
      } else {
        setApiStatus('error')
      }
    } catch (error) {
      setApiStatus('error')
    }
  }

  const checkAuthStatus = () => {
    // Check if Supabase environment variables are configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
    
    if (supabaseUrl && supabaseKey && 
        supabaseUrl !== 'https://your-project-ref.supabase.co' && 
        supabaseKey !== 'your-anon-key-here') {
      setAuthStatus('configured')
    } else {
      setAuthStatus('not_configured')
    }
  }

  const StatusIndicator = ({ status, label, icon: Icon, description }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'connected':
        case 'configured':
          return 'text-green-600 bg-green-100'
        case 'error':
        case 'not_configured':
          return 'text-red-600 bg-red-100'
        case 'checking':
        default:
          return 'text-yellow-600 bg-yellow-100'
      }
    }

    const getStatusIcon = () => {
      switch (status) {
        case 'connected':
        case 'configured':
          return <CheckCircle size={20} />
        case 'error':
        case 'not_configured':
          return <XCircle size={20} />
        case 'checking':
        default:
          return <AlertTriangle size={20} />
      }
    }

    return (
      <div className="flex items-center gap-3 p-4 border rounded-lg">
        <div className={`p-2 rounded-lg ${getStatusColor()}`}>
          <Icon size={24} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{label}</h3>
            {getStatusIcon()}
          </div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="card-title">System Status</h2>
        <p className="text-sm text-gray-600">
          Current status of application components
        </p>
      </div>
      
      <div className="card-content space-y-4">
        <StatusIndicator
          status={apiStatus}
          label="Backend API"
          icon={Server}
          description={
            apiStatus === 'connected' 
              ? 'Backend server running on port 3002'
              : apiStatus === 'checking'
              ? 'Checking backend connection...'
              : 'Backend server not accessible'
          }
        />
        
        <StatusIndicator
          status={authStatus}
          label="Supabase Authentication"
          icon={Shield}
          description={
            authStatus === 'configured'
              ? 'Supabase configured and ready'
              : authStatus === 'checking'
              ? 'Checking Supabase configuration...'
              : 'Supabase not configured - update .env file'
          }
        />

        <StatusIndicator
          status="configured"
          label="Database Schema"
          icon={Database}
          description="SSAB shift calculation system ready with 17 years of data"
        />

        {authStatus === 'not_configured' && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Setup Required</h4>
            <p className="text-sm text-blue-800 mb-3">
              To enable authentication and premium features:
            </p>
            <ol className="text-sm text-blue-800 space-y-1 ml-4">
              <li>1. Create a Supabase project at supabase.com</li>
              <li>2. Run the SQL schema from supabase_schema.sql</li>
              <li>3. Update the .env file with your Supabase URL and key</li>
              <li>4. Restart the development server</li>
            </ol>
            <p className="text-xs text-blue-600 mt-3">
              See SETUP_SUPABASE.md for detailed instructions
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AppStatus