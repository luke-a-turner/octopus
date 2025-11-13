"""
Tests for data processing module
"""
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

import polars as pl
import pytest

from api.constants import Field
from api.data_service import DataService, DataType


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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        df = await service.get_polars_dataframe()

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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        df = await service.get_polars_dataframe()
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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        # 24 hours = 48 half-hour intervals
        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        await service.get_polars_dataframe()

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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_batch1, mock_batch2])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        df = await service.get_polars_dataframe()

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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.INTERVAL_START,
            Field.CONSUMPTION,
            DataType.CONSUMPTION,
        )
        df = await service.get_polars_dataframe()

        assert isinstance(df, pl.DataFrame)
        assert len(df) == 2
        assert Field.INTERVAL_START in df.columns
        assert Field.CONSUMPTION in df.columns


@pytest.mark.asyncio
async def test_get_polars_dataframe_empty_results():
    """Test handling of empty results"""
    mock_response = {"results": []}

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        df = await service.get_polars_dataframe()

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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        df = await service.get_polars_dataframe()

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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        # 70 days = 3360 half-hour intervals
        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 3, 15, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        await service.get_polars_dataframe()

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

    with patch("api.data_service.RestRequest") as mock_request_class:
        mock_instance = MagicMock()
        mock_instance.fetch_results = AsyncMock(return_value=[mock_response])
        mock_request_class.return_value = mock_instance

        start_datetime = datetime(2024, 1, 1, 0, 0, 0)
        end_datetime = datetime(2024, 1, 1, 23, 59, 59)

        service = DataService(
            "https://test.api/endpoint",
            start_datetime,
            end_datetime,
            Field.VALID_FROM,
            Field.VALUE,
            DataType.TARIFF,
        )
        df = await service.get_polars_dataframe()

        # Should only have the two specified columns
        assert set(df.columns) == {Field.VALID_FROM, Field.VALUE}
        assert "extra_field" not in df.columns


def test_find_missing_intervals_no_missing():
    """Test find_missing_intervals when all intervals are present"""
    start_datetime = datetime(2024, 1, 1, 0, 0, 0)
    end_datetime = datetime(2024, 1, 1, 2, 0, 0)  # 2 hours = 4 intervals

    # Create complete data
    data = [
        {Field.VALID_FROM: start_datetime},
        {Field.VALID_FROM: start_datetime + timedelta(minutes=30)},
        {Field.VALID_FROM: start_datetime + timedelta(minutes=60)},
        {Field.VALID_FROM: start_datetime + timedelta(minutes=90)},
    ]
    df = pl.DataFrame(data)

    service = DataService(
        url="https://test.api/endpoint",
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        date_field=Field.VALID_FROM,
        value_field=Field.VALUE,
        data_type=DataType.TARIFF,
    )
    missing_ranges = service.find_missing_intervals(df)

    assert len(missing_ranges) == 0


def test_find_missing_intervals_all_missing():
    """Test find_missing_intervals when all intervals are missing"""
    start_datetime = datetime(2024, 1, 1, 0, 0, 0)
    end_datetime = datetime(2024, 1, 1, 1, 0, 0)  # 1 hour = 2 intervals

    df = pl.DataFrame()  # Empty dataframe

    service = DataService(
        url="https://test.api/endpoint",
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        date_field=Field.VALID_FROM,
        value_field=Field.VALUE,
        data_type=DataType.TARIFF,
    )
    missing_ranges = service.find_missing_intervals(df)

    assert len(missing_ranges) == 1
    assert missing_ranges[0] == (start_datetime, end_datetime)


def test_find_missing_intervals_consecutive_missing():
    """Test find_missing_intervals with consecutive missing intervals"""
    start_datetime = datetime(2024, 1, 1, 0, 0, 0)
    end_datetime = datetime(2024, 1, 1, 2, 0, 0)  # 2 hours = 4 intervals

    # Missing the middle two intervals
    data = [
        {Field.VALID_FROM: start_datetime},
        {Field.VALID_FROM: start_datetime + timedelta(minutes=90)},
    ]
    df = pl.DataFrame(data)

    service = DataService(
        url="https://test.api/endpoint",
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        date_field=Field.VALID_FROM,
        value_field=Field.VALUE,
        data_type=DataType.TARIFF,
    )
    missing_ranges = service.find_missing_intervals(df)

    assert len(missing_ranges) == 1
    assert missing_ranges[0] == (
        start_datetime + timedelta(minutes=30),
        start_datetime + timedelta(minutes=90),
    )


def test_find_missing_intervals_non_consecutive_missing():
    """Test find_missing_intervals with non-consecutive missing intervals"""
    start_datetime = datetime(2024, 1, 1, 0, 0, 0)
    end_datetime = datetime(2024, 1, 1, 2, 0, 0)  # 2 hours = 4 intervals

    # Missing first and third intervals
    data = [
        {Field.VALID_FROM: start_datetime + timedelta(minutes=30)},
        {Field.VALID_FROM: start_datetime + timedelta(minutes=90)},
    ]
    df = pl.DataFrame(data)

    service = DataService(
        url="https://test.api/endpoint",
        start_datetime=start_datetime,
        end_datetime=end_datetime,
        date_field=Field.VALID_FROM,
        value_field=Field.VALUE,
        data_type=DataType.TARIFF,
    )
    missing_ranges = service.find_missing_intervals(df)

    assert len(missing_ranges) == 2
    assert missing_ranges[0] == (start_datetime, start_datetime + timedelta(minutes=30))
    assert missing_ranges[1] == (
        start_datetime + timedelta(minutes=60),
        start_datetime + timedelta(minutes=90),
    )


@pytest.mark.asyncio
async def test_get_polars_dataframe_with_missing_intervals():
    """Test that missing intervals are fetched from API and combined with DB data"""
    start_datetime = datetime(2024, 1, 1, 0, 0, 0)
    end_datetime = datetime(2024, 1, 1, 1, 0, 0)  # 1 hour = 2 intervals

    # Mock database data with only first interval
    db_data = pl.DataFrame(
        [
            {
                Field.VALID_FROM: start_datetime,
                Field.VALUE: 15.5,
            }
        ]
    )

    # Mock API data for missing interval
    api_response = {
        "results": [
            {
                "valid_from": "2024-01-01T00:30:00Z",
                "value_inc_vat": 16.2,
            },
        ]
    }

    with patch("api.data_service.get_tariff_data_from_db", new=AsyncMock(return_value=db_data)):
        with patch("api.data_service.insert_tariff_data_to_db", new=AsyncMock(return_value=True)):
            with patch("api.data_service.RestRequest") as mock_request_class:
                mock_instance = MagicMock()
                mock_instance.fetch_results = AsyncMock(return_value=[api_response])
                mock_request_class.return_value = mock_instance

                service = DataService(
                    "https://test.api/endpoint",
                    start_datetime,
                    end_datetime,
                    Field.VALID_FROM,
                    Field.VALUE,
                    DataType.TARIFF,
                )
                df = await service.get_polars_dataframe()

                # Should have both intervals from DB and API
                assert len(df) == 2
                assert Field.VALID_FROM in df.columns
                assert Field.VALUE in df.columns

                # Verify data is sorted
                dates = df[Field.VALID_FROM].to_list()
                assert dates == sorted(dates)


@pytest.mark.asyncio
async def test_get_polars_dataframe_no_missing_intervals():
    """Test that no API call is made when all intervals are present in DB"""
    start_datetime = datetime(2024, 1, 1, 0, 0, 0)
    end_datetime = datetime(2024, 1, 1, 1, 0, 0)  # 1 hour = 2 intervals

    # Mock complete database data
    db_data = pl.DataFrame(
        [
            {Field.VALID_FROM: start_datetime, Field.VALUE: 15.5},
            {Field.VALID_FROM: start_datetime + timedelta(minutes=30), Field.VALUE: 16.2},
        ]
    )

    with patch("api.data_service.get_tariff_data_from_db", new=AsyncMock(return_value=db_data)):
        with patch("api.data_service.RestRequest") as mock_request_class:
            mock_instance = MagicMock()
            mock_request_class.return_value = mock_instance

            service = DataService(
                "https://test.api/endpoint",
                start_datetime,
                end_datetime,
                Field.VALID_FROM,
                Field.VALUE,
                DataType.TARIFF,
            )
            df = await service.get_polars_dataframe()

            # Should return database data without calling API
            assert len(df) == 2
            mock_instance.fetch_results.assert_not_called()
