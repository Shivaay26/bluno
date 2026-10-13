import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import GroupsIcon from "@mui/icons-material/Groups";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import { rupees } from "../format";

export default function RolePicker({ teams, onChoose }) {
  return (
      <Stack spacing={2.5} sx={{ maxWidth: 720 }}>
        <Box>
          <Typography variant="overline" color="primary" sx={{ fontWeight: 800 }}>
            Bluno assignment
          </Typography>
          <Typography variant="h3" component="h1">
            NIT Jalandhar Premier League
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
            Pick a seat for this browser. Four managers bid, the auctioneer decides, and everyone else watches the board.
          </Typography>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
            <GavelIcon color="primary" />
            <Typography variant="h6">Auctioneer</Typography>
          </Stack>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Put one player on the block, then accept the highest bid or reject the round.
          </Typography>
          <Button variant="contained" onClick={() => onChoose({ kind: "auctioneer" })}>
            Enter as auctioneer
          </Button>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
            <GroupsIcon color="primary" />
            <Typography variant="h6">Team managers</Typography>
          </Stack>
          <Stack spacing={1.25}>
            {teams.map((team) => (
              <Stack
                key={team.id}
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
              >
                <Box>
                  <Typography fontWeight={700}>{team.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Purse {rupees(team.remaining_budget)} left of {rupees(team.total_budget)}
                  </Typography>
                </Box>
                <Button
                  variant="outlined"
                  onClick={() => onChoose({ kind: "manager", teamId: team.id })}
                >
                  Bid as this team
                </Button>
              </Stack>
            ))}
          </Stack>
        </Paper>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
            <VisibilityOutlinedIcon color="primary" />
            <Typography variant="h6">Spectator</Typography>
            <Chip size="small" label="View only" />
          </Stack>
          <Button variant="text" onClick={() => onChoose({ kind: "spectator" })}>
            Watch the auction
          </Button>
        </Paper>
      </Stack>
  );
}
