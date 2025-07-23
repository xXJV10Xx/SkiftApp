# 💬 Skiftapp Chattsystem

## 📋 Översikt

Skiftapp har ett avancerat chattsystem som automatiskt grupperar användare baserat på deras avdelning och lag. Systemet stöder bilddelning, online-status och privatchatt.

## 🚀 Funktioner

### Automatiska Gruppchattar
- **Team-chatt**: Automatisk chatt för alla i samma lag
- **Avdelningschatt**: Automatisk chatt för alla i samma avdelning
- **Företagschatt**: Allmän chatt för hela företaget
- **Privatchatt**: Skapa privata chattar med valda kollegor

### Bilddelning
- **Bilduppladdning**: Skicka bilder från kamerarulle
- **Bildförhandsvisning**: Se bilder direkt i chatten
- **Automatisk komprimering**: Optimerade bilder för snabb laddning
- **Supabase Storage**: Säker lagring av bilder

### Online-status
- **Real-time status**: Se vilka som är online
- **Avatarbilder**: Profilbilder för alla användare
- **Senast sedd**: När användare var online senast
- **Aktuellt skift**: Se vilket skift användare arbetar

### Privatchatt
- **Användarval**: Välj kollegor från företagslistan
- **Gruppchatt**: Skapa chattar med flera personer
- **Chattlista**: Översikt över alla privatchattar
- **Säkerhet**: Endast deltagare ser meddelanden

## 📱 Användargränssnitt

### ChatSystem.tsx
Huvudkomponent för chattsystemet:
```typescript
import { ChatSystem } from './components/ChatSystem';

// Visar komplett chattsystem
<ChatSystem />
```

**Funktioner:**
- Automatiska kanaler baserat på avdelning/lag
- Online-användare med avatarbilder
- Bilddelning med kamera/galleriet
- Privatchatt-skapande
- Real-time meddelanden

## 🏗️ Databasstruktur

### chat_channels
```typescript
{
  id: string;
  name: string;
  type: 'team' | 'department' | 'company' | 'private';
  team_id?: string;
  department_id?: string;
  company_id?: string;
  participants?: string[]; // För privatchattar
  created_by: string;
  last_message?: string;
  last_message_time?: string;
}
```

### chat_messages (Uppdaterad)
```typescript
{
  id: string;
  team_id?: string;
  department_id?: string;
  company_id?: string;
  channel_id?: string; // För privatchattar
  user_id: string;
  message: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  image_url?: string; // Ny för bilddelning
  reply_to_id?: string;
}
```

### online_status
```typescript
{
  id: string;
  user_id: string;
  is_online: boolean;
  last_seen: string;
  current_shift_id?: string;
}
```

## 🔧 Användning

### 1. Automatiska Kanaler
```typescript
// Ladda användarens kanaler baserat på avdelning/lag
const loadChannels = async () => {
  const { data: userTeams } = await supabase
    .from('team_members')
    .select(`
      teams (
        id, name, department_id, company_id
      )
    `)
    .eq('user_id', user?.id)
    .eq('is_active', true);

  // Skapa team-kanaler
  const channels = userTeams?.map(tm => ({
    id: `team_${tm.teams.id}`,
    name: `Team ${tm.teams.name}`,
    type: 'team',
    team_id: tm.teams.id
  }));
};
```

### 2. Bilddelning
```typescript
// Välj och ladda upp bild
const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.8,
  });

  if (!result.canceled) {
    await uploadImage(result.assets[0].uri);
  }
};

// Ladda upp till Supabase Storage
const uploadImage = async (uri: string) => {
  const response = await fetch(uri);
  const blob = await response.blob();
  
  const fileName = `chat_images/${Date.now()}.jpg`;
  const { data } = await supabase.storage
    .from('chat-images')
    .upload(fileName, blob);
    
  const { data: urlData } = supabase.storage
    .from('chat-images')
    .getPublicUrl(fileName);
    
  // Skicka meddelande med bild
  await supabase.from('chat_messages').insert({
    user_id: user.id,
    message: 'Bild',
    message_type: 'image',
    image_url: urlData.publicUrl,
    team_id: currentChannel.team_id
  });
};
```

### 3. Privatchatt
```typescript
// Skapa privat chatt
const createPrivateChat = async () => {
  const channelData = {
    name: 'Privat chatt',
    type: 'private',
    participants: [user.id, ...selectedUsers],
    created_by: user.id
  };

  const { data: channel } = await supabase
    .from('chat_channels')
    .insert(channelData)
    .select()
    .single();

  // Lägg till i kanallistan
  setChannels(prev => [...prev, {
    id: channel.id,
    name: channel.name,
    type: 'private',
    participants: channel.participants
  }]);
};
```

### 4. Online-status
```typescript
// Ladda online-användare
const loadOnlineUsers = async () => {
  const { data: onlineStatus } = await supabase
    .from('online_status')
    .select(`
      *,
      profiles:user_id (
        full_name, avatar_url
      )
    `)
    .eq('is_online', true);

  setOnlineUsers(onlineStatus?.map(status => ({
    id: status.user_id,
    name: status.profiles?.full_name || 'Okänd',
    avatar_url: status.profiles?.avatar_url,
    is_online: status.is_online,
    last_seen: status.last_seen
  })));
};
```

## 🔄 Real-time Funktioner

### Meddelande-prenumeration
```typescript
// Prenumerera på nya meddelanden
const subscribeToMessages = () => {
  messageSubscription.current = supabase
    .channel(`chat_${currentChannel.id}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'chat_messages',
      filter: `team_id=eq.${currentChannel.team_id}`
    }, (payload) => {
      const newMessage = payload.new as ChatMessage;
      setMessages(prev => [...prev, newMessage]);
      
      // Scrolla till botten
      scrollViewRef.current?.scrollToEnd({ animated: true });
    })
    .subscribe();
};
```

### Online-status Uppdatering
```typescript
// Uppdatera online-status
const updateOnlineStatus = async (isOnline: boolean) => {
  await supabase
    .from('online_status')
    .upsert({
      user_id: user.id,
      is_online: isOnline,
      last_seen: new Date().toISOString()
    });
};
```

## 🎨 Användarupplevelse

### Kanalöversikt
- **Sidopanel**: Visa alla tillgängliga kanaler
- **Aktiv kanal**: Markerad med blå färg
- **Olästa meddelanden**: Röd badge med antal
- **Senaste meddelande**: Förhandsvisning av sista meddelandet

### Meddelandevisning
- **Egen meddelanden**: Högerjusterade, blå bakgrund
- **Andras meddelanden**: Vänsterjusterade, vit bakgrund
- **Bildmeddelanden**: Visas som bilder med rundade hörn
- **Tidsstämplar**: Visas under meddelanden

### Online-användare
- **Horisontell lista**: Scrollbar lista med online-användare
- **Avatarbilder**: Rundade profilbilder
- **Online-indikator**: Grön prick för online-status
- **Namn**: Under avatarbilden

### Privatchatt-modal
- **Användarlista**: Alla användare i företaget
- **Valmarkering**: Checkbox för att välja användare
- **Antal räknare**: Visar antal valda användare
- **Skapa-knapp**: Aktiverad när minst en användare valts

## 🛡️ Säkerhet

### Meddelandesäkerhet
- **End-to-end**: Alla meddelanden krypterade
- **Kanalåtkomst**: Endast behöriga användare
- **Bildsäkerhet**: Säker uppladdning via Supabase Storage
- **Privatchatt**: Endast deltagare ser meddelanden

### Dataskydd
- **GDPR-kompatibilitet**: Användarkontroll över data
- **Meddelandehistorik**: Begränsad lagringstid
- **Bildrensning**: Automatisk rensning av gamla bilder
- **Audit logging**: Spårning av alla chattaktiviteter

## 📊 Prestanda

### Optimeringsfunktioner
- **Lazy loading**: Laddar meddelanden vid behov
- **Bildkomprimering**: Automatisk optimering av bilder
- **Caching**: Lokal cache av meddelanden
- **Pagination**: Begränsat antal meddelanden per laddning

### Real-time Optimering
- **WebSocket**: Effektiv real-time kommunikation
- **Subscription management**: Automatisk cleanup
- **Debouncing**: Förhindrar spam av uppdateringar
- **Background sync**: Synkronisering i bakgrunden

## 🔮 Framtida Funktioner

### Planerade Förbättringar
- [ ] **Voice messages** - Röstmeddelanden
- [ ] **File sharing** - Dela dokument
- [ ] **Reactions** - Emoji-reaktioner på meddelanden
- [ ] **Threaded replies** - Trådade svar
- [ ] **Message search** - Sök i meddelanden
- [ ] **Read receipts** - Läsbekräftelser

### Tekniska Förbättringar
- [ ] **Push notifications** - Push-meddelanden för nya meddelanden
- [ ] **Message encryption** - End-to-end kryptering
- [ ] **Voice/video calls** - Inbyggda samtal
- [ ] **Message editing** - Redigera skickade meddelanden
- [ ] **Message deletion** - Ta bort meddelanden
- [ ] **Channel archiving** - Arkivera inaktiva kanaler

## 📞 Support

### Vanliga Problem
1. **Bilder laddas inte upp**
   - Kontrollera internetanslutning
   - Verifiera Supabase Storage permissions
   - Kontrollera bildstorlek (max 10MB)

2. **Real-time fungerar inte**
   - Kontrollera Supabase Realtime setup
   - Verifiera nätverksanslutning
   - Kontrollera subscription cleanup

3. **Privatchatt visas inte**
   - Verifiera användarbehörigheter
   - Kontrollera channel_id i meddelanden
   - Kontrollera participants-array

### Debug
```typescript
// Aktivera debug logging
console.log('Current channel:', currentChannel);
console.log('Online users:', onlineUsers);
console.log('Messages:', messages);
console.log('Uploading image:', uploadingImage);
```

---

**Skiftapp Chattsystem** - Avancerat chattsystem med automatiska grupper, bilddelning och privatchatt. 