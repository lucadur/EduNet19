-- ===================================================================
-- DATI DI ESEMPIO PER TESTARE LA RICERCA
-- Esegui questo script nel SQL Editor di Supabase
-- ===================================================================

-- IMPORTANTE: Prima di eseguire questo script, devi creare utenti reali
-- tramite l'interfaccia di registrazione o il pannello Authentication di Supabase

-- OPZIONE 1: Usa utenti esistenti (RACCOMANDATO)
-- Se hai già utenti registrati, puoi vedere i loro ID con questa query:
-- SELECT id, email FROM auth.users;
-- Poi sostituisci gli ID qui sotto con quelli reali

-- OPZIONE 2: Crea utenti fittizi nella tabella auth.users (SOLO PER TEST)
-- ATTENZIONE: Questo bypassa il sistema di autenticazione normale
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change
) VALUES 
(
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    'authenticated',
    'authenticated',
    'galilei@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '22222222-2222-2222-2222-222222222222',
    'authenticated',
    'authenticated',
    'davinci@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '33333333-3333-3333-3333-333333333333',
    'authenticated',
    'authenticated',
    'marco.rossi@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
),
(
    '00000000-0000-0000-0000-000000000000',
    '44444444-4444-4444-4444-444444444444',
    'authenticated',
    'authenticated',
    'laura.bianchi@example.com',
    '$2a$10$dummy.hash.for.testing.purposes.only',
    NOW(),
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
)
ON CONFLICT (id) DO NOTHING;

-- Ora inserisci i profili utente
INSERT INTO user_profiles (id, user_type, email_verified, profile_completed) VALUES
('11111111-1111-1111-1111-111111111111', 'istituto', true, true),
('22222222-2222-2222-2222-222222222222', 'istituto', true, true),
('33333333-3333-3333-3333-333333333333', 'privato', true, true),
('44444444-4444-4444-4444-444444444444', 'privato', true, true)
ON CONFLICT (id) DO NOTHING;

-- Inserisci dati istituti
INSERT INTO school_institutes (id, institute_name, institute_type, city, province, description, verified) VALUES
('11111111-1111-1111-1111-111111111111', 'Liceo Scientifico Galileo Galilei', 'Liceo Scientifico', 'Roma', 'RM', 'Liceo scientifico con focus su STEM e innovazione tecnologica', true),
('22222222-2222-2222-2222-222222222222', 'IIS Leonardo da Vinci', 'Istituto Tecnico', 'Milano', 'MI', 'Istituto tecnico industriale con specializzazioni in informatica e meccanica', true)
ON CONFLICT (id) DO NOTHING;

-- Inserisci dati utenti privati
INSERT INTO private_users (id, first_name, last_name, location_city, location_province, bio) VALUES
('33333333-3333-3333-3333-333333333333', 'Marco', 'Rossi', 'Napoli', 'NA', 'Docente di matematica e fisica, appassionato di didattica innovativa'),
('44444444-4444-4444-4444-444444444444', 'Laura', 'Bianchi', 'Torino', 'TO', 'Pedagogista specializzata in metodologie attive e cooperative learning')
ON CONFLICT (id) DO NOTHING;

-- Inserisci post di esempio
INSERT INTO posts (id, author_id, title, content, post_type, is_published) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'Progetto STEM: Robotica Educativa', 'Il nostro liceo ha avviato un innovativo progetto di robotica educativa che coinvolge studenti del triennio. Gli studenti progettano e costruiscono robot utilizzando Arduino e sensori vari, sviluppando competenze in programmazione, elettronica e problem solving.', 'project', true),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 'Metodologia Flipped Classroom', 'Condividiamo la nostra esperienza con la metodologia della classe capovolta. Dopo due anni di sperimentazione, abbiamo ottenuto risultati eccellenti in termini di coinvolgimento degli studenti e miglioramento dei risultati di apprendimento.', 'methodology', true),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 'Matematica e Realtà Virtuale', 'Esperimento didattico: utilizzo della realtà virtuale per insegnare geometria solida. Gli studenti possono manipolare forme tridimensionali in uno spazio virtuale, rendendo più concrete le nozioni astratte della geometria.', 'post', true),
('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 'Cooperative Learning in Pratica', 'Guida pratica per implementare il cooperative learning in classe. Tecniche, strategie e strumenti per creare gruppi di lavoro efficaci e promuovere l''apprendimento collaborativo tra gli studenti.', 'methodology', true),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', 'Laboratorio di Fisica Quantistica', 'Nuovo laboratorio di fisica quantistica per studenti del quinto anno. Esperimenti con fotoni singoli e interferometria per avvicinare gli studenti ai concetti fondamentali della meccanica quantistica.', 'project', true)
ON CONFLICT (id) DO NOTHING;

-- Aggiorna i contatori dei post (opzionale)
UPDATE posts SET likes_count = FLOOR(RANDOM() * 50) + 5, comments_count = FLOOR(RANDOM() * 20) + 1 WHERE id IN (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'
);

-- Verifica che i dati siano stati inseriti
SELECT 'Profili utente inseriti:' as info, count(*) as count FROM user_profiles;
SELECT 'Istituti inseriti:' as info, count(*) as count FROM school_institutes;
SELECT 'Utenti privati inseriti:' as info, count(*) as count FROM private_users;
SELECT 'Post inseriti:' as info, count(*) as count FROM posts;

-- Test query di ricerca
SELECT 'Test ricerca "galilei":' as test;
SELECT institute_name FROM school_institutes WHERE institute_name ILIKE '%galilei%';

SELECT 'Test ricerca "robotica":' as test;
SELECT title FROM posts WHERE title ILIKE '%robotica%' OR content ILIKE '%robotica%';