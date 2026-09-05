import pytest
import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base_class import Base
from app.models.organization import Organization
from app.models.user import User, UserRole
from app.models.candidate import Candidate
from app.core.security import hash_password

# Use SQLite in-memory for lightning fast test execution
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

@pytest.fixture(scope="function")
def db_session():
    engine = create_engine(SQLALCHEMY_TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def org_a(db_session):
    org = Organization(id=uuid.uuid4(), name="Organization A", slug="org-a")
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    return org

@pytest.fixture
def org_b(db_session):
    org = Organization(id=uuid.uuid4(), name="Organization B", slug="org-b")
    db_session.add(org)
    db_session.commit()
    db_session.refresh(org)
    return org

@pytest.fixture
def user_org_a_admin(db_session, org_a):
    user = User(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        email="admin@orga.com",
        hashed_password=hash_password("Password123!"),
        full_name="Org A Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def user_org_a_manager(db_session, org_a):
    user = User(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        email="manager@orga.com",
        hashed_password=hash_password("Password123!"),
        full_name="Org A Hiring Manager",
        role=UserRole.HIRING_MANAGER,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def user_org_b_admin(db_session, org_b):
    user = User(
        id=uuid.uuid4(),
        organization_id=org_b.id,
        email="admin@orgb.com",
        hashed_password=hash_password("Password123!"),
        full_name="Org B Admin",
        role=UserRole.ADMIN,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture
def candidate_org_a(db_session, org_a):
    candidate = Candidate(
        id=uuid.uuid4(),
        organization_id=org_a.id,
        email="john.doe@gmail.com",
        first_name="John",
        last_name="Doe",
        phone="+1234567890"
    )
    db_session.add(candidate)
    db_session.commit()
    db_session.refresh(candidate)
    return candidate
