use crate::handlers;
use crate::repository::InvestmentRepository;
use axum::{
    routing::{delete, get, post, put},
    Router,
};
use sqlx::SqlitePool;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

pub fn create_router(pool: SqlitePool) -> Router {
    let investment_repo = Arc::new(InvestmentRepository::new(pool.clone()));

    Router::new()
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
        .layer(CorsLayer::permissive())
}
