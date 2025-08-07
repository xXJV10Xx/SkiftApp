# Schedule Accuracy Testing System

This comprehensive testing system verifies the accuracy of schedule data extraction from all 31 companies listed on skiftschema.se. The system uses both Playwright and Puppeteer to systematically test each company's website and extract shift schedule data.

## Overview

The testing system includes multiple scripts designed for different testing scenarios:

1. **Sample Testing** - Quick validation with a few companies
2. **Comprehensive Testing** - Detailed analysis of key companies  
3. **Full 31-Company Testing** - Complete analysis of all companies
4. **Diagnostic Tools** - Debug and analyze page structures

## Test Scripts

### 1. Sample Test (`npm run test:accuracy:sample`)
**File:** `test-accuracy-sample.ts`
- Tests 3 representative companies
- Quick validation (< 5 minutes)
- Good for initial testing and debugging

```bash
npm run test:accuracy:sample
```

### 2. Comprehensive Test (`npm run test:accuracy:comprehensive`)  
**File:** `comprehensive-schedule-accuracy-test.ts`
- Tests 5 selected companies with detailed analysis
- Includes shift code normalization
- Moderate runtime (~10 minutes)

```bash
npm run test:accuracy:comprehensive
```

### 3. Final 31-Company Test (`npm run test:accuracy:final`)
**File:** `final-31-companies-accuracy-test.ts`
- Tests all 31 companies from skiftschema.se
- Comprehensive data extraction and analysis
- Full runtime (~60 minutes)
- Generates detailed reports in JSON and CSV formats

```bash
npm run test:accuracy:final
```

### 4. Playwright Version (`npm run test:accuracy`)
**File:** `playwright-schedule-accuracy-test.ts`
- Modern Playwright-based testing
- Requires Playwright browser installation
- Most robust and feature-complete

```bash
npm install playwright
npx playwright install chromium
npm run test:accuracy
```

### 5. Puppeteer Version (`npm run test:accuracy:puppeteer`)
**File:** `puppeteer-schedule-accuracy-test.ts`
- Uses existing Puppeteer setup
- Works with pre-installed Chrome
- No additional browser installation needed

```bash
npm run test:accuracy:puppeteer
```

## Diagnostic Tools

### Diagnostic Scraper
**File:** `diagnostic-scraper.ts`
- Analyzes page structure and content
- Helps debug extraction issues
- Shows browser window for visual debugging

```bash
npx tsx diagnostic-scraper.ts
```

## Company Coverage

The testing system covers all 31 companies:

| Company | ID | URL |
|---------|----|----|
| ABB HVC 5-skift | `abb_hvc_5skift` | https://skiftschema.se/schema/abb_hvc_5skift/ |
| AGA Avesta 6-skift | `aga_avesta_6skift` | https://skiftschema.se/schema/aga_avesta_6skift/ |
| Arctic Paper Grycksbo | `arctic_paper_grycksbo_3skift` | https://skiftschema.se/schema/arctic_paper_grycksbo_3skift/ |
| Barilla Sverige Filipstad | `barilla_sverige_filipstad` | https://skiftschema.se/schema/barilla_sverige_filipstad/ |
| Billerud Gruvön Grums | `billerudkorsnas_gruvon_grums` | https://skiftschema.se/schema/billerudkorsnas_gruvon_grums/ |
| Boliden Aitik Gruva K3 | `boliden_aitik_gruva_k3` | https://skiftschema.se/schema/boliden_aitik_gruva_k3/ |
| Borlänge Energi | `borlange_energi` | https://skiftschema.se/schema/borlange_energi/ |
| Borlänge Kommun | `borlange_kommun_polskoterska` | https://skiftschema.se/schema/borlange_kommun_polskoterska/ |
| Cambrex Karlskoga 5-skift | `cambrex_karlskoga_5skift` | https://skiftschema.se/schema/cambrex_karlskoga_5skift/ |
| Dentsply Mölndal 5-skift | `dentsply_molndal_5skift` | https://skiftschema.se/schema/dentsply_molndal_5skift/ |
| Finess Hygiene AB 5-skift | `finess_hygiene_ab_5skift` | https://skiftschema.se/schema/finess_hygiene_ab_5skift/ |
| Kubal Sundsvall 6-skift | `kubal_sundsvall_6skift` | https://skiftschema.se/schema/kubal_sundsvall_6skift/ |
| LKAB Malmberget 5-skift | `lkab_malmberget_5skift` | https://skiftschema.se/schema/lkab_malmberget_5skift/ |
| Nordic Paper Bäckhammar | `nordic_paper_backhammar_3skift` | https://skiftschema.se/schema/nordic_paper_backhammar_3skift/ |
| Orica Gyttorp | `orica_gyttorp_exel_5skift` | https://skiftschema.se/schema/orica_gyttorp_exel_5skift/ |
| Outokumpu Avesta 5-skift | `outokumpu_avesta_5skift` | https://skiftschema.se/schema/outokumpu_avesta_5skift/ |
| Ovako Hofors Rörverk | `ovako_hofors_rorverk_4_5skift` | https://skiftschema.se/schema/ovako_hofors_rorverk_4_5skift/ |
| Preemraff Lysekil 5-skift | `preemraff_lysekil_5skift` | https://skiftschema.se/schema/preemraff_lysekil_5skift/ |
| Ryssviken Boendet | `ryssviken_boendet` | https://skiftschema.se/schema/ryssviken_boendet/ |
| Sandvik Materials Technology | `sandvik_mt_2skift` | https://skiftschema.se/schema/sandvik_mt_2skift/ |
| Scania CV AB | `scania_cv_ab_transmission_5skift` | https://skiftschema.se/schema/scania_cv_ab_transmission_5skift/ |
| Schneider Electric | `schneider_electric_5skift` | https://skiftschema.se/schema/schneider_electric_5skift/ |
| Seco Tools | `seco_tools_fagersta_2skift` | https://skiftschema.se/schema/seco_tools_fagersta_2skift/ |
| Skärnäs Hamn 5-skift | `skarnas_hamn_5_skift` | https://skiftschema.se/schema/skarnas_hamn_5_skift/ |
| SKF AB 5-skift 2 | `skf_ab_5skift2` | https://skiftschema.se/schema/skf_ab_5skift2/ |
| Södra Cell Mönsterås | `sodra_cell_monsteras_3skift` | https://skiftschema.se/schema/sodra_cell_monsteras_3skift/ |
| SSAB Borlänge | `ssab_4_7skift` | https://skiftschema.se/schema/ssab_4_7skift/ |
| Stora Enso Fors 5-skift | `stora_enso_fors_5skift` | https://skiftschema.se/schema/stora_enso_fors_5skift/ |
| Truck Service AB 2-skift | `truck_service_2skift` | https://skiftschema.se/schema/truck_service_2skift/ |
| Uddeholm Tooling 2-skift | `uddeholm_tooling_2skift` | https://skiftschema.se/schema/uddeholm_tooling_2skift/ |
| Voestalpine Precision Strip | `voestalpine_precision_strip_2skift` | https://skiftschema.se/schema/voestalpine_precision_strip_2skift/ |

## Shift Code Normalization

The system automatically normalizes various shift code formats:

| Raw Code | Normalized | Meaning |
|----------|------------|---------|
| `F` | `F` | Förmiddag (Morning) |
| `E` | `E` | Eftermiddag (Afternoon) |
| `N` | `N` | Natt (Night) |
| `L` | `L` | Ledig (Off) |
| `FM` | `F` | Förmiddag |
| `EM` | `E` | Eftermiddag |
| `HD` | `L` | Helgdag (Holiday) |
| `FH` | `L` | Fri Helg (Holiday Off) |
| `NH` | `L` | Natt Helg (Night Holiday) |

## Output Files

### JSON Results
- `31-companies-accuracy-test-[timestamp].json` - Complete test results
- `comprehensive-accuracy-test-[timestamp].json` - Comprehensive test results  
- `puppeteer-schedule-accuracy-results.json` - Puppeteer test results

### CSV Results
- `31-companies-accuracy-test-[timestamp].csv` - Summary in spreadsheet format
- `schedule-accuracy-summary.csv` - Quick overview

### Diagnostic Data
- `diagnostic-[company]-[timestamp].json` - Page analysis data

## Key Features

### 1. Multiple Parsing Strategies
- **Pattern-based**: Extracts "Team - Shift" patterns
- **Table structure**: Analyzes calendar-like tables  
- **Text mining**: Fallback for difficult pages

### 2. Robust Error Handling
- Timeout protection
- Graceful failure recovery
- Detailed error reporting

### 3. Rate Limiting
- 3-4 second delays between requests
- Respectful to server resources
- Prevents blocking

### 4. Comprehensive Reporting
- Success/failure statistics
- Data extraction metrics
- Parsing method analysis
- Shift code distribution

## System Requirements

### Browser Setup
- Chrome/Chromium browser installed at: `C:\Users\jimve\skiftappen\chrome\win64-139.0.7258.66\chrome-win64\chrome.exe`
- Alternative: Install Playwright browsers

### Node.js Dependencies
```json
{
  "puppeteer": "^24.14.0",
  "playwright": "^1.54.2",
  "@playwright/test": "^1.54.2",
  "tsx": "^3.12.7"
}
```

## Usage Examples

### Quick Start
```bash
# Test a few companies quickly
npm run test:accuracy:sample

# View results
cat comprehensive-accuracy-test-*.json
```

### Full Analysis
```bash
# Run complete 31-company test
npm run test:accuracy:final

# This will generate:
# - JSON file with complete results
# - CSV file with summary data
# - Console report with insights
```

### Development/Debugging
```bash
# Analyze specific company page structures
npx tsx diagnostic-scraper.ts

# Run with visible browser for debugging
# (Edit headless: false in script)
```

## Interpreting Results

### Success Metrics
- **Successful Extraction**: Company data successfully parsed
- **Teams Found**: Number of shift teams identified  
- **Shifts Extracted**: Total schedule entries captured
- **Parsing Method**: Algorithm used for extraction

### Quality Indicators
- **High Quality**: >50 shifts extracted, multiple teams
- **Medium Quality**: 10-50 shifts, some team data
- **Low Quality**: <10 shifts, limited data

### Common Issues
- **Page Load Failures**: Network timeouts, site unavailable
- **Parsing Failures**: Unexpected page format, no recognizable patterns
- **Data Validation**: Extracted data doesn't match expected format

## Integration with Universal Schedule System

The extracted data can be used to:

1. **Train Pattern Recognition**: Identify common shift patterns
2. **Validate Generated Schedules**: Compare against real data
3. **Improve Accuracy**: Update algorithms based on findings  
4. **Expand Coverage**: Add new companies to the universal system

## Troubleshooting

### Common Issues

1. **Browser Not Found**
   ```
   Error: Browser executable not found
   ```
   **Solution**: Install Chrome or update `CHROME_PATH` variable

2. **Network Timeouts** 
   ```
   TimeoutError: Navigation timeout
   ```
   **Solution**: Check internet connection, increase timeout values

3. **No Data Extracted**
   ```
   Status: failed, No schedule data extracted
   ```  
   **Solution**: Run diagnostic tool, check page structure changes

4. **Permission Errors**
   ```
   EACCES: permission denied
   ```
   **Solution**: Run as administrator or check file permissions

### Debug Mode
Enable debug logging by setting environment variable:
```bash
DEBUG=1 npm run test:accuracy:sample
```

## Future Improvements

### Planned Features
- [ ] Machine learning pattern recognition
- [ ] Historical data comparison  
- [ ] Real-time schedule validation
- [ ] API integration for automated testing
- [ ] Performance optimization for faster execution

### Contributing
To add support for new companies or improve parsing:

1. Add company config to `ALL_COMPANIES` array
2. Test with diagnostic tool first
3. Add custom parsing logic if needed
4. Update shift code mappings
5. Test with sample script before full run

## Support

For issues or questions:
1. Check this guide first
2. Run diagnostic tools
3. Review error logs
4. Check company website directly for changes