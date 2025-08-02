# 🚀 Komplett Chattsystem - Setup Guide

Ett komplett realtidschattsystem för företag med gruppchatt, formulär och privata meddelanden.

## ✅ Funktioner

- 💬 **Gruppchatt per företag/avdelning/skiftlag**
- ⚡ **Realtid med Supabase Realtime**
- 📋 **Färdiga formulär** (Extra arbete, Skiftöverlämning, Haveri)
- 🔒 **Privat chatt** via "intresserad"-knapp
- 🟢 **Online-status** + profilbilder
- 🏢 **Företagsstruktur** (Företag → Avdelning → Skiftlag)

## 📁 Mappstruktur

```
app/
├── chat/
│   ├── index.tsx                 // Gruppchattar
│   ├── [groupId].tsx             // Specifik chatt
│   └── new.tsx                   // Skapa ny chatt
├── components/
│   └── ChatMessage.tsx           // Meddelandekomponent
└── forms/
    ├── ExtraWorkForm.tsx         // Jobba extra
    ├── ShiftHandoverForm.tsx     // Skiftöverlämning
    └── BreakdownForm.tsx         // Haveri
```

## 🔧 Setup

### 1. Supabase Database

Kör `supabase.schema.sql` i din Supabase SQL Editor:

```sql
-- Kör hela filen för att skapa:
-- • Tabeller (chat_groups, chat_messages, private_messages, etc.)
-- • Row Level Security policies
-- • Indexes för prestanda
-- • Exempel data
```

### 2. Supabase Realtime

Aktivera Realtime för tabellerna:

```sql
-- I Supabase Dashboard → Settings → API
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table chat_group_members;
alter publication supabase_realtime add table private_messages;
```

### 3. Environment Variables

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Dependencies

```bash
npm install @supabase/supabase-js
# Eller dina befintliga Supabase dependencies
```

## 🎯 Användning

### Skapa Chattgrupp

```typescript
// Automatiskt i /chat/new.tsx
const { data: group } = await supabase
  .from('chat_groups')
  .insert({
    name: 'Dagskift A',
    company_id: 'uuid',
    department_id: 'uuid', // valfritt
    shift_team_id: 'uuid'  // valfritt
  });
```

### Skicka Meddelande

```typescript
// Textmeddelande
await supabase.from('chat_messages').insert({
  group_id: 'uuid',
  user_id: 'uuid',
  content: 'Hej alla!',
  type: 'text'
});

// Formulärmeddelande
await supabase.from('chat_messages').insert({
  group_id: 'uuid',
  user_id: 'uuid',
  content: 'Förfrågan om extra arbete',
  type: 'form',
  form_type: 'extra_work',
  metadata: {
    date: '2024-01-15',
    shift: 'Dagskift',
    description: 'Behöver hjälp med...'
  }
});
```

### Privat Meddelande

```typescript
// Via "Intresserad"-knappen
await supabase.from('private_messages').insert({
  from_user_id: 'uuid',
  to_user_id: 'uuid',
  content: 'Hej! Jag är intresserad av...',
  related_message_id: 'uuid'
});
```

## 🔄 Realtime Events

Systemet lyssnar automatiskt på:

```typescript
// Nya meddelanden
supabase
  .channel(`chat_messages_${groupId}`)
  .on('postgres_changes', { event: 'INSERT', table: 'chat_messages' }, 
    () => fetchMessages()
  )
  .subscribe();

// Online status
supabase
  .channel(`chat_members_${groupId}`)
  .on('postgres_changes', { event: 'UPDATE', table: 'chat_group_members' }, 
    () => fetchMembers()
  )
  .subscribe();
```

## 📋 Formulärtyper

### Extra Arbete
- Datum, skift, beskrivning
- Uppskattade timmar, prioritet
- Kompetens som krävs
- **"Intresserad"-knapp** → Privat meddelande

### Skiftöverlämning
- Från/till skift, status
- Slutförda uppgifter
- Problem att uppmärksamma
- Övriga kommentarer

### Haveri
- Maskin/utrustning, problem
- Prioritet, produktionspåverkan
- Säkerhetsproblem (checkbox)
- Underhåll kontaktat (checkbox)

## 🔐 Security

- **Row Level Security** aktiverat
- Användare ser bara sina egna grupper
- Privata meddelanden skyddade
- Automatisk online/offline tracking

## 🎨 UI Features

- **Profilbilder** (eller initialer som fallback)
- **Online-indikator** (grön prick + antal)
- **Färgkodade formulär** (grönt, orange, rött)
- **Realtidsuppdateringar** utan refresh
- **Auto-scroll** till nya meddelanden

## 🚀 Deploy

Systemet fungerar direkt med:
- ✅ **Cursor** (utveckling)
- ✅ **Supabase** (databas + realtime)
- ✅ **Loveable** (eller annan React Native platform)

## 🔧 Anpassningar

### Lägg till ny formulärtyp

1. **Lägg till i ChatMessage.tsx:**
```typescript
case 'my_form':
  return (
    <View className="mt-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
      <Text className="font-semibold text-purple-800">🆕 Min formulärtyp</Text>
      {/* Rendera metadata */}
    </View>
  );
```

2. **Skapa MyForm.tsx:**
```typescript
export default function MyForm({ onSend }) {
  // Formulärlogik här
  const handleSubmit = () => {
    onSend({
      type: 'form',
      form_type: 'my_form',
      content: 'Min formulärbeskrivning',
      metadata: { /* dina fält */ }
    });
  };
}
```

3. **Lägg till i [groupId].tsx:**
```typescript
case 'my_form':
  return <MyForm onSend={handleFormSubmit} />;
```

## 📞 Support

Systemet är byggt för att vara:
- **Plug-and-play** - Fungerar direkt
- **Skalbart** - Stödjer många användare
- **Säkert** - RLS + policies
- **Snabbt** - Optimerade queries + indexes

Allt är klart att köra! 🎉