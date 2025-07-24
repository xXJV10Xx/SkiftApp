#!/bin/bash

# 🏢 Loveable Skiftappen - Automated Deployment Script
# Kör detta script för att deploya allt till Supabase

set -e  # Stoppa vid fel

echo "🚀 Loveable Skiftappen - Deployment Startar..."

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktioner
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kontrollera förutsättningar
check_prerequisites() {
    print_status "Kontrollerar förutsättningar..."
    
    # Kontrollera om Supabase CLI är installerat
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI är inte installerat. Installera först:"
        echo "npm install -g supabase"
        exit 1
    fi
    
    # Kontrollera om psql är tillgängligt
    if ! command -v psql &> /dev/null; then
        print_warning "psql är inte installerat. Du behöver PostgreSQL client."
    fi
    
    print_success "Förutsättningar kontrollerade"
}

# Git operations
git_operations() {
    print_status "Kör Git operations..."
    
    # Kontrollera om vi är i ett Git repository
    if [ ! -d ".git" ]; then
        print_error "Inte i ett Git repository. Initiera först:"
        echo "git init"
        echo "git remote add origin <your-repo-url>"
        exit 1
    fi
    
    # Lägg till alla filer
    git add .
    
    # Commit
    git commit -m "Loveable optimization: Complete Swedish company integration $(date)"
    
    # Push (försök, men fortsätt även om det misslyckas)
    if git push origin main; then
        print_success "Git push lyckades"
    else
        print_warning "Git push misslyckades - kontrollera din remote konfiguration"
    fi
}

# Supabase database setup
supabase_database_setup() {
    print_status "Konfigurerar Supabase database..."
    
    # Kontrollera om .env fil finns
    if [ ! -f ".env" ]; then
        print_error ".env fil saknas. Skapa en med dina Supabase credentials:"
        echo "SUPABASE_URL=your-supabase-url"
        echo "SUPABASE_ANON_KEY=your-supabase-anon-key"
        echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
        exit 1
    fi
    
    # Ladda environment variables
    source .env
    
    # Kör database schema
    if [ -f "LOVEABLE_COMPLETE_SCHEMA.sql" ]; then
        print_status "Kör huvudschema..."
        psql "$SUPABASE_URL" -f LOVEABLE_COMPLETE_SCHEMA.sql || {
            print_warning "Database schema körning misslyckades - kör manuellt"
        }
    fi
    
    # Kör RPC funktioner
    if [ -f "get_calendar_shifts_loveable.sql" ]; then
        print_status "Kör RPC funktioner..."
        psql "$SUPABASE_URL" -f get_calendar_shifts_loveable.sql || {
            print_warning "RPC funktioner körning misslyckades - kör manuellt"
        }
    fi
    
    # Importera svenska företag
    if [ -f "SWEDISH_COMPANIES_IMPORT.sql" ]; then
        print_status "Importerar svenska företag..."
        psql "$SUPABASE_URL" -f SWEDISH_COMPANIES_IMPORT.sql || {
            print_warning "Företagsimport misslyckades - kör manuellt"
        }
    fi
    
    print_success "Database setup slutförd"
}

# Edge functions deployment
deploy_edge_functions() {
    print_status "Deployar edge functions..."
    
    # Kontrollera om supabase mapp finns
    if [ ! -d "supabase" ]; then
        print_error "supabase mapp saknas. Skapa först:"
        echo "supabase init"
        exit 1
    fi
    
    cd supabase
    
    # Deploy alla edge functions
    for func in create-trade-request handle-trade-interest send-chat-notification; do
        if [ -d "functions/$func" ]; then
            print_status "Deployar $func..."
            supabase functions deploy $func || {
                print_warning "Deployment av $func misslyckades"
            }
        else
            print_warning "Edge function $func finns inte"
        fi
    done
    
    cd ..
    print_success "Edge functions deployment slutförd"
}

# Verifiera deployment
verify_deployment() {
    print_status "Verifierar deployment..."
    
    # Kontrollera att alla filer finns
    required_files=(
        "LOVEABLE_COMPLETE_SCHEMA.sql"
        "get_calendar_shifts_loveable.sql"
        "SWEDISH_COMPANIES_IMPORT.sql"
        "components/LoveableCalendar.tsx"
        "components/OnboardingFlow.tsx"
        "LOVEABLE_DEPLOYMENT_GUIDE.md"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_success "✓ $file finns"
        else
            print_error "✗ $file saknas"
        fi
    done
    
    print_success "Verifiering slutförd"
}

# Huvudfunktion
main() {
    echo "🏢 Loveable Skiftappen - Automated Deployment"
    echo "=============================================="
    
    check_prerequisites
    git_operations
    supabase_database_setup
    deploy_edge_functions
    verify_deployment
    
    echo ""
    echo "🎉 Deployment slutförd!"
    echo ""
    echo "Nästa steg:"
    echo "1. Kontrollera Supabase Dashboard"
    echo "2. Testa edge functions"
    echo "3. Verifiera data import"
    echo "4. Testa frontend komponenter"
    echo ""
    echo "För hjälp, se: LOVEABLE_DEPLOYMENT_GUIDE.md"
}

# Kör huvudfunktionen
main "$@" 