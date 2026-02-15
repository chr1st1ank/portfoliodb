mod test_helpers;

use chrono::NaiveDate;
use portfoliodb_rust::models::{Investment, Movement};
use portfoliodb_rust::repository::traits::{InvestmentRepository, MovementRepository};
use portfoliodb_rust::repository::{SqliteInvestmentRepository, SqliteMovementRepository};
use test_helpers::setup_test_db;

#[tokio::test]
async fn test_find_all_empty() {
    let pool = setup_test_db().await;
    let repo = SqliteMovementRepository::new(pool);

    let movements = repo.find_all().await.unwrap();
    assert_eq!(movements.len(), 0);
}

#[tokio::test]
async fn test_create_movement() {
    let pool = setup_test_db().await;
    let movement_repo = SqliteMovementRepository::new(pool.clone());
    let investment_repo = SqliteInvestmentRepository::new(pool);

    // Create investment first
    let investment = Investment {
        id: 0,
        name: Some("Test Investment".to_string()),
        isin: None,
        shortname: None,
        ticker_symbol: None,
        quote_provider: None,
    };
    let inv_id = investment_repo.create(&investment).await.unwrap();

    // Create movement
    let movement = Movement {
        id: 0,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 15).unwrap()),
        action_id: Some(1), // Buy
        investment_id: Some(inv_id),
        quantity: Some(10.0),
        amount: Some(100.0),
        fee: Some(1.5),
    };

    let id = movement_repo.create(&movement).await.unwrap();
    assert!(id > 0);
}

#[tokio::test]
async fn test_create_and_find_by_id() {
    let pool = setup_test_db().await;
    let movement_repo = SqliteMovementRepository::new(pool.clone());
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

    let movement = Movement {
        id: 0,
        date: Some(NaiveDate::from_ymd_opt(2024, 2, 1).unwrap()),
        action_id: Some(2), // Sell
        investment_id: Some(inv_id),
        quantity: Some(5.0),
        amount: Some(60.0),
        fee: Some(0.5),
    };

    let id = movement_repo.create(&movement).await.unwrap();
    let found = movement_repo.find_by_id(id).await.unwrap();

    assert!(found.is_some());
    let found = found.unwrap();
    assert_eq!(found.id, id);
    assert_eq!(
        found.date,
        Some(NaiveDate::from_ymd_opt(2024, 2, 1).unwrap())
    );
    assert_eq!(found.action_id, Some(2));
    assert_eq!(found.investment_id, Some(inv_id));
    assert_eq!(found.quantity, Some(5.0));
    assert_eq!(found.amount, Some(60.0));
    assert_eq!(found.fee, Some(0.5));
}

#[tokio::test]
async fn test_find_by_id_nonexistent() {
    let pool = setup_test_db().await;
    let repo = SqliteMovementRepository::new(pool);

    let found = repo.find_by_id(999).await.unwrap();
    assert!(found.is_none());
}

#[tokio::test]
async fn test_update_movement() {
    let pool = setup_test_db().await;
    let movement_repo = SqliteMovementRepository::new(pool.clone());
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

    // Create movement
    let movement = Movement {
        id: 0,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        action_id: Some(1),
        investment_id: Some(inv_id),
        quantity: Some(10.0),
        amount: Some(100.0),
        fee: Some(1.0),
    };
    let id = movement_repo.create(&movement).await.unwrap();

    // Update movement
    let updated = Movement {
        id,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 2).unwrap()),
        action_id: Some(2),
        investment_id: Some(inv_id),
        quantity: Some(15.0),
        amount: Some(150.0),
        fee: Some(2.0),
    };
    movement_repo.update(id, &updated).await.unwrap();

    // Verify update
    let found = movement_repo.find_by_id(id).await.unwrap().unwrap();
    assert_eq!(
        found.date,
        Some(NaiveDate::from_ymd_opt(2024, 1, 2).unwrap())
    );
    assert_eq!(found.action_id, Some(2));
    assert_eq!(found.quantity, Some(15.0));
    assert_eq!(found.amount, Some(150.0));
    assert_eq!(found.fee, Some(2.0));
}

#[tokio::test]
async fn test_delete_movement() {
    let pool = setup_test_db().await;
    let movement_repo = SqliteMovementRepository::new(pool.clone());
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

    let movement = Movement {
        id: 0,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        action_id: Some(1),
        investment_id: Some(inv_id),
        quantity: Some(10.0),
        amount: Some(100.0),
        fee: Some(1.0),
    };
    let id = movement_repo.create(&movement).await.unwrap();

    // Verify it exists
    assert!(movement_repo.find_by_id(id).await.unwrap().is_some());

    // Delete it
    movement_repo.delete(id).await.unwrap();

    // Verify it's gone
    assert!(movement_repo.find_by_id(id).await.unwrap().is_none());
}

#[tokio::test]
async fn test_decimal_to_real_conversion() {
    let pool = setup_test_db().await;
    let movement_repo = SqliteMovementRepository::new(pool.clone());
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

    // Test with decimal values
    let movement = Movement {
        id: 0,
        date: Some(NaiveDate::from_ymd_opt(2024, 1, 1).unwrap()),
        action_id: Some(1),
        investment_id: Some(inv_id),
        quantity: Some(10.5),
        amount: Some(105.75),
        fee: Some(1.25),
    };
    let id = movement_repo.create(&movement).await.unwrap();

    let found = movement_repo.find_by_id(id).await.unwrap().unwrap();
    assert_eq!(found.quantity, Some(10.5));
    assert_eq!(found.amount, Some(105.75));
    assert_eq!(found.fee, Some(1.25));
}

#[tokio::test]
async fn test_create_with_optional_fields() {
    let pool = setup_test_db().await;
    let repo = SqliteMovementRepository::new(pool);

    let movement = Movement {
        id: 0,
        date: None,
        action_id: None,
        investment_id: None,
        quantity: None,
        amount: None,
        fee: None,
    };

    let id = repo.create(&movement).await.unwrap();
    let found = repo.find_by_id(id).await.unwrap().unwrap();

    assert!(found.date.is_none());
    assert!(found.action_id.is_none());
    assert!(found.investment_id.is_none());
    assert!(found.quantity.is_none());
    assert!(found.amount.is_none());
    assert!(found.fee.is_none());
}
