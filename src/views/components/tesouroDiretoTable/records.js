(() => {
  if (document.documentElement.dataset.ventureRecordsReady === "true") {
    return;
  }

  document.documentElement.dataset.ventureRecordsReady = "true";

  const BUTTON_SELECTOR = "button.venture-table__expand";

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest(BUTTON_SELECTOR);

    if (!button || button.disabled) {
      return;
    }

    const controls = button.getAttribute("aria-controls");
    const recordsRow = controls ? document.getElementById(controls) : null;

    if (!recordsRow) {
      return;
    }

    const expanded = button.getAttribute("aria-expanded") === "true";

    button.setAttribute("aria-expanded", String(!expanded));
    button.classList.toggle("venture-table__expand--open", !expanded);
    recordsRow.hidden = expanded;
  });
})();
