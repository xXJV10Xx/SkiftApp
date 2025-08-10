// 🧪 COMPLETE VALIDATION TEST FOR ALL 17 COMPANIES
// SkiftApp 2025 - 100% Accuracy Validation for Rork AI Project

import { 
  CompleteSkiftSystemGenerator, 
  COMPLETE_COMPANIES, 
  RORK_AI_CONFIG,
  ShiftSchedule 
} from './RORK_AI_COMPLETE_SYSTEM';

interface ValidationResult {
  companyId: string;
  displayName: string;
  teamsCount: number;
  scheduleValidation: {
    isValid: boolean;
    errors: string[];
    sampleDates: string[];
  };
  patternValidation: {
    cycleLength: number;
    workDays: number;
    restDays: number;
  };
}

class ComprehensiveValidator {
  
  /**
   * Test all 17 companies for schedule accuracy
   */
  static async validateAllCompanies(): Promise<void> {
    console.log('🏭 COMPLETE VALIDATION: All 17 Companies from SkiftSchema.se');
    console.log('=' .repeat(80));
    
    const results: ValidationResult[] = [];
    const startDate = '2025-01-01';
    const endDate = '2025-03-31'; // 3 months validation
    
    console.log(`📊 RORK AI PROJECT: ${RORK_AI_CONFIG.displayName}`);
    console.log(`📦 Package: ${RORK_AI_CONFIG.packageName}`);
    console.log(`🏢 Total Companies: ${RORK_AI_CONFIG.totalCompanies}`);
    console.log(`👥 Total Teams: ${RORK_AI_CONFIG.totalTeams}`);
    console.log('=' .repeat(80));
    
    for (const company of COMPLETE_COMPANIES) {
      console.log(`\n🏭 Testing: ${company.displayName}`);
      console.log(`📍 Location: ${company.location} | Industry: ${company.industry}`);
      console.log(`⚙️ Shift Type: ${company.shiftType} | Teams: ${company.teams.length}`);
      
      try {
        // Generate schedules for all teams
        const allSchedules = CompleteSkiftSystemGenerator.generateCompanySchedules(
          company.companyId, 
          startDate, 
          endDate
        );
        
        // Validate schedules
        const validation = CompleteSkiftSystemGenerator.validateSchedule(
          company.companyId,
          allSchedules
        );
        
        // Get sample dates for inspection
        const sampleDates = this.getSampleDates(allSchedules, 5);
        
        const result: ValidationResult = {
          companyId: company.companyId,
          displayName: company.displayName,
          teamsCount: company.teams.length,
          scheduleValidation: {
            isValid: validation.isValid,
            errors: validation.errors,
            sampleDates
          },
          patternValidation: {
            cycleLength: company.patterns[0].totalCycle,
            workDays: company.patterns[0].workDays,
            restDays: company.patterns[0].restDays
          }
        };
        
        results.push(result);
        
        // Display immediate results
        console.log(`✅ Status: ${validation.isValid ? 'VALID' : 'INVALID'}`);
        console.log(`📊 Total Schedules: ${allSchedules.length}`);
        console.log(`🔄 Cycle: ${result.patternValidation.cycleLength} days (${result.patternValidation.workDays} work, ${result.patternValidation.restDays} rest)`);
        
        if (validation.errors.length > 0) {
          console.log(`❌ Errors: ${validation.errors.length}`);
          validation.errors.slice(0, 3).forEach(error => console.log(`   - ${error}`));
        }
        
        // Show sample team schedules
        company.teams.slice(0, 2).forEach(team => {
          const teamSchedules = allSchedules.filter(s => s.teamId === team.teamId).slice(0, 7);
          const schedule = teamSchedules.map(s => `${s.date.slice(-2)}:${s.shiftType}`).join(' ');
          console.log(`   ${team.displayName}: ${schedule}...`);
        });
        
      } catch (error) {
        console.log(`❌ ERROR: ${error}`);
        results.push({
          companyId: company.companyId,
          displayName: company.displayName,
          teamsCount: company.teams.length,
          scheduleValidation: {
            isValid: false,
            errors: [error.toString()],
            sampleDates: []
          },
          patternValidation: {
            cycleLength: 0,
            workDays: 0,
            restDays: 0
          }
        });
      }
    }
    
    // Summary Report
    this.generateSummaryReport(results);
  }
  
  /**
   * Get sample dates from schedules for inspection
   */
  private static getSampleDates(schedules: ShiftSchedule[], count: number): string[] {
    const sampleSchedules = schedules.slice(0, count);
    return sampleSchedules.map(s => `${s.date}: ${s.teamId}=${s.shiftType}`);
  }
  
  /**
   * Generate comprehensive summary report
   */
  private static generateSummaryReport(results: ValidationResult[]): void {
    console.log('\n' + '=' .repeat(80));
    console.log('📋 COMPREHENSIVE VALIDATION SUMMARY');
    console.log('=' .repeat(80));
    
    const totalCompanies = results.length;
    const validCompanies = results.filter(r => r.scheduleValidation.isValid).length;
    const totalTeams = results.reduce((sum, r) => sum + r.teamsCount, 0);
    
    console.log(`🏢 Companies Tested: ${totalCompanies}`);
    console.log(`✅ Valid Companies: ${validCompanies}/${totalCompanies} (${((validCompanies/totalCompanies)*100).toFixed(1)}%)`);
    console.log(`👥 Total Teams: ${totalTeams}`);
    
    // Industry breakdown
    console.log('\n📊 BY INDUSTRY:');
    const industriesCovered = Object.keys(RORK_AI_CONFIG.companiesByIndustry);
    industriesCovered.forEach(industry => {
      const companiesInIndustry = RORK_AI_CONFIG.companiesByIndustry[industry];
      const validInIndustry = results.filter(r => 
        companiesInIndustry.includes(r.companyId) && r.scheduleValidation.isValid
      ).length;
      console.log(`   ${industry}: ${validInIndustry}/${companiesInIndustry.length}`);
    });
    
    // Show any errors
    const errorCompanies = results.filter(r => !r.scheduleValidation.isValid);
    if (errorCompanies.length > 0) {
      console.log('\n❌ COMPANIES WITH ISSUES:');
      errorCompanies.forEach(company => {
        console.log(`   ${company.displayName}: ${company.scheduleValidation.errors.length} errors`);
        company.scheduleValidation.errors.slice(0, 2).forEach(error => {
          console.log(`      - ${error}`);
        });
      });
    }
    
    // Deployment readiness
    console.log('\n🚀 RORK AI DEPLOYMENT READINESS:');
    console.log(`   Package: ${RORK_AI_CONFIG.packageName}`);
    console.log(`   Version: ${RORK_AI_CONFIG.version}`);
    console.log(`   Status: ${validCompanies === totalCompanies ? '✅ READY FOR DEPLOYMENT' : '⚠️ NEEDS FIXES'}`);
    
    if (validCompanies === totalCompanies) {
      console.log('\n🎉 ALL COMPANIES VALIDATED - 100% ACCURACY ACHIEVED!');
      console.log('   Ready for Rork AI project deployment with complete skiftschema.se coverage');
    }
    
    console.log('\n' + '=' .repeat(80));
  }
  
  /**
   * Test specific company in detail
   */
  static testCompanyDetail(companyId: string): void {
    console.log(`🔍 DETAILED TEST: ${companyId}`);
    console.log('-' .repeat(60));
    
    const company = COMPLETE_COMPANIES.find(c => c.companyId === companyId);
    if (!company) {
      console.log(`❌ Company ${companyId} not found`);
      return;
    }
    
    // Test each team
    company.teams.forEach(team => {
      console.log(`\n👥 Testing Team: ${team.displayName}`);
      
      const schedules = CompleteSkiftSystemGenerator.generateSchedule(
        companyId,
        team.teamId,
        '2025-01-01',
        '2025-01-31'
      );
      
      // Show first week
      const firstWeek = schedules.slice(0, 7);
      console.log('   First week:');
      firstWeek.forEach(day => {
        console.log(`   ${day.date}: ${day.shiftType} (${day.startTime}-${day.endTime}, ${day.hoursWorked}h)`);
      });
      
      // Pattern analysis
      const shifts = schedules.map(s => s.shiftType);
      const workDays = shifts.filter(s => s !== 'L').length;
      const restDays = shifts.filter(s => s === 'L').length;
      console.log(`   Pattern: ${workDays} work days, ${restDays} rest days in ${shifts.length} days`);
    });
  }
}

// Run validation
async function main() {
  try {
    await ComprehensiveValidator.validateAllCompanies();
    
    // Test specific companies for detailed analysis
    console.log('\n🔬 DETAILED TESTS:');
    ComprehensiveValidator.testCompanyDetail('ssab-oxelosund');
    ComprehensiveValidator.testCompanyDetail('ovako-hofors');
    ComprehensiveValidator.testCompanyDetail('ssab-borlange');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  }
}

// Run if this is the main module
main();

export default ComprehensiveValidator;