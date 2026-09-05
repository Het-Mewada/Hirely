import pytest
from fastapi import HTTPException, status
from app.repositories.base import TenantRepository
from app.models.candidate import Candidate
from app.models.user import UserRole
from app.api.deps import require_role

def test_org_a_cannot_see_org_b_data(db_session, org_a, org_b, candidate_org_a):
    """
    PROOFS OF MULTI-TENANT ISOLATION:
    Candidate belongs to Org A.
    Querying via TenantRepository(Org B) MUST return 0 candidates.
    """
    repo_a = TenantRepository(Candidate, db_session, org_a.id)
    repo_b = TenantRepository(Candidate, db_session, org_b.id)

    candidates_a = repo_a.list()
    candidates_b = repo_b.list()

    assert len(candidates_a) == 1
    assert candidates_a[0].id == candidate_org_a.id
    assert candidates_a[0].organization_id == org_a.id

    # Org B repository receives ZERO records
    assert len(candidates_b) == 0

def test_org_b_get_org_a_candidate_returns_none(db_session, org_a, org_b, candidate_org_a):
    """
    PROOFS OF MULTI-TENANT ISOLATION:
    Even if Org B knows Candidate A's exact UUID,
    TenantRepository(Org B).get(candidate_a_id) MUST return None.
    """
    repo_b = TenantRepository(Candidate, db_session, org_b.id)
    retrieved_candidate = repo_b.get(candidate_org_a.id)
    
    assert retrieved_candidate is None

def test_tenant_repository_create_auto_injects_organization_id(db_session, org_a):
    """
    VERIFIES AUTOMATIC TENANT INJECTION:
    Creating a record auto-assigns caller's organization_id.
    """
    repo_a = TenantRepository(Candidate, db_session, org_a.id)
    new_candidate = repo_a.create({
        "email": "jane.smith@orga.com",
        "first_name": "Jane",
        "last_name": "Smith",
        "phone": "+1987654321"
    })

    assert new_candidate.id is not None
    assert new_candidate.organization_id == org_a.id
    assert new_candidate.email == "jane.smith@orga.com"

def test_rbac_require_role_guard(user_org_a_admin, user_org_a_manager):
    """
    VERIFIES ROLE-BASED ACCESS CONTROL (RBAC):
    - Admin user calling require_role(ADMIN) passes cleanly.
    - Hiring Manager calling require_role(ADMIN) raises HTTP 403 Forbidden.
    """
    admin_checker = require_role(UserRole.ADMIN)
    
    # 1. Admin user passes check
    authorized_user = admin_checker(current_user=user_org_a_admin)
    assert authorized_user.id == user_org_a_admin.id

    # 2. Manager user is denied with HTTP 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        admin_checker(current_user=user_org_a_manager)
        
    assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
    assert "Required role" in exc_info.value.detail
