import pytest
from uuid import uuid4
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.models.job_posting import JobPosting
from app.models.audit_log import AuditLog
from app.core.security import create_access_token, hash_password

def test_audit_logs_get_admin_only(client, db_session):
    org = Organization(name="Audit Test Org", slug=f"audit-org-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@audit.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Audit Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    recruiter = User(
        organization_id=org.id,
        email=f"recruiter.{uuid4()}@audit.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Audit Recruiter",
        role=UserRole.RECRUITER,
        is_active=True
    )
    db_session.add_all([admin, recruiter])
    db_session.commit()

    # Add a sample audit log
    log = AuditLog(
        organization_id=org.id,
        user_id=admin.id,
        action="job.created",
        entity_type="JobPosting",
        entity_id=str(uuid4()),
        details={"title": "Audit Test Job"}
    )
    db_session.add(log)
    db_session.commit()

    admin_token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    recruiter_token = create_access_token(str(recruiter.id), str(org.id), recruiter.role.value)

    # Admin should succeed (200)
    res_admin = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert res_admin.status_code == 200
    logs = res_admin.json()
    assert len(logs) >= 1
    assert logs[0]["action"] == "job.created"

    # Recruiter should be forbidden (403)
    res_rec = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {recruiter_token}"})
    assert res_rec.status_code == 403

def test_user_invite_and_role_change_audit(client, db_session):
    org = Organization(name="User Audit Org", slug=f"user-audit-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@useraudit.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    admin_token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Invite User (logs user.invited)
    invite_res = client.post("/api/v1/users/invite", json={
        "email": f"invited.{uuid4()}@test.com",
        "full_name": "Invited Developer",
        "role": "recruiter"
    }, headers=headers)
    assert invite_res.status_code == 201
    invited_data = invite_res.json()
    invited_id = invited_data["id"]

    # 2. Change Role (logs user.role_changed)
    role_res = client.patch(f"/api/v1/users/{invited_id}/role", json={"role": "hiring_manager"}, headers=headers)
    assert role_res.status_code == 200
    assert role_res.json()["role"] == "hiring_manager"

    # 3. Check audit logs
    audit_res = client.get("/api/v1/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    actions = [l["action"] for l in logs]
    assert "user.invited" in actions
    assert "user.role_changed" in actions

def test_job_audit_logging(client, db_session):
    org = Organization(name="Job Audit Org", slug=f"job-audit-{uuid4()}")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"jobadmin.{uuid4()}@jobaudit.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Job Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    admin_token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    headers = {"Authorization": f"Bearer {admin_token}"}

    # Create job (logs job.created)
    c_res = client.post("/api/v1/jobs", json={
        "title": "Audit Backend Engineer",
        "description": "Python, FastAPI",
        "required_skills": ["Python"]
    }, headers=headers)
    assert c_res.status_code == 201
    job_id = c_res.json()["id"]

    # Edit job (logs job.updated)
    u_res = client.patch(f"/api/v1/jobs/{job_id}", json={"location": "Remote"}, headers=headers)
    assert u_res.status_code == 200

    # Delete job (logs job.deleted)
    d_res = client.delete(f"/api/v1/jobs/{job_id}", headers=headers)
    assert d_res.status_code == 204

    # Verify audit logs
    audit_res = client.get("/api/v1/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    actions = [l["action"] for l in audit_res.json()]
    assert "job.created" in actions
    assert "job.updated" in actions
    assert "job.deleted" in actions
