
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function healthCheck() {
  console.log('🏥 Running health check...');
  
  try {
    // Check database connectivity
    const { data, error } = await supabase.from('companies').select('count').limit(1);
    if (error) throw error;
    
    // Check recent scraping activity
    const { data: recentLogs } = await supabase
      .from('scrape_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // Last 2 hours
      .order('created_at', { ascending: false })
      .limit(10);
    
    const healthStatus = {
      timestamp: new Date().toISOString(),
      database: '✅ Connected',
      recentActivity: recentLogs?.length || 0,
      status: 'healthy'
    };
    
    console.log('Health check results:', healthStatus);
    return healthStatus;
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return {
      timestamp: new Date().toISOString(),
      database: '❌ Failed',
      error: error.message,
      status: 'unhealthy'
    };
  }
}

if (require.main === module) {
  healthCheck()
    .then(status => {
      process.exit(status.status === 'healthy' ? 0 : 1);
    })
    .catch(() => process.exit(1));
}

module.exports = { healthCheck };
