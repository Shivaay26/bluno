from datetime import datetime, timezone

from sqlalchemy import Boolean, CheckConstraint, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Team(Base):
    __tablename__ = "teams"
    __table_args__ = (
        CheckConstraint("total_budget >= 0", name="ck_teams_total_budget_nonnegative"),
        CheckConstraint("remaining_budget >= 0", name="ck_teams_remaining_budget_nonnegative"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(80), unique=True, nullable=False)
    total_budget: Mapped[int] = mapped_column(Integer, nullable=False)
    remaining_budget: Mapped[int] = mapped_column(Integer, nullable=False)

    players: Mapped[list["Player"]] = relationship(back_populates="team")
    bids: Mapped[list["Bid"]] = relationship(back_populates="team")


class Player(Base):
    __tablename__ = "players"
    __table_args__ = (
        CheckConstraint(
            "skill IN ('batting', 'bowling', 'both')",
            name="ck_players_skill",
        ),
        CheckConstraint(
            "status IN ('available', 'in_auction', 'sold')",
            name="ck_players_status",
        ),
        CheckConstraint("base_price > 0", name="ck_players_base_price_positive"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    skill: Mapped[str] = mapped_column(String(20), nullable=False)
    base_price: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="available")
    sold_price: Mapped[int | None] = mapped_column(Integer, nullable=True)
    team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"), nullable=True)

    team: Mapped["Team | None"] = relationship(back_populates="players")
    bids: Mapped[list["Bid"]] = relationship(back_populates="player")


class Bid(Base):
    __tablename__ = "bids"
    __table_args__ = (CheckConstraint("amount > 0", name="ck_bids_amount_positive"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    player_id: Mapped[int] = mapped_column(ForeignKey("players.id"), nullable=False)
    team_id: Mapped[int] = mapped_column(ForeignKey("teams.id"), nullable=False)
    amount: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, default=utcnow)
    voided: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    player: Mapped["Player"] = relationship(back_populates="bids")
    team: Mapped["Team"] = relationship(back_populates="bids")
