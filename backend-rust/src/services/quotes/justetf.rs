use crate::error::{AppError, Result};
use crate::services::quotes::{QuoteData, QuoteProvider};
use chrono::NaiveDate;
use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct JustETFResponse {
    series: Vec<JustETFDataPoint>,
}

#[derive(Debug, Deserialize)]
struct JustETFDataPoint {
    date: String,
    value: JustETFValue,
}

#[derive(Debug, Deserialize)]
struct JustETFValue {
    raw: f64,
}

pub struct JustETFProvider {
    client: Client,
}

impl JustETFProvider {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .build()
                .unwrap_or_default(),
        }
    }

    async fn fetch_quotes_range(
        &self,
        ticker: &str,
        date_from: NaiveDate,
        date_to: NaiveDate,
    ) -> Result<Vec<QuoteData>> {
        tracing::info!(
            "Fetching quotes from JustETF API for ISIN: {} ({} to {})",
            ticker,
            date_from,
            date_to
        );

        let url = format!(
            "https://www.justetf.com/api/etfs/{}/performance-chart?locale=en&currency=EUR&valuesType=MARKET_VALUE&reduceData=false&includeDividends=false&dateFrom={}&dateTo={}",
            ticker,
            date_from.format("%Y-%m-%d"),
            date_to.format("%Y-%m-%d")
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::ExternalApi(format!("JustETF API request failed: {}", e)))?;

        if response.status() == 404 {
            tracing::warn!("ISIN {} not found on JustETF", ticker);
            return Ok(vec![]);
        }

        if !response.status().is_success() {
            return Err(AppError::ExternalApi(format!(
                "JustETF API returned status: {}",
                response.status()
            )));
        }

        let data: JustETFResponse = response.json().await.map_err(|e| {
            AppError::ExternalApi(format!("Failed to parse JustETF API response: {}", e))
        })?;

        let mut quotes = Vec::new();
        for point in data.series {
            if let Ok(date) = NaiveDate::parse_from_str(&point.date, "%Y-%m-%d") {
                quotes.push(QuoteData::new(
                    ticker.to_string(),
                    date,
                    point.value.raw,
                    "EUR".to_string(),
                    "justetf".to_string(),
                ));
            }
        }

        tracing::info!(
            "Fetched {} quotes from JustETF API for {}",
            quotes.len(),
            ticker
        );
        Ok(quotes)
    }
}

impl Default for JustETFProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl QuoteProvider for JustETFProvider {
    async fn get_quote(
        &self,
        ticker: &str,
        quote_date: Option<NaiveDate>,
    ) -> Result<Option<QuoteData>> {
        if let Some(target_date) = quote_date {
            let date_from = target_date - chrono::Duration::days(3);
            let date_to = target_date + chrono::Duration::days(3);
            let quotes = self.fetch_quotes_range(ticker, date_from, date_to).await?;
            Ok(quotes.into_iter().find(|q| q.date == target_date))
        } else {
            let date_to = chrono::Utc::now().date_naive();
            let date_from = date_to - chrono::Duration::days(7);
            let quotes = self.fetch_quotes_range(ticker, date_from, date_to).await?;
            Ok(quotes.into_iter().max_by_key(|q| q.date))
        }
    }

    async fn get_quotes(&self, ticker: &str) -> Result<Vec<QuoteData>> {
        let date_to = chrono::Utc::now().date_naive();
        let date_from = date_to - chrono::Duration::days(90);
        self.fetch_quotes_range(ticker, date_from, date_to).await
    }

    fn get_provider_name(&self) -> &str {
        "justetf"
    }
}
