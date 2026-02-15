use crate::error::Result;
use crate::services::PortfolioCalculator;
use axum::{extract::Query, extract::State, Json};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Deserialize)]
pub struct DevelopmentQuery {
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Debug, Serialize)]
pub struct DevelopmentResponse {
    pub investment: i64,
    pub date: String,
    pub price: f64,
    pub quantity: f64,
    pub value: f64,
}

impl From<crate::services::portfolio_calculator::Development> for DevelopmentResponse {
    fn from(dev: crate::services::portfolio_calculator::Development) -> Self {
        Self {
            investment: dev.investment,
            date: dev.date.to_string(),
            price: dev.price,
            quantity: dev.quantity,
            value: dev.value,
        }
    }
}

pub async fn list_developments(
    State(calculator): State<Arc<PortfolioCalculator>>,
    Query(params): Query<DevelopmentQuery>,
) -> Result<Json<Vec<DevelopmentResponse>>> {
    let developments = calculator
        .calculate_developments(params.start_date, params.end_date)
        .await?;

    let response: Vec<DevelopmentResponse> = developments.into_iter().map(Into::into).collect();
    Ok(Json(response))
}
