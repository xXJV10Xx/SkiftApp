const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeSkiftschema() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Navigating to skiftschema.se...');
        await page.goto('https://www.skiftschema.se/', { waitUntil: 'networkidle2' });
        
        console.log('📋 Extracting teams data...');
        
        // Extract all teams data from the modal
        const teamsData = await page.evaluate(() => {
            const teams = [];
            let id = 1;
            
            // Find all company panels
            const panels = document.querySelectorAll('.panel-default');
            
            panels.forEach(panel => {
                const companyHeader = panel.querySelector('.panel-title');
                if (!companyHeader) return;
                
                const companyName = companyHeader.textContent.trim();
                
                // Extract department/location from company name
                let department = '';
                if (companyName.includes(' ')) {
                    const parts = companyName.split(' ');
                    // Try to identify location/department
                    if (parts.length > 1) {
                        department = parts.slice(1).join(' ');
                    }
                }
                
                // Find all team links within this panel
                const teamLinks = panel.querySelectorAll('a[href^="/schema/"]');
                
                teamLinks.forEach(link => {
                    const href = link.getAttribute('href');
                    const teamName = link.textContent.trim();
                    
                    // Skip "Alla" links and duplicate entries
                    if (teamName === 'Alla' || !href || href.endsWith('/')) return;
                    
                    // Extract team identifier from URL
                    const urlParts = href.split('/');
                    const teamId = urlParts[urlParts.length - 1];
                    
                    teams.push({
                        id: id++,
                        company: companyName.split(' ')[0], // First word as company
                        department: department || companyName.split(' ')[0], // Department or company name
                        team: teamName,
                        url: `https://www.skiftschema.se${href}`
                    });
                });
            });
            
            return teams;
        });
        
        console.log(`✅ Found ${teamsData.length} teams from ${new Set(teamsData.map(t => t.company)).size} companies`);
        
        // Save the teams data
        fs.writeFileSync('teams-data.json', JSON.stringify(teamsData, null, 2));
        console.log('💾 Saved teams data to teams-data.json');
        
        // Generate TEAMS array for JavaScript
        const teamsArrayJS = `const TEAMS = ${JSON.stringify(teamsData, null, 2)};

module.exports = TEAMS;`;
        
        fs.writeFileSync('teams-array.js', teamsArrayJS);
        console.log('📝 Generated teams-array.js');
        
        // Generate SQL scripts
        generateSQLScripts(teamsData);
        
        return teamsData;
        
    } catch (error) {
        console.error('❌ Error scraping:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

function generateSQLScripts(teamsData) {
    console.log('🗄️ Generating SQL scripts...');
    
    // Extract unique companies and departments
    const companies = [...new Set(teamsData.map(t => t.company))];
    const departments = [...new Set(teamsData.map(t => `${t.company}|${t.department}`))];
    
    let sql = `-- Skiftschema.se Database Schema
-- Generated on ${new Date().toISOString()}

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Departments table  
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    department_id INTEGER REFERENCES departments(id),
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table for storing schedule data
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    team_id INTEGER REFERENCES teams(id),
    date DATE NOT NULL,
    shift_type VARCHAR(10), -- F, E, N, L
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert companies
`;

    companies.forEach((company, index) => {
        sql += `INSERT INTO companies (id, name) VALUES (${index + 1}, '${company}') ON CONFLICT (name) DO NOTHING;\n`;
    });
    
    sql += `\n-- Insert departments\n`;
    
    departments.forEach((dept, index) => {
        const [company, department] = dept.split('|');
        const companyId = companies.indexOf(company) + 1;
        sql += `INSERT INTO departments (id, company_id, name) VALUES (${index + 1}, ${companyId}, '${department}');\n`;
    });
    
    sql += `\n-- Insert teams\n`;
    
    teamsData.forEach(team => {
        const deptKey = `${team.company}|${team.department}`;
        const departmentId = departments.indexOf(deptKey) + 1;
        sql += `INSERT INTO teams (id, department_id, name, url) VALUES (${team.id}, ${departmentId}, '${team.team}', '${team.url}');\n`;
    });
    
    fs.writeFileSync('skiftschema-schema.sql', sql);
    console.log('📄 Generated skiftschema-schema.sql');
}

// Run the scraper
if (require.main === module) {
    scrapeSkiftschema()
        .then(teams => {
            console.log(`\n🎉 Successfully scraped ${teams.length} teams!`);
            console.log('\nSample teams:');
            console.table(teams.slice(0, 5));
        })
        .catch(error => {
            console.error('💥 Scraping failed:', error);
            process.exit(1);
        });
}

module.exports = scrapeSkiftschema;