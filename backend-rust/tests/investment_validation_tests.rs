use axum::extract::State;
use axum::Json;
use portfoliodb_rust::handlers::investments::{create_investment, CreateInvestmentRequest};
use portfoliodb_rust::repository::sqlite::SqliteInvestmentRepository;
use std::sync::Arc;

#[tokio::test]
async fn test_create_investment_with_invalid_provider() {
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    portfoliodb_rust::db::migrations::run_migrations(&pool)
        .await
        .unwrap();

    let repo = Arc::new(SqliteInvestmentRepository::new(pool))
        as Arc<dyn portfoliodb_rust::repository::traits::InvestmentRepository>;

    let request = CreateInvestmentRequest {
        name: Some("Test Investment".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: Some("TEST".to_string()),
        ticker_symbol: Some("TEST".to_string()),
        quote_provider: Some("invalid_provider".to_string()),
    };

    let result = create_investment(State(repo), Json(request)).await;

    assert!(result.is_err());
    let err = result.unwrap_err();
    assert!(err.to_string().contains("Invalid quote provider"));
}

#[tokio::test]
async fn test_create_investment_with_valid_provider() {
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    portfoliodb_rust::db::migrations::run_migrations(&pool)
        .await
        .unwrap();

    let repo = Arc::new(SqliteInvestmentRepository::new(pool))
        as Arc<dyn portfoliodb_rust::repository::traits::InvestmentRepository>;

    let request = CreateInvestmentRequest {
        name: Some("Test Investment".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: Some("AAPL".to_string()),
        ticker_symbol: Some("AAPL".to_string()),
        quote_provider: Some("yahoo".to_string()),
    };

    let result = create_investment(State(repo), Json(request)).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.0.quote_provider, Some("yahoo".to_string()));
}

#[tokio::test]
async fn test_create_investment_with_no_provider() {
    let pool = sqlx::SqlitePool::connect("sqlite::memory:").await.unwrap();
    portfoliodb_rust::db::migrations::run_migrations(&pool)
        .await
        .unwrap();

    let repo = Arc::new(SqliteInvestmentRepository::new(pool))
        as Arc<dyn portfoliodb_rust::repository::traits::InvestmentRepository>;

    let request = CreateInvestmentRequest {
        name: Some("Test Investment".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: Some("TEST".to_string()),
        ticker_symbol: Some("TEST".to_string()),
        quote_provider: None,
    };

    let result = create_investment(State(repo), Json(request)).await;

    assert!(result.is_ok());
    let response = result.unwrap();
    assert_eq!(response.0.quote_provider, None);
}
