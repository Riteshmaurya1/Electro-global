const API_URL = "https://electro-global.onrender.com/api/cars";

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  searchBtn.addEventListener("click", () => searchCars());
  document.getElementById("queryInput").value =
    "Suggest a family SUV under 15 lakhs with good mileage";
  searchCars();
});

async function searchCars() {
  const input = document.getElementById("queryInput");
  const query = input.value.trim();

  if (!query) {
    alert("Please enter a query");
    return;
  }

  try {
    const response = await axios.post(
      `${API_URL}/search`,
      { query },
      { headers: { "Content-Type": "application/json" } },
    );

    const data = response.data;

    renderFilters(data);
    renderResults(data.cars || []);
  } catch (err) {
    console.error(err);
    document.getElementById("results").innerHTML =
      "<p>Something went wrong. Please try again.</p>";
  }
}

function renderFilters(data) {
  const container = document.getElementById("filters");
  container.innerHTML = "";

  const { useLLM, parsedFilters } = data;

  const badges = [];

  if (useLLM) {
    badges.push({
      label: "LLM",
      value: "Gemini parsed this query",
    });
  }

  if (parsedFilters) {
    const {
      fuelType,
      segment,
      budgetMax,
      minSeating,
      sortBy,
      brand,
      transmission,
    } = parsedFilters;

    if (fuelType) badges.push({ label: "Fuel", value: fuelType });
    if (segment) badges.push({ label: "Body", value: segment });
    if (budgetMax)
      badges.push({ label: "Max Budget", value: `${budgetMax} Lakhs` });
    if (minSeating)
      badges.push({ label: "Seats", value: `${minSeating}+ seater` });
    if (sortBy) badges.push({ label: "Sort", value: sortBy });
    if (brand) badges.push({ label: "Brand", value: brand });
    if (transmission)
      badges.push({ label: "Transmission", value: transmission });
  }

  if (!badges.length) return;

  badges.forEach((b) => {
    const el = document.createElement("span");
    el.className = "filter-badge";
    el.innerHTML = `<span>${b.label}:</span>${b.value}`;
    container.appendChild(el);
  });
}

function renderResults(cars) {
  const container = document.getElementById("results");

  if (!cars.length) {
    container.innerHTML = "<p>No cars found. Try another query.</p>";
    return;
  }

  container.innerHTML = cars
    .map((car) => {
      const featuresPreview =
        car.features && car.features.length
          ? car.features.slice(0, 5).join(", ")
          : "—";

      // image, if backend provides one; falls back to a placeholder
      const imageHtml = car.image
        ? `<img src="${car.image}" alt="${car.brand} ${car.model}" class="car-image" />`
        : "";

      return `
        <div class="car-card">
          ${imageHtml}
          <div class="car-header">
            <h3>${car.brand} ${car.model}</h3>
            <span>${car.segment}</span>
          </div>
          <div class="car-meta">
            <span>Starting ₹${car.priceMin} Lakhs</span>
            <span>Mileage: ${car.mileage} kmpl</span>
          </div>
          <div class="car-meta">
            <span>Fuel: ${car.fuelType}</span>
            <span>Launch: ${car.launchYear}</span>
          </div>
          <div class="features-list">
            <strong>Features:</strong> ${featuresPreview}
          </div>
        </div>
      `;
    })
    .join("");
}

window.searchCars = searchCars;
