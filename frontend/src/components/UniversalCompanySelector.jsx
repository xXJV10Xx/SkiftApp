import React, { useState, useEffect } from 'react';
import { Search, Building2, MapPin, Users, Filter, HelpCircle } from 'lucide-react';
import universalApi from '../services/universalApi';
import aiService from '../services/aiService';

const UniversalCompanySelector = ({ 
  selectedCompany, 
  selectedTeam, 
  onCompanyChange, 
  onTeamChange 
}) => {
  const [companies, setCompanies] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [locations, setLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState(null);
  const [showHelpTooltip, setShowHelpTooltip] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Filter companies when search/filters change
  useEffect(() => {
    filterCompanies();
  }, [searchQuery, selectedIndustry, selectedLocation]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [companiesData, industriesData, locationsData] = await Promise.all([
        universalApi.getCompanies(),
        universalApi.getIndustries(),
        universalApi.getLocations()
      ]);

      setCompanies(companiesData.companies || []);
      setIndustries(industriesData.industries || []);
      setLocations(locationsData.locations || []);
      setError(null);
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load companies. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = async () => {
    try {
      if (searchQuery.length >= 2) {
        // Use search API
        const searchResults = await universalApi.searchCompanies(searchQuery, {
          industry: selectedIndustry,
          location: selectedLocation
        });
        setCompanies(searchResults.results || []);
      } else {
        // Use filter API
        const filters = {};
        if (selectedIndustry) filters.industry = selectedIndustry;
        if (selectedLocation) filters.location = selectedLocation;
        
        const companiesData = await universalApi.getCompanies(filters);
        setCompanies(companiesData.companies || []);
      }
    } catch (err) {
      console.error('Error filtering companies:', err);
      setError('Failed to filter companies.');
    }
  };

  const handleCompanySelect = (company) => {
    onCompanyChange(company);
    // Reset team selection when company changes
    if (company.teams && company.teams.length > 0) {
      onTeamChange(company.teams[0]);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedIndustry('');
    setSelectedLocation('');
  };

  const handleQuickHelp = async () => {
    try {
      // Update AI context with current company selection state
      aiService.updateContext({
        currentPage: 'companies',
        selectedCompany,
        selectedTeam,
        searchQuery,
        selectedIndustry,
        selectedLocation,
        totalCompanies: companies.length,
        hasFilters: !!(selectedIndustry || selectedLocation || searchQuery)
      });
      
      // Show help tooltip
      setShowHelpTooltip(true);
      setTimeout(() => setShowHelpTooltip(false), 3000);
    } catch (error) {
      console.error('Quick help error:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Laddar företag...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={loadData}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Försök igen
          </button>
        </div>
      </div>
    );
  }

  const selectedCompanyData = companies.find(c => c.id === selectedCompany);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Välj Företag & Lag
            </h3>
            <div className="relative">
              <button
                onClick={handleQuickHelp}
                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Få hjälp med företagsval"
              >
                <HelpCircle size={18} />
              </button>
              {showHelpTooltip && (
                <div className="absolute top-full left-0 mt-2 p-3 bg-blue-600 text-white text-sm rounded-lg shadow-lg whitespace-nowrap z-10">
                  <div className="absolute -top-1 left-4 w-2 h-2 bg-blue-600 rotate-45"></div>
                  Klicka på AI-hjälp-knappen för företagshjälp! 🤖
                </div>
              )}
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {companies.length} företag tillgängliga
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Sök företag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
          >
            <Filter size={16} className="mr-1" />
            Filter
          </button>
          {(selectedIndustry || selectedLocation || searchQuery) && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Rensa filter
            </button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bransch
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alla branscher</option>
                {industries.map(industry => (
                  <option key={industry.name} value={industry.name}>
                    {industry.name} ({industry.count})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plats
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Alla platser</option>
                {locations.map(location => (
                  <option key={location.name} value={location.name}>
                    {location.name} ({location.count})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Company List */}
      <div className="max-h-64 overflow-y-auto border-t">
        {companies.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            Inga företag hittades
          </div>
        ) : (
          companies.map(company => (
            <div
              key={company.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                selectedCompany === company.id ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleCompanySelect(company)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center">
                    <Building2 size={16} className="text-gray-400 mr-2" />
                    <h4 className="font-medium text-gray-900">{company.name}</h4>
                  </div>
                  <div className="mt-1 text-sm text-gray-600">
                    <div className="flex items-center">
                      <MapPin size={14} className="mr-1" />
                      {company.location} • {company.industry}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-gray-500">
                    <div className="flex items-center">
                      <Users size={14} className="mr-1" />
                      {company.teamCount} lag
                    </div>
                  </div>
                </div>
                {selectedCompany === company.id && (
                  <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Team Selection */}
      {selectedCompanyData && (
        <div className="p-4 border-t bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Välj Lag:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {selectedCompanyData.teams?.map(team => (
              <button
                key={team}
                onClick={() => onTeamChange(team)}
                className={`px-3 py-2 text-sm rounded border ${
                  selectedTeam === team
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
                style={{
                  backgroundColor: selectedTeam === team ? 
                    (selectedCompanyData.colors?.[team] || '#2563eb') : 'white',
                  borderColor: selectedCompanyData.colors?.[team] || '#d1d5db',
                  color: selectedTeam === team ? 'white' : (selectedCompanyData.colors?.[team] || '#374151')
                }}
              >
                {team}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Company Info */}
      {selectedCompanyData && (
        <div className="p-4 border-t">
          <div className="text-sm text-gray-600">
            <strong>Valt:</strong> {selectedCompanyData.name} - Lag {selectedTeam}
          </div>
        </div>
      )}
    </div>
  );
};

export default UniversalCompanySelector;