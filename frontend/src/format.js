export function rupees(amount) {
  return `₹${Number(amount).toLocaleString("en-IN")}`;
}

export function skillLabel(skill) {
  if (skill === "both") return "Batting & bowling";
  if (skill === "batting") return "Batting";
  return "Bowling";
}
