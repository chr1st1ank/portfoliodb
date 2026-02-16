use crate::error::{AppError, Result};
use crate::models::Investment;
use crate::repository::traits::InvestmentRepository;
use crate::services::quote_fetcher::VALID_PROVIDER_IDS;
use axum::{
    extract::{Path, State},
    Json,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct InvestmentResponse {
    pub id: i64,
    pub name: Option<String>,
    pub isin: Option<String>,
    pub shortname: Option<String>,
    pub ticker_symbol: Option<String>,
    pub quote_provider: Option<String>,
}

impl From<Investment> for InvestmentResponse {
    fn from(inv: Investment) -> Self {
        Self {
            id: inv.id,
            name: inv.name,
            isin: inv.isin,
            shortname: inv.shortname,
            ticker_symbol: inv.ticker_symbol,
            quote_provider: inv.quote_provider,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateInvestmentRequest {
    pub name: Option<String>,
    pub isin: Option<String>,
    pub shortname: Option<String>,
    pub ticker_symbol: Option<String>,
    pub quote_provider: Option<String>,
}

fn validate_quote_provider(provider: &str) -> Result<()> {
    if !VALID_PROVIDER_IDS.contains(&provider) {
        return Err(AppError::InvalidInput(format!(
            "Invalid quote provider '{}'. Valid providers are: {}",
            provider,
            VALID_PROVIDER_IDS.join(", ")
        )));
    }

    Ok(())
}

pub async fn list_investments(
    State(repo): State<Arc<dyn InvestmentRepository>>,
) -> Result<Json<Vec<InvestmentResponse>>> {
    let investments = repo.find_all().await?;
    let response: Vec<InvestmentResponse> = investments.into_iter().map(Into::into).collect();
    Ok(Json(response))
}

pub async fn get_investment(
    State(repo): State<Arc<dyn InvestmentRepository>>,
    Path(id): Path<i64>,
) -> Result<Json<InvestmentResponse>> {
    let investment = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(investment.into()))
}

pub async fn create_investment(
    State(repo): State<Arc<dyn InvestmentRepository>>,
    Json(req): Json<CreateInvestmentRequest>,
) -> Result<Json<InvestmentResponse>> {
    // Validate quote_provider if provided
    if let Some(ref provider) = req.quote_provider {
        validate_quote_provider(provider)?;
    }

    let investment = Investment {
        id: 0,
        name: req.name,
        isin: req.isin,
        shortname: req.shortname,
        ticker_symbol: req.ticker_symbol,
        quote_provider: req.quote_provider,
    };

    let id = repo.create(&investment).await?;
    let created = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(created.into()))
}

pub async fn update_investment(
    State(repo): State<Arc<dyn InvestmentRepository>>,
    Path(id): Path<i64>,
    Json(req): Json<CreateInvestmentRequest>,
) -> Result<Json<InvestmentResponse>> {
    // Validate quote_provider if provided
    if let Some(ref provider) = req.quote_provider {
        validate_quote_provider(provider)?;
    }

    let investment = Investment {
        id,
        name: req.name,
        isin: req.isin,
        shortname: req.shortname,
        ticker_symbol: req.ticker_symbol,
        quote_provider: req.quote_provider,
    };

    repo.update(id, &investment).await?;
    let updated = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(updated.into()))
}

pub async fn delete_investment(
    State(repo): State<Arc<dyn InvestmentRepository>>,
    Path(id): Path<i64>,
) -> Result<Json<()>> {
    repo.delete(id).await?;
    Ok(Json(()))
}
