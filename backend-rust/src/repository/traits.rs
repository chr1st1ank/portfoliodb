use crate::error::Result;
use crate::models::{ActionType, Investment, InvestmentPrice, Movement, Settings};
use async_trait::async_trait;
use chrono::NaiveDate;

#[async_trait]
pub trait InvestmentRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<Investment>>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Investment>>;
    async fn create(&self, investment: &Investment) -> Result<i64>;
    async fn update(&self, id: i64, investment: &Investment) -> Result<()>;
    async fn delete(&self, id: i64) -> Result<()>;
}

#[async_trait]
pub trait MovementRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<Movement>>;
    async fn find_by_id(&self, id: i64) -> Result<Option<Movement>>;
    async fn create(&self, movement: &Movement) -> Result<i64>;
    async fn update(&self, id: i64, movement: &Movement) -> Result<()>;
    async fn delete(&self, id: i64) -> Result<()>;
}

#[async_trait]
pub trait InvestmentPriceRepository: Send + Sync {
    async fn find_all(
        &self,
        investment_id: Option<i64>,
        start_date: Option<NaiveDate>,
        end_date: Option<NaiveDate>,
    ) -> Result<Vec<InvestmentPrice>>;
    async fn create(&self, price: &InvestmentPrice) -> Result<()>;
    async fn upsert(&self, price: &InvestmentPrice) -> Result<()>;
}

#[async_trait]
pub trait ActionTypeRepository: Send + Sync {
    async fn find_all(&self) -> Result<Vec<ActionType>>;
    async fn find_by_id(&self, id: i64) -> Result<Option<ActionType>>;
}

#[async_trait]
pub trait SettingsRepository: Send + Sync {
    async fn get(&self) -> Result<Option<Settings>>;
    async fn update(&self, settings: &Settings) -> Result<()>;
}
