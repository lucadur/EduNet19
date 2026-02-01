#!/usr/bin/env python3
"""
Test Suite per SEO Analyzer
Verifica che tutti i moduli funzionino correttamente
"""

import sys
from pathlib import Path

print("🧪 SEO Analyzer - Test Suite")
print("=" * 70)

# Test import moduli
print("\n📦 Test 1: Import Moduli")
try:
    from analyzers.content_analyzer import ContentAnalyzer
    from analyzers.image_analyzer import ImageAnalyzer
    from analyzers.link_analyzer import LinkAnalyzer
    from analyzers.performance_analyzer import PerformanceAnalyzer
    from analyzers.mobile_analyzer import MobileAnalyzer
    from analyzers.url_analyzer import URLAnalyzer
    from analyzers.schema_analyzer import SchemaAnalyzer
    print("✅ Tutti gli analyzer importati correttamente")
except ImportError as e:
    print(f"❌ Errore import: {e}")
    sys.exit(1)

# Test utility
print("\n📦 Test 2: Utility Modules")
try:
    from utils.crawler import Crawler
    from utils.parser import HTMLParser
    from utils.scorer import SEOScorer
    from utils.reporter import SEOReporter
    print("✅ Tutti i moduli utility importati correttamente")
except ImportError as e:
    print(f"❌ Errore import utility: {e}")
    sys.exit(1)

# Test configurazione
print("\n📦 Test 3: Caricamento Configurazione")
try:
    import yaml
    with open('config/seo_rules.yaml', 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)
    print(f"✅ Configurazione caricata ({len(config)} sezioni)")
except Exception as e:
    print(f"❌ Errore configurazione: {e}")
    sys.exit(1)

# Test content analyzer
print("\n📦 Test 4: Content Analyzer")
try:
    html_test = """
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <title>Test Title - Keyword Principale</title>
        <meta name="description" content="Questa è una meta description di test con almeno 120 caratteri per verificare che il content analyzer funzioni correttamente.">
    </head>
    <body>
        <h1>Heading Principale con Keyword</h1>
        <h2>Sottosezione Prima</h2>
        <p>Contenuto di test con parole sufficienti per superare il minimo richiesto. 
        Questo paragrafo contiene testo di esempio per testare l'analizzatore di contenuti SEO.</p>
        <h2>Sottosezione Seconda</h2>
        <p>Altro contenuto rilevante per il test dell'analyzer.</p>
    </body>
    </html>
    """
    
    analyzer = ContentAnalyzer(config)
    results = analyzer.analyze(html_test, 'https://test.com')
    
    assert results['title']['exists'] == True
    assert results['meta_description']['exists'] == True
    assert len(results['headings']['h1']) == 1
    assert results['score'] > 0
    
    print(f"✅ Content Analyzer funziona (Score: {results['score']}/100)")
except Exception as e:
    print(f"❌ Errore Content Analyzer: {e}")
    sys.exit(1)

# Test image analyzer
print("\n📦 Test 5: Image Analyzer")
try:
    html_images = """
    <!DOCTYPE html>
    <html>
    <body>
        <img src="immagine-keyword-descrittiva.webp" alt="Descrizione dettagliata dell'immagine con keyword" loading="lazy" width="800" height="600">
        <img src="photo123.jpg">
    </body>
    </html>
    """
    
    analyzer = ImageAnalyzer(config)
    results = analyzer.analyze(html_images, 'https://test.com', check_image_size=False)
    
    assert results['total_images'] == 2
    assert results['summary']['missing_alt'] == 1
    assert results['score'] > 0
    
    print(f"✅ Image Analyzer funziona (Score: {results['score']}/100)")
except Exception as e:
    print(f"❌ Errore Image Analyzer: {e}")
    sys.exit(1)

# Test mobile analyzer
print("\n📦 Test 6: Mobile Analyzer")
try:
    html_mobile = """
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            @media (max-width: 768px) {
                body { font-size: 16px; }
            }
        </style>
    </head>
    <body>Content</body>
    </html>
    """
    
    analyzer = MobileAnalyzer(config)
    results = analyzer.analyze(html_mobile, 'https://test.com')
    
    assert results['viewport']['exists'] == True
    assert results['responsive']['has_media_queries'] == True
    assert results['score'] > 0
    
    print(f"✅ Mobile Analyzer funziona (Score: {results['score']}/100)")
except Exception as e:
    print(f"❌ Errore Mobile Analyzer: {e}")
    sys.exit(1)

# Test scorer
print("\n📦 Test 7: SEO Scorer")
try:
    scorer = SEOScorer(config)
    
    test_scores = {
        'content': 85,
        'images': 70,
        'links': 80,
        'performance': 65,
        'mobile': 90,
        'structure': 75
    }
    
    global_score = scorer.calculate_global_score(test_scores)
    rating = scorer.get_rating(global_score)
    
    assert 0 <= global_score <= 100
    assert rating in ['Eccellente', 'Buono', 'Medio', 'Scarso', 'Critico']
    
    print(f"✅ SEO Scorer funziona (Test Score: {global_score}/100 - {rating})")
except Exception as e:
    print(f"❌ Errore SEO Scorer: {e}")
    sys.exit(1)

# Test reporter
print("\n📦 Test 8: SEO Reporter")
try:
    reporter = SEOReporter(config)
    
    test_results = {
        'url': 'https://test.com',
        'global_score': 78,
        'rating': 'Buono',
        'rating_emoji': '✅',
        'category_scores': test_scores,
        'all_issues': [
            {
                'severity': 'critical',
                'category': 'content',
                'message': 'Test issue critico',
                'recommendation': 'Test raccomandazione',
                'impact': 'Alto'
            }
        ]
    }
    
    console_report = reporter.generate_console_report(test_results)
    json_report = reporter.generate_json_report(test_results)
    html_report = reporter.generate_html_report(test_results)
    
    assert len(console_report) > 0
    assert 'global_score' in json_report
    assert '<html' in html_report
    
    print("✅ SEO Reporter funziona (Console, JSON, HTML)")
except Exception as e:
    print(f"❌ Errore SEO Reporter: {e}")
    sys.exit(1)

# Test file esempio
print("\n📦 Test 9: Analisi File Esempio")
try:
    example_file = Path('examples/test-page.html')
    if example_file.exists():
        from seo_analyzer import SEOAnalyzer
        analyzer = SEOAnalyzer()
        results = analyzer.analyze_file(str(example_file))
        
        assert results['global_score'] > 0
        assert 'content' in results
        
        print(f"✅ Analisi file esempio completata (Score: {results['global_score']}/100)")
    else:
        print("⚠️  File esempio non trovato, skip")
except Exception as e:
    print(f"❌ Errore analisi file: {e}")
    sys.exit(1)

# Riepilogo
print("\n" + "=" * 70)
print("🎉 TUTTI I TEST SUPERATI!")
print("=" * 70)
print("\n✅ SEO Analyzer è pronto all'uso")
print("💡 Esegui: python seo_analyzer.py --help per iniziare")
print("")

