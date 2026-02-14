use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::FromRow)]
pub struct Settings {
    #[sqlx(rename = "ID")]
    pub id: i64,
    #[sqlx(rename = "BaseCurrency")]
    pub base_currency: String,
}
