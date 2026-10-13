import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { acceptBid, placeBid, rejectRound, startAuction } from "../api";
import { rupees, skillLabel } from "../format";
import BidChart from "./BidChart";
import BudgetPie from "./BudgetPie";

function nextMinimum(player, bids) {
  const highest = bids.reduce((max, bid) => Math.max(max, bid.amount), 0);
  return Math.max(player.base_price, highest) + 1;
}

export default function AuctionBoard({ role, state, onState, onSwitchRole }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");

  const managerTeam = state.teams.find((team) => team.id === role.teamId);
  const available = state.players.filter((player) => player.status === "available");
  const minimum = state.current_player ? nextMinimum(state.current_player, state.bids) : null;
  const highest = useMemo(() => {
    return state.bids.reduce((best, bid) => (best == null || bid.amount > best.amount ? bid : best), null);
  }, [state.bids]);

  async function run(action) {
    setBusy(true);
    setError("");
    try {
      onState(await action());
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const roleLabel =
    role.kind === "auctioneer"
      ? "Auctioneer"
      : role.kind === "manager"
        ? managerTeam?.name ?? "Team manager"
        : "Spectator";

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
            Bluno · JPL
          </Typography>
          <Typography variant="h4" component="h1">
            Auction board
          </Typography>
          <Typography color="text.secondary">You are signed in as {roleLabel}.</Typography>
        </Box>
        <Button variant="outlined" onClick={onSwitchRole}>
          Switch role
        </Button>
      </Stack>

      {error ? (
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      ) : null}

      <Stack spacing={2}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="overline" color="text.secondary">
              Now in auction
            </Typography>
            {state.current_player ? (
              <Stack spacing={2} sx={{ mt: 1 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                  <Typography variant="h5">{state.current_player.name}</Typography>
                  <Chip size="small" label={skillLabel(state.current_player.skill)} color="primary" variant="outlined" />
                </Stack>
                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Base price
                    </Typography>
                    <Typography fontWeight={800}>{rupees(state.current_player.base_price)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Highest bid
                    </Typography>
                    <Typography fontWeight={800}>
                      {highest ? `${rupees(highest.amount)} · ${highest.team_name}` : "No bids yet"}
                    </Typography>
                  </Box>
                </Stack>
                <Divider />
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Bids this round
                  </Typography>
                  {state.bids.length === 0 ? (
                    <Typography color="text.secondary">Waiting for the first bid above the base price.</Typography>
                  ) : (
                    <BidChart teams={state.teams} bids={state.bids} />
                  )}
                </Box>

                {role.kind === "manager" && managerTeam ? (
                  <Stack spacing={1.5}>
                    <Typography variant="body2" color="text.secondary">
                      {managerTeam.name} can bid up to {rupees(managerTeam.remaining_budget)}. Next bid must be at least {rupees(minimum)}.
                    </Typography>
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                      <TextField
                        label="Bid amount"
                        type="number"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        slotProps={{ htmlInput: { min: minimum, step: 1 } }}
                        fullWidth
                      />
                      <Button
                        variant="contained"
                        disabled={busy}
                        sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
                        onClick={() =>
                          run(async () => {
                            const value = Number(amount);
                            if (!Number.isInteger(value) || value <= 0) {
                              throw new Error("Enter a whole number greater than zero.");
                            }
                            const next = await placeBid(managerTeam.id, value);
                            setAmount("");
                            return next;
                          })
                        }
                      >
                        Place bid
                      </Button>
                    </Stack>
                  </Stack>
                ) : null}

                {role.kind === "auctioneer" ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    <Button variant="contained" disabled={busy || state.bids.length === 0} onClick={() => run(acceptBid)}>
                      Accept highest bid
                    </Button>
                    <Button variant="outlined" color="error" disabled={busy} onClick={() => run(rejectRound)}>
                      Reject round
                    </Button>
                  </Stack>
                ) : null}

                {role.kind === "spectator" ? (
                  <Typography color="text.secondary">Spectators can follow the bids. Only a team manager can bid.</Typography>
                ) : null}
              </Stack>
            ) : (
              <Typography sx={{ mt: 1 }} color="text.secondary">
                No player is on the block. The auctioneer starts one player at a time.
              </Typography>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Available players
            </Typography>
            <Stack spacing={1.25}>
              {available.length === 0 ? (
                <Typography color="text.secondary">Every listed player has been sold.</Typography>
              ) : (
                available.map((player) => (
                  <Stack
                    key={player.id}
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
                  >
                    <Box>
                      <Typography fontWeight={700}>{player.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {skillLabel(player.skill)} · base {rupees(player.base_price)}
                      </Typography>
                    </Box>
                    {role.kind === "auctioneer" ? (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={busy || state.current_player != null}
                        onClick={() => run(() => startAuction(player.id))}
                      >
                        Start auction
                      </Button>
                    ) : null}
                  </Stack>
                ))
              )}
            </Stack>
          </Paper>
      </Stack>

      <Box>
        <Typography variant="h5" sx={{ mb: 1.5 }}>
          Rosters
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
          }}
        >
          {state.teams.map((team) => (
            <Paper key={team.id} variant="outlined" sx={{ p: 2 }}>
              <Typography fontWeight={800}>{team.name}</Typography>
              <BudgetPie remaining={team.remaining_budget} total={team.total_budget} />
              {team.roster.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No players yet.
                </Typography>
              ) : (
                <Stack spacing={1}>
                  {team.roster.map((player) => (
                    <Stack key={player.id} direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>
                          {player.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {skillLabel(player.skill)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" fontWeight={700}>
                        {rupees(player.sold_price)}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              )}
            </Paper>
          ))}
        </Box>
      </Box>
    </Stack>
  );
}
