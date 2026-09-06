import logging
from typing import Optional, Dict
from uuid import UUID
from sqlalchemy.orm import Session
from app.models.audit_log import AuditLog

logger = logging.getLogger(__name__)

class AuditLogger:
    @staticmethod
    def log(
        db: Session,
        organization_id: UUID,
        user_id: Optional[UUID],
        action: str,
        entity_type: Optional[str] = None,
        entity_id: Optional[str] = None,
        details: Optional[Dict] = None
    ) -> AuditLog:
        """
        Atomically records an audit trail entry scoped by organization_id.
        """
        try:
            audit_log = AuditLog(
                organization_id=organization_id,
                user_id=user_id,
                action=action,
                entity_type=entity_type,
                entity_id=str(entity_id) if entity_id else None,
                details=details or {}
            )
            db.add(audit_log)
            db.commit()
            db.refresh(audit_log)
            return audit_log
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            db.rollback()
            raise e
