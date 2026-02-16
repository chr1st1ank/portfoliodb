use chrono::NaiveDate;
use portfoliodb_rust::services::quotes::{QuoteProvider, YahooFinanceProvider};

/// Test Yahoo Finance provider initialization
#[test]
fn test_yahoo_provider_creation() {
    let provider = YahooFinanceProvider::new();
    assert_eq!(provider.get_provider_name(), "yahoo");
}

/// Test fetching quotes from Yahoo Finance (online test)
/// Set SKIP_ONLINE_TESTS=1 to skip this test
#[tokio::test]
#[ignore] // Ignored by default, run with: cargo test -- --ignored
async fn test_yahoo_get_quotes_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = YahooFinanceProvider::new();

    // Test with a well-known ticker (Apple)
    let result = provider.get_quotes("AAPL").await;

    assert!(result.is_ok(), "Failed to fetch quotes: {:?}", result.err());
    let quotes = result.unwrap();

    assert!(!quotes.is_empty(), "Should have fetched some quotes");

    // Verify all quotes have correct ticker
    for quote in &quotes {
        assert_eq!(quote.ticker, "AAPL", "All quotes should have ticker AAPL");
    }

    // Verify quote structure - check the last (most recent) quote
    let last_quote = quotes.last().unwrap();
    assert_eq!(last_quote.ticker, "AAPL");

    // Check date is recent (within last 7 days)
    let today = chrono::Utc::now().date_naive();
    let days_diff = (today - last_quote.date).num_days();
    assert!(
        days_diff >= 0 && days_diff <= 7,
        "Latest quote date {} should be within last 7 days (today: {})",
        last_quote.date,
        today
    );

    // Check for reasonable price range
    assert!(
        (last_quote.price - 255.30).abs() < 50.0,
        "Price should be close to the last known course"
    );
    assert_eq!(last_quote.source, "yahoo");
    assert!(
        !last_quote.currency.is_empty(),
        "Currency should not be empty"
    );

    println!(
        "Fetched {} quotes for AAPL (latest price: ${}, date: {})",
        quotes.len(),
        last_quote.price,
        last_quote.date
    );
}

/// Test fetching single quote from Yahoo Finance
#[tokio::test]
#[ignore] // Ignored by default
async fn test_yahoo_get_quote_latest_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = YahooFinanceProvider::new();

    // Get latest quote (no date specified)
    let result = provider.get_quote("MSFT", None).await;

    assert!(result.is_ok());
    let quote = result.unwrap();

    assert!(quote.is_some(), "Should have fetched a quote");
    let quote = quote.unwrap();

    // Check date is recent (within last 7 days)
    let today = chrono::Utc::now().date_naive();
    let days_diff = (today - quote.date).num_days();
    assert!(
        days_diff >= 0 && days_diff <= 7,
        "Latest quote date {} should be within last 7 days (today: {})",
        quote.date,
        today
    );

    assert_eq!(quote.ticker, "MSFT");
    assert!((quote.price -401.32).abs() < 50.0);
    assert_eq!(quote.source, "yahoo");
}

/// Test fetching quote for specific date
#[tokio::test]
#[ignore] // Ignored by default
async fn test_yahoo_get_quote_specific_date_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = YahooFinanceProvider::new();
    let target_date = NaiveDate::from_ymd_opt(2026, 1, 28).unwrap();

    let result = provider.get_quote("GOOGL", Some(target_date)).await;

    assert!(result.is_ok());
    let quote = result.unwrap();

    if let Some(quote) = quote {
        assert_eq!(quote.ticker, "GOOGL");
        assert_eq!(quote.date, target_date);
        assert!((quote.price - 336.01).abs() < 0.1);
    } else {
        println!("No quote found for specific date (might be weekend/holiday)");
    }
}

/// Test with invalid ticker (should handle gracefully)
#[tokio::test]
#[ignore] // Ignored by default
async fn test_yahoo_invalid_ticker_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = YahooFinanceProvider::new();

    let result = provider.get_quotes("INVALID_TICKER_XYZ123").await;

    // Should return error or empty list, but not panic
    assert!(result.is_err() || result.unwrap().is_empty());
}
