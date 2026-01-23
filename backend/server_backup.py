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

# ================= SEARCH (REAL DATA - DO NOT TOUCH OTHER PARTS) =================
# Mongo collections already exist and are populated from CSV:
# - train_schedules
# - train_prices
# Use Motor async queries only.
# DO NOT modify auth, models, or other routes.

@api_router.post("/search")
async def search_tickets(req: SearchRequest, user: dict = Depends(get_current_user)):
    # Only trains supported by real search implementation
    if req.transport_type != "train":
        raise HTTPException(status_code=400, detail="Only 'train' transport_type is supported by this endpoint")

    origin = (req.origin or "").strip()
    destination = (req.destination or "").strip()
    req_date = (req.date or "").strip()

    if not origin or not destination:
        raise HTTPException(status_code=400, detail="origin and destination are required")

    # discover likely collection names populated by CSV loader
    coll_names = await db.list_collection_names()
    schedule_candidates = ["train_schedules", "train_routes", "train_routes_prices", "train_routes_prices.csv", "train_routes"]
    price_candidates = ["train_prices", "train_fares", "train_routes_prices", "train_prices"]

    schedule_col_name = next((c for c in schedule_candidates if c in coll_names), None)
    price_col_name = next((c for c in price_candidates if c in coll_names), None)

    if not schedule_col_name:
        raise HTTPException(status_code=500, detail="No train schedules collection found in database")

    schedules_col = db[schedule_col_name]
    prices_col = db[price_col_name] if price_col_name else None

    # Build query that finds docs containing both origin & destination somewhere in their station data.
    # Support documents where `stations` is an array of strings or array of objects with `name` / `station` fields.
    query = {
        "$and": [
            {
                "$or": [
                    {"stations": origin},
                    {"stations.name": {"$regex": f"^{origin}$", "$options": "i"}},
                    {"route": {"$regex": origin, "$options": "i"}}
                ]
            },
            {
                "$or": [
                    {"stations": destination},
                    {"stations.name": {"$regex": f"^{destination}$", "$options": "i"}},
                    {"route": {"$regex": destination, "$options": "i"}}
                ]
            }
        ]
    }

    docs = await schedules_col.find(query).to_list(length=200)

    results = []

    def _extract_station_names(stations):
        out = []
        if not stations:
            return out
        for s in stations:
            if isinstance(s, str):
                out.append(s)
            elif isinstance(s, dict):
                # common keys
                for key in ("name", "station", "station_name", "code"):
                    if key in s and s.get(key):
                        out.append(s.get(key))
                        break
                else:
                    # fallback to first value
                    vals = [v for v in s.values() if isinstance(v, str) and v]
                    out.append(vals[0] if vals else None)
        return [o for o in out if o]

    for doc in docs:
        stations = doc.get("stations") or doc.get("route_stations") or []
        station_names = _extract_station_names(stations)

        # find indices
        origin_idx = next((i for i, n in enumerate(station_names) if n and n.strip().lower() == origin.lower()), None)
        dest_idx = next((i for i, n in enumerate(station_names) if n and n.strip().lower() == destination.lower()), None)

        # if we couldn't find indices by exact match, try substring matching
        if origin_idx is None:
            origin_idx = next((i for i, n in enumerate(station_names) if n and origin.lower() in n.lower()), None)
        if dest_idx is None:
            dest_idx = next((i for i, n in enumerate(station_names) if n and destination.lower() in n.lower()), None)

        if origin_idx is None or dest_idx is None or origin_idx >= dest_idx:
            # not a valid route in correct order
            continue

        # helper to pull times from station entry
        def _get_time_at(idx, prefer="departure"):
            try:
                item = stations[idx]
            except Exception:
                return ""
            if isinstance(item, dict):
                for key in ("departure", "dep_time", "departure_time", "dept", "time"):
                    if key in item and item.get(key):
                        return item.get(key)
                # arrival keys
                for key in ("arrival", "arr_time", "arrival_time"):
                    if key in item and item.get(key):
                        return item.get(key)
            return ""

        departure = _get_time_at(origin_idx, "departure") or doc.get("departure") or ""
        arrival = _get_time_at(dest_idx, "arrival") or doc.get("arrival") or ""

        # duration: try to compute from HH:MM pairs if possible
        duration = doc.get("duration") or ""
        try:
            if departure and arrival:
                fmt = "%H:%M"
                t1 = datetime.strptime(departure.strip(), fmt)
                t2 = datetime.strptime(arrival.strip(), fmt)
                diff = t2 - t1
                if diff.total_seconds() < 0:
                    diff += timedelta(days=1)
                hrs = int(diff.total_seconds() // 3600)
                mins = int((diff.total_seconds() % 3600) // 60)
                duration = f"{hrs}h{mins:02d}m"
        except Exception:
            pass

        train_number = doc.get("train_number") or doc.get("number") or doc.get("train_no") or doc.get("train") or None

        # Try to join price by train_number in prices collection if available
        price = None
        if prices_col and train_number:
            # try several common key names
            price_doc = await prices_col.find_one({"train_number": train_number}) or await prices_col.find_one({"number": train_number}) or await prices_col.find_one({"train_no": train_number})
            if price_doc:
                price = price_doc.get("price") or price_doc.get("fare") or price_doc.get("amount")

        # fallback: price may be in route doc itself
        if price is None:
            price = doc.get("price") or doc.get("fare") or doc.get("amount")

        seats_available = doc.get("seats_available") or doc.get("seats") or doc.get("availability") or 0

        result = {
            "id": train_number or str(doc.get("_id")),
            "name": doc.get("name") or doc.get("train_name") or doc.get("title") or "",
            "from": origin,
            "to": destination,
            "date": req_date,
            "price": int(price) if isinstance(price, (int, float)) or (isinstance(price, str) and price.isdigit()) else (price or 0),
            "seats_available": int(seats_available) if isinstance(seats_available, (int, float)) or (isinstance(seats_available, str) and seats_available.isdigit()) else (seats_available or 0),
            "number": str(train_number) if train_number else "",
            "departure": departure or "",
            "arrival": arrival or "",
            "duration": duration or ""
        }

        results.append(result)

    return {"results": results}

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
