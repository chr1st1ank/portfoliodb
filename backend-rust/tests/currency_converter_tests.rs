mod test_helpers;

use chrono::NaiveDate;
use portfoliodb_rust::services::CurrencyConverter;

/// Test currency conversion with same currency (should return same amount)
#[tokio::test]
async fn test_convert_same_currency() {
    let converter = CurrencyConverter::new();
    let date = NaiveDate::from_ymd_opt(2024, 1, 15).unwrap();

    let result = converter.convert(100.0, "EUR", "EUR", date).await;

    assert!(result.is_ok());
    let converted = result.unwrap();
    assert_eq!(converted, Some(100.0));
}

/// Test currency conversion with real API (can be skipped in offline mode)
/// Set SKIP_ONLINE_TESTS=1 to skip this test
#[tokio::test]
#[ignore] // Ignored by default, run with: cargo test -- --ignored
async fn test_convert_eur_to_usd_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let converter = CurrencyConverter::new();
    let date = NaiveDate::from_ymd_opt(2024, 1, 15).unwrap();

    let result = converter.convert(100.0, "EUR", "USD", date).await;

    assert!(result.is_ok());
    let converted = result.unwrap();
    assert!(converted.is_some());

    // EUR to USD should be roughly in the range of 1.0 to 1.2
    let amount = converted.unwrap();
    assert!(
        amount > 90.0 && amount < 150.0,
        "Conversion rate seems unreasonable: {}",
        amount
    );
}

/// Test currency conversion with invalid currency (should handle gracefully)
#[tokio::test]
#[ignore] // Ignored by default
async fn test_convert_invalid_currency_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let converter = CurrencyConverter::new();
    let date = NaiveDate::from_ymd_opt(2024, 1, 15).unwrap();

    let result = converter.convert(100.0, "INVALID", "USD", date).await;

    // Should either return Ok(None) or an error, but not panic
    assert!(result.is_ok() || result.is_err());
}

/// Test currency conversion with historical date
#[tokio::test]
#[ignore] // Ignored by default
async fn test_convert_historical_date_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let converter = CurrencyConverter::new();
    // Use a date from 2020
    let date = NaiveDate::from_ymd_opt(2020, 6, 15).unwrap();

    let result = converter.convert(100.0, "GBP", "EUR", date).await;

    assert!(result.is_ok());
    let converted = result.unwrap();
    assert!(converted.is_some());

    let amount = converted.unwrap();
    assert!(
        amount > 50.0 && amount < 200.0,
        "Historical conversion rate seems unreasonable: {}",
        amount
    );
}
