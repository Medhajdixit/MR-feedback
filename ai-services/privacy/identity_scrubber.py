"""
Privacy Protection Services for CampusFeedback+ 2.0
Identity scrubbing, pattern anonymization, and metadata sanitization
"""

import re
import hashlib
from typing import Dict, List, Tuple
import spacy

class IdentityScrubber:
    """
    Remove personally identifiable information from text
    """
    
    def __init__(self):
        """Initialize NER model for PII detection"""
        print("🔒 Initializing Identity Scrubber...")
        self.nlp = spacy.load("en_core_web_sm")
        print("✅ Identity Scrubber initialized\n")
    
    def scrub(self, text: str) -> Tuple[str, List[str]]:
        """
        Remove PII from text
        
        Args:
            text: Input text
            
        Returns:
            Tuple of (scrubbed_text, list_of_removed_entities)
        """
        removed_entities = []
        scrubbed_text = text
        
        # Use NER to detect and replace named entities
        doc = self.nlp(text)
        
        for ent in doc.ents:
            if ent.label_ in ['PERSON', 'ORG', 'GPE']:
                replacement = f"[{ent.label_}]"
                scrubbed_text = scrubbed_text.replace(ent.text, replacement)
                removed_entities.append(f"{ent.text} ({ent.label_})")
        
        # Remove email addresses
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, scrubbed_text)
        scrubbed_text = re.sub(email_pattern, '[EMAIL]', scrubbed_text)
        removed_entities.extend([f"{email} (EMAIL)" for email in emails])
        
        # Remove phone numbers
        phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
        phones = re.findall(phone_pattern, scrubbed_text)
        scrubbed_text = re.sub(phone_pattern, '[PHONE]', scrubbed_text)
        removed_entities.extend([f"{phone} (PHONE)" for phone in phones])
        
        # Remove student IDs (6-10 digit numbers)
        id_pattern = r'\b\d{6,10}\b'
        ids = re.findall(id_pattern, scrubbed_text)
        scrubbed_text = re.sub(id_pattern, '[ID]', scrubbed_text)
        removed_entities.extend([f"{id_num} (ID)" for id_num in ids])
        
        # Remove URLs
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, scrubbed_text)
        scrubbed_text = re.sub(url_pattern, '[URL]', scrubbed_text)
        removed_entities.extend([f"{url} (URL)" for url in urls])
        
        return scrubbed_text, removed_entities


class PatternAnonymizer:
    """
    Normalize writing patterns to prevent author identification
    """
    
    def __init__(self):
        """Initialize pattern anonymizer"""
        print("🎭 Initializing Pattern Anonymizer...")
        print("✅ Pattern Anonymizer initialized\n")
    
    def anonymize(self, text: str) -> str:
        """
        Normalize text patterns
        
        Args:
            text: Input text
            
        Returns:
            Anonymized text
        """
        anonymized = text
        
        # Normalize punctuation
        anonymized = self._normalize_punctuation(anonymized)
        
        # Normalize capitalization
        anonymized = self._normalize_capitalization(anonymized)
        
        # Remove unique linguistic markers
        anonymized = self._remove_unique_markers(anonymized)
        
        return anonymized
    
    def _normalize_punctuation(self, text: str) -> str:
        """Standardize punctuation usage"""
        # Replace multiple exclamation marks with single
        text = re.sub(r'!+', '!', text)
        
        # Replace multiple question marks with single
        text = re.sub(r'\?+', '?', text)
        
        # Normalize ellipsis
        text = re.sub(r'\.{2,}', '...', text)
        
        # Remove excessive spaces
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def _normalize_capitalization(self, text: str) -> str:
        """Standardize capitalization"""
        # Convert to sentence case (first letter capitalized)
        sentences = re.split(r'([.!?]+\s+)', text)
        normalized = []
        
        for i, sentence in enumerate(sentences):
            if i % 2 == 0 and sentence.strip():  # Actual sentence, not delimiter
                # Capitalize first letter, lowercase rest
                sentence = sentence.strip()
                if sentence:
                    sentence = sentence[0].upper() + sentence[1:].lower()
                normalized.append(sentence)
            else:
                normalized.append(sentence)
        
        return ' '.join(normalized)
    
    def _remove_unique_markers(self, text: str) -> str:
        """Remove unique linguistic fingerprints"""
        # Remove emoticons and emojis (simplified)
        text = re.sub(r'[:;]-?[)(\[\]{}|\\\/]', '', text)
        
        # Remove slang markers
        slang_patterns = [
            (r'\blol\b', ''),
            (r'\blmao\b', ''),
            (r'\bomg\b', ''),
            (r'\bbtw\b', 'by the way'),
            (r'\bidk\b', "I don't know"),
        ]
        
        for pattern, replacement in slang_patterns:
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
        
        return text.strip()


class MetadataSanitizer:
    """
    Strip revealing metadata from files and content
    """
    
    def __init__(self):
        """Initialize metadata sanitizer"""
        print("🧹 Initializing Metadata Sanitizer...")
        print("✅ Metadata Sanitizer initialized\n")
    
    def sanitize_image_metadata(self, image_path: str) -> Dict:
        """
        Remove EXIF data from images
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with sanitization results
        """
        try:
            from PIL import Image
            from PIL.ExifTags import TAGS
            
            # Open image
            image = Image.open(image_path)
            
            # Get EXIF data
            exif_data = image.getexif()
            
            removed_tags = []
            if exif_data:
                for tag_id, value in exif_data.items():
                    tag = TAGS.get(tag_id, tag_id)
                    removed_tags.append(tag)
                
                # Create new image without EXIF
                data = list(image.getdata())
                image_without_exif = Image.new(image.mode, image.size)
                image_without_exif.putdata(data)
                
                # Save without EXIF
                image_without_exif.save(image_path)
            
            return {
                'success': True,
                'removed_tags': removed_tags,
                'count': len(removed_tags)
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'count': 0
            }
    
    def sanitize_timestamp(self, timestamp: int) -> int:
        """
        Round timestamp to nearest hour to prevent timing attacks
        
        Args:
            timestamp: Unix timestamp
            
        Returns:
            Rounded timestamp
        """
        # Round to nearest hour (3600 seconds)
        return (timestamp // 3600) * 3600
    
    def generate_anonymous_id(self, user_address: str, content: str) -> str:
        """
        Generate anonymous but consistent ID for content
        
        Args:
            user_address: User's wallet address
            content: Content text
            
        Returns:
            Anonymous ID hash
        """
        # Create hash from user + content + salt
        salt = "campusfeedback_anonymous"
        data = f"{user_address}{content}{salt}"
        return hashlib.sha256(data.encode()).hexdigest()[:16]


# Example usage
if __name__ == "__main__":
    # Test identity scrubber
    scrubber = IdentityScrubber()
    test_text = "My name is John Smith and my email is john.smith@university.edu. Call me at 555-123-4567."
    scrubbed, removed = scrubber.scrub(test_text)
    print("Original:", test_text)
    print("Scrubbed:", scrubbed)
    print("Removed:", removed)
    
    print("\n" + "="*60 + "\n")
    
    # Test pattern anonymizer
    anonymizer = PatternAnonymizer()
    test_text2 = "OMG!!! This is TERRIBLE!!! lol btw idk what to do..."
    anonymized = anonymizer.anonymize(test_text2)
    print("Original:", test_text2)
    print("Anonymized:", anonymized)
    
    print("\n" + "="*60 + "\n")
    
    # Test metadata sanitizer
    sanitizer = MetadataSanitizer()
    anon_id = sanitizer.generate_anonymous_id("0x1234...", "Test content")
    print("Anonymous ID:", anon_id)
