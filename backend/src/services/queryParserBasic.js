export function parseQueryBasic(q) {
  const query = q.toLowerCase();
  const filters = {};

  const budgetMatch = query.match(
    /(under|below|less than)\s*(\d+(\.\d+)?)\s*(lakh|lakhs|l)?/,
  );
  if (budgetMatch) filters.budgetMax = parseFloat(budgetMatch[2]);

  if (query.includes("diesel")) filters.fuelType = /diesel/i;
  else if (query.includes("petrol")) filters.fuelType = /petrol/i;
  else if (query.includes("electric") || query.includes("ev"))
    filters.fuelType = /electric/i;
  else if (query.includes("cng")) filters.fuelType = /cng/i;

  if (query.includes("suv")) filters.segment = /suv/i;
  else if (query.includes("sedan")) filters.segment = /sedan/i;
  else if (query.includes("hatchback")) filters.segment = /hatchback/i;
  else if (query.includes("mpv")) filters.segment = /mpv/i;

  const seatMatch = query.match(/(\d)\s*[- ]?seater/);
  if (seatMatch) filters.minSeating = parseInt(seatMatch[1]);

  if (query.includes("automatic") || query.includes("auto"))
    filters.transmissionHint = "Automatic";

  if (query.includes("mileage") || query.includes("long trips"))
    filters.sortBy = "mileage";
  else if (query.includes("cheap") || query.includes("budget"))
    filters.sortBy = "price";

  return filters;
}
