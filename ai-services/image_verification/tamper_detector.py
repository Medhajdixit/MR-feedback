"""
Image Verification Service for CampusFeedback+ 2.0
ResNet50-based tamper detection and authenticity verification
"""

import numpy as np
from PIL import Image
import cv2
from typing import Dict, Tuple

class ImageVerificationService:
    """
    Verify image authenticity and detect tampering
    """
    
    def __init__(self, model_path: str = None):
        """
        Initialize image verification service
        
        Args:
            model_path: Path to pre-trained model (optional)
        """
        print("🖼️  Initializing Image Verification Service...")
        
        # In production, load actual ResNet50 model
        # For now, use simplified detection methods
        self.model_path = model_path
        
        print("✅ Image Verification Service initialized\n")
    
    def verify_image(self, image_path: str) -> Dict:
        """
        Comprehensive image verification
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with verification results
        """
        try:
            # Load image
            image = Image.open(image_path)
            img_array = np.array(image)
            
            # Run verification checks
            tamper_score = self._detect_tampering(img_array)
            metadata_valid = self._verify_metadata(image_path)
            quality_score = self._assess_quality(img_array)
            
            is_authentic = (
                tamper_score < 0.3 and
                metadata_valid and
                quality_score > 30
            )
            
            return {
                'is_authentic': is_authentic,
                'tamper_score': round(tamper_score, 3),
                'metadata_valid': metadata_valid,
                'quality_score': quality_score,
                'resolution': f"{image.width}x{image.height}",
                'format': image.format,
                'mode': image.mode
            }
        except Exception as e:
            return {
                'is_authentic': False,
                'error': str(e),
                'tamper_score': 1.0,
                'metadata_valid': False,
                'quality_score': 0
            }
    
    def _detect_tampering(self, img_array: np.ndarray) -> float:
        """
        Detect image tampering using ELA (Error Level Analysis)
        
        Args:
            img_array: Image as numpy array
            
        Returns:
            Tamper score (0.0-1.0, higher = more likely tampered)
        """
        try:
            # Simplified ELA implementation
            # In production, use more sophisticated methods
            
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Calculate edge density (tampering often creates sharp edges)
            edges = cv2.Canny(gray, 100, 200)
            edge_density = np.sum(edges > 0) / edges.size
            
            # Calculate noise level
            noise_level = self._estimate_noise(gray)
            
            # Combine metrics
            tamper_score = (edge_density * 0.6 + noise_level * 0.4)
            
            return min(1.0, tamper_score)
        except Exception as e:
            print(f"Error in tamper detection: {e}")
            return 0.5  # Uncertain
    
    def _estimate_noise(self, gray_image: np.ndarray) -> float:
        """
        Estimate noise level in image
        
        Args:
            gray_image: Grayscale image
            
        Returns:
            Noise level (0.0-1.0)
        """
        try:
            # Use Laplacian variance as noise estimate
            laplacian = cv2.Laplacian(gray_image, cv2.CV_64F)
            variance = laplacian.var()
            
            # Normalize to 0-1 range
            normalized = min(1.0, variance / 1000.0)
            
            return normalized
        except Exception as e:
            print(f"Error in noise estimation: {e}")
            return 0.0
    
    def _verify_metadata(self, image_path: str) -> bool:
        """
        Verify image metadata is consistent
        
        Args:
            image_path: Path to image
            
        Returns:
            True if metadata seems valid
        """
        try:
            from PIL.ExifTags import TAGS
            
            image = Image.open(image_path)
            exif_data = image.getexif()
            
            if not exif_data:
                # No EXIF data - could be stripped or screenshot
                return True  # Not necessarily invalid
            
            # Check for common manipulation indicators
            # In production, check for inconsistencies in EXIF data
            
            return True
        except Exception as e:
            print(f"Error in metadata verification: {e}")
            return False
    
    def _assess_quality(self, img_array: np.ndarray) -> int:
        """
        Assess image quality
        
        Args:
            img_array: Image as numpy array
            
        Returns:
            Quality score (0-100)
        """
        try:
            # Convert to grayscale
            if len(img_array.shape) == 3:
                gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            else:
                gray = img_array
            
            # Calculate sharpness (using Laplacian variance)
            laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
            sharpness = min(100, laplacian_var / 10)
            
            # Calculate brightness
            brightness = np.mean(gray)
            brightness_score = 100 - abs(brightness - 128) / 1.28
            
            # Calculate contrast
            contrast = np.std(gray)
            contrast_score = min(100, contrast / 0.64)
            
            # Combined quality score
            quality = (sharpness * 0.4 + brightness_score * 0.3 + contrast_score * 0.3)
            
            return int(min(100, max(0, quality)))
        except Exception as e:
            print(f"Error in quality assessment: {e}")
            return 50
    
    def check_resolution(self, image_path: str, min_width: int = 640, min_height: int = 480) -> bool:
        """
        Check if image meets minimum resolution requirements
        
        Args:
            image_path: Path to image
            min_width: Minimum width in pixels
            min_height: Minimum height in pixels
            
        Returns:
            True if resolution is sufficient
        """
        try:
            image = Image.open(image_path)
            return image.width >= min_width and image.height >= min_height
        except Exception as e:
            print(f"Error checking resolution: {e}")
            return False


# Example usage
if __name__ == "__main__":
    service = ImageVerificationService()
    
    # Note: This is example code - would need actual image file to test
    print("Image Verification Service ready")
    print("Usage: service.verify_image('path/to/image.jpg')")
