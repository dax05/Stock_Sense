import enum
from sqlalchemy import String, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class LocationType(str, enum.Enum):
    internal = "Internal"
    view = "View"
    customer = "Customer"
    vendor = "Vendor"
    adjustment = "Adjustment"


class Warehouse(Base):
    __tablename__ = "warehouses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_code: Mapped[str] = mapped_column(String(10), unique=True, nullable=False)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)

    locations: Mapped[list["Location"]] = relationship(back_populates="warehouse")


class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    warehouse_id: Mapped[int | None] = mapped_column(ForeignKey("warehouses.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    short_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    location_type: Mapped[LocationType] = mapped_column(
        SAEnum(LocationType), nullable=False, default=LocationType.internal
    )

    warehouse: Mapped["Warehouse | None"] = relationship(back_populates="locations")
    source_moves: Mapped[list["StockMove"]] = relationship(
        back_populates="source_location", foreign_keys="StockMove.source_location_id"
    )
    dest_moves: Mapped[list["StockMove"]] = relationship(
        back_populates="dest_location", foreign_keys="StockMove.dest_location_id"
    )
