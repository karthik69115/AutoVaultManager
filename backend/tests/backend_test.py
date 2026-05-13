import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://maint-track-7.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@autovault.app"
DEMO_PASSWORD = "demo12345"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    data = r.json()
    assert "user" in data and data["user"]["email"] == DEMO_EMAIL
    assert "token" in data
    assert s.cookies.get("access_token"), "httpOnly cookie not set"
    return s


# ---- Auth ----
class TestAuth:
    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=20)
        assert r.status_code == 401

    def test_me(self, session):
        r = session.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_register_new(self):
        email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"name": "T", "email": email, "password": "secret123"}, timeout=20)
        assert r.status_code == 200, r.text
        assert r.json()["user"]["email"] == email

    def test_register_dup(self):
        r = requests.post(f"{API}/auth/register", json={"name": "X", "email": DEMO_EMAIL, "password": "secret123"}, timeout=20)
        assert r.status_code == 400

    def test_me_unauth(self):
        r = requests.get(f"{API}/auth/me", timeout=20)
        assert r.status_code == 401


# ---- Vehicles ----
class TestVehicles:
    def test_list(self, session):
        r = session.get(f"{API}/vehicles", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 3

    def test_crud(self, session):
        payload = {"brand": "TEST_Brand", "model": "T", "year": 2024, "plate_number": f"TEST-{uuid.uuid4().hex[:4]}", "mileage": 100}
        r = session.post(f"{API}/vehicles", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        v = r.json()
        assert v["brand"] == "TEST_Brand"
        assert "_id" not in v
        vid = v["id"]

        # update
        payload["mileage"] = 500
        r = session.put(f"{API}/vehicles/{vid}", json=payload, timeout=20)
        assert r.status_code == 200 and r.json()["mileage"] == 500

        # delete
        r = session.delete(f"{API}/vehicles/{vid}", timeout=20)
        assert r.status_code == 200


# ---- Maintenance / Fuel / Expenses ----
class TestLogs:
    @pytest.fixture(scope="class")
    def vehicle_id(self, session):
        r = session.get(f"{API}/vehicles", timeout=20)
        return r.json()[0]["id"]

    def _crud(self, session, name, payload):
        r = session.post(f"{API}/{name}", json=payload, timeout=20)
        assert r.status_code == 200, f"{name} POST failed: {r.text}"
        item = r.json()
        iid = item["id"]
        assert "_id" not in item

        r = session.get(f"{API}/{name}?vehicle_id={payload['vehicle_id']}", timeout=20)
        assert r.status_code == 200
        assert any(x["id"] == iid for x in r.json())

        r = session.put(f"{API}/{name}/{iid}", json=payload, timeout=20)
        assert r.status_code == 200

        r = session.delete(f"{API}/{name}/{iid}", timeout=20)
        assert r.status_code == 200

    def test_maintenance(self, session, vehicle_id):
        self._crud(session, "maintenance", {"vehicle_id": vehicle_id, "service_type": "TEST_Service", "cost": 50.0, "date": "2026-01-15", "next_service_date": "2026-02-15", "notes": "TEST"})

    def test_maintenance_bad_vehicle(self, session):
        r = session.post(f"{API}/maintenance", json={"vehicle_id": "nonexistent", "service_type": "X", "cost": 10, "date": "2026-01-15"}, timeout=20)
        assert r.status_code == 400

    def test_fuel(self, session, vehicle_id):
        self._crud(session, "fuel", {"vehicle_id": vehicle_id, "liters": 40, "cost": 65, "mileage": 30000, "date": "2026-01-15"})

    def test_expenses(self, session, vehicle_id):
        self._crud(session, "expenses", {"vehicle_id": vehicle_id, "category": "TEST_Cat", "amount": 99, "date": "2026-01-15", "description": "TEST"})


# ---- Dashboard ----
class TestDashboard:
    def test_stats(self, session):
        r = session.get(f"{API}/dashboard/stats", timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for k in ("total_vehicles", "total_expense", "total_fuel_cost", "total_liters", "upcoming_services", "activity"):
            assert k in d
        assert d["total_vehicles"] >= 3
        assert isinstance(d["upcoming_services"], list)
        assert isinstance(d["activity"], list)


# ---- Logout ----
class TestLogout:
    def test_logout(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=20)
        assert r.status_code == 200
        r = s.post(f"{API}/auth/logout", timeout=20)
        assert r.status_code == 200
