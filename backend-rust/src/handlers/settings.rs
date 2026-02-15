use crate::error::{AppError, Result};
use crate::models::Settings;
use crate::repository::traits::SettingsRepository;
use axum::{extract::State, Json};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Serialize)]
pub struct SettingsResponse {
    pub id: i64,
    pub base_currency: String,
}

impl From<Settings> for SettingsResponse {
    fn from(s: Settings) -> Self {
        Self {
            id: s.id,
            base_currency: s.base_currency,
        }
    }
}

#[derive(Debug, Deserialize)]
pub struct UpdateSettingsRequest {
    pub base_currency: String,
}

pub async fn get_settings(
    State(repo): State<Arc<dyn SettingsRepository>>,
) -> Result<Json<SettingsResponse>> {
    let settings = repo.get().await?.ok_or(AppError::NotFound)?;
    Ok(Json(settings.into()))
}

pub async fn update_settings(
    State(repo): State<Arc<dyn SettingsRepository>>,
    Json(req): Json<UpdateSettingsRequest>,
) -> Result<Json<SettingsResponse>> {
    let settings = Settings {
        id: 1,
        base_currency: req.base_currency,
    };
    repo.update(&settings).await?;
    let updated = repo.get().await?.ok_or(AppError::NotFound)?;
    Ok(Json(updated.into()))
}
