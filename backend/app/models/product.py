from sqlalchemy import String, Float, Numeric, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    uom: Mapped[str] = mapped_column(String(50), nullable=False, default="Units")
    cost: Mapped[float] = mapped_column(Numeric(12, 4), nullable=False, default=0.0)
    on_hand: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    free_to_use: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    min_stock_level: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    reorder_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    category_rel: Mapped["Category | None"] = relationship("Category", back_populates="products")
    stock_moves: Mapped[list["StockMove"]] = relationship(back_populates="product")
