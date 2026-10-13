from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models import Bid, Player, Team
from app.schemas import BidOut, PlayerOut, RosterPlayerOut, StateOut, TeamOut


def _player_out(player: Player) -> PlayerOut:
    return PlayerOut(
        id=player.id,
        name=player.name,
        skill=player.skill,
        base_price=player.base_price,
        status=player.status,
        sold_price=player.sold_price,
        team_id=player.team_id,
    )


def _highest_active_bid(db: Session, player_id: int) -> Bid | None:
    return (
        db.query(Bid)
        .filter(Bid.player_id == player_id, Bid.voided.is_(False))
        .order_by(Bid.amount.desc(), Bid.created_at.asc(), Bid.id.asc())
        .first()
    )


def _current_player(db: Session) -> Player | None:
    return db.query(Player).filter(Player.status == "in_auction").one_or_none()


def build_state(db: Session) -> StateOut:
    teams = db.query(Team).order_by(Team.id.asc()).all()
    players = db.query(Player).order_by(Player.id.asc()).all()
    current = _current_player(db)
    bids: list[Bid] = []
    if current is not None:
        bids = (
            db.query(Bid)
            .filter(Bid.player_id == current.id, Bid.voided.is_(False))
            .order_by(Bid.created_at.asc(), Bid.id.asc())
            .all()
        )
    team_name = {team.id: team.name for team in teams}
    return StateOut(
        teams=[
            TeamOut(
                id=team.id,
                name=team.name,
                total_budget=team.total_budget,
                remaining_budget=team.remaining_budget,
                roster=[
                    RosterPlayerOut(
                        id=player.id,
                        name=player.name,
                        skill=player.skill,
                        sold_price=player.sold_price,
                    )
                    for player in sorted(team.players, key=lambda item: item.name)
                    if player.status == "sold" and player.sold_price is not None
                ],
            )
            for team in teams
        ],
        players=[_player_out(player) for player in players],
        current_player=_player_out(current) if current else None,
        bids=[
            BidOut(
                id=bid.id,
                player_id=bid.player_id,
                team_id=bid.team_id,
                team_name=team_name[bid.team_id],
                amount=bid.amount,
                created_at=bid.created_at,
                voided=bid.voided,
            )
            for bid in bids
        ],
    )


def start_auction(db: Session, player_id: int) -> StateOut:
    if _current_player(db) is not None:
        raise HTTPException(status_code=409, detail="Another player is already in auction")
    player = db.get(Player, player_id)
    if player is None:
        raise HTTPException(status_code=404, detail="Player not found")
    if player.status != "available":
        raise HTTPException(status_code=400, detail="Player is not available")
    player.status = "in_auction"
    db.commit()
    return build_state(db)


def place_bid(db: Session, team_id: int, amount: int) -> StateOut:
    player = _current_player(db)
    if player is None:
        raise HTTPException(status_code=400, detail="No player is currently in auction")
    team = db.get(Team, team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    if amount <= player.base_price:
        raise HTTPException(status_code=400, detail="Bid must be greater than the base price")
    highest = _highest_active_bid(db, player.id)
    if highest is not None and highest.team_id == team.id:
        raise HTTPException(status_code=400, detail="Your team already holds the highest bid")
    if highest is not None and amount <= highest.amount:
        raise HTTPException(status_code=400, detail="Bid must be greater than the current highest bid")
    if amount > team.remaining_budget:
        raise HTTPException(
            status_code=400,
            detail="Bid is higher than the team's remaining budget",
        )
    db.add(Bid(player_id=player.id, team_id=team.id, amount=amount))
    db.commit()
    return build_state(db)


def accept_bid(db: Session) -> StateOut:
    player = _current_player(db)
    if player is None:
        raise HTTPException(status_code=400, detail="No player is currently in auction")
    highest = _highest_active_bid(db, player.id)
    if highest is None:
        raise HTTPException(status_code=400, detail="There is no bid to accept")
    team = db.get(Team, highest.team_id)
    if team is None:
        raise HTTPException(status_code=404, detail="Team not found")
    if highest.amount > team.remaining_budget:
        raise HTTPException(
            status_code=400,
            detail="Bid is higher than the team's remaining budget",
        )
    team.remaining_budget -= highest.amount
    player.status = "sold"
    player.sold_price = highest.amount
    player.team_id = team.id
    db.commit()
    return build_state(db)


def reject_round(db: Session) -> StateOut:
    player = _current_player(db)
    if player is None:
        raise HTTPException(status_code=400, detail="No player is currently in auction")
    (
        db.query(Bid)
        .filter(Bid.player_id == player.id, Bid.voided.is_(False))
        .update({Bid.voided: True}, synchronize_session=False)
    )
    player.status = "available"
    player.sold_price = None
    player.team_id = None
    db.commit()
    return build_state(db)
