use chrono::NaiveDate;
use portfoliodb_rust::models::{InvestmentPrice, Movement};
use portfoliodb_rust::repository::traits::{InvestmentPriceRepository, MovementRepository};
use portfoliodb_rust::services::PortfolioCalculator;
use std::sync::Arc;

// Mock repository for movements
struct MockMovementRepository {
    movements: Vec<Movement>,
}

impl MockMovementRepository {
    fn new(movements: Vec<Movement>) -> Self {
        Self { movements }
    }
}

#[async_trait::async_trait]
impl MovementRepository for MockMovementRepository {
    async fn find_all(&self) -> portfoliodb_rust::error::Result<Vec<Movement>> {
        Ok(self.movements.clone())
    }

    async fn find_by_id(&self, _id: i64) -> portfoliodb_rust::error::Result<Option<Movement>> {
        unimplemented!()
    }

    async fn create(&self, _movement: &Movement) -> portfoliodb_rust::error::Result<i64> {
        unimplemented!()
    }

    async fn update(&self, _id: i64, _movement: &Movement) -> portfoliodb_rust::error::Result<()> {
        unimplemented!()
    }

    async fn delete(&self, _id: i64) -> portfoliodb_rust::error::Result<()> {
        unimplemented!()
    }
}

// Mock repository for investment prices
struct MockInvestmentPriceRepository {
    prices: Vec<InvestmentPrice>,
}

impl MockInvestmentPriceRepository {
    fn new(prices: Vec<InvestmentPrice>) -> Self {
        Self { prices }
    }
}

#[async_trait::async_trait]
impl InvestmentPriceRepository for MockInvestmentPriceRepository {
    async fn find_all(
        &self,
        _investment_id: Option<i64>,
        _start_date: Option<NaiveDate>,
        _end_date: Option<NaiveDate>,
    ) -> portfoliodb_rust::error::Result<Vec<InvestmentPrice>> {
        Ok(self.prices.clone())
    }

    async fn create(&self, _price: &InvestmentPrice) -> portfoliodb_rust::error::Result<()> {
        unimplemented!()
    }

    async fn upsert(&self, _price: &InvestmentPrice) -> portfoliodb_rust::error::Result<()> {
        unimplemented!()
    }
}

#[tokio::test]
async fn test_portfolio_calculator_simple_buy() {
    // Arrange: One buy transaction
    let movements = vec![Movement {
        id: 1,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        action_id: Some(1), // Buy
        investment_id: Some(1),
        quantity: Some(10.0),
        amount: Some(100.0), // 10 shares at $10 each
        fee: Some(0.0),
    }];

    let prices = vec![];

    let movement_repo = Arc::new(MockMovementRepository::new(movements));
    let price_repo = Arc::new(MockInvestmentPriceRepository::new(prices));

    let calculator = PortfolioCalculator::new(movement_repo, price_repo);

    // Act
    let developments = calculator.calculate_developments(None, None).await.unwrap();

    // Assert
    assert_eq!(developments.len(), 1);
    assert_eq!(developments[0].investment, 1);
    assert_eq!(developments[0].quantity, 10.0);
    assert_eq!(developments[0].price, 10.0); // Transaction price
    assert_eq!(developments[0].value, 100.0);
}

#[tokio::test]
async fn test_portfolio_calculator_buy_and_sell() {
    // Arrange: Buy 10 shares, then sell 3
    let movements = vec![
        Movement {
            id: 1,
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            action_id: Some(1), // Buy
            investment_id: Some(1),
            quantity: Some(10.0),
            amount: Some(100.0),
            fee: Some(0.0),
        },
        Movement {
            id: 2,
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 15).unwrap()),
            action_id: Some(2), // Sell
            investment_id: Some(1),
            quantity: Some(3.0),
            amount: Some(36.0), // 3 shares at $12 each
            fee: Some(0.0),
        },
    ];

    let prices = vec![];

    let movement_repo = Arc::new(MockMovementRepository::new(movements));
    let price_repo = Arc::new(MockInvestmentPriceRepository::new(prices));

    let calculator = PortfolioCalculator::new(movement_repo, price_repo);

    // Act
    let developments = calculator.calculate_developments(None, None).await.unwrap();

    // Assert
    assert_eq!(developments.len(), 2);

    // First development: after buy
    assert_eq!(developments[0].quantity, 10.0);
    assert_eq!(developments[0].price, 10.0);

    // Second development: after sell
    assert_eq!(developments[1].quantity, 7.0); // 10 - 3
    assert_eq!(developments[1].price, 12.0); // Transaction price from sell
}

#[tokio::test]
async fn test_portfolio_calculator_with_quote_prices() {
    // Arrange: Buy transaction and quote prices
    let movements = vec![Movement {
        id: 1,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        action_id: Some(1), // Buy
        investment_id: Some(1),
        quantity: Some(10.0),
        amount: Some(100.0),
        fee: Some(0.0),
    }];

    let prices = vec![
        InvestmentPrice {
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            investment_id: Some(1),
            price: Some(10.5), // Quote price slightly higher
            source: Some("test".to_string()),
        },
        InvestmentPrice {
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 2).unwrap()),
            investment_id: Some(1),
            price: Some(11.0), // Price went up
            source: Some("test".to_string()),
        },
    ];

    let movement_repo = Arc::new(MockMovementRepository::new(movements));
    let price_repo = Arc::new(MockInvestmentPriceRepository::new(prices));

    let calculator = PortfolioCalculator::new(movement_repo, price_repo);

    // Act
    let developments = calculator.calculate_developments(None, None).await.unwrap();

    // Assert
    assert_eq!(developments.len(), 2);

    // First development: quote price preferred over transaction price
    assert_eq!(developments[0].price, 10.5);
    assert_eq!(developments[0].value, 105.0); // 10 * 10.5

    // Second development: only quote price available
    assert_eq!(developments[1].price, 11.0);
    assert_eq!(developments[1].value, 110.0); // 10 * 11.0
}

#[tokio::test]
async fn test_portfolio_calculator_date_filtering() {
    // Arrange: Multiple transactions across different dates
    let movements = vec![
        Movement {
            id: 1,
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            action_id: Some(1),
            investment_id: Some(1),
            quantity: Some(10.0),
            amount: Some(100.0),
            fee: Some(0.0),
        },
        Movement {
            id: 2,
            date: Some(NaiveDate::from_ymd_opt(2024, 2, 1).unwrap()),
            action_id: Some(1),
            investment_id: Some(1),
            quantity: Some(5.0),
            amount: Some(55.0),
            fee: Some(0.0),
        },
    ];

    let prices = vec![];

    let movement_repo = Arc::new(MockMovementRepository::new(movements));
    let price_repo = Arc::new(MockInvestmentPriceRepository::new(prices));

    let calculator = PortfolioCalculator::new(movement_repo, price_repo);

    // Act: Filter to only January
    let start_date = NaiveDate::from_ymd_opt(2024, 1, 1);
    let end_date = NaiveDate::from_ymd_opt(2024, 1, 31);
    let developments = calculator
        .calculate_developments(start_date, end_date)
        .await
        .unwrap();

    // Assert: Should only have January transaction
    assert_eq!(developments.len(), 1);
    assert_eq!(
        developments[0].date,
        NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()
    );
}

#[tokio::test]
async fn test_portfolio_calculator_multiple_investments() {
    // Arrange: Transactions for two different investments
    let movements = vec![
        Movement {
            id: 1,
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            action_id: Some(1),
            investment_id: Some(1),
            quantity: Some(10.0),
            amount: Some(100.0),
            fee: Some(0.0),
        },
        Movement {
            id: 2,
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            action_id: Some(1),
            investment_id: Some(2),
            quantity: Some(5.0),
            amount: Some(50.0),
            fee: Some(0.0),
        },
    ];

    let prices = vec![];

    let movement_repo = Arc::new(MockMovementRepository::new(movements));
    let price_repo = Arc::new(MockInvestmentPriceRepository::new(prices));

    let calculator = PortfolioCalculator::new(movement_repo, price_repo);

    // Act
    let developments = calculator.calculate_developments(None, None).await.unwrap();

    // Assert: Should have developments for both investments
    assert_eq!(developments.len(), 2);

    let inv1_dev = developments.iter().find(|d| d.investment == 1).unwrap();
    assert_eq!(inv1_dev.quantity, 10.0);

    let inv2_dev = developments.iter().find(|d| d.investment == 2).unwrap();
    assert_eq!(inv2_dev.quantity, 5.0);
}

#[tokio::test]
async fn test_portfolio_calculator_last_known_price() {
    // Arrange: Buy on day 1, quote on day 2, no data on day 3
    let movements = vec![Movement {
        id: 1,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        action_id: Some(1),
        investment_id: Some(1),
        quantity: Some(10.0),
        amount: Some(100.0),
        fee: Some(0.0),
    }];

    let prices = vec![
        InvestmentPrice {
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 2).unwrap()),
            investment_id: Some(1),
            price: Some(11.0),
            source: Some("test".to_string()),
        },
        InvestmentPrice {
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 3).unwrap()),
            investment_id: Some(1),
            price: Some(12.0),
            source: Some("test".to_string()),
        },
    ];

    let movement_repo = Arc::new(MockMovementRepository::new(movements));
    let price_repo = Arc::new(MockInvestmentPriceRepository::new(prices));

    let calculator = PortfolioCalculator::new(movement_repo, price_repo);

    // Act
    let developments = calculator.calculate_developments(None, None).await.unwrap();

    // Assert
    assert_eq!(developments.len(), 3);

    // Day 1: transaction price
    assert_eq!(developments[0].price, 10.0);

    // Day 2: quote price
    assert_eq!(developments[1].price, 11.0);

    // Day 3: quote price (not last known from day 2)
    assert_eq!(developments[2].price, 12.0);
}
