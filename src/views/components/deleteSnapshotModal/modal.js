(() => {
  if (document.documentElement.dataset.deleteSnapshotReady === "true") {
    return;
  }

  document.documentElement.dataset.deleteSnapshotReady = "true";

  const MODAL_ID = "deleteSnapshotModal";
  const ENDPOINT = "/api/snapshots";
  const TRIGGER_SELECTOR = "[data-delete-snapshot]";
  const CONFIRM_SELECTOR = "[data-action='delete']";
  const RELOAD_DELAY = 1200;

  const modalElement = () => document.getElementById(MODAL_ID);
  const metaElement = () => document.getElementById("deleteSnapshotMeta");
  const confirmButton = () => modalElement()?.querySelector(CONFIRM_SELECTOR);

  const setBusy = (busy) => {
    const button = confirmButton();

    if (button) {
      button.disabled = busy;
    }
  };

  const clearState = () => {
    const modal = modalElement();
    const meta = metaElement();

    if (modal) {
      delete modal.dataset.ventureId;
      delete modal.dataset.snapshotId;
    }

    if (meta) {
      meta.textContent = "";
    }
  };

  const open = (trigger) => {
    const modal = modalElement();
    const meta = metaElement();

    if (!modal) {
      return;
    }

    modal.dataset.ventureId = trigger.dataset.ventureId ?? "";
    modal.dataset.snapshotId = trigger.dataset.snapshotId ?? "";

    if (meta) {
      meta.textContent = trigger.dataset.snapshotDate
        ? `Registro de ${trigger.dataset.snapshotDate}.`
        : "";
    }

    bootstrap.Modal.getOrCreateInstance(modal).show();
  };

  const send = async () => {
    const modal = modalElement();

    if (!modal) {
      return;
    }

    setBusy(true);

    try {
      const response = await fetch(ENDPOINT, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ventureId: modal.dataset.ventureId,
          snapshotId: modal.dataset.snapshotId,
        }),
      });
      const body = await response.json().catch(() => null);

      if (!response.ok) {
        window.AppToast.show({
          variant: "danger",
          message: body?.message ?? "Não foi possível excluir o registro.",
        });

        return;
      }

      window.AppToast.show({
        variant: "success",
        message: "Registro excluído com sucesso.",
      });

      bootstrap.Modal.getOrCreateInstance(modal).hide();
      window.setTimeout(() => window.location.reload(), RELOAD_DELAY);
    } catch {
      window.AppToast.show({
        variant: "danger",
        message: "Falha de conexão ao excluir o registro.",
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

    if (trigger) {
      event.preventDefault();
      open(trigger);

      return;
    }

    if (target.closest(CONFIRM_SELECTOR)) {
      event.preventDefault();
      send();
    }
  });

  modalElement()?.addEventListener("hidden.bs.modal", clearState);
})();
