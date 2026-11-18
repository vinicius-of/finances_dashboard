(() => {
  if (document.documentElement.dataset.registerSnapshotReady === "true") {
    return;
  }

  document.documentElement.dataset.registerSnapshotReady = "true";

  const MODAL_ID = "registerSnapshotModal";
  const TITLE_ID = "registerSnapshotModalTitle";
  const ENDPOINT = "/api/snapshots";
  const TRIGGER_SELECTOR = "[data-register-venture]";
  const EDIT_TRIGGER_SELECTOR = "[data-edit-snapshot]";
  const SUBMIT_SELECTOR = "[data-action='register']";
  const NEXT_SELECTOR = "[data-action='register-next']";
  const ROW_SELECTOR = "tr[data-venture-id]";
  const RELOAD_DELAY = 1200;
  const MODE_REGISTER = "register";
  const MODE_EDIT = "edit";

  const modalElement = () => document.getElementById(MODAL_ID);
  const formElement = () =>
    modalElement()?.querySelector(".register-snapshot__form");
  const ventureLabel = () => document.getElementById("registerSnapshotVenture");
  const titleElement = () => document.getElementById(TITLE_ID);
  const submitButton = () => formElement()?.querySelector(SUBMIT_SELECTOR);
  const nextButton = () => formElement()?.querySelector(NEXT_SELECTOR);
  const mode = () => formElement()?.dataset.mode ?? MODE_REGISTER;

  const today = () => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${now.getFullYear()}-${month}-${day}`;
  };

  const toAmountInput = (cents) => (Number(cents) / 100).toFixed(2);

  const setMode = (nextMode) => {
    const form = formElement();
    const title = titleElement();
    const submit = submitButton();
    const next = nextButton();
    const isEdit = nextMode === MODE_EDIT;

    if (form) {
      form.dataset.mode = nextMode;
      form.elements.type.disabled = isEdit;
    }

    if (title) {
      title.textContent = isEdit ? "Editar registro" : "Registrar";
    }

    if (submit) {
      submit.textContent = isEdit ? "Confirmar" : "Registrar";
    }

    if (next) {
      next.hidden = isEdit;
      next.disabled = isEdit;
    }
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
    form.elements.snapshotId.value = "";
    form.elements.type.value = "MONTHLY_RECORD";
    form.elements.referenceDate.value = today();
    form.elements.notes.value = "";
    setMode(MODE_REGISTER);
  };

  const fillEdit = (trigger) => {
    const form = formElement();

    if (!form) {
      return;
    }

    resetForm();
    fillVenture(trigger.dataset.ventureId, trigger.dataset.ventureName ?? "");

    form.elements.snapshotId.value = trigger.dataset.snapshotId ?? "";
    form.elements.type.value = trigger.dataset.snapshotType ?? "MONTHLY_RECORD";
    form.elements.value.value = toAmountInput(
      trigger.dataset.snapshotValue ?? 0,
    );
    form.elements.referenceDate.value = trigger.dataset.snapshotDate ?? today();
    form.elements.notes.value = trigger.dataset.snapshotNotes ?? "";

    setMode(MODE_EDIT);
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
    const editing = mode() === MODE_EDIT;
    const payload = {
      ventureId: form.elements.ventureId.value,
      value: Math.round(Number(form.elements.value.value) * 100),
      referenceDate: form.elements.referenceDate.value,
      notes: form.elements.notes.value.trim(),
    };

    return editing
      ? { ...payload, snapshotId: form.elements.snapshotId.value }
      : { ...payload, type: form.elements.type.value };
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

    const editing = mode() === MODE_EDIT;
    const payload = buildPayload();

    setBusy(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        window.AppToast.show({
          variant: "danger",
          message:
            body?.message ??
            (editing
              ? "Não foi possível atualizar o registro."
              : "Não foi possível registrar o snapshot."),
        });

        return;
      }

      window.AppToast.show({
        variant: "success",
        message: editing
          ? "Registro atualizado com sucesso."
          : "Registro salvo com sucesso.",
      });

      if (!editing && action === "register-next") {
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
        message: editing
          ? "Falha de conexão ao atualizar o registro."
          : "Falha de conexão ao registrar o snapshot.",
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

    const editTrigger = target.closest(EDIT_TRIGGER_SELECTOR);

    if (editTrigger) {
      event.preventDefault();
      fillEdit(editTrigger);
      bootstrap.Modal.getOrCreateInstance(modalElement()).show();

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

  modalElement()?.addEventListener("hidden.bs.modal", resetForm);
})();
