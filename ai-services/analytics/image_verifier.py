"""
Image Verifier
Verify image authenticity and detect manipulations
"""

import base64
from io import BytesIO
from PIL import Image
import hashlib

class ImageVerifier:
    def __init__(self):
        self.max_size = 10 * 1024 * 1024  # 10MB
        self.allowed_formats = ['JPEG', 'PNG', 'GIF', 'WEBP']

    def verify_image(self, image_data):
        """
        Verify image authenticity and content
        
        Args:
            image_data (str): Base64 encoded image
            
        Returns:
            dict: Verification results
        """
        try:
            # Decode base64
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            
            img_bytes = base64.b64decode(image_data)
            
            # Check size
            if len(img_bytes) > self.max_size:
                return {
                    'is_valid': False,
                    'has_manipulation': False,
                    'content_type': None,
                    'confidence': 0,
                    'error': 'Image too large'
                }

            # Open image
            img = Image.open(BytesIO(img_bytes))
            
            # Check format
            if img.format not in self.allowed_formats:
                return {
                    'is_valid': False,
                    'has_manipulation': False,
                    'content_type': img.format,
                    'confidence': 0,
                    'error': 'Unsupported format'
                }

            # Basic manipulation detection (simplified)
            has_manipulation = self._detect_manipulation(img, img_bytes)

            return {
                'is_valid': True,
                'has_manipulation': has_manipulation,
                'content_type': img.format,
                'confidence': 0.85 if not has_manipulation else 0.60,
                'dimensions': {'width': img.width, 'height': img.height},
                'size_bytes': len(img_bytes)
            }

        except Exception as e:
            return {
                'is_valid': False,
                'has_manipulation': False,
                'content_type': None,
                'confidence': 0,
                'error': str(e)
            }

    def _detect_manipulation(self, img, img_bytes):
        """
        Detect potential image manipulation
        Simple heuristics-based detection
        """
        # Check for EXIF data inconsistencies
        exif = img.getexif()
        
        # If EXIF data is completely missing, might be manipulated
        if exif is None or len(exif) == 0:
            return True

        # Check for unusual aspect ratios
        aspect_ratio = img.width / img.height
        if aspect_ratio > 10 or aspect_ratio < 0.1:
            return True

        # Check for compression artifacts (simplified)
        # Real implementation would use ELA or other forensic techniques
        
        return False

    def get_image_hash(self, image_data):
        """Generate hash of image for deduplication"""
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        
        img_bytes = base64.b64decode(image_data)
        return hashlib.sha256(img_bytes).hexdigest()
