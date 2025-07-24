// 🏭 SSAB Oxelösund Supabase Test
// Test-fil för att verifiera SSAB Oxelösund skiftsystem i Supabase

import { createClient } from "@supabase/supabase-js";

// Supabase konfiguration för SSAB Oxelösund
const supabase = createClient(
  "https://fsefeherdbtsddqimjco.supabase.co",
  "DIN-ANON-KEY-HÄR" // Ersätt med din riktiga anon key
);

// Test-funktioner för SSAB Oxelösund systemet
async function testSSABOxelosundSystem() {
  console.log("🏭 Testar SSAB Oxelösund skiftsystem...");

  try {
    // 1. Testa att hämta SSAB Oxelösund teams
    console.log("\n1. Hämtar SSAB Oxelösund teams...");
    const { data: teams, error: teamsError } = await supabase
      .from("shift_teams")
      .select("*")
      .eq("company_id", (await supabase.from("companies").select("id").eq("name", "SSAB OXELÖSUND").single()).data?.id);

    if (teamsError) {
      console.error("❌ Fel vid hämtning av teams:", teamsError);
    } else {
      console.log("✅ Teams hittade:", teams?.length || 0);
      teams?.forEach(team => {
        console.log(`   - ${team.name} (${team.color_hex})`);
      });
    }

    // 2. Testa att hämta skift för Lag 31
    console.log("\n2. Hämtar skift för Lag 31...");
    const { data: shifts, error: shiftsError } = await supabase
      .from("shifts")
      .select(`
        *,
        shift_teams!inner(name, color_hex),
        companies!inner(name)
      `)
      .eq("shift_teams.name", "Lag 31")
      .gte("start_time", "2025-01-01")
      .lte("start_time", "2025-01-31")
      .order("start_time");

    if (shiftsError) {
      console.error("❌ Fel vid hämtning av skift:", shiftsError);
    } else {
      console.log("✅ Skift hittade för Lag 31:", shifts?.length || 0);
      shifts?.slice(0, 5).forEach(shift => {
        console.log(`   - ${shift.title} (${shift.shift_type}) - ${new Date(shift.start_time).toLocaleDateString()}`);
      });
    }

    // 3. Testa RPC funktion för SSAB Oxelösund
    console.log("\n3. Testar SSAB Oxelösund RPC funktion...");
    const { data: rpcData, error: rpcError } = await supabase
      .rpc("get_ssab_oxelosund_shifts", {
        p_start_date: "2025-01-01",
        p_end_date: "2025-01-31",
        p_team_filter: "Lag 31"
      });

    if (rpcError) {
      console.error("❌ Fel vid RPC anrop:", rpcError);
    } else {
      console.log("✅ RPC data hittad:", rpcData?.length || 0);
    }

    // 4. Testa statistik för SSAB Oxelösund
    console.log("\n4. Hämtar SSAB Oxelösund statistik...");
    const { data: stats, error: statsError } = await supabase
      .rpc("get_ssab_oxelosund_stats", {
        p_start_date: "2025-01-01",
        p_end_date: "2025-01-31"
      });

    if (statsError) {
      console.error("❌ Fel vid hämtning av statistik:", statsError);
    } else {
      console.log("✅ Statistik hittad för teams:", stats?.length || 0);
      stats?.forEach(stat => {
        console.log(`   - ${stat.team_name}: ${stat.total_shifts} skift, ${stat.total_hours}h`);
      });
    }

    // 5. Validera SSAB Oxelösund regler
    console.log("\n5. Validerar SSAB Oxelösund regler...");
    const { data: validation, error: validationError } = await supabase
      .rpc("validate_ssab_oxelosund_rules", {
        p_start_date: "2023-01-01",
        p_end_date: "2025-12-31"
      });

    if (validationError) {
      console.error("❌ Fel vid validering:", validationError);
    } else {
      console.log("✅ Validering slutförd:");
      validation?.forEach(rule => {
        console.log(`   - ${rule.validation_rule}: ${rule.status} - ${rule.details}`);
      });
    }

  } catch (error) {
    console.error("❌ Allmänt fel:", error);
  }
}

// Exempel på specifika queries för SSAB Oxelösund
async function getSSABShiftsExamples() {
  console.log("\n📋 Exempel på SSAB Oxelösund queries:");

  // Exempel 1: Hämta skift för specifikt lag och datum
  console.log("\n1. Skift för Lag 31 den 12 januari 2026:");
  const { data: specificShift, error: specificError } = await supabase
    .from("shifts")
    .select(`
      *,
      shift_teams!inner(name, color_hex)
    `)
    .eq("shift_teams.name", "Lag 31")
    .eq("start_time", "2026-01-12T00:00:00");

  if (specificError) {
    console.error("   ❌ Fel:", specificError);
  } else {
    console.log("   ✅ Skift:", specificShift?.[0]?.title || "Inget skift");
  }

  // Exempel 2: Hämta alla skift för en vecka
  console.log("\n2. Alla skift för vecka 1, 2025:");
  const { data: weekShifts, error: weekError } = await supabase
    .from("shifts")
    .select(`
      *,
      shift_teams!inner(name, color_hex)
    `)
    .gte("start_time", "2025-01-06")
    .lte("start_time", "2025-01-12")
    .order("start_time");

  if (weekError) {
    console.error("   ❌ Fel:", weekError);
  } else {
    console.log("   ✅ Skift denna vecka:", weekShifts?.length || 0);
  }

  // Exempel 3: Hämta nästa skift för användare
  console.log("\n3. Nästa skift för användare:");
  const { data: nextShift, error: nextError } = await supabase
    .rpc("get_next_shift", {
      p_user_id: "user-uuid-here" // Ersätt med riktig user ID
    });

  if (nextError) {
    console.error("   ❌ Fel:", nextError);
  } else {
    console.log("   ✅ Nästa skift:", nextShift?.title || "Inget skift");
  }
}

// Kör tester
async function runTests() {
  console.log("🚀 Startar SSAB Oxelösund Supabase tester...\n");
  
  await testSSABOxelosundSystem();
  await getSSABShiftsExamples();
  
  console.log("\n✅ Alla tester slutförda!");
}

// Exportera för användning
export { getSSABShiftsExamples, runTests, testSSABOxelosundSystem };

// Kör om detta är huvudfilen
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
} 