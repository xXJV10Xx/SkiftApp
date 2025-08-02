// Note: In React Native, file operations work differently
// This implementation is for web/Node.js environments
// For React Native, you'd use expo-file-system or react-native-fs

import { format } from 'date-fns';

export function generateICS(events) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//SkiftApp//EN',
  ];

  events.forEach((event, i) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:event-${i}@skiftapp`);
    lines.push(`SUMMARY:${event.title}`);
    lines.push(`DTSTART:${format(new Date(event.start), "yyyyMMdd'T'HHmmss")}`);
    lines.push(`DTEND:${format(new Date(event.end), "yyyyMMdd'T'HHmmss")}`);
    lines.push(`DESCRIPTION:${event.description || ''}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  const content = lines.join('\r\n');
  
  // For React Native/Expo, we'll return the content instead of writing to file
  // The calling component can handle the file download/sharing
  if (typeof window !== 'undefined') {
    // Web environment - create download link
    const blob = new Blob([content], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shifts.ics';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    console.log('✅ shifts.ics downloaded');
  } else {
    // React Native environment - would need expo-file-system
    console.log('✅ ICS content generated (React Native file handling needed)');
  }
  
  return content;
}