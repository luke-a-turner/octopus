# Octopus Energy Dashboard

A full-stack application for visualizing Octopus Energy Agile tariff prices and smart meter consumption data with interactive charts.

## Overview

This project provides real-time visualization of electricity prices and smart meter usage from Octopus Energy. It consists of:

- **Backend API** (FastAPI/Python): Fetches and processes data from Octopus Energy API
- **Frontend** (React/TypeScript): Interactive dashboard with Plotly charts

### Features

- 📊 Real-time Agile tariff price visualization
- ⚡ Smart meter consumption tracking
- 🌙 Dark theme interface
- 📈 Dual y-axis charts for price vs usage comparison
- 🔄 Async data fetching for optimal performance
- 💾 1-hour response caching for improved performance
- 🎨 Custom color schemes for data visualization

## Project Structure

```
octopus/
├── api/                    # Backend FastAPI application
│   ├── api.py             # Main API endpoints
│   ├── async_request.py   # Async HTTP handlers
│   ├── constants.py       # Configuration constants
│   ├── functions.py       # Helper functions
│   └── README.md          # API documentation
├── frontend/              # React TypeScript application
│   ├── src/
│   │   ├── App.tsx       # Main React component
│   │   └── main.tsx      # Entry point
│   ├── index.html        # HTML template
│   ├── package.json      # Node dependencies
│   └── README.md         # Frontend documentation
├── agile/                # Utility modules
├── .env                  # Environment variables (DO NOT COMMIT)
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
├── pyproject.toml       # Python dependencies
└── README.md            # This file
```

## Prerequisites

- **Python 3.12+**
- **Node.js 16+**
- **Poetry** (Python package manager)
- **Octopus Energy account** with API access

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd octopus
```

### 2. Install Make (if needed)

**Windows:**
- Install via [Chocolatey](https://chocolatey.org/): `choco install make`
- Or use [WSL](https://docs.microsoft.com/en-us/windows/wsl/)
- Or use Git Bash (includes make)

**macOS:**
```bash
xcode-select --install
```

**Linux:**
```bash
sudo apt-get install build-essential  # Debian/Ubuntu
sudo yum groupinstall "Development Tools"  # CentOS/RHEL
```

### 3. Configure Environment Variables

Create a `.env` file from the example template:

```bash
cp .env.example .env
```

Edit the `.env` file with your Octopus Energy credentials:

```bash
# Octopus Energy API Key
OCTOPUS_API_KEY=your_api_key_here

# Smart Meter Configuration
MPAN=your_mpan_here
SERIAL_NUMBER=your_serial_number_here
```

#### How to Get Your Credentials

**API Key:**
1. Log into your [Octopus Energy account](https://octopus.energy/)
2. Navigate to **Account** → **Developer Settings**
3. Generate or copy your API key

**MPAN (Meter Point Administration Number):**
- Found on your electricity bill (13-digit number)
- Format: `1234567890123`

**Serial Number:**
- Found on your smart meter display
- Also available on your electricity bill
- Format varies by meter type (e.g., `21L4373149`)

### 4. Install All Dependencies

Using Makefile (recommended):
```bash
make install
```

Or manually:
```bash
# Backend
poetry install

# Frontend
cd frontend && npm install
```

### 5. Start the Application

**Option A: Using Makefile (in separate terminals)**

Terminal 1 - Backend:
```bash
make dev-backend
```

Terminal 2 - Frontend:
```bash
make dev-frontend
```

**Option B: Manually**

Terminal 1 - Backend:
```bash
poetry run uvicorn api.api:app --reload
```

Terminal 2 - Frontend:
```bash
cd frontend && npm run dev
```

The API will be available at `http://localhost:8000`
The frontend will be available at `http://localhost:5173`

### 6. Access the Dashboard

Open your browser and navigate to:
- **Dashboard:** http://localhost:5173
- **API Docs:** http://localhost:8000/docs

## Environment Variables

The application uses environment variables for sensitive configuration. These must be set in the `.env` file at the project root.

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `OCTOPUS_API_KEY` | Your Octopus Energy API key | `sk_live_abc123...` |
| `MPAN` | Meter Point Administration Number | `2000011405806` |
| `SERIAL_NUMBER` | Electricity meter serial number | `21L4373149` |

### Security Notes

- ⚠️ **Never commit the `.env` file to git**
- The `.env` file is already in `.gitignore`
- Use `.env.example` as a template for new developers
- Keep your API key secure and don't share it publicly

## API Endpoints

The backend provides the following REST endpoints:

### Tariff Data (Cached for 1 hour)

- `GET /tariff-data-today` - Today's tariff prices only
- `GET /tariff-data-today-and-tomorrow` - Tariff prices for today and tomorrow

### Smart Meter Data

- `GET /smart-meter-usage-historic` - Historical consumption data (cached for 1 hour)
- `GET /smart-meter-usage-live` - Live usage (requires Octopus Home Mini, NOT cached)

### Cache Management

- `GET /cache/info` - View cache status
- `POST /cache/clear` - Clear all cached data

For detailed API documentation, see [api/README.md](api/README.md) or visit http://localhost:8000/docs

### Caching

All data endpoints (except live data) are cached for 1 hour to:
- Reduce API calls to Octopus Energy
- Improve response times
- Stay within rate limits
- Decrease server load

## Makefile Commands

The project includes a comprehensive Makefile for easy command execution.

### Quick Reference

```bash
make help           # Show all available commands
make install        # Install all dependencies
make test           # Run all tests
make lint           # Run all linters
make format         # Format all code
make check          # Run format + lint + test
make clean          # Clean cache files
```

### Common Development Tasks

```bash
# Development
make dev-backend              # Start backend server
make dev-frontend             # Start frontend server

# Testing
make test                     # Run all tests
make test-backend             # Backend tests only
make test-frontend            # Frontend tests only
make test-coverage            # Generate coverage reports

# Linting
make lint                     # Check all code
make lint-backend             # Check backend only
make lint-frontend            # Check frontend only
make lint-fix                 # Auto-fix all issues

# Formatting
make format                   # Format all code
make format-backend           # Format backend only
make format-frontend          # Format frontend only

# Quality Checks
make check                    # Full quality check (format + lint + test)
make check-backend            # Backend quality check
make check-frontend           # Frontend quality check
make pre-commit               # Quick pre-commit check (format + lint)
make quick-check              # Auto-fix and test

# Cache Management
make cache-clear              # Clear API cache
make cache-info               # View cache status

# Build
make build                    # Build for production
make clean                    # Clean cache files
make clean-all                # Clean everything including deps
```

## Development

### Backend Development

**Using Makefile:**
```bash
make dev-backend              # Start server
make test-backend             # Run tests
make lint-backend             # Check code
make format-backend           # Format code
```

**Or manually:**
```bash
# Activate Poetry shell
poetry shell

# Run with auto-reload
poetry run uvicorn api.api:app --reload

# Run tests
poetry run pytest

# Run tests with coverage
poetry run pytest --cov

# Linting
poetry run ruff check .              # Check for issues
poetry run ruff check . --fix        # Auto-fix issues
poetry run black .                   # Format code
poetry run isort .                   # Sort imports
poetry run mypy api/                 # Type checking

# Add new dependencies
poetry add package-name

# Update dependencies
poetry update
```

### Frontend Development

**Using Makefile:**
```bash
make dev-frontend             # Start server
make test-frontend            # Run tests
make lint-frontend            # Check code
make format-frontend          # Format code
```

**Or manually:**
```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run coverage

# Linting
npm run lint                         # Check for issues
npm run lint:fix                     # Auto-fix issues
npm run format                       # Format code with Prettier
npm run format:check                 # Check formatting
npm run type-check                   # TypeScript type checking

# Add new dependencies
npm install package-name
```

### Code Structure

**Backend (Python):**
- FastAPI for REST API
- Polars for data processing
- aiohttp for async HTTP requests
- python-dotenv for environment variables
- cachetools for response caching

**Frontend (TypeScript/React):**
- React 18 with TypeScript
- Vite for build tooling
- Plotly.js for interactive charts
- Axios for HTTP requests

## Data Visualization

The dashboard displays:

### Bar Charts (Tariff Prices)
- Color-coded by date
- Prices in pence per kWh (left y-axis)
- Interactive hover for exact values
- Custom colors: `#E3E342`, `#2A2299`, `#24941B`

### Line Chart (Smart Meter Usage)
- Continuous line with markers
- Consumption in kWh (right y-axis)
- Red color (`#FF6B6B`) for distinction

### Chart Interactions
- **Zoom:** Click and drag
- **Pan:** Hold Shift and drag
- **Reset:** Double-click
- **Toggle Series:** Click legend items

## Troubleshooting

### Environment Variables Not Loading

```bash
# Check .env file exists
ls -la .env

# Verify contents (without exposing secrets)
cat .env | grep -v "OCTOPUS_API_KEY"

# Restart the API server after changes
```

### API Authentication Errors

- Verify API key is correct in `.env`
- Check MPAN and Serial Number format
- Ensure API key is active in your Octopus account

### CORS Errors in Browser

- Ensure backend API is running on `http://localhost:8000`
- Check CORS middleware is enabled in `api/api.py`
- Clear browser cache if issues persist

### Port Conflicts

**Backend:**
```bash
poetry run uvicorn api.api:app --port 8001
```

**Frontend:**
```bash
npm run dev -- --port 3000
```

### Dependencies Issues

```bash
# Backend
poetry env remove python
poetry install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Production Deployment

### Backend

```bash
# Build and run with production settings
poetry run uvicorn api.api:app --host 0.0.0.0 --port 8000 --workers 4
```

### Frontend

```bash
cd frontend
npm run build
# Deploy dist/ directory to your hosting provider
```

## Documentation

- **API Documentation:** [api/README.md](api/README.md)
- **Frontend Documentation:** [frontend/README.md](frontend/README.md)
- **Interactive API Docs:** http://localhost:8000/docs (when running)

## Technologies Used

### Backend
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Polars](https://www.pola.rs/) - Fast DataFrame library
- [aiohttp](https://docs.aiohttp.org/) - Async HTTP client/server
- [Uvicorn](https://www.uvicorn.org/) - ASGI server
- [cachetools](https://cachetools.readthedocs.io/) - Extensible memoizing collections

### Frontend
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool
- [Plotly.js](https://plotly.com/javascript/) - Charting library
- [Axios](https://axios-http.com/) - HTTP client

## License

Private project

## Code Quality

### Linting

The project uses linting tools to maintain code quality and consistency.

**Backend (Python):**
- **Ruff** - Fast Python linter
- **Black** - Code formatter
- **isort** - Import sorter
- **mypy** - Static type checker

**Frontend (TypeScript):**
- **ESLint** - JavaScript/TypeScript linter
- **Prettier** - Code formatter
- **TypeScript** - Type checking

### Running Linters

**Backend:**
```bash
# Check all issues
poetry run ruff check .

# Auto-fix issues
poetry run ruff check . --fix

# Format code
poetry run black .

# Sort imports
poetry run isort .

# Type check
poetry run mypy api/
```

**Frontend:**
```bash
cd frontend

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

### IDE Integration

VSCode settings are included in `.vscode/` for automatic formatting and linting:
- Format on save enabled
- ESLint/Ruff auto-fix on save
- Recommended extensions in `.vscode/extensions.json`

## Testing

### Backend Tests (Python/Pytest)

The backend uses pytest for unit testing.

**Run all tests:**
```bash
poetry run pytest
```

**Run with coverage report:**
```bash
poetry run pytest --cov
```

**Run specific test file:**
```bash
poetry run pytest tests/test_cache.py
```

**Test files:**
- `tests/test_api.py` - API endpoint tests
- `tests/test_cache.py` - Caching functionality tests
- `tests/conftest.py` - Pytest configuration and fixtures

### Frontend Tests (Vitest/React Testing Library)

The frontend uses Vitest and React Testing Library.

**Run all tests:**
```bash
cd frontend
npm test
```

**Run tests with UI:**
```bash
npm run test:ui
```

**Run with coverage:**
```bash
npm run coverage
```

**Test files:**
- `src/test/App.test.tsx` - App component tests
- `src/test/setup.ts` - Test configuration

## Contributing

1. Create a feature branch
2. Make your changes
3. **Write tests** for new features
4. **Run quality checks** before committing
   ```bash
   make check          # Run all checks (format, lint, test)
   # or
   make pre-commit     # Quick check (format + lint only)
   ```
5. Submit a pull request

### Commit Checklist
- [ ] `make format` - Code is formatted
- [ ] `make lint` - No linting errors
- [ ] `make test` - All tests pass
- [ ] Write tests for new features
- [ ] Update documentation if needed

## Support

For issues:
1. Check the troubleshooting sections above
2. Review API logs in the terminal
3. Check browser console for frontend errors (F12)
4. Verify environment variables are set correctly

## Roadmap

- [x] Cache data for 1 hour (implemented with cachetools)
- [ ] Add cost calculation features
- [ ] Historical data comparison
- [ ] Export data to CSV
- [ ] Persistent cache (Redis or PostgreSQL?)
- [ ] User preferences and settings
- [ ] Integration with home automation systems
- [ ] Additional charting options
