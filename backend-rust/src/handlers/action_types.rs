use crate::error::{AppError, Result};
use crate::models::ActionType;
use crate::repository::ActionTypeRepository;
use axum::{
    extract::{Path, State},
    Json,
};
use serde::Serialize;
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct ActionTypeResponse {
    pub id: i64,
    pub name: String,
}

impl From<ActionType> for ActionTypeResponse {
    fn from(at: ActionType) -> Self {
        Self {
            id: at.id,
            name: at.name,
        }
    }
}

pub async fn list_action_types(
    State(repo): State<Arc<ActionTypeRepository>>,
) -> Result<Json<Vec<ActionTypeResponse>>> {
    let action_types = repo.find_all().await?;
    let response: Vec<ActionTypeResponse> = action_types.into_iter().map(Into::into).collect();
    Ok(Json(response))
}

pub async fn get_action_type(
    State(repo): State<Arc<ActionTypeRepository>>,
    Path(id): Path<i64>,
) -> Result<Json<ActionTypeResponse>> {
    let action_type = repo.find_by_id(id).await?.ok_or(AppError::NotFound)?;
    Ok(Json(action_type.into()))
}
