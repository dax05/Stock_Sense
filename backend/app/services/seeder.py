from sqlalchemy.orm import Session
from app.models.warehouse import Location, LocationType


VIRTUAL_LOCATIONS = [
    {"name": "Virtual/Vendor", "short_code": "VIRTUAL/VENDOR", "location_type": LocationType.vendor},
    {"name": "Virtual/Customer", "short_code": "VIRTUAL/CUSTOMER", "location_type": LocationType.customer},
    {"name": "Virtual/Adjustment", "short_code": "VIRTUAL/ADJUSTMENT", "location_type": LocationType.adjustment},
]


def seed_virtual_locations(db: Session) -> None:
    """Creates default virtual locations if they don't already exist."""
    for loc_data in VIRTUAL_LOCATIONS:
        exists = db.query(Location).filter(Location.short_code == loc_data["short_code"]).first()
        if not exists:
            db.add(Location(**loc_data, warehouse_id=None))
    db.commit()
