import { generateSchedule, generateSSABSchedule, generateCurrentMonthSchedule, generateAllTeamsSchedule, type ScheduleRequest } from '../../lib/schedule-generator';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const companyId = url.searchParams.get('companyId');
    const teamId = url.searchParams.get('teamId');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    const includeStats = url.searchParams.get('includeStats') === 'true';
    const currentMonth = url.searchParams.get('currentMonth') === 'true';
    const allTeams = url.searchParams.get('allTeams') === 'true';

    // Hantera olika typer av förfrågningar
    if (allTeams && startDate && endDate) {
      // Generera schema för alla SSAB teams
      const result = await generateAllTeamsSchedule(startDate, endDate);
      return Response.json(result);
    }

    if (currentMonth && teamId && ['31', '32', '33', '34', '35'].includes(teamId)) {
      // Generera schema för aktuell månad
      const result = await generateCurrentMonthSchedule(teamId as '31' | '32' | '33' | '34' | '35');
      return Response.json(result);
    }

    // Standard schemagenererering
    if (!companyId || !teamId || !startDate || !endDate) {
      return Response.json(
        { 
          success: false, 
          error: 'Saknar obligatoriska parametrar: companyId, teamId, startDate, endDate' 
        },
        { status: 400 }
      );
    }

    const scheduleRequest: ScheduleRequest = {
      companyId,
      teamId,
      startDate,
      endDate,
      includeStats
    };

    const result = await generateSchedule(scheduleRequest);
    return Response.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validera att body innehåller nödvändig data
    if (!body.companyId || !body.teamId || !body.startDate || !body.endDate) {
      return Response.json(
        { 
          success: false, 
          error: 'Saknar obligatoriska fält i request body: companyId, teamId, startDate, endDate' 
        },
        { status: 400 }
      );
    }

    const scheduleRequest: ScheduleRequest = {
      companyId: body.companyId,
      teamId: body.teamId,
      startDate: body.startDate,
      endDate: body.endDate,
      includeStats: body.includeStats ?? true
    };

    const result = await generateSchedule(scheduleRequest);
    return Response.json(result);

  } catch (error) {
    console.error('API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}