use crate::error::Result;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};

/// Quote data returned by providers
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteData {
    pub ticker: String,
    pub date: NaiveDate,
    pub price: f64,
    pub currency: String,
    pub source: String,
}

impl QuoteData {
    pub fn new(
        ticker: String,
        date: NaiveDate,
        price: f64,
        currency: String,
        source: String,
    ) -> Self {
        Self {
            ticker,
            date,
            price,
            currency,
            source,
        }
    }
}

/// Trait for quote providers
#[async_trait::async_trait]
pub trait QuoteProvider: Send + Sync {
    /// Get a single quote for the given ticker and date
    /// If date is None, fetches the latest quote
    async fn get_quote(
        &self,
        ticker: &str,
        quote_date: Option<NaiveDate>,
    ) -> Result<Option<QuoteData>>;

    /// Fetch all available historical quotes for the given ticker
    async fn get_quotes(&self, ticker: &str) -> Result<Vec<QuoteData>>;

    /// Get the name/ID of this provider
    fn get_provider_name(&self) -> &str;
}
