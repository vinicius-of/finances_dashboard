(() => {
  if (document.documentElement.dataset.newVentureReady === "true") {
    return;
  }

  document.documentElement.dataset.newVentureReady = "true";

  const MODAL_ID = "newVentureModal";
  const ENDPOINT = "/api/ventures";
  const TRIGGER_SELECTOR = "[data-new-venture]";
  const RELOAD_DELAY = 1200;

  const modalElement = () => document.getElementById(MODAL_ID);
  const formElement = () =>
    modalElement()?.querySelector(".new-venture__form");
  const field = (name) => formElement()?.elements.namedItem(name);

  const today = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${now.getFullYear()}-${month}-${day}`;
  };

  const selectedCategory = () => {
    const select = field("type");

    if (!(select instanceof HTMLSelectElement)) {
      return "FIXED";
    }

    return select.selectedOptions[0]?.dataset.category ?? "FIXED";
  };

  const applyCategory = () => {
    const category = selectedCategory();

    document
      .querySelectorAll(`#${MODAL_ID} [data-category-section]`)
      .forEach((section) => {
        const visible = section.dataset.categorySection === category;

        section.hidden = !visible;
        section.querySelectorAll("input, select, textarea").forEach((input) => {
          input.disabled = !visible;

          if (input.dataset.required === "true") {
            input.required = visible;
          }

          if (!visible) {
            input.value = "";
          }
        });
      });
  };

  const resetForm = () => {
    const form = formElement();

    if (!form) {
      return;
    }

    form.reset();

    const boughtAt = field("boughtAt");

    if (boughtAt instanceof HTMLInputElement) {
      boughtAt.value = today();
      boughtAt.max = today();
    }

    const type = field("type");

    if (type instanceof HTMLSelectElement) {
      type.selectedIndex = 0;
    }

    applyCategory();
  };

  const setBusy = (busy) => {
    formElement()
      ?.querySelectorAll("button[type='submit']")
      .forEach((button) => {
        button.disabled = busy;
      });
  };

  const moneyToCents = (value) => Math.round(Number(value) * 100);

  const buildPayload = () => {
    const fields = formElement().elements;
    const payload = {
      name: fields.namedItem("name").value.trim(),
      internalCode: fields.namedItem("internalCode").value.trim() || undefined,
      type: fields.namedItem("type").value,
      boughtAt: fields.namedItem("boughtAt").value,
    };

    if (selectedCategory() === "FIXED") {
      return {
        ...payload,
        expiresIn: fields.namedItem("expiresIn").value || undefined,
        initialValue: moneyToCents(fields.namedItem("initialValue").value),
        indexer: fields.namedItem("indexer").value,
        rate: Number(fields.namedItem("rate").value),
        source: fields.namedItem("source").value.trim(),
      };
    }

    return {
      ...payload,
      quantity: Number(fields.namedItem("quantity").value),
      unitPrice: moneyToCents(fields.namedItem("unitPrice").value),
    };
  };

  const send = async () => {
    const form = formElement();

    if (!form || !form.reportValidity()) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        window.AppToast?.show({
          variant: "danger",
          message: body?.message ?? "Não foi possível criar o investimento.",
        });

        return;
      }

      window.AppToast?.show({
        variant: "success",
        message: "Investimento criado com sucesso.",
      });

      bootstrap.Modal.getOrCreateInstance(modalElement()).hide();
      window.setTimeout(() => window.location.reload(), RELOAD_DELAY);
    } catch {
      window.AppToast?.show({
        variant: "danger",
        message: "Falha de conexão ao criar o investimento.",
      });
    } finally {
      setBusy(false);
    }
  };

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element) || !target.closest(TRIGGER_SELECTOR)) {
      return;
    }

    event.preventDefault();
    resetForm();
    bootstrap.Modal.getOrCreateInstance(modalElement()).show();
  });

  document.addEventListener("change", (event) => {
    if (event.target === field("type")) {
      applyCategory();
    }
  });

  document.addEventListener("submit", (event) => {
    const form = formElement();

    if (!form || event.target !== form) {
      return;
    }

    event.preventDefault();
    send();
  });
})();
