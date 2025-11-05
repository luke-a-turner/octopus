# Octopus Energy API

A FastAPI-based REST API for fetching and processing Octopus Energy Agile tariff data.

## Overview

This API provides endpoints to retrieve future Octopus Energy tariff data using the Octopus Energy public API. The data is processed using Polars for efficient data manipulation.

## Prerequisites

- Python 3.12 or higher
- Poetry (Python dependency management tool)

## Installation

### 1. Install Poetry

If you don't have Poetry installed, install it using one of these methods:

**Windows (PowerShell):**
```powershell
(Invoke-WebRequest -Uri https://install.python-poetry.org -UseBasicParsing).Content | py -
```

**Linux/macOS:**
```bash
curl -sSL https://install.python-poetry.org | python3 -
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` and add your Octopus Energy API credentials:

```bash
# Octopus Energy API Key
OCTOPUS_API_KEY=your_api_key_here

# Smart Meter Configuration
MPAN=your_mpan_here
SERIAL_NUMBER=your_serial_number_here
```

**How to get your credentials:**
- **API Key**: Log into your Octopus Energy account → Developer Settings → API Key
- **MPAN**: Found on your electricity bill (13-digit number)
- **Serial Number**: Found on your smart meter or electricity bill

### 3. Install Dependencies

Navigate to the project root directory and install dependencies:

```bash
poetry install
```

This will create a virtual environment and install all required dependencies including:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Polars (data processing)
- aiohttp (async HTTP client)
- python-dotenv (environment variable loading)
- cachetools (response caching)

## Running the API

### Development Server

To start the API server in development mode:

```bash
poetry run uvicorn api.api:app --reload
```

The `--reload` flag enables auto-reload on code changes.

### Production Server

For production, run without the reload flag:

```bash
poetry run uvicorn api.api:app --host 0.0.0.0 --port 8000
```

### Custom Host and Port

You can specify custom host and port:

```bash
poetry run uvicorn api.api:app --host 127.0.0.1 --port 8080
```

## API Endpoints

### Data Endpoints

#### GET /tariff-data-today

Retrieves Octopus Energy Agile tariff data for today only.

**Caching:** Results cached for 1 hour

**Response:**
```json
[
  {
    "valid_from": "2024-01-01T00:00:00",
    "value_inc_vat": 15.5
  }
]
```

**Example Request:**
```bash
curl http://localhost:8000/tariff-data-today
```

#### GET /tariff-data-today-and-tomorrow

Retrieves tariff data from start of today through tomorrow.

**Caching:** Results cached for 1 hour

**Example Request:**
```bash
curl http://localhost:8000/tariff-data-today-and-tomorrow
```

#### GET /smart-meter-usage-historic

Retrieves historical smart meter consumption data.

**Caching:** Results cached for 1 hour

**Response:**
```json
[
  {
    "interval_start": "2024-01-01T00:00:00",
    "consumption": 0.5
  }
]
```

**Example Request:**
```bash
curl http://localhost:8000/smart-meter-usage-historic?start_datetime=2024-01-01T00:00:00&end_datetime=2024-01-02T00:00:00
```

#### GET /smart-meter-usage-live

Retrieves live smart meter usage via GraphQL (requires Octopus Home Mini).

**Caching:** NOT CACHED (live data)

**Example Request:**
```bash
curl http://localhost:8000/smart-meter-usage-live
```

### Cache Management Endpoints

#### GET /cache/info

Get information about the current cache state.

**Response:**
```json
{
  "size": 3,
  "maxsize": 100,
  "ttl": 3600,
  "keys": ["get_tariff_data_today:abc123", "..."]
}
```

**Example Request:**
```bash
curl http://localhost:8000/cache/info
```

#### POST /cache/clear

Clear all cached data. Useful for forcing fresh data retrieval.

**Response:**
```json
{
  "message": "Cache cleared successfully"
}
```

**Example Request:**
```bash
curl -X POST http://localhost:8000/cache/clear
```

## API Documentation

Once the server is running, you can access:

- **Interactive API docs (Swagger UI):** http://localhost:8000/docs
- **Alternative API docs (ReDoc):** http://localhost:8000/redoc
- **OpenAPI schema:** http://localhost:8000/openapi.json

## Project Structure

```
api/
├── api.py              # Main FastAPI application
├── async_request.py    # Async HTTP request handlers
├── cache.py            # Caching utilities and decorators
├── constants.py        # Configuration constants and enums
├── functions.py        # Helper functions
└── README.md          # This file
```

## Configuration

### Environment Variables

The API uses environment variables for sensitive configuration. These are loaded from the `.env` file:

- `OCTOPUS_API_KEY`: Your Octopus Energy API key (required for smart meter data)
- `MPAN`: Your Meter Point Administration Number (13 digits)
- `SERIAL_NUMBER`: Your electricity meter serial number

**Important:** Never commit the `.env` file to git. It's already included in `.gitignore`.

### Tariff Configuration

The API fetches data from:
- Product: `AGILE-24-10-01`
- Tariff: `E-1R-AGILE-24-10-01-J`
- Region: Standard unit rates (J region)

To use a different tariff, update the constants in `api/constants.py`.

### Caching

The API implements a 1-hour TTL (Time To Live) cache for all data endpoints to:
- Reduce API calls to Octopus Energy
- Improve response times
- Stay within API rate limits

**Cache Configuration:**
- **TTL:** 3600 seconds (1 hour)
- **Max Size:** 100 entries
- **Implementation:** cachetools.TTLCache

**Cache Behavior:**
- First request fetches fresh data from Octopus Energy API
- Subsequent requests (within 1 hour) return cached data
- Cache entries automatically expire after 1 hour
- Live data endpoint (`/smart-meter-usage-live`) is NOT cached

**Manual Cache Management:**
- View cache status: `GET /cache/info`
- Clear all cache: `POST /cache/clear`

## Development

### Activate Virtual Environment

To activate the Poetry virtual environment:

```bash
poetry shell
```

### Add New Dependencies

To add new dependencies:

```bash
poetry add package-name
```

### Update Dependencies

To update all dependencies:

```bash
poetry update
```

## Troubleshooting

### Missing Environment Variables

If you get errors about missing API keys or credentials:

1. Ensure `.env` file exists in the project root
2. Check that all required variables are set:
   ```bash
   cat .env
   ```
3. Restart the API server after making changes

### Authentication Errors

If you get 401/403 errors from Octopus Energy API:

1. Verify your API key is correct in `.env`
2. Check your API key is active in your Octopus Energy account
3. Ensure your MPAN and Serial Number are correct

### Port Already in Use

If port 8000 is already in use, specify a different port:

```bash
poetry run uvicorn api.api:app --port 8001
```

### Module Not Found Error

Ensure you're running commands from the project root directory and that dependencies are installed:

```bash
poetry install
```

### Virtual Environment Issues

If you encounter virtual environment issues, you can reset it:

```bash
poetry env remove python
poetry install
```

## Notes

- The API fetches data from the Octopus Energy public API
- Data is filtered to show only future tariff rates
- Results are returned in JSON format with timestamps and prices including VAT
