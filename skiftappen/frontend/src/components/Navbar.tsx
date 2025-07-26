import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Calendar, Home, LogIn, UserPlus, Users } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-sm border-b border-secondary-200">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Calendar className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-secondary-800">Skiftappen</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            
            <Link
              to="/shifts"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/shifts') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Skift</span>
            </Link>
          </div>

          {/* Auth Links */}
          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/login') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50'
              }`}
            >
              <LogIn className="h-4 w-4" />
              <span>Logga in</span>
            </Link>
            
            <Link
              to="/register"
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/register') 
                  ? 'text-primary-600 bg-primary-50' 
                  : 'text-secondary-600 hover:text-secondary-800 hover:bg-secondary-50'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              <span>Registrera</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};