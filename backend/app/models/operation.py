import enum
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, Enum as SAEnum, DateTime, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class OperationType(str, enum.Enum):
    IN = "IN"
    OUT = "OUT"
    INT = "INT"
    ADJ = "ADJ"


class OperationStatus(str, enum.Enum):
    draft = "Draft"
    waiting = "Waiting"
    ready = "Ready"
    done = "Done"
    canceled = "Canceled"


class Operation(Base):
    __tablename__ = "operations"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    reference: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    type: Mapped[OperationType] = mapped_column(SAEnum(OperationType), nullable=False)
    status: Mapped[OperationStatus] = mapped_column(
        SAEnum(OperationStatus), nullable=False, default=OperationStatus.draft
    )
    partner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    scheduled_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    responsible_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    responsible: Mapped["User"] = relationship(back_populates="operations")
    stock_moves: Mapped[list["StockMove"]] = relationship(back_populates="operation", cascade="all, delete-orphan")


class StockMove(Base):
    __tablename__ = "stock_moves"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    operation_id: Mapped[int] = mapped_column(ForeignKey("operations.id"), nullable=False)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), nullable=False)
    qty: Mapped[float] = mapped_column(Float, nullable=False)
    source_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    dest_location_id: Mapped[int] = mapped_column(ForeignKey("locations.id"), nullable=False)
    status: Mapped[OperationStatus] = mapped_column(
        SAEnum(OperationStatus), nullable=False, default=OperationStatus.draft
    )

    operation: Mapped["Operation"] = relationship(back_populates="stock_moves")
    product: Mapped["Product"] = relationship(back_populates="stock_moves")
    source_location: Mapped["Location"] = relationship(
        back_populates="source_moves", foreign_keys=[source_location_id]
    )
    dest_location: Mapped["Location"] = relationship(
        back_populates="dest_moves", foreign_keys=[dest_location_id]
    )
