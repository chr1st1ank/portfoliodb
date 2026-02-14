# API Endpoints Documentation

## Base URL
`http://127.0.0.1:8001`

## Endpoints

### Investments

#### List all investments
```bash
GET /api/investments
```

**Response:** Array of investment objects
```json
[
  {
    "id": 1,
    "name": "iShares EURO STOXX 50 (DE) ETF",
    "isin": "DE0005933956",
    "shortname": "iShares EURO STOXX 50",
    "ticker_symbol": null,
    "quote_provider": null
  }
]
```

#### Get investment by ID
```bash
GET /api/investments/:id
```

#### Create investment
```bash
POST /api/investments
Content-Type: application/json

{
  "name": "New Investment",
  "isin": "DE000...",
  "shortname": "Short Name",
  "ticker_symbol": "TICKER",
  "quote_provider": "yahoo"
}
```

#### Update investment
```bash
PUT /api/investments/:id
Content-Type: application/json
```

#### Delete investment
```bash
DELETE /api/investments/:id
```

---

### Movements (Transactions)

#### List all movements
```bash
GET /api/movements
```

**Response:** Array of movement objects
```json
[
  {
    "id": 1,
    "date": "2012-01-10",
    "action_id": 1,
    "investment_id": 1,
    "quantity": 167.0,
    "amount": -4001.28,
    "fee": null
  }
]
```

#### Get movement by ID
```bash
GET /api/movements/:id
```

#### Create movement
```bash
POST /api/movements
Content-Type: application/json

{
  "date": "2024-01-15",
  "action_id": 1,
  "investment_id": 1,
  "quantity": 10.0,
  "amount": -500.00,
  "fee": 5.00
}
```

#### Update movement
```bash
PUT /api/movements/:id
```

#### Delete movement
```bash
DELETE /api/movements/:id
```

---

### Investment Prices

#### List investment prices
```bash
GET /api/investment-prices?investment_id=1&start_date=2020-01-01&end_date=2024-12-31
```

**Query Parameters:**
- `investment_id` (optional): Filter by investment ID
- `start_date` (optional): Start date in YYYY-MM-DD format
- `end_date` (optional): End date in YYYY-MM-DD format

**Default:** If no dates specified, returns last 3 years of data

**Response:**
```json
[
  {
    "date": "2024-01-15",
    "investment_id": 1,
    "price": 45.67,
    "source": "yahoo"
  }
]
```

#### Create investment price
```bash
POST /api/investment-prices
Content-Type: application/json

{
  "date": "2024-01-15",
  "investment_id": 1,
  "price": 45.67,
  "source": "manual"
}
```

#### Upsert investment price
```bash
POST /api/investment-prices/upsert
Content-Type: application/json

{
  "date": "2024-01-15",
  "investment_id": 1,
  "price": 45.67,
  "source": "yahoo"
}
```

**Note:** Upsert will insert or update based on date + investment_id combination

---

### Action Types

#### List all action types
```bash
GET /api/action-types
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Buy"
  },
  {
    "id": 2,
    "name": "Sell"
  },
  {
    "id": 3,
    "name": "Payout"
  }
]
```

#### Get action type by ID
```bash
GET /api/action-types/:id
```

---

### Settings

#### Get settings
```bash
GET /api/settings
```

**Response:**
```json
{
  "id": 1,
  "base_currency": "EUR"
}
```

#### Update settings
```bash
PUT /api/settings
Content-Type: application/json

{
  "base_currency": "USD"
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful request
- `400 Bad Request` - Invalid input
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Testing Examples

### Get all investments
```bash
curl http://127.0.0.1:8001/api/investments | jq .
```

### Get movements count
```bash
curl http://127.0.0.1:8001/api/movements | jq '. | length'
```

### Get investment prices for specific investment
```bash
curl 'http://127.0.0.1:8001/api/investment-prices?investment_id=1&start_date=2020-01-01' | jq .
```

### Get settings
```bash
curl http://127.0.0.1:8001/api/settings | jq .
```

### Create a new movement
```bash
curl -X POST http://127.0.0.1:8001/api/movements \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2024-01-15",
    "action_id": 1,
    "investment_id": 1,
    "quantity": 10.0,
    "amount": -500.00,
    "fee": 5.00
  }' | jq .
```
