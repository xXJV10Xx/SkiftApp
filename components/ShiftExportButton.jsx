import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';

const ShiftExportButton = ({ events }) => {
  // Funktion för att formatera datum för iCal
  const formatDateForICal = (date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  // Funktion för att skapa iCal-innehåll
  const generateICalContent = (shifts) => {
    const calendarHeader = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Skiftappen//Skiftschema//SV',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'X-WR-CALNAME:Skiftschema',
      'X-WR-CALDESC:Skiftschema från Skiftappen',
    ].join('\r\n');

    const calendarFooter = 'END:VCALENDAR';

    const events = shifts.map(shift => {
      const startDate = new Date(shift.date);
      let endDate = new Date(shift.date);
      
      // Bestäm arbetstider baserat på skifttyp
      switch (shift.shift_type) {
        case 'Dag':
          startDate.setHours(7, 0, 0, 0);
          endDate.setHours(19, 0, 0, 0);
          break;
        case 'Natt':
          startDate.setHours(19, 0, 0, 0);
          endDate.setDate(endDate.getDate() + 1);
          endDate.setHours(7, 0, 0, 0);
          break;
        case 'Helg':
          startDate.setHours(7, 0, 0, 0);
          endDate.setHours(19, 0, 0, 0);
          break;
        default:
          startDate.setHours(8, 0, 0, 0);
          endDate.setHours(17, 0, 0, 0);
      }

      const eventId = shift.uuid || shift.id || Math.random().toString(36);
      
      return [
        'BEGIN:VEVENT',
        `UID:${eventId}@skiftappen.se`,
        `DTSTART:${formatDateForICal(startDate)}`,
        `DTEND:${formatDateForICal(endDate)}`,
        `SUMMARY:${shift.shift_type}skift`,
        `DESCRIPTION:Skift: ${shift.shift_type}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      ].join('\r\n');
    }).join('\r\n');

    return [calendarHeader, events, calendarFooter].join('\r\n');
  };

  // Funktion för att ladda ner iCal-fil
  const downloadICalFile = () => {
    if (!events || events.length === 0) {
      Alert.alert('Ingen data', 'Inga skift att exportera');
      return;
    }

    try {
      const icalContent = generateICalContent(events);
      
      // För web-miljö
      if (typeof window !== 'undefined' && window.document) {
        const blob = new Blob([icalContent], { type: 'text/calendar;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `skiftschema-${new Date().toISOString().split('T')[0]}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        Alert.alert(
          'Export lyckades!', 
          'Kalenderfilen har laddats ner. Du kan nu importera den i Apple Kalender eller Google Kalender.'
        );
      } else {
        // För React Native miljö - visa instruktioner
        Alert.alert(
          'Kalenderexport', 
          'För att exportera till kalender, använd webbversionen av appen.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error generating calendar file:', error);
      Alert.alert('Fel', 'Kunde inte skapa kalenderfil');
    }
  };

  // Funktion för att visa instruktioner
  const showInstructions = () => {
    Alert.alert(
      'Kalenderimport',
      'Efter nedladdning:\n\n' +
      '📱 iPhone/iPad:\n' +
      '• Öppna filen i Mail eller Files\n' +
      '• Tryck "Lägg till i kalender"\n\n' +
      '💻 Google Kalender:\n' +
      '• Gå till calendar.google.com\n' +
      '• Klicka på "+" bredvid "Andra kalendrar"\n' +
      '• Välj "Importera"\n' +
      '• Ladda upp .ics-filen',
      [{ text: 'Förstått' }]
    );
  };

  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Pressable
          onPress={downloadICalFile}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#2563eb' : '#3b82f6',
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            minWidth: 140,
          })}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 14 }}>
            📅 Exportera till kalender
          </Text>
        </Pressable>

        <Pressable
          onPress={showInstructions}
          style={({ pressed }) => ({
            backgroundColor: pressed ? '#6b7280' : '#9ca3af',
            paddingHorizontal: 12,
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          <Text style={{ color: 'white', fontSize: 16 }}>❓</Text>
        </Pressable>
      </View>

      <Text style={{ 
        fontSize: 12, 
        color: '#6b7280', 
        marginTop: 8,
        textAlign: 'center' 
      }}>
        Fungerar med Apple Kalender, Google Kalender och Outlook
      </Text>
    </View>
  );
};

export default ShiftExportButton;