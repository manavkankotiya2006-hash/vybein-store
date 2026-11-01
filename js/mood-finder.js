/* Replace the application illustration with a small, interactive scent finder. */
(function () {
  const applicationCard = document.querySelector(".education-grid .application-card");
  if (!applicationCard) return;

  const moodMatches = {
    fresh: {
      label: "Fresh",
      products: [
        { id: 5, code: "R-HWS", inspiredBy: "Hawas" },
        { id: 7, code: "D-SVG", inspiredBy: "Sauvage" },
        { id: 6, code: "V-ERS", inspiredBy: "Eros" }
      ]
    },
    warm: {
      label: "Warm",
      products: [
        { id: 1, code: "L-KHM", inspiredBy: "Khamrah" },
        { id: 8, code: "A-SWY", inspiredBy: "Stronger With You" },
        { id: 3, code: "AJ-AW", inspiredBy: "Amber Wood" }
      ]
    },
    fruity: {
      label: "Fruity",
      products: [
        { id: 2, code: "C-AVT", inspiredBy: "Creed Aventus" },
        { id: 5, code: "R-HWS", inspiredBy: "Hawas" },
        { id: 6, code: "V-ERS", inspiredBy: "Eros" }
      ]
    },
    woody: {
      label: "Woody",
      products: [
        { id: 4, code: "TF-OW", inspiredBy: "Oud Wood" },
        { id: 2, code: "C-AVT", inspiredBy: "Creed Aventus" },
        { id: 3, code: "AJ-AW", inspiredBy: "Amber Wood" }
      ]
    }
  };

  const moodCard = document.createElement("article");
  moodCard.className = "education-card mood-finder-card";
  moodCard.innerHTML = `
    <p class="mood-finder-kicker">02 · YOUR MOOD</p>
    <h3 class="mood-finder-title">Find Your Scent Mood</h3>
    <p class="mood-finder-intro">Choose the feeling you want your fragrance to leave. We’ll point you toward a scent to explore.</p>
    <div class="mood-choice-grid" role="group" aria-label="Choose a fragrance mood">
      <button class="mood-choice" type="button" data-mood="fresh" aria-pressed="false">
        <span class="mood-choice-name">Fresh</span>
        <span class="mood-choice-hint">Bright, clean and uplifting</span>
      </button>
      <button class="mood-choice" type="button" data-mood="warm" aria-pressed="false">
        <span class="mood-choice-name">Warm</span>
        <span class="mood-choice-hint">Spiced, smooth and comforting</span>
      </button>
      <button class="mood-choice" type="button" data-mood="fruity" aria-pressed="false">
        <span class="mood-choice-name">Fruity</span>
        <span class="mood-choice-hint">Juicy, vibrant and expressive</span>
      </button>
      <button class="mood-choice" type="button" data-mood="woody" aria-pressed="false">
        <span class="mood-choice-name">Woody</span>
        <span class="mood-choice-hint">Rich, deep and quietly elegant</span>
      </button>
    </div>
    <div class="mood-result" aria-live="polite" hidden>
      <div class="mood-result-topline">
        <span class="mood-result-label"></span>
        <button class="mood-result-clear" type="button">Choose again</button>
      </div>
      <div class="mood-match-list"></div>
    </div>
  `;

  applicationCard.replaceWith(moodCard);

  const choices = moodCard.querySelectorAll("[data-mood]");
  const result = moodCard.querySelector(".mood-result");
  const resultLabel = moodCard.querySelector(".mood-result-label");
  const matchList = moodCard.querySelector(".mood-match-list");
  const clearButton = moodCard.querySelector(".mood-result-clear");

  function showMatches(moodKey) {
    const selection = moodMatches[moodKey];
    if (!selection) return;

    choices.forEach((choice) => {
      choice.setAttribute("aria-pressed", String(choice.dataset.mood === moodKey));
    });

    resultLabel.textContent = `${selection.label} scents to explore`;
    matchList.replaceChildren();

    selection.products.forEach((product) => {
      const link = document.createElement("a");
      link.className = "mood-match";
      link.href = `product.html?id=${product.id}`;
      link.innerHTML = `
        <span>
          <span class="mood-match-code">${product.code}</span>
          <span class="mood-match-inspired">Inspired by ${product.inspiredBy}</span>
        </span>
        <span class="mood-match-price">₹899&nbsp;↗</span>
      `;
      matchList.append(link);
    });

    result.hidden = false;
  }

  choices.forEach((choice) => {
    choice.addEventListener("click", () => showMatches(choice.dataset.mood));
  });

  clearButton.addEventListener("click", () => {
    choices.forEach((choice) => choice.setAttribute("aria-pressed", "false"));
    result.hidden = true;
    matchList.replaceChildren();
  });
})();
