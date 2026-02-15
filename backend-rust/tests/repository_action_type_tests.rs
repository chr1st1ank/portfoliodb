mod test_helpers;

use portfoliodb_rust::repository::traits::ActionTypeRepository;
use portfoliodb_rust::repository::SqliteActionTypeRepository;
use test_helpers::setup_test_db;

#[tokio::test]
async fn test_find_all_seeded_data() {
    let pool = setup_test_db().await;
    let repo = SqliteActionTypeRepository::new(pool);

    let action_types = repo.find_all().await.unwrap();

    // Should have 3 seeded action types
    assert_eq!(action_types.len(), 3);

    // Verify IDs and names
    assert_eq!(action_types[0].id, 1);
    assert_eq!(action_types[0].name, "Buy");
    assert_eq!(action_types[1].id, 2);
    assert_eq!(action_types[1].name, "Sell");
    assert_eq!(action_types[2].id, 3);
    assert_eq!(action_types[2].name, "Payout");
}

#[tokio::test]
async fn test_find_by_id() {
    let pool = setup_test_db().await;
    let repo = SqliteActionTypeRepository::new(pool);

    let action_type = repo.find_by_id(1).await.unwrap();

    assert!(action_type.is_some());
    let action_type = action_type.unwrap();
    assert_eq!(action_type.id, 1);
    assert_eq!(action_type.name, "Buy");
}

#[tokio::test]
async fn test_find_by_id_nonexistent() {
    let pool = setup_test_db().await;
    let repo = SqliteActionTypeRepository::new(pool);

    let action_type = repo.find_by_id(999).await.unwrap();
    assert!(action_type.is_none());
}
