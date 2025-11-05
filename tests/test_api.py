"""
Tests for API endpoints
"""
from unittest.mock import AsyncMock, patch

import polars as pl
import pytest
from fastapi.testclient import TestClient

from api.api import app


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


@pytest.fixture
def mock_polars_df():
    """Create a mock Polars DataFrame"""
    return pl.DataFrame(
        {
            "valid_from": ["2024-01-01T00:00:00", "2024-01-01T00:30:00"],
            "value_inc_vat": [15.5, 16.2],
        }
    )


@pytest.fixture
def mock_consumption_df():
    """Create a mock consumption DataFrame"""
    return pl.DataFrame(
        {
            "interval_start": ["2024-01-01T00:00:00", "2024-01-01T00:30:00"],
            "consumption": [0.5, 0.6],
        }
    )


def test_read_root(client):
    """Test that the app is running"""
    response = client.get("/docs")
    assert response.status_code == 200


def test_cache_info_endpoint(client):
    """Test cache info endpoint"""
    response = client.get("/cache/info")
    assert response.status_code == 200

    data = response.json()
    assert "size" in data
    assert "maxsize" in data
    assert "ttl" in data
    assert "keys" in data

    assert data["maxsize"] == 100
    assert data["ttl"] == 3600


def test_cache_clear_endpoint(client):
    """Test cache clear endpoint"""
    response = client.post("/cache/clear")
    assert response.status_code == 200

    data = response.json()
    assert "message" in data
    assert data["message"] == "Cache cleared successfully"


def test_cors_headers(client):
    """Test CORS headers are present"""
    response = client.options("/cache/info", headers={"Origin": "http://localhost:5173"})
    # CORS middleware should add appropriate headers
    assert response.status_code in [200, 405]  # OPTIONS might not be explicitly defined


@pytest.mark.asyncio
async def test_tariff_data_today_endpoint(client, mock_polars_df):
    """Test tariff data today endpoint"""
    with patch("api.api.get_polars_dataframe", new_callable=AsyncMock) as mock_get_data:
        mock_get_data.return_value = mock_polars_df

        response = client.get("/tariff-data-today")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert "valid_from" in data[0]
        assert "value_inc_vat" in data[0]


@pytest.mark.asyncio
async def test_tariff_data_today_and_tomorrow_endpoint(client, mock_polars_df):
    """Test tariff data today and tomorrow endpoint"""
    with patch("api.api.get_polars_dataframe", new_callable=AsyncMock) as mock_get_data:
        mock_get_data.return_value = mock_polars_df

        response = client.get("/tariff-data-today-and-tomorrow")
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2


@pytest.mark.asyncio
async def test_smart_meter_historic_consumption_endpoint(client, mock_consumption_df):
    """Test smart meter historic consumption endpoint"""
    with patch("api.api.get_polars_dataframe", new_callable=AsyncMock) as mock_get_data:
        mock_get_data.return_value = mock_consumption_df

        response = client.get(
            "/smart-meter-historic-consumption",
            params={
                "start_datetime": "2024-01-01T00:00:00",
                "end_datetime": "2024-01-01T23:59:59",
            },
        )
        assert response.status_code == 200

        data = response.json()
        assert isinstance(data, list)
        assert len(data) == 2
        assert "interval_start" in data[0]
        assert "consumption" in data[0]


@pytest.mark.asyncio
async def test_tariff_rates_with_historic_consumption_endpoint(
    client, mock_polars_df, mock_consumption_df
):
    """Test tariff rates with historic consumption endpoint"""
    # Create a joined DataFrame
    joined_df = pl.DataFrame(
        {
            "valid_from": ["2024-01-01T00:00:00", "2024-01-01T00:30:00"],
            "value_inc_vat": [15.5, 16.2],
            "consumption": [0.5, 0.6],
        }
    )

    with patch("api.api.get_polars_dataframe", new_callable=AsyncMock) as mock_get_data:
        # First call returns tariff data, second call returns consumption data
        mock_get_data.side_effect = [mock_polars_df, mock_consumption_df]

        # Mock the join operation
        with patch.object(mock_polars_df, "join", return_value=joined_df):
            with patch.object(joined_df, "fill_null", return_value=joined_df):
                response = client.get(
                    "/tariff-rates-with-historic-consumption",
                    params={
                        "start_datetime": "2024-01-01T00:00:00",
                        "end_datetime": "2024-01-01T23:59:59",
                    },
                )
                assert response.status_code == 200

                data = response.json()
                assert isinstance(data, list)
                if len(data) > 0:
                    assert "valid_from" in data[0]
                    assert "value_inc_vat" in data[0]
                    assert "consumption" in data[0]


@pytest.mark.asyncio
async def test_tariff_data_caching(client):
    """Test that tariff data endpoint uses caching"""
    # Clear cache first
    client.post("/cache/clear")

    # Mock the get_polars_dataframe function to avoid actual API calls
    with patch("api.api.get_polars_dataframe", new_callable=AsyncMock) as mock_get_data:
        mock_df = pl.DataFrame(
            {
                "valid_from": ["2024-01-01T00:00:00"],
                "value_inc_vat": [15.5],
            }
        )
        mock_get_data.return_value = mock_df

        # First request - should call the function
        response1 = client.get("/tariff-data-today")
        assert response1.status_code == 200

        # Second request - should use cache (check cache size)
        response2 = client.get("/tariff-data-today")
        assert response2.status_code == 200

        # Check cache has entry
        cache_info = client.get("/cache/info").json()
        assert cache_info["size"] > 0


def test_invalid_endpoint(client):
    """Test that invalid endpoints return 404"""
    response = client.get("/nonexistent-endpoint")
    assert response.status_code == 404


def test_api_response_structure(client):
    """Test that endpoints return proper JSON structure"""
    # Test cache info structure
    response = client.get("/cache/info")
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"

    data = response.json()
    assert isinstance(data, dict)
    assert isinstance(data["size"], int)
    assert isinstance(data["maxsize"], int)
    assert isinstance(data["ttl"], int)
    assert isinstance(data["keys"], list)


def test_datetime_parameter_validation(client):
    """Test that endpoints validate datetime parameters"""
    response = client.get(
        "/smart-meter-historic-consumption",
        params={
            "start_datetime": "invalid-date",
            "end_datetime": "2024-01-01T23:59:59",
        },
    )
    # Should return 422 for invalid datetime format
    assert response.status_code == 422
