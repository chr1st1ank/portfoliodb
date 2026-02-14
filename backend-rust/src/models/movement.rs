use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Movement {
    #[sqlx(rename = "ID")]
    pub id: i64,
    #[sqlx(rename = "Date")]
    pub date: Option<NaiveDate>,
    #[sqlx(rename = "ActionID")]
    pub action_id: Option<i64>,
    #[sqlx(rename = "InvestmentID")]
    pub investment_id: Option<i64>,
    #[sqlx(rename = "Quantity")]
    pub quantity: Option<f64>,
    #[sqlx(rename = "Amount")]
    pub amount: Option<f64>,
    #[sqlx(rename = "Fee")]
    pub fee: Option<f64>,
}
