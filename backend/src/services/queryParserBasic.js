export function parseQueryBasic(q) {
  const query = q.toLowerCase();
  const filters = {};

  const budgetMatch = query.match(
    /(under|below|less than)\s*(\d+(\.\d+)?)\s*(lakh|lakhs|l)?/,
  );
  if (budgetMatch) filters.budgetMax = parseFloat(budgetMatch[2]);

  if (query.includes("diesel")) filters.fuelType = "diesel";
  else if (query.includes("petrol")) filters.fuelType = "petrol";
  else if (query.includes("electric") || query.includes(" ev "))
    filters.fuelType = "electric";
  else if (query.includes("cng")) filters.fuelType = "cng";

  if (query.includes("suv")) filters.segment = "suv";
  else if (query.includes("sedan")) filters.segment = "sedan";
  else if (query.includes("hatchback")) filters.segment = "hatchback";
  else if (query.includes("mpv")) filters.segment = "mpv";

  const seatMatch = query.match(/(\d)\s*[- ]?seater/);
  if (seatMatch) filters.minSeating = parseInt(seatMatch[1]);

  if (query.includes("automatic") || query.includes("auto"))
    filters.transmissionHint = "Automatic";

  if (query.includes("mileage") || query.includes("long trips"))
    filters.sortBy = "mileage";
  else if (query.includes("cheap") || query.includes("budget"))
    filters.sortBy = "price";

  console.log("Basic parser filters:", filters);
  return filters;
}
