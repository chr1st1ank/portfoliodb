use crate::error::Result;
use crate::models::InvestmentPrice;
use crate::repository::traits;
use async_trait::async_trait;
use chrono::NaiveDate;
use sqlx::SqlitePool;

#[derive(Clone)]
pub struct SqliteInvestmentPriceRepository {
    pool: SqlitePool,
}

impl SqliteInvestmentPriceRepository {
    pub fn new(pool: SqlitePool) -> Self {
        Self { pool }
    }
}

#[async_trait]
impl traits::InvestmentPriceRepository for SqliteInvestmentPriceRepository {
    async fn find_all(
        &self,
        investment_id: Option<i64>,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
    ) -> Result<Vec<InvestmentPrice>> {
        let mut query = String::from("SELECT Date, InvestmentID, CAST(Price AS REAL) as Price, Source FROM InvestmentPrice WHERE 1=1");

        if investment_id.is_some() {
            query.push_str(" AND InvestmentID = ?");
        }
        if start_date.is_some() {
            query.push_str(" AND Date >= ?");
        }
        if end_date.is_some() {
            query.push_str(" AND Date <= ?");
        }
        query.push_str(" ORDER BY Date DESC");

        let mut q = sqlx::query_as::<_, InvestmentPrice>(&query);

        if let Some(inv_id) = investment_id {
            q = q.bind(inv_id);
        }
        if let Some(start) = start_date {
            q = q.bind(start);
        }
        if let Some(end) = end_date {
            q = q.bind(end);
        }

        let prices = q.fetch_all(&self.pool).await?;
        Ok(prices)
    }

    async fn create(&self, price: &InvestmentPrice) -> Result<()> {
        sqlx::query(
            "INSERT INTO InvestmentPrice (Date, InvestmentID, Price, Source) VALUES (?, ?, ?, ?)",
        )
        .bind(price.date)
        .bind(price.investment_id)
        .bind(price.price)
        .bind(&price.source)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn upsert(&self, price: &InvestmentPrice) -> Result<()> {
        sqlx::query(
            "INSERT INTO InvestmentPrice (Date, InvestmentID, Price, Source) 
             VALUES (?, ?, ?, ?)
             ON CONFLICT(Date, InvestmentID, Source) DO UPDATE SET Price = ?",
        )
        .bind(price.date)
        .bind(price.investment_id)
        .bind(price.price)
        .bind(&price.source)
        .bind(price.price)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
}
