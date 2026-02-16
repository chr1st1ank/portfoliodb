mod test_helpers;

use portfoliodb_rust::models::Investment;
use portfoliodb_rust::repository::sqlite::{
    SqliteInvestmentPriceRepository, SqliteInvestmentRepository,
};
use portfoliodb_rust::repository::traits::{InvestmentPriceRepository, InvestmentRepository};
use portfoliodb_rust::services::QuoteFetcherService;
use std::sync::Arc;
use test_helpers::setup_test_db;

/// Test quote fetcher service initialization
#[tokio::test]
async fn test_quote_fetcher_creation() {
    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    let service = QuoteFetcherService::new(investment_repo, price_repo, "EUR".to_string());

    let providers = service.get_available_providers();
    assert_eq!(
        providers.len(),
        2,
        "Should have 2 providers (yahoo, justetf)"
    );

    let provider_ids: Vec<String> = providers.iter().map(|p| p.id.clone()).collect();
    assert!(provider_ids.contains(&"yahoo".to_string()));
    assert!(provider_ids.contains(&"justetf".to_string()));
}

/// Test fetching quotes for investment without provider configured
#[tokio::test]
async fn test_fetch_quotes_no_provider() {
    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    // Create investment without quote provider
    let investment = Investment {
        id: 0,
        name: Some("Test Investment".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: None,
        quote_provider: None, // No provider
        ticker_symbol: Some("AAPL".to_string()),
    };

    let created_id = investment_repo.create(&investment).await.unwrap();
    let created = investment_repo
        .find_by_id(created_id)
        .await
        .unwrap()
        .unwrap();

    let service = QuoteFetcherService::new(investment_repo, price_repo, "EUR".to_string());

    let result = service.fetch_quotes_for_investment(&created).await.unwrap();

    assert!(!result.success);
    assert!(result.error.is_some());
    assert!(result
        .error
        .unwrap()
        .contains("No quote provider configured"));
}

/// Test fetching quotes for investment with unknown provider
#[tokio::test]
async fn test_fetch_quotes_unknown_provider() {
    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    // Create investment with invalid provider
    let investment = Investment {
        id: 0,
        name: Some("Test Investment".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: None,
        quote_provider: Some("unknown_provider".to_string()),
        ticker_symbol: Some("AAPL".to_string()),
    };

    let created_id = investment_repo.create(&investment).await.unwrap();
    let created = investment_repo
        .find_by_id(created_id)
        .await
        .unwrap()
        .unwrap();

    let service = QuoteFetcherService::new(investment_repo, price_repo, "EUR".to_string());

    let result = service.fetch_quotes_for_investment(&created).await.unwrap();

    assert!(!result.success);
    assert!(result.error.is_some());
    assert!(result.error.unwrap().contains("Unknown provider"));
}

/// Test fetching quotes for investment without ticker or ISIN
#[tokio::test]
async fn test_fetch_quotes_no_ticker() {
    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    // Create investment without ticker or ISIN
    let investment = Investment {
        id: 0,
        name: Some("Test Investment".to_string()),
        isin: None,
        shortname: None,
        quote_provider: Some("yahoo".to_string()),
        ticker_symbol: None,
    };

    let created_id = investment_repo.create(&investment).await.unwrap();
    let created = investment_repo
        .find_by_id(created_id)
        .await
        .unwrap()
        .unwrap();

    let service = QuoteFetcherService::new(investment_repo, price_repo, "EUR".to_string());

    let result = service.fetch_quotes_for_investment(&created).await;

    assert!(result.is_err());
}

/// Test fetching quotes with real Yahoo Finance provider (online test)
#[tokio::test]
#[ignore] // Ignored by default
async fn test_fetch_quotes_yahoo_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    // Create investment with Yahoo provider
    let investment = Investment {
        id: 0,
        name: Some("Apple Inc.".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: Some("AAPL".to_string()),
        quote_provider: Some("yahoo".to_string()),
        ticker_symbol: Some("AAPL".to_string()),
    };

    let created_id = investment_repo.create(&investment).await.unwrap();
    let created = investment_repo
        .find_by_id(created_id)
        .await
        .unwrap()
        .unwrap();

    let service = QuoteFetcherService::new(
        investment_repo.clone(),
        price_repo.clone(),
        "EUR".to_string(),
    );

    let result = service.fetch_quotes_for_investment(&created).await.unwrap();

    println!(
        "Fetch result: success={}, quotes_stored={}",
        result.success, result.quotes_stored
    );

    if result.success {
        assert!(result.quotes_stored > 0, "Should have stored some quotes");
        assert!(result.error.is_none());

        // Verify quotes were stored in database
        let prices = price_repo
            .find_all(Some(created_id), None, None)
            .await
            .unwrap();

        assert!(!prices.is_empty(), "Should have prices in database");
        println!("Stored {} prices in database", prices.len());
    } else {
        println!("Fetch failed: {:?}", result.error);
    }
}

/// Test fetching quotes for multiple investments
#[tokio::test]
#[ignore] // Ignored by default
async fn test_fetch_quotes_multiple_investments_online() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    // Create multiple investments
    let inv1 = Investment {
        id: 0,
        name: Some("Apple".to_string()),
        isin: None,
        shortname: None,
        quote_provider: Some("yahoo".to_string()),
        ticker_symbol: Some("AAPL".to_string()),
    };

    let inv2 = Investment {
        id: 0,
        name: Some("Microsoft".to_string()),
        isin: None,
        shortname: None,
        quote_provider: Some("yahoo".to_string()),
        ticker_symbol: Some("MSFT".to_string()),
    };

    let created1_id = investment_repo.create(&inv1).await.unwrap();
    let created2_id = investment_repo.create(&inv2).await.unwrap();

    let service = QuoteFetcherService::new(investment_repo, price_repo, "EUR".to_string());

    // Fetch quotes for specific investments
    let results = service
        .fetch_quotes(Some(vec![created1_id, created2_id]))
        .await
        .unwrap();

    assert_eq!(results.len(), 2, "Should have results for 2 investments");

    let success_count = results.iter().filter(|r| r.success).count();
    println!(
        "Successfully fetched quotes for {}/{} investments",
        success_count,
        results.len()
    );
}

/// Test fetching quotes for all investments with provider configured (online test)
#[tokio::test]
#[ignore] // Ignored by default, run with: cargo test -- --ignored
async fn test_fetch_quotes_all_with_provider() {
    if std::env::var("SKIP_ONLINE_TESTS").is_ok() {
        println!("Skipping online test");
        return;
    }

    let pool = setup_test_db().await;

    let investment_repo: Arc<dyn InvestmentRepository> =
        Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let price_repo: Arc<dyn InvestmentPriceRepository> =
        Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));

    // Create investment with provider
    let inv1 = Investment {
        id: 0,
        name: Some("With Provider".to_string()),
        isin: None,
        shortname: None,
        quote_provider: Some("yahoo".to_string()),
        ticker_symbol: Some("AAPL".to_string()),
    };

    // Create investment without provider
    let inv2 = Investment {
        id: 0,
        name: Some("Without Provider".to_string()),
        isin: None,
        shortname: None,
        quote_provider: None,
        ticker_symbol: Some("MSFT".to_string()),
    };

    investment_repo.create(&inv1).await.unwrap();
    investment_repo.create(&inv2).await.unwrap();

    let service = QuoteFetcherService::new(investment_repo, price_repo, "EUR".to_string());

    // Fetch quotes for all (should only process inv1)
    let results = service.fetch_quotes(None).await.unwrap();

    assert_eq!(
        results.len(),
        1,
        "Should only process investment with provider configured"
    );
}
