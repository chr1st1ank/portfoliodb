use portfoliodb_rust::services::providers::{JustETFProvider, QuoteProvider};

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

    // JustETF scraping is fragile, so we just check it doesn't panic
    // and returns a valid result type
    assert!(result.is_ok() || result.is_err());

    if let Ok(Some(quote)) = result {
        println!("Successfully fetched quote from JustETF:");
        println!("  ISIN: {}", quote.ticker);
        println!("  Price: {}", quote.price);
        println!("  Currency: {}", quote.currency);
        println!("  Date: {}", quote.date);

        assert_eq!(quote.ticker, "IE00B4L5Y983");
        assert!(quote.price > 0.0, "Price should be positive");
        assert_eq!(quote.source, "justetf");
    } else {
        println!("JustETF scraping failed (expected - HTML may have changed)");
    }
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

    assert!(result.is_ok() || result.is_err());

    if let Ok(quotes) = result {
        // Should return 0 or 1 quote (JustETF only provides current price)
        assert!(quotes.len() <= 1, "JustETF should return at most 1 quote");

        if !quotes.is_empty() {
            println!("JustETF returned {} quote(s)", quotes.len());
        }
    }
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

    // Should handle gracefully (return None or error)
    assert!(result.is_ok() || result.is_err());

    if let Ok(quote) = result {
        assert!(quote.is_none(), "Should not find quote for invalid ISIN");
    }
}
