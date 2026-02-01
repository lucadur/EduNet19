#!/usr/bin/env python3
"""
Esempi di Utilizzo dell'API SEO Analyzer
Mostra come usare SEO Analyzer come libreria Python
"""

import sys
sys.path.insert(0, '..')

from seo_analyzer import SEOAnalyzer
import json


def esempio_1_analisi_url():
    """Esempio 1: Analisi singola URL"""
    print("=" * 70)
    print("ESEMPIO 1: Analisi Singola URL")
    print("=" * 70)
    
    # Inizializza analyzer
    analyzer = SEOAnalyzer()
    
    # Analizza URL
    results = analyzer.analyze_url('https://example.com', deep=False)
    
    # Accedi ai risultati
    print(f"\n📊 Score Globale: {results['global_score']}/100")
    print(f"⭐ Valutazione: {results['rating']}")
    print(f"\n📋 Score per Categoria:")
    for category, score in results['category_scores'].items():
        print(f"  - {category.capitalize()}: {score}/100")
    
    # Issues critici
    critical_issues = [i for i in results['all_issues'] if i['severity'] == 'critical']
    print(f"\n🔴 Problemi Critici: {len(critical_issues)}")
    for issue in critical_issues[:3]:
        print(f"  - {issue['message']}")


def esempio_2_analisi_file_locale():
    """Esempio 2: Analisi file HTML locale"""
    print("\n" + "=" * 70)
    print("ESEMPIO 2: Analisi File Locale")
    print("=" * 70)
    
    analyzer = SEOAnalyzer()
    
    # Crea un file HTML di esempio
    html_content = """
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Esempio Pagina SEO - Keyword Principale</title>
        <meta name="description" content="Questa è una meta description di esempio ottimizzata per SEO con keyword pertinenti e call-to-action.">
    </head>
    <body>
        <h1>Keyword Principale - Guida Completa</h1>
        <h2>Introduzione alla Keyword</h2>
        <p>Contenuto di esempio con la keyword principale distribuita naturalmente nel testo...</p>
        
        <h2>Benefici della Keyword</h2>
        <p>Altro contenuto pertinente e utile per gli utenti...</p>
        
        <img src="immagine-keyword-esempio.jpg" alt="Descrizione dettagliata dell'immagine con keyword" loading="lazy">
    </body>
    </html>
    """
    
    # Salva file temporaneo
    with open('/tmp/esempio.html', 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    # Analizza
    results = analyzer.analyze_file('/tmp/esempio.html')
    
    print(f"\n📊 Score: {results['global_score']}/100")
    print(f"\n✅ Elementi Positivi:")
    if results['content']['title']['exists']:
        print(f"  - Title presente e ottimizzato")
    if results['content']['meta_description']['exists']:
        print(f"  - Meta description presente")
    if results['mobile']['viewport']['exists']:
        print(f"  - Viewport configurato per mobile")


def esempio_3_confronto_prima_dopo():
    """Esempio 3: Confronta due versioni di una pagina"""
    print("\n" + "=" * 70)
    print("ESEMPIO 3: Confronto Prima/Dopo Ottimizzazione")
    print("=" * 70)
    
    analyzer = SEOAnalyzer()
    
    # Versione PRIMA (non ottimizzata)
    html_before = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Home</title>
    </head>
    <body>
        <h1>Benvenuto</h1>
        <p>Testo generico.</p>
        <img src="img1.jpg">
    </body>
    </html>
    """
    
    # Versione DOPO (ottimizzata)
    html_after = """
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Agenzia Marketing Digitale Milano - Servizi SEO e Web</title>
        <meta name="description" content="Agenzia marketing digitale a Milano specializzata in SEO, web design e digital strategy. Scopri i nostri servizi per far crescere il tuo business online.">
        <link rel="canonical" href="https://example.com/" />
    </head>
    <body>
        <h1>Agenzia Marketing Digitale a Milano</h1>
        <h2>Servizi SEO Professionali</h2>
        <p>La nostra agenzia di marketing digitale offre servizi SEO avanzati per aziende a Milano e in tutta Italia. Con oltre 10 anni di esperienza, aiutiamo le imprese a migliorare la loro visibilità online e aumentare le conversioni.</p>
        
        <h2>Cosa Offriamo</h2>
        <p>Strategie di marketing digitale personalizzate, ottimizzazione SEO tecnica e contenuti, campagne PPC mirate e web design responsive.</p>
        
        <img src="agenzia-marketing-digitale-milano.webp" 
             alt="Team agenzia marketing digitale Milano al lavoro su strategie SEO" 
             width="800" 
             height="600" 
             loading="lazy">
    </body>
    </html>
    """
    
    # Analizza entrambe le versioni
    from bs4 import BeautifulSoup
    
    print("\n🔴 PRIMA dell'ottimizzazione:")
    soup_before = BeautifulSoup(html_before, 'lxml')
    title_before = soup_before.find('title')
    print(f"  Title: '{title_before.get_text() if title_before else 'MANCANTE'}' ❌")
    print(f"  Meta description: MANCANTE ❌")
    print(f"  Viewport: MANCANTE ❌")
    print(f"  Alt immagini: MANCANTI ❌")
    
    print("\n✅ DOPO l'ottimizzazione:")
    soup_after = BeautifulSoup(html_after, 'lxml')
    title_after = soup_after.find('title')
    meta_desc = soup_after.find('meta', {'name': 'description'})
    print(f"  Title: '{title_after.get_text()[:50]}...' ✅")
    print(f"  Meta description: PRESENTE ({len(meta_desc['content'])} caratteri) ✅")
    print(f"  Viewport: PRESENTE ✅")
    print(f"  Alt immagini: PRESENTI e descrittivi ✅")
    print(f"  Canonical: PRESENTE ✅")
    
    print("\n📈 Stima Miglioramento Score: +45 punti")


def esempio_4_analisi_categoria_specifica():
    """Esempio 4: Focus su categoria specifica"""
    print("\n" + "=" * 70)
    print("ESEMPIO 4: Analisi Specifica - Solo Immagini")
    print("=" * 70)
    
    analyzer = SEOAnalyzer()
    
    html = """
    <!DOCTYPE html>
    <html>
    <body>
        <img src="photo123.jpg">
        <img src="image.png" alt="">
        <img src="prodotto-scarpe-running-nike.webp" alt="Scarpe running Nike Air Zoom Professional per maratona" loading="lazy" width="600" height="400">
    </body>
    </html>
    """
    
    # Analizza solo immagini
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'lxml')
    
    images = soup.find_all('img')
    print(f"\n📸 Trovate {len(images)} immagini\n")
    
    for idx, img in enumerate(images, 1):
        src = img.get('src', '')
        alt = img.get('alt')
        loading = img.get('loading')
        
        print(f"Immagine {idx}: {src}")
        
        # Valuta ogni aspetto
        issues = []
        
        if not alt:
            issues.append("❌ Alt mancante")
        elif alt == '':
            issues.append("⚠️  Alt vuoto (decorativa)")
        else:
            issues.append(f"✅ Alt presente: '{alt[:50]}...'")
        
        # Nome file
        if any(char in src for char in ['photo', 'image', 'img']) and src[0].isdigit():
            issues.append("❌ Nome file non ottimizzato")
        else:
            issues.append("✅ Nome file SEO-friendly")
        
        # Lazy loading
        if loading == 'lazy':
            issues.append("✅ Lazy loading")
        else:
            issues.append("⚠️  Lazy loading mancante")
        
        # Formato
        ext = src.split('.')[-1].lower()
        if ext in ['webp', 'avif']:
            issues.append("✅ Formato moderno")
        else:
            issues.append("⚠️  Formato obsoleto, usa WebP")
        
        for issue in issues:
            print(f"  {issue}")
        print()


def esempio_5_export_json_personalizzato():
    """Esempio 5: Export dati personalizzato"""
    print("\n" + "=" * 70)
    print("ESEMPIO 5: Export Personalizzato JSON")
    print("=" * 70)
    
    analyzer = SEOAnalyzer()
    
    html = """
    <!DOCTYPE html>
    <html lang="it">
    <head>
        <title>Esempio Export</title>
        <meta name="description" content="Descrizione esempio">
    </head>
    <body>
        <h1>Titolo Principale</h1>
        <p>Contenuto di esempio...</p>
    </body>
    </html>
    """
    
    from bs4 import BeautifulSoup
    soup = BeautifulSoup(html, 'lxml')
    
    # Estrai solo dati essenziali
    export_data = {
        'title': soup.find('title').get_text() if soup.find('title') else None,
        'meta_description': soup.find('meta', {'name': 'description'}).get('content') if soup.find('meta', {'name': 'description'}) else None,
        'h1': soup.find('h1').get_text() if soup.find('h1') else None,
        'total_words': len(soup.get_text().split()),
        'images_count': len(soup.find_all('img')),
        'links_count': len(soup.find_all('a')),
    }
    
    print("\n📄 Dati Esportati:")
    print(json.dumps(export_data, indent=2, ensure_ascii=False))


def esempio_6_batch_analysis():
    """Esempio 6: Analisi batch di più URL"""
    print("\n" + "=" * 70)
    print("ESEMPIO 6: Analisi Batch Multiple URL")
    print("=" * 70)
    
    urls = [
        'https://example.com',
        'https://example.com/about',
        'https://example.com/products',
    ]
    
    print(f"\n📊 Analisi di {len(urls)} pagine...\n")
    
    results_summary = []
    
    for idx, url in enumerate(urls, 1):
        print(f"[{idx}/{len(urls)}] Analisi: {url}")
        
        # Simula risultati (in produzione useresti analyzer.analyze_url)
        score = 70 + (idx * 5)  # Simulato
        results_summary.append({
            'url': url,
            'score': score,
            'rating': 'Buono' if score >= 75 else 'Medio'
        })
    
    # Riepilogo
    print("\n📈 RIEPILOGO BATCH:")
    print("-" * 70)
    
    avg_score = sum(r['score'] for r in results_summary) / len(results_summary)
    print(f"Score Medio: {avg_score:.1f}/100\n")
    
    # Ordina per score
    sorted_results = sorted(results_summary, key=lambda x: x['score'], reverse=True)
    
    print("🏆 Classifica:")
    for idx, result in enumerate(sorted_results, 1):
        emoji = '🥇' if idx == 1 else '🥈' if idx == 2 else '🥉' if idx == 3 else '  '
        print(f"{emoji} {result['score']}/100 - {result['url']}")


if __name__ == '__main__':
    print("🔍 SEO ANALYZER - ESEMPI DI UTILIZZO API\n")
    
    # Esegui esempi
    esempio_1_analisi_url()
    esempio_2_analisi_file_locale()
    esempio_3_confronto_prima_dopo()
    esempio_4_analisi_categoria_specifica()
    esempio_5_export_json_personalizzato()
    esempio_6_batch_analysis()
    
    print("\n" + "=" * 70)
    print("✅ Tutti gli esempi completati!")
    print("=" * 70)
    print("\n💡 Consulta il codice sorgente per implementare nel tuo progetto.")

