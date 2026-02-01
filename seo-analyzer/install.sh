#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SEO Analyzer Agent - Script Installazione Automatica
# ═══════════════════════════════════════════════════════════════

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 SEO ANALYZER AGENT - Installazione"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Verifica Python
echo "📋 Verifica requisiti..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato!"
    echo "💡 Installa Python 3.8+ da https://www.python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
echo "✅ Python ${PYTHON_VERSION} trovato"

# Verifica pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip non trovato!"
    echo "💡 Installa pip: python3 -m ensurepip"
    exit 1
fi

echo "✅ pip trovato"
echo ""

# Opzionale: crea virtual environment
read -p "🤔 Vuoi creare un virtual environment? (consigliato) [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo "📦 Creazione virtual environment..."
    python3 -m venv venv
    
    # Attiva venv
    if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        source venv/Scripts/activate
    else
        source venv/bin/activate
    fi
    
    echo "✅ Virtual environment creato e attivato"
fi

echo ""
echo "📥 Installazione dipendenze..."
pip3 install -r requirements.txt

echo ""
echo "✅ Installazione completata!"
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "🚀 PRONTO ALL'USO!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "💡 Esempi di utilizzo:"
echo ""
echo "  # Analisi URL"
echo "  python seo_analyzer.py --url https://tuosito.it"
echo ""
echo "  # Analisi file locale"
echo "  python seo_analyzer.py --file examples/test-page.html"
echo ""
echo "  # Analisi directory"
echo "  python seo_analyzer.py --local-dir ./build --recursive"
echo ""
echo "  # Report HTML"
echo "  python seo_analyzer.py --url https://tuosito.it --output html --save report.html"
echo ""
echo "📚 Consulta README.md e QUICK_START.md per la documentazione completa"
echo ""

# Test rapido
read -p "🧪 Vuoi eseguire un test con la pagina di esempio? [Y/n]: " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    echo ""
    echo "🔍 Test in corso..."
    python seo_analyzer.py --file examples/test-page.html
fi

echo ""
echo "✅ Tutto pronto! Buona ottimizzazione SEO! 🎉"

