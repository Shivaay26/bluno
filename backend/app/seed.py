from sqlalchemy.orm import Session

from app.models import Player, Team

TEAM_BUDGET = 1000

TEAMS = [
    "Sutlej Strikers",
    "Phagwara Panthers",
    "Kapurthala Kings",
    "Jalandhar Giants",
]

PLAYERS = [
    ("Aarav Mehta", "batting", 120),
    ("Kabir Singh", "bowling", 80),
    ("Rohan Iyer", "both", 150),
    ("Vivaan Shah", "batting", 100),
    ("Ishaan Gupta", "bowling", 90),
    ("Dev Patel", "both", 180),
    ("Arjun Nair", "batting", 70),
    ("Neel Kapoor", "bowling", 60),
    ("Yash Malhotra", "batting", 140),
    ("Reyansh Joshi", "bowling", 110),
    ("Aditya Rao", "both", 200),
    ("Kunal Desai", "batting", 50),
    ("Harsh Verma", "bowling", 85),
    ("Manav Chopra", "both", 95),
]


def seed_if_empty(db: Session) -> None:
    if db.query(Team).first() is not None:
        return
    for name in TEAMS:
        db.add(Team(name=name, total_budget=TEAM_BUDGET, remaining_budget=TEAM_BUDGET))
    for name, skill, base_price in PLAYERS:
        db.add(Player(name=name, skill=skill, base_price=base_price, status="available"))
    db.commit()
