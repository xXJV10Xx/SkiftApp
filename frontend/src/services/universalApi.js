/**
 * Universal Schedule Generator API Service
 * Connects frontend to the universal backend supporting 30+ companies
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003/api/universal';

class UniversalApiService {
  /**
   * Get all supported companies
   */
  async getCompanies(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.location) params.append('location', filters.location);
      
      const url = `${API_BASE_URL}/companies${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }

  /**
   * Search companies by query
   */
  async searchCompanies(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (filters.industry) params.append('industry', filters.industry);
      if (filters.location) params.append('location', filters.location);
      
      const response = await fetch(`${API_BASE_URL}/companies/search?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to search companies: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  }

  /**
   * Get specific company details
   */
  async getCompany(companyId) {
    try {
      const response = await fetch(`${API_BASE_URL}/companies/${companyId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch company: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  }

  /**
   * Generate schedule for specific company and team
   */
  async generateSchedule(companyId, teamId, startDate, endDate) {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      
      const response = await fetch(`${API_BASE_URL}/schedule/${companyId}/${teamId}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate schedule: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw error;
    }
  }

  /**
   * Generate monthly calendar
   */
  async generateMonthlyCalendar(companyId, teamId, year, month) {
    try {
      const response = await fetch(`${API_BASE_URL}/monthly/${companyId}/${teamId}/${year}/${month}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate monthly calendar: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating monthly calendar:', error);
      throw error;
    }
  }

  /**
   * Generate yearly calendar
   */
  async generateYearlyCalendar(companyId, teamId, year) {
    try {
      const response = await fetch(`${API_BASE_URL}/yearly/${companyId}/${teamId}/${year}`);
      
      if (!response.ok) {
        throw new Error(`Failed to generate yearly calendar: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error generating yearly calendar:', error);
      throw error;
    }
  }

  /**
   * Get shift for specific date
   */
  async getShiftForDate(companyId, teamId, date) {
    try {
      const response = await fetch(`${API_BASE_URL}/shift/${companyId}/${teamId}/${date}`);
      
      if (!response.ok) {
        throw new Error(`Failed to get shift: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting shift:', error);
      throw error;
    }
  }

  /**
   * Compare multiple companies
   */
  async compareCompanies(year, month, companies, teams) {
    try {
      const params = new URLSearchParams();
      params.append('companies', companies.join(','));
      params.append('teams', JSON.stringify(teams));
      
      const response = await fetch(`${API_BASE_URL}/compare/${year}/${month}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to compare companies: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error comparing companies:', error);
      throw error;
    }
  }

  /**
   * Batch process multiple schedule requests
   */
  async batchProcess(requests) {
    try {
      const response = await fetch(`${API_BASE_URL}/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ requests })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to process batch requests: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error processing batch requests:', error);
      throw error;
    }
  }

  /**
   * Export schedule in different formats
   */
  async exportSchedule(companyId, teamId, startDate, endDate, format = 'json') {
    try {
      const params = new URLSearchParams();
      params.append('startDate', startDate);
      params.append('endDate', endDate);
      params.append('format', format);
      
      const response = await fetch(`${API_BASE_URL}/export/${companyId}/${teamId}?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`Failed to export schedule: ${response.statusText}`);
      }
      
      if (format === 'csv') {
        return await response.text();
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error exporting schedule:', error);
      throw error;
    }
  }

  /**
   * Get system health and statistics
   */
  async getSystemHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/system/health`);
      
      if (!response.ok) {
        throw new Error(`Failed to get system health: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Get all industries
   */
  async getIndustries() {
    try {
      const response = await fetch(`${API_BASE_URL}/industries`);
      
      if (!response.ok) {
        throw new Error(`Failed to get industries: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting industries:', error);
      throw error;
    }
  }

  /**
   * Get all locations
   */
  async getLocations() {
    try {
      const response = await fetch(`${API_BASE_URL}/locations`);
      
      if (!response.ok) {
        throw new Error(`Failed to get locations: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting locations:', error);
      throw error;
    }
  }

  /**
   * Performance testing endpoint
   */
  async testPerformance() {
    try {
      const response = await fetch(`${API_BASE_URL}/performance`);
      
      if (!response.ok) {
        throw new Error(`Failed to test performance: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error testing performance:', error);
      throw error;
    }
  }

  /**
   * Clear system cache
   */
  async clearCache() {
    try {
      const response = await fetch(`${API_BASE_URL}/system/cache`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to clear cache: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Helper method to download exported files
   */
  downloadExport(data, filename, format = 'json') {
    const blob = new Blob(
      [format === 'json' ? JSON.stringify(data, null, 2) : data],
      { type: format === 'json' ? 'application/json' : 'text/csv' }
    );
    
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Format dates for API calls
   */
  formatDate(date) {
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  }

  /**
   * Get current month date range
   */
  getCurrentMonthRange() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    
    return {
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
      year,
      month: month + 1
    };
  }
}

// Create singleton instance
const universalApi = new UniversalApiService();

export default universalApi;