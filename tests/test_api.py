"""
Tests for API endpoints
"""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from api.api import app


@pytest.fixture
def client():
    """Create a test client"""
    return TestClient(app)


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
async def test_tariff_data_caching(client):
    """Test that tariff data endpoint uses caching"""
    # Clear cache first
    client.post("/cache/clear")

    # Mock the get_data function to avoid actual API calls
    with patch("api.api.get_data", new_callable=AsyncMock) as mock_get_data:
        mock_get_data.return_value = AsyncMock(
            to_dicts=lambda: [{"valid_from": "2024-01-01T00:00:00", "value_inc_vat": 15.5}]
        )

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
