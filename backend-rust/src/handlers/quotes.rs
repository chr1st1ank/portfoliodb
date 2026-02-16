use crate::error::Result;
use crate::routes::QuoteFetchState;
use crate::services::quote_fetcher::{ProviderInfo, QuoteFetchResult, QuoteFetcherService};
use axum::{
    extract::{Path, State},
    Json,
};
use chrono::NaiveDate;
use serde::Serialize;
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct FetchQuotesResponse {
    pub results: Vec<QuoteFetchResult>,
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
}

#[derive(Debug, Serialize)]
pub struct FetchQuotesForInvestmentResponse {
    pub investment_id: i64,
    pub success: bool,
    pub error: Option<String>,
    pub quotes_fetched: usize,
    pub provider: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct GetQuotesResponse {
    pub investment_id: i64,
    pub quotes: Vec<QuoteInfo>,
}

#[derive(Debug, Serialize)]
pub struct QuoteInfo {
    pub date: NaiveDate,
    pub price: f64,
    pub source: String,
}

/// GET /api/quotes/providers - List available quote providers
pub async fn list_providers(
    State(service): State<Arc<QuoteFetcherService>>,
) -> Result<Json<Vec<ProviderInfo>>> {
    let providers = service.get_available_providers();
    Ok(Json(providers))
}

/// POST /api/quotes/:investment_id/fetch - Fetch latest quotes for a specific investment
pub async fn fetch_latest_quotes(
    State(state): State<QuoteFetchState>,
    Path(investment_id): Path<i64>,
) -> Result<Json<FetchQuotesForInvestmentResponse>> {
    tracing::info!(
        "Fetching latest quotes for investment ID: {}",
        investment_id
    );

    // Get base currency from settings
    let base_currency = state
        .settings_repo
        .get()
        .await?
        .map(|s| s.base_currency)
        .unwrap_or_else(|| "EUR".to_string());

    // Fetch the investment
    let investment = match state.investment_repo.find_by_id(investment_id).await? {
        Some(inv) => inv,
        None => {
            return Ok(Json(FetchQuotesForInvestmentResponse {
                investment_id,
                success: false,
                error: Some("Investment not found".to_string()),
                quotes_fetched: 0,
                provider: None,
            }));
        }
    };

    // Get quote provider
    let quote_provider = match &investment.quote_provider {
        Some(provider) if !provider.is_empty() => provider.clone(),
        _ => {
            return Ok(Json(FetchQuotesForInvestmentResponse {
                investment_id,
                success: false,
                error: Some("No quote provider configured".to_string()),
                quotes_fetched: 0,
                provider: None,
            }));
        }
    };

    // Instantiate service on-the-fly
    let service = QuoteFetcherService::new(
        state.investment_repo.clone(),
        state.price_repo.clone(),
        base_currency,
    );

    // Fetch quotes for this investment
    let result = service.fetch_quotes_for_investment(&investment).await?;

    Ok(Json(FetchQuotesForInvestmentResponse {
        investment_id: result.investment_id,
        success: result.success,
        error: result.error,
        quotes_fetched: result.quotes_stored,
        provider: Some(quote_provider),
    }))
}

/// GET /api/quotes/:investment_id - Get all quotes for a specific investment
pub async fn get_quotes(
    State(state): State<QuoteFetchState>,
    Path(investment_id): Path<i64>,
) -> Result<Json<GetQuotesResponse>> {
    tracing::info!("Getting all quotes for investment ID: {}", investment_id);

    // Get all stored prices for this investment
    let stored_prices = state
        .price_repo
        .find_all(Some(investment_id), None, None)
        .await?;

    let quotes: Vec<QuoteInfo> = stored_prices
        .into_iter()
        .filter_map(|p| {
            Some(QuoteInfo {
                date: p.date?,
                price: p.price?,
                source: p.source.unwrap_or_else(|| "unknown".to_string()),
            })
        })
        .collect();

    Ok(Json(GetQuotesResponse {
        investment_id,
        quotes,
    }))
}

/// POST /api/quotes/fetch - Trigger quote fetch for all investments
pub async fn fetch_quotes(
    State(service): State<Arc<QuoteFetcherService>>,
) -> Result<Json<FetchQuotesResponse>> {
    tracing::info!("Fetching quotes for all investments with configured providers");

    let results = service.fetch_quotes(None).await?;

    let total = results.len();
    let successful = results.iter().filter(|r| r.success).count();
    let failed = total - successful;

    Ok(Json(FetchQuotesResponse {
        results,
        total,
        successful,
        failed,
    }))
}
