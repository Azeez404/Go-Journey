from fastapi import FastAPI, HTTPException, Depends, APIRouter, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr
from passlib.hash import bcrypt
from jose import jwt, JWTError
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
from typing import List, Optional
from bson import ObjectId
import os
import random
import string

# ---------------- ENV ---------------- #

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "ticketmate_database")
SECRET_KEY = os.getenv("SECRET_KEY", "local-dev-secret")
ALGORITHM = "HS256"

# ---------------- APP ---------------- #

app = FastAPI(title="TicketMate Local API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------- DB ---------------- #

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ---------------- MODELS ---------------- #

class UserSignup(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

class SearchRequest(BaseModel):
    origin: str
    destination: str
    date: str
    transport_type: str  # train | flight

class Passenger(BaseModel):
    name: str
    age: int
    gender: str

class BookingCreate(BaseModel):
    trip_id: str
    trip_type: str
    passengers: List[Passenger]
    booking_type: str  # confirmed | waiting

class PredictionRequest(BaseModel):
    current_status: str
    class_type: str

class GrievanceCreate(BaseModel):
    booking_id: str
    category: str
    description: str

# ---------------- HELPERS ---------------- #

def create_token(user_id: str):
    return jwt.encode(
        {"sub": user_id, "exp": datetime.utcnow() + timedelta(days=7)},
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

def serialize_mongo(doc):
    if not doc:
        return None
    out = dict(doc)
    _id = out.pop("_id", None)
    if _id is not None:
        out["id"] = str(_id)
    # convert any ObjectId values in top-level fields
    for k, v in list(out.items()):
        if isinstance(v, ObjectId):
            out[k] = str(v)
    return out


def gen_pnr():
    return "PNR" + "".join(random.choices(string.digits, k=6))


def MathPrediction(booking_type: str, trip_type: str):
    base = 50
    if booking_type == "waiting":
        base -= 20
    if trip_type == "flight":
        base += 10
    return float(min(max(base + random.randint(-10, 10), 5), 98))

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user = await db.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
        return {"id": str(user["_id"]), "name": user.get("name"), "email": user.get("email")}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")

# ---------------- AUTH ---------------- #

@api_router.post("/auth/signup", response_model=TokenResponse)
async def signup(user: UserSignup):
    if await db.users.find_one({"email": user.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    result = await db.users.insert_one({
        "name": user.name,
        "email": user.email,
        "password": bcrypt.hash(user.password),
        "created_at": datetime.utcnow().isoformat()
    })

    user_id = str(result.inserted_id)
    token = create_token(user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": user.name,
            "email": user.email
        }
    }

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user: UserLogin):
    found = await db.users.find_one({"email": user.email})
    if not found or not bcrypt.verify(user.password, found["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    user_id = str(found["_id"])
    token = create_token(user_id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_id,
            "name": found["name"],
            "email": found["email"]
        }
    }

@api_router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}

# ---------------- SEARCH ---------------- #

@api_router.post("/search")
async def search_tickets(req: SearchRequest, user: dict = Depends(get_current_user)):
    if req.transport_type == "train":
        return {
            "results": [{
                "id": "T001",
                "name": "Rajdhani Express",
                "from": req.origin,
                "to": req.destination,
                "date": req.date,
                "price": 1500,
                "seats_available": 10,
                "number": "12345",
                "departure": "10:00",
                "arrival": "16:00",
                "duration": "6h"
            }]
        }

    if req.transport_type == "flight":
        return {
            "results": [{
                "id": "F001",
                "name": "IndiGo",
                "from": req.origin,
                "to": req.destination,
                "date": req.date,
                "price": 4200,
                "seats_available": 6,
                "number": "IG101",
                "departure": "09:00",
                "arrival": "11:00",
                "duration": "2h"
            }]
        }

    raise HTTPException(status_code=400, detail="Invalid transport type")

# ---------------- BOOKINGS (FIXED) ---------------- #

@api_router.post("/bookings")
async def create_booking(booking: BookingCreate, user: dict = Depends(get_current_user)):
    pnr = gen_pnr()
    status_val = "confirmed" if booking.booking_type == "confirmed" else "waiting"
    waiting_pos = None
    if status_val == "waiting":
        waiting_pos = (await db.bookings.count_documents({"status": "waiting"})) + 1

    booking_doc = {
        "user_id": user["id"],
        "trip_id": booking.trip_id,
        "trip_type": booking.trip_type,
        "passengers": [p.dict() for p in booking.passengers],
        "booking_type": booking.booking_type,
        "status": status_val,
        "pnr": pnr,
        "route": "Demo City → Demo Destination",
        "date": date.today().isoformat(),
        "waiting_position": waiting_pos,
        "prediction_percentage": MathPrediction(booking.booking_type, booking.trip_type),
        "created_at": datetime.utcnow().isoformat()
    }

    result = await db.bookings.insert_one(booking_doc)
    booking_doc["_id"] = result.inserted_id

    # create a notification for the booking
    await db.notifications.insert_one({
        "user_id": user["id"],
        "type": "booking",
        "message": f"Booking {pnr} created ({status_val})",
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    })

    return serialize_mongo(booking_doc)

@api_router.get("/bookings")
async def get_my_bookings(user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": user["id"]}).to_list(100)
    return [serialize_mongo(b) for b in bookings]


@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    # try as ObjectId first
    booking = None
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id), "user_id": user["id"]})
    except Exception:
        booking = await db.bookings.find_one({"_id": booking_id, "user_id": user["id"]})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return serialize_mongo(booking)


@api_router.put("/bookings/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(booking_id)
        result = await db.bookings.update_one({"_id": oid, "user_id": user["id"]}, {"$set": {"status": "cancelled"}})
    except Exception:
        result = await db.bookings.update_one({"id": booking_id, "user_id": user["id"]}, {"$set": {"status": "cancelled"}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    # add notification
    await db.notifications.insert_one({
        "user_id": user["id"],
        "type": "cancellation",
        "message": f"Booking {booking_id} cancelled",
        "timestamp": datetime.utcnow().isoformat(),
        "read": False
    })
    return {"detail": "cancelled"}

# ---------------- PREDICTION ---------------- #

@api_router.post("/predict")
async def predict(req: PredictionRequest, user: dict = Depends(get_current_user)):
    status_map = {"WL": 30, "RAC": 60, "CNF": 95}
    class_map = {"SL": 40, "3A": 70, "2A": 80, "1A": 90}
    chance = (status_map.get(req.current_status.upper(), 50) + class_map.get(req.class_type.upper(), 50)) / 2
    return {"confirmation_chance": int(chance)}

@api_router.get("/waiting-list")
async def waiting_list(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find({"status": "waiting", "user_id": user["id"]}).to_list(200)
    return {"bookings": [serialize_mongo(d) for d in docs]}


@api_router.get("/notifications")
async def get_notifications(user: dict = Depends(get_current_user)):
    docs = await db.notifications.find({"user_id": user["id"]}).sort("timestamp", -1).to_list(200)
    return [serialize_mongo(d) for d in docs]


@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(notification_id)
        result = await db.notifications.update_one({"_id": oid, "user_id": user["id"]}, {"$set": {"read": True}})
    except Exception:
        result = await db.notifications.update_one({"id": notification_id, "user_id": user["id"]}, {"$set": {"read": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"detail": "marked"}


@api_router.get("/grievances")
async def list_grievances(user: dict = Depends(get_current_user)):
    docs = await db.grievances.find({"user_id": user["id"]}).to_list(200)
    return [serialize_mongo(d) for d in docs]


@api_router.post("/grievances")
async def create_grievance(payload: GrievanceCreate, user: dict = Depends(get_current_user)):
    doc = {
        "user_id": user["id"],
        "booking_id": payload.booking_id,
        "category": payload.category,
        "description": payload.description,
        "status": "pending",
        "created_at": datetime.utcnow().isoformat()
    }
    result = await db.grievances.insert_one(doc)
    doc["_id"] = result.inserted_id
    return serialize_mongo(doc)


@api_router.get("/admin/stats")
async def admin_stats(user: dict = Depends(get_current_user)):
    # simple stub for the dashboard
    total_bookings = await db.bookings.count_documents({})
    total_users = await db.users.count_documents({})
    confirmed = await db.bookings.count_documents({"status": "confirmed"})
    waiting = await db.bookings.count_documents({"status": "waiting"})
    cancelled = await db.bookings.count_documents({"status": "cancelled"})
    return {"total_bookings": total_bookings, "total_users": total_users, "confirmed": confirmed, "waiting": waiting, "cancelled": cancelled}


@api_router.get("/admin/bookings")
async def admin_bookings(user: dict = Depends(get_current_user)):
    docs = await db.bookings.find().to_list(200)
    return [serialize_mongo(d) for d in docs]


@api_router.get("/admin/grievances")
async def admin_grievances(user: dict = Depends(get_current_user)):
    docs = await db.grievances.find().to_list(200)
    return [serialize_mongo(d) for d in docs]

# ---------------- ROOT ---------------- #

@app.get("/")
def root():
    return {"message": "TicketMate backend running locally 🚀"}

app.include_router(api_router)
