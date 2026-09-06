import pytest
from uuid import uuid4
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.audit_log import AuditLog
from app.core.security import create_access_token, hash_password, verify_password

def test_change_password_success(client, db_session):
    org = Organization(name="Pass Test Org", slug=f"pass-org-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    user = User(
        organization_id=org.id,
        email=f"invited.{uuid4()}@test.com",
        hashed_password=hash_password("HirelyPass2026!"),
        full_name="Invited Member",
        role=UserRole.RECRUITER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(
        subject=str(user.id),
        organization_id=str(org.id),
        role=user.role.value
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "old_password": "HirelyPass2026!",
            "new_password": "NewSecretPass2026!"
        },
        headers=headers
    )

    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"

    # Refresh user from DB and check hashed password
    db_session.refresh(user)
    assert verify_password("NewSecretPass2026!", user.hashed_password)
    assert not verify_password("HirelyPass2026!", user.hashed_password)

    # Check audit log recorded
    log = db_session.query(AuditLog).filter(
        AuditLog.user_id == user.id,
        AuditLog.action == "user.password_changed"
    ).first()
    assert log is not None

def test_change_password_incorrect_old_password(client, db_session):
    org = Organization(name="Pass Test Org 2", slug=f"pass-org2-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    user = User(
        organization_id=org.id,
        email=f"member.{uuid4()}@test.com",
        hashed_password=hash_password("CurrentPass123!"),
        full_name="Team Member",
        role=UserRole.HIRING_MANAGER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()

    token = create_access_token(
        subject=str(user.id),
        organization_id=str(org.id),
        role=user.role.value
    )
    headers = {"Authorization": f"Bearer {token}"}

    response = client.post(
        "/api/v1/auth/change-password",
        json={
            "old_password": "WrongPassword123!",
            "new_password": "NewSecretPass2026!"
        },
        headers=headers
    )

    assert response.status_code == 400
    assert "Current password is incorrect" in response.json()["detail"]
