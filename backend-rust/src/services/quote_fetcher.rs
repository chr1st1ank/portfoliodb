use crate::error::Result;
use crate::models::{Investment, InvestmentPrice};
use crate::repository::traits::{InvestmentPriceRepository, InvestmentRepository};
use crate::services::currency_converter::CurrencyConverter;
use crate::services::quotes::{JustETFProvider, QuoteProvider, YahooFinanceProvider};
use serde::{Deserialize, Serialize};
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

/// Centralized list of available quote providers (id, name)
pub const AVAILABLE_PROVIDERS: &[(&str, &str)] =
    &[("yahoo", "Yahoo Finance"), ("justetf", "JustETF")];

/// Valid quote provider IDs (derived from AVAILABLE_PROVIDERS)
pub const VALID_PROVIDER_IDS: &[&str] = &["yahoo", "justetf"];

pub struct QuoteFetcherService {
    investment_repo: Arc<dyn InvestmentRepository>,
    price_repo: Arc<dyn InvestmentPriceRepository>,
    base_currency: String,
    currency_converter: CurrencyConverter,
}

impl QuoteFetcherService {
    pub fn new(
        investment_repo: Arc<dyn InvestmentRepository>,
        price_repo: Arc<dyn InvestmentPriceRepository>,
        base_currency: String,
    ) -> Self {
        Self {
            investment_repo,
            price_repo,
            base_currency,
            currency_converter: CurrencyConverter::new(),
        }
    }

    /// Get list of available quote providers
    pub fn get_available_providers(&self) -> Vec<ProviderInfo> {
        AVAILABLE_PROVIDERS
            .iter()
            .map(|(id, name)| ProviderInfo {
                id: id.to_string(),
                name: name.to_string(),
            })
            .collect()
    }

    /// Create a provider instance on-demand based on provider name
    fn create_provider(&self, provider_name: &str) -> Option<Arc<dyn QuoteProvider>> {
        match provider_name {
            "yahoo" => Some(Arc::new(YahooFinanceProvider::new())),
            "justetf" => Some(Arc::new(JustETFProvider::new())),
            _ => None,
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

        // Get provider (create on-demand)
        let provider = match self.create_provider(quote_provider) {
            Some(p) => p,
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

        // Process and store quotes
        let mut stored_count = 0;
        for quote_data in quotes_data {
            // Convert to base currency if needed
            let price_in_base_currency = if quote_data.currency != self.base_currency {
                match self
                    .currency_converter
                    .convert(
                        quote_data.price,
                        &quote_data.currency,
                        &self.base_currency,
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
                            self.base_currency
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

    /// Fetch only the latest quote for a single investment
    pub async fn fetch_latest_quote_for_investment(
        &self,
        investment_id: i64,
    ) -> Result<(QuoteFetchResult, Option<InvestmentPrice>)> {
        // Get investment
        let investment = self
            .investment_repo
            .find_by_id(investment_id)
            .await?
            .ok_or_else(|| crate::error::AppError::NotFound)?;

        // Validate investment has required configuration
        let quote_provider = match &investment.quote_provider {
            Some(provider) if !provider.is_empty() => provider,
            _ => {
                return Ok((
                    QuoteFetchResult {
                        investment_id,
                        success: false,
                        error: Some("No quote provider configured".to_string()),
                        quotes_stored: 0,
                    },
                    None,
                ));
            }
        };

        // Get provider (create on-demand)
        let provider = match self.create_provider(quote_provider) {
            Some(p) => p,
            None => {
                return Ok((
                    QuoteFetchResult {
                        investment_id,
                        success: false,
                        error: Some(format!("Unknown provider: {}", quote_provider)),
                        quotes_stored: 0,
                    },
                    None,
                ));
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

        // Fetch latest quote from provider (None = latest)
        let quote_data = match provider.get_quote(ticker, None).await {
            Ok(Some(quote)) => quote,
            Ok(None) => {
                return Ok((
                    QuoteFetchResult {
                        investment_id,
                        success: false,
                        error: Some("No quote data returned from provider".to_string()),
                        quotes_stored: 0,
                    },
                    None,
                ));
            }
            Err(e) => {
                return Ok((
                    QuoteFetchResult {
                        investment_id,
                        success: false,
                        error: Some(format!("Provider error: {}", e)),
                        quotes_stored: 0,
                    },
                    None,
                ));
            }
        };

        // Convert to base currency if needed
        let price_in_base_currency = if quote_data.currency != self.base_currency {
            match self
                .currency_converter
                .convert(
                    quote_data.price,
                    &quote_data.currency,
                    &self.base_currency,
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
                        self.base_currency
                    );
                    return Ok((
                        QuoteFetchResult {
                            investment_id,
                            success: false,
                            error: Some("Currency conversion failed".to_string()),
                            quotes_stored: 0,
                        },
                        None,
                    ));
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

        tracing::info!(
            "Successfully fetched latest quote for {} ({}): {} {} on {}",
            investment.name.as_deref().unwrap_or("Unknown"),
            ticker,
            price_in_base_currency,
            self.base_currency,
            quote_data.date
        );

        Ok((
            QuoteFetchResult {
                investment_id,
                success: true,
                error: None,
                quotes_stored: 1,
            },
            Some(price),
        ))
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
