import pandas as pd
from pymongo import MongoClient

# ---------------- CONFIG ---------------- #

MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "ticketmate_database"

# ---------------- CONNECT ---------------- #

client = MongoClient(MONGO_URL)
db = client[DB_NAME]

routes_col = db.train_routes
stations_col = db.train_stations

# ---------------- LOAD CSV ---------------- #

routes = pd.read_csv("train_routes_prices.csv")
stations = pd.read_csv("train_stations.csv")

print("Routes rows:", len(routes))
print("Stations rows:", len(stations))

# ---------------- CLEAN BEFORE INSERT ---------------- #

routes = routes.fillna("").to_dict(orient="records")
stations = stations.fillna("").to_dict(orient="records")

# ---------------- INSERT ---------------- #

routes_col.delete_many({})
stations_col.delete_many({})

routes_col.insert_many(routes)
stations_col.insert_many(stations)

print("✅ Data loaded into MongoDB")
