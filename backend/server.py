from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, Depends, HTTPException, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("autovault")

JWT_ALGORITHM = "HS256"
ACCESS_TTL_MIN = 60 * 24 * 7  # 7 days for convenience

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="AutoVault API")
api = APIRouter(prefix="/api")

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=ACCESS_TTL_MIN * 60,
        path="/",
    )

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "User not found")
    return user

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class RegisterIn(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=6)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class VehicleIn(BaseModel):
    brand: str
    model: str
    year: int
    plate_number: str
    mileage: int = 0
    image_url: Optional[str] = None
    color: Optional[str] = None
    fuel_type: Optional[str] = "Petrol"
    insurance_expiry: Optional[str] = None  # ISO date string

class MaintenanceIn(BaseModel):
    vehicle_id: str
    service_type: str
    cost: float
    date: str  # ISO date
    next_service_date: Optional[str] = None
    notes: Optional[str] = None

class FuelIn(BaseModel):
    vehicle_id: str
    liters: float
    cost: float
    mileage: int
    date: str

class ExpenseIn(BaseModel):
    vehicle_id: str
    category: str
    amount: float
    date: str
    description: Optional[str] = None

# ---------------------------------------------------------------------------
# Auth routes
# ---------------------------------------------------------------------------

def _user_public(u: dict) -> dict:
    return {"id": u["id"], "email": u["email"], "name": u.get("name", ""), "role": u.get("role", "user")}

@api.post("/auth/register")
async def register(body: RegisterIn, response: Response):
    email = body.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(400, "Email already registered")
    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"user": _user_public(user), "token": token}

@api.post("/auth/login")
async def login(body: LoginIn, response: Response):
    email = body.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token(user["id"], email)
    set_auth_cookie(response, token)
    return {"user": _user_public(user), "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return _user_public(user)

# ---------------------------------------------------------------------------
# Vehicles
# ---------------------------------------------------------------------------

@api.get("/vehicles")
async def list_vehicles(user=Depends(get_current_user)):
    items = await db.vehicles.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    return items

@api.post("/vehicles")
async def create_vehicle(body: VehicleIn, user=Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["user_id"] = user["id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.vehicles.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.put("/vehicles/{vid}")
async def update_vehicle(vid: str, body: VehicleIn, user=Depends(get_current_user)):
    res = await db.vehicles.update_one(
        {"id": vid, "user_id": user["id"]}, {"$set": body.model_dump()}
    )
    if res.matched_count == 0:
        raise HTTPException(404, "Vehicle not found")
    item = await db.vehicles.find_one({"id": vid}, {"_id": 0})
    return item

@api.delete("/vehicles/{vid}")
async def delete_vehicle(vid: str, user=Depends(get_current_user)):
    res = await db.vehicles.delete_one({"id": vid, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(404, "Vehicle not found")
    # cascade
    await db.maintenance_logs.delete_many({"vehicle_id": vid, "user_id": user["id"]})
    await db.fuel_logs.delete_many({"vehicle_id": vid, "user_id": user["id"]})
    await db.expenses.delete_many({"vehicle_id": vid, "user_id": user["id"]})
    return {"ok": True}

# ---------------------------------------------------------------------------
# Generic CRUD for maintenance/fuel/expenses
# ---------------------------------------------------------------------------

def _crud_routes(name: str, collection, model):
    @api.get(f"/{name}")
    async def list_items(vehicle_id: Optional[str] = None, user=Depends(get_current_user)):
        q = {"user_id": user["id"]}
        if vehicle_id:
            q["vehicle_id"] = vehicle_id
        items = await collection.find(q, {"_id": 0}).sort("date", -1).to_list(1000)
        return items

    @api.post(f"/{name}")
    async def create_item(body: model, user=Depends(get_current_user)):  # type: ignore
        # verify vehicle ownership
        v = await db.vehicles.find_one({"id": body.vehicle_id, "user_id": user["id"]})
        if not v:
            raise HTTPException(400, "Vehicle not found")
        doc = body.model_dump()
        doc["id"] = str(uuid.uuid4())
        doc["user_id"] = user["id"]
        doc["created_at"] = datetime.now(timezone.utc).isoformat()
        await collection.insert_one(doc)
        doc.pop("_id", None)
        return doc

    @api.put(f"/{name}/{{item_id}}")
    async def update_item(item_id: str, body: model, user=Depends(get_current_user)):  # type: ignore
        res = await collection.update_one(
            {"id": item_id, "user_id": user["id"]}, {"$set": body.model_dump()}
        )
        if res.matched_count == 0:
            raise HTTPException(404, "Not found")
        return await collection.find_one({"id": item_id}, {"_id": 0})

    @api.delete(f"/{name}/{{item_id}}")
    async def delete_item(item_id: str, user=Depends(get_current_user)):
        res = await collection.delete_one({"id": item_id, "user_id": user["id"]})
        if res.deleted_count == 0:
            raise HTTPException(404, "Not found")
        return {"ok": True}

    list_items.__name__ = f"list_{name}"
    create_item.__name__ = f"create_{name}"
    update_item.__name__ = f"update_{name}"
    delete_item.__name__ = f"delete_{name}"

_crud_routes("maintenance", db.maintenance_logs, MaintenanceIn)
_crud_routes("fuel", db.fuel_logs, FuelIn)
_crud_routes("expenses", db.expenses, ExpenseIn)

# ---------------------------------------------------------------------------
# Dashboard & reminders
# ---------------------------------------------------------------------------

@api.get("/dashboard/stats")
async def dashboard_stats(user=Depends(get_current_user)):
    uid = user["id"]
    vehicles = await db.vehicles.find({"user_id": uid}, {"_id": 0}).to_list(500)
    expenses = await db.expenses.find({"user_id": uid}, {"_id": 0}).to_list(2000)
    fuel = await db.fuel_logs.find({"user_id": uid}, {"_id": 0}).to_list(2000)
    maint = await db.maintenance_logs.find({"user_id": uid}, {"_id": 0}).to_list(2000)

    total_expense = sum(e["amount"] for e in expenses) + sum(m["cost"] for m in maint) + sum(f["cost"] for f in fuel)
    total_fuel_cost = sum(f["cost"] for f in fuel)
    total_liters = sum(f["liters"] for f in fuel)

    today = datetime.now(timezone.utc).date()
    upcoming = []
    for m in maint:
        nsd = m.get("next_service_date")
        if not nsd:
            continue
        try:
            d = datetime.fromisoformat(nsd).date()
        except Exception:
            continue
        delta = (d - today).days
        if -3 <= delta <= 30:
            upcoming.append({**m, "days_left": delta})
    upcoming.sort(key=lambda x: x["days_left"])

    # Activity feed: merge latest 10 actions
    activity = []
    for f in fuel[:20]:
        activity.append({"type": "fuel", "date": f["date"], "label": f"Refueled {f['liters']}L", "amount": f["cost"], "vehicle_id": f["vehicle_id"]})
    for m in maint[:20]:
        activity.append({"type": "maintenance", "date": m["date"], "label": m["service_type"], "amount": m["cost"], "vehicle_id": m["vehicle_id"]})
    for e in expenses[:20]:
        activity.append({"type": "expense", "date": e["date"], "label": e["category"], "amount": e["amount"], "vehicle_id": e["vehicle_id"]})
    activity.sort(key=lambda x: x["date"], reverse=True)
    activity = activity[:10]

    return {
        "total_vehicles": len(vehicles),
        "total_expense": round(total_expense, 2),
        "total_fuel_cost": round(total_fuel_cost, 2),
        "total_liters": round(total_liters, 2),
        "upcoming_services": upcoming[:10],
        "activity": activity,
    }

# ---------------------------------------------------------------------------
# Startup: indexes + seed
# ---------------------------------------------------------------------------

VEHICLE_IMAGES = [
    "https://images.unsplash.com/photo-1767272374026-178111631eca?w=900",
    "https://images.unsplash.com/photo-1771066176846-5dd7016b79a5?w=900",
    "https://images.unsplash.com/photo-1770608014330-7de6ce86c69d?w=900",
]

async def seed():
    await db.users.create_index("email", unique=True)
    await db.vehicles.create_index([("user_id", 1)])
    await db.maintenance_logs.create_index([("user_id", 1), ("vehicle_id", 1)])
    await db.fuel_logs.create_index([("user_id", 1), ("vehicle_id", 1)])
    await db.expenses.create_index([("user_id", 1), ("vehicle_id", 1)])

    # Admin
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@autovault.app").lower()
    admin_pw = os.environ.get("ADMIN_PASSWORD", "admin12345")
    admin = await db.users.find_one({"email": admin_email})
    if not admin:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Admin",
            "password_hash": hash_password(admin_pw),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    # Demo user with seeded data
    demo_email = os.environ.get("DEMO_EMAIL", "demo@autovault.app").lower()
    demo_pw = os.environ.get("DEMO_PASSWORD", "demo12345")
    demo = await db.users.find_one({"email": demo_email})
    if not demo:
        demo_id = str(uuid.uuid4())
        await db.users.insert_one({
            "id": demo_id,
            "email": demo_email,
            "name": "Demo Driver",
            "password_hash": hash_password(demo_pw),
            "role": "user",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        vehicles_seed = [
            {"brand": "Mercedes-Benz", "model": "E63 AMG", "year": 2022, "plate_number": "AV-001", "mileage": 28500, "color": "Obsidian Black", "fuel_type": "Petrol", "image_url": VEHICLE_IMAGES[0], "insurance_expiry": (datetime.now(timezone.utc) + timedelta(days=45)).date().isoformat()},
            {"brand": "Audi", "model": "RS6 Avant", "year": 2021, "plate_number": "AV-002", "mileage": 41200, "color": "Nardo Grey", "fuel_type": "Petrol", "image_url": VEHICLE_IMAGES[1], "insurance_expiry": (datetime.now(timezone.utc) + timedelta(days=180)).date().isoformat()},
            {"brand": "BMW", "model": "M4 Convertible", "year": 2023, "plate_number": "AV-003", "mileage": 9800, "color": "Silverstone", "fuel_type": "Petrol", "image_url": VEHICLE_IMAGES[2], "insurance_expiry": (datetime.now(timezone.utc) + timedelta(days=14)).date().isoformat()},
        ]
        for vs in vehicles_seed:
            vid = str(uuid.uuid4())
            vs.update({"id": vid, "user_id": demo_id, "created_at": datetime.now(timezone.utc).isoformat()})
            await db.vehicles.insert_one(dict(vs))
            # Seed maintenance
            await db.maintenance_logs.insert_many([
                {"id": str(uuid.uuid4()), "user_id": demo_id, "vehicle_id": vid, "service_type": "Oil Change", "cost": 120.0, "date": (datetime.now(timezone.utc) - timedelta(days=40)).date().isoformat(), "next_service_date": (datetime.now(timezone.utc) + timedelta(days=20)).date().isoformat(), "notes": "Synthetic 5W-30", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "user_id": demo_id, "vehicle_id": vid, "service_type": "Brake Pads", "cost": 380.0, "date": (datetime.now(timezone.utc) - timedelta(days=120)).date().isoformat(), "next_service_date": (datetime.now(timezone.utc) + timedelta(days=240)).date().isoformat(), "notes": "Front pads replaced", "created_at": datetime.now(timezone.utc).isoformat()},
            ])
            # Fuel logs
            for i in range(6):
                await db.fuel_logs.insert_one({
                    "id": str(uuid.uuid4()), "user_id": demo_id, "vehicle_id": vid,
                    "liters": round(35 + i * 1.3, 2),
                    "cost": round((35 + i * 1.3) * 1.62, 2),
                    "mileage": vs["mileage"] - (5 - i) * 450,
                    "date": (datetime.now(timezone.utc) - timedelta(days=(5 - i) * 10)).date().isoformat(),
                    "created_at": datetime.now(timezone.utc).isoformat(),
                })
            # Expenses
            await db.expenses.insert_many([
                {"id": str(uuid.uuid4()), "user_id": demo_id, "vehicle_id": vid, "category": "Insurance", "amount": 890.0, "date": (datetime.now(timezone.utc) - timedelta(days=20)).date().isoformat(), "description": "Annual premium", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "user_id": demo_id, "vehicle_id": vid, "category": "Registration", "amount": 210.0, "date": (datetime.now(timezone.utc) - timedelta(days=80)).date().isoformat(), "description": "Renewal", "created_at": datetime.now(timezone.utc).isoformat()},
                {"id": str(uuid.uuid4()), "user_id": demo_id, "vehicle_id": vid, "category": "Repairs", "amount": 145.0, "date": (datetime.now(timezone.utc) - timedelta(days=10)).date().isoformat(), "description": "Wiper replacement", "created_at": datetime.now(timezone.utc).isoformat()},
            ])

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_start():
    await seed()
    logger.info("AutoVault ready")

@app.on_event("shutdown")
async def on_stop():
    client.close()
