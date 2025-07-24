# 🏢 Loveable Skiftappen - Automated Deployment Script (PowerShell)
# Kör detta script för att deploya allt till Supabase

param(
    [string]$SupabaseUrl,
    [string]$SupabaseAnonKey,
    [string]$SupabaseServiceRoleKey
)

# Färger för output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Blue"

# Funktioner
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Kontrollera förutsättningar
function Check-Prerequisites {
    Write-Status "Kontrollerar förutsättningar..."
    
    # Kontrollera om Supabase CLI är installerat
    try {
        $null = Get-Command supabase -ErrorAction Stop
        Write-Success "Supabase CLI hittat"
    }
    catch {
        Write-Error "Supabase CLI är inte installerat. Installera först:"
        Write-Host "npm install -g supabase"
        exit 1
    }
    
    # Kontrollera om Git är tillgängligt
    try {
        $null = Get-Command git -ErrorAction Stop
        Write-Success "Git hittat"
    }
    catch {
        Write-Error "Git är inte installerat"
        exit 1
    }
    
    Write-Success "Förutsättningar kontrollerade"
}

# Git operations
function Invoke-GitOperations {
    Write-Status "Kör Git operations..."
    
    # Kontrollera om vi är i ett Git repository
    if (-not (Test-Path ".git")) {
        Write-Error "Inte i ett Git repository. Initiera först:"
        Write-Host "git init"
        Write-Host "git remote add origin <your-repo-url>"
        exit 1
    }
    
    # Lägg till alla filer
    git add .
    
    # Commit
    $date = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    git commit -m "Loveable optimization: Complete Swedish company integration $date"
    
    # Push (försök, men fortsätt även om det misslyckas)
    try {
        git push origin main
        Write-Success "Git push lyckades"
    }
    catch {
        Write-Warning "Git push misslyckades - kontrollera din remote konfiguration"
    }
}

# Supabase database setup
function Invoke-SupabaseDatabaseSetup {
    Write-Status "Konfigurerar Supabase database..."
    
    # Använd parametrar eller .env fil
    if ($SupabaseUrl -and $SupabaseAnonKey -and $SupabaseServiceRoleKey) {
        $env:SUPABASE_URL = $SupabaseUrl
        $env:SUPABASE_ANON_KEY = $SupabaseAnonKey
        $env:SUPABASE_SERVICE_ROLE_KEY = $SupabaseServiceRoleKey
    }
    elseif (Test-Path ".env") {
        # Ladda .env fil
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $env:$($matches[1]) = $matches[2]
            }
        }
    }
    else {
        Write-Error ".env fil saknas eller parametrar inte angivna. Skapa .env fil med:"
        Write-Host "SUPABASE_URL=your-supabase-url"
        Write-Host "SUPABASE_ANON_KEY=your-supabase-anon-key"
        Write-Host "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
        exit 1
    }
    
    # Kör database schema
    if (Test-Path "LOVEABLE_COMPLETE_SCHEMA.sql") {
        Write-Status "Kör huvudschema..."
        try {
            psql $env:SUPABASE_URL -f LOVEABLE_COMPLETE_SCHEMA.sql
            Write-Success "Database schema kördes"
        }
        catch {
            Write-Warning "Database schema körning misslyckades - kör manuellt"
        }
    }
    
    # Kör RPC funktioner
    if (Test-Path "get_calendar_shifts_loveable.sql") {
        Write-Status "Kör RPC funktioner..."
        try {
            psql $env:SUPABASE_URL -f get_calendar_shifts_loveable.sql
            Write-Success "RPC funktioner kördes"
        }
        catch {
            Write-Warning "RPC funktioner körning misslyckades - kör manuellt"
        }
    }
    
    # Importera svenska företag
    if (Test-Path "SWEDISH_COMPANIES_IMPORT.sql") {
        Write-Status "Importerar svenska företag..."
        try {
            psql $env:SUPABASE_URL -f SWEDISH_COMPANIES_IMPORT.sql
            Write-Success "Företagsimport slutförd"
        }
        catch {
            Write-Warning "Företagsimport misslyckades - kör manuellt"
        }
    }
    
    Write-Success "Database setup slutförd"
}

# Edge functions deployment
function Deploy-EdgeFunctions {
    Write-Status "Deployar edge functions..."
    
    # Kontrollera om supabase mapp finns
    if (-not (Test-Path "supabase")) {
        Write-Error "supabase mapp saknas. Skapa först:"
        Write-Host "supabase init"
        exit 1
    }
    
    Push-Location supabase
    
    # Deploy alla edge functions
    $functions = @("create-trade-request", "handle-trade-interest", "send-chat-notification")
    
    foreach ($func in $functions) {
        if (Test-Path "functions/$func") {
            Write-Status "Deployar $func..."
            try {
                supabase functions deploy $func
                Write-Success "$func deployad"
            }
            catch {
                Write-Warning "Deployment av $func misslyckades"
            }
        }
        else {
            Write-Warning "Edge function $func finns inte"
        }
    }
    
    Pop-Location
    Write-Success "Edge functions deployment slutförd"
}

# Verifiera deployment
function Verify-Deployment {
    Write-Status "Verifierar deployment..."
    
    # Kontrollera att alla filer finns
    $requiredFiles = @(
        "LOVEABLE_COMPLETE_SCHEMA.sql",
        "get_calendar_shifts_loveable.sql",
        "SWEDISH_COMPANIES_IMPORT.sql",
        "components/LoveableCalendar.tsx",
        "components/OnboardingFlow.tsx",
        "LOVEABLE_DEPLOYMENT_GUIDE.md"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success "✓ $file finns"
        }
        else {
            Write-Error "✗ $file saknas"
        }
    }
    
    Write-Success "Verifiering slutförd"
}

# Huvudfunktion
function Main {
    Write-Host "🏢 Loveable Skiftappen - Automated Deployment" -ForegroundColor Cyan
    Write-Host "==============================================" -ForegroundColor Cyan
    
    Check-Prerequisites
    Invoke-GitOperations
    Invoke-SupabaseDatabaseSetup
    Deploy-EdgeFunctions
    Verify-Deployment
    
    Write-Host ""
    Write-Host "🎉 Deployment slutförd!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Nästa steg:" -ForegroundColor Yellow
    Write-Host "1. Kontrollera Supabase Dashboard"
    Write-Host "2. Testa edge functions"
    Write-Host "3. Verifiera data import"
    Write-Host "4. Testa frontend komponenter"
    Write-Host ""
    Write-Host "För hjälp, se: LOVEABLE_DEPLOYMENT_GUIDE.md" -ForegroundColor Cyan
}

# Kör huvudfunktionen
Main 