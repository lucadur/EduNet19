"""
Parser - Parser HTML avanzato
"""

from bs4 import BeautifulSoup
from typing import Dict


class HTMLParser:
    """Parser HTML per estrazione dati"""
    
    def __init__(self):
        pass
    
    def parse(self, html: str) -> BeautifulSoup:
        """Parse HTML con BeautifulSoup"""
        return BeautifulSoup(html, 'lxml')
    
    def extract_text(self, html: str) -> str:
        """Estrae tutto il testo dalla pagina"""
        soup = self.parse(html)
        return soup.get_text()
    
    def extract_meta_tags(self, html: str) -> Dict:
        """Estrae tutti i meta tag"""
        soup = self.parse(html)
        meta_tags = {}
        
        for meta in soup.find_all('meta'):
            name = meta.get('name') or meta.get('property')
            content = meta.get('content')
            
            if name and content:
                meta_tags[name] = content
        
        return meta_tags
    
    def extract_headings(self, html: str) -> Dict:
        """Estrae tutti gli heading"""
        soup = self.parse(html)
        headings = {}
        
        for level in range(1, 7):
            headings[f'h{level}'] = [
                h.get_text().strip() 
                for h in soup.find_all(f'h{level}')
            ]
        
        return headings

