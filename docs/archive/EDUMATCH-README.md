# 🔥 EduMatch - Sistema di Match per Istituti e Studenti

## 📋 Panoramica

**EduMatch** è un sistema innovativo tipo "Tinder" che permette agli istituti scolastici di trovare partner perfetti per collaborazioni e agli studenti di scoprire le scuole più adatte alle loro esigenze.

## ✨ Caratteristiche Principali

### 🎯 Funzionalità Core

- **Card Swipabili**: Sistema fluido di swipe per desktop e mobile
- **Due Modalità**:
  - 🏫 **Trova Istituti**: Per scoprire scuole con cui collaborare
  - 🎓 **Trova Studenti**: Per istituti che cercano studenti compatibili
- **Score di Affinità**: Algoritmo che calcola la compatibilità (0-100%)
- **Super Like**: Azione speciale per esprimere massimo interesse
- **Match System**: Notifiche animate quando c'è compatibilità reciproca

### 🎮 Controlli

#### Desktop (Tastiera)
- `→` (Freccia Destra): **Like** - Mi piace
- `←` (Freccia Sinistra): **Pass** - Non interessato
- `↑` (Freccia Su): **Super Like** - Massimo interesse!
- `I`: **Info** - Visualizza dettagli completi

#### Desktop/Mobile (Click/Touch)
- Click sui pulsanti sotto le card
- Swipe Right → Like
- Swipe Left → Pass  
- Swipe Up → Super Like

## 🎨 Design Features

### Card Design
- **Immagine Hero** con badge del tipo istituto/età
- **Affinity Score** prominente con icona fuoco
- **Tag Tematici** per interessi/metodologie
- **Motivi di Affinità** con spiegazione algoritmo
- **Statistiche** (progetti, collaborazioni, achievement)

### Animazioni
- Stack effect (4 card visibili contemporaneamente)
- Smooth transitions durante lo swipe
- Indicatori direzionali durante il drag
- Bounce animation per il match modal
- Pulse effect per score e match icon

### Responsive
- Mobile-first design
- Touch gestures ottimizzati
- Layout adattivo per tablet e desktop
- Bottoni touch-friendly (44px+ area)

## 📁 Struttura File

```
EduNet19_2/
├── css/components/edumatch-styles.css   # Stili completi per EduMatch
├── js/recommendations/edumatch.js       # Logica JavaScript del sistema
├── homepage.html               # Homepage integrata con EduMatch
└── EDUMATCH-README.md          # Questa documentazione
```

> Nota: il template `edumatch-section.html` non è presente nella codebase attuale.

## 🚀 Integrazione

### File già integrati in `homepage.html`:

1. **CSS** (nel `<head>`):
```html
<link rel="stylesheet" href="edumatch-styles.css">
```

2. **JavaScript** (prima di `</head>`):
```html
<script src="edumatch.js" defer></script>
```

3. **HTML Section** (nel feed centrale, dopo create-post-section)

## 💾 Integrazione Supabase

### Schema Database Necessario

```sql
-- Tabella per profili matchabili (istituti e studenti)
CREATE TABLE match_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('institute', 'student')),
  
  -- Dati Base
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  image_url TEXT,
  
  -- Dati Istituto
  institute_type TEXT,
  projects_count INTEGER DEFAULT 0,
  collaborations_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  
  -- Dati Studente
  age INTEGER,
  current_school TEXT,
  interests TEXT[], -- Array di interessi
  achievements_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[], -- Array di tag
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabella per le azioni di swipe
CREATE TABLE match_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_profile_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('like', 'pass', 'super_like')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate actions
  UNIQUE(actor_id, target_profile_id)
);

-- Tabella per i match confermati
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_1_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  profile_2_id UUID REFERENCES match_profiles(id) ON DELETE CASCADE,
  is_super_match BOOLEAN DEFAULT false, -- Se almeno uno ha fatto super like
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Prevent duplicate matches
  UNIQUE(profile_1_id, profile_2_id)
);

-- Indici per performance
CREATE INDEX idx_match_profiles_type ON match_profiles(profile_type);
CREATE INDEX idx_match_profiles_active ON match_profiles(is_active);
CREATE INDEX idx_match_actions_actor ON match_actions(actor_id);
CREATE INDEX idx_match_actions_target ON match_actions(target_profile_id);
CREATE INDEX idx_matches_profiles ON matches(profile_1_id, profile_2_id);

-- Row Level Security
ALTER TABLE match_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Policies per match_profiles
CREATE POLICY "Profili visibili a tutti gli utenti autenticati"
  ON match_profiles FOR SELECT
  USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Utenti possono creare il proprio profilo"
  ON match_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Utenti possono aggiornare il proprio profilo"
  ON match_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Policies per match_actions
CREATE POLICY "Utenti possono vedere le proprie azioni"
  ON match_actions FOR SELECT
  USING (auth.uid() = actor_id);

CREATE POLICY "Utenti possono creare azioni"
  ON match_actions FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- Policies per matches
CREATE POLICY "Utenti possono vedere i propri match"
  ON matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_profiles 
      WHERE (id = profile_1_id OR id = profile_2_id) 
      AND user_id = auth.uid()
    )
  );
```

### Funzioni JavaScript per Supabase

Aggiornare `edumatch.js` con queste funzioni:

```javascript
// In EduMatch class

async loadCardsFromSupabase() {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Get profili già visti/swipati
    const { data: seenProfiles } = await supabase
      .from('match_actions')
      .select('target_profile_id')
      .eq('actor_id', user.id);

    const seenIds = seenProfiles?.map(p => p.target_profile_id) || [];

    // Get nuovi profili
    const { data: profiles, error } = await supabase
      .from('match_profiles')
      .select('*')
      .eq('profile_type', this.currentMode)
      .eq('is_active', true)
      .not('id', 'in', `(${seenIds.join(',')})`)
      .limit(10);

    if (error) throw error;

    // Calcola affinity score per ogni profilo
    this.cards = profiles.map(profile => ({
      ...profile,
      affinity: this.calculateAffinity(profile),
      affinityReasons: this.getAffinityReasons(profile)
    }));

    return this.cards;
  } catch (error) {
    console.error('Errore caricamento profili:', error);
    throw error;
  }
}

async saveLike(profileId) {
  try {
    const { data: user } = await supabase.auth.getUser();
    
    // Salva azione
    const { error: actionError } = await supabase
      .from('match_actions')
      .insert({
        actor_id: user.id,
        target_profile_id: profileId,
        action_type: 'like'
      });

    if (actionError) throw actionError;

    // Controlla se c'è match reciproco
    const { data: reciprocalLike } = await supabase
      .from('match_actions')
      .select('*')
      .eq('actor_id', profileId)
      .eq('target_profile_id', user.id)
      .eq('action_type', 'like')
      .single();

    if (reciprocalLike) {
      // È un match!
      await this.createMatch(user.id, profileId);
      return true; // Match trovato
    }

    return false; // Nessun match
  } catch (error) {
    console.error('Errore salvataggio like:', error);
    throw error;
  }
}

async createMatch(userId1, userId2) {
  try {
    const { error } = await supabase
      .from('matches')
      .insert({
        profile_1_id: userId1,
        profile_2_id: userId2
      });

    if (error) throw error;

    // Invia notifica
    await this.sendMatchNotification(userId2);
  } catch (error) {
    console.error('Errore creazione match:', error);
    throw error;
  }
}

calculateAffinity(profile) {
  // Algoritmo personalizzato basato su:
  // - Tag in comune
  // - Vicinanza geografica
  // - Tipo di progetti/interessi
  // - Storia collaborazioni simili
  
  let score = 0;
  
  // Implementare la logica specifica
  // Esempio: 
  // - +10 per ogni tag in comune
  // - +20 se stessa regione
  // - +15 se progetti simili
  // ecc.
  
  return Math.min(100, Math.max(0, score));
}
```

## 🎯 Algoritmo di Affinità

L'affinità viene calcolata considerando:

1. **Tag in Comune** (40% del peso)
   - Metodologie didattiche condivise
   - Aree tematiche sovrapposte
   - Interessi tecnici/culturali comuni

2. **Vicinanza Geografica** (25% del peso)
   - Stessa città: +25
   - Stessa regione: +15
   - Regioni limitrofe: +10
   - Resto d'Italia: +5

3. **Progetti Affini** (20% del peso)
   - Tipologia di progetti simili
   - Livello di innovazione
   - Settori di intervento

4. **Statistiche di Collaborazione** (15% del peso)
   - Storia di collaborazioni passate
   - Network condiviso
   - Rating medio

## 📊 Statistiche e Metriche

Il sistema traccia:
- **Swipe Rate**: % di like vs pass
- **Match Rate**: % di match riusciti
- **Super Like Success**: Efficacia dei super like
- **Profile Views**: Visualizzazioni profilo
- **Engagement**: Tempo medio per decisione

## 🎨 Personalizzazione

### Variabili CSS Principali

```css
/* Colori card */
--match-card-bg: var(--color-white);
--match-affinity-bg: var(--color-success);

/* Dimensioni */
--match-card-height: 600px;
--match-card-width: 500px;

/* Animazioni */
--swipe-transition: 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Mock Data

Per test senza database, il sistema usa dati mock definiti in:
- `getMockInstituteCards()`
- `getMockStudentCards()`

## 🔧 Configurazione Avanzata

### Threshold Swipe
```javascript
const threshold = 150;        // px per considerare uno swipe valido
const superThreshold = 100;   // px per super like verticale
```

### Stack Size
```javascript
const cardsToShow = this.cards.slice(this.currentCardIndex, this.currentCardIndex + 4);
// Mostra fino a 4 card alla volta
```

## 🐛 Debug

### Console Logs
Il sistema logga:
- `🎯 EduMatch: Inizializzazione...`
- `💚 Like: [Nome Profilo]`
- `❌ Pass: [Nome Profilo]`
- `⭐ Super Like: [Nome Profilo]`
- `🔄 Modalità cambiata a [mode]`

### Verifica Funzionamento
1. Aprire DevTools Console
2. Verificare `window.eduMatch` è definito
3. Testare con tastiera (frecce)
4. Controllare animazioni swipe

## 🚀 Roadmap Future

- [ ] Algoritmo ML per affinità predittiva
- [ ] Chat integrata post-match
- [ ] Video profili (stile Instagram Reels)
- [ ] Filtri avanzati (distanza, tipo istituto, etc.)
- [ ] Calendar integration per eventi match
- [ ] Analytics dashboard per istituti
- [ ] Gamification con rewards
- [ ] "Rewind" per annullare ultimo swipe (premium)
- [ ] "Boost" per aumentare visibilità profilo

## 📝 Note di Sviluppo

- Sistema ottimizzato per performance (max 4 card DOM)
- Gesture detection nativo (no librerie esterne)
- Accessibility compliant (ARIA labels)
- Mobile-first approach
- Progressive Enhancement

## 🎓 SEO Optimized

Ogni card include:
- **Alt text** descrittivi per immagini
- **ARIA labels** per controlli
- **Semantic HTML** (section, article, etc.)
- **Meta keywords** nelle descrizioni
- **Structured data** ready

---

**Versione**: 1.0.0  
**Autore**: EduNet19 Development Team  
**Licenza**: Proprietaria  
**Data**: 2024

Per supporto: support@edunet19.it
