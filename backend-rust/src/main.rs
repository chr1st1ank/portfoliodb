mod config;
mod db;
mod error;
mod handlers;
mod models;
mod repository;
mod routes;
mod services;

use config::Config;
use repository::{
    SqliteActionTypeRepository, SqliteInvestmentPriceRepository, SqliteInvestmentRepository,
    SqliteMovementRepository, SqliteSettingsRepository,
};
use sqlx::sqlite::SqlitePool;
use std::{net::SocketAddr, sync::Arc};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "info,portfoliodb_rust=debug".into()),
        )
        .init();

    // Load configuration
    let config = Config::from_env()?;
    tracing::info!("Starting PortfolioDB Rust backend");
    tracing::debug!("Configuration loaded: {:?}", config);

    // Setup database connection
    tracing::info!("Connecting to database: {}", config.database_url);
    let pool = SqlitePool::connect(&config.database_url).await?;

    // Run database migrations
    db::run_migrations(&pool).await?;

    tracing::info!("Database connection established");

    // Create repository implementations
    let investment_repo = Arc::new(SqliteInvestmentRepository::new(pool.clone()));
    let movement_repo = Arc::new(SqliteMovementRepository::new(pool.clone()));
    let investment_price_repo = Arc::new(SqliteInvestmentPriceRepository::new(pool.clone()));
    let action_type_repo = Arc::new(SqliteActionTypeRepository::new(pool.clone()));
    let settings_repo = Arc::new(SqliteSettingsRepository::new(pool.clone()));

    // Create router with injected dependencies
    let app = routes::create_router(
        investment_repo,
        movement_repo,
        investment_price_repo,
        action_type_repo,
        settings_repo,
    );

    // Start server
    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    tracing::info!("Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
