use crate::error::Result;
use crate::models::InvestmentPrice;
use crate::repository::InvestmentPriceRepository;
use axum::{
    extract::{Query, State},
    Json,
};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct InvestmentPriceResponse {
    pub date: Option<NaiveDate>,
    pub investment_id: Option<i64>,
    pub price: Option<f64>,
    pub source: Option<String>,
}

impl From<InvestmentPrice> for InvestmentPriceResponse {
    fn from(p: InvestmentPrice) -> Self {
        Self {
            date: p.date,
            investment_id: p.investment_id,
            price: p.price,
            source: p.source,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct InvestmentPriceQuery {
    pub investment_id: Option<i64>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize)]
pub struct CreateInvestmentPriceRequest {
    pub date: Option<NaiveDate>,
    pub investment_id: Option<i64>,
    pub price: Option<f64>,
    pub source: Option<String>,
}

pub async fn list_investment_prices(
    State(repo): State<Arc<InvestmentPriceRepository>>,
    Query(params): Query<InvestmentPriceQuery>,
) -> Result<Json<Vec<InvestmentPriceResponse>>> {
    let mut start_date = params.start_date;
    let end_date = params.end_date;

    // Default to last 3 years if no dates specified
    if start_date.is_none() && end_date.is_none() {
        let three_years_ago = chrono::Local::now().date_naive() - chrono::Duration::days(3 * 365);
        start_date = Some(three_years_ago);
    }

    let prices = repo
        .find_all(params.investment_id, start_date, end_date)
        .await?;
    let response: Vec<InvestmentPriceResponse> = prices.into_iter().map(Into::into).collect();
    Ok(Json(response))
}

pub async fn create_investment_price(
    State(repo): State<Arc<InvestmentPriceRepository>>,
    Json(req): Json<CreateInvestmentPriceRequest>,
) -> Result<Json<InvestmentPriceResponse>> {
    let price = InvestmentPrice {
        date: req.date,
        investment_id: req.investment_id,
        price: req.price,
        source: req.source,
    };

    repo.create(&price).await?;
    Ok(Json(price.into()))
}

pub async fn upsert_investment_price(
    State(repo): State<Arc<InvestmentPriceRepository>>,
    Json(req): Json<CreateInvestmentPriceRequest>,
) -> Result<Json<InvestmentPriceResponse>> {
    let price = InvestmentPrice {
        date: req.date,
        investment_id: req.investment_id,
        price: req.price,
        source: req.source,
    };

    repo.upsert(&price).await?;
    Ok(Json(price.into()))
}
