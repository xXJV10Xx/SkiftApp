import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

// Configure Swedish locale
LocaleConfig.locales['sv'] = {
  monthNames: [
    'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
    'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'
  ],
  monthNamesShort: [
    'Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun',
    'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'
  ],
  dayNames: [
    'Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'
  ],
  dayNamesShort: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
  today: 'Idag'
};
LocaleConfig.defaultLocale = 'sv';

export default function CalendarScreen() {
  // Example marked dates (work shifts)
  const [markedDates, setMarkedDates] = useState({
    '2024-07-22': { marked: true, dotColor: 'blue', selected: true, selectedColor: '#4e9cff' },
    '2024-07-23': { marked: true, dotColor: 'blue' },
    '2024-07-25': { marked: true, dotColor: 'blue' },
  });

  return (
    <View style={styles.container}>
      {/* Info boxes above calendar */}
      <View style={styles.infoRow}>
        <View style={styles.infoBox}><Text style={styles.infoText}>120h</Text><Text style={styles.infoLabel}>Arbetat</Text></View>
        <View style={styles.infoBox}><Text style={styles.infoText}>Fre 07:00</Text><Text style={styles.infoLabel}>Nästa skift</Text></View>
        <View style={styles.infoBox}><Text style={styles.infoText}>12:34:56</Text><Text style={styles.infoLabel}>Countdown</Text></View>
      </View>
      <Calendar
        markedDates={markedDates}
        onDayPress={day => {
          // Show shift details for selected day (placeholder)
        }}
        theme={{
          selectedDayBackgroundColor: '#4e9cff',
          todayTextColor: '#4e9cff',
          arrowColor: '#4e9cff',
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  infoBox: { alignItems: 'center', backgroundColor: '#f0f4fa', borderRadius: 50, width: 90, height: 90, justifyContent: 'center' },
  infoText: { fontSize: 22, fontWeight: 'bold' },
  infoLabel: { fontSize: 14, color: '#555' },
}); 