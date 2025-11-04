# Octopus Energy Tariff Frontend

A React TypeScript application that visualizes Octopus Energy Agile tariff prices and smart meter usage data using interactive Plotly charts.

## Overview

This frontend application provides real-time visualization of:
- **Agile Tariff Prices**: Bar charts showing electricity prices by time of day
- **Smart Meter Usage**: Line chart showing actual energy consumption from your smart meter

The application features a dark theme interface with dual y-axis charts for easy comparison between prices and usage.

## Features

- Real-time data fetching from Octopus Energy API via backend
- Interactive Plotly charts with zoom, pan, and hover functionality
- Dark theme UI optimized for extended viewing
- Dual y-axis visualization (prices on left, usage on right)
- Custom color scheme for data visualization
- Responsive design

## Prerequisites

- Node.js 16.x or higher
- npm or yarn package manager
- Backend API running on `http://localhost:8000`

## Installation

### 1. Install Dependencies

Navigate to the frontend directory and install required packages:

```bash
cd frontend
npm install
```

Or using yarn:

```bash
yarn install
```

## Running the Application

### Development Server

Start the development server with hot-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (default Vite port).

### Production Build

Build the application for production:

```bash
npm run build
```

This creates optimized production files in the `dist/` directory.

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── App.tsx          # Main application component
│   └── main.tsx         # Application entry point
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
├── vite.config.js       # Vite build configuration
└── README.md           # This file
```

## Configuration

### API Endpoint

The application connects to the backend API at `http://localhost:8000`. If your API runs on a different host or port, update the axios requests in `src/App.tsx`:

```typescript
axios.get('http://your-api-host:port/tariff-data-sod-onwards')
axios.get('http://your-api-host:port/smart-meter-usage-today')
```

### Chart Colors

The chart uses custom colors defined in `src/App.tsx`:
- `#E3E342` - Yellow-green (1st date group)
- `#2A2299` - Blue (2nd date group)
- `#24941B` - Green (3rd date group)
- `#FF6B6B` - Red (Smart meter usage)

To customize colors, modify the `colors` array in the component.

## Technologies Used

- **React 18**: UI library
- **TypeScript**: Type-safe JavaScript
- **Vite**: Fast build tool and dev server
- **Axios**: HTTP client for API requests
- **Plotly.js**: Interactive charting library
- **react-plotly.js**: React wrapper for Plotly

## API Endpoints Used

The application consumes the following backend endpoints:

### GET `/tariff-data-sod-onwards`
Returns tariff data from start of day onwards.

**Response:**
```json
[
  {
    "valid_from": "2025-11-03T00:00:00",
    "value_inc_vat": 15.5
  }
]
```

### GET `/smart-meter-usage-today`
Returns smart meter consumption data for today.

**Response:**
```json
[
  {
    "interval_start": "2025-11-03T00:00:00",
    "consumption": 0.5
  }
]
```

## Chart Features

### Bar Chart (Tariff Prices)
- Grouped by date
- Color-coded by day
- Y-axis: Price in p/kWh (left side)
- Interactive hover showing exact prices

### Line Chart (Smart Meter Usage)
- Continuous line with markers
- Y-axis: Consumption in kWh (right side)
- Red color for easy distinction

### Interaction
- **Zoom**: Click and drag to zoom into specific time periods
- **Pan**: Hold shift and drag to pan across the data
- **Hover**: Shows exact values for each data point
- **Legend**: Click legend items to show/hide traces
- **Reset**: Double-click to reset zoom

## Troubleshooting

### Application Not Loading Data

1. **Check Backend API**: Ensure the API is running on `http://localhost:8000`
   ```bash
   curl http://localhost:8000/tariff-data-sod-onwards
   ```

2. **CORS Issues**: Verify CORS is enabled in the backend API

3. **Network Tab**: Open browser DevTools (F12) → Network tab to inspect API requests

### Port Already in Use

If port 5173 is already in use, Vite will automatically try the next available port. Check the terminal output for the actual URL.

To specify a custom port:
```bash
npm run dev -- --port 3000
```

### TypeScript Errors

If you encounter TypeScript errors, try:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Development

### Adding New Features

1. **New API Endpoint**: Add axios call in `App.tsx` useEffect
2. **New Chart Type**: Add new trace to `chartData` state
3. **Styling**: Modify inline styles or add CSS file

### Type Definitions

TypeScript interfaces are defined in `App.tsx`:
- `TariffData`: Tariff price data structure
- `UsageData`: Smart meter usage data structure
- `GroupedItem`: Processed data for charting

## Performance

- **Data Fetching**: Uses `Promise.all` for parallel API requests
- **Chart Rendering**: Plotly handles large datasets efficiently
- **Build Optimization**: Vite optimizes bundle size and uses code splitting

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## License

Private project

## Support

For issues or questions about the frontend:
1. Check browser console for errors (F12)
2. Verify backend API is accessible
3. Review network requests in DevTools
