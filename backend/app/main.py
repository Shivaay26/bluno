from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.auction import accept_bid, build_state, place_bid, reject_round, start_auction
from app.database import Base, SessionLocal, engine, get_db
from app.schemas import BidIn, StartIn, StateOut
from app.seed import seed_if_empty


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_if_empty(db)
    finally:
        db.close()
    yield


app = FastAPI(title="JPL Auction", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/state", response_model=StateOut)
def get_state(db: Session = Depends(get_db)) -> StateOut:
    return build_state(db)


@app.post("/api/auction/start", response_model=StateOut)
def post_start(body: StartIn, db: Session = Depends(get_db)) -> StateOut:
    return start_auction(db, body.player_id)


@app.post("/api/bids", response_model=StateOut)
def post_bid(body: BidIn, db: Session = Depends(get_db)) -> StateOut:
    return place_bid(db, body.team_id, body.amount)


@app.post("/api/auction/accept", response_model=StateOut)
def post_accept(db: Session = Depends(get_db)) -> StateOut:
    return accept_bid(db)


@app.post("/api/auction/reject", response_model=StateOut)
def post_reject(db: Session = Depends(get_db)) -> StateOut:
    return reject_round(db)
