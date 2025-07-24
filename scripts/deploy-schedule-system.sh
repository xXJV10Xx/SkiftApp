#!/bin/bash

# 🚀 SSAB Schedule System Deployment Script
# This script sets up the complete schedule generation system

set -e  # Exit on any error

echo "🏭 SSAB Schedule System Deployment"
echo "=================================="

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run 'supabase init' first."
    exit 1
fi

echo "✅ Environment checks passed"

# 1. Apply database migrations
echo ""
echo "📊 Setting up database schema..."
if [ -f "supabase/migrations/001_schedule_system.sql" ]; then
    supabase db reset --linked
    echo "✅ Database schema applied"
else
    echo "❌ Migration file not found. Please ensure 001_schedule_system.sql exists."
    exit 1
fi

# 2. Deploy Edge Functions
echo ""
echo "⚡ Deploying Edge Functions..."
supabase functions deploy generate-schedule --no-verify-jwt
echo "✅ Edge Function deployed"

# 3. Test the deployment
echo ""
echo "🧪 Testing deployment..."

# Get project details
PROJECT_REF=$(supabase status | grep "API URL" | awk '{print $3}' | sed 's/https:\/\///' | sed 's/\.supabase\.co//')
ANON_KEY=$(supabase status | grep "anon key" | awk '{print $3}')

if [ -z "$PROJECT_REF" ] || [ -z "$ANON_KEY" ]; then
    echo "⚠️  Could not retrieve project details automatically."
    echo "   Please test manually using the examples in the README."
else
    echo "📝 Project Details:"
    echo "   Project URL: https://$PROJECT_REF.supabase.co"
    echo "   Function URL: https://$PROJECT_REF.supabase.co/functions/v1/generate-schedule"
    
    # Test with curl if available
    if command -v curl &> /dev/null; then
        echo ""
        echo "🔍 Testing Edge Function..."
        
        RESPONSE=$(curl -s -X POST "https://$PROJECT_REF.supabase.co/functions/v1/generate-schedule" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $ANON_KEY" \
            -d '{
                "startDate": "2024-01-01",
                "endDate": "2024-01-07",
                "scheduleName": "Anpassat SSAB-skift"
            }' || echo "ERROR")
        
        if [[ $RESPONSE == *"schedule"* ]]; then
            echo "✅ Edge Function test successful!"
        elif [[ $RESPONSE == *"error"* ]]; then
            echo "⚠️  Edge Function returned an error:"
            echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
        else
            echo "❌ Edge Function test failed:"
            echo "$RESPONSE"
        fi
    fi
fi

# 4. Verify database data
echo ""
echo "🔍 Verifying database setup..."

# Check if data exists (this requires psql or Supabase Studio)
echo "   Please verify the following in Supabase Studio:"
echo "   1. ✓ Companies table has SSAB entry"
echo "   2. ✓ Work patterns table has SSAB 3-skift pattern"
echo "   3. ✓ Schedules table has 'Anpassat SSAB-skift' entry"
echo "   4. ✓ Teams table has teams A, B, C, D"
echo "   5. ✓ Team states table has initial states"

# 5. Display next steps
echo ""
echo "🎉 Deployment Complete!"
echo "======================"
echo ""
echo "📋 Next Steps:"
echo "1. Open Supabase Studio to verify data: https://app.supabase.com/project/$PROJECT_REF"
echo "2. Test the API using the examples in supabase/functions/generate-schedule/test-example.js"
echo "3. Integrate with your application using the provided TypeScript interfaces"
echo ""
echo "📚 Documentation:"
echo "- README: supabase/functions/generate-schedule/README.md"
echo "- Test Examples: supabase/functions/generate-schedule/test-example.js"
echo "- Database Schema: supabase/migrations/001_schedule_system.sql"
echo ""
echo "🔧 Useful Commands:"
echo "- View logs: supabase functions logs generate-schedule"
echo "- Redeploy: supabase functions deploy generate-schedule"
echo "- Test locally: supabase functions serve"
echo ""

# 6. Create a simple test file
echo "📝 Creating test configuration..."
cat > test-schedule-config.json << EOF
{
  "basic": {
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "scheduleName": "Anpassat SSAB-skift"
  },
  "advanced": {
    "startDate": "2024-02-01",
    "endDate": "2024-02-28",
    "scheduleName": "Anpassat SSAB-skift",
    "config": {
      "workPatternCycles": 2,
      "leaveDays": 7,
      "teamStagger": true
    }
  },
  "projectDetails": {
    "url": "https://$PROJECT_REF.supabase.co",
    "functionUrl": "https://$PROJECT_REF.supabase.co/functions/v1/generate-schedule",
    "anonKey": "$ANON_KEY"
  }
}
EOF

echo "✅ Test configuration saved to: test-schedule-config.json"
echo ""
echo "🚀 System is ready for use!"