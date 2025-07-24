# SSAB Oxelösund 3-Skift System - Final Deployment
# Kör detta script för att deploya SSAB Oxelösund systemet

Write-Host "SSAB Oxelösund 3-Skift System Deployment" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Kontrollera filer
Write-Host "`n[INFO] Kontrollerar filer..." -ForegroundColor Blue

$files = @(
    "SSAB_OXELOSUND_SHIFT_SYSTEM.sql",
    "SSAB_Oxelosund_ShiftSystem.ts",
    "LOVEABLE_COMPLETE_SCHEMA.sql",
    "get_calendar_shifts_loveable.sql"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "OK: $file finns" -ForegroundColor Green
    } else {
        Write-Host "MISSING: $file saknas" -ForegroundColor Red
    }
}

# Skapa .env fil
Write-Host "`n[INFO] Skapar .env fil..." -ForegroundColor Blue

$envContent = @"
# SSAB Oxelosund Deployment Configuration
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
EXPO_PUBLIC_APP_NAME=SSAB Oxelosund Skiftappen
EXPO_PUBLIC_APP_VERSION=1.0.0

# Firebase Configuration
FCM_SERVER_KEY=your-fcm-server-key
FCM_PROJECT_ID=your-firebase-project-id
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "OK: .env fil skapad" -ForegroundColor Green

# Skapa Loveable konfiguration
Write-Host "`n[INFO] Skapar Loveable konfiguration..." -ForegroundColor Blue

$loveableConfig = @{
    company = "SSAB OXELOSUND"
    location = "Oxelosund"
    industry = "Stalindustri"
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
    allowedStartDays = @(1, 3, 5)
    shiftTimes = @{
        F = @{ start = "06:00"; end = "14:00"; title = "Formiddagsskift" }
        E = @{ start = "14:00"; end = "22:00"; title = "Eftermiddagsskift" }
        N = @{ start = "22:00"; end = "06:00"; title = "Nattskift" }
        L = @{ start = "00:00"; end = "23:59"; title = "Ledig" }
    }
    rules = @(
        "Endast mandag, onsdag eller fredag ar tillatna startdagar",
        "Varje arbetsblock = 7 dagar (exakt 7 skiftdagar i foljd)",
        "Varje ledighet = 4 eller 5 dagar, beroende pa var i rotationen",
        "Kedjelogik: Nar ett lag gar in i sitt forsta E, borjar nasta lag sitt 7-dagarsblock"
    )
}

$loveableConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath "loveable_ssab_config.json" -Encoding UTF8
Write-Host "OK: Loveable konfiguration skapad" -ForegroundColor Green

# Skapa README
Write-Host "`n[INFO] Skapar README..." -ForegroundColor Blue

$readme = @"
# SSAB Oxelosund 3-Skift System for Loveable

## Oversikt
Komplett implementation av SSAB Oxelosunds 3-skift system for Loveable.dev.

## Teams
- Lag 31: 3-skift lag 31 (Rod: #FF6B6B)
- Lag 32: 3-skift lag 32 (Cyan: #4ECDC4)
- Lag 33: 3-skift lag 33 (Bla: #45B7D1)
- Lag 34: 3-skift lag 34 (Gron: #96CEB4)
- Lag 35: 3-skift lag 35 (Gul: #FFEAA7)

## Skifttider
- F (Formiddag): 06:00-14:00
- E (Eftermiddag): 14:00-22:00
- N (Natt): 22:00-06:00
- L (Ledig): 00:00-23:59

## Rotationsmonster
2F -> 2E -> 3N -> 4L -> 3F -> 3E -> 1N -> 5L -> 
2F -> 2E -> 3N -> 5L -> 3F -> 2E -> 2N -> 4L -> ... (fortsatter)

## Regler
1. Endast mandag, onsdag eller fredag ar tillatna startdagar
2. Varje arbetsblock = 7 dagar (exakt 7 skiftdagar i foljd)
3. Varje ledighet = 4 eller 5 dagar, beroende pa var i rotationen
4. Kedjelogik: Nar ett lag gar in i sitt forsta E, borjar nasta lag sitt 7-dagarsblock

## Implementation
- SQL: SSAB_OXELOSUND_SHIFT_SYSTEM.sql
- TypeScript: SSAB_Oxelosund_ShiftSystem.ts
- Konfiguration: loveable_ssab_config.json

## Anvandning
```typescript
import SSABOxelosundShiftSystem from './SSAB_Oxelosund_ShiftSystem';

// Generera skift for 2025
const shifts2025 = SSABOxelosundShiftSystem.generateShifts(
  new Date('2025-01-01'),
  new Date('2025-12-31')
);

// Hamta skift for specifikt lag
const lag31Shifts = SSABOxelosundShiftSystem.getShifts(
  new Date('2025-01-01'),
  new Date('2025-01-31'),
  'Lag 31'
);

// Berakna statistik
const stats = SSABOxelosundShiftSystem.getStats(
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
```

## Deployment
1. Kor SSAB_OXELOSUND_SHIFT_SYSTEM.sql i Supabase
2. Importera SSAB_Oxelosund_ShiftSystem.ts i Loveable
3. Anvand loveable_ssab_config.json for konfiguration

## Validering
```typescript
const validation = SSABOxelosundShiftSystem.validateRules(
  new Date('2023-01-01'),
  new Date('2025-12-31')
);
```

---
Status: OK Komplett implementation for Loveable
Version: 1.0.0
Senast uppdaterad: 2024-01-15
"@

$readme | Out-File -FilePath "README_SSAB_Loveable.md" -Encoding UTF8
Write-Host "OK: README skapad" -ForegroundColor Green

# Visa nasta steg
Write-Host "`nSUCCESS: SSAB Oxelosund deployment slutford!" -ForegroundColor Green
Write-Host "`nNasta steg:" -ForegroundColor Yellow
Write-Host "1. Uppdatera .env fil med dina Supabase credentials" -ForegroundColor White
Write-Host "2. Kor SSAB_OXELOSUND_SHIFT_SYSTEM.sql i Supabase Dashboard" -ForegroundColor White
Write-Host "3. Importera SSAB_Oxelosund_ShiftSystem.ts i Loveable" -ForegroundColor White
Write-Host "4. Anvand loveable_ssab_config.json for konfiguration" -ForegroundColor White
Write-Host "5. Testa implementationen" -ForegroundColor White
Write-Host "`nFiler skapade:" -ForegroundColor Cyan
Write-Host "- .env (konfiguration)" -ForegroundColor White
Write-Host "- loveable_ssab_config.json (Loveable config)" -ForegroundColor White
Write-Host "- README_SSAB_Loveable.md (dokumentation)" -ForegroundColor White 