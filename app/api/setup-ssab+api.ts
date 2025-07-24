import { initializeSSABOxelosund, getSSABData, clearSSABSchedules, generateInitialSSABSchedules } from '../../lib/ssab-setup';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action;

    switch (action) {
      case 'initialize':
        const initResult = await initializeSSABOxelosund();
        return Response.json(initResult);

      case 'generate-schedules':
        const scheduleResult = await generateInitialSSABSchedules();
        return Response.json(scheduleResult);

      case 'clear-schedules':
        const clearResult = await clearSSABSchedules();
        return Response.json(clearResult);

      case 'full-setup':
        // Fullständig setup: initialisera + generera scheman
        const fullInitResult = await initializeSSABOxelosund();
        if (!fullInitResult.success) {
          return Response.json(fullInitResult);
        }

        const fullScheduleResult = await generateInitialSSABSchedules();
        return Response.json({
          success: fullScheduleResult.success,
          message: `${fullInitResult.message}. ${fullScheduleResult.message}`,
          data: {
            ...fullInitResult.data,
            generatedSchedules: fullScheduleResult.generatedSchedules
          }
        });

      default:
        return Response.json(
          { 
            success: false, 
            error: 'Ogiltig action. Tillgängliga: initialize, generate-schedules, clear-schedules, full-setup' 
          },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Setup API Error:', error);
    return Response.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const result = await getSSABData();
    return Response.json(result);

  } catch (error) {
    console.error('Get SSAB Data Error:', error);
    return Response.json(
      { 
        success: false, 
        error: `Server error: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}