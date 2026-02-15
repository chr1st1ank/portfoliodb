use crate::error::Result;
use crate::models::Settings;
use crate::repository::traits;
use async_trait::async_trait;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct SqliteSettingsRepository {
    pool: SqlitePool,
}

impl SqliteSettingsRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl traits::SettingsRepository for SqliteSettingsRepository {
    async fn get(&self) -> Result<Option<Settings>> {
        let settings = sqlx::query_as::<_, Settings>("SELECT * FROM Settings LIMIT 1")
            .fetch_optional(&self.pool)
            .await?;
        Ok(settings)
    }

    async fn update(&self, settings: &Settings) -> Result<()> {
        sqlx::query("UPDATE Settings SET BaseCurrency = ? WHERE ID = 1")
            .bind(&settings.base_currency)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
