use crate::error::{AppError, Result};
use crate::services::quotes::{QuoteData, QuoteProvider};
use chrono::NaiveDate;
use reqwest::Client;

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
        _quote_date: Option<NaiveDate>,
    ) -> Result<Option<QuoteData>> {
        tracing::info!("Fetching quote from JustETF for ISIN: {}", ticker);

        // JustETF URL format: https://www.justetf.com/en/etf-profile.html?isin=<ISIN>
        let url = format!(
            "https://www.justetf.com/en/etf-profile.html?isin={}",
            ticker
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|e| AppError::ExternalApi(format!("JustETF request failed: {}", e)))?;

        if !response.status().is_success() {
            return Err(AppError::ExternalApi(format!(
                "JustETF returned status: {}",
                response.status()
            )));
        }

        let html = response.text().await.map_err(|e| {
            AppError::ExternalApi(format!("Failed to read JustETF response: {}", e))
        })?;

        // Parse HTML to extract price
        // Note: This is a simplified implementation
        // In production, you'd use a proper HTML parser like scraper crate

        // Look for price pattern in HTML (this is fragile and may need updates)
        // JustETF typically shows price in format like "€123.45" or "USD 123.45"
        let price_pattern = regex::Regex::new(r"(?:€|USD|EUR|GBP)\s*([0-9]+[.,][0-9]{2})")
            .map_err(|e| AppError::ExternalApi(format!("Regex error: {}", e)))?;

        if let Some(captures) = price_pattern.captures(&html) {
            if let Some(price_str) = captures.get(1) {
                let price_str = price_str.as_str().replace(',', ".");
                if let Ok(price) = price_str.parse::<f64>() {
                    // Determine currency from HTML (simplified)
                    let currency = if html.contains("€") || html.contains("EUR") {
                        "EUR"
                    } else if html.contains("USD") {
                        "USD"
                    } else if html.contains("GBP") {
                        "GBP"
                    } else {
                        "EUR" // Default
                    };

                    let quote = QuoteData::new(
                        ticker.to_string(),
                        chrono::Local::now().date_naive(),
                        price,
                        currency.to_string(),
                        "justetf".to_string(),
                    );

                    tracing::info!(
                        "Fetched quote from JustETF: {} {} {}",
                        ticker,
                        price,
                        currency
                    );
                    return Ok(Some(quote));
                }
            }
        }

        tracing::warn!("Could not extract price from JustETF for {}", ticker);
        Ok(None)
    }

    async fn get_quotes(&self, ticker: &str) -> Result<Vec<QuoteData>> {
        // JustETF doesn't provide historical data easily via scraping
        // Return single latest quote
        match self.get_quote(ticker, None).await? {
            Some(quote) => Ok(vec![quote]),
            None => Ok(vec![]),
        }
    }

    fn get_provider_name(&self) -> &str {
        "justetf"
    }
}
