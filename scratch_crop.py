import sys
from PIL import Image
import numpy as np

def process_logo(input_path, output_path):
    # Open image and convert to RGBA
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Extract color channels
    r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]
    
    # Define thresholds
    # White background: R,G,B are all high (e.g., > 230)
    is_white = (r > 230) & (g > 230) & (b > 230)
    
    # Dark blue text: R and G are low, B might be slightly higher but overall dark.
    is_dark = (r < 100) & (g < 100) & (b < 150)
    
    # Process the image:
    # 1. Make white background transparent
    data[is_white, 3] = 0
    
    # 2. Convert dark blue to white for visibility on dark background
    data[is_dark, 0] = 255
    data[is_dark, 1] = 255
    data[is_dark, 2] = 255
    
    # Find bounding box of non-transparent pixels for cropping
    # Need to check pixels where alpha is > 0
    alpha = data[:,:,3]
    non_empty_columns = np.where(alpha.max(axis=0) > 0)[0]
    non_empty_rows = np.where(alpha.max(axis=1) > 0)[0]
    
    if len(non_empty_columns) == 0 or len(non_empty_rows) == 0:
        print("Image is entirely transparent/white!")
        return
        
    cropBox = (min(non_empty_columns), min(non_empty_rows), max(non_empty_columns), max(non_empty_rows))
    
    # Add a small padding
    pad = 10
    cropBox = (
        max(0, cropBox[0] - pad), 
        max(0, cropBox[1] - pad), 
        min(data.shape[1], cropBox[2] + pad), 
        min(data.shape[0], cropBox[3] + pad)
    )
    
    # Crop the image array
    cropped_data = data[cropBox[1]:cropBox[3]+1, cropBox[0]:cropBox[2]+1]
    
    # Save the result
    out_img = Image.fromarray(cropped_data)
    out_img.save(output_path, "PNG")
    print(f"Saved optimized logo to {output_path} (size: {out_img.size})")

if __name__ == "__main__":
    process_logo("image.png", "public/logo.png")
