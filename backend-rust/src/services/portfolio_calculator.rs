use crate::error::Result;
use crate::models::{InvestmentPrice, Movement};
use crate::repository::traits::{InvestmentPriceRepository, MovementRepository};
use chrono::NaiveDate;
use serde::Serialize;
use std::collections::{HashMap, HashSet};
use std::sync::Arc;

#[derive(Debug, Clone, Serialize)]
pub struct Development {
    pub investment: i64,
    pub date: NaiveDate,
    pub price: f64,
    pub quantity: f64,
    pub value: f64,
}

pub struct PortfolioCalculator {
    movement_repo: Arc<dyn MovementRepository>,
    price_repo: Arc<dyn InvestmentPriceRepository>,
}

impl PortfolioCalculator {
    pub fn new(
        movement_repo: Arc<dyn MovementRepository>,
        price_repo: Arc<dyn InvestmentPriceRepository>,
    ) -> Self {
        Self {
            movement_repo,
            price_repo,
        }
    }

    /// Calculate portfolio developments combining movement data and fetched quotes.
    ///
    /// For each investment and date, we calculate:
    /// - quantity: cumulative quantity held (from movements)
    /// - price: market price from InvestmentPrice if available, otherwise transaction price
    /// - value: quantity * price
    pub async fn calculate_developments(
        &self,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
    ) -> Result<Vec<Development>> {
        // Get all movements and prices
        let movements = self.movement_repo.find_all().await?;
        let prices = self.price_repo.find_all(None, start_date, end_date).await?;

        // Calculate transaction days with average transaction price
        let transaction_days = self.calculate_transaction_days(&movements);

        // Create a mapping of (investment, date) -> quote price
        let quote_prices = self.create_quote_price_map(&prices);

        // Combine all unique (investment, date) pairs
        let all_dates = self.collect_all_dates(&transaction_days, &prices);

        // Pre-calculate buy/sell aggregates
        let buy_movements = self.aggregate_movements(&movements, 1);
        let sell_movements = self.aggregate_movements(&movements, 2);

        // Build developments for all dates
        let mut developments = Vec::new();
        let mut last_price_by_investment: HashMap<i64, f64> = HashMap::new();

        for (investment_id, date) in all_dates {
            // Apply date filtering
            if let Some(start) = start_date {
                if date < start {
                    continue;
                }
            }
            if let Some(end) = end_date {
                if date > end {
                    continue;
                }
            }

            // Calculate quantity held on this date
            let quantity_bought = self.sum_quantities(&buy_movements, investment_id, date);
            let quantity_sold = self.sum_quantities(&sell_movements, investment_id, date);
            let quantity = quantity_bought - quantity_sold;

            // Determine price: prefer quote price, fallback to transaction price, then last known price
            let mut price: Option<f64> = None;

            // 1. Try to get quote price for this date
            if let Some(&quote_price) = quote_prices.get(&(investment_id, date)) {
                price = Some(quote_price);
            }

            // 2. If no quote, try to get transaction price for this date
            if price.is_none() {
                if let Some(transaction_price) = transaction_days.get(&(investment_id, date)) {
                    price = Some(*transaction_price);
                }
            }

            // 3. If still no price, use last known price for this investment
            if price.is_none() {
                price = last_price_by_investment.get(&investment_id).copied();
            }

            // Only add development if we have a price
            if let Some(price_value) = price {
                // Update last known price
                last_price_by_investment.insert(investment_id, price_value);

                developments.push(Development {
                    investment: investment_id,
                    date,
                    price: price_value,
                    quantity,
                    value: quantity * price_value,
                });
            }
        }

        Ok(developments)
    }

    /// Calculate average transaction price for each (investment, date) pair
    fn calculate_transaction_days(&self, movements: &[Movement]) -> HashMap<(i64, NaiveDate), f64> {
        let mut transaction_map: HashMap<(i64, NaiveDate), Vec<f64>> = HashMap::new();

        for movement in movements {
            if let (Some(inv_id), Some(date), Some(amount), Some(quantity)) = (
                movement.investment_id,
                movement.date,
                movement.amount,
                movement.quantity,
            ) {
                if quantity != 0.0 {
                    let transaction_price = (amount / quantity).abs();
                    transaction_map
                        .entry((inv_id, date))
                        .or_insert_with(Vec::new)
                        .push(transaction_price);
                }
            }
        }

        // Calculate averages
        transaction_map
            .into_iter()
            .map(|(key, prices)| {
                let avg = prices.iter().sum::<f64>() / prices.len() as f64;
                (key, avg)
            })
            .collect()
    }

    /// Create a mapping of (investment, date) -> quote price
    fn create_quote_price_map(&self, prices: &[InvestmentPrice]) -> HashMap<(i64, NaiveDate), f64> {
        prices
            .iter()
            .filter_map(|p| {
                if let (Some(inv_id), Some(date), Some(price)) = (p.investment_id, p.date, p.price)
                {
                    Some(((inv_id, date), price))
                } else {
                    None
                }
            })
            .collect()
    }

    /// Collect all unique (investment, date) pairs from transactions and quotes
    fn collect_all_dates(
        &self,
        transaction_days: &HashMap<(i64, NaiveDate), f64>,
        prices: &[InvestmentPrice],
    ) -> Vec<(i64, NaiveDate)> {
        let mut all_dates: HashSet<(i64, NaiveDate)> = HashSet::new();

        // Add transaction dates
        for &key in transaction_days.keys() {
            all_dates.insert(key);
        }

        // Add quote dates
        for price in prices {
            if let (Some(inv_id), Some(date)) = (price.investment_id, price.date) {
                all_dates.insert((inv_id, date));
            }
        }

        // Sort by investment and date
        let mut sorted_dates: Vec<_> = all_dates.into_iter().collect();
        sorted_dates.sort_by(|a, b| a.0.cmp(&b.0).then(a.1.cmp(&b.1)));
        sorted_dates
    }

    /// Aggregate movements by action type (1=Buy, 2=Sell)
    fn aggregate_movements(
        &self,
        movements: &[Movement],
        action_id: i64,
    ) -> HashMap<(i64, NaiveDate), f64> {
        let mut aggregates: HashMap<(i64, NaiveDate), f64> = HashMap::new();

        for movement in movements {
            if movement.action_id == Some(action_id) {
                if let (Some(inv_id), Some(date), Some(quantity)) =
                    (movement.investment_id, movement.date, movement.quantity)
                {
                    *aggregates.entry((inv_id, date)).or_insert(0.0) += quantity;
                }
            }
        }

        aggregates
    }

    /// Sum quantities up to and including a specific date
    fn sum_quantities(
        &self,
        aggregates: &HashMap<(i64, NaiveDate), f64>,
        investment_id: i64,
        up_to_date: NaiveDate,
    ) -> f64 {
        aggregates
            .iter()
            .filter(|((inv_id, date), _)| *inv_id == investment_id && *date <= up_to_date)
            .map(|(_, quantity)| quantity)
            .sum()
    }
}
