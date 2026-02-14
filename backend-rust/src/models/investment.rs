use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Investment {
    #[sqlx(rename = "ID")]
    pub id: i64,
    #[sqlx(rename = "Name")]
    pub name: Option<String>,
    #[sqlx(rename = "ISIN")]
    pub isin: Option<String>,
    #[sqlx(rename = "ShortName")]
    pub shortname: Option<String>,
    #[sqlx(rename = "TickerSymbol")]
    pub ticker_symbol: Option<String>,
    #[sqlx(rename = "QuoteProvider")]
    pub quote_provider: Option<String>,
}
