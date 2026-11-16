(() => {
  if (document.documentElement.dataset.registerSnapshotReady === "true") {
    return;
  }

  document.documentElement.dataset.registerSnapshotReady = "true";

  const MODAL_ID = "registerSnapshotModal";
  const ENDPOINT = "/api/snapshots";
  const TRIGGER_SELECTOR = "[data-register-venture]";
  const ROW_SELECTOR = "tr[data-venture-id]";
  const RELOAD_DELAY = 1200;

  const modalElement = () => document.getElementById(MODAL_ID);
  const formElement = () =>
    modalElement()?.querySelector(".register-snapshot__form");
  const ventureLabel = () => document.getElementById("registerSnapshotVenture");

  const today = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${now.getFullYear()}-${month}-${day}`;
  };

  const fillVenture = (id, name) => {
    const form = formElement();
    const label = ventureLabel();

    if (form) {
      form.elements.ventureId.value = id ?? "";
    }

    if (label) {
      label.textContent = name ?? "";
    }
  };

  const resetForm = () => {
    const form = formElement();

    if (!form) {
      return;
    }

    form.reset();
    form.elements.type.value = "MONTHLY_RECORD";
    form.elements.referenceDate.value = today();
    form.elements.notes.value = "";
  };

  const tableRows = () => [...document.querySelectorAll(ROW_SELECTOR)];

  const nextVenture = (currentId) => {
    const rows = tableRows();
    const index = rows.findIndex((row) => row.dataset.ventureId === currentId);
    const next = rows[index + 1];

    return next
      ? { id: next.dataset.ventureId, name: next.dataset.ventureName }
      : null;
  };

  const setBusy = (busy) => {
    formElement()
      ?.querySelectorAll("button[type='submit']")
      .forEach((button) => {
        button.disabled = busy;
      });
  };

  const buildPayload = () => {
    const form = formElement();

    return {
      ventureId: form.elements.ventureId.value,
      type: form.elements.type.value,
      value: Math.round(Number(form.elements.value.value) * 100),
      referenceDate: form.elements.referenceDate.value,
      notes: form.elements.notes.value.trim() || undefined,
    };
  };

  const reloadWithToast = () => {
    const modal = bootstrap.Modal.getOrCreateInstance(modalElement());

    modal.hide();
    window.setTimeout(() => window.location.reload(), RELOAD_DELAY);
  };

  const send = async (action) => {
    const form = formElement();

    if (!form || !form.reportValidity()) {
      return;
    }

    const payload = buildPayload();

    setBusy(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        window.AppToast.show({
          variant: "danger",
          message: body?.message ?? "Não foi possível registrar o snapshot.",
        });

        return;
      }

      window.AppToast.show({
        variant: "success",
        message: "Registro salvo com sucesso.",
      });

      if (action === "register-next") {
        const next = nextVenture(payload.ventureId);

        if (next) {
          resetForm();
          fillVenture(next.id, next.name);

          return;
        }
      }

      reloadWithToast();
    } catch {
      window.AppToast.show({
        variant: "danger",
        message: "Falha de conexão ao registrar o snapshot.",
      });
    } finally {
      setBusy(false);
    }
  };

  document.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const trigger = target.closest(TRIGGER_SELECTOR);

    if (!trigger) {
      return;
    }

    event.preventDefault();
    resetForm();
    fillVenture(trigger.dataset.registerVenture, trigger.dataset.ventureName);
    bootstrap.Modal.getOrCreateInstance(modalElement()).show();
  });

  document.addEventListener("submit", (event) => {
    const form = formElement();

    if (!form || event.target !== form) {
      return;
    }

    event.preventDefault();

    const action =
      event.submitter?.dataset.action === "register-next"
        ? "register-next"
        : "register";

    send(action);
  });
})();
