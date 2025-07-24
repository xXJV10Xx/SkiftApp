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
`	ypescript
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
`

## Deployment
1. Kor SSAB_OXELOSUND_SHIFT_SYSTEM.sql i Supabase
2. Importera SSAB_Oxelosund_ShiftSystem.ts i Loveable
3. Anvand loveable_ssab_config.json for konfiguration

## Validering
`	ypescript
const validation = SSABOxelosundShiftSystem.validateRules(
  new Date('2023-01-01'),
  new Date('2025-12-31')
);
`

---
Status: OK Komplett implementation for Loveable
Version: 1.0.0
Senast uppdaterad: 2024-01-15
