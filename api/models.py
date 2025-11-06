"""
SQLAlchemy models for database tables.
Defines ORM models for tariff and consumption data.
"""

from datetime import datetime

from sqlalchemy import DateTime, Index, Integer, Numeric, String
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models"""
    pass


class Tariff(Base):
    """
    Tariff table model.
    Stores electricity tariff pricing data with composite unique constraint.
    """
    __tablename__ = "tariff"

    tariff_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product: Mapped[str] = mapped_column(String(50), nullable=False)
    tariff: Mapped[str] = mapped_column(String(50), nullable=False)
    valid_from: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    value_inc_vat: Mapped[float] = mapped_column(Numeric, nullable=False)

    __table_args__ = (
        Index(
            "idx_tariff_unique",
            "product",
            "tariff",
            "valid_from",
            unique=True
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Tariff(product={self.product}, tariff={self.tariff}, "
            f"valid_from={self.valid_from}, value_inc_vat={self.value_inc_vat})>"
        )


class Consumption(Base):
    """
    Consumption table model.
    Stores smart meter electricity consumption data with composite unique constraint.
    """
    __tablename__ = "consumption"

    consumption_id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    mpan: Mapped[str] = mapped_column(String(25), nullable=False)
    serial_number: Mapped[str] = mapped_column(String(25), nullable=False)
    interval_start: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    consumption: Mapped[float] = mapped_column(Numeric, nullable=False)

    __table_args__ = (
        Index(
            "idx_consumption_unique",
            "mpan",
            "serial_number",
            "interval_start",
            unique=True
        ),
    )

    def __repr__(self) -> str:
        return (
            f"<Consumption(mpan={self.mpan}, serial_number={self.serial_number}, "
            f"interval_start={self.interval_start}, consumption={self.consumption})>"
        )
