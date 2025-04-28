# Project Description: **Portfolio Tracker**

## Goal

A web-based tool for managing and analyzing a private securities portfolio. It enables the import of PDF transactions (e.g., from Flatex), stores data persistently, displays the performance of individual securities as well as the overall portfolio graphically, and updates price data regularly via web scraping.

## Main Features

### Portfolio Analysis

- Overall portfolio development including deposits/withdrawals
- Display of historical performance of individual securities
- Charts (e.g., line, bar, or pie charts) for visualization

### Transactions

- Upload of PDF documents (e.g., buy/sell from Flatex)
- Parsing and extraction of transaction data (date, ISIN, quantity, price, fees, etc.)
- Ability to manually correct and supplement via web UI or admin interface

### Price Updates

- Daily retrieval of current prices via web scraping (e.g., from bank website)
- Automatically via cron job or scheduled background task

### Frontend

- Modern React app with clean UI
- Clear presentation of transactions, performance, portfolio composition

### Data Storage

- Local SQLite database
- Persistent storage of all transactions and prices
- No user management necessary (single-user)

## Architecture

- **Backend**: Django + Django REST Framework
- **Frontend**: React + Vite + Tailwind + Chart.js/Recharts
- **Deployment**: Can be started locally, optionally as Docker container for server operation

## Code Structure

### Project Root

```plaintext
/portfoliodb2
├── backend/           # Django backend application
├── docs/              # Project documentation
├── frontend/          # React frontend application
├── local/             # Local development files
├── .dockerignore      # Docker ignore file
├── .gitignore         # Git ignore file
├── Dockerfile         # Docker configuration
└── Taskfile.yaml      # Task runner configuration
```

### Backend Structure

```plaintext
/backend
├── core/                  # Main Django application
│   ├── fixtures/          # Sample and test data
│   ├── migrations/        # Database migrations
│   ├── tests/             # Unit tests
│   ├── admin.py           # Django admin configuration
│   ├── apps.py            # Django app configuration
│   ├── models.py          # Database models
│   ├── serializers.py     # REST API serializers
│   ├── table_calculations.py # Portfolio calculation logic
│   └── views.py           # API endpoints
├── portfoliodb/           # Django project settings
│   ├── settings.py        # Project settings
│   ├── urls.py            # URL routing
│   ├── asgi.py            # ASGI configuration
│   └── wsgi.py            # WSGI configuration
├── manage.py              # Django management script
└── pyproject.toml         # Python dependencies
```

### Frontend Structure

```plaintext
/frontend
├── public/                # Static public assets
├── src/                   # Source code
│   ├── components/        # React components
│   │   ├── InvestmentDetail.tsx    # Individual investment details
│   │   ├── Movements.tsx           # Portfolio movements
│   │   ├── MovementsWrapper.tsx    # Container for movements
│   │   ├── PerformanceChart.tsx    # Performance visualization
│   │   ├── PortfolioComposition.tsx # Portfolio composition view
│   │   ├── PortfolioDashboard.tsx  # Main dashboard component
│   │   ├── PortfolioTable.tsx      # Tabular portfolio data
│   │   └── ThemeToggle.tsx         # Dark/light mode toggle
│   ├── hooks/             # Custom React hooks
│   ├── services/          # API service layer
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main application component
│   ├── theme.ts           # UI theme configuration
│   └── main.tsx           # Application entry point
├── index.html             # HTML entry point
├── package.json           # NPM dependencies
├── tsconfig.json          # TypeScript configuration
└── vite.config.ts         # Vite bundler configuration
```

### Data Flow

1. **User Interaction**: Users interact with React components in the frontend
2. **API Requests**: Frontend services make API calls to the Django backend
3. **Data Processing**: Backend processes requests using models and business logic
4. **Database Operations**: Core models interact with SQLite database
5. **Response**: Processed data is serialized and returned to the frontend
6. **Rendering**: Frontend components render the updated data

### Development Workflow

- Backend development uses Django's development server
- Frontend development uses Vite's development server
- Tasks are managed using Taskfile.yaml for common operations
- Dependencies are managed with uv for Python and npm for JavaScript
