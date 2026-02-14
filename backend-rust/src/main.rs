mod config;
mod error;
mod handlers;
mod models;
mod repository;
mod routes;

use config::Config;
use sqlx::sqlite::SqlitePool;
use std::net::SocketAddr;

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
    tracing::info!("Database connection established");

    // Create router
    let app = routes::create_router(pool);

    // Start server
    let addr: SocketAddr = format!("{}:{}", config.host, config.port).parse()?;
    tracing::info!("Server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
