# Deployment Instructions - Loveable

## 🚀 Deploy till Loveable

### Steg 1: Förbered Projektet

1. **Kontrollera att alla filer är exporterade:**
   ```bash
   ls -la loveable-export/
   ```

2. **Verifiera project.json:**
   ```bash
   cat loveable-export/project.json
   ```

### Steg 2: Loveable Setup

1. **Logga in på Loveable:**
   - Gå till [loveable.dev](https://loveable.dev)
   - Logga in med GitHub

2. **Skapa nytt projekt:**
   - Klicka "New Project"
   - Välj "Import from folder"
   - Ladda upp `loveable-export/` mappen

3. **Konfigurera projekt:**
   - Projektnamn: "Svenska Skiftappen"
   - Framework: "React Native Web"
   - Template: "Custom"

### Steg 3: Environment Setup

1. **Supabase Konfiguration:**
   ```
   SUPABASE_URL=https://fsefeherdbtsddqimjco.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

2. **App Konfiguration:**
   ```
   APP_NAME=Svenska Skiftappen
   APP_VERSION=1.0.0
   LOCALE=sv-SE
   TIMEZONE=Europe/Stockholm
   ```

### Steg 4: Database Setup

1. **Kör Supabase Migrations:**
   - Öppna Supabase Dashboard
   - Gå till SQL Editor
   - Kör `supabase/migrations/20250126_create_shift_tables.sql`

2. **Importera Data:**
   - Kör `scripts/fetch-shift-schedules.js`
   - Verifiera att data finns i tabellerna

### Steg 5: Deploy

1. **Första Deploy:**
   - Klicka "Deploy" i Loveable
   - Vänta på build att slutföras
   - Testa appen på staging URL

2. **Produktionsdeploy:**
   - Klicka "Deploy to Production"
   - Konfigurera custom domain (valfritt)
   - Aktivera SSL

### Steg 6: Verifiering

1. **Testa Funktionalitet:**
   - [ ] Kalender visas korrekt
   - [ ] Skiftscheman laddas
   - [ ] Filtrering fungerar
   - [ ] Svenska helgdagar visas
   - [ ] Responsiv design

2. **Prestanda Check:**
   - [ ] Snabb laddning (<3s)
   - [ ] Smooth scrolling
   - [ ] Effektiv datahantering

## 🔄 Kontinuerlig Deployment

### GitHub Integration

1. **Koppla Repository:**
   - Gå till Settings > Integrations
   - Koppla GitHub repository
   - Välj main branch

2. **Auto-Deploy:**
   - Aktivera "Auto-deploy on push"
   - Konfigurera build hooks
   - Sätt upp notifications

### Update Process

1. **Kod Ändringar:**
   ```bash
   # Gör ändringar i skiftappen/
   git add .
   git commit -m "Update: beskrivning"
   git push origin main
   ```

2. **Export och Deploy:**
   ```bash
   # Exportera till Loveable
   node scripts/export-to-loveable.js
   
   # Auto-deploy triggas automatiskt
   ```

## 📊 Monitoring

### Loveable Dashboard
- **Performance Metrics:** Laddningstider, användning
- **Error Tracking:** JavaScript errors, crashes
- **Analytics:** Användarstatistik, populära funktioner

### Supabase Dashboard
- **Database Performance:** Query times, connections
- **API Usage:** Requests per minut, rate limits
- **Storage:** Data storlek, backup status

## 🐛 Troubleshooting

### Vanliga Problem

1. **Build Fel:**
   - Kontrollera package.json dependencies
   - Verifiera TypeScript konfiguration
   - Kolla environment variables

2. **Supabase Connection:**
   - Verifiera URL och API keys
   - Kontrollera RLS policies
   - Testa database connectivity

3. **Performance Issues:**
   - Optimera Supabase queries
   - Implementera caching
   - Reducera bundle size

### Support

- **Loveable Support:** support@loveable.dev
- **Supabase Support:** Via dashboard
- **Community:** GitHub Issues

---

**Ready for Production!** 🚀
