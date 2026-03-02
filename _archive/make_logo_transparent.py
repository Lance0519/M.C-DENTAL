#!/usr/bin/env python3
"""
Script to make logo images transparent by removing white/light backgrounds
Supports PNG, JPG, and other image formats
Requires: pip install Pillow
"""

from PIL import Image
import os
import sys

def make_transparent(input_path, output_path=None, tolerance=30, background_color=(255, 255, 255)):
    """
    Make white/light background transparent in an image
    
    Args:
        input_path: Path to input image file
        output_path: Path to output image file (if None, adds '_transparent' to filename)
        tolerance: How close to background color should be made transparent (0-255)
        background_color: RGB color to make transparent (default: white)
    """
    try:
        # Open the image
        img = Image.open(input_path)
        
        # Convert to RGBA if not already
        if img.mode != 'RGBA':
            img = img.convert('RGBA')
        
        # Get image data
        data = img.getdata()
        
        # Create new image data with transparency
        new_data = []
        bg_r, bg_g, bg_b = background_color
        
        for item in data:
            # item is (R, G, B, A) for RGBA
            if len(item) == 4:
                r, g, b, a = item
            else:
                r, g, b = item
                a = 255
            
            # Calculate distance from background color
            distance = ((bg_r - r) ** 2 + (bg_g - g) ** 2 + (bg_b - b) ** 2) ** 0.5
            
            # If close to background color, make transparent
            if distance < tolerance:
                new_data.append((r, g, b, 0))  # Fully transparent
            else:
                new_data.append((r, g, b, a))  # Keep original with alpha
        
        # Update image with new data
        img.putdata(new_data)
        
        # Determine output path
        if output_path is None:
            base, ext = os.path.splitext(input_path)
            output_path = f"{base}_transparent{ext}"
        
        # Save the image (always save as PNG to preserve transparency)
        if not output_path.lower().endswith('.png'):
            base, _ = os.path.splitext(output_path)
            output_path = f"{base}.png"
        
        img.save(output_path, 'PNG')
        
        print(f"✅ Success! Transparent logo saved to: {output_path}")
        return output_path
        
    except FileNotFoundError:
        print(f"❌ Error: File not found: {input_path}")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def process_multiple_files(file_paths, tolerance=30, background_color=(255, 255, 255)):
    """Process multiple logo files at once"""
    results = []
    for file_path in file_paths:
        print(f"\nProcessing: {file_path}")
        result = make_transparent(file_path, tolerance=tolerance, background_color=background_color)
        if result:
            results.append(result)
    return results

if __name__ == '__main__':
    # Default logo files to process
    logo_files = [
        'assets/images/logo.png',
        'assets/images/blogo.png',
        'frontend/public/assets/images/logo.png',
        'frontend/public/assets/images/blogo.png',
    ]
    
    # Filter to only existing files
    existing_files = [f for f in logo_files if os.path.exists(f)]
    
    if not existing_files:
        print("❌ No logo files found in default locations")
        print("\nUsage:")
        print("  python make_logo_transparent.py [image_path1] [image_path2] ...")
        print("\nOr edit the script to specify your logo file paths")
        sys.exit(1)
    
    print("=" * 60)
    print("Making logos transparent...")
    print("=" * 60)
    print(f"\nFound {len(existing_files)} logo file(s) to process:")
    for f in existing_files:
        print(f"  - {f}")
    
    # You can adjust these parameters:
    tolerance = 30  # How close to white should be transparent (0-255)
    # Lower values = only pure white becomes transparent
    # Higher values = more colors close to white become transparent
    
    background_color = (255, 255, 255)  # White background (RGB)
    # You can change this to remove other background colors, e.g.:
    # background_color = (240, 240, 240)  # Light gray
    
    print(f"\nSettings:")
    print(f"  Tolerance: {tolerance}")
    print(f"  Background color: RGB{background_color}")
    print()
    
    # Process all logo files
    results = process_multiple_files(existing_files, tolerance=tolerance, background_color=background_color)
    
    if results:
        print("\n" + "=" * 60)
        print("✅ All logos processed successfully!")
        print("=" * 60)
        print("\nProcessed files:")
        for result in results:
            print(f"  ✓ {result}")
        print("\nYou can now:")
        print("1. Review the new transparent logo files")
        print("2. Replace the original files if they look good")
        print("3. Update your code to use the transparent versions")
    else:
        print("\n❌ Failed to process logos")
        print("\nMake sure you have Pillow installed:")
        print("  pip install Pillow")
