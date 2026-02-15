use crate::error::Result;
use crate::models::Movement;
use crate::repository::traits;
use async_trait::async_trait;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct SqliteMovementRepository {
    pool: SqlitePool,
}

impl SqliteMovementRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl traits::MovementRepository for SqliteMovementRepository {
    async fn find_all(&self) -> Result<Vec<Movement>> {
        let movements = sqlx::query_as::<_, Movement>(
            "SELECT ID, Date, ActionID, InvestmentID, CAST(Quantity AS REAL) as Quantity, CAST(Amount AS REAL) as Amount, CAST(Fee AS REAL) as Fee FROM Movement",
        )
        .fetch_all(&self.pool)
        .await?;
        Ok(movements)
    }

    async fn find_by_id(&self, id: i64) -> Result<Option<Movement>> {
        let movement = sqlx::query_as::<_, Movement>(
            "SELECT ID, Date, ActionID, InvestmentID, CAST(Quantity AS REAL) as Quantity, CAST(Amount AS REAL) as Amount, CAST(Fee AS REAL) as Fee FROM Movement WHERE ID = ?"
        )
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(movement)
    }

    async fn create(&self, movement: &Movement) -> Result<i64> {
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

    async fn update(&self, id: i64, movement: &Movement) -> Result<()> {
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

    async fn delete(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM Movement WHERE ID = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
