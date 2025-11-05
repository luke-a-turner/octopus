"""
Tests for data processing module
"""
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import polars as pl
import pytest

from api.constants import Field
from api.processing import get_polars_dataframe


@pytest.mark.asyncio
async def test_get_polars_dataframe_basic():
    """Test basic functionality of get_polars_dataframe"""
    mock_response = {
        "results": [
            {
                "valid_from": "2024-01-01T00:00:01Z",
                "value_inc_vat": 15.5,
            },
            {
                "valid_from": "2024-01-01T00:30:00Z",
                "value_inc_vat": 16.2,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        assert isinstance(df, pl.DataFrame)
        assert len(df) == 2
        assert Field.VALID_FROM in df.columns
        assert Field.VALUE in df.columns


@pytest.mark.asyncio
async def test_get_polars_dataframe_datetime_filtering():
    """Test that datetime filtering works correctly"""
    mock_response = {
        "results": [
            {
                "valid_from": "2024-01-01T00:00:00Z",
                "value_inc_vat": 15.5,
            },
            {
                "valid_from": "2024-01-01T12:00:00Z",
                "value_inc_vat": 16.2,
            },
            {
                "valid_from": "2024-01-02T00:00:00Z",  # Outside range
                "value_inc_vat": 17.0,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )
        print(df)

        # Should filter out the 2024-01-02 record
        assert len(df) == 2
        assert all(
            datetime(2024, 1, 1, 0, 0, 0) <= date < datetime(2024, 1, 1, 23, 59, 59)
            for date in df[Field.VALID_FROM].to_list()
        )


@pytest.mark.asyncio
async def test_get_polars_dataframe_calculates_pages():
    """Test that correct number of pages are calculated"""
    mock_response = {
        "results": [
            {
                "valid_from": "2024-01-01T00:00:00Z",
                "value_inc_vat": 15.5,
            },
            {
                "valid_from": "2024-01-01T12:00:00Z",
                "value_inc_vat": 16.2,
            },
            {
                "valid_from": "2024-01-02T00:00:00Z",  # Outside range
                "value_inc_vat": 17.0,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        # 24 hours = 48 half-hour intervals
        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        # Should call fetch_results with list of URLs
        mock_instance.fetch_results.assert_called_once()
        urls = mock_instance.fetch_results.call_args[0][0]
        assert isinstance(urls, list)
        assert all("page_size=" in url for url in urls)


@pytest.mark.asyncio
async def test_get_polars_dataframe_multiple_batches():
    """Test handling multiple batches of data"""
    mock_batch1 = {
        "results": [
            {
                "valid_from": "2024-01-01T00:00:00Z",
                "value_inc_vat": 15.5,
            },
        ]
    }

    mock_batch2 = {
        "results": [
            {
                "valid_from": "2024-01-01T12:00:00Z",
                "value_inc_vat": 16.2,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_batch1, mock_batch2])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        # Should concatenate both batches
        assert len(df) == 2


@pytest.mark.asyncio
async def test_get_polars_dataframe_consumption_data():
    """Test with consumption data fields"""
    mock_response = {
        "results": [
            {
                "interval_start": "2024-01-01T00:00:00Z",
                "consumption": 0.5,
            },
            {
                "interval_start": "2024-01-01T00:30:00Z",
                "consumption": 0.6,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.INTERVAL_START,
            Field.CONSUMPTION,
        )

        assert isinstance(df, pl.DataFrame)
        assert len(df) == 2
        assert Field.INTERVAL_START in df.columns
        assert Field.CONSUMPTION in df.columns


@pytest.mark.asyncio
async def test_get_polars_dataframe_empty_results():
    """Test handling of empty results"""
    mock_response = {"results": []}

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        assert isinstance(df, pl.DataFrame)
        assert len(df) == 0


@pytest.mark.asyncio
async def test_get_polars_dataframe_datetime_conversion():
    """Test that datetime strings are converted to datetime objects"""
    mock_response = {
        "results": [
            {
                "valid_from": "2024-01-01T12:30:00Z",
                "value_inc_vat": 15.5,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        # Check that the datetime column is of datetime type
        assert df[Field.VALID_FROM].dtype == pl.Datetime


@pytest.mark.asyncio
async def test_get_polars_dataframe_long_date_range():
    """Test with a longer date range requiring multiple pages"""
    mock_response = {
        "results": [
            {
                "valid_from": "2024-01-01T12:30:00Z",
                "value_inc_vat": 15.5,
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        # 70 days = 3360 half-hour intervals
        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 3, 15, 23, 59, 59)

        await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        # Should request multiple pages for 7 days of data
        urls = mock_instance.fetch_results.call_args[0][0]
        assert len(urls) == 3


@pytest.mark.asyncio
async def test_get_polars_dataframe_selects_correct_columns():
    """Test that only specified columns are selected"""
    mock_response = {
        "results": [
            {
                "valid_from": "2024-01-01T00:00:00Z",
                "value_inc_vat": 15.5,
                "extra_field": "should not be included",
            },
        ]
    }

    with patch("api.processing.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        df = await get_polars_dataframe(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
        )

        # Should only have the two specified columns
        assert set(df.columns) == {Field.VALID_FROM, Field.VALUE}
        assert "extra_field" not in df.columns
