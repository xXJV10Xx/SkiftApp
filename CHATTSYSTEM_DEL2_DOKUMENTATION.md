# Chattsystem Del 2 - Dokumentation

## Översikt

Detta är Del 2 av chattsystemet för Skiftappen, som lägger till stöd för:
- **Grupper** - Organisera användare i grupper baserat på företag/avdelningar
- **Formulär** - Färdiga formulär för skiftöverlämning, jobba extra och haveri
- **Automatisk privat chatt** - Startar automatiskt privat chatt när någon markerar intresse
- **Online-status** - Visa vilka användare som är online med profilbilder

## Databasstruktur

### Nya Tabeller

#### 1. `groups`
```sql
create table groups (
  id uuid primary key default uuid_generate_v4(),
  company_id uuid references companies(id),
  department_id uuid references departments(id),
  name text,
  created_by uuid references users(id),
  created_at timestamp default now()
);
```

#### 2. `group_members`
```sql
create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id),
  user_id uuid references users(id),
  is_online boolean default false,
  joined_at timestamp default now()
);
```

#### 3. `messages`
```sql
create table messages (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id),
  sender_id uuid references users(id),
  content text,
  type text default 'text', -- text | form | image
  metadata jsonb,
  created_at timestamp default now()
);
```

#### 4. `forms`
```sql
create table forms (
  id uuid primary key default uuid_generate_v4(),
  type text, -- "skiftöverlämning", "jobba extra", "haveri"
  sender_id uuid references users(id),
  group_id uuid references groups(id),
  date date,
  shift text,
  description text,
  interested_user_ids uuid[],
  created_at timestamp default now()
);
```

### Supabase Function

```sql
create or replace function add_interested_user(
  form_id_input uuid,
  user_id_input uuid
) returns void as $$
begin
  update forms
  set interested_user_ids = array_append(interested_user_ids, user_id_input)
  where id = form_id_input;
end;
$$ language plpgsql;
```

## Komponenter

### 1. FormulärSkift (`components/FormulärSkift.tsx`)

**Syfte**: Skapa och skicka formulär för skiftöverlämning, jobba extra och haveri.

**Props**:
- `groupId: string` - ID för gruppen där formuläret ska skickas
- `formType: 'skiftöverlämning' | 'jobba extra' | 'haveri'` - Typ av formulär
- `onFormSent?: () => void` - Callback när formuläret skickats

**Funktioner**:
- Validering av datum (YYYY-MM-DD format)
- Validering av skift (F/E/N)
- Automatisk rensning av formulär efter skickning
- Felhantering med användarvänliga meddelanden

**Exempel användning**:
```tsx
<FormulärSkift
  groupId="gruppe-uuid"
  formType="skiftöverlämning"
  onFormSent={() => console.log('Formulär skickat!')}
/>
```

### 2. OnlineMembers (`components/OnlineMembers.tsx`)

**Syfte**: Visa online användare i en grupp med profilbilder och online-indikatorer.

**Props**:
- `groupId: string` - ID för gruppen
- `onMemberPress?: (member: GroupMember) => void` - Callback när användare klickas
- `refreshInterval?: number` - Uppdateringsintervall i millisekunder (standard: 30s)

**Funktioner**:
- Horisontell scrollning av användare
- Automatisk uppdatering av online-status
- Fallback för saknade profilbilder (visar initialer)
- Online-indikator (grön prick)

**Exempel användning**:
```tsx
<OnlineMembers
  groupId="gruppe-uuid"
  onMemberPress={(member) => console.log('Klickade på:', member.users.username)}
  refreshInterval={15000} // 15 sekunder
/>
```

### 3. FormDisplay (`components/FormDisplay.tsx`)

**Syfte**: Visa formulär med möjlighet att markera intresse och starta privat chatt.

**Props**:
- `form: ChatForm` - Formulärobjekt att visa
- `currentUserId?: string` - Aktuell användares ID
- `onInterestMarked?: (formId: string) => void` - Callback när intresse markeras

**Funktioner**:
- Visar formulärtyp med färgkodning och emojis
- Intresserad-knapp som startar privat chatt
- Visar antal intresserade användare
- Förhindrar att man markerar intresse för egna formulär

**Exempel användning**:
```tsx
<FormDisplay
  form={formulärObjekt}
  currentUserId="user-uuid"
  onInterestMarked={(formId) => console.log('Intresse markerat för:', formId)}
/>
```

### 4. Button (`components/ui/Button.tsx`)

**Syfte**: Återanvändbar knappkomponent för React Native.

**Props**:
- `title: string` - Knapptext
- `onPress: () => void` - Klick-handler
- `disabled?: boolean` - Om knappen är inaktiverad
- `variant?: 'primary' | 'secondary' | 'outline' | 'destructive'` - Stil
- `size?: 'sm' | 'md' | 'lg'` - Storlek

## Hjälpfunktioner (`lib/chatUtils.ts`)

### Typer

```typescript
interface GroupMember {
  user_id: string;
  is_online: boolean;
  joined_at: string;
  users: {
    username: string;
    avatar_url: string | null;
    first_name?: string;
    last_name?: string;
  };
}

interface ChatForm {
  id: string;
  type: 'skiftöverlämning' | 'jobba extra' | 'haveri';
  sender_id: string;
  group_id: string;
  date: string;
  shift: string;
  description: string;
  interested_user_ids: string[];
  created_at: string;
  sender?: {
    username: string;
    first_name?: string;
    last_name?: string;
  };
}
```

### Funktioner

#### `markInterested(formId: string, interestedUserId: string): Promise<boolean>`
- Markerar användare som intresserad av ett formulär
- Startar automatiskt privat chatt med formulärets avsändare
- Returnerar `true` om framgångsrikt

#### `startPrivateChat(userId1: string, userId2: string): Promise<string | null>`
- Skapar eller hittar befintlig privat chatt mellan två användare
- Privata grupper har `name = null`
- Returnerar grupp-ID eller `null` om misslyckades

#### `getOnlineGroupMembers(groupId: string): Promise<GroupMember[]>`
- Hämtar alla online medlemmar i en grupp
- Inkluderar användarinfo och profilbilder
- Sorterat efter när de gick med

#### `updateOnlineStatus(groupId: string, userId: string, isOnline: boolean): Promise<void>`
- Uppdaterar användarens online-status i en grupp

#### `sendMessage(groupId: string, content: string, type?: string, metadata?: any): Promise<boolean>`
- Skickar meddelande till en grupp
- Stöder olika meddelandetyper (text, form, image)

#### `getGroupMessages(groupId: string, limit?: number): Promise<ChatMessage[]>`
- Hämtar meddelanden för en grupp
- Inkluderar avsändarinfo
- Standard limit: 50 meddelanden

## Arbetsflöde

### 1. Skicka Formulär
```
1. Användare fyller i FormulärSkift
2. Validering av datum och skift
3. Formulär sparas i `forms` tabellen
4. Formulär visas i gruppens meddelandeflöde
```

### 2. Markera Intresse
```
1. Användare ser formulär i FormDisplay
2. Klickar "Intresserad" knappen
3. markInterested() anropas:
   - Lägger till användar-ID i interested_user_ids array
   - Startar privat chatt med formulärets avsändare
4. Privat chatt skapas eller befintlig hittas
5. Användare får bekräftelse och kan börja chatta
```

### 3. Online Status
```
1. OnlineMembers komponenten laddar online användare
2. Uppdateras automatiskt var 30:e sekund
3. Visar profilbilder och online-indikatorer
4. Klick på användare kan trigga actions (ex. privat chatt)
```

## Integration Guide

### 1. Lägg till i din app

```tsx
import FormulärSkift from './components/FormulärSkift';
import OnlineMembers from './components/OnlineMembers';
import FormDisplay from './components/FormDisplay';
import { markInterested, getOnlineGroupMembers } from './lib/chatUtils';

// I din chattkomponent
function ChatScreen({ groupId }) {
  const [showForm, setShowForm] = useState(false);
  const [formType, setFormType] = useState('skiftöverlämning');

  return (
    <View>
      <OnlineMembers groupId={groupId} />
      
      {showForm && (
        <FormulärSkift
          groupId={groupId}
          formType={formType}
          onFormSent={() => setShowForm(false)}
        />
      )}
      
      {/* Visa formulär i meddelandelistan */}
      {forms.map(form => (
        <FormDisplay
          key={form.id}
          form={form}
          currentUserId={currentUser.id}
        />
      ))}
    </View>
  );
}
```

### 2. Supabase Setup

1. Kör SQL-skripten för att skapa tabellerna
2. Skapa `add_interested_user` funktionen
3. Konfigurera RLS (Row Level Security) policies om nödvändigt

### 3. Permissions

Rekommenderade RLS policies:

```sql
-- Users can only see groups they're members of
CREATE POLICY "Users can view own groups" ON groups
  FOR SELECT USING (
    id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Users can only see messages in their groups
CREATE POLICY "Users can view group messages" ON messages
  FOR SELECT USING (
    group_id IN (
      SELECT group_id FROM group_members 
      WHERE user_id = auth.uid()
    )
  );
```

## Felsökning

### Vanliga Problem

1. **Formulär skickas inte**
   - Kontrollera att användaren är inloggad
   - Validera datum format (YYYY-MM-DD)
   - Kontrollera att groupId är korrekt

2. **Online status uppdateras inte**
   - Kontrollera nätverksanslutning
   - Verifiera att group_members tabellen har rätt data
   - Kontrollera refreshInterval inställning

3. **Privat chatt startar inte**
   - Kontrollera att `add_interested_user` funktionen finns
   - Verifiera att båda användarna existerar
   - Kontrollera RLS policies

### Debug Tips

```typescript
// Aktivera debug logging
console.log('Sending form:', { groupId, formType, date, shift, description });

// Kontrollera online members
const members = await getOnlineGroupMembers(groupId);
console.log('Online members:', members);

// Testa privat chatt
const chatId = await startPrivateChat(user1Id, user2Id);
console.log('Private chat ID:', chatId);
```

## Nästa Steg

För Del 3 kan följande funktioner läggas till:
- UI-komponenter för att visa och söka grupper
- Automatisk e-post för gruppinbjudningar
- Push-notifikationer för nya meddelanden
- Filuppladdning i meddelanden
- Emoji-reaktioner på meddelanden

## Support

För frågor eller problem, kontakta utvecklingsteamet eller skapa en issue i projektets repository.