mod test_helpers;

use portfoliodb_rust::models::Settings;
use portfoliodb_rust::repository::traits::SettingsRepository;
use portfoliodb_rust::repository::SqliteSettingsRepository;
use test_helpers::setup_test_db;

#[tokio::test]
async fn test_get_seeded_settings() {
    let pool = setup_test_db().await;
    let repo = SqliteSettingsRepository::new(pool);

    let settings = repo.get().await.unwrap();

    assert!(settings.is_some());
    let settings = settings.unwrap();
    assert_eq!(settings.id, 1);
    assert_eq!(settings.base_currency, "EUR");
}

#[tokio::test]
async fn test_update_settings() {
    let pool = setup_test_db().await;
    let repo = SqliteSettingsRepository::new(pool);

    // Update to USD
    let updated_settings = Settings {
        id: 1,
        base_currency: "USD".to_string(),
    };
    repo.update(&updated_settings).await.unwrap();

    // Verify update
    let settings = repo.get().await.unwrap().unwrap();
    assert_eq!(settings.base_currency, "USD");
}

#[tokio::test]
async fn test_update_settings_multiple_times() {
    let pool = setup_test_db().await;
    let repo = SqliteSettingsRepository::new(pool);

    // Update to USD
    repo.update(&Settings {
        id: 1,
        base_currency: "USD".to_string(),
    })
    .await
    .unwrap();

    // Update to GBP
    repo.update(&Settings {
        id: 1,
        base_currency: "GBP".to_string(),
    })
    .await
    .unwrap();

    // Update to JPY
    repo.update(&Settings {
        id: 1,
        base_currency: "JPY".to_string(),
    })
    .await
    .unwrap();

    // Verify final state
    let settings = repo.get().await.unwrap().unwrap();
    assert_eq!(settings.base_currency, "JPY");
}
