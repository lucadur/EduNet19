# 🚀 Guida Rapida - SEO Analyzer Agent

## Installazione Rapida

```bash
# 1. Naviga nella directory
cd seo-analyzer

# 2. Installa dipendenze
pip install -r requirements.txt

# 3. Verifica installazione
python seo_analyzer.py --help
```

## Esempi di Utilizzo

### 1️⃣ Analisi Singola URL

```bash
python seo_analyzer.py --url https://tuosito.it
```

**Output:**
```
🔍 Analisi SEO - https://tuosito.it/
══════════════════════════════════════════════════════════════════════
📊 SCORE GLOBALE: ✅ 78/100 (Buono)

📋 Breakdown per Categoria:
  ✅ Content          [████████████████░░░░] 85/100
  ⚠️  Performance     [█████████████░░░░░░░] 65/100
  ✅ Mobile           [██████████████████░░] 92/100
  ...
```

### 2️⃣ Analisi File HTML Locale

```bash
python seo_analyzer.py --file ./public/index.html
```

Perfetto per **sviluppo locale** prima del deploy!

### 3️⃣ Analisi Intera Directory

```bash
# Analizza tutti i file HTML ricorsivamente
python seo_analyzer.py --local-dir ./build --recursive
```

**Output:**
```
📊 RIEPILOGO DIRECTORY
══════════════════════════════════════════════════════════════════════
File analizzati: 15
Score medio: 82.3/100

🏆 Migliori:
  95/100 - index.html
  91/100 - about.html
  89/100 - services.html
```

### 4️⃣ Analisi da Sitemap

```bash
python seo_analyzer.py --sitemap https://tuosito.it/sitemap.xml --max-pages 50
```

Analizza automaticamente tutte le pagine nel sitemap!

### 5️⃣ Genera Report HTML

```bash
python seo_analyzer.py --url https://tuosito.it \
  --output html \
  --save report-seo.html
```

Apri `report-seo.html` nel browser per un report visuale completo! 📊

### 6️⃣ Genera Report JSON

```bash
python seo_analyzer.py --url https://tuosito.it \
  --output json \
  --save report.json
```

Perfetto per **integrazione CI/CD** o analisi programmatica.

### 7️⃣ Analisi Veloce (Quick Mode)

```bash
python seo_analyzer.py --url https://tuosito.it --quick
```

Salta verifiche lente (dimensioni immagini, link rotti, performance live).  
⚡ **5x più veloce!**

## 📋 Interpretazione Risultati

### Score Globale

| Score | Valutazione | Emoji | Azione |
|-------|-------------|-------|--------|
| 90-100 | Eccellente | 🏆 | Perfetto! Mantieni questo livello |
| 75-89 | Buono | ✅ | Ottime basi, piccoli miglioramenti |
| 60-74 | Medio | ⚠️ | Lavoro necessario, priorità medie |
| 40-59 | Scarso | ❌ | Intervento urgente richiesto |
| 0-39 | Critico | 💀 | Ristrutturazione completa |

### Livelli di Severità Issues

- 🔴 **Critici**: Impatto ALTO - Risolvere immediatamente
- 🟡 **Importanti**: Impatto MEDIO - Risolvere presto
- 🟢 **Miglioramenti**: Impatto BASSO - Quando possibile

## 🎯 Workflow Raccomandato

### Per Nuovi Progetti

```bash
# 1. Analisi iniziale
python seo_analyzer.py --local-dir ./build --recursive

# 2. Correggi problemi critici

# 3. Ri-analizza
python seo_analyzer.py --local-dir ./build --recursive

# 4. Genera report finale
python seo_analyzer.py --url https://staging.tuosito.it \
  --output html --save report-finale.html
```

### Per Siti Esistenti

```bash
# 1. Analisi completa da sitemap
python seo_analyzer.py --sitemap https://tuosito.it/sitemap.xml

# 2. Identifica pagine con score più basso

# 3. Analisi dettagliata pagine critiche
python seo_analyzer.py --url https://tuosito.it/pagina-critica

# 4. Applica correzioni

# 5. Verifica miglioramenti
python seo_analyzer.py --url https://tuosito.it/pagina-critica \
  --output json --save after.json
```

### Integrazione CI/CD (GitHub Actions)

```yaml
# .github/workflows/seo-check.yml
name: SEO Check
on: [push, pull_request]

jobs:
  seo-analysis:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.10'
      
      - name: Install Dependencies
        run: |
          pip install -r seo-analyzer/requirements.txt
      
      - name: Run SEO Analysis
        run: |
          cd seo-analyzer
          python seo_analyzer.py --local-dir ../build --recursive
      
      - name: Upload Report
        uses: actions/upload-artifact@v2
        with:
          name: seo-report
          path: seo-report.html
```

## 🔧 Configurazione Personalizzata

Modifica `config/seo_rules.yaml` per adattare le regole al tuo progetto:

```yaml
content:
  title:
    min_length: 30    # Personalizza lunghezza minima
    max_length: 60
    
images:
  optimization:
    max_size_kb: 150  # Riduci per mobile-first
    
performance:
  loading:
    max_load_time_seconds: 2.5  # Target più ambizioso
```

## 💡 Tips & Tricks

### 1. Watch Mode per Sviluppo

Crea uno script `watch-seo.sh`:

```bash
#!/bin/bash
while true; do
  clear
  python seo_analyzer.py --file ./public/index.html
  sleep 5
done
```

### 2. Compara Before/After

```bash
# Prima
python seo_analyzer.py --url https://tuosito.it \
  --output json --save before.json

# ... applica modifiche ...

# Dopo
python seo_analyzer.py --url https://tuosito.it \
  --output json --save after.json

# Compara
diff before.json after.json
```

### 3. Analisi Solo Specifiche Categorie

Modifica `seo_analyzer.py` per commentare analyzer non necessari in `_analyze_html()`.

### 4. Export Issues in CSV

```bash
python seo_analyzer.py --url https://tuosito.it \
  --output json \
  | jq '.all_issues[] | [.severity, .category, .message] | @csv' \
  > issues.csv
```

## 🆘 Troubleshooting

### Errore: ModuleNotFoundError

```bash
pip install -r requirements.txt
```

### Timeout su Siti Lenti

```bash
# Aumenta timeout in config/seo_rules.yaml
advanced:
  crawling:
    timeout_seconds: 60  # Default: 30
```

### Troppe Issue, Non So da Dove Iniziare

Concentrati prima sui **problemi critici** 🔴, poi passa agli **importanti** 🟡.

## 📚 Prossimi Passi

1. ✅ Leggi la documentazione completa in `README.md`
2. ✅ Esplora `config/seo_rules.yaml` per capire tutte le regole
3. ✅ Testa su un tuo progetto reale
4. ✅ Integra nel tuo workflow di sviluppo

## 🎓 Best Practices SEO 2025

### Must-Have per Ogni Pagina

- ✅ Title unico 30-60 caratteri con primary keyword
- ✅ Meta description 120-155 caratteri persuasiva
- ✅ H1 unico con primary keyword
- ✅ Alt text su tutte le immagini
- ✅ URL pulita e SEO-friendly
- ✅ Mobile responsive al 100%
- ✅ Caricamento < 3 secondi
- ✅ Schema.org markup (JSON-LD)

### Da Evitare

- ❌ Keyword stuffing
- ❌ Contenuti duplicati
- ❌ Immagini > 200KB senza compressione
- ❌ Link rotti
- ❌ Anchor text generici ("clicca qui")
- ❌ URL con parametri query quando evitabili
- ❌ Mancanza di canonical tag

## 🤝 Supporto

Per domande, suggerimenti o bug report, consulta la documentazione o contatta il team di sviluppo.

**Buona ottimizzazione SEO! 🚀**

