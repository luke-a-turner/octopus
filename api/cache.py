"""
Cache utilities for FastAPI endpoints
"""
import hashlib
import json
import logging
from collections.abc import Callable
from functools import wraps
from typing import Any

from cachetools import TTLCache

logger = logging.getLogger(__name__)

# Create a TTL cache with 1 hour expiry (3600 seconds)
# maxsize=100 means it can store up to 100 different cache entries
cache = TTLCache(maxsize=100, ttl=3600)  # 1 hour TTL


def create_cache_key(*args, **kwargs) -> str:
    """
    Create a unique cache key from function arguments
    """
    # Combine all arguments into a string
    key_data = {
        "args": [str(arg) for arg in args],
        "kwargs": {k: str(v) for k, v in sorted(kwargs.items())},
    }
    key_string = json.dumps(key_data, sort_keys=True)
    # Create a hash for shorter keys
    return hashlib.md5(key_string.encode()).hexdigest()


def async_cache(func: Callable) -> Callable:
    """
    Decorator to cache async function results with 1 hour TTL

    Usage:
        @async_cache
        async def my_function(param1, param2):
            return await expensive_operation()
    """

    @wraps(func)
    async def wrapper(*args, **kwargs):
        # Create cache key from function name and arguments
        cache_key = f"{func.__name__}:{create_cache_key(*args, **kwargs)}"

        # Check if result is in cache
        if cache_key in cache:
            logger.info(f"Cache HIT for {func.__name__}")
            return cache[cache_key]

        # If not in cache, call the function
        logger.info(f"Cache MISS for {func.__name__} - fetching fresh data")
        result = await func(*args, **kwargs)

        # Store result in cache
        cache[cache_key] = result
        logger.info(f"Cached result for {func.__name__} (expires in 1 hour)")

        return result

    return wrapper


def clear_cache():
    """
    Clear all cached entries
    """
    cache.clear()
    logger.info("Cache cleared")


def get_cache_info() -> dict[str, Any]:
    """
    Get information about the current cache state
    """
    return {
        "size": len(cache),
        "maxsize": cache.maxsize,
        "ttl": cache.ttl,
        "keys": list(cache.keys()),
    }
