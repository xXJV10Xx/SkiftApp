# Profilbilder och Sidopanel - Användarguide

## 📸 Profilbildsfunktionalitet

### **Lägga till profilbild**
1. **Gå till Profil-fliken** eller öppna sidopanelen
2. **Klicka på profilbilden** (eller kamera-ikonen)
3. **Välj bildkälla**:
   - **Kamera**: Ta ny bild direkt
   - **Fotobibliotek**: Välj befintlig bild
4. **Beskär bilden** (kvadratisk form)
5. **Bilden laddas upp automatiskt** till Supabase Storage
6. **Bekräftelse visas** när uppladdningen är klar

### **Redigera profilbild**
- Klicka på befintlig profilbild för att ändra
- Samma process som för att lägga till ny bild
- Gamla bilden ersätts automatiskt

## 🔧 Sidopanel (Drawer Navigation)

### **Öppna sidopanelen**
- **Hamburger-meny** (☰) längst upp till vänster
- **Profilbild** längst upp till höger
- **Swipe från vänster** (på mobil)

### **Vad visas i sidopanelen**
#### **Profilsektion (högst upp)**
- ✅ **Profilbild** (rund, 60px)
- ✅ **Användarens namn** (förnamn + efternamn)
- ✅ **E-postadress**
- ✅ **Företagsinformation** med ikon
- ✅ **Skiftlag** med färgkodning

#### **Navigation**
- 🏠 **Hem**: Dashboard och översikt
- 👤 **Profil**: Hantera din profil  
- ⚙️ **Inställningar**: App-inställningar

#### **Footer**
- 🚪 **Logga ut**-knapp med bekräftelse

## 🎨 Design och UX

### **Profilbild-komponenten**
- **Rund form** med border
- **Fallback-ikon** (User-ikon) om ingen bild
- **Kamera-ikon** för redigering
- **Loading-state** under uppladdning
- **Responsiv storlek** (olika storlekar för olika kontexter)

### **Sidopanel-design**
- **Primärfärg som header** med vit text
- **Elegant animering** in/ut
- **Overlay** för att stänga genom att klicka utanför
- **Skuggor och elevation** för djupkänsla

### **Header-komponenten**
- **Hamburger-meny** till vänster
- **Sidtitel** i mitten
- **Liten profilbild** till höger (36px)
- **Konsekvent across alla sidor**

## 🔒 Säkerhet och Lagring

### **Supabase Storage**
- **Säker bucket**: `profile-images`
- **Publikt tillgänglig** för visning
- **RLS-policies** för uppladdning/redigering
- **Användare kan bara redigera sina egna bilder**

### **Filhantering**
- **Unika filnamn**: `{userId}_{timestamp}.{extension}`
- **Bildkomprimering**: Quality 0.8 för mindre filstorlek
- **Format**: JPG/PNG stöds
- **Automatisk beskärning**: Kvadratisk aspect ratio

### **Behörigheter**
- **iOS**: NSCameraUsageDescription, NSPhotoLibraryUsageDescription
- **Android**: CAMERA, READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE
- **Begärs dynamiskt** när användaren försöker välja bild

## 📱 Teknisk Implementation

### **Komponenter**
```typescript
ProfilePicture:
- imageUri: string | null
- size: number (default 80)
- editable: boolean (default true)
- showCameraIcon: boolean (default true)
- onImageSelected: (uri: string) => void

DrawerLayout:
- children: React.ReactNode  
- title?: string
- showHeader: boolean (default true)

AppHeader:
- title?: string
- onMenuPress: () => void
- showProfilePicture: boolean (default true)

SidePanel:
- onNavigate: (screen: string) => void
```

### **Hooks och Context**
- **useCompany**: Hämtar employee.avatar_url
- **useAuth**: Användar-ID för filuppladdning
- **useTheme**: Färgtema för konsekvent design

### **Bilduppladdning**
```typescript
uploadProfileImage(userId: string, imageUri: string)
- Läser fil som base64
- Konverterar till blob
- Laddar upp till Supabase Storage
- Returnerar public URL
```

## 🎯 Användningsfall

### **Första gången**
1. Användare ser placeholder-ikon
2. Klickar för att lägga till bild
3. Väljer kamera eller fotobibliotek
4. Beskär och sparar
5. Bilden visas överallt i appen

### **Uppdatering**
1. Klickar på befintlig profilbild
2. Väljer ny bildkälla
3. Gamla bilden ersätts automatiskt
4. Uppdateras i realtid i sidopanel

### **Navigation**
1. Öppnar sidopanel via meny eller profilbild
2. Ser fullständig profilinformation
3. Navigerar till olika sektioner
4. Loggar ut säkert

## ✨ Fördelar

### **För användare**
- ✅ **Personlig touch** med egen profilbild
- ✅ **Enkel navigation** via sidopanel
- ✅ **Snabb åtkomst** till profil och inställningar
- ✅ **Visuell identitet** i chattar och meddelanden

### **För systemet**
- ✅ **Konsekvent UX** across alla skärmar
- ✅ **Säker bildhantering** med Supabase
- ✅ **Optimerad prestanda** med bildkomprimering
- ✅ **Skalbar arkitektur** för framtida funktioner

Profilbildsfunktionaliteten är nu **fullt implementerad** och redo att användas! 🎉