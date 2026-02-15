use crate::error::Result;
use sqlx::SqlitePool;

/// Run all database migrations
pub async fn run_migrations(pool: &SqlitePool) -> Result<()> {
    tracing::info!("Running database migrations...");

    enable_foreign_keys(pool).await?;
    create_schema(pool).await?;
    seed_initial_data(pool).await?;

    tracing::info!("Database migrations completed");
    Ok(())
}

/// Enable foreign key constraints
async fn enable_foreign_keys(pool: &SqlitePool) -> Result<()> {
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(pool)
        .await?;
    Ok(())
}

/// Create database schema
async fn create_schema(pool: &SqlitePool) -> Result<()> {
    tracing::info!("Creating database schema...");

    // ActionType table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS ActionType (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name VARCHAR(10) NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Investment table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS Investment (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Name TEXT,
            ISIN VARCHAR(20),
            ShortName VARCHAR(30),
            QuoteProvider VARCHAR(20),
            TickerSymbol VARCHAR(20)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Movement table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS Movement (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            Date DATE,
            Quantity DECIMAL,
            Amount DECIMAL,
            Fee DECIMAL,
            ActionID INTEGER REFERENCES ActionType(ID),
            InvestmentID INTEGER REFERENCES Investment(ID)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create indexes for Movement
    sqlx::query("CREATE INDEX IF NOT EXISTS Movement_ActionID_idx ON Movement(ActionID)")
        .execute(pool)
        .await?;

    sqlx::query("CREATE INDEX IF NOT EXISTS Movement_InvestmentID_idx ON Movement(InvestmentID)")
        .execute(pool)
        .await?;

    // InvestmentPrice table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS InvestmentPrice (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            Date DATE,
            InvestmentID INTEGER,
            Price DECIMAL,
            Source VARCHAR(20),
            UNIQUE(Date, InvestmentID)
        )
        "#,
    )
    .execute(pool)
    .await?;

    // Create index for InvestmentPrice
    sqlx::query("CREATE INDEX IF NOT EXISTS InvestmentPrice_InvestmentID_idx ON InvestmentPrice(InvestmentID)")
        .execute(pool)
        .await?;

    // Settings table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS Settings (
            ID INTEGER PRIMARY KEY AUTOINCREMENT,
            BaseCurrency VARCHAR(3) NOT NULL
        )
        "#,
    )
    .execute(pool)
    .await?;

    tracing::info!("Database schema created");
    Ok(())
}

/// Seed initial data
async fn seed_initial_data(pool: &SqlitePool) -> Result<()> {
    tracing::info!("Seeding initial data...");

    // Check if ActionTypes already exist
    let action_type_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM ActionType")
        .fetch_one(pool)
        .await?;

    if action_type_count.0 == 0 {
        tracing::info!("Inserting ActionTypes...");
        sqlx::query(
            "INSERT INTO ActionType (ID, Name) VALUES (1, 'Buy'), (2, 'Sell'), (3, 'Payout')",
        )
        .execute(pool)
        .await?;
    }

    // Check if Settings already exists
    let settings_count: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM Settings")
        .fetch_one(pool)
        .await?;

    if settings_count.0 == 0 {
        tracing::info!("Inserting default Settings...");
        sqlx::query("INSERT INTO Settings (ID, BaseCurrency) VALUES (1, 'EUR')")
            .execute(pool)
            .await?;
    }

    tracing::info!("Initial data seeded");
    Ok(())
}
