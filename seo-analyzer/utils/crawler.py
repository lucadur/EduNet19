"""
Crawler - Spider per crawling siti web statici
"""

import requests
from urllib.parse import urljoin, urlparse
from bs4 import BeautifulSoup
from typing import List, Set, Dict
import time


class Crawler:
    """Crawler per siti web statici"""
    
    def __init__(self, config: Dict = None):
        self.config = config or {}
        self.visited_urls: Set[str] = set()
        self.pages: List[Dict] = []
        
    def crawl_site(self, start_url: str, max_pages: int = 100) -> List[Dict]:
        """
        Crawl intero sito partendo da start_url
        
        Args:
            start_url: URL di partenza
            max_pages: Numero massimo di pagine da crawlare
            
        Returns:
            Lista di dizionari con url e html
        """
        base_domain = urlparse(start_url).netloc
        to_visit = [start_url]
        
        while to_visit and len(self.pages) < max_pages:
            url = to_visit.pop(0)
            
            if url in self.visited_urls:
                continue
            
            try:
                print(f"🔍 Crawling: {url}")
                html = self._fetch_page(url)
                
                if html:
                    self.pages.append({
                        'url': url,
                        'html': html
                    })
                    self.visited_urls.add(url)
                    
                    # Trova link interni
                    internal_links = self._extract_internal_links(html, url, base_domain)
                    
                    # Aggiungi nuovi link alla coda
                    for link in internal_links:
                        if link not in self.visited_urls and link not in to_visit:
                            to_visit.append(link)
                
                # Rate limiting
                time.sleep(0.5)
            
            except Exception as e:
                print(f"❌ Errore crawling {url}: {e}")
                continue
        
        return self.pages
    
    def _fetch_page(self, url: str) -> str:
        """Scarica HTML di una pagina"""
        try:
            user_agent = self.config.get('user_agent', 'SEO-Analyzer-Bot/1.0')
            timeout = self.config.get('timeout_seconds', 30)
            
            headers = {
                'User-Agent': user_agent
            }
            
            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()
            
            return response.text
        
        except Exception:
            return None
    
    def _extract_internal_links(self, html: str, current_url: str, base_domain: str) -> List[str]:
        """Estrae link interni dalla pagina"""
        soup = BeautifulSoup(html, 'lxml')
        links = []
        
        for a_tag in soup.find_all('a', href=True):
            href = a_tag['href']
            
            # Salta anchor e javascript
            if href.startswith('#') or href.startswith('javascript:'):
                continue
            
            # Risolvi URL assoluto
            absolute_url = urljoin(current_url, href)
            link_domain = urlparse(absolute_url).netloc
            
            # Solo link interni
            if link_domain == base_domain:
                # Rimuovi fragment
                clean_url = absolute_url.split('#')[0]
                links.append(clean_url)
        
        return list(set(links))

