# Data Ingestion Scripts

## Quick Start

```bash
# Ingest test data into running backend
python scripts/ingest_data.py --dataset minimal --clear
```

## Convert JSON to CSV

```bash
python scripts/json_to_csv.py <json_file> <output_dir>
```

Example:
```bash
python scripts/json_to_csv.py backend/core/fixtures/sample_data.json testdata/minimal/
```

## Ingest CSV Data

```bash
python scripts/ingest_data.py --dataset <dataset_name> [--clear] [--api-url <url>]
```

Examples:
```bash
# Basic ingestion
python scripts/ingest_data.py --dataset minimal

# Clear existing data first
python scripts/ingest_data.py --dataset minimal --clear

# Custom API URL
python scripts/ingest_data.py --dataset minimal --api-url http://localhost:8000
```

## Create New Dataset

```bash
cp -r testdata/minimal testdata/my-dataset
# Edit CSV files in testdata/my-dataset/
python scripts/ingest_data.py --dataset my-dataset
```
