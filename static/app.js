/*
  Este es el único archivo JavaScript de TechPay.

  La aplicación se desarrolla con baby steps: cada funcionalidad se agrega,
  prueba y explica antes de comenzar la siguiente.
*/

/*
  querySelector conecta JavaScript con un elemento del HTML.
  Guardamos cada elemento que vamos a modificar para no repetir la búsqueda.
*/
const balanceTitle = document.querySelector("#balance-title");
const balanceUsd = document.querySelector("#balance-usd");
const toggleBalanceButton = document.querySelector("#toggle-balance");
const privacyIcon = document.querySelector("#privacy-icon");
const copyAliasButton = document.querySelector("#copy-alias");
const toast = document.querySelector("#toast");
const operationModal = document.querySelector("#operation-modal");
const operationForm = document.querySelector("#operation-form");
const modalTitle = document.querySelector("#modal-title");
const modalEyebrow = document.querySelector("#modal-eyebrow");
const operationDetail = document.querySelector("#operation-detail");
const closeModalButton = document.querySelector("#close-modal");
const operationAmount = document.querySelector("#operation-amount");
const formError = document.querySelector("#form-error");
const movementList = document.querySelector("#movements-list");
const movementSearch = document.querySelector("#movement-search");
const noMovements = document.querySelector("#no-movements");
const filterButtons = document.querySelectorAll("[data-filter]");
const contactsList = document.querySelector("#contacts-list");
const contactModal = document.querySelector("#contact-modal");
const contactForm = document.querySelector("#contact-form");
const contactName = document.querySelector("#contact-name");
const contactAlias = document.querySelector("#contact-alias");
const contactFormError = document.querySelector("#contact-form-error");
const closeContactModalButton = document.querySelector("#close-contact-modal");
const servicesList = document.querySelector("#services-list");
const pendingServicesCount = document.querySelector("#pending-services-count");
const receiptModal = document.querySelector("#receipt-modal");
const closeReceiptModalButton = document.querySelector("#close-receipt-modal");
const receiptAmount = document.querySelector("#receipt-amount");
const receiptDescription = document.querySelector("#receipt-description");
const receiptId = document.querySelector("#receipt-id");
const dollarBuy = document.querySelector("#dollar-buy");
const dollarSell = document.querySelector("#dollar-sell");
const exchangeStatus = document.querySelector("#exchange-status");
const conversionHelp = document.querySelector("#conversion-help");

/*
  Esta variable representa un pequeño estado de la interfaz.
  El saldo real no cambia: solamente cambia la forma de mostrarlo.
*/
let balanceIsHidden = false;

/*
  Este objeto reúne los datos que sí pueden cambiar durante el uso de la app.
  Separar los datos de la interfaz permite actualizar el DOM después de cada operación.
*/
const wallet = {
  balanceARS: 125000.5,
  balanceUSD: 102.46,
  transactions: [],
  contacts: [],
  services: []
};

let selectedMovementFilter = "all";

/* Estos valores permiten que la calculadora funcione incluso antes de consultar la API. */
const exchangeRate = {
  buy: 1180,
  sell: 1220
};

/*
  El estado inicial ahora llega desde Flask y SQLite.
  fetch devuelve una promesa porque la respuesta del servidor es asíncrona.
*/
async function loadWalletFromServer() {
  const response = await fetch("/api/wallet");
  if (!response.ok) throw new Error("No se pudo cargar la billetera");

  const data = await response.json();
  wallet.balanceARS = data.balanceARS;
  wallet.balanceUSD = data.balanceUSD;
  wallet.contacts = data.contacts;
  wallet.transactions = data.transactions;
  wallet.services = data.services;

  /* Quitamos la lista estática antes de dibujar los registros de SQLite. */
  movementList.innerHTML = "";
  renderContacts();
  renderServices();
  wallet.transactions.forEach((transaction) => addMovement(transaction));
  updateBalance();
  filterMovements();
}

/* localStorage solo guarda texto, por eso convertimos el array con JSON.stringify. */
function saveWallet() {
  localStorage.setItem("techpay_saldo_ars", String(wallet.balanceARS));
  localStorage.setItem("techpay_saldo_usd", String(wallet.balanceUSD));
  localStorage.setItem("techpay_transacciones", JSON.stringify(wallet.transactions));
  localStorage.setItem("techpay_contactos", JSON.stringify(wallet.contacts));
  localStorage.setItem("techpay_servicios", JSON.stringify(wallet.services));
}

/* Si todavía no hay contactos guardados, la aplicación comienza con datos de ejemplo. */
function loadContacts() {
  const defaultContacts = [
    { id: 1, name: "Lucas", alias: "lucas.dev", color: "a1" },
    { id: 2, name: "Camila", alias: "camila.ui", color: "a2" },
    { id: 3, name: "Mateo", alias: "mateo.design", color: "a3" },
    { id: 4, name: "Sofía", alias: "sofia.crea", color: "a4" }
  ];
  const savedContacts = localStorage.getItem("techpay_contactos");

  if (!savedContacts) {
    wallet.contacts = defaultContacts;
    return;
  }

  try {
    const parsedContacts = JSON.parse(savedContacts);
    wallet.contacts = Array.isArray(parsedContacts) ? parsedContacts : defaultContacts;
  } catch (error) {
    wallet.contacts = defaultContacts;
    showToast("No pudimos recuperar los contactos");
  }
}

/* Los servicios también forman parte del estado porque pueden pasar a "pagado". */
function loadServices() {
  const defaultServices = [
    { id: "electricity", name: "Energía Sur", due: "Vence el 22 Sep", amount: 18500, icon: "⚡", color: "electricity", paid: false },
    { id: "internet", name: "FibraNet", due: "Vence el 25 Sep", amount: 12400, icon: "◉", color: "internet", paid: false },
    { id: "phone", name: "Celular Móvil", due: "Vence el 28 Sep", amount: 8900, icon: "⌁", color: "phone", paid: false }
  ];
  const savedServices = localStorage.getItem("techpay_servicios");

  if (!savedServices) {
    wallet.services = defaultServices;
    return;
  }

  try {
    const parsedServices = JSON.parse(savedServices);
    wallet.services = Array.isArray(parsedServices) ? parsedServices : defaultServices;
  } catch (error) {
    wallet.services = defaultServices;
    showToast("No pudimos recuperar los servicios");
  }
}

/* Centralizar el formato evita repetir la misma configuración regional. */
function formatMoney(amount) {
  return `$ ${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

/* Renderizar significa llevar un dato del estado hacia un elemento visual. */
function renderExchangeRate() {
  dollarBuy.textContent = formatMoney(exchangeRate.buy);
  dollarSell.textContent = formatMoney(exchangeRate.sell);
}

/*
  fetch solicita información a un servidor externo.
  async/await permite esperar la respuesta sin detener toda la interfaz.
*/
async function loadExchangeRate() {
  exchangeStatus.textContent = "Actualizando...";

  try {
    const response = await fetch("https://dolarapi.com/v1/dolares/oficial");
    if (!response.ok) throw new Error("No se pudo consultar la cotización");

    const data = await response.json();
    exchangeRate.buy = Number(data.compra) || exchangeRate.buy;
    exchangeRate.sell = Number(data.venta) || exchangeRate.sell;
    exchangeStatus.textContent = "Actualizado ahora";
  } catch (error) {
    exchangeStatus.textContent = "Cotización de referencia";
  }

  renderExchangeRate();
}

/* Reconstruimos la lista para que el estado pagado se refleje en todos sus controles. */
function renderServices() {
  servicesList.innerHTML = "";
  let pendingCount = 0;

  wallet.services.forEach((service) => {
    const item = document.createElement("article");
    item.className = "service-item";
    item.dataset.serviceId = service.id;

    const logo = document.createElement("span");
    logo.className = `service-logo service-${service.color}`;
    logo.textContent = service.icon;

    const copy = document.createElement("span");
    copy.className = "service-copy";
    const name = document.createElement("strong");
    name.textContent = service.name;
    const due = document.createElement("small");
    due.textContent = service.paid ? "Pagado" : service.due;
    copy.append(name, due);

    const action = document.createElement("span");
    action.className = "service-action";
    const amount = document.createElement("strong");
    amount.textContent = formatMoney(service.amount);
    const button = document.createElement("button");
    button.className = "small-button pay-service";
    button.type = "button";
    button.dataset.serviceId = service.id;
    button.textContent = service.paid ? "Pagado" : "Pagar";
    button.disabled = service.paid;
    action.append(amount, button);

    item.append(logo, copy, action);
    servicesList.appendChild(item);
    if (!service.paid) pendingCount += 1;
  });

  pendingServicesCount.textContent = pendingCount;
}

/* Pagar un servicio modifica saldo, servicio, historial y persistencia como una sola operación. */
async function payService(serviceId) {
  const service = wallet.services.find((item) => item.id === serviceId);
  if (!service || service.paid) return;

  try {
    /* El servidor valida saldo y modifica las tres tablas relacionadas. */
    const response = await fetch(`/api/services/${serviceId}/pay`, {
      method: "POST"
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo pagar el servicio");
    }

    /* Aplicamos la respuesta de SQLite al estado que ya está dibujado. */
    wallet.balanceARS = data.balanceARS;
    service.paid = data.service.paid;
    wallet.transactions.unshift(data.transaction);
    addMovement(data.transaction);
    renderServices();
    updateBalance();
    showToast("Servicio pagado correctamente");
  } catch (error) {
    showToast(error.message);
  }
}

/* El comprobante lee el movimiento seleccionado, no crea una operación nueva. */
function openReceipt(movement) {
  const amountText = movement.querySelector(".movement-amount").textContent;
  receiptAmount.textContent = amountText;
  receiptDescription.textContent = movement.dataset.description;
  receiptId.textContent = `TP-${movement.dataset.movementId}`;
  receiptModal.classList.remove("is-hidden");
}

function closeReceipt() {
  receiptModal.classList.add("is-hidden");
}

/* El listado se genera desde el array para incluir también contactos creados por el usuario. */
function renderContacts() {
  contactsList.innerHTML = "";

  wallet.contacts.forEach((contact) => {
    const button = document.createElement("button");
    button.className = "contact-card";
    button.type = "button";
    button.dataset.contactId = contact.id;
    button.dataset.contactName = contact.name;
    button.dataset.contactAlias = contact.alias;

    const avatar = document.createElement("span");
    avatar.className = `contact-avatar avatar-${contact.color}`;
    avatar.textContent = contact.name.charAt(0).toUpperCase();

    const name = document.createElement("strong");
    name.textContent = contact.name;
    const alias = document.createElement("small");
    alias.textContent = contact.alias;
    button.append(avatar, name, alias);
    contactsList.appendChild(button);
  });

  const addButton = document.createElement("button");
  addButton.className = "contact-card contact-add";
  addButton.id = "add-contact";
  addButton.type = "button";
  addButton.innerHTML = '<span class="contact-avatar">+</span><strong>Nuevo</strong><small>Contacto</small>';
  contactsList.appendChild(addButton);
}

/*
  Muestra un mensaje temporal en la interfaz.
  setTimeout ejecuta una función después de una cantidad de milisegundos.
*/
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");

  setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 1800);
}

/*
  Alternar significa pasar de un estado a otro.
  Si el saldo está visible, mostramos puntos; si está oculto, recuperamos los textos.
*/
function toggleBalanceVisibility() {
  balanceIsHidden = !balanceIsHidden;

  if (balanceIsHidden) {
    balanceTitle.textContent = "$ ••••••••";
    balanceUsd.textContent = "USD ••••••";
    privacyIcon.textContent = "○";
    toggleBalanceButton.setAttribute("aria-label", "Mostrar saldo");
    toggleBalanceButton.setAttribute("aria-pressed", "true");
  } else {
    updateBalance();
    privacyIcon.textContent = "◉";
    toggleBalanceButton.setAttribute("aria-label", "Ocultar saldo");
    toggleBalanceButton.setAttribute("aria-pressed", "false");
  }
}

/*
  Clipboard API permite copiar texto sin que el usuario tenga que seleccionarlo.
  La interfaz avisa cuando la acción terminó correctamente.
*/
async function copyAlias() {
  const alias = copyAliasButton.dataset.copyValue;

  try {
    await navigator.clipboard.writeText(alias);
    showToast("¡Alias copiado!");
  } catch (error) {
    showToast("No se pudo copiar el alias");
  }
}

/*
  Un mismo modal sirve para varias operaciones.
  dataset.operation identifica qué tarjeta abrió la ventana.
*/
/* Un solo modal cambia sus textos según la operación que lo abrió. */
function openOperationModal(operation) {
  const operationNames = {
    income: "Ingresar dinero",
    transfer: "Transferir dinero",
    currency: "Comprar dólares"
  };

  modalTitle.textContent = operationNames[operation];
  modalEyebrow.textContent = operation === "transfer" ? "Nueva transferencia" : "Nueva operación";
  operationDetail.placeholder = operation === "transfer" ? "Alias o descripción del destinatario" : "Ej: Dinero recibido";
  operationAmount.previousElementSibling.textContent = operation === "currency" ? "Pesos a convertir" : "Monto";
  conversionHelp.classList.toggle("is-hidden", operation !== "currency");
  conversionHelp.textContent = operation === "currency" ? "Recibirías aproximadamente USD 0,00." : "";
  operationModal.dataset.operation = operation;
  operationModal.classList.remove("is-hidden");
  document.querySelector("#operation-amount").focus();
}

function closeOperationModal() {
  operationModal.classList.add("is-hidden");
  operationForm.reset();
  conversionHelp.classList.add("is-hidden");
  operationAmount.previousElementSibling.textContent = "Monto";
  formError.textContent = "";
  formError.classList.add("is-hidden");
}

/* Cada cambio de saldo debe reflejarse en los dos importes visibles. */
function updateBalance() {
  if (balanceIsHidden) return;

  balanceTitle.textContent = `$ ${wallet.balanceARS.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
  balanceUsd.textContent = `≈ USD ${wallet.balanceUSD.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;
}

/*
  Crea un movimiento con elementos del DOM en lugar de concatenar HTML.
  textContent trata la descripción como texto y evita interpretarla como código.
*/
function addMovement({ description, amount, type }) {
  const movement = document.createElement("button");
  movement.className = "movement-item";
  movement.type = "button";
  movement.dataset.type = type;
  movement.dataset.description = description;
  movement.dataset.movementId = Date.now();

  const icon = document.createElement("span");
  const movementClass = type === "income" ? "movement-income" : type === "currency" ? "movement-currency" : "movement-transfer";
  icon.className = `movement-icon ${movementClass}`;
  icon.textContent = type === "income" ? "↓" : type === "currency" ? "$" : "↗";

  const copy = document.createElement("span");
  copy.className = "movement-copy";
  const title = document.createElement("strong");
  title.textContent = description;
  const details = document.createElement("small");
  details.textContent = "Ahora · Operación";
  copy.append(title, details);

  const amountElement = document.createElement("span");
  amountElement.className = `movement-amount ${type === "income" ? "amount-income" : "amount-expense"}`;
  const sign = type === "income" ? "+" : "−";
  const currency = type === "currency" ? "USD " : "$ ";
  amountElement.textContent = `${sign} ${currency}${amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}`;

  movement.append(icon, copy, amountElement);
  movementList.prepend(movement);
  filterMovements();
}

/*
  Una tarjeta debe cumplir las dos condiciones para permanecer visible:
  coincidir con la pestaña elegida y con el texto buscado.
*/
/* El filtro combina dos condiciones: pestaña seleccionada y texto de búsqueda. */
function filterMovements() {
  const searchTerm = movementSearch.value.toLowerCase().trim();
  const movements = movementList.querySelectorAll(".movement-item");
  let visibleMovements = 0;

  movements.forEach((movement) => {
    const matchesFilter = selectedMovementFilter === "all" || movement.dataset.type === selectedMovementFilter;
    const matchesSearch = movement.dataset.description.toLowerCase().includes(searchTerm);
    const shouldShow = matchesFilter && matchesSearch;

    movement.classList.toggle("is-hidden", !shouldShow);
    if (shouldShow) visibleMovements += 1;
  });

  noMovements.classList.toggle("is-hidden", visibleMovements > 0);
}

/* Los errores se muestran junto al formulario para que la persona sepa cómo corregirlos. */
function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove("is-hidden");
}

/*
  Delegación de eventos: el contenedor escucha también los botones creados después.
  Así no necesitamos registrar un evento nuevo cada vez que aparece un contacto.
*/
contactsList.addEventListener("click", (event) => {
  const contact = event.target.closest("[data-contact-id]");
  const addContactButton = event.target.closest("#add-contact");

  if (contact) {
    openOperationModal("transfer");
    operationDetail.value = contact.dataset.contactAlias;
  }

  if (addContactButton) {
    contactModal.classList.remove("is-hidden");
    contactName.focus();
  }
});

/* La delegación permite que el mismo listener funcione después de renderServices. */
servicesList.addEventListener("click", (event) => {
  const button = event.target.closest(".pay-service");
  if (button) payService(button.dataset.serviceId);
});

/* Los movimientos iniciales y los nuevos comparten el mismo comportamiento. */
movementList.addEventListener("click", (event) => {
  const movement = event.target.closest(".movement-item");
  if (movement) openReceipt(movement);
});

closeReceiptModalButton.addEventListener("click", closeReceipt);
receiptModal.addEventListener("click", (event) => {
  if (event.target === receiptModal) closeReceipt();
});

function closeContactModal() {
  contactModal.classList.add("is-hidden");
  contactForm.reset();
  contactFormError.textContent = "";
  contactFormError.classList.add("is-hidden");
}

closeContactModalButton.addEventListener("click", closeContactModal);
contactModal.addEventListener("click", (event) => {
  if (event.target === contactModal) closeContactModal();
});

/* submit evita la recarga del navegador y permite validar antes de guardar. */
contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = contactName.value.trim();
  const alias = contactAlias.value.trim().toLowerCase();

  if (!name || !alias) {
    contactFormError.textContent = "Completá el nombre y el alias.";
    contactFormError.classList.remove("is-hidden");
    return;
  }

  try {
    /* El servidor vuelve a validar y guarda el contacto en SQLite. */
    const response = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, alias })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No se pudo guardar el contacto");
    }

    /* Usamos el registro creado por SQLite, incluido su id definitivo. */
    wallet.contacts.push(data.contact);
    renderContacts();
    closeContactModal();
    showToast("Contacto guardado correctamente");
  } catch (error) {
    contactFormError.textContent = error.message;
    contactFormError.classList.remove("is-hidden");
  }
});

/* Cada pestaña cambia el criterio, pero reutiliza la misma función de filtrado. */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedMovementFilter = button.dataset.filter;

    filterButtons.forEach((filterButton) => {
      const isSelected = filterButton === button;
      filterButton.classList.toggle("is-active", isSelected);
      filterButton.setAttribute("aria-selected", String(isSelected));
    });

    filterMovements();
  });
});

movementSearch.addEventListener("input", filterMovements);

/* La conversión se recalcula mientras la persona escribe el importe en pesos. */
operationAmount.addEventListener("input", () => {
  if (operationModal.dataset.operation !== "currency") return;
  const amount = Number(operationAmount.value) || 0;
  const dollars = amount / exchangeRate.sell;
  conversionHelp.textContent = `Recibirías aproximadamente USD ${dollars.toLocaleString("es-AR", { minimumFractionDigits: 2 })}.`;
});

toggleBalanceButton.addEventListener("click", toggleBalanceVisibility);
copyAliasButton.addEventListener("click", copyAlias);
closeModalButton.addEventListener("click", closeOperationModal);

document.querySelectorAll("[data-operation]").forEach((button) => {
  button.addEventListener("click", () => {
    openOperationModal(button.dataset.operation);
  });
});

/* Cerrar al hacer clic fuera del contenido conserva el comportamiento esperado de un modal. */
operationModal.addEventListener("click", (event) => {
  if (event.target === operationModal) {
    closeOperationModal();
  }
});

/* Este submit concentra las validaciones de ingreso, transferencia y compra de dólares. */
operationForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const operation = operationModal.dataset.operation;
  const amount = Number(operationAmount.value);
  const detail = operationDetail.value.trim();

  if (!amount || amount <= 0) {
    showFormError("Ingresá un monto mayor que cero.");
    return;
  }

  if (operation === "currency") {
    if (amount > wallet.balanceARS) {
      showFormError("No tenés saldo suficiente para comprar dólares.");
      return;
    }

    const dollars = amount / exchangeRate.sell;
    wallet.balanceARS -= amount;
    wallet.balanceUSD += dollars;
    const transaction = { description: "Compra de dólares", amount: dollars, type: "currency" };
    wallet.transactions.unshift(transaction);
    addMovement(transaction);
    updateBalance();
    saveWallet();
    closeOperationModal();
    showToast("Compra de dólares realizada");
    return;
  }

  if (operation === "income") {
    try {
      /* Enviamos JSON a Flask; el servidor será quien modifique SQLite. */
      const response = await fetch("/api/transactions/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          description: detail || "Dinero ingresado"
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo registrar el ingreso");
      }

      /* Usamos la respuesta del servidor como fuente de verdad para la interfaz. */
      wallet.balanceARS = data.balanceARS;
      wallet.transactions.unshift(data.transaction);
      addMovement(data.transaction);
      updateBalance();
      closeOperationModal();
      showToast("Ingreso registrado correctamente");
    } catch (error) {
      showFormError(error.message);
    }
    return;
  }

  if (operation === "transfer" && !detail) {
    showFormError("Ingresá el alias del destinatario.");
    return;
  }

  if (operation === "transfer") {
    try {
      /* Flask vuelve a validar el saldo antes de ejecutar el descuento. */
      const response = await fetch("/api/transactions/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, alias: detail })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No se pudo realizar la transferencia");
      }

      /* La respuesta del servidor reemplaza el estado local anterior. */
      wallet.balanceARS = data.balanceARS;
      wallet.transactions.unshift(data.transaction);
      addMovement(data.transaction);
      updateBalance();
      closeOperationModal();
      showToast("Transferencia realizada correctamente");
    } catch (error) {
      showFormError(error.message);
    }
  }
});

/* La interfaz se completa después de recibir el estado desde Flask. */
loadWalletFromServer().catch(() => {
  showToast("No pudimos conectar con el servidor");
});
loadExchangeRate();
