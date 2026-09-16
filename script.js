const API_URL =
  "https://script.google.com/macros/s/AKfycbxqImb_01Z0ESIdEe5UT5p-GEr4VhBhQQbL0WPFYcU6HIBUXixa91ai12MwChbi7gE0/exec";


// ============================================================
// CASHORA — MAIN STATE
// ============================================================

let appData = {
  settings: [],
  funds: [],
  monthly_budget: [],
  daily_plans: [],
  expenses: [],
  calendar: [],
  agendas: [],
  packages: [],
  deadlines: [],
  notes: []
};

let currentCalendarDate = new Date();

let editingExpenseId = null;
let editingFundId = null;
let editingPackageId = null;
let editingDeadlineId = null;
let editingCalendarId = null;


// ============================================================
// DOM READY
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeApp();
});


// ============================================================
// INITIALIZE
// ============================================================

async function initializeApp() {

  setupNavigation();
  setupModals();
  setupForms();
  setupButtons();
  setupFilters();
  setupCalendarNavigation();

  setTodayDefaults();
  renderTodayLabel();

  await loadAllData();
}


async function apiRequest(action, data = {}) {
  return new Promise((resolve, reject) => {
    const callbackName =
      "cashoraCallback_" +
      Date.now() +
      "_" +
      Math.floor(Math.random() * 10000);

    const params = new URLSearchParams({
      action: action,
      data: JSON.stringify(data),
      callback: callbackName
    });

    const script = document.createElement("script");

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error("Request ke CASHORA timeout."));
    }, 15000);

    function cleanup() {
      clearTimeout(timeout);
      delete window[callbackName];
      script.remove();
    }

    window[callbackName] = function(result) {
      cleanup();

      console.log("CASHORA API response:", result);

      if (result && result.success === false) {
        reject(new Error(result.message || "Gagal menyimpan data."));
        return;
      }

      resolve(result);
    };

    script.onerror = function() {
      cleanup();
      reject(new Error("Gagal terhubung ke CASHORA API."));
    };

    script.src = API_URL + "?" + params.toString();

    document.body.appendChild(script);
  });
}

// ============================================================
// LOAD ALL DATA
// ============================================================

async function loadAllData(showLoading = true) {

  if (showLoading) {
    showLoadingOverlay();
  }

  try {

    const data =
      await apiRequest("getAllData");

    appData = {
      settings:
        data.settings || [],

      funds:
        data.funds || [],

      monthly_budget:
        data.monthly_budget ||
        data.Monthly_Budget ||
        [],

      daily_plans:
        data.daily_plans ||
        data.Daily_Plans ||
        [],

      expenses:
        data.expenses || [],

      calendar:
        data.calendar || [],

      agendas:
        data.agendas || [],

      packages:
        data.packages || [],

      deadlines:
        data.deadlines || [],

      notes:
        data.notes || []
    };

    renderEverything();

  } catch (error) {

    console.error(
      "LOAD DATA ERROR:",
      error
    );

  } finally {

    if (showLoading) {
      hideLoadingOverlay();
    }
  }
}


// ============================================================
// RENDER EVERYTHING
// ============================================================

function renderEverything() {

  renderDashboard();
  renderExpenses();
  renderFinance();
  renderPackages();
  renderDeadlines();
  renderCalendar();
  renderAnalytics();
  renderSettings();
}


// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {

  document
    .querySelectorAll(".nav-item")
    .forEach(button => {

      button.addEventListener("click", () => {

        const page =
          button.dataset.page;

        if (!page) return;

        openPage(page);
      });
    });


  document
    .querySelectorAll("[data-page-link]")
    .forEach(button => {

      button.addEventListener("click", () => {

        openPage(
          button.dataset.pageLink
        );
      });
    });


  const profileBtn =
    document.getElementById("profileBtn");

  if (profileBtn) {

    profileBtn.addEventListener(
      "click",
      () => {
        openPage("settings");
      }
    );
  }


  const refreshBtn =
    document.getElementById("refreshBtn");

  if (refreshBtn) {

    refreshBtn.addEventListener(
      "click",
      async () => {

        await loadAllData();

        showToast(
          "Data CASHORA sudah diperbarui ♡",
          "success"
        );
      }
    );
  }


  const mobileMenuBtn =
    document.getElementById(
      "mobileMenuBtn"
    );

  const sidebar =
    document.getElementById(
      "sidebar"
    );

  const mobileOverlay =
    document.getElementById(
      "mobileOverlay"
    );


  if (mobileMenuBtn) {

    mobileMenuBtn.addEventListener(
      "click",
      () => {

        sidebar?.classList.toggle(
          "open"
        );

        mobileOverlay?.classList.toggle(
          "show"
        );
      }
    );
  }


  if (mobileOverlay) {

    mobileOverlay.addEventListener(
      "click",
      closeMobileMenu
    );
  }
}


function openPage(pageName) {

  document
    .querySelectorAll(".page")
    .forEach(page => {
      page.classList.remove("active");
    });


  const target =
    document.getElementById(
      `page-${pageName}`
    );


  if (target) {
    target.classList.add("active");
  }


  document
    .querySelectorAll(".nav-item")
    .forEach(item => {

      item.classList.remove("active");

      if (
        item.dataset.page ===
        pageName
      ) {
        item.classList.add("active");
      }
    });


  const breadcrumb =
    document.getElementById(
      "pageBreadcrumb"
    );


  const names = {

    dashboard:
      "Beranda",

    expenses:
      "Catatan Pengeluaran",

    calendar:
      "Kalender",

    finance:
      "Keuangan",

    packages:
      "Paketku",

    deadlines:
      "Target & Deadline",

    analytics:
      "Analytics",

    settings:
      "Pengaturan"
  };


  if (breadcrumb) {

    breadcrumb.textContent =
      names[pageName] ||
      "CASHORA";
  }


  closeMobileMenu();


  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
}


function closeMobileMenu() {

  document
    .getElementById("sidebar")
    ?.classList.remove("open");

  document
    .getElementById("mobileOverlay")
    ?.classList.remove("show");
}


// ============================================================
// MODALS
// ============================================================

function setupModals() {

  document.addEventListener(
    "click",
    event => {

      const openButton =
        event.target.closest(
          "[data-open-modal]"
        );


      if (openButton) {

        event.preventDefault();

        const modalId =
          openButton.dataset.openModal;

        openModal(modalId);

        return;
      }


      const closeButton =
        event.target.closest(
          "[data-close-modal]"
        );


      if (closeButton) {

        event.preventDefault();

        const modalId =
          closeButton.dataset.closeModal;

        closeModal(modalId);

        return;
      }


      if (
        event.target.classList.contains(
          "modal-overlay"
        )
      ) {

        closeModal(
          event.target.id
        );
      }
    }
  );
}


function openModal(id) {

  const modal =
    document.getElementById(id);


  if (!modal) {

    console.error(
      `Modal "${id}" tidak ditemukan.`
    );

    showToast(
      "Modal tidak ditemukan 😭",
      "error"
    );

    return;
  }


  // Support kedua kemungkinan class
  modal.classList.add("show");
  modal.classList.add("active");


  // ==============================
  // DEFAULT FORM
  // ==============================

  if (
    id === "expenseModal" &&
    !editingExpenseId
  ) {

    clearExpenseForm();
    setTodayDefaults();
  }


  if (
    id === "fundModal" &&
    !editingFundId
  ) {

    clearFundForm();
  }


  if (
    id === "packageModal" &&
    !editingPackageId
  ) {

    clearPackageForm();
    setPackageDefaults();
  }


  if (
    id === "deadlineModal" &&
    !editingDeadlineId
  ) {

    clearDeadlineForm();
    setDeadlineDefaults();
  }


  if (
    id === "calendarModal" &&
    !editingCalendarId
  ) {

    clearCalendarForm();
    setCalendarDefaults();
  }


  if (
    id === "budgetModal"
  ) {

    setBudgetDefaults();
  }


  // Fokus input pertama
  setTimeout(() => {

    const firstInput =
      modal.querySelector(
        "input:not([type='hidden']), select, textarea"
      );

    firstInput?.focus();

  }, 100);
}


function closeModal(id) {

  const modal =
    document.getElementById(id);


  if (!modal) return;


  modal.classList.remove("show");
  modal.classList.remove("active");


  if (
    id === "expenseModal"
  ) {

    editingExpenseId = null;

    clearExpenseForm();
  }


  if (
    id === "fundModal"
  ) {

    editingFundId = null;

    clearFundForm();
  }


  if (
    id === "packageModal"
  ) {

    editingPackageId = null;

    clearPackageForm();
  }


  if (
    id === "deadlineModal"
  ) {

    editingDeadlineId = null;

    clearDeadlineForm();
  }


  if (
    id === "calendarModal"
  ) {

    editingCalendarId = null;

    clearCalendarForm();
  }
}


// ============================================================
// FORM SETUP
// ============================================================

function setupForms() {

  document
    .getElementById("expenseForm")
    ?.addEventListener(
      "submit",
      handleExpenseSubmit
    );


  document
    .getElementById("fundForm")
    ?.addEventListener(
      "submit",
      handleFundSubmit
    );


  document
    .getElementById("packageForm")
    ?.addEventListener(
      "submit",
      handlePackageSubmit
    );


  document
    .getElementById("deadlineForm")
    ?.addEventListener(
      "submit",
      handleDeadlineSubmit
    );


  document
    .getElementById("calendarForm")
    ?.addEventListener(
      "submit",
      handleCalendarSubmit
    );


  document
    .getElementById("budgetForm")
    ?.addEventListener(
      "submit",
      handleBudgetSubmit
    );


  document
    .getElementById("settingsForm")
    ?.addEventListener(
      "submit",
      handleSettingsSubmit
    );
}


// ============================================================
// BUTTON SETUP
// ============================================================

function setupButtons() {

  document.addEventListener(
    "click",
    async event => {

      const deleteExpense =
        event.target.closest(
          "[data-delete-expense]"
        );

      if (deleteExpense) {

        await deleteExpenseData(
          deleteExpense.dataset
            .deleteExpense
        );

        return;
      }


      const editExpense =
        event.target.closest(
          "[data-edit-expense]"
        );

      if (editExpense) {

        editExpenseData(
          editExpense.dataset
            .editExpense
        );

        return;
      }


      const deleteFund =
        event.target.closest(
          "[data-delete-fund]"
        );

      if (deleteFund) {

        await deleteFundData(
          deleteFund.dataset
            .deleteFund
        );

        return;
      }


      const editFund =
        event.target.closest(
          "[data-edit-fund]"
        );

      if (editFund) {

        editFundData(
          editFund.dataset
            .editFund
        );

        return;
      }


      const deletePackage =
        event.target.closest(
          "[data-delete-package]"
        );

      if (deletePackage) {

        await deletePackageData(
          deletePackage.dataset
            .deletePackage
        );

        return;
      }


      const editPackage =
        event.target.closest(
          "[data-edit-package]"
        );

      if (editPackage) {

        editPackageData(
          editPackage.dataset
            .editPackage
        );

        return;
      }


      const arrivedPackage =
        event.target.closest(
          "[data-arrived-package]"
        );

      if (arrivedPackage) {

        await markPackageArrived(
          arrivedPackage.dataset
            .arrivedPackage
        );

        return;
      }


      const deleteDeadline =
        event.target.closest(
          "[data-delete-deadline]"
        );

      if (deleteDeadline) {

        await deleteDeadlineData(
          deleteDeadline.dataset
            .deleteDeadline
        );

        return;
      }


      const editDeadline =
        event.target.closest(
          "[data-edit-deadline]"
        );

      if (editDeadline) {

        editDeadlineData(
          editDeadline.dataset
            .editDeadline
        );

        return;
      }


      const completeDeadline =
        event.target.closest(
          "[data-complete-deadline]"
        );

      if (completeDeadline) {

        await completeDeadlineData(
          completeDeadline.dataset
            .completeDeadline
        );

        return;
      }


      const editCalendar =
        event.target.closest(
          "[data-edit-calendar]"
        );

      if (editCalendar) {

        editCalendarData(
          editCalendar.dataset
            .editCalendar
        );

        return;
      }

    }
  );
}


// ============================================================
// FILTER
// ============================================================

function setupFilters() {

  const search =
    document.getElementById(
      "expenseSearch"
    );

  const category =
    document.getElementById(
      "expenseCategoryFilter"
    );

  const reset =
    document.getElementById(
      "clearExpenseFilter"
    );


  search?.addEventListener(
    "input",
    renderExpenses
  );


  category?.addEventListener(
    "change",
    renderExpenses
  );


  reset?.addEventListener(
    "click",
    () => {

      if (search) {
        search.value = "";
      }

      if (category) {
        category.value = "";
      }

      renderExpenses();
    }
  );
}


// ============================================================
// EXPENSE
// ============================================================

async function handleExpenseSubmit(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "expenseId"
    )?.value ||
    editingExpenseId;


  const data = {

    date:
      getValue("expenseDate"),

    category:
      getValue("expenseCategory"),

    amount:
      numberValue("expenseAmount"),

    description:
      getValue("expenseDescription"),

    payment_method:
      getValue("expensePayment"),

    calendar_date:
      getValue("expenseDate"),

    notes:
      getValue("expenseNotes")
  };


  if (
    !data.date ||
    !data.category ||
    data.amount <= 0
  ) {

    showToast(
      "Tanggal, kategori, dan nominal wajib diisi.",
      "error"
    );

    return;
  }


  showLoadingOverlay();


  try {

    if (id) {

      await apiRequest(
        "updateExpense",
        {
          id,
          fields: data
        }
      );

      showToast(
        "Pengeluaran berhasil diperbarui ♡",
        "success"
      );

    } else {

      await apiRequest(
        "addExpense",
        data
      );

      showToast(
        "Pengeluaran berhasil ditambahkan ♡",
        "success"
      );
    }


    closeModal("expenseModal");

    await loadAllData(false);

  } catch (error) {

    console.error(
      error
    );

  } finally {

    hideLoadingOverlay();
  }
}


function editExpenseData(id) {

  const item =
    appData.expenses.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!item) return;


  editingExpenseId = id;


  setValue(
    "expenseId",
    item.id
  );

  setValue(
    "expenseDate",
    formatInputDate(item.date)
  );

  setValue(
    "expenseAmount",
    item.amount
  );

  setValue(
    "expenseCategory",
    item.category
  );

  setValue(
    "expensePayment",
    item.payment_method ||
    "Cash"
  );

  setValue(
    "expenseDescription",
    item.description || ""
  );

  setValue(
    "expenseNotes",
    item.notes || ""
  );


  openModal("expenseModal");
}


async function deleteExpenseData(id) {

  if (
    !confirm(
      "Hapus pengeluaran ini?"
    )
  ) {
    return;
  }


  showLoadingOverlay();


  try {

    await apiRequest(
      "deleteExpense",
      { id }
    );

    showToast(
      "Pengeluaran dihapus.",
      "success"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


// ============================================================
// FUNDS
// ============================================================

async function handleFundSubmit(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "fundId"
    )?.value ||
    editingFundId;


  const data = {

    source_name:
      getValue("fundSource"),

    amount:
      numberValue("fundAmount"),

    period:
      getValue("fundPeriod"),

    start_date:
      getValue("fundStart"),

    end_date:
      getValue("fundEnd")
  };


  if (
    !data.source_name ||
    data.amount <= 0
  ) {

    showToast(
      "Nama sumber dana dan jumlah wajib diisi.",
      "error"
    );

    return;
  }


  showLoadingOverlay();


  try {

    if (id) {

      await apiRequest(
        "updateFund",
        {
          id,
          fields: data
        }
      );

      showToast(
        "Dana berhasil diperbarui ♡",
        "success"
      );

    } else {

      await apiRequest(
        "addFund",
        data
      );

      showToast(
        "Dana berhasil ditambahkan ♡",
        "success"
      );
    }


    closeModal("fundModal");

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


function editFundData(id) {

  const item =
    appData.funds.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!item) return;


  editingFundId = id;


  setValue(
    "fundId",
    item.id
  );

  setValue(
    "fundSource",
    item.source_name || ""
  );

  setValue(
    "fundAmount",
    item.amount || ""
  );

  setValue(
    "fundPeriod",
    item.period || ""
  );

  setValue(
    "fundStart",
    formatInputDate(
      item.start_date
    )
  );

  setValue(
    "fundEnd",
    formatInputDate(
      item.end_date
    )
  );


  openModal("fundModal");
}


async function deleteFundData(id) {

  if (
    !confirm(
      "Hapus sumber dana ini?"
    )
  ) {
    return;
  }


  showLoadingOverlay();


  try {

    await apiRequest(
      "deleteFund",
      { id }
    );

    showToast(
      "Sumber dana dihapus.",
      "success"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


// ============================================================
// PACKAGES
// ============================================================

async function handlePackageSubmit(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "packageId"
    )?.value ||
    editingPackageId;


  const price =
    numberValue(
      "packagePrice"
    );


  const shipping =
    numberValue(
      "packageShipping"
    );


  const data = {

    package_name:
      getValue("packageName"),

    platform:
      getValue("packagePlatform"),

    order_date:
      getValue("packageOrderDate"),

    estimated_arrival:
      getValue(
        "packageEstimatedArrival"
      ),

    price,

    shipping_cost:
      shipping,

    total_price:
      price + shipping,

    payment_method:
      getValue("packagePayment"),

    cod_amount:
      numberValue("packageCOD"),

    status:
      "Belum dikirim",

    tracking_number:
      getValue("packageTracking"),

    notes:
      getValue("packageNotes")
  };


  if (!data.package_name) {

    showToast(
      "Nama paket wajib diisi.",
      "error"
    );

    return;
  }


  showLoadingOverlay();


  try {

    if (id) {

      await apiRequest(
        "updatePackage",
        {
          id,
          fields: data
        }
      );

      showToast(
        "Paket berhasil diperbarui ♡",
        "success"
      );

    } else {

      await apiRequest(
        "addPackage",
        data
      );

      showToast(
        "Paket berhasil ditambahkan 📦",
        "success"
      );
    }


    closeModal(
      "packageModal"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


function editPackageData(id) {

  const item =
    appData.packages.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!item) return;


  editingPackageId = id;


  setValue(
    "packageId",
    item.id
  );

  setValue(
    "packageName",
    item.package_name || ""
  );

  setValue(
    "packagePlatform",
    item.platform ||
    "Shopee"
  );

  setValue(
    "packageOrderDate",
    formatInputDate(
      item.order_date
    )
  );

  setValue(
    "packageEstimatedArrival",
    formatInputDate(
      item.estimated_arrival
    )
  );

  setValue(
    "packagePrice",
    item.price || 0
  );

  setValue(
    "packageShipping",
    item.shipping_cost || 0
  );

  setValue(
    "packagePayment",
    item.payment_method ||
    "COD"
  );

  setValue(
    "packageCOD",
    item.cod_amount || 0
  );

  setValue(
    "packageTracking",
    item.tracking_number || ""
  );

  setValue(
    "packageNotes",
    item.notes || ""
  );


  openModal(
    "packageModal"
  );
}


async function deletePackageData(id) {

  if (
    !confirm(
      "Hapus paket ini?"
    )
  ) {
    return;
  }


  showLoadingOverlay();


  try {

    await apiRequest(
      "deletePackage",
      { id }
    );

    showToast(
      "Paket dihapus.",
      "success"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


async function markPackageArrived(id) {

  if (
    !confirm(
      "Tandai paket ini sudah sampai?"
    )
  ) {
    return;
  }


  showLoadingOverlay();


  try {

    await apiRequest(
      "updatePackage",
      {
        id,

        fields: {
          actual_arrival:
            todayISO(),

          status:
            "Sampai",

          cod_amount:
            0
        }
      }
    );


    showToast(
      "Paket ditandai sudah sampai 📦♡",
      "success"
    );


    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


// ============================================================
// DEADLINES
// ============================================================

async function handleDeadlineSubmit(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "deadlineId"
    )?.value ||
    editingDeadlineId;


  const data = {

    name:
      getValue("deadlineName"),

    date:
      getValue("deadlineDate"),

    category:
      getValue("deadlineCategory"),

    priority:
      getValue("deadlinePriority"),

    notes:
      getValue("deadlineNotes"),

    status:
      "Belum selesai"
  };


  if (
    !data.name ||
    !data.date
  ) {

    showToast(
      "Nama dan tanggal deadline wajib diisi.",
      "error"
    );

    return;
  }


  showLoadingOverlay();


  try {

    if (id) {

      await apiRequest(
        "updateDeadline",
        {
          id,
          fields: data
        }
      );

      showToast(
        "Deadline diperbarui ♡",
        "success"
      );

    } else {

      await apiRequest(
        "addDeadline",
        data
      );

      showToast(
        "Deadline ditambahkan ☆",
        "success"
      );
    }


    closeModal(
      "deadlineModal"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


function editDeadlineData(id) {

  const item =
    appData.deadlines.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!item) return;


  editingDeadlineId = id;


  setValue(
    "deadlineId",
    item.id
  );

  setValue(
    "deadlineName",
    item.name || ""
  );

  setValue(
    "deadlineDate",
    formatInputDate(
      item.date
    )
  );

  setValue(
    "deadlineCategory",
    item.category ||
    "Kuliah"
  );

  setValue(
    "deadlinePriority",
    item.priority ||
    "Sedang"
  );

  setValue(
    "deadlineNotes",
    item.notes || ""
  );


  openModal(
    "deadlineModal"
  );
}


async function deleteDeadlineData(id) {

  if (
    !confirm(
      "Hapus deadline ini?"
    )
  ) {
    return;
  }


  showLoadingOverlay();


  try {

    await apiRequest(
      "deleteDeadline",
      { id }
    );

    showToast(
      "Deadline dihapus.",
      "success"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


async function completeDeadlineData(id) {

  showLoadingOverlay();


  try {

    await apiRequest(
      "updateDeadline",
      {
        id,

        fields: {
          status:
            "Selesai"
        }
      }
    );


    showToast(
      "Deadline ditandai selesai ✓",
      "success"
    );


    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


// ============================================================
// CALENDAR
// ============================================================

function setupCalendarNavigation() {

  document
    .getElementById("prevMonth")
    ?.addEventListener(
      "click",
      () => {

        currentCalendarDate.setMonth(
          currentCalendarDate.getMonth() - 1
        );

        renderCalendar();
      }
    );


  document
    .getElementById("nextMonth")
    ?.addEventListener(
      "click",
      () => {

        currentCalendarDate.setMonth(
          currentCalendarDate.getMonth() + 1
        );

        renderCalendar();
      }
    );
}


async function handleCalendarSubmit(event) {

  event.preventDefault();


  const id =
    document.getElementById(
      "calendarId"
    )?.value ||
    editingCalendarId;


  const data = {

    date:
      getValue("calendarDate"),

    status:
      getValue("calendarStatus"),

    class_start:
      getValue("calendarStart"),

    class_end:
      getValue("calendarEnd"),

    planned_amount:
      numberValue(
        "calendarBudget"
      ),

    actual_amount:
      numberValue(
        "calendarActual"
      ),

    note:
      getValue("calendarNote")
  };


  if (!data.date) {

    showToast(
      "Tanggal wajib diisi.",
      "error"
    );

    return;
  }


  showLoadingOverlay();


  try {

    if (id) {

      await apiRequest(
        "updateCalendar",
        {
          id,
          fields: data
        }
      );

      showToast(
        "Kalender diperbarui ♡",
        "success"
      );

    } else {

      await apiRequest(
        "addCalendar",
        data
      );

      showToast(
        "Agenda kalender ditambahkan ♡",
        "success"
      );
    }


    closeModal(
      "calendarModal"
    );

    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


function editCalendarData(id) {

  const item =
    appData.calendar.find(
      x =>
        String(x.id) ===
        String(id)
    );


  if (!item) return;


  editingCalendarId = id;


  setValue(
    "calendarId",
    item.id
  );

  setValue(
    "calendarDate",
    formatInputDate(
      item.date
    )
  );

  setValue(
    "calendarStatus",
    item.status ||
    "Kuliah"
  );

  setValue(
    "calendarStart",
    item.class_start || ""
  );

  setValue(
    "calendarEnd",
    item.class_end || ""
  );

  setValue(
    "calendarBudget",
    item.planned_amount || 0
  );

  setValue(
    "calendarActual",
    item.actual_amount || 0
  );

  setValue(
    "calendarNote",
    item.note || ""
  );


  openModal(
    "calendarModal"
  );
}


// ============================================================
// BUDGET
// ============================================================

async function handleBudgetSubmit(event) {

  event.preventDefault();


  const data = {

    month:
      getValue("budgetMonth"),

    category:
      getValue("budgetCategory"),

    planned_amount:
      numberValue(
        "budgetAmount"
      )
  };


  if (
    !data.month ||
    !data.category ||
    data.planned_amount <= 0
  ) {

    showToast(
      "Bulan, kategori, dan nominal budget wajib diisi.",
      "error"
    );

    return;
  }


  showLoadingOverlay();


  try {

    await apiRequest(
      "addMonthlyBudget",
      data
    );


    closeModal(
      "budgetModal"
    );


    showToast(
      "Budget berhasil ditambahkan ♡",
      "success"
    );


    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


// ============================================================
// SETTINGS
// ============================================================

async function handleSettingsSubmit(event) {

  event.preventDefault();


  const name =
    getValue(
      "settingsName"
    );

  const email =
    getValue(
      "settingsEmail"
    );


  showLoadingOverlay();


  try {

    await apiRequest(
      "saveSettings",
      {
        name,
        email
      }
    );


    showToast(
      "Pengaturan berhasil disimpan ♡",
      "success"
    );


    await loadAllData(false);

  } catch (error) {

    console.error(error);

  } finally {

    hideLoadingOverlay();
  }
}


// ============================================================
// DASHBOARD
// ============================================================

function renderDashboard() {

  const totalFunds =
    sum(
      appData.funds,
      "amount"
    );


  const currentMonth =
    getCurrentMonth();


  const monthlyExpenses =
    appData.expenses
      .filter(
        item =>
          normalizeMonth(item.date) ===
          currentMonth
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.amount || 0
          ),
        0
      );


  const remaining =
    totalFunds -
    monthlyExpenses;


  const codTotal =
    appData.packages
      .filter(
        item =>
          ![
            "Sampai",
            "Dibatalkan"
          ].includes(
            item.status
          )
      )
      .reduce(
        (total, item) =>
          total +
          Number(
            item.cod_amount || 0
          ),
        0
      );


  setText(
    "totalFunds",
    formatRupiah(totalFunds)
  );


  setText(
    "monthlyExpenses",
    formatRupiah(
      monthlyExpenses
    )
  );


  setText(
    "remainingFunds",
    formatRupiah(
      remaining
    )
  );


  setText(
    "codTotal",
    formatRupiah(
      codTotal
    )
  );


  setText(
    "fundCount",
    `${appData.funds.length} sumber dana`
  );


  setText(
    "expenseCount",
    `${appData.expenses.length} transaksi`
  );


  const percentage =
    totalFunds > 0
      ? Math.max(
          0,
          Math.round(
            (remaining /
              totalFunds) *
            100
          )
        )
      : 0;


  setText(
    "remainingPercentage",
    `${percentage}% dana tersisa`
  );


  const activePackages =
    appData.packages.filter(
      item =>
        ![
          "Sampai",
          "Dibatalkan"
        ].includes(
          item.status
        )
    ).length;


  setText(
    "packageCount",
    `${activePackages} paket aktif`
  );


  renderRecentExpenses();
  renderUpcomingDeadlines();
  renderPackagePreview();
  renderProfile();
}


// ============================================================
// RECENT EXPENSES
// ============================================================

function renderRecentExpenses() {

  const container =
    document.getElementById(
      "recentExpenses"
    );


  if (!container) return;


  const items =
    [...appData.expenses]
      .sort(
        (a, b) =>
          new Date(b.date) -
          new Date(a.date)
      )
      .slice(0, 5);


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state compact">

        <div class="empty-icon">
          ♡
        </div>

        <strong>
          Belum ada pengeluaran
        </strong>

        <span>
          Yuk catat pengeluaran pertamamu.
        </span>

        <button
          type="button"
          class="small-primary-btn"
          data-open-modal="expenseModal">

          + Tambah

        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(
        item => `

        <div class="activity-item">

          <div class="activity-icon">
            ${categoryEmoji(
              item.category
            )}
          </div>

          <div class="activity-info">

            <strong>
              ${escapeHTML(
                item.description ||
                item.category ||
                "Pengeluaran"
              )}
            </strong>

            <small>
              ${formatDate(
                item.date
              )}
              ·
              ${escapeHTML(
                item.category || ""
              )}
            </small>

          </div>

          <strong class="activity-amount">
            -${formatRupiah(
              item.amount
            )}
          </strong>

        </div>

      `
      )
      .join("");
}


// ============================================================
// EXPENSE TABLE
// ============================================================

function renderExpenses() {

  const tbody =
    document.getElementById(
      "expensesTableBody"
    );


  if (!tbody) return;


  const search =
    (
      document.getElementById(
        "expenseSearch"
      )?.value || ""
    ).toLowerCase();


  const category =
    document.getElementById(
      "expenseCategoryFilter"
    )?.value || "";


  let items =
    [...appData.expenses];


  if (search) {

    items =
      items.filter(
        item => {

          const text =
            `${item.description || ""} ${item.category || ""} ${item.payment_method || ""}`
              .toLowerCase();

          return text.includes(
            search
          );
        }
      );
  }


  if (category) {

    items =
      items.filter(
        item =>
          item.category ===
          category
      );
  }


  items.sort(
    (a, b) =>
      new Date(b.date) -
      new Date(a.date)
  );


  if (!items.length) {

    tbody.innerHTML = `
      <tr class="empty-table-row">

        <td colspan="6">

          <div class="empty-state">

            <div class="empty-icon">
              ♡
            </div>

            <strong>
              Tidak ada data
            </strong>

            <span>
              Belum ada pengeluaran yang cocok.
            </span>

            <button
              type="button"
              class="small-primary-btn"
              data-open-modal="expenseModal">

              ＋ Tambah Pengeluaran

            </button>

          </div>

        </td>

      </tr>
    `;

    return;
  }


  tbody.innerHTML =
    items
      .map(
        item => `

        <tr>

          <td>
            ${formatDate(
              item.date
            )}
          </td>

          <td>

            <span class="category-badge">

              ${categoryEmoji(
                item.category
              )}

              ${escapeHTML(
                item.category ||
                "-"
              )}

            </span>

          </td>

          <td>
            ${escapeHTML(
              item.description ||
              "-"
            )}
          </td>

          <td>
            ${escapeHTML(
              item.payment_method ||
              "-"
            )}
          </td>

          <td>

            <strong>
              ${formatRupiah(
                item.amount
              )}
            </strong>

          </td>

          <td>

            <div class="table-actions">

              <button
                type="button"
                class="table-action edit"
                data-edit-expense="${escapeAttr(
                  item.id
                )}"
                title="Edit">

                ✎

              </button>

              <button
                type="button"
                class="table-action delete"
                data-delete-expense="${escapeAttr(
                  item.id
                )}"
                title="Hapus">

                ×

              </button>

            </div>

          </td>

        </tr>

      `
      )
      .join("");
}


// ============================================================
// FINANCE
// ============================================================

function renderFinance() {

  const totalFunds =
    sum(
      appData.funds,
      "amount"
    );


  const totalSpent =
    sum(
      appData.expenses,
      "amount"
    );


  const remaining =
    totalFunds -
    totalSpent;


  setText(
    "financeTotalFunds",
    formatRupiah(
      totalFunds
    )
  );


  setText(
    "financeTotalSpent",
    formatRupiah(
      totalSpent
    )
  );


  setText(
    "financeRemaining",
    formatRupiah(
      remaining
    )
  );


  setText(
    "financeFundSources",
    `${appData.funds.length} sumber dana`
  );


  renderFundList();
  renderBudgetList();
}


function renderFundList() {

  const container =
    document.getElementById(
      "fundList"
    );


  if (!container) return;


  if (!appData.funds.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ✦
        </div>

        <strong>
          Belum ada sumber dana
        </strong>

        <span>
          Tambahkan KIP-K, tabungan, atau sumber dana lainnya.
        </span>

        <button
          type="button"
          class="small-primary-btn"
          data-open-modal="fundModal">

          ＋ Tambah Dana

        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    appData.funds
      .map(
        item => `

        <div class="fund-card">

          <div class="fund-card-icon">
            ♡
          </div>

          <div class="fund-card-info">

            <strong>
              ${escapeHTML(
                item.source_name ||
                "Dana"
              )}
            </strong>

            <span>
              ${escapeHTML(
                item.period ||
                "Tanpa periode"
              )}
            </span>

          </div>

          <div class="fund-card-amount">
            ${formatRupiah(
              item.amount
            )}
          </div>

          <div class="table-actions">

            <button
              type="button"
              class="table-action edit"
              data-edit-fund="${escapeAttr(
                item.id
              )}">

              ✎

            </button>

            <button
              type="button"
              class="table-action delete"
              data-delete-fund="${escapeAttr(
                item.id
              )}">

              ×

            </button>

          </div>

        </div>

      `
      )
      .join("");
}


function renderBudgetList() {

  const container =
    document.getElementById(
      "budgetGrid"
    );


  if (!container) return;


  const currentMonth =
    getCurrentMonth();


  const items =
    appData.monthly_budget
      .filter(
        item =>
          normalizeMonth(
            item.month
          ) ===
          currentMonth
      );


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ♡
        </div>

        <strong>
          Belum ada budget bulan ini
        </strong>

        <span>
          Atur batas pengeluaran untuk setiap kategori.
        </span>

      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(
        item => {

          const spent =
            appData.expenses
              .filter(
                exp =>
                  exp.category ===
                    item.category &&
                  normalizeMonth(
                    exp.date
                  ) ===
                    currentMonth
              )
              .reduce(
                (
                  total,
                  exp
                ) =>
                  total +
                  Number(
                    exp.amount ||
                    0
                  ),
                0
              );


          const budget =
            Number(
              item.planned_amount ||
              0
            );


          const percent =
            budget > 0
              ? Math.min(
                  100,
                  Math.round(
                    (spent /
                      budget) *
                      100
                  )
                )
              : 0;


          return `

            <div class="budget-card">

              <div class="budget-card-top">

                <div>

                  <span>
                    ${categoryEmoji(
                      item.category
                    )}
                  </span>

                  <strong>
                    ${escapeHTML(
                      item.category
                    )}
                  </strong>

                </div>

                <small>
                  ${formatRupiah(
                    spent
                  )}
                  /
                  ${formatRupiah(
                    budget
                  )}
                </small>

              </div>

              <div class="budget-progress">

                <div
                  style="width:${percent}%">
                </div>

              </div>

              <small>
                ${percent}% terpakai
              </small>

            </div>

          `;

        }
      )
      .join("");
}


// ============================================================
// PACKAGES
// ============================================================

function renderPackages() {

  const active =
    appData.packages
      .filter(
        item =>
          ![
            "Sampai",
            "Dibatalkan"
          ].includes(
            item.status
          )
      );


  const total =
    sum(
      appData.packages,
      "total_price"
    );


  const cod =
    active.reduce(
      (total, item) =>
        total +
        Number(
          item.cod_amount ||
          0
        ),
      0
    );


  setText(
    "activePackageCount",
    active.length
  );


  setText(
    "packageTotalPrice",
    formatRupiah(
      total
    )
  );


  setText(
    "packageCodTotal",
    formatRupiah(
      cod
    )
  );


  renderPackageGrid();
}


function renderPackageGrid() {

  const container =
    document.getElementById(
      "packageGrid"
    );


  if (!container) return;


  if (!appData.packages.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          📦
        </div>

        <strong>
          Belum ada paket
        </strong>

        <span>
          Tambahkan pesanan online-mu di sini.
        </span>

        <button
          type="button"
          class="small-primary-btn"
          data-open-modal="packageModal">

          ＋ Tambah Paket

        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    appData.packages
      .map(
        item => `

        <div class="package-card">

          <div class="package-card-top">

            <div class="package-box">
              📦
            </div>

            <span class="package-status">

              ${escapeHTML(
                item.status ||
                "Belum dikirim"
              )}

            </span>

          </div>


          <div class="package-card-body">

            <h3>
              ${escapeHTML(
                item.package_name ||
                "Paket"
              )}
            </h3>

            <span class="package-platform">

              ${escapeHTML(
                item.platform ||
                "Online shop"
              )}

            </span>


            <div class="package-info-row">

              <span>
                Estimasi tiba
              </span>

              <strong>

                ${
                  item.estimated_arrival
                    ? formatDate(
                        item.estimated_arrival
                      )
                    : "-"
                }

              </strong>

            </div>


            <div class="package-info-row">

              <span>
                Total
              </span>

              <strong>
                ${formatRupiah(
                  item.total_price
                )}
              </strong>

            </div>


            ${
              Number(
                item.cod_amount ||
                0
              ) > 0
                ? `

                <div class="package-cod">

                  <span>
                    💵 COD
                  </span>

                  <strong>
                    ${formatRupiah(
                      item.cod_amount
                    )}
                  </strong>

                </div>

              `
                : ""
            }

          </div>


          <div class="package-card-actions">

            ${
              item.status !==
                "Sampai" &&
              item.status !==
                "Dibatalkan"
                ? `

                <button
                  type="button"
                  class="small-primary-btn"
                  data-arrived-package="${escapeAttr(
                    item.id
                  )}">

                  ✓ Sudah Sampai

                </button>

              `
                : ""
            }


            <button
              type="button"
              class="table-action edit"
              data-edit-package="${escapeAttr(
                item.id
              )}">

              ✎

            </button>


            <button
              type="button"
              class="table-action delete"
              data-delete-package="${escapeAttr(
                item.id
              )}">

              ×

            </button>

          </div>

        </div>

      `
      )
      .join("");
}


function renderPackagePreview() {

  const container =
    document.getElementById(
      "packagePreview"
    );


  if (!container) return;


  const active =
    appData.packages
      .filter(
        item =>
          ![
            "Sampai",
            "Dibatalkan"
          ].includes(
            item.status
          )
      )
      .slice(0, 3);


  if (!active.length) {

    container.innerHTML = `
      <div class="empty-state compact">

        <div class="empty-icon">
          📦
        </div>

        <strong>
          Belum ada paket
        </strong>

        <span>
          Tambahkan paket belanjamu di sini.
        </span>

        <button
          type="button"
          class="small-primary-btn"
          data-open-modal="packageModal">

          + Tambah Paket

        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    active
      .map(
        item => `

        <div class="mini-package-card">

          <span class="mini-package-icon">
            📦
          </span>

          <div>

            <strong>
              ${escapeHTML(
                item.package_name ||
                "Paket"
              )}
            </strong>

            <small>

              ${
                item.estimated_arrival
                  ? `Tiba ${formatDate(
                      item.estimated_arrival
                    )}`
                  : "Belum ada estimasi"
              }

            </small>

          </div>


          ${
            Number(
              item.cod_amount ||
              0
            ) > 0
              ? `

              <strong class="mini-cod">
                ${formatRupiah(
                  item.cod_amount
                )}
              </strong>

            `
              : ""
          }

        </div>

      `
      )
      .join("");
}


// ============================================================
// DEADLINES
// ============================================================

function renderDeadlines() {

  const container =
    document.getElementById(
      "deadlineList"
    );


  if (!container) return;


  const items =
    [...appData.deadlines]
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      );


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state">

        <div class="empty-icon">
          ☆
        </div>

        <strong>
          Belum ada deadline
        </strong>

        <span>
          Tambahkan tugas atau target pentingmu.
        </span>

        <button
          type="button"
          class="small-primary-btn"
          data-open-modal="deadlineModal">

          ＋ Tambah Deadline

        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(
        item => `

        <div class="deadline-card ${
          item.status === "Selesai"
            ? "completed"
            : ""
        }">

          <div class="deadline-date">

            <strong>
              ${getDayNumber(
                item.date
              )}
            </strong>

            <span>
              ${getShortMonth(
                item.date
              )}
            </span>

          </div>


          <div class="deadline-content">

            <div class="deadline-top">

              <h3>
                ${escapeHTML(
                  item.name
                )}
              </h3>

              <span
                class="priority-badge ${priorityClass(
                  item.priority
                )}">

                ${escapeHTML(
                  item.priority ||
                  "Sedang"
                )}

              </span>

            </div>


            <p>
              ${escapeHTML(
                item.category ||
                "Lainnya"
              )}
            </p>


            ${
              item.notes
                ? `<small>${escapeHTML(
                    item.notes
                  )}</small>`
                : ""
            }

          </div>


          <div class="deadline-actions">

            ${
              item.status !==
                "Selesai"
                ? `

                <button
                  type="button"
                  class="small-primary-btn"
                  data-complete-deadline="${escapeAttr(
                    item.id
                  )}">

                  ✓ Selesai

                </button>

              `
                : `

                <span class="completed-label">
                  ✓ Selesai
                </span>

              `
            }


            <button
              type="button"
              class="table-action edit"
              data-edit-deadline="${escapeAttr(
                item.id
              )}">

              ✎

            </button>


            <button
              type="button"
              class="table-action delete"
              data-delete-deadline="${escapeAttr(
                item.id
              )}">

              ×

            </button>

          </div>

        </div>

      `
      )
      .join("");


  renderUpcomingDeadlines();
}


function renderUpcomingDeadlines() {

  const container =
    document.getElementById(
      "upcomingDeadlines"
    );


  if (!container) return;


  const items =
    [...appData.deadlines]
      .filter(
        item =>
          item.status !==
          "Selesai"
      )
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .slice(0, 4);


  if (!items.length) {

    container.innerHTML = `
      <div class="empty-state compact">

        <div class="empty-icon">
          ☆
        </div>

        <strong>
          Belum ada deadline
        </strong>

        <span>
          Tambahkan deadline supaya nggak kelupaan.
        </span>

        <button
          type="button"
          class="small-primary-btn"
          data-open-modal="deadlineModal">

          + Tambah

        </button>

      </div>
    `;

    return;
  }


  container.innerHTML =
    items
      .map(
        item => `

        <div class="deadline-preview-item">

          <div class="deadline-preview-date">

            <strong>
              ${getDayNumber(
                item.date
              )}
            </strong>

            <small>
              ${getShortMonth(
                item.date
              )}
            </small>

          </div>

          <div>

            <strong>
              ${escapeHTML(
                item.name
              )}
            </strong>

            <small>
              ${escapeHTML(
                item.category ||
                ""
              )}
            </small>

          </div>

        </div>

      `
      )
      .join("");
}


// ============================================================
// CALENDAR RENDER
// ============================================================

function renderCalendar() {

  const grid =
    document.getElementById(
      "calendarGrid"
    );

  const title =
    document.getElementById(
      "calendarMonth"
    );


  if (!grid || !title) return;


  const year =
    currentCalendarDate.getFullYear();

  const month =
    currentCalendarDate.getMonth();


  title.textContent =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        month: "long",
        year: "numeric"
      }
    ).format(
      currentCalendarDate
    );


  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  let start =
    firstDay === 0
      ? 6
      : firstDay - 1;


  let html = "";


  for (
    let i = 0;
    i < start;
    i++
  ) {

    html += `
      <div class="calendar-day muted"></div>
    `;
  }


  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {

    const date =
      `${year}-${String(
        month + 1
      ).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;


    const item =
      appData.calendar.find(
        x =>
          formatInputDate(
            x.date
          ) === date
      );


    const today =
      date === todayISO()
        ? "today"
        : "";


    const statusClass =
      item
        ? calendarStatusClass(
            item.status
          )
        : "";


    html += `

      <button
        type="button"
        class="calendar-day ${today} ${statusClass}"
        data-calendar-date="${date}">

        <span>
          ${day}
        </span>

        ${
          item
            ? `

              <small>
                ${escapeHTML(
                  item.status
                )}
              </small>

            `
            : ""
        }

      </button>

    `;
  }


  grid.innerHTML =
    html;


  grid
    .querySelectorAll(
      "[data-calendar-date]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const date =
              button.dataset
                .calendarDate;


            const item =
              appData.calendar.find(
                x =>
                  formatInputDate(
                    x.date
                  ) === date
              );


            if (item) {

              editCalendarData(
                item.id
              );

            } else {

              editingCalendarId =
                null;

              clearCalendarForm();

              setValue(
                "calendarDate",
                date
              );

              openModal(
                "calendarModal"
              );
            }
          }
        );
      }
    );
}


// ============================================================
// ANALYTICS
// ============================================================

function renderAnalytics() {

  const total =
    sum(
      appData.expenses,
      "amount"
    );


  const transactions =
    appData.expenses.length;


  const average =
    transactions
      ? total /
        transactions
      : 0;


  setText(
    "analyticsTotal",
    formatRupiah(
      total
    )
  );


  setText(
    "analyticsAverage",
    formatRupiah(
      average
    )
  );


  setText(
    "analyticsTransactions",
    transactions
  );


  renderCategoryChart();
  renderInsights();
}


function renderCategoryChart() {

  const container =
    document.getElementById(
      "categoryChart"
    );


  if (!container) return;


  if (!appData.expenses.length) {

    container.innerHTML = `
      <div class="empty-state compact">

        <div class="empty-icon">
          ◔
        </div>

        <strong>
          Belum cukup data
        </strong>

        <span>
          Tambahkan pengeluaran untuk melihat analytics.
        </span>

      </div>
    `;

    return;
  }


  const currentMonth =
    getCurrentMonth();


  const categories = {};


  appData.expenses
    .filter(
      item =>
        normalizeMonth(
          item.date
        ) ===
        currentMonth
    )
    .forEach(
      item => {

        const category =
          item.category ||
          "Lainnya";


        categories[category] =
          (
            categories[category] ||
            0
          ) +
          Number(
            item.amount ||
            0
          );
      }
    );


  const total =
    Object.values(
      categories
    )
      .reduce(
        (sum, value) =>
          sum + value,
        0
      );


  if (!total) {

    container.innerHTML = `
      <div class="empty-state compact">

        <div class="empty-icon">
          ◔
        </div>

        <strong>
          Belum ada pengeluaran bulan ini
        </strong>

      </div>
    `;

    return;
  }


  container.innerHTML =
    Object.entries(
      categories
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )
      .map(
        ([category, amount]) => {

          const percent =
            Math.round(
              (amount /
                total) *
                100
            );


          return `

            <div class="category-row">

              <div class="category-row-top">

                <span>
                  ${categoryEmoji(
                    category
                  )}

                  ${escapeHTML(
                    category
                  )}
                </span>

                <strong>
                  ${formatRupiah(
                    amount
                  )}
                </strong>

              </div>


              <div class="category-progress">

                <div
                  style="width:${percent}%">
                </div>

              </div>


              <small>
                ${percent}% dari pengeluaran bulan ini
              </small>

            </div>

          `;
        }
      )
      .join("");
}


function renderInsights() {

  const container =
    document.getElementById(
      "analyticsInsights"
    );


  if (!container) return;


  if (!appData.expenses.length) {

    container.innerHTML = `

      <div class="insight-item">

        <span>
          ♡
        </span>

        <div>

          <strong>
            Belum ada insight
          </strong>

          <small>
            Data akan muncul setelah kamu mulai mencatat.
          </small>

        </div>

      </div>

    `;

    return;
  }


  const categoryTotals = {};


  appData.expenses.forEach(
    item => {

      const category =
        item.category ||
        "Lainnya";


      categoryTotals[category] =
        (
          categoryTotals[category] ||
          0
        ) +
        Number(
          item.amount ||
          0
        );
    }
  );


  const top =
    Object.entries(
      categoryTotals
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
      )[0];


  container.innerHTML = `

    <div class="insight-item">

      <span>
        ✦
      </span>

      <div>

        <strong>
          ${
            top
              ? escapeHTML(
                  top[0]
                )
              : "Pengeluaran"
          }
        </strong>

        <small>
          Kategori dengan pengeluaran terbesar:
          ${
            top
              ? formatRupiah(
                  top[1]
                )
              : "Rp0"
          }
        </small>

      </div>

    </div>


    <div class="insight-item">

      <span>
        ♡
      </span>

      <div>

        <strong>
          Keep going!
        </strong>

        <small>
          Setiap catatan kecil membantu kamu memahami uangmu lebih baik.
        </small>

      </div>

    </div>

  `;
}


// ============================================================
// SETTINGS
// ============================================================

function renderSettings() {

  const settings = {};


  appData.settings.forEach(
    item => {

      if (item.key) {

        settings[item.key] =
          item.value;
      }
    }
  );


  const name =
    settings.name ||
    "Aca";


  const email =
    settings.email ||
    "";


  setValue(
    "settingsName",
    name
  );


  setValue(
    "settingsEmail",
    email
  );


  setText(
    "dashboardName",
    name
  );


  const initial =
    name
      .trim()
      .charAt(0)
      .toUpperCase() ||
    "A";


  setText(
    "profileInitial",
    initial
  );


  setText(
    "settingsAvatar",
    initial
  );
}


function renderProfile() {
  renderSettings();
}


// ============================================================
// DEFAULT VALUES
// ============================================================

function setTodayDefaults() {

  const date =
    todayISO();


  if (
    document.getElementById(
      "expenseDate"
    ) &&
    !document.getElementById(
      "expenseDate"
    ).value
  ) {

    setValue(
      "expenseDate",
      date
    );
  }


  if (
    document.getElementById(
      "packageOrderDate"
    ) &&
    !document.getElementById(
      "packageOrderDate"
    ).value
  ) {

    setValue(
      "packageOrderDate",
      date
    );
  }


  if (
    document.getElementById(
      "deadlineDate"
    ) &&
    !document.getElementById(
      "deadlineDate"
    ).value
  ) {

    setValue(
      "deadlineDate",
      date
    );
  }


  if (
    document.getElementById(
      "calendarDate"
    ) &&
    !document.getElementById(
      "calendarDate"
    ).value
  ) {

    setValue(
      "calendarDate",
      date
    );
  }
}


function setPackageDefaults() {

  setValue(
    "packageOrderDate",
    todayISO()
  );

  setValue(
    "packagePayment",
    "COD"
  );

  setValue(
    "packageCOD",
    ""
  );
}


function setDeadlineDefaults() {

  setValue(
    "deadlineDate",
    todayISO()
  );

  setValue(
    "deadlinePriority",
    "Sedang"
  );
}


function setCalendarDefaults() {

  setValue(
    "calendarDate",
    todayISO()
  );

  setValue(
    "calendarStatus",
    "Kuliah"
  );
}


function setBudgetDefaults() {

  const now =
    new Date();


  setValue(
    "budgetMonth",
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}`
  );
}


// ============================================================
// CLEAR FORMS
// ============================================================

function clearExpenseForm() {

  const form =
    document.getElementById(
      "expenseForm"
    );


  form?.reset();


  setValue(
    "expenseId",
    ""
  );


  setValue(
    "expenseDate",
    todayISO()
  );


  setValue(
    "expensePayment",
    "Cash"
  );
}


function clearFundForm() {

  const form =
    document.getElementById(
      "fundForm"
    );


  form?.reset();


  setValue(
    "fundId",
    ""
  );
}


function clearPackageForm() {

  const form =
    document.getElementById(
      "packageForm"
    );


  form?.reset();


  setValue(
    "packageId",
    ""
  );


  setValue(
    "packagePayment",
    "COD"
  );
}


function clearDeadlineForm() {

  const form =
    document.getElementById(
      "deadlineForm"
    );


  form?.reset();


  setValue(
    "deadlineId",
    ""
  );


  setValue(
    "deadlinePriority",
    "Sedang"
  );
}


function clearCalendarForm() {

  const form =
    document.getElementById(
      "calendarForm"
    );


  form?.reset();


  setValue(
    "calendarId",
    ""
  );


  setValue(
    "calendarStatus",
    "Kuliah"
  );
}


// ============================================================
// DATE HELPERS
// ============================================================

function todayISO() {

  const now =
    new Date();


  const offset =
    now.getTimezoneOffset();


  const local =
    new Date(
      now.getTime() -
      offset * 60000
    );


  return local
    .toISOString()
    .split("T")[0];
}


function formatInputDate(value) {

  if (!value) return "";


  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}/.test(
      value
    )
  ) {

    return value.substring(
      0,
      10
    );
  }


  const date =
    new Date(value);


  if (isNaN(date)) {
    return "";
  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");


  const day =
    String(
      date.getDate()
    ).padStart(2, "0");


  return `${year}-${month}-${day}`;
}


function formatDate(value) {

  if (!value) return "-";


  const date =
    new Date(value);


  if (isNaN(date)) {
    return String(value);
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "numeric",
      month: "short",
      year: "numeric"
    }
  ).format(date);
}


function getDayNumber(value) {

  const date =
    new Date(value);


  return isNaN(date)
    ? "-"
    : date.getDate();
}


function getShortMonth(value) {

  const date =
    new Date(value);


  if (isNaN(date)) {
    return "";
  }


  return new Intl.DateTimeFormat(
    "id-ID",
    {
      month: "short"
    }
  ).format(date);
}


function normalizeMonth(value) {

  if (!value) return "";


  const date =
    new Date(value);


  if (isNaN(date)) {

    const match =
      String(value).match(
        /^(\d{4}-\d{2})/
      );


    return match
      ? match[1]
      : "";
  }


  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}


function getCurrentMonth() {

  const now =
    new Date();


  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
}


function renderTodayLabel() {

  const element =
    document.getElementById(
      "todayLabel"
    );


  if (!element) return;


  element.textContent =
    new Intl.DateTimeFormat(
      "id-ID",
      {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    ).format(
      new Date()
    );
}


// ============================================================
// NUMBER / CURRENCY
// ============================================================

function numberValue(id) {

  const element =
    document.getElementById(id);


  return Number(
    element?.value || 0
  );
}


function formatRupiah(value) {

  const number =
    Number(
      value || 0
    );


  return new Intl.NumberFormat(
    "id-ID",
    {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0
    }
  ).format(number);
}


function sum(array, field) {

  return array.reduce(
    (total, item) =>
      total +
      Number(
        item[field] || 0
      ),
    0
  );
}


// ============================================================
// CATEGORY / STATUS
// ============================================================

function categoryEmoji(category) {

  const emojis = {

    Bensin:
      "⛽",

    Kuota:
      "📱",

    Makan:
      "🍜",

    Jajan:
      "🍰",

    Lainnya:
      "♡"
  };


  return (
    emojis[category] ||
    "♡"
  );
}


function priorityClass(priority) {

  return String(
    priority || ""
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      "-"
    );
}


function calendarStatusClass(status) {

  const map = {

    Kuliah:
      "kuliah",

    Libur:
      "libur",

    Izin:
      "izin",

    "Agenda luar kampus":
      "agenda"
  };


  return (
    map[status] ||
    ""
  );
}


// ============================================================
// GENERAL DOM HELPERS
// ============================================================

function setValue(id, value) {

  const element =
    document.getElementById(id);


  if (element) {

    element.value =
      value ?? "";
  }
}


function getValue(id) {

  return (
    document.getElementById(id)
      ?.value || ""
  ).trim();
}


function setText(id, value) {

  const element =
    document.getElementById(id);


  if (element) {

    element.textContent =
      value ?? "";
  }
}


// ============================================================
// TOAST
// ============================================================

function showToast(
  message,
  type = "success"
) {

  const container =
    document.getElementById(
      "toastContainer"
    );


  if (!container) return;


  const toast =
    document.createElement(
      "div"
    );


  toast.className =
    `toast ${type}`;


  const icon =
    type === "error"
      ? "!"
      : "♡";


  toast.innerHTML = `

    <span class="toast-icon">
      ${icon}
    </span>

    <span>
      ${escapeHTML(
        message
      )}
    </span>

  `;


  container.appendChild(
    toast
  );


  setTimeout(
    () => {

      toast.classList.add(
        "hide"
      );


      setTimeout(
        () => toast.remove(),
        300
      );

    },
    3000
  );
}


// ============================================================
// LOADING
// ============================================================

function showLoadingOverlay() {

  document
    .getElementById(
      "loadingOverlay"
    )
    ?.classList.add(
      "show"
    );
}


function hideLoadingOverlay() {

  document
    .getElementById(
      "loadingOverlay"
    )
    ?.classList.remove(
      "show"
    );
}


// ============================================================
// ESCAPE HTML
// ============================================================

function escapeHTML(value) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}


function escapeAttr(value) {
  return escapeHTML(value);
}
