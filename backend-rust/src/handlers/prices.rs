use crate::error::Result;
use crate::models::InvestmentPrice;
use crate::repository::traits::InvestmentPriceRepository;
use axum::{
    extract::{Query, State},
    Json,
};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct ListPricesQuery {
    pub investment_id: Option<i64>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct CreatePriceRequest {
    pub date: NaiveDate,
    pub investment_id: i64,
    pub price: f64,
    pub source: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct PriceResponse {
    pub date: NaiveDate,
    pub investment_id: i64,
    pub price: f64,
    pub source: Option<String>,
}

impl From<InvestmentPrice> for PriceResponse {
    fn from(price: InvestmentPrice) -> Self {
        Self {
            date: price.date.unwrap_or_default(),
            investment_id: price.investment_id.unwrap_or_default(),
            price: price.price.unwrap_or_default(),
            source: price.source,
        }
    }
}

/// GET /api/investment-prices - List investment prices with optional filters
pub async fn list_investment_prices(
    State(repo): State<Arc<dyn InvestmentPriceRepository>>,
    Query(query): Query<ListPricesQuery>,
) -> Result<Json<Vec<PriceResponse>>> {
    let prices = repo
        .find_all(query.investment_id, query.start_date, query.end_date)
        .await?;

    Ok(Json(prices.into_iter().map(Into::into).collect()))
}

/// POST /api/investment-prices - Create a new investment price
pub async fn create_investment_price(
    State(repo): State<Arc<dyn InvestmentPriceRepository>>,
    Json(req): Json<CreatePriceRequest>,
) -> Result<Json<PriceResponse>> {
    let price = InvestmentPrice {
        date: Some(req.date),
        investment_id: Some(req.investment_id),
        price: Some(req.price),
        source: req.source,
    };

    repo.create(&price).await?;

    Ok(Json(price.into()))
}

/// POST /api/investment-prices/upsert - Upsert an investment price
pub async fn upsert_investment_price(
    State(repo): State<Arc<dyn InvestmentPriceRepository>>,
    Json(req): Json<CreatePriceRequest>,
) -> Result<Json<PriceResponse>> {
    let price = InvestmentPrice {
        date: Some(req.date),
        investment_id: Some(req.investment_id),
        price: Some(req.price),
        source: req.source,
    };

    repo.upsert(&price).await?;

    Ok(Json(price.into()))
}
