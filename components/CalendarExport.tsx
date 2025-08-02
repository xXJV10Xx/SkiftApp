import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Download, Lock, CheckCircle, Loader2 } from 'lucide-react-native';

interface CalendarExportProps {
  shifts?: any[];
}

export default function CalendarExport({ shifts = [] }: CalendarExportProps) {
  const { user } = useAuth();
  const [canExport, setCanExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const checkExportPermission = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('has_paid_export')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking export permission:', error);
          setCanExport(false);
        } else {
          setCanExport(data?.has_paid_export || false);
        }
      } catch (err) {
        console.error('Error fetching user data:', err);
        setCanExport(false);
      } finally {
        setLoading(false);
      }
    };

    checkExportPermission();
  }, [user]);

  const generateICSContent = (shifts: any[]) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    
    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Skiftappen//Shift Calendar//SV
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Skiftschema
X-WR-TIMEZONE:Europe/Stockholm
X-WR-CALDESC:Exporterat skiftschema från Skiftappen
`;

    shifts.forEach((shift, index) => {
      const startDate = new Date(shift.start_time);
      const endDate = new Date(shift.end_time);
      
      // Format dates for ICS (YYYYMMDDTHHMMSSZ)
      const dtStart = startDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const dtEnd = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      
      const summary = `Skift${shift.position ? ` - ${shift.position}` : ''}`;
      const description = [
        shift.position && `Position: ${shift.position}`,
        shift.location && `Plats: ${shift.location}`,
        shift.notes && `Anteckningar: ${shift.notes}`
      ].filter(Boolean).join('\\n');

      icsContent += `BEGIN:VEVENT
UID:shift-${shift.id}-${timestamp}@skiftappen.se
DTSTART:${dtStart}
DTEND:${dtEnd}
SUMMARY:${summary}
DESCRIPTION:${description}
STATUS:${shift.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE'}
TRANSP:OPAQUE
`;

      if (shift.location) {
        icsContent += `LOCATION:${shift.location}
`;
      }

      icsContent += `CREATED:${timestamp}
LAST-MODIFIED:${timestamp}
SEQUENCE:0
END:VEVENT
`;
    });

    icsContent += 'END:VCALENDAR';
    return icsContent;
  };

  const downloadICSFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (!canExport) {
      alert('Du behöver köpa exportfunktionen för 99 kr för att kunna exportera ditt skiftschema.');
      return;
    }

    if (shifts.length === 0) {
      alert('Det finns inga skift att exportera.');
      return;
    }

    setExporting(true);

    try {
      const icsContent = generateICSContent(shifts);
      const fileName = `skiftschema-${new Date().toISOString().split('T')[0]}.ics`;
      
      downloadICSFile(icsContent, fileName);
      
      // Visa framgångsmeddelande
      alert('Skiftschema exporterat! Filen kan nu importeras i Google Kalender, Apple Kalender, Outlook m.fl.');
    } catch (error) {
      console.error('Export error:', error);
      alert('Kunde inte exportera skiftschema. Försök igen.');
    } finally {
      setExporting(false);
    }
  };

  const handlePurchase = () => {
    // Här skulle du integrera med Stripe för betalning
    alert('Denna funktion kommer att öppna betalningssidan för att köpa exportfunktionen för 99 kr.');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">Kontrollerar exportbehörighet...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Lock className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-muted-foreground">
              Du måste vara inloggad för att exportera
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!canExport) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Lock className="h-5 w-5" />
            Export kräver betalning (99 kr)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-amber-700 mb-4">
            Köp exportfunktionen för att kunna exportera ditt skiftschema till din kalender.
          </p>
          <Button 
            onClick={handlePurchase}
            className="w-full"
          >
            Köp exportfunktion
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Du har tillgång till export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-green-700 mb-4">
          Exportera ditt skiftschema som .ics-fil som kan importeras i Google Kalender, Apple Kalender, Outlook m.fl.
        </p>
        <Button 
          onClick={handleExport}
          disabled={exporting || shifts.length === 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Exporterar...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Exportera till kalender (.ics)
            </>
          )}
        </Button>
        {shifts.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            Inga skift att exportera
          </p>
        )}
      </CardContent>
    </Card>
  );
}