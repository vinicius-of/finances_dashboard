(() => {
  if (document.documentElement.dataset.appToastReady === "true") {
    return;
  }

  document.documentElement.dataset.appToastReady = "true";

  const DURATION = 4000;
  const EXIT_DURATION = 200;

  const ensureStack = () => {
    const current = document.getElementById("toastStack");

    if (current) {
      return current;
    }

    const stack = document.createElement("div");

    stack.id = "toastStack";
    stack.className = "toast-stack";
    stack.setAttribute("aria-live", "polite");
    document.body.append(stack);

    return stack;
  };

  const dismiss = (element) => {
    element.classList.remove("toast-item--visible");
    window.setTimeout(() => element.remove(), EXIT_DURATION);
  };

  const show = ({ variant = "success", message = "" }) => {
    if (!message) {
      return;
    }

    const stack = ensureStack();
    const element = document.createElement("div");

    element.className = `toast-item toast-item--${variant}`;
    element.setAttribute("role", "status");
    element.textContent = message;
    stack.append(element);

    window.requestAnimationFrame(() =>
      element.classList.add("toast-item--visible"),
    );
    window.setTimeout(() => dismiss(element), DURATION);
  };

  window.AppToast = { show };
})();
