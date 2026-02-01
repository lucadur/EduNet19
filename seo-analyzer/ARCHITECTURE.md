# 🏗️ Architettura SEO Analyzer Agent

## 📁 Struttura Progetto

```
seo-analyzer/
│
├── 📄 README.md                    # Documentazione principale
├── 📄 QUICK_START.md               # Guida rapida utilizzo
├── 📄 ARCHITECTURE.md              # Questo file - architettura sistema
├── 📄 CHANGELOG.md                 # Storico versioni
├── 📄 requirements.txt             # Dipendenze Python
├── 📄 .gitignore                   # File ignorati da git
├── 🔧 install.sh                   # Script installazione automatica
├── 🔧 test_analyzer.py             # Suite test automatici
│
├── 🎯 seo_analyzer.py              # ⭐ ENTRY POINT PRINCIPALE
│   └─> Orchestratore che coordina tutti i moduli
│
├── 📂 config/                      # Configurazioni
│   ├── seo_rules.yaml              # Regole SEO (personalizzabili)
│   └── keywords.yaml               # (Futuro) Database keywords
│
├── 📂 analyzers/                   # Moduli di Analisi Specializzati
│   ├── __init__.py
│   ├── content_analyzer.py         # Analisi contenuti HTML
│   ├── image_analyzer.py           # Analisi immagini
│   ├── link_analyzer.py            # Analisi link interni/esterni
│   ├── performance_analyzer.py     # Analisi performance
│   ├── mobile_analyzer.py          # Analisi mobile/responsive
│   ├── url_analyzer.py             # Analisi URL e struttura
│   └── schema_analyzer.py          # Analisi schema markup
│
├── 📂 utils/                       # Moduli Utility
│   ├── __init__.py
│   ├── crawler.py                  # Spider per crawling siti
│   ├── parser.py                   # Parser HTML avanzato
│   ├── scorer.py                   # Sistema scoring SEO
│   └── reporter.py                 # Generazione report multi-formato
│
└── 📂 examples/                    # Esempi e Test
    ├── example-usage.py            # Esempi utilizzo API
    └── test-page.html              # Pagina HTML test ottimizzata
```

---

## 🔄 Flusso di Esecuzione

### 1️⃣ Input Phase

```
┌─────────────────────────────────────┐
│  USER INPUT                         │
├─────────────────────────────────────┤
│  • URL singola                      │
│  • File HTML locale                 │
│  • Directory (ricorsiva)            │
│  • Sitemap.xml                      │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  SEOAnalyzer (main class)           │
│  • Carica configurazione YAML      │
│  • Inizializza tutti gli analyzer  │
└─────────────────────────────────────┘
```

### 2️⃣ Acquisition Phase

```
┌─────────────────────────────────────┐
│  ACQUISIZIONE CONTENUTO             │
├─────────────────────────────────────┤
│  URL       → Crawler/Requests       │
│  File      → File System            │
│  Directory → Glob Pattern           │
│  Sitemap   → XML Parser → URLs      │
└─────────────────────────────────────┘
            │
            ▼
        HTML Content
```

### 3️⃣ Analysis Phase (Core)

```
                    HTML
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
    
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Content    │ │    Images    │ │    Links     │
│   Analyzer   │ │   Analyzer   │ │   Analyzer   │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ • Title      │ │ • Alt text   │ │ • Internal   │
│ • Meta desc  │ │ • Filenames  │ │ • External   │
│ • Headings   │ │ • Sizes      │ │ • Anchors    │
│ • Keywords   │ │ • Formats    │ │ • Broken     │
│ • Text       │ │ • Lazy load  │ │              │
└──────────────┘ └──────────────┘ └──────────────┘
     │                 │                 │
     └─────────────────┼─────────────────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼

┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Performance  │ │    Mobile    │ │      URL     │
│   Analyzer   │ │   Analyzer   │ │   Analyzer   │
├──────────────┤ ├──────────────┤ ├──────────────┤
│ • Load time  │ │ • Viewport   │ │ • Structure  │
│ • Resources  │ │ • Responsive │ │ • Canonical  │
│ • Minify     │ │ • Touch      │ │ • Sitemap    │
│ • Cache      │ │ • Font size  │ │ • Robots.txt │
└──────────────┘ └──────────────┘ └──────────────┘
     │                 │                 │
     └─────────────────┼─────────────────┘
                       │
                       ▼
              ┌──────────────┐
              │    Schema    │
              │   Analyzer   │
              ├──────────────┤
              │ • JSON-LD    │
              │ • Microdata  │
              │ • RDFa       │
              └──────────────┘
                       │
                       ▼
              
        RISULTATI INDIVIDUALI
      (score + issues per category)
```

### 4️⃣ Scoring Phase

```
┌─────────────────────────────────────┐
│  SEOScorer                          │
├─────────────────────────────────────┤
│  Input: Category Scores             │
│  • Content:     85/100 (25%)        │
│  • Performance: 65/100 (25%)        │
│  • Mobile:      92/100 (15%)        │
│  • Images:      58/100 (15%)        │
│  • Links:       88/100 (10%)        │
│  • Structure:   81/100 (10%)        │
│                                     │
│  Formula: Weighted Average          │
│  Global Score = Σ(score × weight)   │
│                                     │
│  Output: 78/100 (Buono ✅)          │
└─────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────┐
│  Issue Prioritization               │
├─────────────────────────────────────┤
│  🔴 Critical  (2 issues)            │
│  🟡 Important (5 issues)            │
│  🟢 Minor     (8 issues)            │
└─────────────────────────────────────┘
```

### 5️⃣ Reporting Phase

```
┌─────────────────────────────────────┐
│  SEOReporter                        │
├─────────────────────────────────────┤
│  Input: Consolidated Results        │
│  • Global Score                     │
│  • Category Breakdown               │
│  • All Issues (prioritized)         │
│  • Recommendations                  │
└─────────────────────────────────────┘
            │
    ┌───────┼───────┐
    ▼       ▼       ▼
    
┌────────┐ ┌────────┐ ┌────────┐
│Console │ │  JSON  │ │  HTML  │
│ Report │ │ Export │ │ Report │
└────────┘ └────────┘ └────────┘
```

---

## 🧩 Componenti Principali

### 🎯 SEOAnalyzer (Orchestratore)

**Responsabilità:**
- Coordinare tutti gli analyzer
- Gestire flusso di esecuzione
- Aggregare risultati
- Interfaccia CLI

**Metodi Chiave:**
- `analyze_url()` - Analisi singola URL
- `analyze_file()` - Analisi file locale
- `analyze_directory()` - Analisi batch directory
- `analyze_sitemap()` - Analisi da sitemap
- `_analyze_html()` - Core logic analisi

### 📊 Analyzers (Moduli Specializzati)

Ogni analyzer è **indipendente** e segue lo stesso pattern:

```python
class XxxAnalyzer:
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
        self.score = 0
    
    def analyze(self, html: str, url: str) -> Dict:
        # Logica analisi specifica
        results = {
            'score': 0,
            'issues': [],
            # ... dati specifici
        }
        return results
```

**Vantaggi:**
- ✅ Modulare e testabile
- ✅ Facile aggiungere nuovi analyzer
- ✅ Configurabile via YAML
- ✅ Disaccoppiato

### ⚙️ Configuration System

File `config/seo_rules.yaml` centralizza **tutte le regole**:

```yaml
content:
  title:
    min_length: 30
    max_length: 60
    weight: 15
    
scoring:
  category_weights:
    content: 25
    performance: 25
  thresholds:
    excellent: 90
    good: 75
```

**Benefici:**
- 🎛️ Personalizzazione senza codice
- 📏 Regole versionate
- 🔄 Facile A/B testing di threshold
- 📦 Configurazioni per progetto

### 📈 Scoring System

**Formula:**

```
Global Score = Σ (Category_Score × Category_Weight)
             = (Content×25% + Performance×25% + Mobile×15% + 
                Images×15% + Links×10% + Structure×10%)
```

**Rating Levels:**

| Score    | Rating      | Emoji | Azione                |
|----------|-------------|-------|-----------------------|
| 90-100   | Eccellente  | 🏆    | Mantieni             |
| 75-89    | Buono       | ✅    | Piccoli miglioramenti|
| 60-74    | Medio       | ⚠️    | Lavoro necessario    |
| 40-59    | Scarso      | ❌    | Intervento urgente   |
| 0-39     | Critico     | 💀    | Ristrutturazione     |

### 📝 Issue System

Ogni issue ha struttura standardizzata:

```python
{
    'severity': 'critical' | 'important' | 'minor',
    'category': 'content' | 'images' | 'links' | ...,
    'message': 'Descrizione problema',
    'recommendation': 'Come risolvere',
    'impact': 'Impatto stimato sul SEO'
}
```

**Prioritizzazione:**

```
1. Critical (🔴)   → Fix immediato
2. Important (🟡)  → Fix entro settimana
3. Minor (🟢)      → Quando possibile
```

---

## 🔌 Punti di Estensione

### Aggiungere Nuovo Analyzer

1. Crea `analyzers/new_analyzer.py`:

```python
class NewAnalyzer:
    def __init__(self, config: Dict):
        self.config = config
        self.issues = []
    
    def analyze(self, html: str, url: str) -> Dict:
        # Tua logica
        return {
            'score': 85,
            'issues': self.issues,
            # ... altri dati
        }
```

2. Registra in `analyzers/__init__.py`
3. Aggiungi regole in `config/seo_rules.yaml`
4. Integra in `seo_analyzer.py` → `_analyze_html()`

### Aggiungere Nuovo Formato Report

1. Estendi `utils/reporter.py`:

```python
def generate_pdf_report(self, results: Dict) -> bytes:
    # Logica generazione PDF
    return pdf_bytes
```

2. Aggiungi opzione CLI in `seo_analyzer.py`

### Personalizzare Regole

Modifica `config/seo_rules.yaml` senza toccare codice:

```yaml
# Regole più stringenti per e-commerce
content:
  title:
    max_length: 55  # Era 60
  
images:
  optimization:
    max_size_kb: 150  # Era 200
```

---

## 🎯 Design Patterns Utilizzati

### 1. **Strategy Pattern** (Analyzers)

Ogni analyzer implementa la stessa interfaccia ma con logica diversa.

### 2. **Builder Pattern** (Reporter)

Reporter costruisce report in formati diversi dallo stesso dataset.

### 3. **Facade Pattern** (SEOAnalyzer)

SEOAnalyzer fornisce interfaccia semplificata per sistema complesso.

### 4. **Configuration Pattern**

Configurazione esterna via YAML per flessibilità.

---

## 🧪 Testing Strategy

### Unit Tests (Futuro)

```python
# tests/test_content_analyzer.py
def test_title_too_short():
    analyzer = ContentAnalyzer(config)
    html = '<html><head><title>Short</title></head></html>'
    results = analyzer.analyze(html, 'test')
    assert any(i['severity'] == 'important' for i in results['issues'])
```

### Integration Tests

`test_analyzer.py` verifica integrazione tra moduli.

### End-to-End Tests

Analisi di `examples/test-page.html` con score atteso.

---

## 📊 Performance Considerations

### Ottimizzazioni Implementate

- ✅ BeautifulSoup con parser `lxml` (più veloce)
- ✅ Modalità `--quick` salta verifiche lente
- ✅ Rate limiting su crawling
- ✅ Lazy evaluation dove possibile

### Scaling Strategies (Futuro)

- 🔄 Parallelizzazione con `asyncio`
- 💾 Caching risultati intermedi
- 🗄️ Database per siti grandi
- ☁️ Distribuzione cloud workers

---

## 🔒 Security Considerations

- ✅ Sanitizzazione input URL
- ✅ Timeout su richieste HTTP
- ✅ Validazione file locali
- ✅ Nessun eval() o exec()
- ✅ User-agent identificativo

---

## 🌍 Internazionalizzazione (Futuro)

Struttura preparata per i18n:

```yaml
# config/i18n/it.yaml
issues:
  title_missing: "Tag <title> mancante"
  
# config/i18n/en.yaml  
issues:
  title_missing: "Missing <title> tag"
```

---

## 📚 Risorse e Best Practices

### SEO Guidelines Seguite

- ✅ [Google Search Central](https://developers.google.com/search)
- ✅ [Schema.org](https://schema.org)
- ✅ [Web.dev Lighthouse](https://web.dev/lighthouse-seo/)
- ✅ [Core Web Vitals](https://web.dev/vitals/)
- ✅ [Mobile-First Indexing](https://developers.google.com/search/mobile-sites)

### Coding Standards

- 🐍 PEP 8 compliance
- 📝 Docstrings su tutte le funzioni pubbliche
- 🎯 Type hints dove appropriato
- 🧹 Codice pulito e leggibile

---

**Architettura v1.0 - Novembre 2025**

