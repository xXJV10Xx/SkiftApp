const axios = require('axios');
const cheerio = require('cheerio');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Base URL for the shift schedule website
const BASE_URL = 'https://example-shift-site.se'; // Replace with actual URL

class ShiftScraper {
  constructor() {
    this.companies = new Map();
    this.locations = new Map();
    this.teams = new Map();
    this.shifts = [];
  }

  async scrapeCompanies() {
    try {
      console.log('Hämtar företag...');
      const response = await axios.get(`${BASE_URL}/companies`);
      const $ = cheerio.load(response.data);
      
      $('.company-item').each((index, element) => {
        const id = $(element).attr('data-id');
        const name = $(element).find('.company-name').text().trim();
        
        if (id && name) {
          this.companies.set(id, { id, name });
        }
      });
      
      console.log(`Hittade ${this.companies.size} företag`);
    } catch (error) {
      console.error('Fel vid hämtning av företag:', error.message);
    }
  }

  async scrapeLocations(companyId) {
    try {
      console.log(`Hämtar orter för företag ${companyId}...`);
      const response = await axios.get(`${BASE_URL}/companies/${companyId}/locations`);
      const $ = cheerio.load(response.data);
      
      $('.location-item').each((index, element) => {
        const id = $(element).attr('data-id');
        const name = $(element).find('.location-name').text().trim();
        
        if (id && name) {
          this.locations.set(id, { 
            id, 
            name, 
            company_id: companyId 
          });
        }
      });
      
      console.log(`Hittade ${this.locations.size} orter`);
    } catch (error) {
      console.error(`Fel vid hämtning av orter för företag ${companyId}:`, error.message);
    }
  }

  async scrapeTeams(locationId) {
    try {
      console.log(`Hämtar skiftlag för ort ${locationId}...`);
      const response = await axios.get(`${BASE_URL}/locations/${locationId}/teams`);
      const $ = cheerio.load(response.data);
      
      $('.team-item').each((index, element) => {
        const id = $(element).attr('data-id');
        const name = $(element).find('.team-name').text().trim();
        const color = $(element).attr('data-color') || this.getTeamColor(name);
        
        if (id && name) {
          this.teams.set(id, { 
            id, 
            name, 
            color,
            location_id: locationId 
          });
        }
      });
      
      console.log(`Hittade ${this.teams.size} skiftlag`);
    } catch (error) {
      console.error(`Fel vid hämtning av skiftlag för ort ${locationId}:`, error.message);
    }
  }

  async scrapeShifts(teamId, startDate, endDate) {
    try {
      console.log(`Hämtar skift för lag ${teamId}...`);
      const response = await axios.get(`${BASE_URL}/teams/${teamId}/shifts`, {
        params: {
          start_date: startDate,
          end_date: endDate
        }
      });
      const $ = cheerio.load(response.data);
      
      $('.shift-item').each((index, element) => {
        const date = $(element).attr('data-date');
        const shiftType = $(element).find('.shift-type').text().trim();
        const startTime = $(element).find('.start-time').text().trim();
        const endTime = $(element).find('.end-time').text().trim();
        
        if (date && shiftType) {
          this.shifts.push({
            team_id: teamId,
            date: date,
            shift_type: shiftType,
            start_time: startTime,
            end_time: endTime,
            created_at: new Date().toISOString()
          });
        }
      });
      
      console.log(`Hittade ${this.shifts.length} skift`);
    } catch (error) {
      console.error(`Fel vid hämtning av skift för lag ${teamId}:`, error.message);
    }
  }

  getTeamColor(teamName) {
    const colors = {
      'A-lag': '#FF6B6B',
      'B-lag': '#4ECDC4', 
      'C-lag': '#45B7D1',
      'D-lag': '#96CEB4',
      'E-lag': '#FFEAA7',
      'F-lag': '#DDA0DD'
    };
    
    return colors[teamName] || '#95A5A6';
  }

  async saveToSupabase() {
    try {
      console.log('Sparar data till Supabase...');
      
      // Spara företag
      if (this.companies.size > 0) {
        const companiesArray = Array.from(this.companies.values());
        const { error: companiesError } = await supabase
          .from('companies')
          .upsert(companiesArray, { onConflict: 'id' });
        
        if (companiesError) throw companiesError;
        console.log(`Sparade ${companiesArray.length} företag`);
      }

      // Spara orter
      if (this.locations.size > 0) {
        const locationsArray = Array.from(this.locations.values());
        const { error: locationsError } = await supabase
          .from('locations')
          .upsert(locationsArray, { onConflict: 'id' });
        
        if (locationsError) throw locationsError;
        console.log(`Sparade ${locationsArray.length} orter`);
      }

      // Spara skiftlag
      if (this.teams.size > 0) {
        const teamsArray = Array.from(this.teams.values());
        const { error: teamsError } = await supabase
          .from('teams')
          .upsert(teamsArray, { onConflict: 'id' });
        
        if (teamsError) throw teamsError;
        console.log(`Sparade ${teamsArray.length} skiftlag`);
      }

      // Spara skift
      if (this.shifts.length > 0) {
        const { error: shiftsError } = await supabase
          .from('shifts')
          .upsert(this.shifts, { onConflict: 'team_id,date' });
        
        if (shiftsError) throw shiftsError;
        console.log(`Sparade ${this.shifts.length} skift`);
      }

    } catch (error) {
      console.error('Fel vid sparande till Supabase:', error.message);
    }
  }

  async scrapeAll() {
    console.log('Startar fullständig scraping...');
    
    // Hämta alla företag
    await this.scrapeCompanies();
    
    // För varje företag, hämta orter
    for (const company of this.companies.values()) {
      await this.scrapeLocations(company.id);
      
      // Liten paus mellan requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // För varje ort, hämta skiftlag
    for (const location of this.locations.values()) {
      await this.scrapeTeams(location.id);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // För varje skiftlag, hämta skift för nästa 3 månader
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    for (const team of this.teams.values()) {
      await this.scrapeShifts(team.id, startDate, endDate);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Spara allt till Supabase
    await this.saveToSupabase();
    
    console.log('Scraping komplett!');
  }
}

// Kör scraper om detta script körs direkt
if (require.main === module) {
  const scraper = new ShiftScraper();
  scraper.scrapeAll().catch(console.error);
}

module.exports = ShiftScraper;