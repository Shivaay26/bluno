def _player(client, name):
    state = client.get("/api/state").json()
    return next(player for player in state["players"] if player["name"] == name)


def _team(client, name):
    state = client.get("/api/state").json()
    return next(team for team in state["teams"] if team["name"] == name)


def test_only_a_higher_bid_is_stored(client):
    player = _player(client, "Kunal Desai")
    strikers = _team(client, "Sutlej Strikers")
    panthers = _team(client, "Phagwara Panthers")

    started = client.post("/api/auction/start", json={"player_id": player["id"]})
    assert started.status_code == 200

    too_low = client.post("/api/bids", json={"team_id": strikers["id"], "amount": player["base_price"]})
    assert too_low.status_code == 400
    assert too_low.json()["detail"] == "Bid must be greater than the base price"

    first = client.post("/api/bids", json={"team_id": strikers["id"], "amount": 80})
    assert first.status_code == 200
    assert [bid["amount"] for bid in first.json()["bids"]] == [80]

    not_higher = client.post("/api/bids", json={"team_id": panthers["id"], "amount": 80})
    assert not_higher.status_code == 400
    assert not_higher.json()["detail"] == "Bid must be greater than the current highest bid"

    consecutive = client.post("/api/bids", json={"team_id": strikers["id"], "amount": 120})
    assert consecutive.status_code == 400
    assert consecutive.json()["detail"] == "Your team already holds the highest bid"

    second = client.post("/api/bids", json={"team_id": panthers["id"], "amount": 90})
    assert second.status_code == 200
    assert [bid["amount"] for bid in second.json()["bids"]] == [80, 90]


def test_bid_above_remaining_budget_is_refused(client):
    player = _player(client, "Aditya Rao")
    team = _team(client, "Jalandhar Giants")
    client.post("/api/auction/start", json={"player_id": player["id"]})

    response = client.post("/api/bids", json={"team_id": team["id"], "amount": 1001})
    assert response.status_code == 400
    assert response.json()["detail"] == "Bid is higher than the team's remaining budget"

    state = client.get("/api/state").json()
    assert state["bids"] == []
    assert next(item for item in state["teams"] if item["id"] == team["id"])["remaining_budget"] == 1000


def test_accept_moves_player_onto_roster_and_reduces_budget(client):
    player = _player(client, "Neel Kapoor")
    team = _team(client, "Kapurthala Kings")
    client.post("/api/auction/start", json={"player_id": player["id"]})
    client.post("/api/bids", json={"team_id": team["id"], "amount": 75})

    accepted = client.post("/api/auction/accept")
    assert accepted.status_code == 200
    body = accepted.json()
    assert body["current_player"] is None
    sold = next(item for item in body["players"] if item["id"] == player["id"])
    assert sold["status"] == "sold"
    assert sold["sold_price"] == 75
    assert sold["team_id"] == team["id"]
    roster_team = next(item for item in body["teams"] if item["id"] == team["id"])
    assert roster_team["remaining_budget"] == 925
    assert roster_team["roster"] == [
        {"id": player["id"], "name": "Neel Kapoor", "skill": "bowling", "sold_price": 75}
    ]
    assert all(item["status"] != "in_auction" for item in body["players"])


def test_reject_does_not_assign_the_player(client):
    player = _player(client, "Arjun Nair")
    team = _team(client, "Sutlej Strikers")
    client.post("/api/auction/start", json={"player_id": player["id"]})
    client.post("/api/bids", json={"team_id": team["id"], "amount": 90})

    rejected = client.post("/api/auction/reject")
    assert rejected.status_code == 200
    body = rejected.json()
    updated = next(item for item in body["players"] if item["id"] == player["id"])
    assert updated["status"] == "available"
    assert updated["team_id"] is None
    assert updated["sold_price"] is None
    assert body["current_player"] is None
    assert body["bids"] == []
    assert next(item for item in body["teams"] if item["id"] == team["id"])["remaining_budget"] == 1000

    restarted = client.post("/api/auction/start", json={"player_id": player["id"]})
    assert restarted.status_code == 200
    rebids = client.post("/api/bids", json={"team_id": team["id"], "amount": 71})
    assert rebids.status_code == 200
    assert [bid["amount"] for bid in rebids.json()["bids"]] == [71]


def test_accept_without_a_bid_and_a_second_auction_are_refused(client):
    player = _player(client, "Harsh Verma")
    other = _player(client, "Manav Chopra")
    client.post("/api/auction/start", json={"player_id": player["id"]})

    empty = client.post("/api/auction/accept")
    assert empty.status_code == 400
    assert empty.json()["detail"] == "There is no bid to accept"

    conflict = client.post("/api/auction/start", json={"player_id": other["id"]})
    assert conflict.status_code == 409
    assert conflict.json()["detail"] == "Another player is already in auction"
