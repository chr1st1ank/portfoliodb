use portfoliodb_rust::services::quotes::{JustETFProvider, QuoteProvider};

/// Test JustETF provider initialization
#[test]
fn test_justetf_provider_creation() {
    let provider = JustETFProvider::new();
    assert_eq!(provider.get_provider_name(), "justetf");
}

/// Test fetching quote from JustETF (online test)
/// Note: JustETF web scraping is fragile and may break if their HTML changes
#[tokio::test]
#[ignore] // Ignored by default, run with: cargo test -- --ignored
async fn test_justetf_get_quote_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = JustETFProvider::new();

    // Test with a real ISIN (iShares Core MSCI World UCITS ETF)
    let result = provider.get_quote("IE00B4L5Y983", None).await;

    assert!(
        result.is_ok(),
        "Failed to fetch quote from JustETF: {:?}",
        result.err()
    );

    let quote = result
        .unwrap()
        .expect("JustETF should return a quote for valid ISIN");

    println!("Successfully fetched quote from JustETF:");
    println!("  ISIN: {}", quote.ticker);
    println!("  Price: {}", quote.price);
    println!("  Currency: {}", quote.currency);
    println!("  Date: {}", quote.date);

    // Check date is recent (within last 7 days)
    let today = chrono::Utc::now().date_naive();
    let days_diff = (today - quote.date).num_days();
    assert!(
        days_diff >= 0 && days_diff <= 7,
        "Latest quote date {} should be within last 7 days (today: {})",
        quote.date,
        today
    );

    assert_eq!(quote.ticker, "IE00B4L5Y983");
    // Check for reasonable price range (iShares Core MSCI World typically 80-150 EUR)
    assert!(
        quote.price > 50.0 && quote.price < 200.0,
        "Price {} is outside reasonable range for this ETF",
        quote.price
    );
    assert_eq!(quote.currency, "EUR");
    assert_eq!(quote.source, "justetf");
}

/// Test fetching quotes (historical) from JustETF
/// JustETF doesn't provide historical data via scraping, so this should return single quote
#[tokio::test]
#[ignore] // Ignored by default
async fn test_justetf_get_quotes_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = JustETFProvider::new();

    let result = provider.get_quotes("IE00B4L5Y983").await;

    assert!(
        result.is_ok(),
        "Failed to fetch quotes from JustETF: {:?}",
        result.err()
    );

    let quotes = result.unwrap();
    // JustETF API returns historical data (last 90 days)
    assert!(
        !quotes.is_empty(),
        "JustETF should return quotes for valid ISIN"
    );
    assert!(
        quotes.len() > 10,
        "JustETF should return multiple historical quotes"
    );

    // Verify all quotes have correct ISIN
    for quote in &quotes {
        assert_eq!(quote.ticker, "IE00B4L5Y983");
        assert_eq!(quote.currency, "EUR");
        assert_eq!(quote.source, "justetf");
    }

    println!("JustETF returned {} quote(s)", quotes.len());
}

/// Test with invalid ISIN
#[tokio::test]
#[ignore] // Ignored by default
async fn test_justetf_invalid_isin_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let provider = JustETFProvider::new();

    let result = provider.get_quote("INVALID_ISIN", None).await;

    // Should handle gracefully - return Ok(None) for invalid ISIN
    assert!(
        result.is_ok(),
        "Should handle invalid ISIN gracefully: {:?}",
        result.err()
    );

    let quote = result.unwrap();
    assert!(quote.is_none(), "Should not find quote for invalid ISIN");
}
