use crate::error::Result;
use crate::models::Investment;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct InvestmentRepository {
    pool: SqlitePool,
}

impl InvestmentRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }

    pub async fn find_all(&self) -> Result<Vec<Investment>> {
        let investments = sqlx::query_as::<_, Investment>("SELECT * FROM Investment")
            .fetch_all(&self.pool)
            .await?;
        Ok(investments)
    }

    pub async fn find_by_id(&self, id: i64) -> Result<Option<Investment>> {
        let investment = sqlx::query_as::<_, Investment>("SELECT * FROM Investment WHERE ID = ?")
            .bind(id)
            .fetch_optional(&self.pool)
            .await?;
        Ok(investment)
    }

    pub async fn create(&self, investment: &Investment) -> Result<i64> {
        let result = sqlx::query(
            "INSERT INTO Investment (Name, ISIN, ShortName, TickerSymbol, QuoteProvider) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(&investment.name)
        .bind(&investment.isin)
        .bind(&investment.shortname)
        .bind(&investment.ticker_symbol)
        .bind(&investment.quote_provider)
        .execute(&self.pool)
        .await?;

        Ok(result.last_insert_rowid())
    }

    pub async fn update(&self, id: i64, investment: &Investment) -> Result<()> {
        sqlx::query(
            "UPDATE Investment SET Name = ?, ISIN = ?, ShortName = ?, TickerSymbol = ?, QuoteProvider = ? WHERE ID = ?"
        )
        .bind(&investment.name)
        .bind(&investment.isin)
        .bind(&investment.shortname)
        .bind(&investment.ticker_symbol)
        .bind(&investment.quote_provider)
        .bind(id)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    pub async fn delete(&self, id: i64) -> Result<()> {
        sqlx::query("DELETE FROM Investment WHERE ID = ?")
            .bind(id)
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}
