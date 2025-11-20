#!/usr/bin/env python3
"""
Simple WSI to DZI converter
Usage: python3 convert.py <input_file> <output_dir> <output_name>
"""

import sys
import os
from pathlib import Path

try:
    import openslide
    from openslide import deepzoom
except ImportError:
    print("ERROR: OpenSlide not installed", file=sys.stderr)
    sys.exit(1)

def convert_to_dzi(input_path, output_dir, output_name):
    """Convert a slide to DZI format"""
    
    print(f"Opening slide: {input_path}")
    slide = openslide.OpenSlide(input_path)
    
    print(f"Slide dimensions: {slide.dimensions}")
    print(f"Levels: {slide.level_count}")
    
    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    
    dzi_file = output_path / f"{output_name}.dzi"
    tiles_dir = output_path / f"{output_name}_files"
    tiles_dir.mkdir(exist_ok=True)
    
    # Create Deep Zoom generator
    dzi = deepzoom.DeepZoomGenerator(slide, tile_size=254, overlap=1, limit_bounds=True)
    
    print(f"Generating tiles for {dzi.level_count} levels...")
    
    # Generate all tiles
    for level in range(dzi.level_count):
        level_dir = tiles_dir / str(level)
        level_dir.mkdir(exist_ok=True)
        
        cols, rows = dzi.level_tiles[level]
        for col in range(cols):
            for row in range(rows):
                tile = dzi.get_tile(level, (col, row))
                tile_path = level_dir / f"{col}_{row}.jpeg"
                tile.save(tile_path, "JPEG", quality=90)
        
        print(f"  Level {level}: {cols}x{rows} tiles")
    
    # Create DZI XML file
    dzi_xml = f'''<?xml version="1.0" encoding="utf-8"?>
<Image xmlns="http://schemas.microsoft.com/deepzoom/2008"
  Format="jpeg"
  Overlap="1"
  TileSize="254">
  <Size Height="{dzi.level_dimensions[-1][1]}"
    Width="{dzi.level_dimensions[-1][0]}" />
</Image>'''
    
    with open(dzi_file, 'w') as f:
        f.write(dzi_xml)
    
    print(f"SUCCESS: Created {dzi_file}")
    return str(dzi_file)

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 convert.py <input_file> <output_dir> <output_name>")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_dir = sys.argv[2]
    output_name = sys.argv[3]
    
    try:
        convert_to_dzi(input_file, output_dir, output_name)
    except Exception as e:
        print(f"ERROR: {e}", file=sys.stderr)
        sys.exit(1)
