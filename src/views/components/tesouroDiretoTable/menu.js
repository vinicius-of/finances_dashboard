(() => {
  if (document.documentElement.dataset.ventureMenuReady === "true") {
    return;
  }

  document.documentElement.dataset.ventureMenuReady = "true";

  const MENU_SELECTOR = "details.venture-table__menu";

  const closeMenu = (menu) => {
    if (menu.open) {
      menu.open = false;
    }
  };

  const menuFromEvent = (event) => {
    const target = event.target;

    return target instanceof Element ? target.closest(MENU_SELECTOR) : null;
  };

  document.addEventListener("pointerdown", (event) => {
    document.querySelectorAll(MENU_SELECTOR).forEach((menu) => {
      if (!menu.contains(event.target)) {
        closeMenu(menu);
      }
    });
  });

  document.addEventListener("focusout", (event) => {
    const menu = menuFromEvent(event);

    if (!menu) {
      return;
    }

    const next = event.relatedTarget;

    if (next instanceof Node && menu.contains(next)) {
      return;
    }

    closeMenu(menu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
      return;
    }

    document.querySelectorAll(MENU_SELECTOR).forEach(closeMenu);
  });
})();
