# 🏭 SSAB Oxelösund 3-Skift System Deployment Script
# Automatisk deployment till Supabase och Loveable

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
$Cyan = "Cyan"

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

function Write-Header {
    param([string]$Message)
    Write-Host "`n🏭 $Message" -ForegroundColor $Cyan
    Write-Host "=" * ($Message.Length + 4) -ForegroundColor $Cyan
}

# Huvudfunktion för SSAB Oxelösund deployment
function Deploy-SSABOxelosund {
    Write-Header "SSAB Oxelösund 3-Skift System Deployment"
    
    # 1. Kontrollera förutsättningar
    Check-Prerequisites
    
    # 2. Skapa .env fil om den inte finns
    Create-EnvironmentFile
    
    # 3. Deploy till Supabase
    Deploy-ToSupabase
    
    # 4. Validera implementation
    Validate-Implementation
    
    # 5. Exportera för Loveable
    Export-ForLoveable
    
    Write-Success "SSAB Oxelösund deployment slutförd!"
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
    
    # Kontrollera om Node.js är installerat
    try {
        $null = Get-Command node -ErrorAction Stop
        Write-Success "Node.js hittat"
    }
    catch {
        Write-Error "Node.js är inte installerat"
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

# Skapa .env fil
function Create-EnvironmentFile {
    Write-Status "Skapar .env fil..."
    
    if (-not (Test-Path ".env")) {
        $envContent = @"
# SSAB Oxelösund Deployment Configuration
SUPABASE_URL=$SupabaseUrl
SUPABASE_ANON_KEY=$SupabaseAnonKey
SUPABASE_SERVICE_ROLE_KEY=$SupabaseServiceRoleKey

# App Configuration
EXPO_PUBLIC_APP_NAME=SSAB Oxelösund Skiftappen
EXPO_PUBLIC_APP_VERSION=1.0.0

# Firebase Configuration (för push notifications)
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-firebase-project-id
"@
        
        $envContent | Out-File -FilePath ".env" -Encoding UTF8
        Write-Success ".env fil skapad"
    } else {
        Write-Warning ".env fil finns redan"
    }
}

# Deploy till Supabase
function Deploy-ToSupabase {
    Write-Status "Deployar till Supabase..."
    
    # Ladda environment variables
    if (Test-Path ".env") {
        Get-Content ".env" | ForEach-Object {
            if ($_ -match "^([^=]+)=(.*)$") {
                $env:$($matches[1]) = $matches[2]
            }
        }
    }
    
    # Kör SSAB Oxelösund SQL script
    if (Test-Path "SSAB_OXELOSUND_SHIFT_SYSTEM.sql") {
        Write-Status "Kör SSAB Oxelösund database setup..."
        try {
            psql $env:SUPABASE_URL -f SSAB_OXELOSUND_SHIFT_SYSTEM.sql
            Write-Success "SSAB Oxelösund database setup slutförd"
        }
        catch {
            Write-Warning "Database setup misslyckades - kör manuellt"
        }
    } else {
        Write-Error "SSAB_OXELOSUND_SHIFT_SYSTEM.sql saknas"
    }
    
    # Deploy edge functions om de finns
    if (Test-Path "supabase") {
        Push-Location supabase
        
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
        }
        
        Pop-Location
    }
}

# Validera implementation
function Validate-Implementation {
    Write-Status "Validerar SSAB Oxelösund implementation..."
    
    # Kontrollera att alla filer finns
    $requiredFiles = @(
        "SSAB_OXELOSUND_SHIFT_SYSTEM.sql",
        "SSAB_Oxelosund_ShiftSystem.ts",
        "LOVEABLE_COMPLETE_SCHEMA.sql",
        "get_calendar_shifts_loveable.sql"
    )
    
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Success "✓ $file finns"
        } else {
            Write-Error "✗ $file saknas"
        }
    }
    
    # Testa TypeScript kompilering
    if (Test-Path "SSAB_Oxelosund_ShiftSystem.ts") {
        try {
            npx tsc --noEmit SSAB_Oxelosund_ShiftSystem.ts
            Write-Success "TypeScript validering lyckades"
        }
        catch {
            Write-Warning "TypeScript validering misslyckades"
        }
    }
}

# Exportera för Loveable
function Export-ForLoveable {
    Write-Status "Exporterar för Loveable..."
    
    # Skapa Loveable-specifik konfiguration
    $loveableConfig = @{
        company = "SSAB OXELÖSUND"
        location = "Oxelösund"
        industry = "Stålindustri"
        teams = @(
            @{ name = "Lag 31"; color = "#FF6B6B"; offset = 0 },
            @{ name = "Lag 32"; color = "#4ECDC4"; offset = 1 },
            @{ name = "Lag 33"; color = "#45B7D1"; offset = 2 },
            @{ name = "Lag 34"; color = "#96CEB4"; offset = 3 },
            @{ name = "Lag 35"; color = "#FFEAA7"; offset = 4 }
        )
        shiftPattern = @(
            "2F", "2E", "3N", "4L", "3F", "3E", "1N", "5L",
            "2F", "2E", "3N", "5L", "3F", "2E", "2N", "4L"
        )
        allowedStartDays = @(1, 3, 5) # Måndag, Onsdag, Fredag
        shiftTimes = @{
            F = @{ start = "06:00"; end = "14:00"; title = "Förmiddagsskift" }
            E = @{ start = "14:00"; end = "22:00"; title = "Eftermiddagsskift" }
            N = @{ start = "22:00"; end = "06:00"; title = "Nattskift" }
            L = @{ start = "00:00"; end = "23:59"; title = "Ledig" }
        }
        rules = @(
            "Endast måndag, onsdag eller fredag är tillåtna startdagar",
            "Varje arbetsblock = 7 dagar (exakt 7 skiftdagar i följd)",
            "Varje ledighet = 4 eller 5 dagar, beroende på var i rotationen",
            "Kedjelogik: När ett lag går in i sitt första E, börjar nästa lag sitt 7-dagarsblock"
        )
    }
    
    # Spara Loveable konfiguration
    $loveableConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "loveable_ssab_config.json" -Encoding UTF8
    Write-Success "Loveable konfiguration exporterad"
    
    # Skapa README för Loveable
    $readme = @"
# 🏭 SSAB Oxelösund 3-Skift System för Loveable

## Översikt
Detta är en komplett implementation av SSAB Oxelösunds 3-skift system för Loveable.dev.

## Teams
- **Lag 31**: 3-skift lag 31 (Röd: #FF6B6B)
- **Lag 32**: 3-skift lag 32 (Cyan: #4ECDC4)
- **Lag 33**: 3-skift lag 33 (Blå: #45B7D1)
- **Lag 34**: 3-skift lag 34 (Grön: #96CEB4)
- **Lag 35**: 3-skift lag 35 (Gul: #FFEAA7)

## Skifttider
- **F (Förmiddag)**: 06:00-14:00
- **E (Eftermiddag)**: 14:00-22:00
- **N (Natt)**: 22:00-06:00
- **L (Ledig)**: 00:00-23:59

## Rotationsmönster
```
2F → 2E → 3N → 4L → 3F → 3E → 1N → 5L → 
2F → 2E → 3N → 5L → 3F → 2E → 2N → 4L → ... (fortsätter)
```

## Regler
1. Endast måndag, onsdag eller fredag är tillåtna startdagar
2. Varje arbetsblock = 7 dagar (exakt 7 skiftdagar i följd)
3. Varje ledighet = 4 eller 5 dagar, beroende på var i rotationen
4. Kedjelogik: När ett lag går in i sitt första E, börjar nästa lag sitt 7-dagarsblock

## Implementation
- **SQL**: SSAB_OXELOSUND_SHIFT_SYSTEM.sql
- **TypeScript**: SSAB_Oxelosund_ShiftSystem.ts
- **Konfiguration**: loveable_ssab_config.json

## Användning
\`\`\`typescript
import SSABOxelosundShiftSystem from './SSAB_Oxelosund_ShiftSystem';

// Generera skift för 2025
const shifts2025 = SSABOxelosundShiftSystem.generateShifts(
  new Date('2025-01-01'),
  new Date('2025-12-31')
);

// Hämta skift för specifikt lag
const lag31Shifts = SSABOxelosundShiftSystem.getShifts(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'Lag 31'
);

// Beräkna statistik
const stats = SSABOxelosundShiftSystem.getStats(
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
\`\`\`

## Deployment
1. Kör SSAB_OXELOSUND_SHIFT_SYSTEM.sql i Supabase
2. Importera SSAB_Oxelosund_ShiftSystem.ts i Loveable
3. Använd loveable_ssab_config.json för konfiguration

## Validering
\`\`\`typescript
const validation = SSABOxelosundShiftSystem.validateRules(
  new Date('2023-01-01'),
  new Date('2025-12-31')
);
\`\`\`

---
**Status**: ✅ Komplett implementation för Loveable
**Version**: 1.0.0
**Senast uppdaterad**: 2024-01-15
"@
    
    $readme | Out-File -FilePath "README_SSAB_Loveable.md" -Encoding UTF8
    Write-Success "README för Loveable skapad"
}

# Kör huvudfunktionen
Deploy-SSABOxelosund 