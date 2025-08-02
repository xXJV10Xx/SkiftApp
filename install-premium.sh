#!/bin/bash

# 🚀 SkiftApp Premium System Installation Script
# Detta script installerar alla dependencies och sätter upp premium-systemet

echo "🎯 SkiftApp Premium System Installation"
echo "======================================"

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funktion för att printa färgad text
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Kontrollera om Node.js är installerat
if ! command -v node &> /dev/null; then
    print_error "Node.js är inte installerat. Installera Node.js först."
    exit 1
fi

# Kontrollera om npm är installerat
if ! command -v npm &> /dev/null; then
    print_error "npm är inte installerat. Installera npm först."
    exit 1
fi

print_info "Node.js version: $(node --version)"
print_info "npm version: $(npm --version)"

echo ""
echo "🖥️  Installerar Server Dependencies..."
echo "======================================"

# Installera server dependencies
if [ -d "server" ]; then
    cd server
    
    if [ -f "package.json" ]; then
        print_info "Installerar server dependencies..."
        npm install
        
        if [ $? -eq 0 ]; then
            print_status "Server dependencies installerade"
        else
            print_error "Fel vid installation av server dependencies"
            exit 1
        fi
    else
        print_error "package.json hittades inte i server-mappen"
        exit 1
    fi
    
    # Skapa .env fil om den inte finns
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_warning "Skapade .env från .env.example"
            print_warning "VIKTIGT: Uppdatera .env med dina riktiga API-nycklar!"
        else
            print_error ".env.example hittades inte"
        fi
    else
        print_info ".env fil finns redan"
    fi
    
    cd ..
else
    print_error "Server-mappen hittades inte"
    exit 1
fi

echo ""
echo "📱 Installerar Frontend Dependencies..."
echo "======================================"

# Kontrollera om Expo CLI är installerat
if ! command -v expo &> /dev/null; then
    print_warning "Expo CLI är inte installerat globalt"
    print_info "Installerar Expo CLI..."
    npm install -g @expo/cli
fi

# Installera frontend dependencies
if [ -f "package.json" ]; then
    print_info "Installerar frontend dependencies..."
    
    # Premium-specifika dependencies
    npm install @react-native-async-storage/async-storage
    npm install expo-calendar
    npm install expo-file-system  
    npm install expo-sharing
    npm install expo-linear-gradient
    
    if [ $? -eq 0 ]; then
        print_status "Frontend dependencies installerade"
    else
        print_error "Fel vid installation av frontend dependencies"
        exit 1
    fi
else
    print_error "package.json hittades inte i root-mappen"
    exit 1
fi

echo ""
echo "🗄️  Supabase Setup..."
echo "===================="

print_info "Supabase schema finns i: server/supabase-schema.sql"
print_warning "Du måste manuellt köra SQL-schemat i Supabase SQL Editor"

echo ""
echo "💳 Stripe Setup..."
echo "=================="

print_info "Stripe konfiguration krävs:"
print_warning "1. Skapa Stripe konto på https://dashboard.stripe.com"
print_warning "2. Hämta API keys från Developers > API keys"
print_warning "3. Skapa webhook för checkout.session.completed"
print_warning "4. Uppdatera server/.env med dina nycklar"

echo ""
echo "📧 Email Setup..."
echo "================="

print_info "E-postkonfiguration (Gmail):"
print_warning "1. Aktivera 2FA på ditt Gmail-konto"
print_warning "2. Generera App Password i Gmail-inställningar"
print_warning "3. Uppdatera EMAIL_USER och EMAIL_PASS i server/.env"

echo ""
echo "🧪 Test Installation..."
echo "======================="

# Testa att server kan startas
print_info "Testar server-installation..."
cd server

if npm run dev --dry-run &> /dev/null; then
    print_status "Server-konfiguration ser bra ut"
else
    print_warning "Server-konfiguration kan ha problem"
fi

cd ..

# Testa att frontend kan byggas
print_info "Testar frontend-installation..."
if expo doctor &> /dev/null; then
    print_status "Frontend-konfiguration ser bra ut"
else
    print_warning "Frontend-konfiguration kan ha problem"
fi

echo ""
echo "🎉 Installation Klar!"
echo "===================="

print_status "Premium-systemet är installerat och redo att konfigureras"

echo ""
echo "📋 Nästa steg:"
echo "=============="
echo "1. 📝 Uppdatera server/.env med dina API-nycklar"
echo "2. 🗄️  Kör server/supabase-schema.sql i Supabase SQL Editor"
echo "3. 💳 Konfigurera Stripe webhook: http://localhost:4242/webhook"
echo "4. 🖥️  Starta server: cd server && npm run dev"
echo "5. 📱 Starta app: expo start"
echo ""

print_info "Läs PREMIUM_INTEGRATION_GUIDE.md för detaljerade instruktioner"

echo ""
echo "🔗 Användbara länkar:"
echo "===================="
echo "• Stripe Dashboard: https://dashboard.stripe.com"
echo "• Supabase Dashboard: https://app.supabase.com"
echo "• Expo Dashboard: https://expo.dev"
echo ""

print_status "Lycka till med SkiftApp Premium! 🚀"