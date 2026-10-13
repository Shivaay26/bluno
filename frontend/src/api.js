async function readError(response) {
  try {
    const body = await response.json();
    if (typeof body.detail === "string") return body.detail;
    if (Array.isArray(body.detail)) {
      return body.detail.map((item) => item.msg).join(" ");
    }
  } catch {
    // Response was not JSON.
  }
  return "Something went wrong. Try again.";
}

async function request(path, options) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!response.ok) {
    throw new Error(await readError(response));
  }
  return response.json();
}

export function getState() {
  return request("/api/state");
}

export function startAuction(playerId) {
  return request("/api/auction/start", {
    method: "POST",
    body: JSON.stringify({ player_id: playerId }),
  });
}

export function placeBid(teamId, amount) {
  return request("/api/bids", {
    method: "POST",
    body: JSON.stringify({ team_id: teamId, amount }),
  });
}

export function acceptBid() {
  return request("/api/auction/accept", { method: "POST" });
}

export function rejectRound() {
  return request("/api/auction/reject", { method: "POST" });
}
