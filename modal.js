// ════════════════════════════
//  Modal Utilities
// ════════════════════════════
const _modalRegistry = new Map();

function getModalElement(id) {
  return document.getElementById(id);
}

function openModal(id) {
  const modal = getModalElement(id);
  if (!modal) return;
  modal.classList.add("show");
}

function closeModal(id) {
  const modal = getModalElement(id);
  if (!modal) return;
  modal.classList.remove("show");
  const entry = _modalRegistry.get(id);
  if (entry && typeof entry.onClose === "function") entry.onClose();
}

function closeAllModals() {
  document.querySelectorAll(".modal-overlay.show").forEach((el) => {
    closeModal(el.id);
  });
}

function initModal(options) {
  const { id, closeOnBackdrop = true, closeOnEscape = true, onClose } = options;
  const modal = getModalElement(id);
  if (!modal) return;

  _modalRegistry.set(id, { onClose });

  if (closeOnBackdrop && !modal.dataset.backdropBound) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal(id);
    });
    modal.dataset.backdropBound = "true";
  }

  if (closeOnEscape && !document.body.dataset.modalEscBound) {
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const topModal = Array.from(document.querySelectorAll(".modal-overlay.show")).pop();
      if (topModal) closeModal(topModal.id);
    });
    document.body.dataset.modalEscBound = "true";
  }
}

function _resolveTarget(container, selectorOrEl) {
  if (!selectorOrEl) return null;
  if (typeof selectorOrEl === "string") return container.querySelector(selectorOrEl);
  return selectorOrEl;
}

function createModalComponent(options) {
  const { id, selectors = {} } = options || {};
  const getRoot = () => getModalElement(id);
  const getEl = (name, fallback) => {
    const root = getRoot();
    if (!root) return null;
    return _resolveTarget(root, selectors[name] || fallback);
  };

  return {
    id,
    open() {
      openModal(id);
    },
    close() {
      closeModal(id);
    },
    getRoot,
    getTitleEl() {
      return getEl("title", ".modal-title");
    },
    getBodyEl() {
      return getEl("body", ".modal-body");
    },
    setTitle(value, { html = false } = {}) {
      const el = this.getTitleEl();
      if (!el) return;
      if (html) el.innerHTML = value ?? "";
      else el.textContent = value ?? "";
    },
    setBody(value, { html = false } = {}) {
      const el = this.getBodyEl();
      if (!el) return;
      if (html) el.innerHTML = value ?? "";
      else el.textContent = value ?? "";
    },
  };
}
