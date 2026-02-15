use crate::handlers;
use crate::repository::traits::{
    ActionTypeRepository, InvestmentPriceRepository, InvestmentRepository, MovementRepository,
    SettingsRepository,
};
use crate::services::{PortfolioCalculator, QuoteFetcherService};
use axum::{
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower_http::cors::CorsLayer;

pub fn create_router(
    investment_repo: Arc<dyn InvestmentRepository>,
    movement_repo: Arc<dyn MovementRepository>,
    investment_price_repo: Arc<dyn InvestmentPriceRepository>,
    action_type_repo: Arc<dyn ActionTypeRepository>,
    settings_repo: Arc<dyn SettingsRepository>,
) -> Router {
    // Create portfolio calculator service
    let portfolio_calculator = Arc::new(PortfolioCalculator::new(
        movement_repo.clone(),
        investment_price_repo.clone(),
    ));

    // Create quote fetcher service
    let quote_fetcher = Arc::new(QuoteFetcherService::new(
        investment_repo.clone(),
        investment_price_repo.clone(),
        settings_repo.clone(),
    ));
    Router::new()
        // Investments
        .route(
            "/api/investments",
            get(handlers::list_investments).post(handlers::create_investment),
        )
        .route(
            "/api/investments/:id",
            get(handlers::get_investment)
                .put(handlers::update_investment)
                .delete(handlers::delete_investment),
        )
        .with_state(investment_repo)
        // Movements
        .route(
            "/api/movements",
            get(handlers::list_movements).post(handlers::create_movement),
        )
        .route(
            "/api/movements/:id",
            get(handlers::get_movement)
                .put(handlers::update_movement)
                .delete(handlers::delete_movement),
        )
        .with_state(movement_repo)
        // Investment Prices
        .route(
            "/api/investment-prices",
            get(handlers::list_investment_prices).post(handlers::create_investment_price),
        )
        .route(
            "/api/investment-prices/upsert",
            post(handlers::upsert_investment_price),
        )
        .with_state(investment_price_repo)
        // Action Types
        .route("/api/action-types", get(handlers::list_action_types))
        .route("/api/action-types/:id", get(handlers::get_action_type))
        .with_state(action_type_repo)
        // Settings
        .route(
            "/api/settings",
            get(handlers::get_settings).put(handlers::update_settings),
        )
        .with_state(settings_repo)
        // Developments (Portfolio Calculations)
        .route("/api/developments", get(handlers::list_developments))
        .with_state(portfolio_calculator)
        // Quotes
        .route("/api/quotes/providers", get(handlers::list_providers))
        .route("/api/quotes/fetch", post(handlers::fetch_quotes))
        .with_state(quote_fetcher)
        .layer(CorsLayer::permissive())
}
