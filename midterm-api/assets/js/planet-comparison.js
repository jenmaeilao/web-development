function populateComparisonSelects() {
  const selects = [$("#compare-1"), $("#compare-2"), $("#compare-3")];
  selects.forEach((select, index) => {
    select.innerHTML = `${index === 2 ? '<option value=\"\">None</option>' : ""}${planetData.map((p) => `<option value="${p.id}">${p.name}</option>`).join("")}`;
    select.value = index === 0 ? "earth" : index === 1 ? "mars" : "";
    select.addEventListener("change", updateComparisonOptions);
  });
  updateComparisonOptions();
  renderComparison(["earth", "mars"]);
}

function updateComparisonOptions() {
  const selects = [$("#compare-1"), $("#compare-2"), $("#compare-3")],
    chosen = selects.map((s) => s.value).filter(Boolean);
  selects.forEach((select) =>
    [...select.options].forEach((option) => {
      option.disabled = Boolean(
        option.value &&
          option.value !== select.value &&
          chosen.includes(option.value),
      );
    }),
  );
}

$("#compare-button").addEventListener("click", () => {
  const ids = [
    $("#compare-1").value,
    $("#compare-2").value,
    $("#compare-3").value,
  ].filter(Boolean);
  if (ids.length < 2 || new Set(ids).size !== ids.length) {
    $("#comparison-message").textContent =
      "Choose at least two different planets.";
    return;
  }
  $("#comparison-message").textContent = "";
  renderComparison(ids);
});
$("#compare-reset").addEventListener("click", () => {
  $("#compare-1").value = "earth";
  $("#compare-2").value = "mars";
  $("#compare-3").value = "";
  updateComparisonOptions();
  $("#comparison-message").textContent = "";
  renderComparison(["earth", "mars"]);
});

function renderComparison(ids) {
  const selectedPlanets = ids
    .map((id) => planetData.find((p) => p.id === id))
    .filter(Boolean);
  if (selectedPlanets.length < 2) return;
  const maxDiameter = Math.max(...selectedPlanets.map((p) => p.diameterKm));
  const metrics = [
    "diameterKm",
    "massKg",
    "distanceMillionKm",
    "gravity",
    "orbitalDays",
    "moons",
    "temperatureC",
  ];
  const extrema = Object.fromEntries(
    metrics.map((key) => [
      key,
      {
        max: Math.max(...selectedPlanets.map((p) => p[key])),
        min: Math.min(...selectedPlanets.map((p) => p[key])),
      },
    ]),
  );
  $("#comparison-results").innerHTML = selectedPlanets
    .map(
      (p) => `<article class="comparison-card">
    <div class="size-visual" title="Diameter shown to scale"><img src="${escapeHtml(p.image)}" alt="" style="width:${(p.diameterKm / maxDiameter) * 100}%"></div>
    <span class="scale-note">${Math.round((p.diameterKm / maxDiameter) * 100)}% of largest selected diameter</span><h2>${p.name}</h2>
    ${comparisonRow("Diameter", formatNumber(p.diameterKm) + " km", p.diameterKm === extrema.diameterKm.max ? "Largest" : p.diameterKm === extrema.diameterKm.min ? "Smallest" : "")}
    ${comparisonRow("Mass", p.massKg.toExponential(3) + " kg", p.massKg === extrema.massKg.max ? "Highest" : "")}
    ${comparisonRow("Distance from Sun", formatDistance(p.distanceMillionKm), p.distanceMillionKm === extrema.distanceMillionKm.max ? "Farthest" : p.distanceMillionKm === extrema.distanceMillionKm.min ? "Closest" : "")}
    ${comparisonRow("Gravity", p.gravity + " m/s²", p.gravity === extrema.gravity.max ? "Highest" : "")}
    ${comparisonRow("Orbital period", p.orbitalPeriod, p.orbitalDays === extrema.orbitalDays.max ? "Longest" : p.orbitalDays === extrema.orbitalDays.min ? "Shortest" : "")}
    ${comparisonRow("Rotation period", p.rotationPeriod, "")}${comparisonRow("Known moons", formatNumber(p.moons), p.moons === extrema.moons.max ? "Most" : "")}
    ${comparisonRow("Average temperature", p.temperatureC + " °C", p.temperatureC === extrema.temperatureC.max ? "Warmest" : p.temperatureC === extrema.temperatureC.min ? "Coldest" : "")}
  </article>`,
    )
    .join("");
}

function comparisonRow(label, value, badge) {
  return `<div class="comparison-row"><span>${label}</span><strong>${value}</strong>${badge ? `<small>${badge}</small>` : ""}</div>`;
}
