import { Box, Stack, Typography } from "@mui/material";
import { rupees } from "../format";

const COLORS = ["#0C4A8A", "#0E8F8A", "#3D7CC4", "#C2413B"];

export default function BidChart({ teams, bids }) {
  const rows = teams.map((team, index) => {
    const teamBids = bids.filter((bid) => bid.team_id === team.id);
    const amount = teamBids.reduce((max, bid) => Math.max(max, bid.amount), 0);
    return {
      id: team.id,
      name: team.name,
      amount,
      color: COLORS[index % COLORS.length],
    };
  });
  const scale = Math.max(...rows.map((row) => row.amount), 1);

  return (
    <Stack spacing={1.25} aria-label="Bids by team">
      {rows.map((row) => (
        <Stack key={row.id} spacing={0.5}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
            <Typography variant="body2" fontWeight={700}>
              {row.name}
            </Typography>
            <Typography variant="body2" color={row.amount ? "text.primary" : "text.secondary"} fontWeight={700}>
              {row.amount ? rupees(row.amount) : "No bid"}
            </Typography>
          </Stack>
          <Box sx={{ height: 10, borderRadius: 99, bgcolor: "action.hover", overflow: "hidden" }}>
            <Box
              sx={{
                width: row.amount ? `${Math.max(6, (row.amount / scale) * 100)}%` : 0,
                height: "100%",
                borderRadius: 99,
                bgcolor: row.color,
                transition: "width 240ms ease",
              }}
            />
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}
