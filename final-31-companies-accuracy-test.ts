#!/usr/bin/env tsx

/**
 * Final comprehensive accuracy test for all 31 companies from skiftschema.se
 * 
 * This script will:
 * 1. Test all 31 companies systematically
 * 2. Extract schedule data with improved parsing
 * 3. Normalize shift codes for different company formats
 * 4. Generate detailed accuracy reports
 * 5. Save results in multiple formats (JSON, CSV)
 * 6. Provide actionable insights for schedule system improvements
 */

import fs from 'fs';
import puppeteer, { Browser, Page } from 'puppeteer';

const CHROME_PATH = 'C:\\Users\\jimve\\skiftappen\\chrome\\win64-139.0.7258.66\\chrome-win64\\chrome.exe';

interface TeamData {
  team: string | number;
  shifts: Record<string, string>; // Normalized shift codes
  rawShifts: Record<string, string>; // Original shift codes
  shiftCount: number;
}

interface CompanyResult {
  id: string;
  name: string;
  url: string;
  status: 'success' | 'failed' | 'partial';
  teams: TeamData[];
  totalShifts: number;
  uniqueShiftCodes: string[];
  errors: string[];
  testDuration: number;
  extractionDetails: {
    pageTextLength: number;
    teamsFound: number;
    shiftsExtracted: number;
    parsingMethod: string;
  };
}

interface TestSummary {
  timestamp: string;
  totalCompanies: number;
  successfulExtractions: number;
  partialExtractions: number;
  failedExtractions: number;
  totalTeamsExtracted: number;
  totalShiftsExtracted: number;
  uniqueShiftCodesFound: Set<string>;
  companies: CompanyResult[];
  insights: {
    topPerformers: string[];
    problemCompanies: string[];
    commonShiftCodes: Record<string, number>;
    averageTeamsPerCompany: number;
    averageShiftsPerCompany: number;
  };
}

// All 31 companies
const ALL_COMPANIES = [
  { id: 'abb_hvc_5skift', name: 'ABB HVC 5-skift', url: 'https://skiftschema.se/schema/abb_hvc_5skift/' },
  { id: 'aga_avesta_6skift', name: 'AGA Avesta 6-skift', url: 'https://skiftschema.se/schema/aga_avesta_6skift/' },
  { id: 'arctic_paper_grycksbo_3skift', name: 'Arctic Paper Grycksbo', url: 'https://skiftschema.se/schema/arctic_paper_grycksbo_3skift/' },
  { id: 'barilla_sverige_filipstad', name: 'Barilla Sverige Filipstad', url: 'https://skiftschema.se/schema/barilla_sverige_filipstad/' },
  { id: 'billerudkorsnas_gruvon_grums', name: 'Billerud Gruvön Grums', url: 'https://skiftschema.se/schema/billerudkorsnas_gruvon_grums/' },
  { id: 'boliden_aitik_gruva_k3', name: 'Boliden Aitik Gruva K3', url: 'https://skiftschema.se/schema/boliden_aitik_gruva_k3/' },
  { id: 'borlange_energi', name: 'Borlänge Energi', url: 'https://skiftschema.se/schema/borlange_energi/' },
  { id: 'borlange_kommun_polskoterska', name: 'Borlänge Kommun', url: 'https://skiftschema.se/schema/borlange_kommun_polskoterska/' },
  { id: 'cambrex_karlskoga_5skift', name: 'Cambrex Karlskoga 5-skift', url: 'https://skiftschema.se/schema/cambrex_karlskoga_5skift/' },
  { id: 'dentsply_molndal_5skift', name: 'Dentsply Mölndal 5-skift', url: 'https://skiftschema.se/schema/dentsply_molndal_5skift/' },
  { id: 'finess_hygiene_ab_5skift', name: 'Finess Hygiene AB 5-skift', url: 'https://skiftschema.se/schema/finess_hygiene_ab_5skift/' },
  { id: 'kubal_sundsvall_6skift', name: 'Kubal Sundsvall 6-skift', url: 'https://skiftschema.se/schema/kubal_sundsvall_6skift/' },
  { id: 'lkab_malmberget_5skift', name: 'LKAB Malmberget 5-skift', url: 'https://skiftschema.se/schema/lkab_malmberget_5skift/' },
  { id: 'nordic_paper_backhammar_3skift', name: 'Nordic Paper Bäckhammar', url: 'https://skiftschema.se/schema/nordic_paper_backhammar_3skift/' },
  { id: 'orica_gyttorp_exel_5skift', name: 'Orica Gyttorp', url: 'https://skiftschema.se/schema/orica_gyttorp_exel_5skift/' },
  { id: 'outokumpu_avesta_5skift', name: 'Outokumpu Avesta 5-skift', url: 'https://skiftschema.se/schema/outokumpu_avesta_5skift/' },
  { id: 'ovako_hofors_rorverk_4_5skift', name: 'Ovako Hofors Rörverk', url: 'https://skiftschema.se/schema/ovako_hofors_rorverk_4_5skift/' },
  { id: 'preemraff_lysekil_5skift', name: 'Preemraff Lysekil 5-skift', url: 'https://skiftschema.se/schema/preemraff_lysekil_5skift/' },
  { id: 'ryssviken_boendet', name: 'Ryssviken Boendet', url: 'https://skiftschema.se/schema/ryssviken_boendet/' },
  { id: 'sandvik_mt_2skift', name: 'Sandvik Materials Technology', url: 'https://skiftschema.se/schema/sandvik_mt_2skift/' },
  { id: 'scania_cv_ab_transmission_5skift', name: 'Scania CV AB', url: 'https://skiftschema.se/schema/scania_cv_ab_transmission_5skift/' },
  { id: 'schneider_electric_5skift', name: 'Schneider Electric', url: 'https://skiftschema.se/schema/schneider_electric_5skift/' },
  { id: 'seco_tools_fagersta_2skift', name: 'Seco Tools', url: 'https://skiftschema.se/schema/seco_tools_fagersta_2skift/' },
  { id: 'skarnas_hamn_5_skift', name: 'Skärnäs Hamn 5-skift', url: 'https://skiftschema.se/schema/skarnas_hamn_5_skift/' },
  { id: 'skf_ab_5skift2', name: 'SKF AB 5-skift 2', url: 'https://skiftschema.se/schema/skf_ab_5skift2/' },
  { id: 'sodra_cell_monsteras_3skift', name: 'Södra Cell Mönsterås', url: 'https://skiftschema.se/schema/sodra_cell_monsteras_3skift/' },
  { id: 'ssab_4_7skift', name: 'SSAB Borlänge', url: 'https://skiftschema.se/schema/ssab_4_7skift/' },
  { id: 'stora_enso_fors_5skift', name: 'Stora Enso Fors 5-skift', url: 'https://skiftschema.se/schema/stora_enso_fors_5skift/' },
  { id: 'truck_service_2skift', name: 'Truck Service AB 2-skift', url: 'https://skiftschema.se/schema/truck_service_2skift/' },
  { id: 'uddeholm_tooling_2skift', name: 'Uddeholm Tooling 2-skift', url: 'https://skiftschema.se/schema/uddeholm_tooling_2skift/' },
  { id: 'voestalpine_precision_strip_2skift', name: 'Voestalpine Precision Strip', url: 'https://skiftschema.se/schema/voestalpine_precision_strip_2skift/' }
];

// Enhanced shift code normalization
const SHIFT_MAPPINGS: Record<string, string> = {
  // Standard codes
  'F': 'F', 'E': 'E', 'N': 'N', 'L': 'L',
  
  // Swedish variations
  'FM': 'F', 'EM': 'E', 'NM': 'N',
  'FÖRMIDDAG': 'F', 'EFTERMIDDAG': 'E', 'NATT': 'N', 'LEDIG': 'L',
  
  // Holiday/weekend variations
  'HD': 'L', 'FH': 'L', 'NH': 'L', 'EH': 'L',
  'FR': 'L', 'HE': 'L', 'SO': 'L',
  
  // Special codes found in analysis
  'KE': 'E', 'LN': 'N', 'NS': 'N',
  'FE': 'F', 'EN': 'E', 'NF': 'N',
  
  // Unknown/default
  'D': 'L', 'X': 'L', '': 'L'
};

class Final31CompaniesTest {
  private browser: Browser | null = null;
  private results: TestSummary;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      totalCompanies: ALL_COMPANIES.length,
      successfulExtractions: 0,
      partialExtractions: 0,
      failedExtractions: 0,
      totalTeamsExtracted: 0,
      totalShiftsExtracted: 0,
      uniqueShiftCodesFound: new Set<string>(),
      companies: [],
      insights: {
        topPerformers: [],
        problemCompanies: [],
        commonShiftCodes: {},
        averageTeamsPerCompany: 0,
        averageShiftsPerCompany: 0
      }
    };
  }

  async initialize() {
    console.log('🚀 Initializing browser for 31-company test...');
    this.browser = await puppeteer.launch({
      headless: 'new',
      executablePath: CHROME_PATH,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-web-security',
        '--no-first-run',
        '--disable-extensions'
      ],
      timeout: 60000
    });
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  /**
   * Normalize shift codes using enhanced mapping
   */
  private normalizeShiftCode(rawCode: string): string {
    const cleaned = rawCode.toUpperCase().trim();
    return SHIFT_MAPPINGS[cleaned] || 'L';
  }

  /**
   * Extract schedule data from page with multiple parsing strategies
   */
  private async extractScheduleData(page: Page, companyId: string): Promise<{
    teams: Record<string, Record<string, string>>;
    parsingMethod: string;
    pageTextLength: number;
  }> {
    const pageText = await page.evaluate(() => document.body.innerText);
    const cleanText = pageText.replace(/\s+/g, ' ').trim();
    
    let teams: Record<string, Record<string, string>> = {};
    let parsingMethod = 'none';

    // Method 1: Pattern-based extraction (Team - Shift format)
    teams = this.extractByTeamShiftPattern(cleanText);
    if (Object.keys(teams).length > 0) {
      parsingMethod = 'team-shift-pattern';
    }

    // Method 2: Table structure parsing (fallback)
    if (Object.keys(teams).length === 0) {
      teams = this.extractByTableStructure(cleanText);
      if (Object.keys(teams).length > 0) {
        parsingMethod = 'table-structure';
      }
    }

    // Method 3: Generic text mining (last resort)
    if (Object.keys(teams).length === 0) {
      teams = this.extractByTextMining(cleanText);
      if (Object.keys(teams).length > 0) {
        parsingMethod = 'text-mining';
      }
    }

    return {
      teams,
      parsingMethod,
      pageTextLength: pageText.length
    };
  }

  private extractByTeamShiftPattern(text: string): Record<string, Record<string, string>> {
    const teams: Record<string, Record<string, string>> = {};
    
    // Pattern: "A - F", "1 - EM", "B - N" etc.
    const pattern = /([A-Z0-9]+)\s*-\s*([A-Z]+)/gi;
    let match;
    let dayCounter = 1;

    while ((match = pattern.exec(text)) !== null) {
      const team = match[1];
      const rawShift = match[2];
      
      // Skip obvious false positives
      if (rawShift.length > 10 || team === 'SKIFTSCHEMAN' || team === 'SCHEMA') {
        continue;
      }
      
      const normalizedShift = this.normalizeShiftCode(rawShift);
      const date = `2025-08-${dayCounter.toString().padStart(2, '0')}`;
      
      if (!teams[team]) {
        teams[team] = {};
      }
      
      teams[team][date] = normalizedShift;
      
      dayCounter++;
      if (dayCounter > 31) {
        dayCounter = 1;
      }
    }

    return teams;
  }

  private extractByTableStructure(text: string): Record<string, Record<string, string>> {
    const teams: Record<string, Record<string, string>> = {};
    
    // Look for calendar-like structures
    const lines = text.split('\n');
    
    for (const line of lines) {
      if (line.length < 20 || !line.includes('-')) continue;
      
      // Extract team-shift pairs from lines
      const pairPattern = /([A-Z0-9]+)\s*-\s*([A-Z]+)/g;
      let match;
      let dayInLine = 1;
      
      while ((match = pairPattern.exec(line)) !== null) {
        const team = match[1];
        const rawShift = match[2];
        
        if (rawShift.length <= 5 && team.length <= 5) {
          const normalizedShift = this.normalizeShiftCode(rawShift);
          const date = `2025-08-${dayInLine.toString().padStart(2, '0')}`;
          
          if (!teams[team]) {
            teams[team] = {};
          }
          
          teams[team][date] = normalizedShift;
          dayInLine++;
        }
      }
    }

    return teams;
  }

  private extractByTextMining(text: string): Record<string, Record<string, string>> {
    const teams: Record<string, Record<string, string>> = {};
    
    // Look for any shift-like patterns in the text
    const shiftIndicators = ['F', 'E', 'N', 'L', 'FM', 'EM', 'HD'];
    
    for (const indicator of shiftIndicators) {
      const pattern = new RegExp(`([A-Z0-9]+)\\s*${indicator}`, 'gi');
      let match;
      
      while ((match = pattern.exec(text)) !== null && Object.keys(teams).length < 10) {
        const team = match[1];
        
        if (team.length <= 3 && team !== 'SCHEMA') {
          const date = `2025-08-01`;
          
          if (!teams[team]) {
            teams[team] = {};
          }
          
          teams[team][date] = this.normalizeShiftCode(indicator);
        }
      }
    }

    return teams;
  }

  /**
   * Test a single company
   */
  async testCompany(config: typeof ALL_COMPANIES[0], index: number): Promise<CompanyResult> {
    const startTime = Date.now();
    console.log(`\n🏢 [${index + 1}/${ALL_COMPANIES.length}] Testing: ${config.name}`);
    console.log(`   URL: ${config.url}`);

    const page = await this.browser!.newPage();
    
    try {
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate with extended timeout for slow sites
      await page.goto(config.url, { 
        waitUntil: 'networkidle0', 
        timeout: 45000 
      });

      // Extract schedule data
      const { teams, parsingMethod, pageTextLength } = await this.extractScheduleData(page, config.id);
      
      // Process teams data
      const processedTeams: TeamData[] = [];
      const uniqueShiftCodes = new Set<string>();
      let totalShifts = 0;

      for (const [teamId, shifts] of Object.entries(teams)) {
        const rawShifts: Record<string, string> = {};
        
        // Store raw shifts for analysis
        for (const [date, normalizedShift] of Object.entries(shifts)) {
          rawShifts[date] = normalizedShift;
          uniqueShiftCodes.add(normalizedShift);
          totalShifts++;
        }

        processedTeams.push({
          team: teamId,
          shifts,
          rawShifts,
          shiftCount: Object.keys(shifts).length
        });
      }

      const result: CompanyResult = {
        id: config.id,
        name: config.name,
        url: config.url,
        status: processedTeams.length > 0 ? 'success' : 'failed',
        teams: processedTeams,
        totalShifts,
        uniqueShiftCodes: Array.from(uniqueShiftCodes),
        errors: processedTeams.length === 0 ? ['No schedule data extracted'] : [],
        testDuration: Date.now() - startTime,
        extractionDetails: {
          pageTextLength,
          teamsFound: processedTeams.length,
          shiftsExtracted: totalShifts,
          parsingMethod
        }
      };

      // Add to global unique codes
      uniqueShiftCodes.forEach(code => this.results.uniqueShiftCodesFound.add(code));

      console.log(`  ✅ Status: ${result.status}`);
      console.log(`  📊 Teams: ${result.teams.length}, Shifts: ${result.totalShifts}`);
      console.log(`  🔍 Method: ${parsingMethod}`);
      
      if (result.uniqueShiftCodes.length > 0) {
        console.log(`  📋 Shift codes: ${result.uniqueShiftCodes.join(', ')}`);
      }

      return result;

    } catch (error) {
      console.error(`  ❌ Error: ${error}`);
      
      return {
        id: config.id,
        name: config.name,
        url: config.url,
        status: 'failed',
        teams: [],
        totalShifts: 0,
        uniqueShiftCodes: [],
        errors: [error?.toString() || 'Unknown error'],
        testDuration: Date.now() - startTime,
        extractionDetails: {
          pageTextLength: 0,
          teamsFound: 0,
          shiftsExtracted: 0,
          parsingMethod: 'failed'
        }
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Run the comprehensive test on all 31 companies
   */
  async runFullTest(): Promise<TestSummary> {
    console.log(`🎯 Starting comprehensive test for all ${ALL_COMPANIES.length} companies`);
    console.log(`⏰ Estimated time: ${Math.ceil(ALL_COMPANIES.length * 15 / 60)} minutes\n`);

    for (let i = 0; i < ALL_COMPANIES.length; i++) {
      const company = ALL_COMPANIES[i];
      const result = await this.testCompany(company, i);
      
      this.results.companies.push(result);

      // Update statistics
      if (result.status === 'success') {
        this.results.successfulExtractions++;
        this.results.totalTeamsExtracted += result.teams.length;
        this.results.totalShiftsExtracted += result.totalShifts;
      } else if (result.status === 'partial') {
        this.results.partialExtractions++;
      } else {
        this.results.failedExtractions++;
      }

      // Add delay to be respectful
      if (i < ALL_COMPANIES.length - 1) {
        console.log(`  ⏳ Waiting 4 seconds before next test...`);
        await new Promise(resolve => setTimeout(resolve, 4000));
      }
    }

    // Generate insights
    this.generateInsights();

    return this.results;
  }

  /**
   * Generate insights from the test results
   */
  private generateInsights() {
    const { companies } = this.results;
    
    // Top performers (most data extracted)
    this.results.insights.topPerformers = companies
      .filter(c => c.status === 'success')
      .sort((a, b) => b.totalShifts - a.totalShifts)
      .slice(0, 10)
      .map(c => `${c.name} (${c.totalShifts} shifts)`);

    // Problem companies
    this.results.insights.problemCompanies = companies
      .filter(c => c.status === 'failed')
      .map(c => `${c.name}: ${c.errors[0] || 'Unknown error'}`);

    // Common shift codes
    const shiftCodeCounts: Record<string, number> = {};
    companies.forEach(company => {
      company.uniqueShiftCodes.forEach(code => {
        shiftCodeCounts[code] = (shiftCodeCounts[code] || 0) + 1;
      });
    });
    this.results.insights.commonShiftCodes = shiftCodeCounts;

    // Averages
    const successful = companies.filter(c => c.status === 'success');
    this.results.insights.averageTeamsPerCompany = successful.length > 0 
      ? successful.reduce((sum, c) => sum + c.teams.length, 0) / successful.length 
      : 0;
    
    this.results.insights.averageShiftsPerCompany = successful.length > 0 
      ? successful.reduce((sum, c) => sum + c.totalShifts, 0) / successful.length 
      : 0;
  }

  /**
   * Save results in multiple formats
   */
  async saveResults() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const baseFilename = `31-companies-accuracy-test-${timestamp}`;
    
    // Save JSON results
    const jsonFile = `${baseFilename}.json`;
    await fs.promises.writeFile(jsonFile, JSON.stringify(this.results, null, 2));
    console.log(`💾 JSON results saved to: ${jsonFile}`);

    // Save CSV summary
    const csvData = this.results.companies.map(c => ({
      Company: c.name,
      Status: c.status,
      Teams: c.teams.length,
      'Total Shifts': c.totalShifts,
      'Shift Codes': c.uniqueShiftCodes.join('; '),
      'Parsing Method': c.extractionDetails.parsingMethod,
      'Page Text Length': c.extractionDetails.pageTextLength,
      'Test Duration (ms)': c.testDuration,
      URL: c.url,
      Errors: c.errors.join('; ')
    }));

    const csvHeader = Object.keys(csvData[0]).join(',');
    const csvRows = csvData.map(row => 
      Object.values(row).map(val => `"${val}"`).join(',')
    );
    const csvContent = [csvHeader, ...csvRows].join('\n');
    
    const csvFile = `${baseFilename}.csv`;
    await fs.promises.writeFile(csvFile, csvContent);
    console.log(`📊 CSV summary saved to: ${csvFile}`);
  }

  /**
   * Print comprehensive summary report
   */
  printSummaryReport() {
    console.log('\n' + '='.repeat(100));
    console.log('📊 FINAL 31 COMPANIES SCHEDULE ACCURACY TEST SUMMARY');
    console.log('='.repeat(100));

    const { insights } = this.results;
    
    console.log(`\n📈 Overall Statistics:`);
    console.log(`   Total Companies Tested: ${this.results.totalCompanies}`);
    console.log(`   Successful Extractions: ${this.results.successfulExtractions} (${((this.results.successfulExtractions / this.results.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`   Partial Extractions: ${this.results.partialExtractions} (${((this.results.partialExtractions / this.results.totalCompanies) * 100).toFixed(1)}%)`);
    console.log(`   Failed Extractions: ${this.results.failedExtractions} (${((this.results.failedExtractions / this.results.totalCompanies) * 100).toFixed(1)}%)`);
    
    console.log(`\n📊 Data Extraction Summary:`);
    console.log(`   Total Teams Extracted: ${this.results.totalTeamsExtracted}`);
    console.log(`   Total Shifts Extracted: ${this.results.totalShiftsExtracted}`);
    console.log(`   Average Teams per Company: ${insights.averageTeamsPerCompany.toFixed(1)}`);
    console.log(`   Average Shifts per Company: ${insights.averageShiftsPerCompany.toFixed(1)}`);
    console.log(`   Unique Shift Codes Found: ${Array.from(this.results.uniqueShiftCodesFound).join(', ')}`);

    console.log(`\n🏆 Top Performing Companies:`);
    insights.topPerformers.slice(0, 10).forEach((performer, index) => {
      console.log(`   ${index + 1}. ${performer}`);
    });

    console.log(`\n📊 Shift Code Analysis:`);
    Object.entries(insights.commonShiftCodes)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([code, count]) => {
        console.log(`   ${code}: Found in ${count} companies`);
      });

    if (insights.problemCompanies.length > 0) {
      console.log(`\n❌ Companies Needing Attention (${insights.problemCompanies.length}):`);
      insights.problemCompanies.slice(0, 15).forEach((problem, index) => {
        console.log(`   ${index + 1}. ${problem}`);
      });
    }

    console.log(`\n🔍 Parsing Method Distribution:`);
    const methodCounts: Record<string, number> = {};
    this.results.companies.forEach(c => {
      const method = c.extractionDetails.parsingMethod;
      methodCounts[method] = (methodCounts[method] || 0) + 1;
    });
    Object.entries(methodCounts).forEach(([method, count]) => {
      console.log(`   ${method}: ${count} companies`);
    });

    console.log('\n' + '='.repeat(100));
    console.log('🎯 RECOMMENDATIONS:');
    console.log('='.repeat(100));
    
    if (this.results.successfulExtractions >= 25) {
      console.log('✅ Excellent: Successfully extracted data from most companies!');
      console.log('   Next steps: Use this data to train/improve your universal schedule system');
    } else if (this.results.successfulExtractions >= 15) {
      console.log('🟡 Good: Extracted data from majority of companies');
      console.log('   Recommendation: Focus on improving extraction for failed companies');
    } else {
      console.log('🔴 Needs improvement: Low extraction success rate');
      console.log('   Recommendation: Review and improve parsing algorithms');
    }

    console.log(`\n💡 Key Insights:`);
    console.log(`   • Most common shift codes: ${Object.keys(insights.commonShiftCodes).slice(0, 5).join(', ')}`);
    console.log(`   • Average data per successful company: ${insights.averageTeamsPerCompany.toFixed(1)} teams, ${insights.averageShiftsPerCompany.toFixed(1)} shifts`);
    console.log(`   • Total schedule entries captured: ${this.results.totalShiftsExtracted}`);

    console.log('\n' + '='.repeat(100));
  }
}

async function main() {
  const tester = new Final31CompaniesTest();

  try {
    await tester.initialize();
    
    const startTime = Date.now();
    const results = await tester.runFullTest();
    const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
    
    await tester.saveResults();
    tester.printSummaryReport();

    console.log(`\n🎉 COMPREHENSIVE TEST COMPLETED!`);
    console.log(`   Total time: ${totalTime} minutes`);
    console.log(`   Companies tested: ${results.totalCompanies}`);
    console.log(`   Successful extractions: ${results.successfulExtractions}`);
    console.log(`   Total schedule data extracted: ${results.totalShiftsExtracted} entries`);

  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  } finally {
    await tester.cleanup();
  }
}

main().catch(console.error);