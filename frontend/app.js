// Change this to your Render backend URL
const API_URL = "https://electro-global.onrender.com/api/cars";

const limit = 10;
let currentPage = 1;
let lastQuery = "";

document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  searchBtn.addEventListener("click", () => searchCars(1));
  document.getElementById("queryInput").value =
    "Suggest a family SUV under 15 lakhs with good mileage";
  searchCars(1);
});

async function searchCars(page = 1) {
  const input = document.getElementById("queryInput");
  const query = input.value.trim();

  if (!query) {
    alert("Please enter a query");
    return;
  }

  lastQuery = query;

  try {
    const response = await axios.post(
      `${API_URL}/search?page=${page}&limit=${limit}`,
      { query },
      { headers: { "Content-Type": "application/json" } }
    );

    const data = response.data;
    currentPage = data.page || page;

    renderFilters(data);
    renderResults(data.cars || []);
    renderPagination(data);
  } catch (err) {
    console.error(err);
    document.getElementById("results").innerHTML =
      "<p>Something went wrong. Please try again.</p>";
    document.getElementById("pagination").innerHTML = "";
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
      const featuresPreview = car.notableFeatures
        ? car.notableFeatures.slice(0, 5).join(", ")
        : "—";

      return `
        <div class="car-card">
          <div class="car-header">
            <h3>${car.brand} ${car.model}</h3>
            <span>${car.segment}</span>
          </div>
          <div class="car-meta">
            <span>Price: ₹${car.priceMin} - ₹${car.priceMax} Lakhs</span>
            <span>Mileage: ${car.mileage}</span>
          </div>
          <div class="car-meta">
            <span>Fuel: ${car.fuelType}</span>
            <span>Launch: ${car.launchYear}</span>
            <span>Variants: ${car.variants}</span>
          </div>
          <div class="features-list">
            <strong>Features:</strong> ${featuresPreview}
          </div>
        </div>
      `;
    })
    .join("");
}

function renderPagination(meta) {
  const container = document.getElementById("pagination");
  const { page, totalPages, hasNextPage, hasPrevPage } = meta;

  if (!totalPages || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  container.innerHTML = `
    <button ${hasPrevPage ? "" : "disabled"}
      onclick="searchCars(${page - 1})">
      Prev
    </button>
    <span>Page ${page} of ${totalPages}</span>
    <button ${hasNextPage ? "" : "disabled"}
      onclick="searchCars(${page + 1})">
      Next
    </button>
  `;
}

// expose searchCars for inline onclick (Prev/Next buttons)
window.searchCars = searchCars;