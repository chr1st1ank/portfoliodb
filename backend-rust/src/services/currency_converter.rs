use crate::error::{AppError, Result};
use chrono::NaiveDate;
use reqwest::Client;
use serde::Deserialize;
use std::collections::HashMap;

#[derive(Debug, Deserialize)]
struct FrankfurterResponse {
    rates: HashMap<String, f64>,
}

pub struct CurrencyConverter {
    client: Client,
}

impl CurrencyConverter {
    pub fn new() -> Self {
        Self {
            client: Client::new(),
        }
    }

    /// Convert amount from one currency to another on a specific date
    /// Uses Frankfurter.app API for historical exchange rates
    pub async fn convert(
        &self,
        amount: f64,
        from_currency: &str,
        to_currency: &str,
        conversion_date: NaiveDate,
    ) -> Result<Option<f64>> {
        // If currencies are the same, no conversion needed
        if from_currency == to_currency {
            return Ok(Some(amount));
        }

        tracing::info!(
            "Converting {} {} to {} on {}",
            amount,
            from_currency,
            to_currency,
            conversion_date
        );

        // Frankfurter API endpoint
        let url = format!(
            "https://api.frankfurter.app/{}?from={}&to={}",
            conversion_date, from_currency, to_currency
        );

        let response = self
            .client
            .get(&url)
            .send()
            .await
            .map_err(|_e| AppError::CurrencyConversion)?;

        if !response.status().is_success() {
            tracing::warn!(
                "Currency conversion failed: {} returned status {}",
                url,
                response.status()
            );
            return Ok(None);
        }

        let data: FrankfurterResponse = response
            .json()
            .await
            .map_err(|_| AppError::CurrencyConversion)?;

        if let Some(&rate) = data.rates.get(to_currency) {
            let converted = amount * rate;
            tracing::info!(
                "Converted {} {} to {} {} (rate: {})",
                amount,
                from_currency,
                converted,
                to_currency,
                rate
            );
            Ok(Some(converted))
        } else {
            tracing::warn!(
                "No conversion rate found for {} to {}",
                from_currency,
                to_currency
            );
            Ok(None)
        }
    }
}

impl Default for CurrencyConverter {
    fn default() -> Self {
        Self::new()
    }
}
