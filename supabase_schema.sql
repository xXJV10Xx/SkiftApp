-- =============================================
-- SKIFTAPPEN - KOMPLETT SUPABASE DATABAS-SCHEMA
-- =============================================

-- Aktivera RLS (Row Level Security)
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- =============================================
-- 1. SHIFT_TEAMS TABELL
-- =============================================
CREATE TABLE IF NOT EXISTS public.shift_teams (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    color_hex TEXT NOT NULL DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS för shift_teams
ALTER TABLE public.shift_teams ENABLE ROW LEVEL SECURITY;

-- Policy: Alla autentiserade användare kan läsa lag
CREATE POLICY "shift_teams_select_policy" ON public.shift_teams
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Endast administratörer kan skapa/uppdatera lag (för nu tillåter vi alla)
CREATE POLICY "shift_teams_insert_policy" ON public.shift_teams
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "shift_teams_update_policy" ON public.shift_teams
    FOR UPDATE TO authenticated
    USING (true);

-- =============================================
-- 2. PROFILES TABELL (UTÖKAD)
-- =============================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    fcm_token TEXT,
    company TEXT,
    department_location TEXT,
    shift_team_id UUID REFERENCES public.shift_teams(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS för profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Användare kan läsa alla profiler
CREATE POLICY "profiles_select_policy" ON public.profiles
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Användare kan endast uppdatera sin egen profil
CREATE POLICY "profiles_update_policy" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id);

-- Policy: Användare kan skapa sin egen profil
CREATE POLICY "profiles_insert_policy" ON public.profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- =============================================
-- 3. SHIFTS TABELL (UPPDATERAD)
-- =============================================
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    shift_team_id UUID REFERENCES public.shift_teams(id) ON DELETE CASCADE NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    shift_type TEXT DEFAULT 'regular' CHECK (shift_type IN ('morning', 'afternoon', 'night', 'regular')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS för shifts
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Policy: Alla autentiserade användare kan läsa scheman
CREATE POLICY "shifts_select_policy" ON public.shifts
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Endast lagmedlemmar kan skapa/uppdatera sina lag-scheman
CREATE POLICY "shifts_insert_policy" ON public.shifts
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.shift_team_id = shifts.shift_team_id
        )
    );

CREATE POLICY "shifts_update_policy" ON public.shifts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.shift_team_id = shifts.shift_team_id
        )
    );

-- =============================================
-- 4. SHIFT_TRADE_REQUESTS TABELL
-- =============================================
CREATE TABLE IF NOT EXISTS public.shift_trade_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    requester_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    shift_id UUID REFERENCES public.shifts(id) ON DELETE CASCADE NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'cancelled', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS för shift_trade_requests
ALTER TABLE public.shift_trade_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Alla autentiserade användare kan läsa bytesförfrågningar
CREATE POLICY "trade_requests_select_policy" ON public.shift_trade_requests
    FOR SELECT TO authenticated
    USING (true);

-- Policy: Användare kan skapa egna bytesförfrågningar
CREATE POLICY "trade_requests_insert_policy" ON public.shift_trade_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = requester_id);

-- Policy: Användare kan uppdatera sina egna förfrågningar
CREATE POLICY "trade_requests_update_policy" ON public.shift_trade_requests
    FOR UPDATE TO authenticated
    USING (auth.uid() = requester_id);

-- =============================================
-- 5. PRIVATE_CHATS TABELL
-- =============================================
CREATE TABLE IF NOT EXISTS public.private_chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trade_request_id UUID REFERENCES public.shift_trade_requests(id) ON DELETE CASCADE NOT NULL,
    participant_1_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    participant_2_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Säkerställ att deltagarna är olika
    CONSTRAINT different_participants CHECK (participant_1_id != participant_2_id)
);

-- RLS för private_chats
ALTER TABLE public.private_chats ENABLE ROW LEVEL SECURITY;

-- Policy: Endast deltagare kan läsa chatten
CREATE POLICY "private_chats_select_policy" ON public.private_chats
    FOR SELECT TO authenticated
    USING (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- Policy: Endast deltagare kan skapa chatt
CREATE POLICY "private_chats_insert_policy" ON public.private_chats
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = participant_1_id OR auth.uid() = participant_2_id);

-- =============================================
-- 6. MESSAGES TABELL
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES public.private_chats(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'trade_proposal', 'trade_accepted', 'trade_declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS för messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Endast chattdeltagare kan läsa meddelanden
CREATE POLICY "messages_select_policy" ON public.messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.private_chats
            WHERE private_chats.id = messages.chat_id
            AND (private_chats.participant_1_id = auth.uid() OR private_chats.participant_2_id = auth.uid())
        )
    );

-- Policy: Endast chattdeltagare kan skicka meddelanden
CREATE POLICY "messages_insert_policy" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM public.private_chats
            WHERE private_chats.id = messages.chat_id
            AND (private_chats.participant_1_id = auth.uid() OR private_chats.participant_2_id = auth.uid())
        )
    );

-- =============================================
-- 7. RPC FUNKTIONER
-- =============================================

-- Funktion för att hämta kalender-shifts med filter
CREATE OR REPLACE FUNCTION get_calendar_shifts(filter_type TEXT DEFAULT 'all', user_team_id UUID DEFAULT NULL)
RETURNS TABLE (
    shift_id UUID,
    shift_team_id UUID,
    team_name TEXT,
    team_color TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    title TEXT,
    description TEXT,
    shift_type TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Kontrollera att användaren är autentiserad
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Om filter_type är 'my_team', hämta användarens lag-ID
    IF filter_type = 'my_team' AND user_team_id IS NULL THEN
        SELECT profiles.shift_team_id INTO user_team_id
        FROM public.profiles
        WHERE profiles.id = auth.uid();
    END IF;

    -- Returnera shifts baserat på filter
    RETURN QUERY
    SELECT 
        s.id as shift_id,
        s.shift_team_id,
        st.name as team_name,
        st.color_hex as team_color,
        s.start_time,
        s.end_time,
        s.title,
        s.description,
        s.shift_type
    FROM public.shifts s
    JOIN public.shift_teams st ON s.shift_team_id = st.id
    WHERE 
        CASE 
            WHEN filter_type = 'my_team' THEN s.shift_team_id = user_team_id
            WHEN filter_type = 'all' THEN true
            ELSE s.shift_team_id::TEXT = filter_type
        END
    ORDER BY s.start_time ASC;
END;
$$;

-- Funktion för att kontrollera om användarprofil är komplett
CREATE OR REPLACE FUNCTION is_profile_complete(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    profile_complete BOOLEAN := false;
BEGIN
    SELECT 
        (company IS NOT NULL AND company != '' AND
         department_location IS NOT NULL AND department_location != '' AND
         shift_team_id IS NOT NULL)
    INTO profile_complete
    FROM public.profiles
    WHERE id = user_id;
    
    RETURN COALESCE(profile_complete, false);
END;
$$;

-- =============================================
-- 8. TRIGGERS FÖR UPDATED_AT
-- =============================================

-- Trigger-funktion för updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Lägg till triggers
CREATE TRIGGER update_shift_teams_updated_at BEFORE UPDATE ON public.shift_teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trade_requests_updated_at BEFORE UPDATE ON public.shift_trade_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_private_chats_updated_at BEFORE UPDATE ON public.private_chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 9. INITIAL DATA - EXEMPEL LAG
-- =============================================

-- Lägg till exempel-lag
INSERT INTO public.shift_teams (name, color_hex) VALUES
    ('Lag A', '#3B82F6'),
    ('Lag B', '#EF4444'),
    ('Lag C', '#10B981'),
    ('Lag D', '#F59E0B'),
    ('Nattskift', '#8B5CF6')
ON CONFLICT DO NOTHING;

-- =============================================
-- 10. REALTIME SUBSCRIPTIONS
-- =============================================

-- Aktivera realtime för relevanta tabeller
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shift_trade_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shifts;

-- =============================================
-- SCHEMA KLART!
-- =============================================
-- Detta schema kan kopieras direkt till Supabase SQL Editor
-- Kom ihåg att uppdatera JWT-secret med din riktiga secret