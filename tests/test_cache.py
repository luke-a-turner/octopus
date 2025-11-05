"""
Tests for cache functionality
"""
import asyncio

import pytest

from api.cache import async_cache, clear_cache, create_cache_key, get_cache_info


def test_create_cache_key():
    """Test cache key generation"""
    # Same arguments should produce same key
    key1 = create_cache_key("arg1", "arg2", kwarg1="value1")
    key2 = create_cache_key("arg1", "arg2", kwarg1="value1")
    assert key1 == key2

    # Different arguments should produce different keys
    key3 = create_cache_key("arg1", "arg2", kwarg1="different")
    assert key1 != key3

    # Order of kwargs shouldn't matter
    key4 = create_cache_key("arg1", "arg2", kwarg1="value1", kwarg2="value2")
    key5 = create_cache_key("arg1", "arg2", kwarg2="value2", kwarg1="value1")
    assert key4 == key5


@pytest.mark.asyncio
async def test_async_cache_basic():
    """Test basic cache functionality"""
    call_count = 0

    @async_cache
    async def test_function(x):
        nonlocal call_count
        call_count += 1
        await asyncio.sleep(0.01)  # Simulate async work
        return x * 2

    # First call should execute the function
    result1 = await test_function(5)
    assert result1 == 10
    assert call_count == 1

    # Second call should return cached result
    result2 = await test_function(5)
    assert result2 == 10
    assert call_count == 1  # Function not called again

    # Different argument should execute the function
    result3 = await test_function(10)
    assert result3 == 20
    assert call_count == 2


@pytest.mark.asyncio
async def test_async_cache_with_multiple_args():
    """Test cache with multiple arguments"""

    @async_cache
    async def add_numbers(a, b, c=0):
        await asyncio.sleep(0.01)
        return a + b + c

    result1 = await add_numbers(1, 2, c=3)
    assert result1 == 6

    # Same args should use cache
    result2 = await add_numbers(1, 2, c=3)
    assert result2 == 6

    # Different args should not use cache
    result3 = await add_numbers(1, 2, c=4)
    assert result3 == 7


def test_clear_cache():
    """Test cache clearing"""
    clear_cache()
    info = get_cache_info()
    assert info["size"] == 0


def test_get_cache_info():
    """Test cache info retrieval"""
    clear_cache()
    info = get_cache_info()

    assert "size" in info
    assert "maxsize" in info
    assert "ttl" in info
    assert "keys" in info

    assert info["maxsize"] == 100
    assert info["ttl"] == 3600
    assert info["size"] == 0
    assert isinstance(info["keys"], list)


@pytest.mark.asyncio
async def test_cache_info_after_caching():
    """Test cache info after adding cached items"""
    clear_cache()

    @async_cache
    async def cached_func(x):
        return x * 2

    # Add some cached items
    await cached_func(1)
    await cached_func(2)
    await cached_func(3)

    info = get_cache_info()
    assert info["size"] == 3
    assert len(info["keys"]) == 3
