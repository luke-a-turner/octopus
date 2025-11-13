"""
Pytest configuration and fixtures
"""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient

from api.api import app
from api.cache import clear_cache


@pytest.fixture
def client():
    """Create a test client for the FastAPI app"""
    return TestClient(app)


@pytest.fixture(autouse=True)
def clear_cache_after_test():
    """Clear cache after each test to ensure test isolation"""
    yield
    clear_cache()


@pytest.fixture
def sample_tariff_data():
    """Sample tariff data for testing"""
    return [
        {"valid_from": "2024-01-01T00:00:00", "value_inc_vat": 15.5},
        {"valid_from": "2024-01-01T00:30:00", "value_inc_vat": 16.2},
        {"valid_from": "2024-01-01T01:00:00", "value_inc_vat": 14.8},
    ]


@pytest.fixture
def sample_usage_data():
    """Sample smart meter usage data for testing"""
    return [
        {"interval_start": "2024-01-01T00:00:00", "consumption": 0.5},
        {"interval_start": "2024-01-01T00:30:00", "consumption": 0.6},
        {"interval_start": "2024-01-01T01:00:00", "consumption": 0.4},
    ]


@pytest.fixture(autouse=True)
def mock_database_functions():
    """Mock async database functions for all tests to avoid requiring a real database"""
    import polars as pl

    with patch("api.database.get_tariff_data_from_db", new_callable=AsyncMock, return_value=pl.DataFrame()):
        with patch(
            "api.database.get_consumption_data_from_db", new_callable=AsyncMock, return_value=pl.DataFrame()
        ):
            with patch(
                "api.database.insert_tariff_data_to_db", new_callable=AsyncMock, return_value=True
            ):
                with patch(
                    "api.database.insert_consumption_data_to_db",
                    new_callable=AsyncMock,
                    return_value=True,
                ):
                    with patch("api.data_service.get_tariff_data_from_db", new_callable=AsyncMock, return_value=pl.DataFrame()):
                        with patch("api.data_service.get_consumption_data_from_db", new_callable=AsyncMock, return_value=pl.DataFrame()):
                            with patch("api.data_service.insert_tariff_data_to_db", new_callable=AsyncMock, return_value=True):
                                with patch("api.data_service.insert_consumption_data_to_db", new_callable=AsyncMock, return_value=True):
                                    yield
