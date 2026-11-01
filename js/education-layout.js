/* Give the fragrance guide cards a tidy, responsive content layout. */
(function () {
  const anatomyCard = document.querySelector(".anatomy-card");
  const lastingCard = document.querySelector(".lasting-card");

  function findSmallestGroup(card, phrases) {
    if (!card) return null;
    const candidates = Array.from(card.querySelectorAll("div, ul, ol"))
      .filter((element) => {
        const text = element.textContent.toLowerCase();
        return phrases.every((phrase) => text.includes(phrase.toLowerCase()));
      })
      .sort((a, b) => a.textContent.length - b.textContent.length);
    return candidates[0] || null;
  }

  function directChildWithin(element, container) {
    let current = element;
    while (current && current.parentElement && current.parentElement !== container) {
      current = current.parentElement;
    }
    return current && current.parentElement === container ? current : null;
  }

  if (anatomyCard) {
    const noteGroup = findSmallestGroup(anatomyCard, ["TOP", "HEART", "BASE"]);
    if (noteGroup) {
      noteGroup.classList.add("anatomy-note-flow");
      ["TOP", "HEART", "BASE"].forEach((label) => {
        const labelNode = Array.from(noteGroup.querySelectorAll("span, p, strong, b, small, div"))
          .filter((element) => {
            const text = element.textContent.trim();
            return text.length <= 28 && new RegExp(`\\b${label}\\b`, "i").test(text);
          })
          .sort((a, b) => a.textContent.length - b.textContent.length)[0];
        const row = labelNode && directChildWithin(labelNode, noteGroup);
        if (row) row.classList.add("anatomy-note-row");
      });
    }
  }

  if (lastingCard) {
    const titles = [
      "Start with moisturised skin",
      "Let it settle",
      "Store it somewhere cool",
      "Refresh gently"
    ];
    const tipGroup = findSmallestGroup(lastingCard, titles);
    if (tipGroup) {
      tipGroup.classList.add("longwear-tip-list");
      titles.forEach((title) => {
        const titleNode = Array.from(tipGroup.querySelectorAll("*"))
          .filter((element) => element.textContent.trim().toLowerCase().includes(title.toLowerCase()))
          .sort((a, b) => a.textContent.length - b.textContent.length)[0];
        const row = titleNode && directChildWithin(titleNode, tipGroup);
        if (row) row.classList.add("longwear-tip-item");
      });
    }
  }
})();
