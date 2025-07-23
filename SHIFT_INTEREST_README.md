# 💼 Skiftapp Skiftintresse-system

## 📋 Översikt

Skiftapp har nu ett avancerat system för skiftintresse med färdiga meddelanden och automatisk privatchatt-skapande. Användare kan enkelt uttrycka intresse för att arbeta och automatiskt kopplas till relevanta kollegor.

## 🚀 Funktioner

### Färdiga Meddelanden
- **💬 Snabbknapp**: Färdiga meddelanden bredvid chattrutan
- **📝 Kategorier**: Skiftintresse, frågor, meddelanden, generella
- **🎯 Anpassade**: Automatisk fyllning av skiftdetaljer
- **⚡ Snabb**: Enkelt att skicka vanliga meddelanden

### Skiftintresse-system
- **📅 Datum**: Ange specifikt datum för skift
- **🕐 Skifttyp**: Natt, dag, kväll eller anpassad
- **⏰ Tid**: Exakt tid för skiftet
- **👥 Intresse**: Andra kan visa intresse
- **🔗 Automatisk koppling**: Skapar privatchatt automatiskt

### Privatchatt-automation
- **🤝 Automatisk koppling**: När någon visar intresse
- **💬 Direkt chatt**: Skickas till privat chatt med skiftets ägare
- **✅ Bekräftelse**: Båda parter kan bekräfta detaljer
- **📋 Översikt**: Alla skiftintressen i en lista

## 📱 Användargränssnitt

### Färdiga Meddelanden
```typescript
// Färdiga meddelanden som användare kan välja
const predefinedMessages = [
  {
    id: '1',
    text: 'Intresserad av att arbeta',
    category: 'shift_interest',
    icon: '💼'
  },
  {
    id: '2',
    text: 'Behöver hjälp med något',
    category: 'question',
    icon: '❓'
  },
  // ... fler meddelanden
];
```

### Skiftintresse-formulär
```typescript
// Formulär för skiftintresse
const shiftInterestData = {
  shift_date: '2024-01-15',
  shift_type: 'Natt',
  shift_time: '22:00-06:00'
};
```

## 🏗️ Databasstruktur

### chat_messages (Uppdaterad)
```typescript
{
  id: string;
  user_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system' | 'shift_interest';
  image_url?: string;
  shift_interest?: {
    shift_date: string;
    shift_type: string;
    shift_time: string;
    interested_users: string[];
  };
  // ... andra fält
}
```

## 🔧 Användning

### 1. Skicka Färdigt Meddelande
```typescript
const sendPredefinedMessage = async (predefinedMessage: PredefinedMessage) => {
  let messageData: any = {
    user_id: user.id,
    message: predefinedMessage.text,
    message_type: predefinedMessage.category === 'shift_interest' ? 'shift_interest' : 'text'
  };

  // Lägg till skiftintresse-data om relevant
  if (predefinedMessage.category === 'shift_interest') {
    messageData.shift_interest = {
      shift_date: shiftInterestData.shift_date,
      shift_type: shiftInterestData.shift_type,
      shift_time: shiftInterestData.shift_time,
      interested_users: []
    };
  }

  await supabase.from('chat_messages').insert(messageData);
};
```

### 2. Visa Intresse för Skift
```typescript
const handleShiftInterest = async (messageId: string) => {
  // Hämta meddelandet
  const { data: message } = await supabase
    .from('chat_messages')
    .select('*')
    .eq('id', messageId)
    .single();

  // Lägg till användaren i intresserade
  const shiftInterest = message.shift_interest || {};
  const interestedUsers = [...(shiftInterest.interested_users || []), user.id];

  // Uppdatera meddelandet
  await supabase
    .from('chat_messages')
    .update({
      shift_interest: {
        ...shiftInterest,
        interested_users: interestedUsers
      }
    })
    .eq('id', messageId);

  // Skapa automatisk privatchatt
  const channelData = {
    name: `Skiftintresse - ${shiftInterest.shift_date}`,
    type: 'private',
    participants: [message.user_id, user.id],
    created_by: user.id
  };

  const { data: channel } = await supabase
    .from('chat_channels')
    .insert(channelData)
    .select()
    .single();
};
```

### 3. Skiftintresse-visning
```typescript
// Kontrollera om användare redan är intresserad
const isInterestedInShift = (message: ChatMessage) => {
  if (message.message_type !== 'shift_interest' || !message.shift_interest) return false;
  return message.shift_interest.interested_users?.includes(user?.id) || false;
};
```

## 🎨 Användarupplevelse

### Färdiga Meddelanden
- **💬 Knapp**: Bredvid chattrutan
- **📋 Lista**: Modal med alla färdiga meddelanden
- **🎯 Kategorier**: Ikoner för olika meddelandetyper
- **⚡ Snabb**: Enkelt att välja och skicka

### Skiftintresse-formulär
- **📅 Datum**: Textfält för YYYY-MM-DD
- **🕐 Skifttyp**: Textfält för skifttyp
- **⏰ Tid**: Textfält för tid
- **✅ Validering**: Alla fält måste fyllas i
- **📤 Skicka**: Aktiverad när alla fält är ifyllda

### Skiftintresse-visning
- **💼 Kort**: Särskilt utseende för skiftintresse
- **📋 Detaljer**: Datum, skifttyp, tid
- **👆 Intresse-knapp**: "Jag är intresserad"
- **✅ Bekräftelse**: Grön badge när intresserad
- **🔗 Automatisk koppling**: Skickas till privatchatt

## 🔄 Arbetsflöde

### Skapa Skiftintresse
```
1. Klicka på 💬 (färdiga meddelanden)
2. Välj "Intresserad av att arbeta"
3. Fyll i datum, skifttyp, tid
4. Klicka "Skicka skiftintresse"
5. Meddelandet visas i chatten
```

### Visa Intresse
```
1. Se skiftintresse-meddelande i chatten
2. Klicka "Jag är intresserad"
3. Automatiskt skickas till privatchatt
4. Bekräftelse meddelas
5. Kan chatta med skiftets ägare
```

### Privatchatt-automation
```
1. Användare visar intresse
2. System skapar automatisk kanal
3. Båda användare läggs till
4. Skickas till privatchatten
5. Kan bekräfta detaljer
```

## 📊 Färdiga Meddelanden

### Skiftintresse
- 💼 **Intresserad av att arbeta**
- 🔄 **Kan någon byta skift?**

### Frågor
- ❓ **Behöver hjälp med något**

### Meddelanden
- 📢 **Viktigt meddelande**
- 📅 **Möte kl 14:00**

### Generella
- 👏 **Bra jobbat idag!**

## 🛡️ Säkerhet

### Datavalidering
- **Datum-format**: YYYY-MM-DD validering
- **Obligatoriska fält**: Alla fält måste fyllas i
- **Användarverifiering**: Endast giltiga användare kan visa intresse
- **Kanalåtkomst**: Endast deltagare i privatchatt

### Privatliv
- **Endast deltagare**: Privatchatt synlig endast för deltagare
- **Intresse-spårning**: Spårar vem som visat intresse
- **Automatisk rensning**: Gamla intressen rensas automatiskt
- **GDPR-kompatibilitet**: Användarkontroll över data

## 📈 Fördelar

### För Användare
- **⚡ Snabb**: Färdiga meddelanden sparar tid
- **🎯 Tydlig**: Strukturerad information om skift
- **🤝 Enkel**: Automatisk koppling till relevanta kollegor
- **✅ Bekräftelse**: Tydlig feedback när intresse registrerats

### För Företag
- **📊 Översikt**: Enkel spårning av skiftintressen
- **🔄 Effektivitet**: Snabbare matchning av skift
- **💬 Kommunikation**: Förbättrad kommunikation mellan kollegor
- **📈 Användning**: Högre användning av chattsystemet

## 🔮 Framtida Funktioner

### Planerade Förbättringar
- [ ] **Automatisk matchning**: AI-baserad matchning av skift
- [ ] **Kalender-integration**: Automatisk synk med kalender
- [ ] **Push-notifikationer**: Notifikationer för nya skiftintressen
- [ ] **Statistik**: Översikt över skiftintressen
- [ ] **Favoriter**: Spara vanliga skiftintressen
- [ ] **Gruppintresse**: Flera användare kan visa intresse

### Tekniska Förbättringar
- [ ] **Real-time uppdateringar**: Live-uppdateringar av intressen
- [ ] **Avancerad sökning**: Sök i skiftintressen
- [ ] **Filtrering**: Filtrera på datum, skifttyp, etc.
- [ ] **Export**: Exportera skiftintresse-data
- [ ] **API-integration**: Integration med externa system

## 📞 Support

### Vanliga Problem
1. **Skiftintresse visas inte**
   - Kontrollera message_type = 'shift_interest'
   - Verifiera shift_interest JSON-struktur
   - Kontrollera användarbehörigheter

2. **Privatchatt skapas inte**
   - Verifiera participants-array
   - Kontrollera channel_id i meddelanden
   - Kontrollera användar-ID:n

3. **Färdiga meddelanden fungerar inte**
   - Kontrollera predefinedMessages-array
   - Verifiera modal-visning
   - Kontrollera event handlers

### Debug
```typescript
// Aktivera debug logging
console.log('Predefined messages:', predefinedMessages);
console.log('Shift interest data:', shiftInterestData);
console.log('Current user:', user);
console.log('Message type:', message.message_type);
```

---

**Skiftapp Skiftintresse-system** - Effektivt system för skiftintresse med färdiga meddelanden och automatisk privatchatt. 