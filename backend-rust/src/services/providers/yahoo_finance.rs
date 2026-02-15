use crate::error::{AppError, Result};
use crate::services::providers::{QuoteData, QuoteProvider};
use chrono::NaiveDate;
use reqwest::Client;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct YahooQuoteResponse {
    chart: YahooChart,
}

#[derive(Debug, Deserialize)]
struct YahooChart {
    result: Vec<YahooResult>,
}

#[derive(Debug, Deserialize)]
struct YahooResult {
    timestamp: Vec<i64>,
    indicators: YahooIndicators,
    meta: YahooMeta,
}

#[derive(Debug, Deserialize)]
struct YahooIndicators {
    quote: Vec<YahooQuote>,
}

#[derive(Debug, Deserialize)]
struct YahooQuote {
    close: Vec<Option<f64>>,
}

#[derive(Debug, Deserialize)]
struct YahooMeta {
    currency: String,
}

pub struct YahooFinanceProvider {
    client: Client,
}

impl YahooFinanceProvider {
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
                .build()
                .unwrap_or_default(),
        }
    }

    async fn fetch_yahoo_data(&self, ticker: &str) -> Result<YahooQuoteResponse> {
        let url = format!(
            "https://query1.finance.yahoo.com/v8/finance/chart/{}?range=max&interval=1d",
            ticker
        );

        let response =
            self.client.get(&url).send().await.map_err(|e| {
                AppError::ExternalApi(format!("Yahoo Finance request failed: {}", e))
            })?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApi(format!(
                "Yahoo Finance returned status: {}",
                response.status()
            )));
        }

        response.json::<YahooQuoteResponse>().await.map_err(|e| {
            AppError::ExternalApi(format!("Failed to parse Yahoo Finance response: {}", e))
        })
    }
}

impl Default for YahooFinanceProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait::async_trait]
impl QuoteProvider for YahooFinanceProvider {
    async fn get_quote(
        &self,
        ticker: &str,
        quote_date: Option<NaiveDate>,
    ) -> Result<Option<QuoteData>> {
        let quotes = self.get_quotes(ticker).await?;

        if let Some(target_date) = quote_date {
            // Find quote for specific date
            Ok(quotes.into_iter().find(|q| q.date == target_date))
        } else {
            // Return latest quote
            Ok(quotes.into_iter().max_by_key(|q| q.date))
        }
    }

    async fn get_quotes(&self, ticker: &str) -> Result<Vec<QuoteData>> {
        tracing::info!("Fetching quotes from Yahoo Finance for ticker: {}", ticker);

        let response = self.fetch_yahoo_data(ticker).await?;

        let result = response.chart.result.first().ok_or_else(|| {
            AppError::ExternalApi("No data in Yahoo Finance response".to_string())
        })?;

        let currency = result.meta.currency.clone();
        let timestamps = &result.timestamp;
        let closes = &result
            .indicators
            .quote
            .first()
            .ok_or_else(|| {
                AppError::ExternalApi("No quote data in Yahoo Finance response".to_string())
            })?
            .close;

        let mut quotes = Vec::new();

        for (i, &timestamp) in timestamps.iter().enumerate() {
            if let Some(Some(close_price)) = closes.get(i) {
                // Convert Unix timestamp to NaiveDate
                let date = chrono::DateTime::from_timestamp(timestamp, 0)
                    .ok_or_else(|| {
                        AppError::ExternalApi(format!("Invalid timestamp: {}", timestamp))
                    })?
                    .date_naive();

                quotes.push(QuoteData::new(
                    ticker.to_string(),
                    date,
                    *close_price,
                    currency.clone(),
                    "yahoo".to_string(),
                ));
            }
        }

        tracing::info!(
            "Fetched {} quotes from Yahoo Finance for {}",
            quotes.len(),
            ticker
        );
        Ok(quotes)
    }

    fn get_provider_name(&self) -> &str {
        "yahoo"
    }
}
