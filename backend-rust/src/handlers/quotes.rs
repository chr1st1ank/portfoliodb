use crate::error::Result;
use crate::services::quote_fetcher::{ProviderInfo, QuoteFetchResult, QuoteFetcherService};
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct FetchQuotesRequest {
    pub investment_ids: Option<Vec<i64>>,
}

#[derive(Debug, Serialize)]
pub struct FetchQuotesResponse {
    pub results: Vec<QuoteFetchResult>,
    pub total: usize,
    pub successful: usize,
    pub failed: usize,
}

/// GET /api/quotes/providers - List available quote providers
pub async fn list_providers(
    State(service): State<Arc<QuoteFetcherService>>,
) -> Result<Json<Vec<ProviderInfo>>> {
    let providers = service.get_available_providers();
    Ok(Json(providers))
}

/// POST /api/quotes/fetch - Trigger quote fetch for investments
pub async fn fetch_quotes(
    State(service): State<Arc<QuoteFetcherService>>,
    Json(request): Json<FetchQuotesRequest>,
) -> Result<Json<FetchQuotesResponse>> {
    tracing::info!(
        "Fetching quotes for investments: {:?}",
        request.investment_ids
    );

    let results = service.fetch_quotes(request.investment_ids).await?;

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
