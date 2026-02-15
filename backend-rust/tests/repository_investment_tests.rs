mod test_helpers;

use portfoliodb_rust::models::Investment;
use portfoliodb_rust::repository::traits::InvestmentRepository;
use portfoliodb_rust::repository::SqliteInvestmentRepository;
use test_helpers::setup_test_db;

#[tokio::test]
async fn test_find_all_empty() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    let investments = repo.find_all().await.unwrap();
    assert_eq!(investments.len(), 0);
}

#[tokio::test]
async fn test_create_investment() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    let investment = Investment {
        id: 0,
        name: Some("Test Investment".to_string()),
        isin: Some("US1234567890".to_string()),
        shortname: Some("TEST".to_string()),
        ticker_symbol: Some("TST".to_string()),
        quote_provider: Some("yahoo".to_string()),
    };

    let id = repo.create(&investment).await.unwrap();
    assert!(id > 0);
}

#[tokio::test]
async fn test_create_and_find_by_id() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    let investment = Investment {
        id: 0,
        name: Some("Apple Inc.".to_string()),
        isin: Some("US0378331005".to_string()),
        shortname: Some("AAPL".to_string()),
        ticker_symbol: Some("AAPL".to_string()),
        quote_provider: Some("yahoo".to_string()),
    };

    let id = repo.create(&investment).await.unwrap();
    let found = repo.find_by_id(id).await.unwrap();

    assert!(found.is_some());
    let found = found.unwrap();
    assert_eq!(found.id, id);
    assert_eq!(found.name, Some("Apple Inc.".to_string()));
    assert_eq!(found.isin, Some("US0378331005".to_string()));
    assert_eq!(found.shortname, Some("AAPL".to_string()));
}

#[tokio::test]
async fn test_find_by_id_nonexistent() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    let found = repo.find_by_id(999).await.unwrap();
    assert!(found.is_none());
}

#[tokio::test]
async fn test_find_all_multiple() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    // Create multiple investments
    for i in 1..=3 {
        let investment = Investment {
            id: 0,
            name: Some(format!("Investment {}", i)),
            isin: Some(format!("US{:010}", i)),
            shortname: Some(format!("INV{}", i)),
            ticker_symbol: Some(format!("INV{}", i)),
            quote_provider: Some("yahoo".to_string()),
        };
        repo.create(&investment).await.unwrap();
    }

    let investments = repo.find_all().await.unwrap();
    assert_eq!(investments.len(), 3);
}

#[tokio::test]
async fn test_update_investment() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    // Create investment
    let investment = Investment {
        id: 0,
        name: Some("Original Name".to_string()),
        isin: Some("US1234567890".to_string()),
        shortname: Some("ORIG".to_string()),
        ticker_symbol: Some("ORIG".to_string()),
        quote_provider: Some("yahoo".to_string()),
    };
    let id = repo.create(&investment).await.unwrap();

    // Update investment
    let updated = Investment {
        id,
        name: Some("Updated Name".to_string()),
        isin: Some("US0987654321".to_string()),
        shortname: Some("UPD".to_string()),
        ticker_symbol: Some("UPD".to_string()),
        quote_provider: Some("justETF".to_string()),
    };
    repo.update(id, &updated).await.unwrap();

    // Verify update
    let found = repo.find_by_id(id).await.unwrap().unwrap();
    assert_eq!(found.name, Some("Updated Name".to_string()));
    assert_eq!(found.isin, Some("US0987654321".to_string()));
    assert_eq!(found.shortname, Some("UPD".to_string()));
    assert_eq!(found.quote_provider, Some("justETF".to_string()));
}

#[tokio::test]
async fn test_delete_investment() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    // Create investment
    let investment = Investment {
        id: 0,
        name: Some("To Delete".to_string()),
        isin: Some("US1234567890".to_string()),
        shortname: Some("DEL".to_string()),
        ticker_symbol: Some("DEL".to_string()),
        quote_provider: Some("yahoo".to_string()),
    };
    let id = repo.create(&investment).await.unwrap();

    // Verify it exists
    assert!(repo.find_by_id(id).await.unwrap().is_some());

    // Delete it
    repo.delete(id).await.unwrap();

    // Verify it's gone
    assert!(repo.find_by_id(id).await.unwrap().is_none());
}

#[tokio::test]
async fn test_create_with_optional_fields() {
    let pool = setup_test_db().await;
    let repo = SqliteInvestmentRepository::new(pool);

    let investment = Investment {
        id: 0,
        name: Some("Minimal Investment".to_string()),
        isin: None,
        shortname: None,
        ticker_symbol: None,
        quote_provider: None,
    };

    let id = repo.create(&investment).await.unwrap();
    let found = repo.find_by_id(id).await.unwrap().unwrap();

    assert_eq!(found.name, Some("Minimal Investment".to_string()));
    assert!(found.isin.is_none());
    assert!(found.shortname.is_none());
    assert!(found.ticker_symbol.is_none());
    assert!(found.quote_provider.is_none());
}
