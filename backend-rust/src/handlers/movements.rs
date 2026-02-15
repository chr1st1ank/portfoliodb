use crate::error::{AppError, Result};
use crate::models::Movement;
use crate::repository::traits::MovementRepository;
use axum::{
    extract::{Path, State},
    Json,
};
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct MovementResponse {
    pub id: i64,
    pub date: Option<NaiveDate>,
    pub action_id: Option<i64>,
    pub investment_id: Option<i64>,
    pub quantity: Option<f64>,
    pub amount: Option<f64>,
    pub fee: Option<f64>,
}

impl From<Movement> for MovementResponse {
    fn from(m: Movement) -> Self {
        Self {
            id: m.id,
            date: m.date,
            action_id: m.action_id,
            investment_id: m.investment_id,
            quantity: m.quantity,
            amount: m.amount,
            fee: m.fee,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct CreateMovementRequest {
    pub date: Option<NaiveDate>,
    pub action_id: Option<i64>,
    pub investment_id: Option<i64>,
    pub quantity: Option<f64>,
    pub amount: Option<f64>,
    pub fee: Option<f64>,
}

pub async fn list_movements(
    State(repo): State<Arc<dyn MovementRepository>>,
) -> Result<Json<Vec<MovementResponse>>> {
    let movements = repo.find_all().await?;
    let response: Vec<MovementResponse> = movements.into_iter().map(Into::into).collect();
    Ok(Json(response))
}

pub async fn get_movement(
    State(repo): State<Arc<dyn MovementRepository>>,
    Path(id): Path<i64>,
) -> Result<Json<MovementResponse>> {
    let movement = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(movement.into()))
}

pub async fn create_movement(
    State(repo): State<Arc<dyn MovementRepository>>,
    Json(req): Json<CreateMovementRequest>,
) -> Result<Json<MovementResponse>> {
    let movement = Movement {
        id: 0,
        date: req.date,
        action_id: req.action_id,
        investment_id: req.investment_id,
        quantity: req.quantity,
        amount: req.amount,
        fee: req.fee,
    };

    let id = repo.create(&movement).await?;
    let created = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(created.into()))
}

pub async fn update_movement(
    State(repo): State<Arc<dyn MovementRepository>>,
    Path(id): Path<i64>,
    Json(req): Json<CreateMovementRequest>,
) -> Result<Json<MovementResponse>> {
    let movement = Movement {
        id,
        date: req.date,
        action_id: req.action_id,
        investment_id: req.investment_id,
        quantity: req.quantity,
        amount: req.amount,
        fee: req.fee,
    };

    repo.update(id, &movement).await?;
    let updated = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(updated.into()))
}

pub async fn delete_movement(
    State(repo): State<Arc<dyn MovementRepository>>,
    Path(id): Path<i64>,
) -> Result<Json<()>> {
    repo.delete(id).await?;
    Ok(Json(()))
}
