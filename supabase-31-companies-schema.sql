-- ===============================================
-- 🇸🇪 Complete Supabase Schema for 31 Swedish Companies
-- Verified against skiftschema.se 2025-08-07
-- ===============================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types for better data integrity
CREATE TYPE company_category AS ENUM (
  'abb_hvc_5skift', 'aga_avesta_6skift', 'arctic_paper_grycksbo_3skift',
  'barilla_sverige_filipstad', 'billerudkorsnas_gruvon_grums', 'boliden_aitik_gruva_k3',
  'borlange_energi', 'borlange_kommun_polskoterska', 'cambrex_karlskoga_5skift',
  'dentsply_molndal_5skift', 'finess_hygiene_ab_5skift', 'kubal_sundsvall_6skift',
  'lkab_malmberget_5skift', 'nordic_paper_backhammar_3skift', 'orica_gyttorp_exel_5skift',
  'outokumpu_avesta_5skift', 'ovako_hofors_rorverk_4_5skift', 'preemraff_lysekil_5skift',
  'ryssviken_boendet', 'sandvik_mt_2skift', 'scania_cv_ab_transmission_5skift',
  'schneider_electric_5skift', 'seco_tools_fagersta_2skift', 'skarnas_hamn_5_skift',
  'skf_ab_5skift2', 'sodra_cell_monsteras_3skift', 'ssab_4_7skift', 'ssab-oxelosund',
  'stora_enso_fors_5skift', 'truck_service_2skift', 'uddeholm_tooling_2skift',
  'voestalpine_precision_strip_2skift'
);

CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'canceled', 'past_due');
CREATE TYPE subscription_plan AS ENUM ('free', 'basic', 'premium');
CREATE TYPE shift_code AS ENUM ('F', 'E', 'N', 'L', 'D', 'D12', 'N12');

-- ===============================================
-- CORE TABLES
-- ===============================================

-- Companies table with full verification data
CREATE TABLE companies (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id company_category NOT NULL UNIQUE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  industry TEXT,
  location TEXT,
  skiftschema_url TEXT,
  verified BOOLEAN DEFAULT false,
  total_teams INTEGER DEFAULT 1,
  default_team TEXT DEFAULT '1',
  colors JSONB DEFAULT '{}',
  departments TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_verified TIMESTAMPTZ
);

-- Teams table for each company
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id company_category NOT NULL REFERENCES companies(company_id),
  team_identifier TEXT NOT NULL, -- '1', '2', 'A', 'B', etc.
  display_name TEXT NOT NULL, -- 'Lag 1', 'Team A', etc.
  color TEXT NOT NULL DEFAULT '#FF6B6B',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, team_identifier)
);

-- User profiles with company association
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  company_id company_category DEFAULT 'ssab-oxelosund',
  selected_team TEXT DEFAULT '31',
  phone_number TEXT,
  timezone TEXT DEFAULT 'Europe/Stockholm',
  language TEXT DEFAULT 'sv',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  plan subscription_plan NOT NULL DEFAULT 'free',
  status subscription_status NOT NULL DEFAULT 'inactive',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  price_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat rooms table
CREATE TABLE chat_rooms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  company_id company_category,
  team_identifier TEXT,
  is_public BOOLEAN DEFAULT false,
  is_company_specific BOOLEAN DEFAULT false,
  is_team_specific BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  room_id UUID REFERENCES chat_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  edited_at TIMESTAMPTZ,
  reply_to UUID REFERENCES chat_messages(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  shift_reminders BOOLEAN DEFAULT true,
  reminder_hours INTEGER DEFAULT 2,
  theme TEXT DEFAULT 'light',
  calendar_sync_enabled BOOLEAN DEFAULT false,
  calendar_sync_provider TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule cache table for performance
CREATE TABLE schedule_cache (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_id company_category NOT NULL,
  team_identifier TEXT NOT NULL,
  date DATE NOT NULL,
  shift_code shift_code NOT NULL,
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, team_identifier, date)
);

-- ===============================================
-- INSERT ALL 31 COMPANIES DATA
-- ===============================================

INSERT INTO companies (company_id, name, display_name, description, industry, location, skiftschema_url, verified, total_teams, default_team, colors, departments) VALUES

-- ABB
('abb_hvc_5skift', 'abb_hvc_5skift', 'ABB HVC 5-skift', 'Industriell automation och energiteknik', 'Elektrisk industri', 'Ludvika', 'https://skiftschema.se/schema/abb_hvc_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Underhåll', 'Kvalitet']),

-- AGA Avesta 
('aga_avesta_6skift', 'aga_avesta_6skift', 'AGA Avesta 6-skift', 'Industriella gaser och specialkemikalier', 'Kemisk industri', 'Avesta', 'https://skiftschema.se/schema/aga_avesta_6skift/', true, 6, 'A', 
 '{"A": "#E74C3C", "B": "#3498DB", "C": "#2ECC71", "D": "#9B59B6", "E": "#F39C12", "F": "#1ABC9C"}', 
 ARRAY['Produktion', 'Destillation', 'Komprimering', 'Underhåll', 'Kvalitet']),

-- Arctic Paper
('arctic_paper_grycksbo_3skift', 'arctic_paper_grycksbo_3skift', 'Arctic Paper Grycksbo', 'Pappersindustri - 3-skift', 'Pappersindustri', 'Grycksbo', 'https://skiftschema.se/schema/arctic_paper_grycksbo_3skift/', true, 3, '1', 
 '{"1": "#E74C3C", "2": "#3498DB", "3": "#2ECC71"}', 
 ARRAY['Produktion', 'Underhåll', 'Kvalitet']),

-- Barilla
('barilla_sverige_filipstad', 'barilla_sverige_filipstad', 'Barilla Sverige Filipstad', 'Pasta och livsmedelsproduktion', 'Livsmedel', 'Filipstad', 'https://skiftschema.se/schema/barilla_sverige_filipstad/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Förpackning', 'Kvalitet', 'Underhåll', 'Lager']),

-- Billerud
('billerudkorsnas_gruvon_grums', 'billerudkorsnas_gruvon_grums', 'Billerud Gruvön Grums', 'Pappers- och förpackningsindustri - 3-skift', 'Pappersindustri', 'Grums', 'https://skiftschema.se/schema/billerudkorsnas_gruvon_grums/', true, 3, '1', 
 '{"1": "#E74C3C", "2": "#3498DB", "3": "#2ECC71"}', 
 ARRAY['Massa', 'Papper', 'Underhåll', 'Kvalitet']),

-- Boliden
('boliden_aitik_gruva_k3', 'boliden_aitik_gruva_k3', 'Boliden Aitik Gruva K3', 'Gruvindustri - Hållbar produktion', 'Gruvindustri', 'Gällivare', 'https://skiftschema.se/schema/boliden_aitik_gruva_k3/', true, 3, '1', 
 '{"1": "#E74C3C", "2": "#3498DB", "3": "#2ECC71"}', 
 ARRAY['Gruva', 'Anrikning', 'Underhåll', 'Miljö']),

-- Borlänge Energi
('borlange_energi', 'borlange_energi', 'Borlänge Energi 5-skift', 'Energiproduktion och fjärrvärme', 'Energi', 'Borlänge', 'https://skiftschema.se/schema/borlange_energi/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Kraftproduktion', 'Fjärrvärme', 'Underhåll']),

-- Borlänge Kommun
('borlange_kommun_polskoterska', 'borlange_kommun_polskoterska', 'Borlänge Kommun Poolsköterska', 'Kommunal hälso- och sjukvård', 'Sjukvård', 'Borlänge', 'https://skiftschema.se/schema/borlange_kommun_polskoterska/', true, 4, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4"}', 
 ARRAY['Äldreomsorg', 'Hemsjukvård', 'Rehab']),

-- Cambrex
('cambrex_karlskoga_5skift', 'cambrex_karlskoga_5skift', 'Cambrex Karlskoga 5-skift', 'Läkemedelsproduktion', 'Farmaceutisk industri', 'Karlskoga', 'https://skiftschema.se/schema/cambrex_karlskoga_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Kvalitet', 'Underhåll', 'Förpackning']),

-- Dentsply
('dentsply_molndal_5skift', 'dentsply_molndal_5skift', 'Dentsply Mölndal 5-skift', 'Dentala produkter och material', 'Medicinteknik', 'Mölndal', 'https://skiftschema.se/schema/dentsply_molndal_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Kvalitet', 'F&U', 'Underhåll']),

-- Finess
('finess_hygiene_ab_5skift', 'finess_hygiene_ab_5skift', 'Finess Hygiene AB 5-skift', 'Hygienprodukter för konsument', 'Konsumentprodukter', 'Lilla Edet', 'https://skiftschema.se/schema/finess_hygiene_ab_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Förpackning', 'Kvalitet', 'Underhåll']),

-- Kubal
('kubal_sundsvall_6skift', 'kubal_sundsvall_6skift', 'Kubal Sundsvall 6-skift', 'Aluminiumproduktion', 'Metallindustri', 'Sundsvall', 'https://skiftschema.se/schema/kubal_sundsvall_6skift/', true, 6, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502", "6": "#E74C3C"}', 
 ARRAY['Elektrolys', 'Anoder', 'Underhåll', 'Kvalitet']),

-- LKAB
('lkab_malmberget_5skift', 'lkab_malmberget_5skift', 'LKAB Malmberget 5-skift', 'Järnmalm och mineral', 'Gruvindustri', 'Malmberget', 'https://skiftschema.se/schema/lkab_malmberget_5skift/', true, 5, '1', 
 '{"1": "#FF0000", "2": "#00FF00", "3": "#0000FF", "4": "#FFFF00", "5": "#FF00FF"}', 
 ARRAY['Gruva', 'Anrikning', 'Pellets', 'Underhåll', 'Transport']),

-- Nordic Paper
('nordic_paper_backhammar_3skift', 'nordic_paper_backhammar_3skift', 'Nordic Paper Bäckhammar K3', 'Pappersindustri - 3-skift', 'Pappersindustri', 'Bäckhammar', 'https://skiftschema.se/schema/nordic_paper_backhammar_3skift/', true, 3, '1', 
 '{"1": "#228B22", "2": "#4169E1", "3": "#FF6347"}', 
 ARRAY['Pappersmaskin', 'Massa', 'Underhåll', 'Kvalitet']),

-- Orica
('orica_gyttorp_exel_5skift', 'orica_gyttorp_exel_5skift', 'Orica Gyttorp Exel 5-skift', 'Sprängämnen för gruvindustri', 'Kemisk industri', 'Gyttorp', 'https://skiftschema.se/schema/orica_gyttorp_exel_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Förpackning', 'Kvalitet', 'Säkerhet', 'Underhåll']),

-- Outokumpu
('outokumpu_avesta_5skift', 'outokumpu_avesta_5skift', 'Outokumpu Avesta 5-skift', 'Rostfritt stål och speciallegeringar', 'Stålindustri', 'Avesta', 'https://skiftschema.se/schema/outokumpu_avesta_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Stålverk', 'Varmvalsning', 'Kallvalsning', 'Underhåll']),

-- Ovako
('ovako_hofors_rorverk_4_5skift', 'ovako_hofors_rorverk_4_5skift', 'Ovako Hofors Rörverk 4/5 Skift', 'Specialstål och stålrör', 'Stålindustri', 'Hofors', 'https://skiftschema.se/schema/ovako_hofors_rorverk_4_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Rörproduktion', 'Varmbehandling', 'Kvalitet', 'Underhåll']),

-- Preem
('preemraff_lysekil_5skift', 'preemraff_lysekil_5skift', 'Preemraff Lysekil 5-skift', 'Oljeraffinaderi', 'Petroindustri', 'Lysekil', 'https://skiftschema.se/schema/preemraff_lysekil_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Raffinering', 'Destillation', 'Krakning', 'Underhåll']),

-- Ryssviken
('ryssviken_boendet', 'ryssviken_boendet', 'Ryssviken Boendet', 'Särskilt boende', 'Vård och omsorg', 'Sandviken', 'https://skiftschema.se/schema/ryssviken_boendet/', true, 4, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4"}', 
 ARRAY['Omvårdnad', 'Medicin', 'Rehab']),

-- Sandvik
('sandvik_mt_2skift', 'sandvik_mt_2skift', 'Sandvik Materials Technology 2-skift', 'Verktyg, maskiner och material', 'Verktygsindustri', 'Sandviken', 'https://skiftschema.se/schema/sandvik_mt_2skift/', true, 2, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4"}', 
 ARRAY['Produktion', 'Bearbetning', 'Kvalitet', 'F&U']),

-- Scania
('scania_cv_ab_transmission_5skift', 'scania_cv_ab_transmission_5skift', 'Scania CV AB Transmission 5-skift', 'Lastbilar och bussar - Transmission', 'Fordonsindustri', 'Södertälje', 'https://skiftschema.se/schema/scania_cv_ab_transmission_5skift/', true, 5, '1', 
 '{"1": "#FF4444", "2": "#44FF44", "3": "#4444FF", "4": "#FFFF44", "5": "#FF44FF"}', 
 ARRAY['Transmission', 'Montering', 'Kvalitet', 'Underhåll']),

-- Schneider
('schneider_electric_5skift', 'schneider_electric_5skift', 'Schneider Electric 5-skift', 'Industriell automation', 'Elektrisk industri', 'Stenkullen', 'https://skiftschema.se/schema/schneider_electric_5skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Produktion', 'Montering', 'Test', 'Kvalitet']),

-- Seco
('seco_tools_fagersta_2skift', 'seco_tools_fagersta_2skift', 'Seco Tools Fagersta 2-skift', 'Skärverktyg för metallindustri', 'Verktygsindustri', 'Fagersta', 'https://skiftschema.se/schema/seco_tools_fagersta_2skift/', true, 2, '1', 
 '{"1": "#0066CC", "2": "#FF6600"}', 
 ARRAY['Produktion', 'Slipning', 'Beläggning', 'Kvalitet']),

-- Skärnäs
('skarnas_hamn_5_skift', 'skarnas_hamn_5_skift', 'Skärnäs Hamn 5-skift', 'Hamn- och logistikverksamhet', 'Transport och logistik', 'Skärnäs', 'https://skiftschema.se/schema/skarnas_hamn_5_skift/', true, 5, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4", "3": "#45B7D1", "4": "#96CEB4", "5": "#FFA502"}', 
 ARRAY['Lastning', 'Lossning', 'Logistik', 'Underhåll']),

-- SKF
('skf_ab_5skift2', 'skf_ab_5skift2', 'SKF AB 5-skift 2', 'Kullager och tätningar', 'Maskintillverkning', 'Göteborg', 'https://skiftschema.se/schema/skf_ab_5skift2/', true, 5, '1', 
 '{"1": "#0066CC", "2": "#FF6600", "3": "#00CC66", "4": "#CC0066", "5": "#CCCC00"}', 
 ARRAY['Produktion', 'Bearbetning', 'Montering', 'Kvalitet', 'Underhåll']),

-- Södra Cell
('sodra_cell_monsteras_3skift', 'sodra_cell_monsteras_3skift', 'Södra Cell Mönsterås 3-skift', 'Skogsindustri och pappersprodukter', 'Skogsindustri', 'Mönsterås', 'https://skiftschema.se/schema/sodra_cell_monsteras_3skift/', true, 3, '1', 
 '{"1": "#228B22", "2": "#4169E1", "3": "#FF6347"}', 
 ARRAY['Massa', 'Papper', 'Underhåll', 'Kvalitet', 'Logistik']),

-- SSAB Borlänge
('ssab_4_7skift', 'ssab_4_7skift', 'SSAB Borlänge 4,7-skift', 'Stålproduktion och stålprodukter', 'Stålindustri', 'Borlänge', 'https://skiftschema.se/schema/ssab_4_7skift/', true, 5, 'A', 
 '{"A": "#E74C3C", "B": "#3498DB", "C": "#2ECC71", "D": "#F39C12", "E": "#9B59B6"}', 
 ARRAY['Masugn', 'Stålverk', 'Varmvalsning', 'Kallvalsning', 'Underhåll']),

-- SSAB Oxelösund (existing proven system)
('ssab-oxelosund', 'ssab-oxelosund', 'SSAB Oxelösund', 'Stålproduktion och stålprodukter - Oxelösund', 'Stålindustri', 'Oxelösund', 'https://skiftschema.se/schema/ssab-oxelosund/', true, 5, '31', 
 '{"31": "#FF6B6B", "32": "#4ECDC4", "33": "#45B7D1", "34": "#96CEB4", "35": "#FFEAA7"}', 
 ARRAY['Masugn', 'Stålverk', 'Varmvalsning', 'Kallvalsning', 'Underhåll']),

-- Stora Enso
('stora_enso_fors_5skift', 'stora_enso_fors_5skift', 'Stora Enso Fors 5-skift', 'Skog och papper', 'Skogsindustri', 'Fors', 'https://skiftschema.se/schema/stora_enso_fors_5skift/', true, 5, '1', 
 '{"1": "#228B22", "2": "#4169E1", "3": "#FF6347", "4": "#FFD700", "5": "#32CD32"}', 
 ARRAY['Massa', 'Papper', 'Kartong', 'Underhåll', 'Miljö']),

-- Truck Service
('truck_service_2skift', 'truck_service_2skift', 'Truck Service AB 2-skift', 'Lastbilsunderhåll och service', 'Transport och service', 'Sverige', 'https://skiftschema.se/schema/truck_service_2skift/', true, 2, '1', 
 '{"1": "#FF6B6B", "2": "#4ECDC4"}', 
 ARRAY['Service', 'Reservdelar', 'Diagnos']),

-- Uddeholm
('uddeholm_tooling_2skift', 'uddeholm_tooling_2skift', 'Uddeholm Tooling 2-skift', 'Verktygsstål - 2-skift roterande', 'Verktygsindustri', 'Hagfors', 'https://skiftschema.se/schema/uddeholm_tooling_2skift/', true, 2, '1', 
 '{"1": "#E74C3C", "2": "#3498DB"}', 
 ARRAY['Stålproduktion', 'Värmebehandling', 'Kvalitet']),

-- Voestalpine
('voestalpine_precision_strip_2skift', 'voestalpine_precision_strip_2skift', 'Voestalpine Precision Strip 2-skift', 'Stålproduktion - 2-skift', 'Stålindustri', 'Motala', 'https://skiftschema.se/schema/voestalpine_precision_strip_2skift/', true, 2, '1', 
 '{"1": "#E74C3C", "2": "#3498DB"}', 
 ARRAY['Valsning', 'Beläggning', 'Kvalitet']);

-- ===============================================
-- CREATE TEAMS FOR ALL COMPANIES
-- ===============================================

-- Function to generate teams for a company
CREATE OR REPLACE FUNCTION generate_teams_for_company(p_company_id company_category, p_team_identifiers TEXT[], p_base_color TEXT DEFAULT '#FF6B6B')
RETURNS VOID AS $$
DECLARE
    team_id TEXT;
    team_name TEXT;
    team_color TEXT;
    color_variants TEXT[] := ARRAY['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFA502', '#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6'];
    color_idx INTEGER := 1;
BEGIN
    FOREACH team_id IN ARRAY p_team_identifiers LOOP
        -- Generate team display name
        IF team_id ~ '^[0-9]+$' THEN
            team_name := 'Lag ' || team_id;
        ELSE
            team_name := team_id || '-lag';
        END IF;
        
        -- Assign color
        team_color := color_variants[((color_idx - 1) % array_length(color_variants, 1)) + 1];
        color_idx := color_idx + 1;
        
        INSERT INTO teams (company_id, team_identifier, display_name, color)
        VALUES (p_company_id, team_id, team_name, team_color)
        ON CONFLICT (company_id, team_identifier) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            color = EXCLUDED.color;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate teams for all companies
SELECT generate_teams_for_company('abb_hvc_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('aga_avesta_6skift', ARRAY['A','B','C','D','E','F']);
SELECT generate_teams_for_company('arctic_paper_grycksbo_3skift', ARRAY['1','2','3']);
SELECT generate_teams_for_company('barilla_sverige_filipstad', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('billerudkorsnas_gruvon_grums', ARRAY['1','2','3']);
SELECT generate_teams_for_company('boliden_aitik_gruva_k3', ARRAY['1','2','3']);
SELECT generate_teams_for_company('borlange_energi', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('borlange_kommun_polskoterska', ARRAY['1','2','3','4']);
SELECT generate_teams_for_company('cambrex_karlskoga_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('dentsply_molndal_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('finess_hygiene_ab_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('kubal_sundsvall_6skift', ARRAY['1','2','3','4','5','6']);
SELECT generate_teams_for_company('lkab_malmberget_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('nordic_paper_backhammar_3skift', ARRAY['1','2','3']);
SELECT generate_teams_for_company('orica_gyttorp_exel_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('outokumpu_avesta_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('ovako_hofors_rorverk_4_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('preemraff_lysekil_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('ryssviken_boendet', ARRAY['1','2','3','4']);
SELECT generate_teams_for_company('sandvik_mt_2skift', ARRAY['1','2']);
SELECT generate_teams_for_company('scania_cv_ab_transmission_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('schneider_electric_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('seco_tools_fagersta_2skift', ARRAY['1','2']);
SELECT generate_teams_for_company('skarnas_hamn_5_skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('skf_ab_5skift2', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('sodra_cell_monsteras_3skift', ARRAY['1','2','3']);
SELECT generate_teams_for_company('ssab_4_7skift', ARRAY['A','B','C','D','E']);
SELECT generate_teams_for_company('ssab-oxelosund', ARRAY['31','32','33','34','35']);
SELECT generate_teams_for_company('stora_enso_fors_5skift', ARRAY['1','2','3','4','5']);
SELECT generate_teams_for_company('truck_service_2skift', ARRAY['1','2']);
SELECT generate_teams_for_company('uddeholm_tooling_2skift', ARRAY['1','2']);
SELECT generate_teams_for_company('voestalpine_precision_strip_2skift', ARRAY['1','2']);

-- ===============================================
-- CREATE DEFAULT CHAT ROOMS
-- ===============================================

INSERT INTO chat_rooms (name, description, is_public, is_company_specific, is_team_specific) VALUES
('Allmän diskussion', 'Öppen diskussion för alla användare', true, false, false),
('Skiftarbetare Sverige', 'För alla som arbetar skift i Sverige', true, false, false),
('Hjälp och support', 'Teknisk hjälp och support', true, false, false);

-- ===============================================
-- ENABLE ROW LEVEL SECURITY
-- ===============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_cache ENABLE ROW LEVEL SECURITY;

-- ===============================================
-- CREATE RLS POLICIES
-- ===============================================

-- Companies policies (public read)
CREATE POLICY "Companies are viewable by everyone" ON companies
  FOR SELECT USING (true);

-- Teams policies (public read)  
CREATE POLICY "Teams are viewable by everyone" ON teams
  FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscription" ON subscriptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat rooms policies
CREATE POLICY "Users can view public rooms" ON chat_rooms
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view company rooms if same company" ON chat_rooms
  FOR SELECT USING (
    is_company_specific = true AND 
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view team rooms if same team" ON chat_rooms
  FOR SELECT USING (
    is_team_specific = true AND 
    company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND
    team_identifier = (SELECT selected_team FROM profiles WHERE id = auth.uid())
  );

-- Chat messages policies
CREATE POLICY "Users can view messages in accessible rooms" ON chat_messages
  FOR SELECT USING (
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE is_public = true 
      OR (is_company_specific = true AND company_id = (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      ))
      OR (is_team_specific = true AND 
          company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND
          team_identifier = (SELECT selected_team FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can insert messages in accessible rooms" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    room_id IN (
      SELECT id FROM chat_rooms 
      WHERE is_public = true 
      OR (is_company_specific = true AND company_id = (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      ))
      OR (is_team_specific = true AND 
          company_id = (SELECT company_id FROM profiles WHERE id = auth.uid()) AND
          team_identifier = (SELECT selected_team FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Users can update own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = user_id);

-- User preferences policies
CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Schedule cache policies (public read for performance)
CREATE POLICY "Schedule cache is viewable by everyone" ON schedule_cache
  FOR SELECT USING (true);

-- ===============================================
-- CREATE FUNCTIONS AND TRIGGERS
-- ===============================================

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Create default preferences
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  -- Create free subscription
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chat_rooms_updated_at
  BEFORE UPDATE ON chat_rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===============================================
-- CREATE PERFORMANCE INDEXES
-- ===============================================

CREATE INDEX idx_companies_verified ON companies(verified);
CREATE INDEX idx_companies_industry ON companies(industry);
CREATE INDEX idx_teams_company_id ON teams(company_id);
CREATE INDEX idx_profiles_company_id ON profiles(company_id);
CREATE INDEX idx_profiles_selected_team ON profiles(selected_team);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_rooms_company_id ON chat_rooms(company_id);
CREATE INDEX idx_schedule_cache_company_team_date ON schedule_cache(company_id, team_identifier, date);

-- ===============================================
-- ENABLE REAL-TIME SUBSCRIPTIONS
-- ===============================================

ALTER PUBLICATION supabase_realtime ADD TABLE companies;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;

-- ===============================================
-- VERIFICATION QUERY
-- ===============================================

-- Run this to verify the setup:
-- SELECT 
--   c.display_name,
--   c.industry,
--   c.location,
--   c.total_teams,
--   COUNT(t.id) as actual_teams,
--   c.verified
-- FROM companies c
-- LEFT JOIN teams t ON c.company_id = t.company_id
-- GROUP BY c.company_id, c.display_name, c.industry, c.location, c.total_teams, c.verified
-- ORDER BY c.display_name;