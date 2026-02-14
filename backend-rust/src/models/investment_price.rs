use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct InvestmentPrice {
    #[sqlx(rename = "Date")]
    pub date: Option<NaiveDate>,
    #[sqlx(rename = "InvestmentID")]
    pub investment_id: Option<i64>,
    #[sqlx(rename = "Price")]
    pub price: Option<f64>,
    #[sqlx(rename = "Source")]
    pub source: Option<String>,
}
