use crate::handlers;
use crate::repository::{
    ActionTypeRepository, InvestmentPriceRepository, InvestmentRepository, MovementRepository,
    SettingsRepository,
};
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::SqlitePool;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

pub fn create_router(pool: SqlitePool) -> Router {
    let investment_repo = Arc::new(InvestmentRepository::new(pool.clone()));
    let movement_repo = Arc::new(MovementRepository::new(pool.clone()));
    let investment_price_repo = Arc::new(InvestmentPriceRepository::new(pool.clone()));
    let action_type_repo = Arc::new(ActionTypeRepository::new(pool.clone()));
    let settings_repo = Arc::new(SettingsRepository::new(pool.clone()));

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
        .layer(CorsLayer::permissive())
}
