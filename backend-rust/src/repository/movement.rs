use crate::error::Result;
use crate::models::Movement;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct MovementRepository {
    pool: SqlitePool,
}

impl MovementRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self) -> Result<Vec<Movement>> {
        let movements = sqlx::query_as::<_, Movement>("SELECT * FROM Movement")
            .fetch_all(&self.pool)
            .await?;
        Ok(movements)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<Movement>> {
        let movement = sqlx::query_as::<_, Movement>("SELECT * FROM Movement WHERE ID = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(movement)
    }

    pub async fn create(&self, movement: &Movement) -> Result<i64> {
        let result = sqlx::query(
            "INSERT INTO Movement (Date, ActionID, InvestmentID, Quantity, Amount, Fee) VALUES (?, ?, ?, ?, ?, ?)"
        )
        .bind(movement.date)
        .bind(movement.action_id)
        .bind(movement.investment_id)
        .bind(movement.quantity)
        .bind(movement.amount)
        .bind(movement.fee)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn update(&self, id: i64, movement: &Movement) -> Result<()> {
        sqlx::query(
            "UPDATE Movement SET Date = ?, ActionID = ?, InvestmentID = ?, Quantity = ?, Amount = ?, Fee = ? WHERE ID = ?"
        )
        .bind(movement.date)
        .bind(movement.action_id)
        .bind(movement.investment_id)
        .bind(movement.quantity)
        .bind(movement.amount)
        .bind(movement.fee)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM Movement WHERE ID = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
