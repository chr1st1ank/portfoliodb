use std::env;

#[derive(Debug, Clone)]
pub struct Config {
    pub database_url: String,
    pub host: String,
    pub port: u16,
}

impl Config {
    pub fn from_env() -> anyhow::Result<Self> {
        dotenvy::dotenv().ok();

        let database_url =
            env::var("DATABASE_URL").unwrap_or_else(|_| "sqlite:file::memory:?cache=shared".to_string());

        let host = env::var("HOST").unwrap_or_else(|_| "127.0.0.1".to_string());

        let port = env::var("PORT")
            .unwrap_or_else(|_| "8001".to_string())
            .parse()
            .map_err(|e| anyhow::anyhow!("Invalid PORT: {}", e))?;

        Ok(Self {
            database_url,
            host,
            port,
        })
    }
}
