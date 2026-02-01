-- ===================================================================
-- EDUNET19 - ADVANCED MATCHING SYSTEM DATABASE SCHEMA
-- Schema completo per algoritmo AI-powered
-- ===================================================================

-- ===========================
-- 1. TABELLA PROFILI MATCH
-- ===========================
CREATE TABLE IF NOT EXISTS match_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('institute', 'student')),
  
  -- Dati Base
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  city TEXT GENERATED ALWAYS AS (split_part(location, ',', 1)) STORED,
  region TEXT GENERATED ALWAYS AS (trim(split_part(location, ',', 2))) STORED,
  image_url TEXT,
  
  -- Dati Istituto
  institute_type TEXT,
  methodologies TEXT[], -- Array di metodologie usate
  
  -- Dati Studente
  age INTEGER,
  current_school TEXT,
  
  -- Interessi e Tag
  tags TEXT[] DEFAULT '{}', -- Tag fissi
  interests TEXT[] DEFAULT '{}', -- Interessi dichiarati
  keywords TEXT[] DEFAULT '{}', -- Keywords estratte automaticamente
  themes TEXT[] DEFAULT '{}', -- Temi principali (auto-generati)
  
  -- Statistiche
  projects_count INTEGER DEFAULT 0,
  collaborations_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  avg_engagement DECIMAL DEFAULT 0,
  
  -- Pattern Comportamentali (JSON per flessibilità)
  engagement_pattern JSONB DEFAULT '{}'::jsonb,
  -- Esempio: {"daily_avg": 5.2, "peak_hours": 14, "preferred_days": 2}
  
  interaction_style JSONB DEFAULT '{}'::jsonb,
  -- Esempio: {"like": 60, "comment": 25, "share": 15}
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================
-- 2. TRACCIAMENTO ATTIVITÀ
-- ===========================

-- 2.1 Interazioni (like, comment, share, save)
CREATE TABLE IF NOT EXISTS user_interactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('post', 'project', 'profile', 'methodology')),
  target_id UUID NOT NULL,
  interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'comment', 'share', 'save', 'view')),
  
  -- Metadata dell'interazione
  duration_seconds INTEGER, -- Per view: quanto tempo visualizzato
  content_consumed_percentage DECIMAL, -- % contenuto letto/visto
  
  -- Context
  context JSONB DEFAULT '{}'::jsonb, -- Tags, categoria del contenuto target
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indice per performance
CREATE INDEX idx_user_interactions_user ON user_interactions(user_id, created_at DESC);
CREATE INDEX idx_user_interactions_target ON user_interactions(target_id, interaction_type);

-- 2.2 Storico Ricerche
CREATE TABLE IF NOT EXISTS search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  
  -- Risultati cliccati
  clicked_results UUID[], -- Array di ID risultati cliccati
  result_types TEXT[], -- Tipi di risultati cliccati
  
  -- Context della ricerca
  filters_applied JSONB DEFAULT '{}'::jsonb,
  search_context TEXT, -- 'homepage', 'projects', 'institutes', etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_search_history_user ON search_history(user_id, created_at DESC);
CREATE INDEX idx_search_history_query ON search_history USING gin(to_tsvector('italian', query));

-- 2.3 Visualizzazioni Profili
CREATE TABLE IF NOT EXISTS profile_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  viewer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  viewed_profile_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  
  -- Analytics view
  view_duration_seconds INTEGER,
  sections_viewed TEXT[], -- Quali sezioni del profilo ha visto
  clicked_projects UUID[], -- Progetti del profilo che ha cliccato
  
  -- Source
  source TEXT, -- 'search', 'recommendation', 'edumatch', 'network'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Previeni duplicati nella stessa sessione (5 min)
  UNIQUE(viewer_id, viewed_profile_id, created_at)
);

CREATE INDEX idx_profile_views_viewer ON profile_views(viewer_id, created_at DESC);
CREATE INDEX idx_profile_views_viewed ON profile_views(viewed_profile_id, created_at DESC);

-- ===========================
-- 3. SISTEMA MATCH
-- ===========================

-- 3.1 Azioni Swipe
CREATE TABLE IF NOT EXISTS match_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass', 'super_like')),
  
  -- Salva predizione per learning
  predicted_score INTEGER, -- Score predetto dall'algoritmo
  prediction_breakdown JSONB, -- Dettaglio dimensioni
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate actions
  UNIQUE(actor_id, target_profile_id)
);

CREATE INDEX idx_match_actions_actor ON match_actions(actor_id, created_at DESC);
CREATE INDEX idx_match_actions_target ON match_actions(target_profile_id);

-- 3.2 Match Confermati
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_1_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  profile_2_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  
  -- Tipo match
  is_super_match BOOLEAN DEFAULT false,
  match_score INTEGER, -- Score al momento del match
  
  -- Conversazione
  conversation_started BOOLEAN DEFAULT false,
  first_message_at TIMESTAMP WITH TIME ZONE,
  last_message_at TIMESTAMP WITH TIME ZONE,
  messages_count INTEGER DEFAULT 0,
  
  -- Outcome
  collaboration_created BOOLEAN DEFAULT false,
  collaboration_id UUID, -- Link a eventuale collaborazione nata
  
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate matches
  CONSTRAINT unique_match CHECK (profile_1_id < profile_2_id),
  UNIQUE(profile_1_id, profile_2_id)
);

CREATE INDEX idx_matches_profile1 ON matches(profile_1_id, matched_at DESC);
CREATE INDEX idx_matches_profile2 ON matches(profile_2_id, matched_at DESC);

-- ===========================
-- 4. ALGORITMO LEARNING
-- ===========================

-- 4.1 Pesi Personalizzati per Utente
CREATE TABLE IF NOT EXISTS match_weights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Pesi dimensioni (devono sommare a 100)
  content_similarity DECIMAL DEFAULT 30.0,
  behavior_alignment DECIMAL DEFAULT 25.0,
  interest_match DECIMAL DEFAULT 20.0,
  geographic_proximity DECIMAL DEFAULT 10.0,
  network_overlap DECIMAL DEFAULT 10.0,
  search_intent DECIMAL DEFAULT 5.0,
  
  -- Learning metadata
  training_samples INTEGER DEFAULT 0, -- Quante interazioni usate per training
  last_trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  model_version TEXT DEFAULT '1.0',
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- 4.2 Feedback Loop
CREATE TABLE IF NOT EXISTS match_feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  
  -- Predizione originale
  predicted_match BOOLEAN, -- True se algoritmo prediceva match
  predicted_score INTEGER,
  
  -- Realtà
  user_action TEXT, -- 'like', 'pass', 'super_like'
  actual_match BOOLEAN, -- True se c'è stato match reale
  
  -- Errore
  prediction_error DECIMAL, -- Differenza tra predetto e reale
  
  -- Usato per training
  used_for_training BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_match_feedback_user ON match_feedback(user_id);

-- ===========================
-- 5. CONTENUTI E PROGETTI
-- ===========================

-- 5.1 Estensione tabella post per analytics
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'posts') THEN
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS extracted_themes TEXT[];
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS extracted_keywords TEXT[];
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS content_category TEXT;
    ALTER TABLE posts ADD COLUMN IF NOT EXISTS reading_time_minutes INTEGER;
  END IF;
END $$;

-- 5.2 Estensione progetti
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'projects') THEN
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_themes TEXT[];
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_keywords TEXT[];
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS methodology_used TEXT[];
    ALTER TABLE projects ADD COLUMN IF NOT EXISTS target_audience TEXT[];
  END IF;
END $$;

-- ===========================
-- 6. FUNZIONI TRIGGER
-- ===========================

-- 6.1 Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_match_profiles_updated_at
    BEFORE UPDATE ON match_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_weights_updated_at
    BEFORE UPDATE ON match_weights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6.2 Auto-update engagement pattern
CREATE OR REPLACE FUNCTION update_engagement_pattern()
RETURNS TRIGGER AS $$
BEGIN
    -- Aggiorna pattern quando nuova interazione
    UPDATE match_profiles
    SET 
        engagement_pattern = (
            SELECT jsonb_build_object(
                'daily_avg', COUNT(*)::decimal / GREATEST(1, EXTRACT(day FROM (NOW() - MIN(created_at)))),
                'peak_hours', MODE() WITHIN GROUP (ORDER BY EXTRACT(hour FROM created_at)),
                'total_interactions', COUNT(*)
            )
            FROM user_interactions
            WHERE user_id = NEW.user_id
            AND created_at > NOW() - INTERVAL '30 days'
        ),
        last_activity_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_engagement_pattern
    AFTER INSERT ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_engagement_pattern();

-- 6.3 Auto-update interaction style
CREATE OR REPLACE FUNCTION update_interaction_style()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE match_profiles
    SET interaction_style = (
        SELECT jsonb_object_agg(interaction_type, count)
        FROM (
            SELECT 
                interaction_type,
                COUNT(*)::integer as count
            FROM user_interactions
            WHERE user_id = NEW.user_id
            AND created_at > NOW() - INTERVAL '30 days'
            GROUP BY interaction_type
        ) sub
    )
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_interaction_style
    AFTER INSERT ON user_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_interaction_style();

-- ===========================
-- 7. ROW LEVEL SECURITY
-- ===========================

-- Enable RLS
ALTER TABLE match_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_feedback ENABLE ROW LEVEL SECURITY;

-- Policies per match_profiles (ottimizzate per performance)
CREATE POLICY "Profili attivi visibili a tutti autenticati"
  ON match_profiles FOR SELECT
  USING ((select auth.role()) = 'authenticated' AND is_active = true);

CREATE POLICY "Utenti possono creare proprio profilo"
  ON match_profiles FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Utenti possono aggiornare proprio profilo"
  ON match_profiles FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Policies per user_interactions (ottimizzate)
CREATE POLICY "Utenti vedono proprie interazioni"
  ON user_interactions FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Utenti creano proprie interazioni"
  ON user_interactions FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies per search_history (ottimizzate)
CREATE POLICY "Utenti vedono proprie ricerche"
  ON search_history FOR SELECT
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Utenti creano proprie ricerche"
  ON search_history FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- Policies per profile_views (ottimizzate)
CREATE POLICY "Utenti vedono chi hanno visualizzato o chi li ha visualizzati"
  ON profile_views FOR SELECT
  USING (
    (select auth.uid()) = viewer_id OR
    EXISTS (
      SELECT 1 FROM match_profiles 
      WHERE id = viewed_profile_id 
      AND user_id = (select auth.uid())
    )
  );

CREATE POLICY "Utenti possono registrare view"
  ON profile_views FOR INSERT
  WITH CHECK ((select auth.uid()) = viewer_id);

-- Policies per match_actions (ottimizzate)
CREATE POLICY "Utenti vedono proprie azioni match"
  ON match_actions FOR SELECT
  USING ((select auth.uid()) = actor_id);

CREATE POLICY "Utenti creano proprie azioni"
  ON match_actions FOR INSERT
  WITH CHECK ((select auth.uid()) = actor_id);

-- Policies per matches (ottimizzate)
CREATE POLICY "Utenti vedono propri match"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_profiles 
      WHERE (id = profile_1_id OR id = profile_2_id) 
      AND user_id = (select auth.uid())
    )
  );

-- Policies per match_weights (ottimizzate)
CREATE POLICY "Utenti gestiscono propri pesi"
  ON match_weights FOR ALL
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ===========================
-- 8. FUNZIONI UTILITY
-- ===========================

-- 8.1 Ottieni profili raccomandati
CREATE OR REPLACE FUNCTION get_recommended_profiles(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  profile_id UUID,
  profile_name TEXT,
  affinity_score INTEGER,
  reasons TEXT[]
) AS $$
BEGIN
  -- Questa è una versione semplificata
  -- L'algoritmo completo è in JavaScript (edumatch-ai-algorithm.js)
  
  RETURN QUERY
  SELECT 
    mp.id,
    mp.name,
    50 as affinity_score, -- Placeholder, calcolato da AI
    ARRAY['Profilo interessante']::TEXT[] as reasons
  FROM match_profiles mp
  WHERE mp.is_active = true
  AND mp.user_id != p_user_id
  AND NOT EXISTS (
    SELECT 1 FROM match_actions ma
    WHERE ma.actor_id = p_user_id
    AND ma.target_profile_id = mp.id
  )
  ORDER BY mp.last_activity_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8.2 Salva predizione per learning
CREATE OR REPLACE FUNCTION save_match_prediction(
  p_user_id UUID,
  p_target_profile_id UUID,
  p_score INTEGER,
  p_breakdown JSONB
)
RETURNS UUID AS $$
DECLARE
  v_action_id UUID;
BEGIN
  INSERT INTO match_actions (
    actor_id,
    target_profile_id,
    action_type,
    predicted_score,
    prediction_breakdown
  ) VALUES (
    p_user_id,
    p_target_profile_id,
    'like', -- Placeholder, verrà aggiornato
    p_score,
    p_breakdown
  )
  RETURNING id INTO v_action_id;
  
  RETURN v_action_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================
-- 9. INDICI PERFORMANCE
-- ===========================

-- GIN index per array searches
CREATE INDEX idx_match_profiles_tags ON match_profiles USING gin(tags);
CREATE INDEX idx_match_profiles_interests ON match_profiles USING gin(interests);
CREATE INDEX idx_match_profiles_keywords ON match_profiles USING gin(keywords);
CREATE INDEX idx_match_profiles_themes ON match_profiles USING gin(themes);

-- Composite indexes
CREATE INDEX idx_match_profiles_type_active ON match_profiles(profile_type, is_active, last_activity_at DESC);
CREATE INDEX idx_user_interactions_user_type ON user_interactions(user_id, interaction_type, created_at DESC);

-- ===========================
-- 10. INIZIALIZZAZIONE DATI
-- ===========================

-- Crea pesi default per nuovi utenti
CREATE OR REPLACE FUNCTION init_user_match_weights()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO match_weights (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER init_match_weights_on_user_create
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION init_user_match_weights();

-- ===========================
-- FINE SCHEMA
-- ===================================================================

-- Note di implementazione:
-- 1. Eseguire questo script su Supabase SQL Editor
-- 2. Verificare che tutte le tabelle siano create
-- 3. Testare policies con utenti test
-- 4. Popolare con dati di esempio
-- 5. Integrare con edumatch-ai-algorithm.js
