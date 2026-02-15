#!/usr/bin/env python3
"""
Ingest CSV data into the portfolio backend via REST API.

Usage:
    python scripts/ingest_data.py --dataset minimal --api-url http://localhost:8000

Example:
    python scripts/ingest_data.py --dataset minimal
    python scripts/ingest_data.py --dataset minimal --api-url http://localhost:8000 --clear
"""

import argparse
import csv
import sys
from pathlib import Path
from typing import Any

import requests


class DataIngester:
    """Handles ingestion of CSV data into the backend API."""

    def __init__(self, api_base_url: str, verbose: bool = True):
        self.api_base_url = api_base_url.rstrip("/")
        self.verbose = verbose
        self.stats = {
            "actiontypes": {"created": 0, "failed": 0},
            "investments": {"created": 0, "failed": 0},
            "investmentprices": {"created": 0, "failed": 0},
            "movements": {"created": 0, "failed": 0},
        }

    def log(self, message: str) -> None:
        """Print message if verbose mode is enabled."""
        if self.verbose:
            print(message)

    def read_csv(self, csv_path: Path) -> list[dict[str, Any]]:
        """Read CSV file and return list of records."""
        records = []
        with open(csv_path, "r") as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Convert empty strings to None
                record = {k: (v if v != "" else None) for k, v in row.items()}
                records.append(record)
        return records

    def clear_data(self) -> None:
        """Clear existing data from the API (delete all records)."""
        self.log("\n🗑️  Clearing existing data...")

        # Order matters: delete in reverse dependency order
        endpoints = ["movements", "investmentprices", "investments", "actiontypes"]

        for endpoint in endpoints:
            try:
                # Get all records
                response = requests.get(f"{self.api_base_url}/api/{endpoint}/")
                response.raise_for_status()
                records = response.json()

                # Delete each record
                for record in records:
                    record_id = record.get("id")
                    if record_id:
                        delete_response = requests.delete(
                            f"{self.api_base_url}/api/{endpoint}/{record_id}/"
                        )
                        if delete_response.status_code in (204, 200):
                            self.log(f"  ✓ Deleted {endpoint} #{record_id}")
                        else:
                            self.log(f"  ✗ Failed to delete {endpoint} #{record_id}")

            except Exception as e:
                self.log(f"  ⚠️  Error clearing {endpoint}: {e}")

        self.log("✓ Data cleared\n")

    def ingest_actiontypes(self, csv_path: Path) -> dict[int, int]:
        """
        Ingest action types and return mapping of old ID to new ID.
        Returns: {old_id: new_id}
        """
        self.log("\n📥 Ingesting action types...")
        records = self.read_csv(csv_path)
        id_mapping = {}

        for record in records:
            old_id = int(record["id"]) if record.get("id") else None
            payload = {"name": record["name"]}

            try:
                response = requests.post(
                    f"{self.api_base_url}/api/actiontypes/", json=payload
                )
                response.raise_for_status()
                new_id = response.json()["id"]
                id_mapping[old_id] = new_id
                self.stats["actiontypes"]["created"] += 1
                self.log(f"  ✓ Created action type: {record['name']} (ID: {new_id})")
            except Exception as e:
                self.stats["actiontypes"]["failed"] += 1
                self.log(f"  ✗ Failed to create action type {record['name']}: {e}")

        return id_mapping

    def ingest_investments(self, csv_path: Path) -> dict[int, int]:
        """
        Ingest investments and return mapping of old ID to new ID.
        Returns: {old_id: new_id}
        """
        self.log("\n📥 Ingesting investments...")
        records = self.read_csv(csv_path)
        id_mapping = {}

        for record in records:
            old_id = int(record["id"]) if record.get("id") else None
            payload = {
                "name": record.get("name"),
                "isin": record.get("isin"),
                "shortname": record.get("shortname"),
            }

            try:
                response = requests.post(
                    f"{self.api_base_url}/api/investments/", json=payload
                )
                response.raise_for_status()
                new_id = response.json()["id"]
                id_mapping[old_id] = new_id
                self.stats["investments"]["created"] += 1
                self.log(f"  ✓ Created investment: {record['name']} (ID: {new_id})")
            except Exception as e:
                self.stats["investments"]["failed"] += 1
                self.log(f"  ✗ Failed to create investment {record['name']}: {e}")

        return id_mapping

    def ingest_investmentprices(
        self, csv_path: Path, investment_mapping: dict[int, int]
    ) -> None:
        """Ingest investment prices using the investment ID mapping."""
        self.log("\n📥 Ingesting investment prices...")
        records = self.read_csv(csv_path)

        for record in records:
            old_investment_id = int(record["investment"])
            new_investment_id = investment_mapping.get(old_investment_id)

            if not new_investment_id:
                self.log(
                    f"  ⚠️  Skipping price: unknown investment ID {old_investment_id}"
                )
                self.stats["investmentprices"]["failed"] += 1
                continue

            payload = {
                "date": record["date"],
                "investment": new_investment_id,
                "price": record["price"],
                "source": record.get("source"),
            }

            try:
                response = requests.post(
                    f"{self.api_base_url}/api/investmentprices/", json=payload
                )
                response.raise_for_status()
                self.stats["investmentprices"]["created"] += 1
                self.log(
                    f"  ✓ Created price for investment {new_investment_id} on {record['date']}"
                )
            except Exception as e:
                self.stats["investmentprices"]["failed"] += 1
                self.log(f"  ✗ Failed to create price: {e}")

    def ingest_movements(
        self,
        csv_path: Path,
        action_mapping: dict[int, int],
        investment_mapping: dict[int, int],
    ) -> None:
        """Ingest movements using the action and investment ID mappings."""
        self.log("\n📥 Ingesting movements...")
        records = self.read_csv(csv_path)

        for record in records:
            old_action_id = int(record["action"])
            old_investment_id = int(record["investment"])

            new_action_id = action_mapping.get(old_action_id)
            new_investment_id = investment_mapping.get(old_investment_id)

            if not new_action_id:
                self.log(f"  ⚠️  Skipping movement: unknown action ID {old_action_id}")
                self.stats["movements"]["failed"] += 1
                continue

            if not new_investment_id:
                self.log(
                    f"  ⚠️  Skipping movement: unknown investment ID {old_investment_id}"
                )
                self.stats["movements"]["failed"] += 1
                continue

            payload = {
                "date": record["date"],
                "action": new_action_id,
                "investment": new_investment_id,
                "quantity": record["quantity"],
                "amount": record["amount"],
                "fee": record["fee"],
            }

            try:
                response = requests.post(
                    f"{self.api_base_url}/api/movements/", json=payload
                )
                response.raise_for_status()
                self.stats["movements"]["created"] += 1
                self.log(
                    f"  ✓ Created movement for investment {new_investment_id} on {record['date']}"
                )
            except Exception as e:
                self.stats["movements"]["failed"] += 1
                self.log(f"  ✗ Failed to create movement: {e}")

    def print_summary(self) -> None:
        """Print ingestion summary statistics."""
        print("\n" + "=" * 60)
        print("📊 INGESTION SUMMARY")
        print("=" * 60)

        total_created = 0
        total_failed = 0

        for model, stats in self.stats.items():
            created = stats["created"]
            failed = stats["failed"]
            total_created += created
            total_failed += failed

            status = "✓" if failed == 0 else "⚠️"
            print(f"{status} {model:20s}: {created:3d} created, {failed:3d} failed")

        print("-" * 60)
        print(f"{'TOTAL':20s}: {total_created:3d} created, {total_failed:3d} failed")
        print("=" * 60)

    def ingest_dataset(self, dataset_dir: Path) -> bool:
        """
        Ingest all CSV files from a dataset directory.
        Returns True if successful, False otherwise.
        """
        # Check that all required CSV files exist
        required_files = [
            "actiontypes.csv",
            "investments.csv",
            "investmentprices.csv",
            "movements.csv",
        ]

        for filename in required_files:
            csv_path = dataset_dir / filename
            if not csv_path.exists():
                print(f"❌ Error: Required file not found: {csv_path}")
                return False

        # Ingest in order (respecting foreign key dependencies)
        action_mapping = self.ingest_actiontypes(dataset_dir / "actiontypes.csv")
        investment_mapping = self.ingest_investments(dataset_dir / "investments.csv")
        self.ingest_investmentprices(
            dataset_dir / "investmentprices.csv", investment_mapping
        )
        self.ingest_movements(
            dataset_dir / "movements.csv", action_mapping, investment_mapping
        )

        self.print_summary()
        return True


def main():
    parser = argparse.ArgumentParser(
        description="Ingest CSV data into portfolio backend API"
    )
    parser.add_argument(
        "--dataset", type=str, required=True, help='Dataset name (e.g., "minimal")'
    )
    parser.add_argument(
        "--api-url",
        type=str,
        default="http://localhost:8000",
        help="Backend API base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--clear", action="store_true", help="Clear existing data before ingestion"
    )
    parser.add_argument("--quiet", action="store_true", help="Suppress verbose output")

    args = parser.parse_args()

    # Determine dataset directory
    dataset_dir = Path("testdata") / args.dataset
    if not dataset_dir.exists():
        print(f"❌ Error: Dataset directory not found: {dataset_dir}")
        return 1

    print(f"🚀 Starting data ingestion")
    print(f"   Dataset: {args.dataset}")
    print(f"   API URL: {args.api_url}")
    print(f"   Clear existing data: {args.clear}")

    # Create ingester
    ingester = DataIngester(args.api_url, verbose=not args.quiet)

    # Clear data if requested
    if args.clear:
        ingester.clear_data()

    # Ingest dataset
    success = ingester.ingest_dataset(dataset_dir)

    if success:
        print("\n✅ Ingestion completed successfully!")
        return 0
    else:
        print("\n❌ Ingestion failed!")
        return 1


if __name__ == "__main__":
    sys.exit(main())
