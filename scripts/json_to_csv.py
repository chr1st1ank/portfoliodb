#!/usr/bin/env python3
"""
Convert Django fixture JSON to CSV files for easier editing.

Usage:
    python scripts/json_to_csv.py <json_file> <output_dir>
    
Example:
    python scripts/json_to_csv.py backend/core/fixtures/sample_data.json testdata/minimal/
"""

import argparse
import csv
import json
from pathlib import Path
from typing import Any


def convert_fixture_to_csv(json_path: Path, output_dir: Path) -> None:
    """Convert Django fixture JSON to separate CSV files per model."""
    
    # Load JSON data
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Group records by model
    models: dict[str, list[dict[str, Any]]] = {}
    for record in data:
        model_name = record['model'].split('.')[-1]
        if model_name not in models:
            models[model_name] = []
        
        # Flatten the record structure
        flat_record = {'id': record.get('pk')}
        flat_record.update(record['fields'])
        models[model_name].append(flat_record)
    
    # Create output directory
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Write each model to a CSV file
    for model_name, records in models.items():
        csv_path = output_dir / f"{model_name}s.csv"
        
        if not records:
            continue
        
        # Get all unique field names
        fieldnames = list(records[0].keys())
        
        # Write CSV
        with open(csv_path, 'w', newline='') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(records)
        
        print(f"✓ Created {csv_path} ({len(records)} records)")


def main():
    parser = argparse.ArgumentParser(
        description='Convert Django fixture JSON to CSV files'
    )
    parser.add_argument(
        'json_file',
        type=Path,
        help='Path to Django fixture JSON file'
    )
    parser.add_argument(
        'output_dir',
        type=Path,
        help='Output directory for CSV files'
    )
    
    args = parser.parse_args()
    
    if not args.json_file.exists():
        print(f"Error: JSON file not found: {args.json_file}")
        return 1
    
    convert_fixture_to_csv(args.json_file, args.output_dir)
    print(f"\n✓ Conversion complete! CSV files saved to {args.output_dir}")
    return 0


if __name__ == '__main__':
    exit(main())
