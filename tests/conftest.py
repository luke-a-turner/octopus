"""
Pytest configuration and fixtures
"""
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
