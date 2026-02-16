mod test_helpers;

use chrono::NaiveDate;
use portfoliodb_rust::models::{Investment, InvestmentPrice};
use portfoliodb_rust::repository::traits::{InvestmentPriceRepository, InvestmentRepository};
use portfoliodb_rust::repository::{SqliteInvestmentPriceRepository, SqliteInvestmentRepository};
use test_helpers::setup_test_db;

#[tokio::test]
async fn test_find_all_empty() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentPriceRepository::new(pool);

    let prices = repo.find_all(None, None, None).await.unwrap();
    assert_eq!(prices.len(), 0);
}

#[tokio::test]
async fn test_create_price() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    let inv_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Test".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    let price = InvestmentPrice {
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 15).unwrap()),
        investment_id: Some(inv_id),
        price: Some(50.25),
        source: Some("yahoo".to_string()),
    };

    price_repo.create(&price).await.unwrap();

    let prices = price_repo.find_all(None, None, None).await.unwrap();
    assert_eq!(prices.len(), 1);
}

#[tokio::test]
async fn test_find_all_with_investment_filter() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    // Create two investments
    let inv1_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Investment 1".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    let inv2_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Investment 2".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    // Create prices for both
    price_repo
        .create(&InvestmentPrice {
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            investment_id: Some(inv1_id),
            price: Some(100.0),
            source: Some("test".to_string()),
        })
        .await
        .unwrap();

    price_repo
        .create(&InvestmentPrice {
            date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
            investment_id: Some(inv2_id),
            price: Some(200.0),
            source: Some("test".to_string()),
        })
        .await
        .unwrap();

    // Filter by investment 1
    let prices = price_repo
        .find_all(Some(inv1_id), None, None)
        .await
        .unwrap();
    assert_eq!(prices.len(), 1);
    assert_eq!(prices[0].investment_id, Some(inv1_id));
    assert_eq!(prices[0].price, Some(100.0));
}

#[tokio::test]
async fn test_find_all_with_date_range() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    let inv_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Test".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    // Create prices for different dates
    for day in 1..=5 {
        price_repo
            .create(&InvestmentPrice {
                date: Some(NaiveDate::from_ymd_opt(2024, 1, day).unwrap()),
                investment_id: Some(inv_id),
                price: Some(100.0 + day as f64),
                source: Some("test".to_string()),
            })
            .await
            .unwrap();
    }

    // Filter by date range (Jan 2-4)
    let start_date = Some(NaiveDate::from_ymd_opt(2024, 1, 2).unwrap());
    let end_date = Some(NaiveDate::from_ymd_opt(2024, 1, 4).unwrap());
    let prices = price_repo
        .find_all(None, start_date, end_date)
        .await
        .unwrap();

    assert_eq!(prices.len(), 3);
}

#[tokio::test]
async fn test_find_all_with_start_date_only() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    let inv_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Test".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    // Create prices
    for day in 1..=5 {
        price_repo
            .create(&InvestmentPrice {
                date: Some(NaiveDate::from_ymd_opt(2024, 1, day).unwrap()),
                investment_id: Some(inv_id),
                price: Some(100.0),
                source: Some("test".to_string()),
            })
            .await
            .unwrap();
    }

    // Filter with start date only
    let start_date = Some(NaiveDate::from_ymd_opt(2024, 1, 3).unwrap());
    let prices = price_repo.find_all(None, start_date, None).await.unwrap();

    assert_eq!(prices.len(), 3); // Days 3, 4, 5
}

#[tokio::test]
async fn test_upsert_insert() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    let inv_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Test".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    let price = InvestmentPrice {
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        investment_id: Some(inv_id),
        price: Some(100.0),
        source: Some("yahoo".to_string()),
    };

    // Upsert (insert)
    price_repo.upsert(&price).await.unwrap();

    let prices = price_repo.find_all(None, None, None).await.unwrap();
    assert_eq!(prices.len(), 1);
    assert_eq!(prices[0].price, Some(100.0));
}

#[tokio::test]
async fn test_upsert_update() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    let inv_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Test".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    let date = NaiveDate::from_ymd_opt(2024, 1, 1).unwrap();

    // Insert initial price
    let price1 = InvestmentPrice {
        date: Some(date),
        investment_id: Some(inv_id),
        price: Some(100.0),
        source: Some("yahoo".to_string()),
    };
    price_repo.create(&price1).await.unwrap();

    // Upsert with same source - should update
    let price2 = InvestmentPrice {
        date: Some(date),
        investment_id: Some(inv_id),
        price: Some(150.0),
        source: Some("yahoo".to_string()),
    };
    price_repo.upsert(&price2).await.unwrap();

    // Should still have only 1 record, but with updated price
    let prices = price_repo.find_all(None, None, None).await.unwrap();
    assert_eq!(prices.len(), 1);
    assert_eq!(prices[0].price, Some(150.0));
    assert_eq!(prices[0].source, Some("yahoo".to_string()));

    // Upsert with different source - should create new record
    let price3 = InvestmentPrice {
        date: Some(date),
        investment_id: Some(inv_id),
        price: Some(200.0),
        source: Some("justetf".to_string()),
    };
    price_repo.upsert(&price3).await.unwrap();

    // Should now have 2 records (different sources)
    let prices = price_repo.find_all(None, None, None).await.unwrap();
    assert_eq!(prices.len(), 2);
}

#[tokio::test]
async fn test_decimal_to_real_conversion() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    let inv_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Test".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    let price = InvestmentPrice {
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        investment_id: Some(inv_id),
        price: Some(123.456),
        source: Some("test".to_string()),
    };

    price_repo.create(&price).await.unwrap();

    let prices = price_repo.find_all(None, None, None).await.unwrap();
    assert_eq!(prices[0].price, Some(123.456));
}

#[tokio::test]
async fn test_combined_filters() {
    let pool = setup_test_db().await;
    let price_repo = SqliteInvestmentPriceRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    // Create two investments
    let inv1_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Investment 1".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    let inv2_id = investment_repo
        .create(&Investment {
            id: 0,
            name: Some("Investment 2".to_string()),
            isin: None,
            shortname: None,
            ticker_symbol: None,
            quote_provider: None,
        })
        .await
        .unwrap();

    // Create prices for both investments across multiple dates
    for day in 1..=5 {
        price_repo
            .create(&InvestmentPrice {
                date: Some(NaiveDate::from_ymd_opt(2024, 1, day).unwrap()),
                investment_id: Some(inv1_id),
                price: Some(100.0),
                source: Some("test".to_string()),
            })
            .await
            .unwrap();

        price_repo
            .create(&InvestmentPrice {
                date: Some(NaiveDate::from_ymd_opt(2024, 1, day).unwrap()),
                investment_id: Some(inv2_id),
                price: Some(200.0),
                source: Some("test".to_string()),
            })
            .await
            .unwrap();
    }

    // Filter by investment 1 and date range (Jan 2-4)
    let start_date = Some(NaiveDate::from_ymd_opt(2024, 1, 2).unwrap());
    let end_date = Some(NaiveDate::from_ymd_opt(2024, 1, 4).unwrap());
    let prices = price_repo
        .find_all(Some(inv1_id), start_date, end_date)
        .await
        .unwrap();

    assert_eq!(prices.len(), 3);
    for price in prices {
        assert_eq!(price.investment_id, Some(inv1_id));
    }
}
