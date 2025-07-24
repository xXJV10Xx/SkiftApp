import { supabase } from './supabase';
import { COMPANIES } from '../data/companies';

export interface SSABSetupResult {
  success: boolean;
  message: string;
  data?: {
    companyId: string;
    teamIds: string[];
  };
  error?: string;
}

/**
 * Initialiserar SSAB Oxelösund i Supabase med teams 31-35
 */
export async function initializeSSABOxelosund(): Promise<SSABSetupResult> {
  try {
    const ssabCompany = COMPANIES.SSAB;
    
    if (!ssabCompany) {
      return {
        success: false,
        message: 'SSAB företagsdata hittades inte',
        error: 'Missing company data'
      };
    }

    // 1. Skapa eller uppdatera företaget
    const { data: existingCompany, error: companyCheckError } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', 'ssab-oxelosund')
      .single();

    let companyId: string;

    if (existingCompany) {
      // Uppdatera befintligt företag
      const { data: updatedCompany, error: updateError } = await supabase
        .from('companies')
        .update({
          name: ssabCompany.name,
          slug: 'ssab-oxelosund',
          logo_url: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingCompany.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      companyId = updatedCompany.id;
    } else {
      // Skapa nytt företag
      const { data: newCompany, error: insertError } = await supabase
        .from('companies')
        .insert({
          name: ssabCompany.name,
          slug: 'ssab-oxelosund',
          logo_url: null
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      companyId = newCompany.id;
    }

    // 2. Skapa eller uppdatera teams 31-35
    const teamIds: string[] = [];
    
    for (const teamName of ssabCompany.teams) {
      const teamColor = ssabCompany.colors[teamName];
      
      // Kontrollera om teamet redan finns
      const { data: existingTeam, error: teamCheckError } = await supabase
        .from('teams')
        .select('id')
        .eq('company_id', companyId)
        .eq('name', `Lag ${teamName}`)
        .single();

      let teamId: string;

      if (existingTeam) {
        // Uppdatera befintligt team
        const { data: updatedTeam, error: updateError } = await supabase
          .from('teams')
          .update({
            name: `Lag ${teamName}`,
            description: `SSAB Oxelösund Lag ${teamName} - 3-skift`,
            color: teamColor,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingTeam.id)
          .select()
          .single();

        if (updateError) {
          throw updateError;
        }

        teamId = updatedTeam.id;
      } else {
        // Skapa nytt team
        const { data: newTeam, error: insertError } = await supabase
          .from('teams')
          .insert({
            company_id: companyId,
            name: `Lag ${teamName}`,
            description: `SSAB Oxelösund Lag ${teamName} - 3-skift`,
            color: teamColor
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }

        teamId = newTeam.id;
      }

      teamIds.push(teamId);
    }

    return {
      success: true,
      message: `SSAB Oxelösund har initierats med ${ssabCompany.teams.length} lag (${ssabCompany.teams.join(', ')})`,
      data: {
        companyId,
        teamIds
      }
    };

  } catch (error) {
    console.error('Fel vid initialisering av SSAB Oxelösund:', error);
    return {
      success: false,
      message: 'Fel vid initialisering av SSAB Oxelösund',
      error: error instanceof Error ? error.message : 'Okänt fel'
    };
  }
}

/**
 * Hämtar SSAB Oxelösund företags- och teamdata från Supabase
 */
export async function getSSABData(): Promise<{
  success: boolean;
  data?: {
    company: any;
    teams: any[];
  };
  error?: string;
}> {
  try {
    // Hämta företaget
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', 'ssab-oxelosund')
      .single();

    if (companyError) {
      throw companyError;
    }

    // Hämta teams
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .eq('company_id', company.id)
      .order('name');

    if (teamsError) {
      throw teamsError;
    }

    return {
      success: true,
      data: {
        company,
        teams
      }
    };

  } catch (error) {
    console.error('Fel vid hämtning av SSAB data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Okänt fel'
    };
  }
}

/**
 * Rensa alla SSAB-relaterade scheman från databasen
 */
export async function clearSSABSchedules(): Promise<{
  success: boolean;
  message: string;
  deletedCount?: number;
}> {
  try {
    // Hämta SSAB företags-ID
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', 'ssab-oxelosund')
      .single();

    if (companyError) {
      throw companyError;
    }

    // Ta bort alla scheman för SSAB
    const { count, error: deleteError } = await supabase
      .from('shifts')
      .delete({ count: 'exact' })
      .eq('company_id', company.id);

    if (deleteError) {
      throw deleteError;
    }

    return {
      success: true,
      message: `Rensade ${count || 0} scheman för SSAB Oxelösund`,
      deletedCount: count || 0
    };

  } catch (error) {
    console.error('Fel vid rensning av SSAB scheman:', error);
    return {
      success: false,
      message: 'Fel vid rensning av scheman'
    };
  }
}

/**
 * Genererar och sparar scheman för alla SSAB teams för nästa 3 månader
 */
export async function generateInitialSSABSchedules(): Promise<{
  success: boolean;
  message: string;
  generatedSchedules?: number;
}> {
  try {
    const { generateAllTeamsSchedule } = await import('./schedule-generator');
    
    // Beräkna datumintervall för nästa 3 månader
    const today = new Date();
    const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    
    const startDateString = startDate.toISOString().split('T')[0];
    const endDateString = endDate.toISOString().split('T')[0];

    // Generera scheman för alla teams
    const results = await generateAllTeamsSchedule(startDateString, endDateString);
    
    let totalGenerated = 0;
    let successCount = 0;

    for (const [teamId, result] of Object.entries(results)) {
      if (result.success && result.data?.schedule) {
        successCount++;
        totalGenerated += result.data.schedule.length;
      }
    }

    if (successCount === 5) {
      return {
        success: true,
        message: `Genererade scheman för alla 5 lag (${totalGenerated} skiftdagar totalt)`,
        generatedSchedules: totalGenerated
      };
    } else {
      return {
        success: false,
        message: `Endast ${successCount}/5 lag fick scheman genererade`
      };
    }

  } catch (error) {
    console.error('Fel vid generering av initiala scheman:', error);
    return {
      success: false,
      message: 'Fel vid generering av initiala scheman'
    };
  }
}