#!/usr/bin/env python3
"""
API Integration Test Script

Tests the Rust backend API endpoints against expected values.
Only validates calculated/derived data - raw CSV data is validated by count only.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Any

import requests


class APITester:
    def __init__(self, api_url: str, dataset: str):
        self.api_url = api_url.rstrip("/")
        self.dataset = dataset
        self.expectations_path = Path(f"testdata/{dataset}/expectations.json")
        self.expectations = self._load_expectations()
        self.passed = 0
        self.failed = 0
        self.epsilon = 0.001

    def _load_expectations(self) -> dict:
        """Load expectations from JSON file."""
        if not self.expectations_path.exists():
            raise FileNotFoundError(
                f"Expectations file not found: {self.expectations_path}"
            )
        with open(self.expectations_path) as f:
            return json.load(f)

    def log(self, message: str):
        """Print a log message."""
        print(message)

    def _compare_float(self, actual: float, expected: float) -> bool:
        """Compare floats with epsilon tolerance."""
        return abs(actual - expected) < self.epsilon

    def _load_csv(self, filename: str) -> list[dict[str, str]]:
        """Load CSV file and return list of dictionaries."""
        import csv

        csv_path = Path(f"testdata/{self.dataset}/{filename}")
        with open(csv_path) as f:
            reader = csv.DictReader(f)
            return list(reader)

    def _validate_development(
        self, actual: dict[str, Any], expected: dict[str, Any]
    ) -> tuple[bool, str]:
        """Validate a single development entry."""
        # Exact match for investment and date
        if actual["investment"] != expected["investment"]:
            return (
                False,
                f"Investment mismatch: expected {expected['investment']}, got {actual['investment']}",
            )
        if actual["date"] != expected["date"]:
            return (
                False,
                f"Date mismatch: expected {expected['date']}, got {actual['date']}",
            )

        # Float comparison with epsilon for price, quantity, value
        if not self._compare_float(actual["price"], expected["price"]):
            diff = abs(actual["price"] - expected["price"])
            return (
                False,
                f"Price mismatch on {expected['date']}: expected {expected['price']}, got {actual['price']} (diff: {diff:.6f})",
            )
        if not self._compare_float(actual["quantity"], expected["quantity"]):
            diff = abs(actual["quantity"] - expected["quantity"])
            return (
                False,
                f"Quantity mismatch on {expected['date']}: expected {expected['quantity']}, got {actual['quantity']} (diff: {diff:.6f})",
            )
        if not self._compare_float(actual["value"], expected["value"]):
            diff = abs(actual["value"] - expected["value"])
            return (
                False,
                f"Value mismatch on {expected['date']}: expected {expected['value']}, got {actual['value']} (diff: {diff:.6f})",
            )

        return True, ""

    def test_action_types(self):
        """Test action types endpoint."""
        self.log("\n📋 Testing Action Types...")
        try:
            response = requests.get(f"{self.api_url}/api/actiontypes")
            response.raise_for_status()
            data = response.json()

            # Load expected data from CSV
            csv_data = self._load_csv("actiontypes.csv")
            expected_types = {int(row["id"]): row["name"] for row in csv_data}

            # Validate count
            if len(data) != len(expected_types):
                self.log(
                    f"  ✗ Expected {len(expected_types)} action types, got {len(data)}"
                )
                self.failed += 1
                return

            # Validate each action type
            errors = []
            for item in data:
                expected_name = expected_types.get(item["id"])
                if expected_name is None:
                    errors.append(f"Unexpected action type ID: {item['id']}")
                elif item["name"] != expected_name:
                    errors.append(
                        f"ID {item['id']}: expected name '{expected_name}', got '{item['name']}'"
                    )

            if errors:
                self.log(f"  ✗ Action Types validation failed:")
                for error in errors:
                    self.log(f"    {error}")
                self.failed += 1
            else:
                self.log(f"  ✓ Action Types: {len(data)} records validated")
                self.passed += 1
        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def test_investments(self):
        """Test investments endpoint."""
        self.log("\n💼 Testing Investments...")
        try:
            response = requests.get(f"{self.api_url}/api/investments")
            response.raise_for_status()
            data = response.json()

            # Load expected data from CSV
            csv_data = self._load_csv("investments.csv")
            expected_investments = {
                int(row["id"]): {
                    "name": row["name"],
                    "isin": row["isin"],
                    "shortname": row["shortname"],
                }
                for row in csv_data
            }

            # Validate count
            if len(data) != len(expected_investments):
                self.log(
                    f"  ✗ Expected {len(expected_investments)} investments, got {len(data)}"
                )
                self.failed += 1
                return

            # Validate each investment
            errors = []
            for item in data:
                expected = expected_investments.get(item["id"])
                if expected is None:
                    errors.append(f"Unexpected investment ID: {item['id']}")
                else:
                    if item["name"] != expected["name"]:
                        errors.append(
                            f"ID {item['id']}: expected name '{expected['name']}', got '{item['name']}'"
                        )
                    if item["isin"] != expected["isin"]:
                        errors.append(
                            f"ID {item['id']}: expected isin '{expected['isin']}', got '{item['isin']}'"
                        )
                    if item["shortname"] != expected["shortname"]:
                        errors.append(
                            f"ID {item['id']}: expected shortname '{expected['shortname']}', got '{item['shortname']}'"
                        )

            if errors:
                self.log("  ✗ Investments validation failed:")
                for error in errors:
                    self.log(f"    {error}")
                self.failed += 1
            else:
                self.log(f"  ✓ Investments: {len(data)} records validated")
                self.passed += 1
        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def test_movements(self):
        """Test movements endpoint."""
        self.log("\n📊 Testing Movements...")
        try:
            response = requests.get(f"{self.api_url}/api/movements")
            response.raise_for_status()
            data = response.json()

            # Load expected data from CSV
            csv_data = self._load_csv("movements.csv")
            expected_movements = {
                int(row["id"]): {
                    "date": row["date"],
                    "action_id": int(row["action"]),
                    "investment_id": int(row["investment"]),
                    "quantity": float(row["quantity"]),
                    "amount": float(row["amount"]),
                    "fee": float(row["fee"]),
                }
                for row in csv_data
            }

            # Validate count
            if len(data) != len(expected_movements):
                self.log(
                    f"  ✗ Expected {len(expected_movements)} movements, got {len(data)}"
                )
                self.failed += 1
                return

            # Validate each movement
            errors = []
            for item in data:
                expected = expected_movements.get(item["id"])
                if expected is None:
                    errors.append(f"Unexpected movement ID: {item['id']}")
                    continue

                # Extract actual values for comparison
                actual = {
                    "date": item["date"],
                    "action_id": item["action_id"],
                    "investment_id": item["investment_id"],
                    "quantity": item["quantity"],
                    "amount": item["amount"],
                    "fee": item["fee"],
                }

                # Check for mismatches
                if (
                    actual["date"] != expected["date"]
                    or actual["action_id"] != expected["action_id"]
                    or actual["investment_id"] != expected["investment_id"]
                    or not self._compare_float(actual["quantity"], expected["quantity"])
                    or not self._compare_float(actual["amount"], expected["amount"])
                    or not self._compare_float(actual["fee"], expected["fee"])
                ):
                    errors.append(f"ID {item['id']}: expected {expected}, got {actual}")

            if errors:
                self.log("  ✗ Movements validation failed:")
                # Only show first 5 errors to avoid overwhelming output
                for error in errors[:5]:
                    self.log(f"    {error}")
                if len(errors) > 5:
                    self.log(f"    ... and {len(errors) - 5} more errors")
                self.failed += 1
            else:
                self.log(f"  ✓ Movements: {len(data)} records validated")
                self.passed += 1
        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def test_investment_prices(self):
        """Test investment prices endpoint."""
        self.log("\n💰 Testing Investment Prices...")
        try:
            response = requests.get(f"{self.api_url}/api/investmentprices")
            response.raise_for_status()
            data = response.json()

            # Load expected data from CSV
            csv_data = self._load_csv("investmentprices.csv")
            # Use (date, investment_id) as key since prices don't have an id field
            expected_prices = {
                (row["date"], int(row["investment"])): {
                    "price": float(row["price"]),
                    "source": row.get("source", ""),
                }
                for row in csv_data
            }

            # Validate count
            if len(data) != len(expected_prices):
                self.log(
                    f"  ✗ Expected {len(expected_prices)} investment prices, got {len(data)}"
                )
                self.failed += 1
                return

            # Validate each price record
            errors = []
            for item in data:
                key = (item["date"], item["investment_id"])
                expected = expected_prices.get(key)
                if expected is None:
                    errors.append(
                        f"Unexpected price: date={item['date']}, investment_id={item['investment_id']}"
                    )
                else:
                    if not self._compare_float(item["price"], expected["price"]):
                        errors.append(
                            f"Date {item['date']}, Investment {item['investment_id']}: expected price {expected['price']}, got {item['price']}"
                        )

            if errors:
                self.log("  ✗ Investment Prices validation failed:")
                # Only show first 5 errors to avoid overwhelming output
                for error in errors[:5]:
                    self.log(f"    {error}")
                if len(errors) > 5:
                    self.log(f"    ... and {len(errors) - 5} more errors")
                self.failed += 1
            else:
                self.log(f"  ✓ Investment Prices: {len(data)} records validated")
                self.passed += 1
        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def test_developments(self):
        """Test developments endpoint with hand-calculated expectations."""
        self.log("\n📈 Testing Developments...")
        try:
            response = requests.get(f"{self.api_url}/api/developments")
            response.raise_for_status()
            data = response.json()

            expected_devs = self.expectations["developments"]

            # Filter actual developments to match expected ones
            # (investment 1 only, sorted by date)
            actual_devs = sorted(
                [d for d in data if d["investment"] == 1], key=lambda x: x["date"]
            )

            if len(actual_devs) < len(expected_devs):
                self.log(
                    f"  ✗ Expected at least {len(expected_devs)} developments for investment 1, got {len(actual_devs)}"
                )
                self.failed += 1
                return

            # Validate each expected development
            errors = []
            for i, expected in enumerate(expected_devs):
                actual = actual_devs[i]
                is_valid, error_msg = self._validate_development(actual, expected)
                if not is_valid:
                    errors.append(f"    Entry {i}: {error_msg}")

            if errors:
                self.log(f"  ✗ Developments validation failed:")
                for error in errors:
                    self.log(error)
                self.failed += 1
            else:
                self.log(
                    f"  ✓ Developments: {len(expected_devs)} entries validated (epsilon={self.epsilon})"
                )
                self.passed += 1

        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def test_settings(self):
        """Test settings endpoint."""
        self.log("\n⚙️  Testing Settings...")
        try:
            response = requests.get(f"{self.api_url}/api/settings")
            response.raise_for_status()
            data = response.json()

            expected_currency = self.expectations["settings"]["base_currency"]
            actual_currency = data.get("base_currency")

            if actual_currency != expected_currency:
                self.log(
                    f"  ✗ Expected base_currency={expected_currency}, got {actual_currency}"
                )
                self.failed += 1
                return

            self.log(f"  ✓ Settings: base_currency = {actual_currency}")
            self.passed += 1
        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def test_quote_providers(self):
        """Test quote providers endpoint."""
        self.log("\n🔌 Testing Quote Providers...")
        try:
            response = requests.get(f"{self.api_url}/api/quotes/providers")
            response.raise_for_status()
            data = response.json()

            expected_providers = self.expectations["quote_providers"]

            if len(data) != len(expected_providers):
                self.log(
                    f"  ✗ Expected {len(expected_providers)} providers, got {len(data)}"
                )
                self.failed += 1
                return

            # Check each provider
            for expected in expected_providers:
                found = any(
                    p["id"] == expected["id"] and p["name"] == expected["name"]
                    for p in data
                )
                if not found:
                    self.log(
                        f"  ✗ Provider not found: {expected['id']} - {expected['name']}"
                    )
                    self.failed += 1
                    return

            self.log(f"  ✓ Quote Providers: {len(data)} providers")
            self.passed += 1
        except Exception as e:
            self.log(f"  ✗ Failed: {e}")
            self.failed += 1

    def run_all_tests(self):
        """Run all API tests."""
        self.log("🧪 API Integration Tests")
        self.log("=" * 60)
        self.log(f"API URL: {self.api_url}")
        self.log(f"Dataset: {self.dataset}")

        self.test_action_types()
        self.test_investments()
        self.test_movements()
        self.test_investment_prices()
        self.test_developments()
        self.test_settings()
        self.test_quote_providers()

        self.log("\n" + "=" * 60)
        self.log(f"Results: {self.passed} passed, {self.failed} failed")
        self.log("=" * 60)

        if self.failed > 0:
            self.log("❌ Tests failed!")
            return 1
        else:
            self.log("✅ All tests passed!")
            return 0


def main():
    parser = argparse.ArgumentParser(description="Test API endpoints")
    parser.add_argument(
        "--api-url",
        default="http://localhost:8001",
        help="Base URL of the API (default: http://localhost:8001)",
    )
    parser.add_argument(
        "--dataset", default="minimal", help="Dataset to use (default: minimal)"
    )

    args = parser.parse_args()

    tester = APITester(args.api_url, args.dataset)
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
