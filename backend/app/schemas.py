from datetime import datetime

from pydantic import BaseModel, Field


class PlayerOut(BaseModel):
    id: int
    name: str
    skill: str
    base_price: int
    status: str
    sold_price: int | None
    team_id: int | None


class RosterPlayerOut(BaseModel):
    id: int
    name: str
    skill: str
    sold_price: int


class TeamOut(BaseModel):
    id: int
    name: str
    total_budget: int
    remaining_budget: int
    roster: list[RosterPlayerOut]


class BidOut(BaseModel):
    id: int
    player_id: int
    team_id: int
    team_name: str
    amount: int
    created_at: datetime
    voided: bool


class StateOut(BaseModel):
    teams: list[TeamOut]
    players: list[PlayerOut]
    current_player: PlayerOut | None
    bids: list[BidOut]


class StartIn(BaseModel):
    player_id: int


class BidIn(BaseModel):
    team_id: int
    amount: int = Field(gt=0)
