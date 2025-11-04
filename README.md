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

### 2. Configure Environment Variables

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

### 3. Install Backend Dependencies

```bash
# Install Poetry if you haven't already
curl -sSL https://install.python-poetry.org | python3 -

# Install Python dependencies
poetry install
```

### 4. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 5. Start the Application

**Terminal 1 - Start Backend API:**

```bash
poetry run uvicorn api.api:app --reload
```

The API will be available at `http://localhost:8000`

**Terminal 2 - Start Frontend:**

```bash
cd frontend
npm run dev
```

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

### Tariff Data

- `GET /tariff-data-today` - Today's tariff prices only
- `GET /tariff-data-today-and-tomorrow` - Tariff prices for today and tomorrow

### Smart Meter Data

- `GET /smart-meter-usage-historic` - Historical consumption data
- `GET /smart-meter-usage-live` - Live usage (requires Octopus Home Mini)

For detailed API documentation, see [api/README.md](api/README.md) or visit http://localhost:8000/docs

## Development

### Backend Development

```bash
# Activate Poetry shell
poetry shell

# Run with auto-reload
poetry run uvicorn api.api:app --reload

# Add new dependencies
poetry add package-name

# Update dependencies
poetry update
```

### Frontend Development

```bash
cd frontend

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Add new dependencies
npm install package-name
```

### Code Structure

**Backend (Python):**
- FastAPI for REST API
- Polars for data processing
- aiohttp for async HTTP requests
- python-dotenv for environment variables

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

### Frontend
- [React](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Fast build tool
- [Plotly.js](https://plotly.com/javascript/) - Charting library
- [Axios](https://axios-http.com/) - HTTP client

## License

Private project

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly (backend and frontend)
4. Submit a pull request

## Support

For issues:
1. Check the troubleshooting sections above
2. Review API logs in the terminal
3. Check browser console for frontend errors (F12)
4. Verify environment variables are set correctly

## Roadmap

- [ ] Add cost calculation features
- [ ] Historical data comparison
- [ ] Export data to CSV
- [ ] Cache data (redis or postgres?)
- [ ] User preferences and settings
- [ ] Integration with home automation systems
- [ ] Additional charting?
