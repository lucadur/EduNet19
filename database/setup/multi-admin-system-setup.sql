-- ===================================================================
-- SISTEMA MULTI-ADMIN PER ISTITUTI
-- Permette fino a 3 amministratori per ogni istituto
-- ===================================================================

-- 1. Tabella per gestire gli amministratori degli istituti
CREATE TABLE IF NOT EXISTS institute_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES school_institutes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('owner', 'admin', 'editor')),
  permissions JSONB DEFAULT '{"can_edit_profile": true, "can_create_posts": true, "can_delete_posts": true, "can_manage_admins": false}'::jsonb,
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended', 'removed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: un utente può essere admin di un solo istituto
  UNIQUE(user_id),
  
  -- Constraint: combinazione istituto-utente unica
  UNIQUE(institute_id, user_id)
);

-- 2. Indici per performance
CREATE INDEX IF NOT EXISTS idx_institute_admins_institute ON institute_admins(institute_id);
CREATE INDEX IF NOT EXISTS idx_institute_admins_user ON institute_admins(user_id);
CREATE INDEX IF NOT EXISTS idx_institute_admins_status ON institute_admins(status);

-- 3. Tabella per inviti admin in sospeso
CREATE TABLE IF NOT EXISTS institute_admin_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  institute_id UUID NOT NULL REFERENCES school_institutes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted BOOLEAN DEFAULT FALSE,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: email unica per istituto (non può essere invitata due volte)
  UNIQUE(institute_id, email)
);

CREATE INDEX IF NOT EXISTS idx_admin_invites_token ON institute_admin_invites(token);
CREATE INDEX IF NOT EXISTS idx_admin_invites_email ON institute_admin_invites(email);
CREATE INDEX IF NOT EXISTS idx_admin_invites_expires ON institute_admin_invites(expires_at);

-- 4. Funzione per contare admin attivi di un istituto
CREATE OR REPLACE FUNCTION count_active_admins(p_institute_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM institute_admins
    WHERE institute_id = p_institute_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funzione per verificare se un utente è admin di un istituto
CREATE OR REPLACE FUNCTION is_institute_admin(p_user_id UUID, p_institute_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM institute_admins
    WHERE user_id = p_user_id
    AND institute_id = p_institute_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Funzione per verificare se un utente può gestire admin
CREATE OR REPLACE FUNCTION can_manage_admins(p_user_id UUID, p_institute_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM institute_admins
    WHERE user_id = p_user_id
    AND institute_id = p_institute_id
    AND status = 'active'
    AND (role = 'owner' OR (permissions->>'can_manage_admins')::boolean = true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Trigger per limitare il numero di admin a 3
CREATE OR REPLACE FUNCTION check_max_admins()
RETURNS TRIGGER AS $$
DECLARE
  admin_count INTEGER;
BEGIN
  -- Conta admin attivi per questo istituto
  SELECT COUNT(*) INTO admin_count
  FROM institute_admins
  WHERE institute_id = NEW.institute_id
  AND status = 'active';
  
  -- Se stiamo inserendo un nuovo admin e abbiamo già 3 admin, blocca
  IF TG_OP = 'INSERT' AND admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto per questo istituto';
  END IF;
  
  -- Se stiamo aggiornando lo status da non-active ad active, verifica il limite
  IF TG_OP = 'UPDATE' AND OLD.status != 'active' AND NEW.status = 'active' AND admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto per questo istituto';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_max_admins
  BEFORE INSERT OR UPDATE ON institute_admins
  FOR EACH ROW
  EXECUTE FUNCTION check_max_admins();

-- 8. Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_institute_admins_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_institute_admins_timestamp
  BEFORE UPDATE ON institute_admins
  FOR EACH ROW
  EXECUTE FUNCTION update_institute_admins_timestamp();

-- 9. Funzione per creare il primo admin (owner) durante la registrazione
CREATE OR REPLACE FUNCTION create_institute_owner(
  p_institute_id UUID,
  p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Inserisci il primo admin come owner
  INSERT INTO institute_admins (
    institute_id,
    user_id,
    role,
    status,
    permissions,
    accepted_at
  ) VALUES (
    p_institute_id,
    p_user_id,
    'owner',
    'active',
    '{"can_edit_profile": true, "can_create_posts": true, "can_delete_posts": true, "can_manage_admins": true}'::jsonb,
    NOW()
  )
  RETURNING id INTO v_admin_id;
  
  RETURN v_admin_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Funzione per invitare un nuovo admin
CREATE OR REPLACE FUNCTION invite_institute_admin(
  p_institute_id UUID,
  p_email TEXT,
  p_invited_by UUID,
  p_role TEXT DEFAULT 'admin'
)
RETURNS UUID AS $$
DECLARE
  v_invite_id UUID;
  v_token TEXT;
  v_admin_count INTEGER;
BEGIN
  -- Verifica che l'invitante possa gestire admin
  IF NOT can_manage_admins(p_invited_by, p_institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per invitare amministratori';
  END IF;
  
  -- Verifica limite admin
  SELECT count_active_admins(p_institute_id) INTO v_admin_count;
  IF v_admin_count >= 3 THEN
    RAISE EXCEPTION 'Limite massimo di 3 amministratori raggiunto';
  END IF;
  
  -- Genera token univoco
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Crea invito
  INSERT INTO institute_admin_invites (
    institute_id,
    email,
    invited_by,
    role,
    token
  ) VALUES (
    p_institute_id,
    LOWER(p_email),
    p_invited_by,
    p_role,
    v_token
  )
  ON CONFLICT (institute_id, email) 
  DO UPDATE SET
    token = v_token,
    expires_at = NOW() + INTERVAL '7 days',
    accepted = FALSE,
    created_at = NOW()
  RETURNING id INTO v_invite_id;
  
  RETURN v_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Funzione per accettare un invito admin
CREATE OR REPLACE FUNCTION accept_admin_invite(
  p_token TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_invite RECORD;
  v_user_email TEXT;
BEGIN
  -- Ottieni email utente
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = p_user_id;
  
  -- Trova invito valido
  SELECT * INTO v_invite
  FROM institute_admin_invites
  WHERE token = p_token
  AND accepted = FALSE
  AND expires_at > NOW()
  AND LOWER(email) = LOWER(v_user_email);
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invito non valido o scaduto';
  END IF;
  
  -- Crea record admin
  INSERT INTO institute_admins (
    institute_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    accepted_at
  ) VALUES (
    v_invite.institute_id,
    p_user_id,
    v_invite.role,
    'active',
    v_invite.invited_by,
    v_invite.created_at,
    NOW()
  );
  
  -- Marca invito come accettato
  UPDATE institute_admin_invites
  SET accepted = TRUE, accepted_at = NOW()
  WHERE id = v_invite.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Funzione per rimuovere un admin
CREATE OR REPLACE FUNCTION remove_institute_admin(
  p_admin_id UUID,
  p_removed_by UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin RECORD;
BEGIN
  -- Ottieni info admin da rimuovere
  SELECT * INTO v_admin
  FROM institute_admins
  WHERE id = p_admin_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Amministratore non trovato';
  END IF;
  
  -- Non si può rimuovere l'owner
  IF v_admin.role = 'owner' THEN
    RAISE EXCEPTION 'Non è possibile rimuovere il proprietario dell''istituto';
  END IF;
  
  -- Verifica permessi
  IF NOT can_manage_admins(p_removed_by, v_admin.institute_id) THEN
    RAISE EXCEPTION 'Non hai i permessi per rimuovere amministratori';
  END IF;
  
  -- Rimuovi admin
  UPDATE institute_admins
  SET status = 'removed', updated_at = NOW()
  WHERE id = p_admin_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. View per ottenere info complete admin
CREATE OR REPLACE VIEW institute_admins_view AS
SELECT 
  ia.id,
  ia.institute_id,
  ia.user_id,
  ia.role,
  ia.status,
  ia.permissions,
  ia.created_at,
  ia.updated_at,
  si.institute_name,
  COALESCE(pu.first_name, 'Admin') as first_name,
  COALESCE(pu.last_name, '') as last_name,
  au.email,
  COALESCE(pu.avatar_url, si.logo_url) as avatar_url,
  (SELECT COUNT(*) FROM institute_admins WHERE institute_id = ia.institute_id AND status = 'active') as total_admins
FROM institute_admins ia
JOIN school_institutes si ON ia.institute_id = si.id
JOIN auth.users au ON ia.user_id = au.id
LEFT JOIN private_users pu ON ia.user_id = pu.id
WHERE ia.status = 'active';

-- 14. RLS Policies per institute_admins
ALTER TABLE institute_admins ENABLE ROW LEVEL SECURITY;

-- Policy: Gli admin possono vedere gli altri admin del loro istituto
CREATE POLICY "Admins can view their institute admins"
  ON institute_admins FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institute_admins ia
      WHERE ia.user_id = auth.uid()
      AND ia.institute_id = institute_admins.institute_id
      AND ia.status = 'active'
    )
  );

-- Policy: Solo chi può gestire admin può inserire nuovi admin
CREATE POLICY "Authorized users can add admins"
  ON institute_admins FOR INSERT
  WITH CHECK (
    can_manage_admins(auth.uid(), institute_id)
  );

-- Policy: Solo chi può gestire admin può aggiornare
CREATE POLICY "Authorized users can update admins"
  ON institute_admins FOR UPDATE
  USING (
    can_manage_admins(auth.uid(), institute_id)
  );

-- Policy: Solo chi può gestire admin può eliminare
CREATE POLICY "Authorized users can delete admins"
  ON institute_admins FOR DELETE
  USING (
    can_manage_admins(auth.uid(), institute_id)
  );

-- 15. RLS Policies per institute_admin_invites
ALTER TABLE institute_admin_invites ENABLE ROW LEVEL SECURITY;

-- Policy: Gli admin possono vedere gli inviti del loro istituto
CREATE POLICY "Admins can view their institute invites"
  ON institute_admin_invites FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM institute_admins ia
      WHERE ia.user_id = auth.uid()
      AND ia.institute_id = institute_admin_invites.institute_id
      AND ia.status = 'active'
    )
  );

-- Policy: Solo chi può gestire admin può creare inviti
CREATE POLICY "Authorized users can create invites"
  ON institute_admin_invites FOR INSERT
  WITH CHECK (
    can_manage_admins(auth.uid(), institute_id)
  );

-- 16. Funzione per ottenere l'istituto di un admin
CREATE OR REPLACE FUNCTION get_admin_institute(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_institute_id UUID;
BEGIN
  SELECT institute_id INTO v_institute_id
  FROM institute_admins
  WHERE user_id = p_user_id
  AND status = 'active'
  LIMIT 1;
  
  RETURN v_institute_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 17. Commenti per documentazione
COMMENT ON TABLE institute_admins IS 'Gestisce gli amministratori degli istituti (max 3 per istituto)';
COMMENT ON TABLE institute_admin_invites IS 'Gestisce gli inviti per nuovi amministratori';
COMMENT ON FUNCTION count_active_admins IS 'Conta il numero di admin attivi per un istituto';
COMMENT ON FUNCTION is_institute_admin IS 'Verifica se un utente è admin di un istituto';
COMMENT ON FUNCTION can_manage_admins IS 'Verifica se un utente può gestire gli admin';
COMMENT ON FUNCTION create_institute_owner IS 'Crea il primo admin (owner) durante la registrazione';
COMMENT ON FUNCTION invite_institute_admin IS 'Invia un invito per diventare admin';
COMMENT ON FUNCTION accept_admin_invite IS 'Accetta un invito admin';
COMMENT ON FUNCTION remove_institute_admin IS 'Rimuove un admin dall''istituto';

-- ===================================================================
-- FINE SETUP SISTEMA MULTI-ADMIN
-- ===================================================================
