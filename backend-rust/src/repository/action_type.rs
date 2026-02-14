use crate::error::Result;
use crate::models::ActionType;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct ActionTypeRepository {
    pool: SqlitePool,
}

impl ActionTypeRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self) -> Result<Vec<ActionType>> {
        let action_types = sqlx::query_as::<_, ActionType>("SELECT * FROM ActionType")
            .fetch_all(&self.pool)
            .await?;
        Ok(action_types)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<ActionType>> {
        let action_type = sqlx::query_as::<_, ActionType>("SELECT * FROM ActionType WHERE ID = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(action_type)
    }
}
