from typing import TypeVar, Generic, Type, Optional, List, Any, Dict
from uuid import UUID
from sqlalchemy.orm import Session, Query
from app.db.base_class import Base

T = TypeVar("T", bound=Base)

class TenantRepository(Generic[T]):
    """
    Multi-tenant Base Repository.
    Guarantees that ALL database operations are automatically scoped to the caller's organization_id.
    This enforces database-level tenant isolation, preventing cross-tenant data leaks regardless of API input.
    """
    def __init__(self, model: Type[T], db: Session, organization_id: UUID):
        self.model = model
        self.db = db
        self.organization_id = organization_id

    def _base_query(self) -> Query:
        """
        Backbone of multi-tenant security:
        Always injects WHERE organization_id = self.organization_id into every SQL query.
        """
        if not hasattr(self.model, "organization_id"):
            raise AttributeError(f"Model {self.model.__name__} does not have an organization_id column.")
        return self.db.query(self.model).filter(self.model.organization_id == self.organization_id)

    def get(self, id: UUID) -> Optional[T]:
        """
        Get single record by ID, strictly scoped to caller's organization.
        Returns None if ID exists in database under a different organization.
        """
        return self._base_query().filter(self.model.id == id).first()

    def list(self, skip: int = 0, limit: int = 100) -> List[T]:
        """
        List all records for caller's organization with pagination.
        """
        return self._base_query().offset(skip).limit(limit).all()

    def filter_by(self, **kwargs) -> List[T]:
        """
        Filter records by keyword arguments, strictly scoped to caller's organization.
        """
        return self._base_query().filter_by(**kwargs).all()

    def create(self, obj_in: Dict[str, Any]) -> T:
        """
        Create new record, auto-injecting caller's organization_id.
        """
        obj_data = obj_in.copy()
        obj_data["organization_id"] = self.organization_id
        db_obj = self.model(**obj_data)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, id: UUID, obj_in: Dict[str, Any]) -> Optional[T]:
        """
        Update record by ID, ensuring it belongs to caller's organization.
        """
        db_obj = self.get(id)
        if not db_obj:
            return None
        
        # Prevent overriding organization_id or id
        for field, value in obj_in.items():
            if field not in ("id", "organization_id") and hasattr(db_obj, field):
                setattr(db_obj, field, value)
                
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, id: UUID) -> bool:
        """
        Delete record by ID, ensuring it belongs to caller's organization.
        """
        db_obj = self.get(id)
        if not db_obj:
            return False
        self.db.delete(db_obj)
        self.db.commit()
        return True
