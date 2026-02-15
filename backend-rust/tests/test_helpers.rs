use portfoliodb_rust::db;
use sqlx::SqlitePool;

/// Setup an in-memory SQLite database for testing
///
/// This creates a fresh database with schema and seed data
/// for each test, ensuring test isolation.
pub async fn setup_test_db() -> SqlitePool {
    let pool = SqlitePool::connect("sqlite::memory:")
        .await
        .expect("Failed to create test database");

    db::run_migrations(&pool)
        .await
        .expect("Failed to run migrations");

    pool
}
