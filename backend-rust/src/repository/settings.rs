use crate::error::Result;
use crate::models::Settings;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct SettingsRepository {
    pool: SqlitePool,
}

impl SettingsRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn get(&self) -> Result<Option<Settings>> {
        let settings = sqlx::query_as::<_, Settings>("SELECT * FROM Settings LIMIT 1")
            .fetch_optional(&self.pool)
            .await?;
        Ok(settings)
    }

    pub async fn update(&self, base_currency: &str) -> Result<()> {
        sqlx::query("UPDATE Settings SET BaseCurrency = ? WHERE ID = 1")
            .bind(base_currency)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
