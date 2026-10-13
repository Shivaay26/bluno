import { Box, Stack, Typography } from "@mui/material";
import { rupees } from "../format";

export default function BudgetPie({ remaining, total }) {
  const safeTotal = Math.max(total, 0);
  const left = Math.min(Math.max(remaining, 0), safeTotal || remaining);
  const leftPct = safeTotal === 0 ? 0 : (left / safeTotal) * 100;

  return (
    <Stack spacing={0.75} sx={{ alignItems: "center", my: 1.5 }}>
      <Box
        role="img"
        aria-label={`${rupees(left)} left of ${rupees(safeTotal)}`}
        sx={{ position: "relative", width: 92, height: 92 }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background: `conic-gradient(#0C4A8A 0% ${leftPct}%, #D6DEE8 ${leftPct}% 100%)`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 18,
            borderRadius: "50%",
            bgcolor: "background.paper",
          }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
        {rupees(left)} left of {rupees(safeTotal)}
      </Typography>
    </Stack>
  );
}
