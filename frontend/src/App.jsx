import { useEffect, useState } from "react";
import { Alert, Box, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { getState } from "./api";
import AuctionBoard from "./components/AuctionBoard";
import RolePicker from "./components/RolePicker";

const STORAGE_KEY = "jpl-role";

function readRole() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!saved || !saved.kind) return null;
    return saved;
  } catch {
    return null;
  }
}

export default function App() {
  const [role, setRole] = useState(readRole);
  const [state, setState] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const next = await getState();
        if (!active) return;
        setState(next);
        setError("");
      } catch (err) {
        if (!active) return;
        setError(err.message || "The auction server is not reachable.");
      }
    }

    load();
    const timer = setInterval(load, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  function chooseRole(next) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setRole(next);
  }

  function switchRole() {
    localStorage.removeItem(STORAGE_KEY);
    setRole(null);
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", py: { xs: 2, md: 4 } }}>
      <Container maxWidth="lg">
        <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", mb: 3 }}>
          <Typography variant="h6" color="primary" sx={{ fontWeight: 800 }}>
            Bluno
          </Typography>
          <Typography variant="body2" color="text.secondary">
            NIT Jalandhar Premier League
          </Typography>
        </Stack>

        {error && !state ? (
          <Alert severity="error">
            {error} Start the API, then refresh this page.
          </Alert>
        ) : null}

        {!state && !error ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            <CircularProgress size={22} />
            <Typography>Loading the auction…</Typography>
          </Stack>
        ) : null}

        {state && !role ? <RolePicker teams={state.teams} onChoose={chooseRole} /> : null}
        {state && role ? (
          <AuctionBoard role={role} state={state} onState={setState} onSwitchRole={switchRole} />
        ) : null}
      </Container>
    </Box>
  );
}
