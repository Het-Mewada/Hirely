import pytest
from uuid import uuid4
from app.models import Organization, User, UserRole, Candidate, JobPosting, JobStatus, Application
from app.core.security import create_access_token, hash_password

def test_get_organization_plan(client, db_session):
    org = Organization(name="Plan Test Org", slug=f"plan-org-{uuid4()}", plan="free")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@plantest.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Plan Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    res = client.get("/api/v1/organizations/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["plan"] == "free"

def test_admin_upgrade_and_downgrade_plan(client, db_session):
    org = Organization(name="Upgrade Org", slug=f"upgrade-org-{uuid4()}", plan="free")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@upgrade.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Upgrade Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    recruiter = User(
        organization_id=org.id,
        email=f"recruiter.{uuid4()}@upgrade.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Upgrade Recruiter",
        role=UserRole.RECRUITER,
        is_active=True
    )
    db_session.add_all([admin, recruiter])
    db_session.commit()

    admin_token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    recruiter_token = create_access_token(str(recruiter.id), str(org.id), recruiter.role.value)

    # Recruiter should be forbidden from upgrading plan (403)
    rec_res = client.patch("/api/v1/organizations/me/plan", json={"plan": "pro"}, headers={"Authorization": f"Bearer {recruiter_token}"})
    assert rec_res.status_code == 403

    # Admin upgrades plan to pro (200)
    up_res = client.patch("/api/v1/organizations/me/plan", json={"plan": "pro"}, headers={"Authorization": f"Bearer {admin_token}"})
    assert up_res.status_code == 200
    assert up_res.json()["plan"] == "pro"

    # Verify audit log recorded organization.plan_updated
    audit_res = client.get("/api/v1/audit-logs", headers={"Authorization": f"Bearer {admin_token}"})
    assert audit_res.status_code == 200
    actions = [l["action"] for l in audit_res.json()]
    assert "organization.plan_updated" in actions

def test_job_posting_limit_free_plan(client, db_session):
    org = Organization(name="Limit Org", slug=f"limit-org-{uuid4()}", plan="free")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@limit.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Limit Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Job 1 (Published) -> 201
    res1 = client.post("/api/v1/jobs", json={"title": "Job 1", "description": "Desc", "status": "published"}, headers=headers)
    assert res1.status_code == 201

    # Job 2 (Published) -> 201
    res2 = client.post("/api/v1/jobs", json={"title": "Job 2", "description": "Desc", "status": "published"}, headers=headers)
    assert res2.status_code == 201

    # Job 3 (Published) -> 403 Forbidden (Free tier limit reached)
    res3 = client.post("/api/v1/jobs", json={"title": "Job 3", "description": "Desc", "status": "published"}, headers=headers)
    assert res3.status_code == 403
    assert "Your plan allows 2 active postings — you currently have 2" in res3.json()["detail"]

    # Upgrade to Pro
    upgrade_res = client.patch("/api/v1/organizations/me/plan", json={"plan": "pro"}, headers=headers)
    assert upgrade_res.status_code == 200

    # Job 3 (Published on Pro tier) -> 201 Created
    res3_pro = client.post("/api/v1/jobs", json={"title": "Job 3", "description": "Desc", "status": "published"}, headers=headers)
    assert res3_pro.status_code == 201

def test_soft_lock_on_downgrade(client, db_session):
    # 1. Pro tenant creates 5 active job postings
    org = Organization(id=uuid4(), name="Soft Lock Org", slug=f"soft-lock-{uuid4()}", plan="free")
    db_session.add(org)
    db_session.commit()

    admin = User(
        id=uuid4(),
        organization_id=org.id,
        email=f"admin.{uuid4()}@softlock.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Soft Lock Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Set plan to pro via endpoint so DB is updated
    patch_res = client.patch("/api/v1/organizations/me/plan", json={"plan": "pro"}, headers=headers)
    assert patch_res.status_code == 200

    job_ids = []
    for i in range(1, 6):
        r = client.post("/api/v1/jobs", json={"title": f"Pro Job {i}", "description": "Desc", "status": "published"}, headers=headers)
        assert r.status_code == 201
        job_ids.append(r.json()["id"])

    # 2. Downgrade to Free plan
    down_res = client.patch("/api/v1/organizations/me/plan", json={"plan": "free"}, headers=headers)
    assert down_res.status_code == 200
    assert down_res.json()["plan"] == "free"

    # 3. Soft Lock: All 5 existing jobs remain published and visible
    list_res = client.get("/api/v1/jobs", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) == 5
    for j in list_res.json():
        assert j["status"] == "published"

    # 4. Attempt to create 6th active job -> Blocked with 403 & soft lock audit log
    blocked_create = client.post("/api/v1/jobs", json={"title": "Job 6", "description": "Desc", "status": "published"}, headers=headers)
    assert blocked_create.status_code == 403
    assert "Your plan allows 2 active postings — you currently have 5" in blocked_create.json()["detail"]

    # Check Audit log for 'plan downgraded' and 'job posting blocked — limit exceeded'
    audit_res = client.get("/api/v1/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    actions = [l["action"] for l in audit_res.json()]
    assert "plan downgraded" in actions
    assert "job posting blocked — limit exceeded" in actions

    # 5. Archive 4 jobs (set status to 'closed') so 1 active job remains
    for j_id in job_ids[:4]:
        patch_res = client.patch(f"/api/v1/jobs/{j_id}", json={"status": "closed"}, headers=headers)
        assert patch_res.status_code == 200

    # 6. Now 1 active job remains -> Unblocked automatically for creating 2nd active job!
    unblocked_create = client.post("/api/v1/jobs", json={"title": "Job 6", "description": "Desc", "status": "published"}, headers=headers)
    assert unblocked_create.status_code == 201

def test_ai_scoring_gated_by_plan(client, db_session):
    org = Organization(name="Score Gate Org", slug=f"score-gate-{uuid4()}", plan="free")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@scoregate.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Score Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    job = JobPosting(
        id=uuid4(),
        organization_id=org.id,
        title="Gate Job",
        description="Python backend",
        status=JobStatus.PUBLISHED
    )
    candidate = Candidate(
        id=uuid4(),
        organization_id=org.id,
        first_name="Jane",
        last_name="Doe",
        email="jane.doe@gate.com"
    )
    db_session.add_all([admin, job, candidate])
    db_session.commit()

    application = Application(
        id=uuid4(),
        organization_id=org.id,
        job_posting_id=job.id,
        candidate_id=candidate.id,
        stage="APPLIED"
    )
    db_session.add(application)
    db_session.commit()

    token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # Attempt score on Free tier -> 403 Forbidden
    score_res = client.post(f"/api/v1/applications/{application.id}/score", headers=headers)
    assert score_res.status_code == 403
    assert "AI Resume Scoring is a Pro feature" in score_res.json()["detail"]

    # Upgrade to Pro
    client.patch("/api/v1/organizations/me/plan", json={"plan": "pro"}, headers=headers)

    # Attempt score on Pro tier -> 200 OK
    score_res_pro = client.post(f"/api/v1/applications/{application.id}/score", headers=headers)
    assert score_res_pro.status_code == 200
    assert score_res_pro.json()["match_score"] is not None

def test_payment_checkout_flow(client, db_session):
    org = Organization(name="Checkout Org", slug=f"checkout-org-{uuid4()}", plan="free")
    db_session.add(org)
    db_session.commit()

    admin = User(
        organization_id=org.id,
        email=f"admin.{uuid4()}@checkout.com",
        hashed_password=hash_password("Pass123!"),
        full_name="Checkout Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(admin)
    db_session.commit()

    token = create_access_token(str(admin.id), str(org.id), admin.role.value)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Failed payment with invalid card
    fail_res = client.post("/api/v1/organizations/checkout", json={
        "plan_tier": "pro",
        "billing_cycle": "annual",
        "card_number": "123",
        "card_exp": "12/28",
        "card_cvc": "999",
        "cardholder_name": "Test User"
    }, headers=headers)
    assert fail_res.status_code == 400
    assert "Invalid credit card" in fail_res.json()["detail"]

    # 2. Successful Annual Checkout
    success_res = client.post("/api/v1/organizations/checkout", json={
        "plan_tier": "pro",
        "billing_cycle": "annual",
        "card_number": "4242-4242-4242-4242",
        "card_exp": "12/28",
        "card_cvc": "123",
        "cardholder_name": "Pro Subscriber Admin"
    }, headers=headers)
    assert success_res.status_code == 200
    data = success_res.json()
    assert data["status"] == "success"
    assert data["organization"]["plan"] == "pro"
    assert data["organization"]["billing_cycle"] == "annual"
    assert data["organization"]["plan_expires_at"] is not None
    assert "receipt" in data
    assert data["receipt"]["amount_paid"] == "$468.00 USD"

    # 3. Verify audit log registered subscription.upgraded
    audit_res = client.get("/api/v1/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    actions = [l["action"] for l in audit_res.json()]
    assert "subscription.upgraded" in actions
