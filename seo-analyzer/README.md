# 🔍 Agente SEO Analyzer - Analisi Completa per Siti Web Statici

## 📋 Descrizione

Agente intelligente per l'analisi SEO completa di siti web statici. Analizza automaticamente tutti gli aspetti SEO critici e fornisce raccomandazioni dettagliate per massimizzare il ranking nei motori di ricerca.

## ✨ Funzionalità Principali

### 1. **Analisi Contenuti HTML**
- ✅ Verifica `<title>` (lunghezza, primary keyword, unicità)
- ✅ Analisi `<meta description>` (lunghezza, keyword, persuasività)
- ✅ Controllo struttura headings (`<h1>`, `<h2>`, `<h3>`)
- ✅ Densità keyword (0.8-1.5% ottimale)
- ✅ Identificazione keyword stuffing

### 2. **Analisi Immagini**
- ✅ Verifica attributi `alt` descrittivi
- ✅ Controllo nomi file ottimizzati
- ✅ Dimensioni e compressione immagini
- ✅ Lazy loading implementation
- ✅ Format moderni (WebP, AVIF)

### 3. **Analisi Link**
- ✅ Link interni (anchor text, distribuzione)
- ✅ Link esterni (autorevolezza, rel attributes)
- ✅ Link rotti o non funzionanti
- ✅ Struttura di link interna

### 4. **Analisi Performance**
- ✅ Velocità di caricamento pagina
- ✅ First Contentful Paint (FCP)
- ✅ Largest Contentful Paint (LCP)
- ✅ Cumulative Layout Shift (CLS)
- ✅ Time to Interactive (TTI)
- ✅ Compressione CSS/JS
- ✅ Caching strategy

### 5. **Analisi Mobile & Accessibilità**
- ✅ Responsive design
- ✅ Mobile-friendly test
- ✅ Viewport configuration
- ✅ Touch target sizes
- ✅ ARIA labels

### 6. **Analisi Struttura URL**
- ✅ URL pulite e SEO-friendly
- ✅ Struttura gerarchica logica
- ✅ Canonical tags
- ✅ Sitemap.xml validation

### 7. **Schema Markup & Dati Strutturati**
- ✅ Presenza schema.org markup
- ✅ Validazione JSON-LD
- ✅ Rich snippets optimization

## 🚀 Installazione

```bash
# Clona il repository
cd seo-analyzer

# Installa le dipendenze
pip install -r requirements.txt

# Oppure usa Poetry
poetry install
```

## 💻 Utilizzo

### Analisi Base
```bash
python seo_analyzer.py --url https://tuosito.it
```

### Analisi Completa di un Sito
```bash
python seo_analyzer.py --sitemap https://tuosito.it/sitemap.xml --full-report
```

### Analisi File HTML Locali
```bash
python seo_analyzer.py --local-dir ./build --recursive
```

### Modalità Watch (Analisi Continua)
```bash
python seo_analyzer.py --watch ./public --interval 30
```

### Export Report
```bash
python seo_analyzer.py --url https://tuosito.it --output json
python seo_analyzer.py --url https://tuosito.it --output html --save report.html
python seo_analyzer.py --url https://tuosito.it --output pdf --save report.pdf
```

## 📊 Report Generati

L'agente genera report dettagliati con:

1. **Score SEO Globale** (0-100)
2. **Breakdown per Categoria**
   - Contenuti: 25%
   - Performance: 25%
   - Mobile: 15%
   - Immagini: 15%
   - Link: 10%
   - Struttura: 10%

3. **Lista Prioritizzata di Problemi**
   - 🔴 Critici (impatto alto)
   - 🟡 Importanti (impatto medio)
   - 🟢 Miglioramenti (impatto basso)

4. **Raccomandazioni Actionable**
   - Cosa fare
   - Come farlo
   - Impatto stimato

## 📁 Struttura Progetto

```
seo-analyzer/
├── README.md
├── requirements.txt
├── config/
│   ├── seo_rules.yaml          # Regole SEO configurabili
│   └── keywords.yaml            # Database keywords per settore
├── analyzers/
│   ├── __init__.py
│   ├── content_analyzer.py     # Analisi contenuti HTML
│   ├── image_analyzer.py       # Analisi immagini
│   ├── link_analyzer.py        # Analisi link
│   ├── performance_analyzer.py # Analisi performance
│   ├── mobile_analyzer.py      # Analisi mobile/responsive
│   ├── url_analyzer.py         # Analisi URL
│   └── schema_analyzer.py      # Analisi schema markup
├── utils/
│   ├── __init__.py
│   ├── crawler.py              # Spider per crawling sito
│   ├── parser.py               # Parser HTML
│   ├── scorer.py               # Sistema di scoring
│   └── reporter.py             # Generazione report
├── tests/
│   └── test_*.py
└── seo_analyzer.py             # Entry point principale
```

## ⚙️ Configurazione

Modifica `config/seo_rules.yaml` per personalizzare le regole:

```yaml
content:
  title:
    min_length: 30
    max_length: 60
    require_primary_keyword: true
    
  meta_description:
    min_length: 120
    max_length: 155
    require_call_to_action: true
    
  keyword_density:
    min: 0.8
    max: 1.5
    
images:
  require_alt: true
  max_size_kb: 200
  recommended_formats: ['webp', 'avif', 'jpg']
  
performance:
  max_load_time_seconds: 3
  target_lighthouse_score: 90
```

## 🎯 Best Practices Implementate

### Secondo le Tue Linee Guida SEO

✅ **Primary keyword** nei punti strategici  
✅ **Secondary keywords** distribuite naturalmente  
✅ **LSI keywords** per rilevanza semantica  
✅ **Meta tag** unici e ottimizzati per ogni pagina  
✅ **Struttura headings** gerarchica e logica  
✅ **Link interni** strategici con anchor text descrittivi  
✅ **Immagini ottimizzate** (nome, alt, dimensioni)  
✅ **URL pulite** e SEO-friendly  
✅ **Performance** ottimizzate (compressione, lazy load)  
✅ **Mobile-first** e responsive al 100%  

## 📈 Esempi di Output

### Console Output
```
🔍 Analisi SEO - https://tuosito.it/
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 SCORE GLOBALE: 78/100

📋 Breakdown per Categoria:
  ✅ Contenuti:     85/100
  ⚠️  Performance:  65/100
  ✅ Mobile:        92/100
  ⚠️  Immagini:     58/100
  ✅ Link:          88/100
  ✅ Struttura:     81/100

🔴 Problemi Critici (2):
  1. Meta description mancante su 3 pagine
  2. 15 immagini senza attributo alt

🟡 Problemi Importanti (5):
  1. Tempo di caricamento: 4.2s (target: <3s)
  2. 8 immagini non compresse (>200KB)
  ...

💡 Top 3 Raccomandazioni:
  1. Aggiungi meta description alle pagine /about, /contact, /services
     Impatto: +8 punti SEO
  2. Comprimi le immagini nella homepage (risparmio 2.1MB)
     Impatto: +12 punti Performance
  3. Implementa lazy loading per le immagini
     Impatto: +5 punti Performance
```

## 🔄 Integrazione CI/CD

### GitHub Actions
```yaml
name: SEO Analysis
on: [push, pull_request]
jobs:
  seo-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run SEO Analyzer
        run: |
          pip install -r requirements.txt
          python seo_analyzer.py --local-dir ./build --fail-on-score 70
```

### Pre-commit Hook
```bash
#!/bin/bash
python seo_analyzer.py --local-dir ./build --quick
if [ $? -ne 0 ]; then
    echo "❌ SEO check failed!"
    exit 1
fi
```

## 🛠️ API Usage

```python
from seo_analyzer import SEOAnalyzer

# Inizializza analyzer
analyzer = SEOAnalyzer(config_path='config/seo_rules.yaml')

# Analizza URL
result = analyzer.analyze_url('https://tuosito.it')

# Analizza file locale
result = analyzer.analyze_file('./build/index.html')

# Analizza directory
results = analyzer.analyze_directory('./build', recursive=True)

# Accedi ai risultati
print(f"Score: {result.score}")
print(f"Issues: {len(result.issues)}")
for issue in result.critical_issues:
    print(f"- {issue.description}")
```

## 📚 Documentazione Avanzata

- [Guida Configurazione Completa](docs/configuration.md)
- [API Reference](docs/api.md)
- [Esempi Avanzati](docs/examples.md)
- [FAQ](docs/faq.md)

## 🤝 Contributi

Suggerimenti e pull request sono benvenuti!

## 📄 Licenza

MIT License

## 👨‍💻 Autore

Sviluppato per ottimizzare siti web statici secondo le migliori pratiche SEO 2024-2025.

