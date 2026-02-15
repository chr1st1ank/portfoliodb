use crate::error::Result;
use crate::models::{Investment, InvestmentPrice};
use crate::repository::traits::{
    InvestmentPriceRepository, InvestmentRepository, SettingsRepository,
};
use crate::services::currency_converter::CurrencyConverter;
use crate::services::providers::{JustETFProvider, QuoteProvider, YahooFinanceProvider};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuoteFetchResult {
    pub investment_id: i64,
    pub success: bool,
    pub error: Option<String>,
    pub quotes_stored: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProviderInfo {
    pub id: String,
    pub name: String,
}

pub struct QuoteFetcherService {
    investment_repo: Arc<dyn InvestmentRepository>,
    price_repo: Arc<dyn InvestmentPriceRepository>,
    settings_repo: Arc<dyn SettingsRepository>,
    currency_converter: CurrencyConverter,
    providers: HashMap<String, Arc<dyn QuoteProvider>>,
}

impl QuoteFetcherService {
    pub fn new(
        investment_repo: Arc<dyn InvestmentRepository>,
        price_repo: Arc<dyn InvestmentPriceRepository>,
        settings_repo: Arc<dyn SettingsRepository>,
    ) -> Self {
        let mut providers: HashMap<String, Arc<dyn QuoteProvider>> = HashMap::new();
        providers.insert("yahoo".to_string(), Arc::new(YahooFinanceProvider::new()));
        providers.insert("justetf".to_string(), Arc::new(JustETFProvider::new()));

        Self {
            investment_repo,
            price_repo,
            settings_repo,
            currency_converter: CurrencyConverter::new(),
            providers,
        }
    }

    /// Get list of available quote providers
    pub fn get_available_providers(&self) -> Vec<ProviderInfo> {
        self.providers
            .keys()
            .map(|id| ProviderInfo {
                id: id.clone(),
                name: id.clone(),
            })
            .collect()
    }

    /// Get base currency from settings
    async fn get_base_currency(&self) -> Result<String> {
        match self.settings_repo.get().await? {
            Some(settings) => Ok(settings.base_currency),
            None => Ok("EUR".to_string()), // Default fallback
        }
    }

    /// Fetch quotes for a single investment
    pub async fn fetch_quotes_for_investment(
        &self,
        investment: &Investment,
    ) -> Result<QuoteFetchResult> {
        let investment_id = investment.id;

        // Validate investment has required configuration
        let quote_provider = match &investment.quote_provider {
            Some(provider) if !provider.is_empty() => provider,
            _ => {
                return Ok(QuoteFetchResult {
                    investment_id,
                    success: false,
                    error: Some("No quote provider configured".to_string()),
                    quotes_stored: 0,
                });
            }
        };

        // Get provider
        let provider = match self.providers.get(quote_provider) {
            Some(p) => p.clone(),
            None => {
                return Ok(QuoteFetchResult {
                    investment_id,
                    success: false,
                    error: Some(format!("Unknown provider: {}", quote_provider)),
                    quotes_stored: 0,
                });
            }
        };

        // Determine ticker to use
        let ticker = investment
            .ticker_symbol
            .as_ref()
            .or(investment.isin.as_ref())
            .ok_or_else(|| {
                crate::error::AppError::InvalidInput("Investment has no ticker or ISIN".to_string())
            })?;

        // Fetch quotes from provider
        let quotes_data = match provider.get_quotes(ticker).await {
            Ok(quotes) if !quotes.is_empty() => quotes,
            Ok(_) => {
                return Ok(QuoteFetchResult {
                    investment_id,
                    success: false,
                    error: Some("No quote data returned from provider".to_string()),
                    quotes_stored: 0,
                });
            }
            Err(e) => {
                return Ok(QuoteFetchResult {
                    investment_id,
                    success: false,
                    error: Some(format!("Provider error: {}", e)),
                    quotes_stored: 0,
                });
            }
        };

        // Get base currency
        let base_currency = self.get_base_currency().await?;

        // Process and store quotes
        let mut stored_count = 0;
        for quote_data in quotes_data {
            // Convert to base currency if needed
            let price_in_base_currency = if quote_data.currency != base_currency {
                match self
                    .currency_converter
                    .convert(
                        quote_data.price,
                        &quote_data.currency,
                        &base_currency,
                        quote_data.date,
                    )
                    .await?
                {
                    Some(converted) => converted,
                    None => {
                        tracing::warn!(
                            "Currency conversion failed for {} on {}: {} to {}",
                            ticker,
                            quote_data.date,
                            quote_data.currency,
                            base_currency
                        );
                        continue;
                    }
                }
            } else {
                quote_data.price
            };

            // Store in database (upsert)
            let price = InvestmentPrice {
                date: Some(quote_data.date),
                investment_id: Some(investment_id),
                price: Some(price_in_base_currency),
                source: Some(quote_data.source.clone()),
            };

            self.price_repo.upsert(&price).await?;
            stored_count += 1;
        }

        tracing::info!(
            "Successfully fetched {} quotes for {} ({})",
            stored_count,
            investment.name.as_deref().unwrap_or("Unknown"),
            ticker
        );

        Ok(QuoteFetchResult {
            investment_id,
            success: true,
            error: None,
            quotes_stored: stored_count,
        })
    }

    /// Fetch quotes for multiple investments
    pub async fn fetch_quotes(
        &self,
        investment_ids: Option<Vec<i64>>,
    ) -> Result<Vec<QuoteFetchResult>> {
        // Get investments to process
        let investments = if let Some(ids) = investment_ids {
            // Fetch specific investments
            let mut inv_list = Vec::new();
            for id in ids {
                if let Some(inv) = self.investment_repo.find_by_id(id).await? {
                    inv_list.push(inv);
                }
            }
            inv_list
        } else {
            // Fetch all investments with quote provider configured
            self.investment_repo
                .find_all()
                .await?
                .into_iter()
                .filter(|inv| {
                    inv.quote_provider
                        .as_ref()
                        .map(|p| !p.is_empty())
                        .unwrap_or(false)
                })
                .collect()
        };

        let mut results = Vec::new();
        for investment in investments {
            let result = self.fetch_quotes_for_investment(&investment).await?;
            results.push(result);
        }

        // Log summary
        let success_count = results.iter().filter(|r| r.success).count();
        tracing::info!(
            "Quote fetch completed: {}/{} successful",
            success_count,
            results.len()
        );

        Ok(results)
    }
}
