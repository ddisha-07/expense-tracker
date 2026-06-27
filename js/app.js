// Montra: "Track less. Understand more." — Zero-Dependency SPA Runtime

// Default student categories HSL colors suited for dark glassmorphism
const CATEGORY_COLORS = {
  // Standard Categories
  'Food': '#06b6d4',             // Cyan
  'Transport': '#8b5cf6',        // Violet
  'Shopping': '#ec4899',         // Pink
  'Entertainment': '#f59e0b',    // Amber
  'Education': '#6366f1',        // Indigo
  'Health': '#10b981',           // Emerald
  'Bills': '#e11d48',            // Crimson

  // Student Arrangements
  'Rent/Hostel': '#f43f5e',      // Rose / Coral Red
  'Stationery': '#0ea5e9',       // Sky Blue
  'Miscellaneous': '#64748b',    // Slate Grey

  // Working Professional
  'Rent': '#f43f5e',             // Rose / Coral Red
  'Utilities': '#f97316',        // Vibrant Orange
  'Groceries': '#10b981',        // Emerald Green
  'Savings': '#22c55e',          // Vibrant Green
  'EMI/Loan': '#ef4444',         // Warning Red
  'Other Recurring': '#a855f7',  // Vibrant Purple

  // Fallbacks
  'Other': '#64748b'             // Slate Grey
};

// Initial database defaults
let state = {
  userName: 'Shekhar',
  income: 3000,
  initialBalance: 0,
  fixedExpenses: [
    { id: 'fx-1', name: 'Housing Rent', amount: 1200, frequency: 'monthly', paid: false },
    { id: 'fx-2', name: 'Phone Plan', amount: 45, frequency: 'monthly', paid: false },
    { id: 'fx-3', name: 'Gym / Sports', amount: 60, frequency: 'monthly', paid: false }
  ],
  budget_period: 'daily', // 'daily' | 'weekly'
  budgetValue: 60,
  categoryBudgets: {
    Food: 300,
    Transport: 100,
    Shopping: 200,
    Entertainment: 150,
    Education: 150,
    Health: 100,
    Bills: 1400,
    Other: 100
  },
  transactions: [],
  theme: 'dark',
  onboardingCompleted: false,
  currencySymbol: '₹',
  occupation: 'Student',
  savingsGoalActive: false,
  savingsGoalTitle: '',
  savingsGoalTarget: 0
};

// Global variables
let currentOnboardingStep = 1;
const totalOnboardingSteps = 5;
let currentTab = 'analytics'; // 'analytics' | 'ledger' | 'insights' | 'budgets'
let lastDeletedTransaction = null;
let toastTimeout = null;
let searchQuery = '';
let selectedCatFilter = 'all';
let editingTransactionId = null;

// Monefy rapid entries parameters
let numpadAmountStr = '0';
let numpadCategory = 'Food';
let numpadType = 'expense';

// -------------------------------------------------------------
// LIFE CYCLE INIT
// -------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadState();
  } catch (e) {
    console.error('Error loading state:', e);
  }

  try {
    applyTheme(state.theme);
  } catch (e) {
    console.error('Error applying theme:', e);
  }

  // Always bind event listeners first to ensure buttons work even if view rendering crashes
  try {
    setupGlobalEventListeners();
  } catch (e) {
    console.error('Error setting up global event listeners:', e);
  }

  try {
    if (state.onboardingCompleted) {
      showDashboardView();
    } else {
      showOnboardingView();
      initOnboardingUI();
    }
  } catch (e) {
    console.error('Error showing views:', e);
  }

  try {
    lucide.createIcons();
  } catch (e) {
    console.error('Error creating icons:', e);
  }
});

// -------------------------------------------------------------
// STATE STORAGE
// -------------------------------------------------------------
function saveState() {
  localStorage.setItem('montra_student_state', JSON.stringify(state));
}

function loadState() {
  const saved = localStorage.getItem('montra_student_state');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        // Defensive sanitization of all critical state properties
        if (parsed.userName !== undefined && typeof parsed.userName === 'string') state.userName = parsed.userName;
        if (parsed.income !== undefined && !isNaN(Number(parsed.income))) state.income = Number(parsed.income);
        if (parsed.fixedExpenses !== undefined && Array.isArray(parsed.fixedExpenses)) {
          state.fixedExpenses = parsed.fixedExpenses.filter(item => item && typeof item === 'object' && item.id);
        }
        if (parsed.budget_period !== undefined && typeof parsed.budget_period === 'string') state.budget_period = parsed.budget_period;
        if (parsed.budgetValue !== undefined && !isNaN(Number(parsed.budgetValue))) state.budgetValue = Number(parsed.budgetValue);
        if (parsed.categoryBudgets !== undefined && typeof parsed.categoryBudgets === 'object' && parsed.categoryBudgets !== null) {
          state.categoryBudgets = { ...state.categoryBudgets, ...parsed.categoryBudgets };
        }
        if (parsed.transactions !== undefined && Array.isArray(parsed.transactions)) {
          state.transactions = parsed.transactions.filter(item => item && typeof item === 'object' && item.id);
        }
        if (parsed.theme !== undefined && typeof parsed.theme === 'string') state.theme = parsed.theme;
        if (parsed.onboardingCompleted !== undefined && typeof parsed.onboardingCompleted === 'boolean') {
          state.onboardingCompleted = parsed.onboardingCompleted;
        }
        if (parsed.currencySymbol !== undefined && typeof parsed.currencySymbol === 'string') state.currencySymbol = parsed.currencySymbol;
        if (parsed.occupation !== undefined && typeof parsed.occupation === 'string') state.occupation = parsed.occupation;
        if (parsed.categories !== undefined && Array.isArray(parsed.categories)) {
          state.categories = parsed.categories.filter(item => typeof item === 'string');
        }
        if (parsed.activeMonth !== undefined && typeof parsed.activeMonth === 'string') state.activeMonth = parsed.activeMonth;
        if (parsed.lifestyleProfile !== undefined && typeof parsed.lifestyleProfile === 'object' && parsed.lifestyleProfile !== null) {
          state.lifestyleProfile = parsed.lifestyleProfile;
        }
        if (parsed.savingsGoalActive !== undefined) state.savingsGoalActive = !!parsed.savingsGoalActive;
        if (parsed.savingsGoalTitle !== undefined && typeof parsed.savingsGoalTitle === 'string') state.savingsGoalTitle = parsed.savingsGoalTitle;
        if (parsed.savingsGoalTarget !== undefined && !isNaN(Number(parsed.savingsGoalTarget))) state.savingsGoalTarget = Number(parsed.savingsGoalTarget);
        if (parsed.initialBalance !== undefined && !isNaN(Number(parsed.initialBalance))) state.initialBalance = Number(parsed.initialBalance);
      }
    } catch (e) {
      console.error('Error parsing localStorage state', e);
    }
  }

  // Schema-level validation and fallback guarantees
  if (!Array.isArray(state.fixedExpenses)) {
    state.fixedExpenses = [
      { id: 'fx-1', name: 'Housing Rent', amount: 1200, frequency: 'monthly', paid: false },
      { id: 'fx-2', name: 'Phone Plan', amount: 45, frequency: 'monthly', paid: false },
      { id: 'fx-3', name: 'Gym / Sports', amount: 60, frequency: 'monthly', paid: false }
    ];
  }
  if (!Array.isArray(state.transactions)) {
    state.transactions = [];
  }
  if (typeof state.categoryBudgets !== 'object' || state.categoryBudgets === null) {
    state.categoryBudgets = {
      Food: 300,
      Transport: 100,
      Shopping: 200,
      Entertainment: 150,
      Education: 150,
      Health: 100,
      Bills: 1400,
      Other: 100
    };
  }
  if (!Array.isArray(state.categories) || state.categories.length === 0) {
    state.categories = Object.keys(state.categoryBudgets);
  }
  if (typeof state.userName !== 'string' || !state.userName.trim()) {
    state.userName = 'Shekhar';
  }
  if (typeof state.theme !== 'string') {
    state.theme = 'dark';
  }
  if (typeof state.currencySymbol !== 'string') {
    state.currencySymbol = '₹';
  }
  if (typeof state.occupation !== 'string') {
    state.occupation = 'Student';
  }
  if (state.savingsGoalActive === undefined) {
    state.savingsGoalActive = false;
  }
  if (state.savingsGoalTitle === undefined) {
    state.savingsGoalTitle = '';
  }
  if (state.savingsGoalTarget === undefined || isNaN(Number(state.savingsGoalTarget))) {
    state.savingsGoalTarget = 0;
  }
  if (state.initialBalance === undefined || isNaN(Number(state.initialBalance))) {
    state.initialBalance = 0;
  }

  if (!state.lifestyleProfile || typeof state.lifestyleProfile !== 'object') {
    state.lifestyleProfile = {
      arrangement: 'PG',
      rent: 1200,
      food: 600,
      transport: 200,
      stationery: 150,
      education: 400,
      groceries: 300,
      shopping: 250,
      misc: 200
    };
  } else {
    if (state.lifestyleProfile.arrangement === undefined) state.lifestyleProfile.arrangement = 'PG';
    if (state.lifestyleProfile.rent === undefined) state.lifestyleProfile.rent = 1200;
    if (state.lifestyleProfile.food === undefined) state.lifestyleProfile.food = 600;
    if (state.lifestyleProfile.transport === undefined) state.lifestyleProfile.transport = 200;
    if (state.lifestyleProfile.stationery === undefined) state.lifestyleProfile.stationery = 150;
    if (state.lifestyleProfile.education === undefined) state.lifestyleProfile.education = 400;
    if (state.lifestyleProfile.groceries === undefined) state.lifestyleProfile.groceries = 300;
    if (state.lifestyleProfile.shopping === undefined) state.lifestyleProfile.shopping = 250;
    if (state.lifestyleProfile.misc === undefined) state.lifestyleProfile.misc = 200;
  }

  // Migrate/guarantee Student categories for Groceries and Shopping
  if (state.occupation === 'Student') {
    if (!state.categories.includes('Groceries') || !state.categories.includes('Shopping')) {
      const ordered = ['Rent/Hostel', 'Food', 'Transport', 'Stationery', 'Education', 'Groceries', 'Shopping', 'Miscellaneous'];
      const merged = [];
      ordered.forEach(cat => {
        if (state.categories.includes(cat) || cat === 'Groceries' || cat === 'Shopping') {
          merged.push(cat);
        }
      });
      state.categories.forEach(cat => {
        if (!merged.includes(cat)) {
          merged.push(cat);
        }
      });
      state.categories = merged;
    }
    if (state.categoryBudgets['Groceries'] === undefined) {
      state.categoryBudgets['Groceries'] = 300;
    }
    if (state.categoryBudgets['Shopping'] === undefined) {
      state.categoryBudgets['Shopping'] = 250;
    }
  }
}

function applyTheme(themeName) {
  state.theme = themeName;
  document.documentElement.setAttribute('data-theme', themeName);
  const btn = document.getElementById('themeToggleBtn');
  if (btn) {
    btn.innerHTML = themeName === 'dark'
      ? `<i data-lucide="sun" class="w-5 h-5"></i>`
      : `<i data-lucide="moon" class="w-5 h-5"></i>`;
    lucide.createIcons();
  }
  saveState();

  // Redraw SVG charts to adapt grid lines and label texts if dashboard is active
  if (state.onboardingCompleted) {
    drawAllSvgCharts();
  }
}

// -------------------------------------------------------------
// ONBOARDING SCREEN SLIDER ROUTINES
// -------------------------------------------------------------
function showOnboardingView() {
  document.getElementById('onboardingContainer').style.display = 'flex';
  document.getElementById('dashboardContainer').style.display = 'none';
  document.getElementById('floatingAddBtn').style.display = 'none';
}

function showDashboardView() {
  document.getElementById('onboardingContainer').style.display = 'none';
  document.getElementById('dashboardContainer').style.display = 'block';
  document.getElementById('floatingAddBtn').style.display = 'flex';

  initMonthFilter();
  renderNumpadCategoryGrid();
  renderLedgerCategoryFilter();
  refreshDashboard();
}

function initOnboardingUI() {
  currentOnboardingStep = 1;

  // Set default values if not present
  if (!state.userName) state.userName = 'John Doe';
  if (!state.currencySymbol) state.currencySymbol = '₹';
  if (!state.occupation) state.occupation = 'Student';

  // Synchronize onboarding username
  const obUserName = document.getElementById('obUserName');
  if (obUserName) {
    obUserName.value = state.userName || 'John Doe';
  }

  // Synchronize onboarding initial balance
  const obInitialBalance = document.getElementById('obInitialBalance');
  if (obInitialBalance) {
    obInitialBalance.value = state.initialBalance || 0;
  }

  // Synchronize onboarding grid selections
  document.querySelectorAll('#obCurrencyGrid button').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.currency === state.currencySymbol) {
      btn.classList.add('selected');
    }
  });

  document.querySelectorAll('#obOccupationGrid button').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.occupation === state.occupation) {
      btn.classList.add('selected');
    }
  });

  // Load dynamic Slide 3 values from state
  const isStudent = (state.occupation === 'Student');
  if (isStudent) {
    const stInflow = document.getElementById('obStudentInflow');
    if (stInflow) stInflow.value = state.income || 3000;

    if (state.lifestyleProfile) {
      const obStudentRent = document.getElementById('obStudentRent');
      if (obStudentRent) obStudentRent.value = state.lifestyleProfile.rent || 1200;

      const obStudentFood = document.getElementById('obStudentFood');
      if (obStudentFood) obStudentFood.value = state.lifestyleProfile.food || 600;

      const obStudentTransport = document.getElementById('obStudentTransport');
      if (obStudentTransport) obStudentTransport.value = state.lifestyleProfile.transport || 200;

      const obStudentStationery = document.getElementById('obStudentStationery');
      if (obStudentStationery) obStudentStationery.value = state.lifestyleProfile.stationery || 150;

      const obStudentEducation = document.getElementById('obStudentEducation');
      if (obStudentEducation) obStudentEducation.value = state.lifestyleProfile.education || 400;

      const obStudentGroceries = document.getElementById('obStudentGroceries');
      if (obStudentGroceries) obStudentGroceries.value = state.lifestyleProfile.groceries || 300;

      const obStudentShopping = document.getElementById('obStudentShopping');
      if (obStudentShopping) obStudentShopping.value = state.lifestyleProfile.shopping || 250;

      const obStudentMisc = document.getElementById('obStudentMisc');
      if (obStudentMisc) obStudentMisc.value = state.lifestyleProfile.misc || 200;

      const arrangement = state.lifestyleProfile.arrangement || 'PG';
      document.querySelectorAll('#obLivingArrangementGrid button').forEach(b => {
        b.classList.remove('selected');
        if (b.dataset.status === arrangement) b.classList.add('selected');
      });
      const rentWrapper = document.getElementById('obStudentRentWrapper');
      if (rentWrapper) rentWrapper.style.display = (arrangement === 'Home') ? 'none' : 'block';
    }
  } else {
    const wkInflow = document.getElementById('obWorkingInflow');
    if (wkInflow) wkInflow.value = state.income || 50000;

    if (state.lifestyleProfile) {
      const obWorkingRent = document.getElementById('obWorkingRent');
      if (obWorkingRent) obWorkingRent.value = state.lifestyleProfile.rent || 15000;

      const obWorkingUtilities = document.getElementById('obWorkingUtilities');
      if (obWorkingUtilities) obWorkingUtilities.value = state.lifestyleProfile.utilities || 4000;

      const obWorkingTransport = document.getElementById('obWorkingTransport');
      if (obWorkingTransport) obWorkingTransport.value = state.lifestyleProfile.transport || 3000;

      const obWorkingGroceries = document.getElementById('obWorkingGroceries');
      if (obWorkingGroceries) obWorkingGroceries.value = state.lifestyleProfile.groceries || 8000;

      const obWorkingSavings = document.getElementById('obWorkingSavings');
      if (obWorkingSavings) obWorkingSavings.value = state.lifestyleProfile.savings || 12000;

      const obWorkingEMI = document.getElementById('obWorkingEMI');
      if (obWorkingEMI) obWorkingEMI.value = state.lifestyleProfile.emi || 5000;

      const obWorkingOther = document.getElementById('obWorkingOther');
      if (obWorkingOther) obWorkingOther.value = state.lifestyleProfile.other || 3000;
    }
  }

  updateOnboardingCurrencySymbols();
  updateOnboardingStepper();
  renderOnboardingFixedBills();
  recalculateSuggestedBudgets();
}

function updateOnboardingStepper() {
  const track = document.getElementById('onboardingTrack');
  const slideIdx = currentOnboardingStep - 1;
  track.style.transform = `translateX(-${slideIdx * 100}%)`;

  // Set active classes
  document.querySelectorAll('.onboarding-slide').forEach((slide, i) => {
    if (i === slideIdx) {
      slide.classList.add('active');
    } else {
      slide.classList.remove('active');
    }
  });

  // Lines
  document.querySelectorAll('.step-indicator').forEach((line, i) => {
    line.classList.remove('active', 'completed');
    if (i + 1 === currentOnboardingStep) {
      line.classList.add('active');
    } else if (i + 1 < currentOnboardingStep) {
      line.classList.add('completed');
    }
  });

  // Render correct Lifestyle Calibrator form conditional blocks
  if (currentOnboardingStep === 3) {
    const isStudent = (state.occupation === 'Student');
    const studentForm = document.getElementById('obStudentProfileForm');
    const workingForm = document.getElementById('obWorkingProfileForm');

    if (studentForm && workingForm) {
      if (isStudent) {
        studentForm.style.display = 'flex';
        workingForm.style.display = 'none';
      } else {
        studentForm.style.display = 'none';
        workingForm.style.display = 'flex';
      }
    }
  }
}

function renderOnboardingFixedBills() {
  const container = document.getElementById('obFixedExpensesList');
  container.innerHTML = '';

  const symbol = state.currencySymbol || '₹';
  state.fixedExpenses.forEach((bill, idx) => {
    const row = document.createElement('div');
    row.className = 'fixed-bill-item';
    row.innerHTML = `
      <input type="text" value="${bill.name}" placeholder="Housing Rent..." class="bill-name-in" data-index="${idx}" title="Fill descriptive name of this fixed commitment">
      <input type="number" value="${bill.amount}" placeholder="${symbol}0" class="bill-amount-in" data-index="${idx}" title="Fill paid amount for this commitment">
      <select class="bill-freq-in" data-index="${idx}" title="Choose if this is paid Monthly, Weekly, or just One-Time">
        <option value="monthly" ${bill.frequency === 'monthly' ? 'selected' : ''}>Monthly Recurring</option>
        <option value="weekly" ${bill.frequency === 'weekly' ? 'selected' : ''}>Weekly Recurring</option>
        <option value="once" ${bill.frequency === 'once' ? 'selected' : ''}>One-time Payment</option>
      </select>
      <button class="delete-bill-btn ob-remove-bill-btn" data-index="${idx}" title="Remove this commitment">
        <i data-lucide="trash-2" class="w-4 h-4"></i>
      </button>
    `;
    container.appendChild(row);
  });

  lucide.createIcons();
  setupOnboardingInputListeners();
}

function setupOnboardingInputListeners() {
  document.querySelectorAll('.bill-name-in').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.index;
      state.fixedExpenses[idx].name = e.target.value;
      saveState();
      recalculateSuggestedBudgets();
    });
  });

  document.querySelectorAll('.bill-amount-in').forEach(input => {
    input.addEventListener('change', (e) => {
      const idx = e.target.dataset.index;
      state.fixedExpenses[idx].amount = parseFloat(e.target.value) || 0;
      saveState();
      recalculateSuggestedBudgets();
    });
  });

  document.querySelectorAll('.bill-freq-in').forEach(select => {
    select.addEventListener('change', (e) => {
      const idx = e.target.dataset.index;
      state.fixedExpenses[idx].frequency = e.target.value;
      saveState();
      recalculateSuggestedBudgets();
    });
  });

  document.querySelectorAll('.ob-remove-bill-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = btn.dataset.index;
      state.fixedExpenses.splice(idx, 1);
      saveState();
      renderOnboardingFixedBills();
      recalculateSuggestedBudgets();
    });
  });
}

function getMonthlyEquivalentOfBill(bill) {
  const freq = bill.frequency || 'monthly';
  if (freq === 'weekly') {
    return bill.amount * 4.33; // 4.33 weeks per month
  }
  return bill.amount; // monthly or once-off commitment
}

function recalculateSuggestedBudgets() {
  const isStudent = (state.occupation === 'Student');
  let incomeInput = 0;
  if (isStudent) {
    const obStudentInflow = document.getElementById('obStudentInflow');
    incomeInput = obStudentInflow ? (parseFloat(obStudentInflow.value) || 0) : 3000;
  } else {
    const obWorkingInflow = document.getElementById('obWorkingInflow');
    incomeInput = obWorkingInflow ? (parseFloat(obWorkingInflow.value) || 0) : 50000;
  }

  const billsTotal = state.fixedExpenses.reduce((sum, b) => sum + getMonthlyEquivalentOfBill(b), 0);
  const remaining = Math.max(0, incomeInput - billsTotal);

  const symbol = state.currencySymbol || '₹';
  const occupation = state.occupation || 'Student';

  document.getElementById('obSummaryIncome').innerText = `${symbol}${incomeInput.toLocaleString()}`;
  document.getElementById('obSummaryBills').innerText = `${symbol}${billsTotal.toLocaleString()}`;
  document.getElementById('obSummaryDisposable').innerText = `${symbol}${remaining.toLocaleString()}`;

  // Suggestions targets based on occupation-specific ratios
  let spendableRatio = 0.70; // Student default
  if (occupation === 'Working') {
    spendableRatio = 0.50;
  } else if (occupation === 'Freelancer') {
    spendableRatio = 0.60;
  } else if (occupation === 'Other') {
    spendableRatio = 0.65;
  }

  const dailySuggested = Math.round((remaining * spendableRatio) / 30.5);
  const weeklySuggested = Math.round((remaining * spendableRatio) / 4.3);

  document.getElementById('obDailyAmount').innerText = `${symbol}${dailySuggested}`;
  document.getElementById('obWeeklyAmount').innerText = `${symbol}${weeklySuggested}`;

  const pctStr = `${Math.round(spendableRatio * 100)}% spendable caps`;
  const obDailyCard = document.getElementById('obDailyCard');
  if (obDailyCard) {
    const sub = obDailyCard.querySelector('.budget-tier-subtitle');
    if (sub) sub.innerText = pctStr;
  }
  const obWeeklyCard = document.getElementById('obWeeklyCard');
  if (obWeeklyCard) {
    const sub = obWeeklyCard.querySelector('.budget-tier-subtitle');
    if (sub) sub.innerText = pctStr;
  }

  const obSlide5Desc = document.querySelector('#slide-5 .slide-desc');
  if (obSlide5Desc) {
    obSlide5Desc.innerText = `YNAB-inspired remaining spend indexes for a ${occupation}. We suggest allocating ${Math.round(spendableRatio * 100)}% as spendable allowances, saving the rest.`;
  }

  if (state.budget_period === 'daily') {
    state.budgetValue = dailySuggested > 0 ? dailySuggested : 20;
  } else {
    state.budgetValue = weeklySuggested > 0 ? weeklySuggested : 150;
  }
}

function updateOnboardingIncomePresets() {
  const occupation = state.occupation || 'Student';
  const symbol = state.currencySymbol || '₹';

  let presets = [1200, 3000, 5000, 8000]; // default Student
  if (occupation === 'Working') {
    presets = [25000, 50000, 80000, 120000];
  } else if (occupation === 'Freelancer') {
    presets = [15000, 30000, 60000, 100000];
  } else if (occupation === 'Other') {
    presets = [10000, 20000, 40000, 70000];
  }

  const badges = document.querySelectorAll('.preset-badge');
  badges.forEach((badge, idx) => {
    const val = presets[idx] || 3000;
    badge.dataset.value = val;
    badge.innerText = `${symbol}${val.toLocaleString()}`;
  });

  const obIncomeInput = document.getElementById('obIncomeInput');
  if (obIncomeInput) {
    const currentVal = parseFloat(obIncomeInput.value);
    if (!presets.includes(currentVal)) {
      obIncomeInput.value = presets[1];
      state.income = presets[1];
      saveState();

      badges.forEach((b, i) => {
        b.classList.remove('selected');
        if (i === 1) b.classList.add('selected');
      });
    }
  }
}

function updateOnboardingCurrencySymbols() {
  const symbol = state.currencySymbol || '₹';

  document.querySelectorAll('.currency-symbol-lbl').forEach(el => {
    el.innerText = symbol;
  });

  updateOnboardingIncomePresets();
  recalculateSuggestedBudgets();
}

function updateDynamicCurrencySymbolsAcrossApp() {
  const symbol = state.currencySymbol || '₹';

  // Settings Icon Setup
  const settingsIcon = document.querySelector('#stIncomeVal')?.previousElementSibling;
  if (settingsIcon) {
    const currencyIcons = { '₹': 'indian-rupee', '$': 'dollar-sign', '£': 'pound-sterling', '€': 'euro' };
    const iconName = currencyIcons[symbol] || 'wallet';
    settingsIcon.setAttribute('data-lucide', iconName);
    lucide.createIcons();
  }

  // Keypad display symbol
  const numpadSym = document.querySelector('#numpadAmountValContainer span:first-child');
  if (numpadSym) {
    numpadSym.innerText = symbol;
  }
}

function onboardingStepNext() {
  if (currentOnboardingStep === 3) {
    const isStudent = (state.occupation === 'Student');
    let inflow = 0;
    let lifestyleProfile = {};

    if (isStudent) {
      const obStudentInflow = parseFloat(document.getElementById('obStudentInflow').value);
      const obStudentRent = parseFloat(document.getElementById('obStudentRent').value) || 0;
      const obStudentFood = parseFloat(document.getElementById('obStudentFood').value) || 0;
      const obStudentTransport = parseFloat(document.getElementById('obStudentTransport').value) || 0;
      const obStudentStationery = parseFloat(document.getElementById('obStudentStationery').value) || 0;
      const obStudentEducation = parseFloat(document.getElementById('obStudentEducation').value) || 0;
      const obStudentGroceries = parseFloat(document.getElementById('obStudentGroceries').value) || 0;
      const obStudentShopping = parseFloat(document.getElementById('obStudentShopping').value) || 0;
      const obStudentMisc = parseFloat(document.getElementById('obStudentMisc').value) || 0;

      const activeArrangement = document.querySelector('#obLivingArrangementGrid button.selected');
      const arrangement = activeArrangement ? activeArrangement.dataset.status : 'PG';

      if (isNaN(obStudentInflow) || obStudentInflow <= 0) {
        showToast('Please enter a valid monthly stipend/inflow.', 'error');
        return;
      }

      inflow = obStudentInflow;
      lifestyleProfile = {
        arrangement,
        rent: arrangement === 'Home' ? 0 : obStudentRent,
        food: obStudentFood,
        transport: obStudentTransport,
        stationery: obStudentStationery,
        education: obStudentEducation,
        groceries: obStudentGroceries,
        shopping: obStudentShopping,
        misc: obStudentMisc
      };

      // Auto-populate student dynamic category budgets
      state.categoryBudgets = {
        'Rent/Hostel': lifestyleProfile.rent,
        'Food': lifestyleProfile.food,
        'Transport': lifestyleProfile.transport,
        'Stationery': lifestyleProfile.stationery,
        'Education': lifestyleProfile.education,
        'Groceries': lifestyleProfile.groceries,
        'Shopping': lifestyleProfile.shopping,
        'Miscellaneous': lifestyleProfile.misc
      };

      // Set standard categories list
      state.categories = ['Rent/Hostel', 'Food', 'Transport', 'Stationery', 'Education', 'Groceries', 'Shopping', 'Miscellaneous'];

      // Setup auto-populated fixed commitments
      state.fixedExpenses = [];
      if (lifestyleProfile.rent > 0) {
        state.fixedExpenses.push({
          id: 'fx-rent',
          name: `${arrangement} Rent`,
          amount: lifestyleProfile.rent,
          frequency: 'monthly',
          paid: false
        });
      }
    } else {
      // Working / Earning Professional
      const obWorkingInflow = parseFloat(document.getElementById('obWorkingInflow').value);
      const obWorkingRent = parseFloat(document.getElementById('obWorkingRent').value) || 0;
      const obWorkingUtilities = parseFloat(document.getElementById('obWorkingUtilities').value) || 0;
      const obWorkingTransport = parseFloat(document.getElementById('obWorkingTransport').value) || 0;
      const obWorkingGroceries = parseFloat(document.getElementById('obWorkingGroceries').value) || 0;
      const obWorkingSavings = parseFloat(document.getElementById('obWorkingSavings').value) || 0;
      const obWorkingEMI = parseFloat(document.getElementById('obWorkingEMI').value) || 0;
      const obWorkingOther = parseFloat(document.getElementById('obWorkingOther').value) || 0;

      if (isNaN(obWorkingInflow) || obWorkingInflow <= 0) {
        showToast('Please enter a valid monthly salary/inflow.', 'error');
        return;
      }

      inflow = obWorkingInflow;
      lifestyleProfile = {
        rent: obWorkingRent,
        utilities: obWorkingUtilities,
        transport: obWorkingTransport,
        groceries: obWorkingGroceries,
        savings: obWorkingSavings,
        emi: obWorkingEMI,
        other: obWorkingOther
      };

      // Auto-populate professional dynamic category budgets
      state.categoryBudgets = {
        'Rent': lifestyleProfile.rent,
        'Utilities': lifestyleProfile.utilities,
        'Transport': lifestyleProfile.transport,
        'Groceries': lifestyleProfile.groceries,
        'Savings': lifestyleProfile.savings,
        'EMI/Loan': lifestyleProfile.emi,
        'Other Recurring': lifestyleProfile.other
      };

      // Set standard categories list
      state.categories = ['Rent', 'Utilities', 'Transport', 'Groceries', 'Savings', 'EMI/Loan', 'Other Recurring'];

      // Setup auto-populated fixed commitments
      state.fixedExpenses = [];
      if (lifestyleProfile.rent > 0) {
        state.fixedExpenses.push({ id: 'fx-rent', name: 'Housing Rent', amount: lifestyleProfile.rent, frequency: 'monthly', paid: false });
      }
      if (lifestyleProfile.utilities > 0) {
        state.fixedExpenses.push({ id: 'fx-util', name: 'Utilities Bills', amount: lifestyleProfile.utilities, frequency: 'monthly', paid: false });
      }
      if (lifestyleProfile.emi > 0) {
        state.fixedExpenses.push({ id: 'fx-emi', name: 'EMI Loan Payment', amount: lifestyleProfile.emi, frequency: 'monthly', paid: false });
      }
    }

    state.income = inflow;
    state.lifestyleProfile = lifestyleProfile;
    saveState();

    // Update Slide 4 dynamic fixed commitments checker
    renderOnboardingFixedBills();
    recalculateSuggestedBudgets();
  }

  if (currentOnboardingStep < totalOnboardingSteps) {
    currentOnboardingStep++;
    updateOnboardingStepper();
  }
}

function onboardingStepBack() {
  if (currentOnboardingStep > 1) {
    currentOnboardingStep--;
    updateOnboardingStepper();
  }
}

function completeOnboarding() {
  state.onboardingCompleted = true;

  const obUserName = document.getElementById('obUserName');
  if (obUserName && obUserName.value.trim()) {
    state.userName = obUserName.value.trim();
  } else if (!state.userName) {
    state.userName = 'Shekhar';
  }

  const obInitialBalance = document.getElementById('obInitialBalance');
  if (obInitialBalance) {
    const val = parseFloat(obInitialBalance.value);
    state.initialBalance = isNaN(val) ? 0 : val;
  }

  // Set default category budget distributions based on selected occupation profile only if not already dynamically calibrated in Slide 3
  const occupation = state.occupation || 'Student';
  const income = state.income || 3000;

  const hasDynamicBudget = state.categoryBudgets && (
    state.categoryBudgets['Rent/Hostel'] !== undefined ||
    state.categoryBudgets['Rent'] !== undefined ||
    state.categoryBudgets['Utilities'] !== undefined ||
    state.categoryBudgets['Groceries'] !== undefined
  );

  if (!hasDynamicBudget) {
    if (occupation === 'Student') {
      state.categoryBudgets = {
        Food: Math.round(income * 0.25),
        Transport: Math.round(income * 0.10),
        Shopping: Math.round(income * 0.10),
        Entertainment: Math.round(income * 0.15),
        Education: Math.round(income * 0.20),
        Health: Math.round(income * 0.05),
        Bills: Math.round(income * 0.10),
        Other: Math.round(income * 0.05)
      };
    } else if (occupation === 'Working') {
      state.categoryBudgets = {
        Food: Math.round(income * 0.15),
        Transport: Math.round(income * 0.15),
        Shopping: Math.round(income * 0.15),
        Entertainment: Math.round(income * 0.10),
        Education: Math.round(income * 0.02),
        Health: Math.round(income * 0.10),
        Bills: Math.round(income * 0.30),
        Other: Math.round(income * 0.03)
      };
    } else if (occupation === 'Freelancer') {
      state.categoryBudgets = {
        Food: Math.round(income * 0.15),
        Transport: Math.round(income * 0.15),
        Shopping: Math.round(income * 0.10),
        Entertainment: Math.round(income * 0.10),
        Education: Math.round(income * 0.05),
        Health: Math.round(income * 0.05),
        Bills: Math.round(income * 0.20),
        Other: Math.round(income * 0.20)
      };
    } else {
      state.categoryBudgets = {
        Food: Math.round(income * 0.20),
        Transport: Math.round(income * 0.12),
        Shopping: Math.round(income * 0.12),
        Entertainment: Math.round(income * 0.12),
        Education: Math.round(income * 0.05),
        Health: Math.round(income * 0.08),
        Bills: Math.round(income * 0.25),
        Other: Math.round(income * 0.06)
      };
    }
  }

  saveState();

  showDashboardView();
  showToast('Welcome to Montra sandbox! Complete access granted.', 'success');
}

function openLogoutModal() {
  const overlay = document.getElementById('logoutModalOverlay');
  if (overlay) {
    overlay.classList.add('open');
  }
}

function closeLogoutModal() {
  const overlay = document.getElementById('logoutModalOverlay');
  if (overlay) {
    overlay.classList.remove('open');
  }
}

function executeLogout(saveBackup = false) {
  if (saveBackup) {
    handleExportBackup();
  }

  // Format state completely back to initial factory defaults for a clean setup wizard refresh
  state = {
    income: 3000,
    initialBalance: 0,
    fixedExpenses: [
      { id: 'fx-1', name: 'Housing Rent', amount: 1200, frequency: 'monthly', paid: false },
      { id: 'fx-2', name: 'Phone Plan', amount: 45, frequency: 'monthly', paid: false },
      { id: 'fx-3', name: 'Gym / Sports', amount: 60, frequency: 'monthly', paid: false }
    ],
    budget_period: 'daily',
    budgetValue: 60,
    categoryBudgets: {
      Food: 300,
      Transport: 100,
      Shopping: 200,
      Entertainment: 150,
      Education: 150,
      Health: 100,
      Bills: 1400,
      Other: 100
    },
    transactions: [],
    theme: state.theme,
    onboardingCompleted: false,
    currencySymbol: '₹',
    occupation: 'Student',
    userName: 'Shekhar'
  };
  saveState();

  closeLogoutModal();
  showToast('Logged out. Setup wizard has been fully refreshed.', 'info');
  showOnboardingView();
  initOnboardingUI();
}

function handleLogoutAndRestart() {
  openLogoutModal();
}

// -------------------------------------------------------------
function injectMockStudentTransactions() {
  const now = new Date();
  const formatOffsetDate = (days) => {
    const d = new Date();
    d.setDate(now.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  // Safe category mapping based on dynamically chosen profile categories
  const getMatchingCategory = (cat) => {
    if (!state.categories || state.categories.length === 0) {
      return cat;
    }
    if (state.categories.includes(cat)) return cat;

    const map = {
      'Other': state.categories.includes('Miscellaneous') ? 'Miscellaneous' : (state.categories.includes('Other Recurring') ? 'Other Recurring' : state.categories[0]),
      'Bills': state.categories.includes('Rent') ? 'Rent' : (state.categories.includes('Rent/Hostel') ? 'Rent/Hostel' : (state.categories.includes('Utilities') ? 'Utilities' : state.categories[0])),
      'Food': state.categories.includes('Groceries') ? 'Groceries' : state.categories[0],
      'Transport': state.categories.includes('Transport') ? 'Transport' : state.categories[0],
      'Entertainment': state.categories.includes('Miscellaneous') ? 'Miscellaneous' : (state.categories.includes('Other Recurring') ? 'Other Recurring' : state.categories[0]),
      'Shopping': state.categories.includes('Miscellaneous') ? 'Miscellaneous' : (state.categories.includes('Other Recurring') ? 'Other Recurring' : state.categories[0]),
      'Education': state.categories.includes('Education') ? 'Education' : (state.categories.includes('Stationery') ? 'Stationery' : state.categories[0]),
      'Health': state.categories.includes('Miscellaneous') ? 'Miscellaneous' : (state.categories.includes('Other Recurring') ? 'Other Recurring' : state.categories[0])
    };
    return map[cat] || state.categories[0];
  };

  // Add Income
  state.transactions = [
    {
      id: 'tx-init-stipend',
      title: 'Stipend / Allowance credit',
      amount: state.income,
      type: 'income',
      category: getMatchingCategory('Other'),
      date: formatOffsetDate(10),
      description: 'Initial monthly budget allocation'
    }
  ];

  // Log active fixed bills
  state.fixedExpenses.forEach((bill, idx) => {
    state.transactions.push({
      id: `tx-init-fixed-${idx}`,
      title: `${bill.name} (Auto-Debit)`,
      amount: bill.amount,
      type: 'expense',
      category: getMatchingCategory('Bills'),
      date: formatOffsetDate(8 - idx),
      description: 'Fixed monthly obligation'
    });
  });

  // Dynamic daily expenses
  state.transactions.push(
    {
      id: 'tx-mock-1',
      title: 'Whole Foods Groceries',
      amount: 110.00,
      type: 'expense',
      category: getMatchingCategory('Food'),
      date: formatOffsetDate(1),
      description: 'Weekly student provisions'
    },
    {
      id: 'tx-mock-2',
      title: 'Subway Train Ride',
      amount: 12.50,
      type: 'expense',
      category: getMatchingCategory('Transport'),
      date: formatOffsetDate(0),
      description: 'Commute to campus'
    },
    {
      id: 'tx-mock-3',
      title: 'Starbucks Coffee combo',
      amount: 8.90,
      type: 'expense',
      category: getMatchingCategory('Food'),
      date: formatOffsetDate(1),
      description: 'Espresso session'
    },
    {
      id: 'tx-mock-4',
      title: 'Netflix Standard sub',
      amount: 15.49,
      type: 'expense',
      category: getMatchingCategory('Entertainment'),
      date: formatOffsetDate(3),
      description: 'Dorm stream sub'
    },
    {
      id: 'tx-mock-5',
      title: 'Semester Textbooks store',
      amount: 75.00,
      type: 'expense',
      category: getMatchingCategory('Education'),
      date: formatOffsetDate(4),
      description: 'Course textbooks'
    },
    {
      id: 'tx-mock-6',
      title: 'Pharmacy Cold medicine',
      amount: 18.00,
      type: 'expense',
      category: getMatchingCategory('Health'),
      date: formatOffsetDate(2),
      description: 'Vitamin C'
    },
    {
      id: 'tx-mock-7',
      title: 'Campus Gym access',
      amount: 45.00,
      type: 'expense',
      category: getMatchingCategory('Bills'),
      date: formatOffsetDate(5),
      description: 'Monthly student pass'
    },
    {
      id: 'tx-mock-8',
      title: 'H&M Jacket Shopping',
      amount: 54.00,
      type: 'expense',
      category: getMatchingCategory('Shopping'),
      date: formatOffsetDate(2),
      description: 'Dorm wear'
    }
  );

  saveState();
}

// -------------------------------------------------------------
// FINANCIAL METRICS MATHEMATICS
// -------------------------------------------------------------
function getMonthlyIncome(year, month) {
  const incomesList = state.transactions.filter(t => {
    if (!t.date) return false;
    const d = new Date(t.date);
    return t.type === 'income' && d.getMonth() === month && d.getFullYear() === year;
  });
  return incomesList.reduce((sum, t) => sum + t.amount, 0);
}

function renderDashboardStats() {
  const now = new Date();
  const { year: filterYear, month: filterMonth } = getActiveMonthFilterRange();
  const isCurrentMonth = (filterYear === now.getFullYear() && filterMonth === now.getMonth());

  // Sum active month's expenses
  const monthlyExpensesList = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === filterMonth && d.getFullYear() === filterYear;
  });

  const totalSpent = monthlyExpensesList.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = getMonthlyIncome(filterYear, filterMonth);
  const remainingBalance = state.income - totalSpent;

  const symbol = state.currencySymbol || '₹';

  // Render cards
  document.getElementById('dashTotalIncome').innerText = `${symbol}${totalIncome.toLocaleString()}`;
  document.getElementById('dashTotalExpenses').innerText = `${symbol}${totalSpent.toLocaleString()}`;

  const balEl = document.getElementById('dashTotalBalance');
  if (balEl) {
    balEl.innerText = `${symbol}${remainingBalance.toLocaleString()}`;
    if (remainingBalance < 0) {
      balEl.className = 'stat-value text-rose-500';
    } else {
      balEl.className = 'stat-value text-zinc-100 dark:text-zinc-100';
    }
  }

  // Render Account Balance card
  const accEl = document.getElementById('dashAccountBalance');
  if (accEl) {
    const accountBalance = (state.initialBalance || 0) + totalIncome - totalSpent;
    accEl.innerText = `${symbol}${accountBalance.toLocaleString()}`;
    if (accountBalance < 0) {
      accEl.className = 'stat-value text-rose-500';
    } else {
      accEl.className = 'stat-value text-zinc-100 dark:text-zinc-100';
    }
  }

  // Calculate current limits progress (kept with safety checks)
  const metricLabelEl = document.getElementById('budgetMetricLabel');
  if (metricLabelEl) metricLabelEl.innerText = `${state.budget_period} Limit`;
  
  const budgetValEl = document.getElementById('dashBudgetVal');
  if (budgetValEl) budgetValEl.innerText = `${symbol}${state.budgetValue}`;

  // Spends in current period
  let dailySpent = 0;
  let weeklySpent = 0;

  if (isCurrentMonth) {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const tempDate = new Date(now);
    const diff = now.getDate() - now.getDay();
    const startOfWeek = new Date(tempDate.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfWeekMs = startOfWeek.getTime();

    dailySpent = state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getTime() >= startOfDay)
      .reduce((sum, t) => sum + t.amount, 0);

    weeklySpent = state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date).getTime() >= startOfWeekMs)
      .reduce((sum, t) => sum + t.amount, 0);
  } else {
    // For past months, show average daily/weekly spending in that month
    const daysInFilterMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
    dailySpent = Math.round(totalSpent / daysInFilterMonth);
    weeklySpent = Math.round(totalSpent / (daysInFilterMonth / 7));
  }

  const currentSpent = state.budget_period === 'daily' ? dailySpent : weeklySpent;

  // Set text based on whether it is current month or past month
  const labelSub = isCurrentMonth ? 'spent' : 'avg spent';
  const spentTextEl = document.getElementById('budgetSpentText');
  if (spentTextEl) spentTextEl.innerText = `${symbol}${currentSpent.toLocaleString()} ${labelSub}`;

  // Draw progress fill bar
  const limitValue = state.budgetValue;
  const pct = Math.min(100, Math.round((currentSpent / Math.max(1, limitValue)) * 100)) || 0;

  const fill = document.getElementById('budgetProgressFill');
  if (fill) {
    fill.style.width = `${pct}%`;
    fill.className = 'progress-bar-fill';
    if (pct >= 90) {
      fill.classList.add('danger');
    } else if (pct >= 75) {
      fill.classList.add('warning');
    }
  }
}

// -------------------------------------------------------------
// CUSTOM SVG CHARTS RENDERERS
// -------------------------------------------------------------
function drawAllSvgCharts() {
  drawCategoryDonutSvg();
  drawTrendLineSvg();
  drawWeekdayAveragesSvg();
  drawRecurringPaymentsChart();
}

function drawRecurringPaymentsChart() {
  const container = document.getElementById('recurringChartContainer');
  if (!container) return;

  container.innerHTML = '';

  const symbol = state.currencySymbol || '₹';
  const totalCount = state.fixedExpenses ? state.fixedExpenses.length : 0;

  if (totalCount === 0) {
    container.innerHTML = `
      <div class="text-center text-zinc-500 py-6 flex flex-col items-center justify-center gap-1.5 h-full" style="opacity: 0.7;">
        <i data-lucide="calendar" class="w-6 h-6 opacity-40"></i>
        <span class="text-[10px] font-bold">No commitments defined</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const paidExpenses = state.fixedExpenses.filter(b => b.paid);
  const paidCount = paidExpenses.length;

  const totalAmount = state.fixedExpenses.reduce((sum, b) => sum + Number(b.amount || 0), 0);
  const paidAmount = paidExpenses.reduce((sum, b) => sum + Number(b.amount || 0), 0);

  const amtPct = totalAmount > 0 ? (paidAmount / totalAmount) : 0;
  const cntPct = totalCount > 0 ? (paidCount / totalCount) : 0;

  const rOuter = 45;
  const cOuter = 2 * Math.PI * rOuter; // 282.74
  const offsetOuter = cOuter * (1 - amtPct);

  const rInner = 33;
  const cInner = 2 * Math.PI * rInner; // 207.35
  const offsetInner = cInner * (1 - cntPct);

  const pctText = Math.round(amtPct * 100);
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';

  container.innerHTML = `
    <div style="position: relative; width: 120px; height: 120px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px;">
      <svg width="120" height="120" viewBox="0 0 120 120" style="transform: rotate(-90deg); overflow: visible;">
        <defs>
          <filter id="glowOuter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glowInner" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        <!-- Outer Circle Track -->
        <circle cx="60" cy="60" r="${rOuter}" fill="none" stroke="${isLight ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.15)'}" stroke-width="7" />
        <!-- Outer Circle Progress (Amount Paid) -->
        <circle cx="60" cy="60" r="${rOuter}" fill="none" 
          stroke="#818cf8" stroke-width="7" 
          stroke-dasharray="${cOuter}" stroke-dashoffset="${offsetOuter}" 
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1);"
          filter="url(#glowOuter)"
        />
        
        <!-- Inner Circle Track -->
        <circle cx="60" cy="60" r="${rInner}" fill="none" stroke="${isLight ? 'rgba(52, 211, 153, 0.08)' : 'rgba(52, 211, 153, 0.15)'}" stroke-width="7" />
        <!-- Inner Circle Progress (Count Paid) -->
        <circle cx="60" cy="60" r="${rInner}" fill="none" 
          stroke="#34d399" stroke-width="7" 
          stroke-dasharray="${cInner}" stroke-dashoffset="${offsetInner}" 
          stroke-linecap="round"
          style="transition: stroke-dashoffset 0.4s cubic-bezier(0.16, 1, 0.3, 1);"
          filter="url(#glowInner)"
        />
      </svg>
      
      <div style="position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; user-select: none;">
        <span style="font-size: 16px; font-weight: 800; color: var(--text-primary); line-height: 1.1;">${pctText}%</span>
        <span style="font-size: 8px; font-weight: 700; color: var(--text-muted); margin-top: 1px;">Amount</span>
      </div>
    </div>
    
    <div style="width: 100%; display: flex; flex-direction: column; gap: 8px; font-size: 10px; font-weight: 700;">
      
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isLight ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)'}; border-radius: 10px; border: 1px solid ${isLight ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.12)'};">
        <span style="display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary);">
          <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #818cf8; display: inline-block;"></span>
          Paid Value:
        </span>
        <span style="color: var(--text-primary); font-weight: 800;">${symbol}${paidAmount.toLocaleString()} / ${symbol}${totalAmount.toLocaleString()}</span>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; padding: 6px 10px; background: ${isLight ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.08)'}; border-radius: 10px; border: 1px solid ${isLight ? 'rgba(52,211,153,0.1)' : 'rgba(52,211,153,0.12)'};">
        <span style="display: inline-flex; align-items: center; gap: 5px; color: var(--text-secondary);">
          <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #34d399; display: inline-block;"></span>
          Bills Settled:
        </span>
        <span style="color: var(--text-primary); font-weight: 800;">${paidCount} of ${totalCount} paid</span>
      </div>

    </div>
  `;

  lucide.createIcons();
}

function getCategoryAllowance(cat) {
  if (!cat) return state.income || 3000;

  let allowance = state.categoryBudgets[cat] || 0;
  if (allowance > 0) return allowance;

  const catLower = cat.toLowerCase();
  const matchedBills = state.fixedExpenses.filter(b => {
    const nameLower = b.name.toLowerCase();
    return nameLower.includes(catLower) ||
      catLower.includes(nameLower) ||
      (catLower.includes('rent') && nameLower.includes('rent')) ||
      (catLower.includes('bill') && nameLower.includes('bill')) ||
      (catLower.includes('util') && nameLower.includes('util'));
  });
  if (matchedBills.length > 0) {
    allowance = matchedBills.reduce((sum, b) => sum + getMonthlyEquivalentOfBill(b), 0);
  }

  if (allowance === 0) {
    allowance = state.income || 3000;
  }
  return allowance;
}

function drawCategoryDonutSvg() {
  const container = document.getElementById('categoryDonutChartContainer');
  if (!container) return;
  container.innerHTML = '';

  const { year: filterYear, month: filterMonth } = getActiveMonthFilterRange();

  // Sum categories
  const categoriesMap = {};
  state.transactions.forEach(t => {
    if (t.type === 'expense') {
      const d = new Date(t.date);
      if (d.getMonth() === filterMonth && d.getFullYear() === filterYear) {
        categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
      }
    }
  });

  const categories = Object.keys(categoriesMap);
  const values = Object.values(categoriesMap);
  const total = values.reduce((sum, v) => sum + v, 0);

  if (total === 0) {
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center text-zinc-500 text-xs py-10 gap-2 w-full">
        <i data-lucide="receipt" class="w-8 h-8 opacity-40"></i>
        <span>No expenditures logged this month</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Draw circle slices
  const radius = 50;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const totalAllowance = state.income || 3000;
  const chartBase = Math.max(totalAllowance, total);

  let accumulatedPercentage = 0;
  const slices = categories.map((cat, idx) => {
    const val = values[idx];
    const percentage = val / chartBase;
    const dashArray = `${percentage * circumference} ${circumference}`;
    const dashOffset = -accumulatedPercentage * circumference;

    accumulatedPercentage += percentage;

    const allowance = getCategoryAllowance(cat);
    const utilizationPct = allowance > 0 ? Math.round((val / allowance) * 100) : 0;

    return {
      category: cat,
      val,
      percentage: Math.round((val / total) * 100),
      utilizationPct,
      dashArray,
      dashOffset,
      color: (function () {
        if (!cat) return CATEGORY_COLORS.Other;
        const trimmed = cat.trim();
        if (CATEGORY_COLORS[trimmed]) return CATEGORY_COLORS[trimmed];
        const lower = trimmed.toLowerCase();
        const matchedKey = Object.keys(CATEGORY_COLORS).find(k => k.toLowerCase() === lower);
        return matchedKey ? CATEGORY_COLORS[matchedKey] : CATEGORY_COLORS.Other;
      })()
    };
  });

  // Core visual SVG elements creation
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const textClr = isLight ? '#0f172a' : '#f8fafc';
  const subClr = isLight ? '#475569' : '#94a3b8';
  const trackClr = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.07)';

  let slicesMarkup = '';
  slices.forEach((slice, idx) => {
    slicesMarkup += `
      <circle
        cx="60"
        cy="60"
        r="${radius}"
        stroke="${slice.color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${slice.dashArray}"
        stroke-dashoffset="${slice.dashOffset}"
        fill="none"
        stroke-linecap="round"
        class="svg-chart-circle cursor-pointer"
        data-index="${idx}"
        data-category="${slice.category}"
        data-amount="${slice.val}"
        data-percentage="${slice.percentage}"
      />
    `;
  });

  // Legend List Markup
  const symbol = state.currencySymbol || '₹';
  let legendMarkup = '';
  slices.forEach((slice, idx) => {
    legendMarkup += `
      <div class="legend-row-item cursor-pointer" data-index="${idx}" style="display: inline-flex; align-items: center; gap: 8px;">
        <span class="legend-row-circle" style="background-color: ${slice.color}; width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;"></span>
        <span style="font-size: 11px; font-weight: 700; color: var(--text-secondary);">${slice.category}</span>
        <span style="font-size: 11px; font-weight: 800; color: var(--text-primary); margin-left: 2px;">${symbol}${slice.val.toLocaleString()}</span>
        <span style="font-size: 9px; font-weight: 700; color: #64748b; margin-left: 2px;">(${slice.utilizationPct}% of allowance)</span>
      </div>
    `;
  });

  // Assemble full HTML widget
  container.innerHTML = `
    <div class="donut-flex-container">
      
      <!-- SVG Wheel container -->
      <div class="donut-wheel-wrapper">
        <svg viewBox="0 0 120 120" style="width: 100%; height: 100%; transform: rotate(-90deg); transform-origin: center; display: block;">
          <circle 
            cx="60" 
            cy="60" 
            r="${radius}" 
            stroke="${trackClr}" 
            stroke-width="${strokeWidth}" 
            fill="none" 
          />
          ${slicesMarkup}
        </svg>

        <!-- Middle details display overlay -->
        <div class="donut-center-overlay" id="donutCentralText" style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; pointer-events: none; user-select: none;">
          <span style="font-size: 8px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1;">Total Spent</span>
          <span style="font-size: 14px; font-weight: 800; color: ${textClr}; margin: 2px 0; line-height: 1.1;">${symbol}${total.toLocaleString()}</span>
          <span style="font-size: 8px; font-weight: 700; color: #64748b; line-height: 1;">of ${symbol}${totalAllowance.toLocaleString()} allowance</span>
        </div>
      </div>

      <!-- Legend listings -->
      <div class="chart-custom-legend-box">
        ${legendMarkup}
      </div>

    </div>
  `;

  // Attach hover event selectors
  const donutCenter = document.getElementById('donutCentralText');
  document.querySelectorAll('.svg-chart-circle, .legend-row-item').forEach(el => {
    el.addEventListener('mouseenter', (e) => {
      const idx = e.currentTarget.dataset.index;
      const slice = slices[idx];

      // Update central text highlights
      donutCenter.innerHTML = `
        <span style="font-size: 8px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 70px;">${slice.category}</span>
        <span style="font-size: 13px; font-weight: 800; color: ${slice.color}; margin: 2px 0; line-height: 1.1; animation: fadeIn 0.2s ease;">${symbol}${slice.val.toLocaleString()}</span>
        <span style="font-size: 8px; font-weight: 700; color: #64748b; line-height: 1;">${slice.utilizationPct}% of allowance</span>
      `;

      // Highlight active circle element
      document.querySelectorAll('.svg-chart-circle').forEach(circle => {
        circle.setAttribute('stroke-width', strokeWidth.toString());
      });
      const activeCircle = document.querySelector(`.svg-chart-circle[data-index="${idx}"]`);
      if (activeCircle) activeCircle.setAttribute('stroke-width', (strokeWidth + 2).toString());
    });

    el.addEventListener('mouseleave', () => {
      donutCenter.innerHTML = `
        <span style="font-size: 8px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; line-height: 1;">Total Spent</span>
        <span style="font-size: 14px; font-weight: 800; color: ${textClr}; margin: 2px 0; line-height: 1.1;">${symbol}${total.toLocaleString()}</span>
        <span style="font-size: 8px; font-weight: 700; color: #64748b; line-height: 1;">this month</span>
      `;
      document.querySelectorAll('.svg-chart-circle').forEach(circle => {
        circle.setAttribute('stroke-width', strokeWidth.toString());
      });
    });
  });
}

function drawTrendLineSvg() {
  const container = document.getElementById('trendLineChartContainer');
  if (!container) return;

  try {
    container.innerHTML = '';

    const now = new Date();
    const { year: filterYear, month: filterMonth } = getActiveMonthFilterRange();
    const isCurrentMonth = (filterYear === now.getFullYear() && filterMonth === now.getMonth());

    const trendLabels = [];
    const trendIncome = [];
    const trendExpense = [];

    if (isCurrentMonth) {
      // Show past 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dayStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const matchDateStr = d.toISOString().split('T')[0];

        trendLabels.push(dayStr);

        let incSum = 0;
        let expSum = 0;
        state.transactions.forEach(t => {
          if (t.id && t.id.startsWith('tx-fixed-')) return;
          if (t.date === matchDateStr) {
            const amt = Number(t.amount);
            if (!isNaN(amt)) {
              if (t.type === 'income') incSum += amt;
              else expSum += amt;
            }
          }
        });

        trendIncome.push(incSum);
        trendExpense.push(expSum);
      }
    } else {
      // Show entire month day-by-day (Day 1 to Day 28-31)
      const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = `${day}`;
        const matchDateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        trendLabels.push(dayStr);

        let incSum = 0;
        let expSum = 0;
        state.transactions.forEach(t => {
          if (t.id && t.id.startsWith('tx-fixed-')) return;
          if (t.date === matchDateStr) {
            const amt = Number(t.amount);
            if (!isNaN(amt)) {
              if (t.type === 'income') incSum += amt;
              else expSum += amt;
            }
          }
        });

        trendIncome.push(incSum);
        trendExpense.push(expSum);
      }
    }

    // Draw chart parameters
    const width = 500;
    const height = 240;
    const paddingLeft = 55;
    const paddingRight = 25;
    const paddingTop = 20;
    const paddingBottom = 48;

    const chartWidth = width - paddingLeft - paddingRight;
    const chartHeight = height - paddingTop - paddingBottom;

    const maxVal = Math.max(10, ...trendIncome, ...trendExpense) * 1.15;
    const pointsCount = trendLabels.length;

    // Convert values to coordinates
    const getCoords = (data) => {
      return data.map((val, idx) => {
        const x = paddingLeft + (idx / Math.max(1, pointsCount - 1)) * chartWidth;
        const y = height - paddingBottom - (val / maxVal) * chartHeight;
        return { x, y, val };
      });
    };

    const incomeCoords = getCoords(trendIncome);
    const expenseCoords = getCoords(trendExpense);

    // Bezier curve calculations
    const generateLinePath = (coords) => {
      if (coords.length === 0) return '';
      let path = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        const cpX1 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
        const cpY1 = coords[i - 1].y;
        const cpX2 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
        const cpY2 = coords[i].y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i].x} ${coords[i].y}`;
      }
      return path;
    };

    const generateAreaPath = (coords) => {
      const linePath = generateLinePath(coords);
      if (!linePath) return '';
      return `${linePath} L ${coords[coords.length - 1].x} ${height - paddingBottom} L ${coords[0].x} ${height - paddingBottom} Z`;
    };

    const incomeLine = generateLinePath(incomeCoords);
    const incomeArea = generateAreaPath(incomeCoords);

    const expenseLine = generateLinePath(expenseCoords);
    const expenseArea = generateAreaPath(expenseCoords);

    // Y Grid lines Ticks
    const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map(v => Math.round(v));

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';
    const gridClr = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

    const symbol = state.currencySymbol || '₹';
    let gridlinesMarkup = '';
    yTicks.forEach(tick => {
      const y = height - paddingBottom - (tick / maxVal) * chartHeight;
      gridlinesMarkup += `
        <g style="opacity: 0.45; user-select: none;">
          <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="${gridClr}" stroke-width="1" stroke-dasharray="4 6" />
          <text x="${paddingLeft - 8}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8" style="font-weight: 700; font-family: var(--font-family);">${symbol}${tick}</text>
        </g>
      `;
    });

    // X Axis Dates
    let xAxisMarkup = '';
    trendLabels.forEach((label, idx) => {
      const x = paddingLeft + (idx / Math.max(1, pointsCount - 1)) * chartWidth;

      // De-clutter labels: show all if <= 7 points, or every 5 days if more
      let shouldShowLabel = true;
      if (pointsCount > 7) {
        const dayNum = idx + 1;
        shouldShowLabel = (dayNum === 1 || dayNum % 5 === 0 || dayNum === pointsCount);
      }

      if (shouldShowLabel) {
        xAxisMarkup += `
          <text x="${x}" y="${height - 20}" text-anchor="middle" font-size="9" fill="#64748b" style="font-weight: 700; opacity: 0.8; font-family: var(--font-family);">${label}</text>
        `;
      }
    });

    // Points markups with active tooltips triggers
    let pointsMarkup = '';
    incomeCoords.forEach((pt, idx) => {
      pointsMarkup += `
        <circle
          cx="${pt.cx || pt.x}"
          cy="${pt.cy || pt.y}"
          r="5"
          fill="#10b981"
          stroke="${isLight ? '#ffffff' : '#070a13'}"
          stroke-width="2"
          class="svg-line-point"
          data-index="${idx}"
          data-val="${pt.val}"
          data-type="Income"
          data-label="${trendLabels[idx]}"
        />
      `;
    });

    expenseCoords.forEach((pt, idx) => {
      pointsMarkup += `
        <circle
          cx="${pt.cx || pt.x}"
          cy="${pt.cy || pt.y}"
          r="5"
          fill="#f43f5e"
          stroke="${isLight ? '#ffffff' : '#070a13'}"
          stroke-width="2"
          class="svg-line-point"
          data-index="${idx}"
          data-val="${pt.val}"
          data-type="Expense"
          data-label="${trendLabels[idx]}"
        />
      `;
    });

    // Assemble full SVG chart widget inside container
    container.innerHTML = `
      <div class="trend-chart-wrapper">
        <svg viewBox="0 0 ${width} ${height}" class="trend-chart-svg select-none">
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#10b981" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#10b981" stop-opacity="0.0" />
            </linearGradient>
            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#f43f5e" stop-opacity="0.25" />
              <stop offset="100%" stop-color="#f43f5e" stop-opacity="0.0" />
            </linearGradient>
          </defs>

          <!-- Gridlines -->
          ${gridlinesMarkup}

          <!-- Axis Labels -->
          ${xAxisMarkup}

          <!-- Gradients Areas -->
          ${incomeArea ? `<path d="${incomeArea}" fill="url(#incomeGrad)" />` : ''}
          ${expenseArea ? `<path d="${expenseArea}" fill="url(#expenseGrad)" />` : ''}

          <!-- Curves Lines -->
          ${incomeLine ? `<path d="${incomeLine}" fill="none" stroke="#10b981" stroke-width="4" stroke-linecap="round" />` : ''}
          ${expenseLine ? `<path d="${expenseLine}" fill="none" stroke="#f43f5e" stroke-width="4" stroke-linecap="round" />` : ''}

          <!-- Interactive circles points -->
          ${pointsMarkup}

        </svg>

        <!-- Hover Tooltip template -->
        <div 
          id="trendChartTooltip"
          class="trend-chart-tooltip"
        >
        </div>

      </div>
    `;

    // Attach hover point events listeners
    const tooltip = document.getElementById('trendChartTooltip');
    if (tooltip) {
      document.querySelectorAll('.svg-line-point').forEach(pt => {
        pt.addEventListener('mouseenter', (e) => {
          const val = parseFloat(e.target.dataset.val);
          const type = e.target.dataset.type;
          const label = e.target.dataset.label;

          const cx = parseFloat(e.target.getAttribute('cx'));
          const cy = parseFloat(e.target.getAttribute('cy'));

          tooltip.innerHTML = `
            <span style="color: var(--text-secondary); font-weight: 700; display: block;">${label}</span>
            <span style="display: flex; align-items: center; gap: 6px; margin-top: 2px; font-weight: 800;">
              <span style="width: 6px; height: 6px; border-radius: 50%; display: inline-block; background-color: ${type === 'Income' ? '#10b981' : '#f43f5e'};"></span>
              ${type}: <strong style="color: var(--text-primary); font-weight: 800;">${symbol}${val.toLocaleString()}</strong>
            </span>
          `;

          // Positioning tooltip dynamically
          tooltip.style.left = `${(cx / width) * 100}%`;
          tooltip.style.top = `${(cy / height) * 100}%`;
          tooltip.classList.add('visible');
        });

        pt.addEventListener('mouseleave', () => {
          tooltip.classList.remove('visible');
        });
      });
    }
  } catch (err) {
    console.error("Error drawing trend line chart:", err);
    container.innerHTML = `
      <div style="color: #f43f5e; font-size: 11px; font-weight: bold; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 6px;">
        <i data-lucide="alert-triangle" style="width: 24px; height: 24px; color: #f43f5e;"></i>
        <span>Chart Render Error: ${err.message}</span>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

// -------------------------------------------------------------
// LOG LISTS RENDERING (LEDGER HISTORY & BILL CHECKLIST)
// -------------------------------------------------------------
function renderLedgerTable() {
  const container = document.getElementById('transactionsLogContainer');
  container.innerHTML = '';

  const q = searchQuery.toLowerCase();
  const cat = selectedCatFilter;

  const filtered = state.transactions.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q);
    const matchesCat = cat === 'all' || t.category === cat;
    return matchesSearch && matchesCat;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="text-center text-zinc-500 py-16 flex flex-col items-center justify-center gap-2">
        <i data-lucide="receipt" class="w-8 h-8 opacity-45"></i>
        <span class="text-xs font-bold">No receipt logs match filters</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const symbol = state.currencySymbol || '₹';
  filtered.forEach(tx => {
    const isIncome = tx.type === 'income';
    const amountStr = `${isIncome ? '+' : '-'}${symbol}${tx.amount.toLocaleString()}`;
    const dateFormatted = new Date(tx.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    // SVG icon choosing
    let iconName = 'tag';
    if (isIncome) iconName = 'arrow-down-left';
    else {
      const cName = tx.category.toLowerCase();
      if (cName.includes('food')) iconName = 'utensils';
      else if (cName.includes('trans')) iconName = 'car';
      else if (cName.includes('shop')) iconName = 'shopping-bag';
      else if (cName.includes('enter')) iconName = 'clapperboard';
      else if (cName.includes('edu')) iconName = 'graduation-cap';
      else if (cName.includes('station')) iconName = 'pen-tool';
      else if (cName.includes('rent') || cName.includes('hostel')) iconName = 'home';
      else if (cName.includes('heal')) iconName = 'heart';
      else if (cName.includes('util')) iconName = 'zap';
      else if (cName.includes('bill')) iconName = 'receipt';
      else iconName = 'tag';
    }

    const row = document.createElement('div');
    row.className = 'tx-grid-row';
    row.innerHTML = `
      <div class="tx-round-icon ${tx.type}">
        <i data-lucide="${iconName}" class="w-4 h-4"></i>
      </div>
      <div class="tx-meta-info">
        <span class="tx-title-text">${tx.title}</span>
        ${tx.description && tx.description !== 'Logged via Monefy Rapid Entry Pad' ? `<span class="tx-note-text" style="font-size: 10px; color: var(--text-muted); font-style: italic; margin-top: 1px; text-align: left;">Memo: ${tx.description}</span>` : ''}
        <span class="tx-date-text" style="margin-top: 2px;">${dateFormatted} • 🧾 ${tx.payMethod || 'Card'}</span>
      </div>
      <div class="tx-category-text">${tx.category}</div>
      <div class="tx-amount-text ${tx.type}">${amountStr}</div>
      <div class="tx-actions">
        <button class="ledger-edit-btn" data-id="${tx.id}" title="Edit Transaction">
          <i data-lucide="pencil" class="w-4 h-4"></i>
        </button>
        <button class="delete-bill-btn ledger-remove-btn" data-id="${tx.id}" title="Delete Transaction">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  lucide.createIcons();
  setupLedgerActions();
}

function setupLedgerActions() {
  // Delete handler
  document.querySelectorAll('.ledger-remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const index = state.transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        lastDeletedTransaction = state.transactions[index];
        state.transactions.splice(index, 1);

        // Two-way synchronization: if it's a fixed commitment transaction, mark the bill unpaid in sidebar
        if (id.startsWith('tx-fixed-')) {
          const billId = id.replace('tx-fixed-', '');
          const billIdx = state.fixedExpenses.findIndex(b => b.id === billId);
          if (billIdx !== -1) {
            state.fixedExpenses[billIdx].paid = false;
          }
        }

        saveState();
        refreshDashboard();

        showToast(`Deleted "${lastDeletedTransaction.title}"`, 'info', true);
      }
    });
  });

  // Edit handler
  document.querySelectorAll('.ledger-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const tx = state.transactions.find(t => t.id === id);
      if (tx) {
        openNumpadDrawer(false, tx);
      }
    });
  });
}

function undoDeleteTransaction() {
  if (lastDeletedTransaction) {
    state.transactions.unshift(lastDeletedTransaction);

    // Two-way synchronization: restore paid check if it's a fixed commitment transaction
    const id = lastDeletedTransaction.id;
    if (id && id.startsWith('tx-fixed-')) {
      const billId = id.replace('tx-fixed-', '');
      const billIdx = state.fixedExpenses.findIndex(b => b.id === billId);
      if (billIdx !== -1) {
        state.fixedExpenses[billIdx].paid = true;
      }
    }

    saveState();
    refreshDashboard();

    lastDeletedTransaction = null;
    showToast('Restored deleted item', 'success');
  }
}

function renderFixedExpensesChecklist() {
  const container = document.getElementById('billsListContainer');
  container.innerHTML = '';

  if (state.fixedExpenses.length === 0) {
    container.innerHTML = `
      <div class="text-center text-zinc-500 py-12 flex flex-col items-center justify-center gap-1.5 h-full">
        <i data-lucide="calendar" class="w-7 h-7 opacity-40"></i>
        <span class="text-[10px] font-bold">No recurring bills defined</span>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  // Sort alphabetically by name
  const sorted = [...state.fixedExpenses].sort((a, b) => a.name.localeCompare(b.name));

  const freqLabels = { monthly: 'Monthly Recurring', weekly: 'Weekly Recurring', once: 'One-time Payment' };

  sorted.forEach(bill => {
    const row = document.createElement('div');
    row.className = 'bill-row-item';

    const paidClass = bill.paid ? 'paid' : 'unpaid';
    const paidText = bill.paid ? 'Paid' : 'Unpaid';

    const symbol = state.currencySymbol || '₹';
    const metaText = freqLabels[bill.frequency || 'monthly'] || 'Monthly Recurring';

    row.innerHTML = `
      <div class="bill-info">
        <span class="bill-name">${bill.name}</span>
        <span class="bill-meta">${metaText}</span>
      </div>
      <div class="bill-actions" style="display: flex; align-items: center; gap: 8px;">
        <span class="bill-amount font-extrabold text-xs">${symbol}${bill.amount}</span>
        <span class="bill-badge ${paidClass}">${paidText}</span>
        <input type="checkbox" class="pay-checkbox bill-pay-cb" data-id="${bill.id}" ${bill.paid ? 'checked' : ''}>
        <button type="button" class="bill-delete-btn text-zinc-500 hover:text-red-400 transition-all ml-1" data-id="${bill.id}" title="Delete Commitment" style="background: none; border: none; padding: 2px; cursor: pointer; display: flex; align-items: center; justify-content: center; outline: none;">
          <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
      </div>
    `;
    container.appendChild(row);
  });

  lucide.createIcons();
  setupBillsPaidListeners();
  setupSidebarBillDeleteListeners();
}

function setupBillsPaidListeners() {
  document.querySelectorAll('.bill-pay-cb').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = e.target.dataset.id;
      const index = state.fixedExpenses.findIndex(b => b.id === id);
      if (index !== -1) {
        const bill = state.fixedExpenses[index];
        bill.paid = e.target.checked;

        const txId = `tx-fixed-${bill.id}`;
        if (e.target.checked) {
          // Determine matching category for the transaction dynamically
          let category = 'Bills'; // fallback
          if (state.categories && state.categories.length > 0) {
            const matching = state.categories.find(c =>
              c.toLowerCase().includes('bill') ||
              c.toLowerCase().includes('rent') ||
              c.toLowerCase().includes('util') ||
              c.toLowerCase().includes('recurring')
            );
            category = matching || state.categories[0];
          }

          // Add to transactions list
          if (!state.transactions.some(t => t.id === txId)) {
            state.transactions.unshift({
              id: txId,
              title: `${bill.name} (Auto-Debit)`,
              amount: bill.amount,
              type: 'expense',
              category: category,
              date: new Date().toISOString().split('T')[0],
              payMethod: 'Bank',
              description: `Fixed Commitment: ${bill.name}`
            });
          }
        } else {
          // If unticked, remove the automatically created transaction
          state.transactions = state.transactions.filter(t => t.id !== txId);
        }

        saveState();
        refreshDashboard();
        showToast(
          bill.paid
            ? `Marked ${bill.name} as PAID & logged to Ledger`
            : `Marked ${bill.name} as UNPAID & removed from Ledger`,
          'success'
        );
      }
    });
  });
}

function setupSidebarBillDeleteListeners() {
  document.querySelectorAll('.bill-delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const index = state.fixedExpenses.findIndex(b => b.id === id);
      if (index !== -1) {
        const bill = state.fixedExpenses[index];

        // Remove from list
        state.fixedExpenses.splice(index, 1);

        // Filter out corresponding ledger transaction if paid
        state.transactions = state.transactions.filter(t => t.id !== `tx-fixed-${id}`);

        saveState();
        refreshDashboard();
        showToast(`Deleted commitment: "${bill.name}"`, 'info');
      }
    });
  });
}

// -------------------------------------------------------------
// YNAB BUDGETS PANEL CONFIGS
// -------------------------------------------------------------
function renderCategoryBudgetsGrid() {
  const container = document.getElementById('catBudgetsGrid');
  container.innerHTML = '';

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const categories = state.categories || Object.keys(state.categoryBudgets);
  categories.forEach(cat => {
    let val = state.categoryBudgets[cat] || 0;
    if (val === 0) {
      val = getCategoryAllowance(cat);
      state.categoryBudgets[cat] = val;
      saveState();
    }

    const spent = monthlyExpenses.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    const pct = Math.min(100, Math.round((spent / Math.max(1, val)) * 100));

    let barClr = 'bg-indigo-500';
    if (pct >= 90) barClr = 'bg-rose-500';
    else if (pct >= 75) barClr = 'bg-amber-500';

    const card = document.createElement('div');
    card.className = 'cat-budget-card';
    const symbol = state.currencySymbol || '₹';
    card.innerHTML = `
      <div class="cat-budget-header">
        <span class="cat-budget-name text-zinc-200">${cat}</span>
        <div class="cat-budget-input-wrapper">
          <span class="cat-budget-limit-label">Limit:</span>
          <input 
            type="number" 
            value="${val}" 
            data-category="${cat}"
            class="cat-budget-input font-bold"
          />
        </div>
      </div>
      <div class="cat-budget-details-row">
        <span class="cat-budget-spent-txt">${symbol}${spent.toLocaleString()} spent</span>
        <span class="cat-budget-util-txt">${pct}% utilized</span>
      </div>
      <div class="cat-budget-progress-track">
        <div class="cat-budget-progress-bar ${barClr}" style="width: ${pct}%"></div>
      </div>
    `;
    container.appendChild(card);
  });

  // Budget change event listener
  document.querySelectorAll('.cat-budget-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const cat = e.target.dataset.category;
      state.categoryBudgets[cat] = Math.max(0, parseInt(e.target.value) || 0);
      saveState();
      renderCategoryBudgetsGrid();
      drawCategoryDonutSvg();
    });
  });
}

// -------------------------------------------------------------
// STUDENT ADVISORY RULES INSIGHTS ENGINE
// -------------------------------------------------------------
function renderSmartInsightsList() {
  const container = document.getElementById('insightsListContainer');
  container.innerHTML = '';

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  if (monthlyExpenses.length === 0) {
    container.innerHTML = `
      <div class="insight-advisory-card info animate-fadeIn">
        <div class="insight-advisory-icon"><i data-lucide="info" class="w-5 h-5"></i></div>
        <div class="insight-advisory-content">
          <h4 class="insight-advisory-title">Ready for Student Analysis</h4>
          <p class="insight-advisory-desc">Once you start logging cash inputs/outputs, we will analyze parameters to output financial habits warnings here!</p>
        </div>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const insights = [];

  const symbol = state.currencySymbol || '₹';
  // Insight 1: Inflow/Outflow Health Score
  const spendPct = state.income > 0 ? (totalSpent / state.income) * 100 : 0;
  if (spendPct >= 90) {
    insights.push({
      id: 'ins-1',
      title: 'Allowance Inflow Warn',
      desc: `Critical! You have spent ${Math.round(spendPct)}% of your monthly funds (${symbol}${totalSpent} of ${symbol}${state.income}). Try locking cards to save this week.`,
      type: 'warning',
      icon: 'alert-circle'
    });
  } else if (spendPct >= 75) {
    insights.push({
      id: 'ins-1',
      title: 'Limit Approaching warning',
      desc: `Alert. Your spends have reached ${Math.round(spendPct)}% of your stipend. scale back entertainment and shopping.`,
      type: 'info',
      icon: 'info'
    });
  } else {
    insights.push({
      id: 'ins-1',
      title: 'Healthy Savings Pace',
      desc: `Awesome! You have spent only ${Math.round(spendPct)}% of your monthly allowance. You are perfectly on track to save ${symbol}${Math.round(state.income - totalSpent)}!`,
      type: 'success',
      icon: 'check-circle'
    });
  }

  // Insight 2: Category overspends
  const catTotals = {};
  monthlyExpenses.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  let worstCategory = '';
  let worstPct = 0;
  Object.entries(catTotals).forEach(([cat, val]) => {
    const budget = state.categoryBudgets[cat] || 100;
    const pct = (val / budget) * 100;
    if (pct > 100 && pct > worstPct) {
      worstPct = pct;
      worstCategory = cat;
    }
  });

  if (worstCategory) {
    insights.push({
      id: 'ins-2',
      title: `${worstCategory} Limit Exceeded!`,
      desc: `You are at ${Math.round(worstPct)}% of your "${worstCategory}" allowance limits. Consider skipping optional buys for 3 days.`,
      type: 'warning',
      icon: 'alert-circle'
    });
  }

  // Insight 3: Highest spending category focus
  let topCat = '';
  let topAmt = 0;
  Object.entries(catTotals).forEach(([cat, amt]) => {
    if (amt > topAmt) {
      topAmt = amt;
      topCat = cat;
    }
  });

  if (topCat && topAmt > 0) {
    insights.push({
      id: 'ins-3',
      title: `Top Cost: ${topCat}`,
      desc: `Your highest spent category is "${topCat}", consuming ${Math.round((topAmt / totalSpent) * 100)}% (${symbol}${topAmt}) of your total monthly cashout.`,
      type: 'info',
      icon: 'tag'
    });
  }

  // Insight 4: Weekdays surges
  let weekdayExp = 0;
  let weekdayCount = 0;
  let weekendExp = 0;
  let weekendCount = 0;

  monthlyExpenses.forEach(t => {
    const d = new Date(t.date);
    const day = d.getDay();
    if (day === 0 || day === 6) {
      weekendExp += t.amount;
      weekendCount++;
    } else {
      weekdayExp += t.amount;
      weekdayCount++;
    }
  });

  const avgWeekday = weekdayExp / Math.max(1, weekdayCount);
  const avgWeekend = weekendExp / Math.max(1, weekendCount);

  if (avgWeekend > avgWeekday * 1.3) {
    insights.push({
      id: 'ins-4',
      title: 'Weekend Outflow Surge',
      desc: `Your weekend averages (${symbol}${Math.round(avgWeekend)}/day) are 30%+ higher than weekdays. Dorm activities are highly focused here!`,
      type: 'info',
      icon: 'compass'
    });
  } else if (avgWeekday > avgWeekend * 1.3) {
    insights.push({
      id: 'ins-4',
      title: 'Weekday Campus Spent Focus',
      desc: `Your weekday averages (${symbol}${Math.round(avgWeekday)}/day) surge. Watch out for coffee breaks at university hubs!`,
      type: 'info',
      icon: 'compass'
    });
  }

  // Insight 5: Occupation-Specific Custom Insights
  const occupation = state.occupation || 'Student';
  if (occupation === 'Student') {
    const eduSpent = monthlyExpenses.filter(t => t.category === 'Education').reduce((sum, t) => sum + t.amount, 0);
    if (eduSpent > 0 && eduSpent > state.income * 0.15) {
      insights.push({
        id: 'ins-ob-5',
        title: 'Academic Term Spends Alert',
        desc: `Your academic textbooks and education costs (${symbol}${eduSpent}) consume over 15% of your stipends. Look for digital options to save!`,
        type: 'info',
        icon: 'education'
      });
    } else {
      insights.push({
        id: 'ins-ob-5',
        title: 'Student Discounts Notice',
        desc: `${state.userName || 'Shekhar'}, you are on a Student Profile! Always ask for active student discount cards at local transit or food chains.`,
        type: 'success',
        icon: 'tag'
      });
    }
  } else if (occupation === 'Working') {
    const transportSpent = monthlyExpenses.filter(t => t.category === 'Transport').reduce((sum, t) => sum + t.amount, 0);
    if (transportSpent > state.income * 0.15) {
      insights.push({
        id: 'ins-ob-5',
        title: 'Commuting Outflow Surge',
        desc: `Daily transport commuting costs exceed 15% of your paycheck (${symbol}${transportSpent}). Consider carpooling or bulk transit passes.`,
        type: 'warning',
        icon: 'transport'
      });
    } else {
      insights.push({
        id: 'ins-ob-5',
        title: 'Working Profile Target',
        desc: `Great job! Your profile target recommends auto-allocating 50% of your earnings to investments & core savings immediately.`,
        type: 'success',
        icon: 'wallet'
      });
    }
  } else if (occupation === 'Freelancer') {
    const otherSpent = monthlyExpenses.filter(t => t.category === 'Other').reduce((sum, t) => sum + t.amount, 0);
    if (otherSpent > state.income * 0.20) {
      insights.push({
        id: 'ins-ob-5',
        title: 'Freelancer Tools Expense',
        desc: `Your workspace/other business equipment purchases consume over 20% of your income (${symbol}${otherSpent}). Keep records for client billables!`,
        type: 'info',
        icon: 'compass'
      });
    } else {
      insights.push({
        id: 'ins-ob-5',
        title: 'Gig Inflow Buffer Check',
        desc: `Freelancer income can vary. Try maintaining a 3-month emergency sandbox reserve to offset low-invoice contract weeks.`,
        type: 'info',
        icon: 'shield'
      });
    }
  }

  // Generate lists inside container
  insights.forEach(ins => {
    const card = document.createElement('div');
    card.className = `insight-advisory-card ${ins.type} animate-fadeIn`;
    card.innerHTML = `
      <div class="insight-advisory-icon"><i data-lucide="${ins.icon}" class="w-5 h-5"></i></div>
      <div class="insight-advisory-content">
        <h4 class="insight-advisory-title">${ins.title}</h4>
        <p class="insight-advisory-desc">${ins.desc}</p>
      </div>
    `;
    container.appendChild(card);
  });

  lucide.createIcons();
}

// -------------------------------------------------------------
// MONEFY RAPID KEYBOARD LOGGING HANDLERS
// -------------------------------------------------------------
function handleNumpadKeyClick(val) {
  const display = document.getElementById('numpadAmountVal');

  if (numpadAmountStr === '0') {
    if (val === '.') {
      numpadAmountStr = '0.';
    } else {
      numpadAmountStr = val;
    }
  } else {
    if (val === '.' && numpadAmountStr.includes('.')) return;
    numpadAmountStr += val;
  }

  display.innerText = numpadAmountStr;
}

function handleNumpadBackspace() {
  const display = document.getElementById('numpadAmountVal');
  if (numpadAmountStr.length <= 1) {
    numpadAmountStr = '0';
  } else {
    numpadAmountStr = numpadAmountStr.slice(0, -1);
  }
  display.innerText = numpadAmountStr;
}

function handleNumpadClear() {
  numpadAmountStr = '0';
  document.getElementById('numpadAmountVal').innerText = '0';
}

async function handleNumpadSubmit() {
  const amountVal = parseFloat(numpadAmountStr);
  if (isNaN(amountVal) || amountVal <= 0) {
    showToast(`Please enter an amount greater than ${state.currencySymbol || '₹'}0`, 'error');
    return;
  }

  const titleVal = document.getElementById('numpadTitle').value.trim();
  const dateVal = document.getElementById('numpadDate').value;
  const payMethodVal = document.getElementById('numpadPayMethod').value;
  const noteVal = document.getElementById('numpadNote').value.trim();

  if (editingTransactionId) {
    // Edit existing transaction in-place
    const tx = state.transactions.find(t => t.id === editingTransactionId);
    if (tx) {
      const oldTitle = tx.title;
      
      tx.amount = amountVal;
      tx.title = titleVal || `${numpadType === 'income' ? 'Income credit' : 'Cash expense'} (${numpadCategory})`;
      tx.type = numpadType;
      tx.category = numpadCategory;
      tx.date = dateVal;
      tx.payMethod = payMethodVal || 'Card';
      tx.description = noteVal || 'Logged via Monefy Rapid Entry Pad';

      // Two-way synchronization for fixed commitment transaction
      if (editingTransactionId.startsWith('tx-fixed-')) {
        const billId = editingTransactionId.replace('tx-fixed-', '');
        const bill = state.fixedExpenses.find(b => b.id === billId);
        if (bill) {
          bill.amount = amountVal;
          // Synchronize name back cleanly without auto-debit suffix
          bill.name = tx.title.replace(/\s*\(Auto-Debit\)/i, '');
        }
      }

      saveState();
      closeNumpadDrawer();
      refreshDashboard();

      showToast(`Updated transaction details successfully`, 'success');
    } else {
      showToast('Error: Transaction not found.', 'error');
      closeNumpadDrawer();
    }
  } else {
    // Create new transaction
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: titleVal || `${numpadType === 'income' ? 'Income credit' : 'Cash expense'} (${numpadCategory})`,
      amount: amountVal,
      type: numpadType,
      category: numpadCategory,
      date: dateVal,
      payMethod: payMethodVal || 'Card',
      description: noteVal || 'Logged via Monefy Rapid Entry Pad'
    };

    state.transactions.unshift(newTx);
    saveState();
    closeNumpadDrawer();
    refreshDashboard();

    showToast(`Logged "${newTx.title}" successfully`, 'success');
  }
}

function openNumpadDrawer(isPast = false, txToEdit = null) {
  const overlay = document.getElementById('numpadDrawerOverlay');
  const panel = document.getElementById('numpadDrawerPanel');
  const fab = document.getElementById('floatingAddBtn');

  overlay.classList.add('open');
  panel.classList.add('open');
  fab.classList.add('open');

  const drawerHeader = document.querySelector('.numpad-drawer-header h3');
  const submitBtn = document.getElementById('numpadSubmitBtn');

  if (txToEdit) {
    editingTransactionId = txToEdit.id;

    // Load existing transaction values
    numpadAmountStr = txToEdit.amount.toString();
    document.getElementById('numpadAmountVal').innerText = numpadAmountStr;
    document.getElementById('numpadTitle').value = txToEdit.title;
    document.getElementById('numpadDate').value = txToEdit.date;
    document.getElementById('numpadPayMethod').value = txToEdit.payMethod || 'Card';
    document.getElementById('numpadNote').value = (txToEdit.description === 'Logged via Monefy Rapid Entry Pad') ? '' : (txToEdit.description || '');

    setNumpadTypeToggle(txToEdit.type);
    setNumpadCategorySelection(txToEdit.category);

    if (drawerHeader) {
      drawerHeader.innerText = 'Edit Transaction Details';
    }
    if (submitBtn) {
      submitBtn.innerText = 'Save Changes';
    }
  } else {
    editingTransactionId = null;

    // Load defaults
    handleNumpadClear();
    document.getElementById('numpadDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('numpadTitle').value = '';
    document.getElementById('numpadPayMethod').value = 'Card';
    document.getElementById('numpadNote').value = '';
    
    setNumpadTypeToggle('expense');
    setNumpadCategorySelection(state.categories && state.categories.length > 0 ? state.categories[0] : 'Food');

    if (drawerHeader) {
      if (isPast) {
        drawerHeader.innerText = 'Log Past Transaction';

        const dateInput = document.getElementById('numpadDate');
        if (dateInput) {
          setTimeout(() => {
            dateInput.focus();
            if (typeof dateInput.showPicker === 'function') {
              try {
                dateInput.showPicker();
              } catch (e) { }
            }
          }, 100);
        }
      } else {
        drawerHeader.innerText = 'Log Cash Transaction';
      }
    }
    if (submitBtn) {
      submitBtn.innerText = 'Confirm Entry';
    }
  }
}

function closeNumpadDrawer() {
  document.getElementById('numpadDrawerOverlay').classList.remove('open');
  document.getElementById('numpadDrawerPanel').classList.remove('open');
  document.getElementById('floatingAddBtn').classList.remove('open');
  editingTransactionId = null;
}

function setNumpadCategorySelection(cat) {
  numpadCategory = cat;
  document.querySelectorAll('#numpadCategorySelectorGrid .numpad-cat-btn').forEach(btn => {
    btn.classList.remove('selected');
    if (btn.dataset.category === cat) btn.classList.add('selected');
  });
}

function setNumpadTypeToggle(type) {
  numpadType = type;
  const expBtn = document.getElementById('numpadTypeExpense');
  const incBtn = document.getElementById('numpadTypeIncome');
  const displayVal = document.getElementById('numpadAmountValContainer');

  if (type === 'income') {
    incBtn.classList.add('active');
    expBtn.classList.remove('active');
    if (displayVal) {
      displayVal.className = 'numpad-amount-val income';
    }
  } else {
    expBtn.classList.add('active');
    incBtn.classList.remove('active');
    if (displayVal) {
      displayVal.className = 'numpad-amount-val expense';
    }
  }

  // Reactively repaint the categories grid to match type selection
  renderNumpadCategoryGrid();
}

// -------------------------------------------------------------
// GLOBAL ROUTERS & EVENT HANDLERS
// -------------------------------------------------------------
function setupGlobalEventListeners() {
  // Navigation Tabs lists toggles
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');

      const targetTab = e.currentTarget.dataset.tab;
      currentTab = targetTab;

      // Hide all panels, show target
      document.getElementById('tab-panel-analytics').style.display = 'none';
      document.getElementById('tab-panel-ledger').style.display = 'none';
      document.getElementById('tab-panel-insights').style.display = 'none';
      document.getElementById('tab-panel-budgets').style.display = 'none';
      const savingsPanel = document.getElementById('tab-panel-savings');
      if (savingsPanel) savingsPanel.style.display = 'none';

      if (targetTab === 'analytics') {
        document.getElementById('tab-panel-analytics').style.display = 'flex';
        drawAllSvgCharts();
      } else if (targetTab === 'ledger') {
        document.getElementById('tab-panel-ledger').style.display = 'flex';
        renderLedgerTable();
      } else if (targetTab === 'insights') {
        document.getElementById('tab-panel-insights').style.display = 'flex';
        renderAICoachTab();
        renderSmartInsightsList();
      } else if (targetTab === 'budgets') {
        document.getElementById('tab-panel-budgets').style.display = 'flex';
        renderCategoryBudgetsGrid();
      } else if (targetTab === 'savings') {
        if (savingsPanel) savingsPanel.style.display = 'flex';
        renderSavingsTab();
      }
    });
  });

  // Stepper Slider button binds
  const startBtn = document.getElementById('obStartBtn');
  if (startBtn) startBtn.addEventListener('click', onboardingStepNext);

  document.querySelectorAll('.ob-next-btn').forEach(btn => btn.addEventListener('click', onboardingStepNext));
  document.querySelectorAll('.ob-prev-btn').forEach(btn => btn.addEventListener('click', onboardingStepBack));

  // Onboarding Slide 2 Selectors Click Grid Attachments
  document.querySelectorAll('#obCurrencyGrid button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#obCurrencyGrid button').forEach(b => b.classList.remove('selected'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('selected');

      state.currencySymbol = activeBtn.dataset.currency;
      saveState();

      updateOnboardingCurrencySymbols();
    });
  });

  document.querySelectorAll('#obOccupationGrid button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#obOccupationGrid button').forEach(b => b.classList.remove('selected'));
      const activeBtn = e.currentTarget;
      activeBtn.classList.add('selected');

      state.occupation = activeBtn.dataset.occupation;
      saveState();

      updateOnboardingIncomePresets();
      recalculateSuggestedBudgets();
    });
  });

  // Preset badging slide 2
  document.querySelectorAll('.preset-badge').forEach(badge => {
    badge.addEventListener('click', (e) => {
      document.querySelectorAll('.preset-badge').forEach(b => b.classList.remove('selected'));
      e.target.classList.add('selected');
      const val = parseInt(e.target.dataset.value);
      document.getElementById('obIncomeInput').value = val;
      state.income = val;
      saveState();
      recalculateSuggestedBudgets();
    });
  });

  // Onboarding Slide 3 Living Arrangement buttons click binds
  document.querySelectorAll('#obLivingArrangementGrid button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#obLivingArrangementGrid button').forEach(b => b.classList.remove('selected'));
      e.currentTarget.classList.add('selected');

      const status = e.currentTarget.dataset.status;
      if (!state.lifestyleProfile) state.lifestyleProfile = {};
      state.lifestyleProfile.arrangement = status;
      saveState();

      const rentWrapper = document.getElementById('obStudentRentWrapper');
      if (rentWrapper) {
        rentWrapper.style.display = (status === 'Home') ? 'none' : 'block';
      }
    });
  });

  const obUserName = document.getElementById('obUserName');
  if (obUserName) {
    obUserName.addEventListener('input', (e) => {
      state.userName = e.target.value.trim() || 'Shekhar';
      saveState();
    });
  }

  const obInitialBalance = document.getElementById('obInitialBalance');
  if (obInitialBalance) {
    obInitialBalance.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.initialBalance = isNaN(val) ? 0 : val;
      saveState();
    });
  }

  const obIncomeInput = document.getElementById('obIncomeInput');
  if (obIncomeInput) {
    obIncomeInput.addEventListener('input', () => {
      recalculateSuggestedBudgets();
    });
  }

  // Slide 3 fixed expense add bill
  const obAddBillBtn = document.getElementById('obAddBillBtn');
  if (obAddBillBtn) {
    obAddBillBtn.addEventListener('click', () => {
      state.fixedExpenses.push({
        id: `fx-${Date.now()}`,
        name: 'New Bill Commitment',
        amount: 0,
        frequency: 'monthly',
        paid: false
      });
      saveState();
      renderOnboardingFixedBills();
      recalculateSuggestedBudgets();
    });
  }

  // Slide 4 budgets suggestions toggles
  const dailyCard = document.getElementById('obDailyCard');
  const weeklyCard = document.getElementById('obWeeklyCard');
  if (dailyCard && weeklyCard) {
    dailyCard.addEventListener('click', () => {
      dailyCard.classList.add('selected');
      weeklyCard.classList.remove('selected');
      state.budget_period = 'daily';
      saveState();
      recalculateSuggestedBudgets();
    });
    weeklyCard.addEventListener('click', () => {
      weeklyCard.classList.add('selected');
      dailyCard.classList.remove('selected');
      state.budget_period = 'weekly';
      saveState();
      recalculateSuggestedBudgets();
    });
  }

  // Onboarding Slide 5 Complete button
  const completeOnboardingBtn = document.getElementById('obCompleteOnboardingBtn');
  if (completeOnboardingBtn) completeOnboardingBtn.addEventListener('click', completeOnboarding);

  // Floating Action button
  const fab = document.getElementById('floatingAddBtn');
  if (fab) {
    fab.addEventListener('click', () => {
      if (fab.classList.contains('open')) {
        closeNumpadDrawer();
      } else {
        openNumpadDrawer();
      }
    });
  }

  const drawerOverlay = document.getElementById('numpadDrawerOverlay');
  if (drawerOverlay) drawerOverlay.addEventListener('click', closeNumpadDrawer);

  // Monefy Category selections
  document.querySelectorAll('#numpadCategorySelectorGrid .numpad-cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const cat = e.currentTarget.dataset.category;
      setNumpadCategorySelection(cat);
    });
  });

  // Monefy toggle types
  document.getElementById('numpadTypeExpense').addEventListener('click', () => setNumpadTypeToggle('expense'));
  document.getElementById('numpadTypeIncome').addEventListener('click', () => setNumpadTypeToggle('income'));

  // Monefy Numpad key clicks
  document.querySelectorAll('.numpad-key-num').forEach(key => {
    key.addEventListener('click', (e) => {
      handleNumpadKeyClick(e.target.innerText);
    });
  });

  document.getElementById('numpadKeyClear').addEventListener('click', handleNumpadClear);
  document.getElementById('numpadKeyBackspace').addEventListener('click', handleNumpadBackspace);

  // Submit Numpad Form
  document.getElementById('numpadSubmitBtn').addEventListener('click', handleNumpadSubmit);
  document.getElementById('numpadCancelBtn').addEventListener('click', closeNumpadDrawer);

  // Logout & Welcome Redirection Actions
  const navBrand = document.getElementById('navBrand');
  if (navBrand) navBrand.addEventListener('click', handleLogoutAndRestart);

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogoutAndRestart);

  // Logout Modal Click Handlers
  const logoutOverlay = document.getElementById('logoutModalOverlay');
  if (logoutOverlay) {
    logoutOverlay.addEventListener('click', (e) => {
      if (e.target === logoutOverlay) closeLogoutModal();
    });
  }

  const closeLogoutX = document.getElementById('closeLogoutXBtn');
  if (closeLogoutX) closeLogoutX.addEventListener('click', closeLogoutModal);

  const logoutCancel = document.getElementById('logoutCancelBtn');
  if (logoutCancel) logoutCancel.addEventListener('click', closeLogoutModal);

  const logoutWithBackup = document.getElementById('logoutWithBackupBtn');
  if (logoutWithBackup) logoutWithBackup.addEventListener('click', () => executeLogout(true));

  const logoutWithoutBackup = document.getElementById('logoutWithoutBackupBtn');
  if (logoutWithoutBackup) logoutWithoutBackup.addEventListener('click', () => executeLogout(false));

  // Calendar Past-Logger Action
  const navCalendarBtn = document.getElementById('navCalendarBtn');
  if (navCalendarBtn) {
    navCalendarBtn.addEventListener('click', () => {
      openNumpadDrawer(true);
    });
  }

  // Profile Modal Actions
  const profileBtn = document.getElementById('profileBtn');
  const profileOverlay = document.getElementById('profileModalOverlay');
  const closeProfile = document.getElementById('closeProfileBtn');
  const closeProfileX = document.getElementById('closeProfileXBtn');

  if (profileBtn && profileOverlay) {
    profileBtn.addEventListener('click', () => {
      profileOverlay.classList.add('open');
      // Load current details into profile inputs from state
      document.getElementById('pfUserName').value = state.userName || 'Shekhar';
      document.getElementById('pfCurrencySymbol').value = state.currencySymbol || '₹';
      document.getElementById('pfOccupation').value = state.occupation || 'Student';
    });
  }

  if (closeProfile) {
    closeProfile.addEventListener('click', () => {
      profileOverlay.classList.remove('open');
    });
  }

  if (closeProfileX) {
    closeProfileX.addEventListener('click', () => {
      profileOverlay.classList.remove('open');
    });
  }

  // Save Profile Modal Details
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  if (saveProfileBtn) {
    saveProfileBtn.addEventListener('click', () => {
      const nameVal = document.getElementById('pfUserName').value.trim();
      const currencyVal = document.getElementById('pfCurrencySymbol').value;
      const occupationVal = document.getElementById('pfOccupation').value;

      if (!nameVal) {
        showToast('Name cannot be empty.', 'error');
        return;
      }

      state.userName = nameVal;
      state.currencySymbol = currencyVal;
      state.occupation = occupationVal;
      saveState();

      // Trigger full dynamic updates across all components
      renderLedgerCategoryFilter();
      refreshDashboard();

      profileOverlay.classList.remove('open');
      showToast('Personal profile details updated', 'success');
    });
  }

  // Settings Actions
  const settingsBtn = document.getElementById('settingsBtn');
  const settingsOverlay = document.getElementById('settingsModalOverlay');
  const closeSettings = document.getElementById('closeSettingsBtn');
  const closeSettingsX = document.getElementById('closeSettingsXBtn');

  const triggerSettingsOpenWithFocus = (focusId) => {
    if (settingsOverlay) {
      settingsOverlay.classList.add('open');
      // Load values into settings inputs
      document.getElementById('stIncomeVal').value = state.income;
      document.getElementById('stInitialBalanceVal').value = state.initialBalance || 0;
      document.getElementById('stBudgetVal').value = state.budgetValue;
      document.getElementById('stBudgetType').value = state.budget_period;

      const settingsIcon = document.getElementById('stIncomeIcon');
      if (settingsIcon) {
        const currencyIcons = { '₹': 'indian-rupee', '$': 'dollar-sign', '£': 'pound-sterling', '€': 'euro' };
        const iconName = currencyIcons[state.currencySymbol || '₹'] || 'wallet';
        settingsIcon.setAttribute('data-lucide', iconName);
        lucide.createIcons();
      }

      // Focus and highlight specific field
      const inputEl = document.getElementById(focusId);
      if (inputEl) {
        setTimeout(() => {
          inputEl.focus();
          inputEl.select();
        }, 120);
      }
    }
  };

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      triggerSettingsOpenWithFocus('stIncomeVal');
    });
  }

  const cardDisposable = document.getElementById('cardDisposableBalance');
  if (cardDisposable) {
    cardDisposable.addEventListener('click', () => {
      triggerSettingsOpenWithFocus('stIncomeVal');
    });
  }

  const cardInflow = document.getElementById('cardMonthlyInflow');
  if (cardInflow) {
    cardInflow.addEventListener('click', () => {
      triggerSettingsOpenWithFocus('stIncomeVal');
    });
  }

  const cardAccount = document.getElementById('cardAccountBalance');
  if (cardAccount) {
    cardAccount.addEventListener('click', () => {
      triggerSettingsOpenWithFocus('stInitialBalanceVal');
    });
  }

  if (closeSettings) {
    closeSettings.addEventListener('click', () => {
      settingsOverlay.classList.remove('open');
    });
  }

  if (closeSettingsX) {
    closeSettingsX.addEventListener('click', () => {
      settingsOverlay.classList.remove('open');
    });
  }

  // Save Settings Modal
  document.getElementById('saveSettingsBtn').addEventListener('click', () => {
    const incVal = parseFloat(document.getElementById('stIncomeVal').value);
    const initialBalVal = parseFloat(document.getElementById('stInitialBalanceVal').value) || 0;
    const limitVal = parseFloat(document.getElementById('stBudgetVal').value);
    const typeVal = document.getElementById('stBudgetType').value;

    if (isNaN(incVal) || incVal <= 0 || isNaN(limitVal) || limitVal <= 0) {
      showToast('Values must be greater than zero.', 'error');
      return;
    }

    state.income = incVal;
    state.initialBalance = initialBalVal;
    state.budgetValue = limitVal;
    state.budget_period = typeVal;
    saveState();

    // Trigger full reactive updates across allowances and charts
    refreshDashboard();

    settingsOverlay.classList.remove('open');
    showToast('Dashboard configurations saved', 'success');
  });

  // DB Export backups trigger
  document.getElementById('backupExportBtn').addEventListener('click', handleExportBackup);

  // DB Import backups trigger
  const fileIn = document.getElementById('backupFileInput');
  document.getElementById('backupImportBtn').addEventListener('click', () => fileIn.click());
  fileIn.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (evt) {
      try {
        const imported = JSON.parse(evt.target.result);
        if (imported.income && imported.budget_period && Array.isArray(imported.transactions)) {
          state = { ...state, ...imported, onboardingCompleted: true };
          saveState();
          applyTheme(state.theme);
          showDashboardView();
          settingsOverlay.classList.remove('open');
          showToast('Database restore complete!', 'success');
        } else {
          showToast('Invalid JSON file format.', 'error');
        }
      } catch (err) {
        showToast('JSON parse error occurred.', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Danger resets formatting data
  document.getElementById('resetDataBtn').addEventListener('click', () => {
    if (confirm('Format database? This resets all transactions and allowances.')) {
      localStorage.removeItem('montra_student_state');
      state = {
        income: 3000,
        initialBalance: 0,
        fixedExpenses: [
          { id: 'fx-1', name: 'Housing Rent', amount: 1200, frequency: 'monthly', paid: false },
          { id: 'fx-2', name: 'Phone Plan', amount: 45, frequency: 'monthly', paid: false },
          { id: 'fx-3', name: 'Gym / Sports', amount: 60, frequency: 'monthly', paid: false }
        ],
        budget_period: 'daily',
        budgetValue: 60,
        categoryBudgets: {
          Food: 300,
          Transport: 100,
          Shopping: 200,
          Entertainment: 150,
          Education: 150,
          Health: 100,
          Bills: 1400,
          Other: 100
        },
        transactions: [],
        theme: state.theme,
        onboardingCompleted: false,
        currencySymbol: '₹',
        occupation: 'Student'
      };
      saveState();
      settingsOverlay.classList.remove('open');
      showOnboardingView();
      initOnboardingUI();
      showToast('System formatted successfully', 'info');
    }
  });

  // Global Theme Toggles sun/moon
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }

  // Ledger Filter bar updates
  const ledgerSearch = document.getElementById('searchInput');
  const ledgerFilter = document.getElementById('categoryFilter');

  if (ledgerSearch) {
    ledgerSearch.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderLedgerTable();
    });
  }

  if (ledgerFilter) {
    ledgerFilter.addEventListener('change', (e) => {
      selectedCatFilter = e.target.value;
      renderLedgerTable();
    });
  }

  // Sidebar commitments custom adding trigger listeners
  setupSidebarCommitmentFormListeners();

  // Handle physical keyboard inputs when the numpad drawer is open
  window.addEventListener('keydown', (e) => {
    const drawerPanel = document.getElementById('numpadDrawerPanel');
    if (!drawerPanel || !drawerPanel.classList.contains('open')) return;

    // Do NOT capture inputs if user is focusing/typing inside standard fields
    const active = document.activeElement;
    const isInputFocused = active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'SELECT' ||
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable
    );

    if (isInputFocused) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const confirmBtn = document.getElementById('numpadSubmitBtn');
        if (confirmBtn) {
          confirmBtn.classList.add('active-flash');
          setTimeout(() => confirmBtn.classList.remove('active-flash'), 120);
        }
        handleNumpadSubmit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        const cancelBtn = document.getElementById('numpadCancelBtn');
        if (cancelBtn) {
          cancelBtn.classList.add('active-flash');
          setTimeout(() => cancelBtn.classList.remove('active-flash'), 120);
        }
        closeNumpadDrawer();
      }
      return;
    }

    // Process keys and trigger active flash highlighting
    if ((e.key >= '0' && e.key <= '9') || e.key === '.') {
      e.preventDefault();

      // Find matching visual key button to flash
      const keys = document.querySelectorAll('.numpad-keyboard-grid .numpad-key');
      keys.forEach(btn => {
        if (btn.innerText === e.key) {
          btn.classList.add('active-flash');
          setTimeout(() => btn.classList.remove('active-flash'), 120);
        }
      });

      handleNumpadKeyClick(e.key);
    }
    else if (e.key === 'Backspace') {
      e.preventDefault();

      const backspaceBtn = document.getElementById('numpadKeyBackspace');
      if (backspaceBtn) {
        backspaceBtn.classList.add('active-flash');
        setTimeout(() => backspaceBtn.classList.remove('active-flash'), 120);
      }

      handleNumpadBackspace();
    }
    else if (e.key === 'Escape') {
      e.preventDefault();

      const cancelBtn = document.getElementById('numpadCancelBtn');
      if (cancelBtn) {
        cancelBtn.classList.add('active-flash');
        setTimeout(() => cancelBtn.classList.remove('active-flash'), 120);
      }

      closeNumpadDrawer();
    }
    else if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();

      const clearBtn = document.getElementById('numpadKeyClear');
      if (clearBtn) {
        clearBtn.classList.add('active-flash');
        setTimeout(() => clearBtn.classList.remove('active-flash'), 120);
      }

      handleNumpadClear();
    }
    else if (e.key === 'Enter') {
      e.preventDefault();

      const confirmBtn = document.getElementById('numpadSubmitBtn');
      if (confirmBtn) {
        confirmBtn.classList.add('active-flash');
        setTimeout(() => confirmBtn.classList.remove('active-flash'), 120);
      }

      handleNumpadSubmit();
    }
  });

  // Savings Goal dream saver listener
  const saveGoalBtn = document.getElementById('saveSavingsGoalBtn');
  if (saveGoalBtn) {
    saveGoalBtn.addEventListener('click', () => {
      const titleInput = document.getElementById('savingsGoalTitleInput');
      const targetInput = document.getElementById('savingsGoalTargetInput');
      if (!titleInput || !targetInput) return;

      const title = titleInput.value.trim();
      const targetVal = parseFloat(targetInput.value);

      if (!title) {
        showToast('Please enter a goal title.', 'warning');
        return;
      }
      if (isNaN(targetVal) || targetVal <= 0) {
        showToast('Please enter a valid target amount.', 'warning');
        return;
      }

      state.savingsGoalActive = true;
      state.savingsGoalTitle = title;
      state.savingsGoalTarget = targetVal;
      saveState();

      refreshDashboard();
      showToast(`Savings Dream "${title}" locked! Target: ${state.currencySymbol || '₹'}${targetVal.toLocaleString()}`, 'success');
    });
  }
}


function setupSidebarCommitmentFormListeners() {
  const addBtn = document.getElementById('sidebarAddCommitmentBtn');
  const form = document.getElementById('sidebarAddCommitmentForm');
  const cancelBtn = document.getElementById('cancelCommitmentFormBtn');
  const saveBtn = document.getElementById('saveCommitmentFormBtn');

  if (addBtn && form) {
    addBtn.addEventListener('click', () => {
      addBtn.style.display = 'none';
      form.style.display = 'block';

      // Update currency symbol dynamically in label pre-fill
      const symbolSpan = document.getElementById('addCommitmentCurrencySymbol');
      if (symbolSpan) {
        symbolSpan.innerText = state.currencySymbol || '₹';
      }

      // Clear and focus inputs
      const nameInput = document.getElementById('addCommitmentName');
      const amountInput = document.getElementById('addCommitmentAmount');
      if (nameInput) {
        nameInput.value = '';
        nameInput.focus();
      }
      if (amountInput) amountInput.value = '';
    });
  }

  if (cancelBtn && form && addBtn) {
    cancelBtn.addEventListener('click', () => {
      form.style.display = 'none';
      addBtn.style.display = 'flex';
    });
  }

  if (saveBtn && form && addBtn) {
    saveBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('addCommitmentName');
      const amountInput = document.getElementById('addCommitmentAmount');
      const freqSelect = document.getElementById('addCommitmentFreq');

      if (!nameInput || !amountInput) return;

      const name = nameInput.value.trim();
      const amountVal = parseFloat(amountInput.value);

      if (!name) {
        showToast('Please enter a commitment name.', 'warning');
        return;
      }
      if (isNaN(amountVal) || amountVal <= 0) {
        showToast('Please enter a valid positive amount.', 'warning');
        return;
      }

      const freq = freqSelect ? freqSelect.value : 'monthly';

      // Create new fixed expense commitment
      const bill = {
        id: 'fx-' + Date.now(),
        name: name,
        amount: amountVal,
        frequency: freq,
        paid: false
      };

      state.fixedExpenses.push(bill);
      saveState();
      refreshDashboard();

      // Reset and hide form
      form.style.display = 'none';
      addBtn.style.display = 'flex';
      showToast(`Added custom commitment: "${name}"`, 'success');
    });
  }
}

// -------------------------------------------------------------
// BACKUP EXPORTER UTILITY
// -------------------------------------------------------------
function handleExportBackup() {
  try {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `montra_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database backup exported successfully!', 'success');
  } catch (err) {
    showToast('Failed to export database backup.', 'error');
  }
}

// -------------------------------------------------------------
// TOAST NOTIFICATION GENERATOR
// -------------------------------------------------------------
function showToast(message, type = 'info', showUndo = false) {
  const container = document.getElementById('toastContainer');
  if (toastTimeout) clearTimeout(toastTimeout);
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast-alert ${type}`;
  toast.innerHTML = `
    <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'alert-circle' : 'info'}" class="w-4 h-4"></i>
    <span class="flex-1">${message}</span>
    ${showUndo ? `<button class="toast-undo-action" id="toastUndoBtn">Undo</button>` : ''}
  `;
  container.appendChild(toast);
  lucide.createIcons();

  // Trigger fadeIn animation
  setTimeout(() => toast.classList.add('show'), 50);

  if (showUndo) {
    document.getElementById('toastUndoBtn').addEventListener('click', () => {
      undoDeleteTransaction();
      toast.classList.remove('show');
    });
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove('show');
  }, 4500);
}

// -------------------------------------------------------------
// OCCUPATION-BASED PERSONALIZATION ENGINE
// -------------------------------------------------------------
function renderSidebarProfileCard() {
  const profileCard = document.getElementById('sidebarProfileCard');
  const brandGreeting = document.getElementById('navBrandGreeting');
  if (!profileCard) return;

  const occupation = state.occupation || 'Student';
  const symbol = state.currencySymbol || '₹';

  // Compute active monthly spends and income
  const { year: currentYear, month: currentMonth } = getActiveMonthFilterRange();
  const income = getMonthlyIncome(currentYear, currentMonth);
  const referenceIncome = income > 0 ? income : state.income;

  // 1. Dynamic navbar hero greetings
  if (brandGreeting) {
    const uName = state.userName || 'Shekhar';
    const greetings = {
      Student: `Hey ${uName}! Ready to tackle your campus budget? 🎓`,
      Working: `Welcome back, ${uName}! Maximizing your hard-earned funds. 💼`,
      Freelancer: `Hello ${uName}! Managing flexible gig contract cashflows? 🚀`,
      Other: `Hi ${uName}! Keeping your sandbox budgets perfectly tuned. 🌟`
    };
    brandGreeting.innerText = greetings[occupation] || `"Track less. Understand more."`;
  }

  // 2. Occupation profiles parameters details
  const avatars = { Student: 'education', Working: 'tag', Freelancer: 'compass', Other: 'wallet' };
  const avatarIcon = avatars[occupation] || 'wallet';

  const savingsTargets = { Student: 0.30, Working: 0.50, Freelancer: 0.40, Other: 0.35 };
  const targetSavingsRatio = savingsTargets[occupation] || 0.30;
  const targetSavingsAmount = Math.round(referenceIncome * targetSavingsRatio);

  const monthlyExpensesList = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalSpent = monthlyExpensesList.reduce((sum, t) => sum + t.amount, 0);

  const actualSavings = Math.max(0, referenceIncome - totalSpent);
  const actualSavingsRatio = referenceIncome > 0 ? (actualSavings / referenceIncome) : 0;

  // Progress percentage comparison against suggested target
  const pct = Math.min(100, Math.round((actualSavingsRatio / targetSavingsRatio) * 100));

  const { totalRolloverSavings } = calculateRolloverSavings();

  let badgeText = 'On Track';
  let badgeClass = 'on-track';
  let barClass = 'success';

  if (pct < 50) {
    badgeText = 'Deficit';
    badgeClass = 'danger';
    barClass = 'danger';
  } else if (pct < 90) {
    badgeText = 'Approaching';
    badgeClass = 'warning';
    barClass = 'warning';
  }

  // Contextual daily tips array
  const tips = {
    Student: [
      "Always ask for student discount privileges at bookstores, transit, and subways! 🎓",
      "Dorm cookouts with classmates are 4x cheaper than campus dining hubs. 🍲",
      "Acquire textbooks second-hand or rent digital copies to preserve disposable cash. 📚",
      "Use campus transit loops and bus passes to eliminate daily transport cashouts. 🚌"
    ],
    Working: [
      "Automate a 20% recurring debit into investments on paycheck day! 💼",
      "Track daily office coffee breaks — espresso sweeps consume ₹4,000/month. ☕",
      "Audit active digital subscriptions once a quarter to remove unused slots. 📱",
      "Opt for tax-saving schemes and workspace deductions early in the fiscal year. 📈"
    ],
    Freelancer: [
      "Establish a 3-month emergency fund buffer to secure low-invoice months. 🚀",
      "Isolate 25% of every contract payout directly for tax season reserves. 📝",
      "Track software subscriptions and workspace leases as client deductibles. 💻",
      "Establish weekly contract billing milestones to smooth variable inflow cycles. 📊"
    ],
    Other: [
      "Review weekly spending surges every Sunday to adjust your allowance cap. 🌟",
      "Commit one day a week to 'Zero Expense Day' to reinforce active caps. 🛑",
      "Buy groceries in bulk packs to optimize monthly food budgets. 🛒",
      "Use automatic exports to backup your private sandbox ledger off-device. 💾"
    ]
  };

  const activeTips = tips[occupation] || tips.Student;
  // Pick a deterministic tip based on the day of the month so it changes daily but stays stable
  const tipIndex = now.getDate() % activeTips.length;
  const dailyTip = activeTips[tipIndex];

  const healthScore = calculateFinancialHealthScore();
  const personality = determineMoneyPersonality();

  // Health score tiers
  let scoreClass = 'needs-improvement';
  let scoreLabel = 'Needs Improvement';
  if (healthScore >= 90) {
    scoreClass = 'excellent';
    scoreLabel = 'Excellent';
  } else if (healthScore >= 75) {
    scoreClass = 'good';
    scoreLabel = 'Good';
  } else if (healthScore < 60) {
    scoreClass = 'danger';
    scoreLabel = 'High Spends Risk';
  }

  // Circular gauge parameter calculation
  const radius = 36;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (healthScore / 100) * circ;

  profileCard.style.display = 'flex';
  profileCard.innerHTML = `
    <div class="profile-badge-row" style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px; text-align: left; width: 100%;">
      <div class="profile-avatar-circle ${occupation}" style="width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: rgba(99,102,241,0.1); flex-shrink: 0;">
        <i data-lucide="${avatarIcon}" class="w-5 h-5"></i>
      </div>
      <div class="profile-details">
        <span class="profile-name-tag" style="font-size: 13px; font-weight: 800; color: var(--text-primary); display: block;">${state.userName || 'Shekhar'}</span>
        <span class="profile-role-sub" style="font-size: 10px; color: var(--text-secondary);">${occupation} Profile</span>
      </div>
    </div>
 
    <!-- Dynamic Money Personality glass badge -->
    <div class="personality-badge-row" style="margin: 0 0 16px 0; justify-content: flex-start; display: flex; width: 100%;">
      <div class="personality-badge" title="${personality.desc}">
        <i data-lucide="${personality.icon}"></i>
        <span>${personality.name}</span>
      </div>
    </div>
 
    <!-- Financial Health Score Circular Gauge -->
    <div class="health-score-container" style="width: 100%; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 20px; padding: 14px 10px; margin-bottom: 16px; gap: 12px; flex-direction: row;">
      <div class="circular-gauge-wrapper">
        <svg class="gauge-svg">
          <circle class="gauge-bg-ring" cx="45" cy="45" r="${radius}"></circle>
          <circle class="gauge-fill-ring ${scoreClass}" cx="45" cy="45" r="${radius}" stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
        </svg>
        <span class="gauge-text-val">${healthScore}</span>
      </div>
      <div style="flex: 1; text-align: left;">
        <span class="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">Financial Health</span>
        <span class="health-badge-tag ${scoreClass}">${scoreLabel}</span>
      </div>
    </div>
 
    <div class="profile-savings-progress-box" style="width: 100%; margin-bottom: 16px; display: flex; flex-direction: column; gap: 8px;">
      <div class="savings-label-row" style="display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 800;">
        <span class="savings-title text-zinc-400">Savings Target Indicator</span>
        <span class="savings-rate-badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="flex justify-between text-[10px] font-semibold text-zinc-500 mt-1" style="display: flex; justify-content: space-between;">
        <span>Target: ${Math.round(targetSavingsRatio * 100)}% (${symbol}${targetSavingsAmount.toLocaleString()})</span>
        <span>Active: ${symbol}${actualSavings.toLocaleString()}</span>
      </div>
      <div class="savings-track-bar mt-2" style="height: 6px; background: var(--bg-input); border-radius: 3px; overflow: hidden; margin-top: 6px;">
        <div class="savings-fill-bar ${barClass}" style="width: ${pct}%; height: 100%;"></div>
      </div>

      <!-- Rollover Envelope Section -->
      <div style="margin-top: 6px; padding: 10px; border-radius: 12px; background: rgba(16, 185, 129, 0.04); border: 1px dashed rgba(16, 185, 129, 0.2); display: flex; flex-direction: column; gap: 4px; text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 9.5px; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.3px; display: inline-flex; align-items: center; gap: 4px;">
            <i data-lucide="piggy-bank" class="w-3.5 h-3.5 text-emerald-400"></i>
            Rollover Savings
          </span>
          <span style="font-size: 11px; font-weight: 800; color: #10b981;">+${symbol}${totalRolloverSavings.toLocaleString()}</span>
        </div>
        <p style="font-size: 9px; color: var(--text-muted); line-height: 1.3; margin: 0; font-weight: 550;">
          Unutilized allowances from previous months have been automatically swept into your savings!
        </p>
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.04); margin-top: 4px; padding-top: 4px;">
          <span style="font-size: 9.5px; font-weight: 800; color: var(--text-primary); text-transform: uppercase;">Total Savings Pool</span>
          <span style="font-size: 11.5px; font-weight: 800; color: var(--text-primary);">${symbol}${(totalRolloverSavings + actualSavings).toLocaleString()}</span>
        </div>
      </div>
    </div>
 
    <div class="profile-tip-box" style="width: 100%; display: flex; gap: 10px; padding: 12px; border-radius: 14px; background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); align-items: flex-start;">
      <div class="profile-tip-icon" style="color: var(--accent-secondary);"><i data-lucide="compass" class="w-4 h-4 text-indigo-400"></i></div>
      <div class="profile-tip-text" style="font-size: 11px; color: var(--text-secondary); line-height: 1.45; text-align: left;">${dailyTip}</div>
    </div>
  `;

  lucide.createIcons();
}

function getActiveMonthFilterRange() {
  let targetYear, targetMonth;
  if (state.activeMonth) {
    const [year, month] = state.activeMonth.split('-').map(Number);
    targetYear = year;
    targetMonth = month - 1; // 0-indexed in JS Date
  } else {
    const now = new Date();
    targetYear = now.getFullYear();
    targetMonth = now.getMonth();
    const formatted = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    state.activeMonth = formatted;
  }
  return { year: targetYear, month: targetMonth };
}

function calculateFinancialHealthScore() {
  const { year: currentYear, month: currentMonth } = getActiveMonthFilterRange();

  // 1. Get monthly expenses
  const monthlyExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalSpent === 0) return 100; // Perfect score for no spending!

  const income = getMonthlyIncome(currentYear, currentMonth) || state.income;

  // A. Budget Adherence (40 points)
  let overallLimit = state.budgetValue || 60;
  if (state.budget_period === 'daily') {
    overallLimit = overallLimit * 30.5;
  } else {
    overallLimit = overallLimit * 4.3;
  }

  let budgetScore = 40;
  if (totalSpent > overallLimit) {
    const excessPct = (totalSpent - overallLimit) / overallLimit;
    budgetScore = Math.max(0, 40 - Math.round(excessPct * 40));
  }

  // B. Savings Rate (30 points)
  const actualSavings = Math.max(0, income - totalSpent);
  const actualSavingsRatio = income > 0 ? (actualSavings / income) : 0;

  const targetSavingsRatio = { Student: 0.30, Working: 0.50, Freelancer: 0.40, Other: 0.35 }[state.occupation || 'Student'] || 0.30;

  let savingsScore = 30;
  if (actualSavingsRatio < targetSavingsRatio) {
    const deficitRatio = (targetSavingsRatio - actualSavingsRatio) / targetSavingsRatio;
    savingsScore = Math.max(0, 30 - Math.round(deficitRatio * 30));
  }

  // C. Essential vs Non-essential Balance (15 points)
  const CATEGORY_CLASSIFICATION = {
    'Rent/Hostel': 'essential',
    'Food': 'essential',
    'Transport': 'essential',
    'Stationery': 'essential',
    'Education': 'essential',
    'Miscellaneous': 'non-essential',
    'Rent': 'essential',
    'Utilities': 'essential',
    'Groceries': 'essential',
    'Savings': 'essential',
    'EMI/Loan': 'essential',
    'Other Recurring': 'essential',
    'Shopping': 'non-essential',
    'Entertainment': 'non-essential',
    'Health': 'essential',
    'Bills': 'essential',
    'Other': 'non-essential'
  };

  let essentialSpends = 0;
  let nonEssentialSpends = 0;
  monthlyExpenses.forEach(t => {
    const classification = CATEGORY_CLASSIFICATION[t.category] || 'non-essential';
    if (classification === 'essential') {
      essentialSpends += t.amount;
    } else {
      nonEssentialSpends += t.amount;
    }
  });

  const nonEssentialPct = totalSpent > 0 ? (nonEssentialSpends / totalSpent) : 0;
  let essentialScore = 15;
  if (nonEssentialPct > 0.35) {
    essentialScore = Math.max(0, 15 - Math.round((nonEssentialPct - 0.35) * 20));
  }

  // D. Spending Consistency (15 points)
  const dailySpendsMap = {};
  monthlyExpenses.forEach(t => {
    const day = new Date(t.date).getDate();
    dailySpendsMap[day] = (dailySpendsMap[day] || 0) + t.amount;
  });

  const dailySpends = Object.values(dailySpendsMap);
  let consistencyScore = 15;
  if (dailySpends.length > 1) {
    const avg = totalSpent / 30.5;
    const sqDiffSum = dailySpends.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0);
    const stdDev = Math.sqrt(sqDiffSum / dailySpends.length);
    const variancePct = stdDev / Math.max(1, avg);
    consistencyScore = Math.max(0, 15 - Math.round(variancePct * 5));
  }

  return Math.min(100, Math.max(0, Math.round(budgetScore + savingsScore + essentialScore + consistencyScore)));
}

function determineMoneyPersonality() {
  const { year: currentYear, month: currentMonth } = getActiveMonthFilterRange();

  const monthlyExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const income = getMonthlyIncome(currentYear, currentMonth) || state.income;

  if (monthlyExpenses.length === 0) {
    return { name: "Balanced Spender", icon: "wallet", desc: "You have clean balance sheets with no discretionary spending logged yet! Keep it up!" };
  }

  let overallLimit = state.budgetValue || 60;
  if (state.budget_period === 'daily') {
    overallLimit = overallLimit * 30.5;
  } else {
    overallLimit = overallLimit * 4.3;
  }

  const isAdherent = totalSpent <= overallLimit;
  const actualSavings = Math.max(0, income - totalSpent);
  const actualSavingsRatio = income > 0 ? (actualSavings / income) : 0;

  const targetSavingsRatio = { Student: 0.30, Working: 0.50, Freelancer: 0.40, Other: 0.35 }[state.occupation || 'Student'] || 0.30;
  const healthScore = calculateFinancialHealthScore();

  let shoppingSpends = 0;
  monthlyExpenses.forEach(t => {
    if (t.category.toLowerCase().includes('shop') || t.category.toLowerCase().includes('play') || t.category.toLowerCase().includes('misc') || t.category.toLowerCase().includes('entert')) {
      shoppingSpends += t.amount;
    }
  });
  const impulsivePct = shoppingSpends / totalSpent;

  if (healthScore < 60) {
    return { name: "Risk Spender", icon: "alert-triangle", desc: "Warning! Your outflows consume almost all stipends. Discretionary spending surges trigger high credit budget risk!" };
  }
  if (impulsivePct > 0.35) {
    return { name: "Impulsive Shopper", icon: "shopping-bag", desc: "Shopping & leisure spends consume over 35% of your total outflows. Try locking non-essential cards!" };
  }
  if (actualSavingsRatio >= targetSavingsRatio + 0.10) {
    return { name: "Smart Saver", icon: "piggy-bank", desc: "Incredible! Your active savings rate is 10%+ higher than your occupation profile targets. Keep building assets!" };
  }
  if (isAdherent && monthlyExpenses.length >= 3) {
    return { name: "Budget Master", icon: "award", desc: "Perfect! You stay completely within your allowance caps, logging entries diligently. A financial coach role model!" };
  }
  return { name: "Balanced Spender", icon: "wallet", desc: "You balance core essentials and minor shopping well, maintaining stable limits control." };
}

function initMonthFilter() {
  const select = document.getElementById('dashMonthFilter');
  if (!select) return;

  select.innerHTML = '';

  const monthsSet = new Set();
  state.transactions.forEach(t => {
    if (t.date) {
      const parts = t.date.split('-');
      if (parts.length >= 2) {
        monthsSet.add(`${parts[0]}-${parts[1]}`);
      }
    }
  });

  const now = new Date();
  for (let i = 0; i < 4; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const formatted = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthsSet.add(formatted);
  }

  const sortedMonths = Array.from(monthsSet).sort().reverse();

  sortedMonths.forEach(mStr => {
    const [year, month] = mStr.split('-').map(Number);
    const d = new Date(year, month - 1, 1);
    const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

    const opt = document.createElement('option');
    opt.value = mStr;
    opt.innerText = label;
    select.appendChild(opt);
  });

  if (!state.activeMonth) {
    const currentFormatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    state.activeMonth = currentFormatted;
  }

  select.value = state.activeMonth;

  select.removeEventListener('change', handleMonthChange);
  select.addEventListener('change', handleMonthChange);
}

function handleMonthChange(e) {
  state.activeMonth = e.target.value;
  saveState();
  refreshDashboard();
}

function renderPredictiveDashboardBanner() {
  const banner = document.getElementById('predictiveAlertsBanner');
  if (!banner) return;

  banner.innerHTML = '';

  const now = new Date();
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const symbol = state.currencySymbol || '₹';

  const currentMonthExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Calculate true variable expenses (non-recurring) to find the regular daily average pace
  const variableExpenses = currentMonthExpenses.filter(t => !t.id.startsWith('tx-fixed-'));
  const variableTotal = variableExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Projected variable spent based on daily pace
  const avgSpentPerDay = variableTotal / Math.max(1, today);
  const projectedVariableSpent = Math.round(avgSpentPerDay * daysInMonth);

  // Fixed commitments total (total sum of all user's configured bills for the month, paid or unpaid)
  const fixedTotal = state.fixedExpenses.reduce((sum, b) => sum + getMonthlyEquivalentOfBill(b), 0);

  // Total projected spent is the sum of daily variable pace + absolute fixed sum
  const projectedMonthlySpent = projectedVariableSpent + fixedTotal;

  let alertsHtml = '';

  // 1. Pending Fixed Commitments Reminder (High priority)
  const unpaidBills = state.fixedExpenses.filter(b => !b.paid);
  if (unpaidBills.length > 0) {
    const unpaidTotal = unpaidBills.reduce((sum, b) => sum + b.amount, 0);
    const unpaidNames = unpaidBills.map(b => b.name).join(', ');

    alertsHtml += `
      <div class="coach-alert-banner warning hover:scale-[1.002] transition-all" style="background: rgba(99, 102, 241, 0.04); border: 1px solid rgba(99, 102, 241, 0.15); border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
        <div class="coach-alert-icon" style="background: rgba(99, 102, 241, 0.1); color: #6366f1; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="bell" class="w-4 h-4"></i></div>
        <div class="coach-alert-content text-left">
          <h4 class="coach-alert-title text-indigo-400" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Pending Fixed Commitments</h4>
          <p class="coach-alert-desc" style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4; font-weight: 550;">Reminder: You have <strong>${unpaidBills.length}</strong> outstanding fixed commitment(s) (<strong>${unpaidNames}</strong>) totaling <strong>${symbol}${unpaidTotal.toLocaleString()}</strong> due this month. Check them off in the sidebar once paid to log them to your ledger!</p>
        </div>
      </div>
    `;
  }

  // 2. Projected Month-End Deficit Alert
  const currentIncome = getMonthlyIncome(now.getFullYear(), now.getMonth()) || state.income;
  if (projectedMonthlySpent > currentIncome) {
    const deficit = projectedMonthlySpent - currentIncome;
    alertsHtml += `
      <div class="coach-alert-banner danger hover:scale-[1.002] transition-all" style="background: rgba(244, 63, 94, 0.04); border: 1px solid rgba(244, 63, 94, 0.15); border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; display: flex; gap: 12px; align-items: center;">
        <div class="coach-alert-icon" style="background: rgba(244, 63, 94, 0.1); color: #f43f5e; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="alert-triangle" class="w-4 h-4"></i></div>
        <div class="coach-alert-content text-left">
          <h4 class="coach-alert-title text-rose-500" style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Projected Month-End Deficit Alert</h4>
          <p class="coach-alert-desc" style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4; font-weight: 550;">At your current pace, you will overshoot your stipends by <strong>${symbol}${deficit.toLocaleString()}</strong> by the end of the month! Limit non-essential play and shopping.</p>
        </div>
      </div>
    `;
  }

  // 3. Category Budget Depletion Notice
  let overspentCat = '';
  let overspentPct = 0;
  Object.entries(state.categoryBudgets).forEach(([cat, val]) => {
    const spent = currentMonthExpenses.filter(t => t.category === cat).reduce((sum, t) => sum + t.amount, 0);
    const pct = val > 0 ? (spent / val) * 100 : 0;
    if (pct >= 85 && pct > overspentPct) {
      overspentPct = Math.round(pct);
      overspentCat = cat;
    }
  });

  if (overspentCat) {
    alertsHtml += `
      <div class="coach-alert-banner warning hover:scale-[1.002] transition-all" style="background: rgba(245, 158, 11, 0.04); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 16px; padding: 12px 16px; margin-bottom: 24px; display: flex; gap: 12px; align-items: center;">
        <div class="coach-alert-icon" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"><i data-lucide="alert-circle" class="w-4 h-4"></i></div>
        <div class="coach-alert-content text-left">
          <h4 class="coach-alert-title text-amber-500" style="color: #f59e0b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Budget Depletion Notice</h4>
          <p class="coach-alert-desc" style="font-size: 11px; color: var(--text-secondary); margin-top: 2px; line-height: 1.4; font-weight: 550;">Heads up! You have consumed <strong>${overspentPct}%</strong> of your designated <strong>${overspentCat}</strong> allowance. Hold back spending in this category!</p>
        </div>
      </div>
    `;
  }

  banner.innerHTML = alertsHtml;
  lucide.createIcons();
}

function renderNumpadCategoryGrid() {
  const container = document.getElementById('numpadCategorySelectorGrid');
  if (!container) return;

  container.innerHTML = '';

  let categories = [];
  if (numpadType === 'income') {
    categories = ['Stipend', 'Salary', 'Allowance', 'Freelance', 'Gift', 'Other'];
  } else {
    categories = state.categories || ['Food', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Health', 'Bills', 'Other'];
  }

  if (!categories.includes(numpadCategory)) {
    numpadCategory = categories[0];
  }

  const iconMap = {
    'Rent/Hostel': 'home',
    'Rent': 'home',
    'Food': 'utensils',
    'Groceries': 'shopping-cart',
    'Transport': 'car',
    'Stationery': 'pen-tool',
    'Education': 'graduation-cap',
    'Miscellaneous': 'tag',
    'Utilities': 'zap',
    'Savings': 'wallet',
    'EMI/Loan': 'credit-card',
    'Other Recurring': 'calendar',
    'Shopping': 'shopping-bag',
    'Entertainment': 'clapperboard',
    'Health': 'heart',
    'Bills': 'receipt',
    'Salary': 'wallet',
    'Stipend': 'graduation-cap',
    'Allowance': 'coins',
    'Freelance': 'laptop',
    'Gift': 'gift',
    'Other': 'tag'
  };

  categories.forEach((cat, idx) => {
    const isSelected = (numpadCategory === cat);
    const icon = iconMap[cat] || 'tag';

    const btn = document.createElement('button');
    btn.className = `numpad-cat-btn${isSelected ? ' selected' : ''}`;
    btn.dataset.category = cat;
    btn.type = 'button';
    btn.innerHTML = `
      <i data-lucide="${icon}"></i>
      <span class="numpad-cat-label">${cat}</span>
    `;

    btn.addEventListener('click', () => {
      setNumpadCategorySelection(cat);
    });

    container.appendChild(btn);
  });

  lucide.createIcons();
}

function renderAICoachTab() {
  const symbol = state.currencySymbol || '₹';
  const now = new Date();
  const oneDay = 24 * 60 * 60 * 1000;

  // A. Weekly Report Breakdown
  const currentWeekSpends = state.transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const diff = now - new Date(t.date);
    return diff >= 0 && diff < 7 * oneDay;
  });

  const prevWeekSpends = state.transactions.filter(t => {
    if (t.type !== 'expense') return false;
    const diff = now - new Date(t.date);
    return diff >= 7 * oneDay && diff < 14 * oneDay;
  });

  const totalCurrentWeek = currentWeekSpends.reduce((sum, t) => sum + t.amount, 0);
  const totalPrevWeek = prevWeekSpends.reduce((sum, t) => sum + t.amount, 0);

  let wowPct = 0;
  let wowLabel = 'stable';
  let wowClass = 'text-indigo-400';
  if (totalPrevWeek > 0) {
    wowPct = Math.round(((totalCurrentWeek - totalPrevWeek) / totalPrevWeek) * 100);
    wowLabel = wowPct > 0 ? `increased by ${wowPct}%` : `decreased by ${Math.abs(wowPct)}%`;
    wowClass = wowPct > 0 ? 'text-rose-500 font-extrabold' : 'text-emerald-500 font-extrabold';
  } else if (totalCurrentWeek > 0) {
    wowLabel = 'increased (first records)';
    wowClass = 'text-rose-500';
  }

  // Group weekly spends by category
  const weekCatsMap = {};
  currentWeekSpends.forEach(t => {
    weekCatsMap[t.category] = (weekCatsMap[t.category] || 0) + t.amount;
  });

  let weeklyCatsHtml = '';
  if (currentWeekSpends.length === 0) {
    weeklyCatsHtml = `<div class="text-zinc-500 font-bold text-xs py-4 text-center w-full">No transactions logged in the last 7 days.</div>`;
  } else {
    Object.entries(weekCatsMap).forEach(([cat, val]) => {
      const pct = Math.round((val / totalCurrentWeek) * 100);

      const color = (function () {
        if (!cat) return '#64748b'; // default Slate
        const trimmed = cat.trim();
        if (CATEGORY_COLORS[trimmed]) return CATEGORY_COLORS[trimmed];
        const lower = trimmed.toLowerCase();
        const matchedKey = Object.keys(CATEGORY_COLORS).find(k => k.toLowerCase() === lower);
        return matchedKey ? CATEGORY_COLORS[matchedKey] : '#64748b';
      })();

      let icon = 'tag';
      const cLower = cat.toLowerCase();
      if (cLower.includes('food')) icon = 'utensils';
      else if (cLower.includes('trans') || cLower.includes('commute')) icon = 'car';
      else if (cLower.includes('shop')) icon = 'shopping-bag';
      else if (cLower.includes('enter') || cLower.includes('leisure')) icon = 'clapperboard';
      else if (cLower.includes('edu')) icon = 'graduation-cap';
      else if (cLower.includes('station')) icon = 'pen-tool';
      else if (cLower.includes('rent') || cLower.includes('hostel') || cLower.includes('house')) icon = 'home';
      else if (cLower.includes('heal') || cLower.includes('med')) icon = 'heart';
      else if (cLower.includes('util')) icon = 'zap';
      else if (cLower.includes('bill')) icon = 'receipt';
      else if (cLower.includes('save')) icon = 'wallet';
      else if (cLower.includes('emi') || cLower.includes('loan')) icon = 'credit-card';

      weeklyCatsHtml += `
        <div style="display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 12px; margin-bottom: 8px; transition: all 0.2s ease;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 11px; font-weight: 800;">
            <span style="display: inline-flex; align-items: center; gap: 6px; color: var(--text-primary);">
              <i data-lucide="${icon}" class="w-3.5 h-3.5" style="color: ${color};"></i>
              ${cat}
            </span>
            <span style="color: var(--text-secondary);">${symbol}${val.toLocaleString()} <span style="color: var(--text-muted); font-size: 9px; font-weight: 700; margin-left: 2px;">(${pct}%)</span></span>
          </div>
          
          <div style="height: 6px; width: 100%; background: rgba(255, 255, 255, 0.05); border-radius: 3px; overflow: hidden; position: relative;">
            <div style="height: 100%; width: ${pct}%; background: ${color}; border-radius: 3px; box-shadow: 0 0 8px ${color}; transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);"></div>
          </div>
          
        </div>
      `;
    });
  }

  const essentialCats = ['Rent', 'Rent/Hostel', 'Food', 'Groceries', 'Transport', 'Utilities', 'Education', 'Stationery', 'Bills', 'Health'];
  const necessarySpends = currentWeekSpends.filter(t => essentialCats.includes(t.category)).reduce((sum, t) => sum + t.amount, 0);
  const avoidableSpends = Math.max(0, totalCurrentWeek - necessarySpends);

  let maxCat = 'None';
  let maxAmount = 0;
  Object.entries(weekCatsMap).forEach(([cat, val]) => {
    if (val > maxAmount) {
      maxAmount = val;
      maxCat = cat;
    }
  });

  const weeklyReviewEl = document.getElementById('weeklyReviewContainer');
  if (weeklyReviewEl) {
    weeklyReviewEl.innerHTML = `
      <div class="flex flex-col gap-4 text-left" style="display: flex; flex-direction: column; gap: 16px;">
        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 16px; padding: 14px 16px;">
          <div class="flex justify-between items-center" style="display: flex; justify-content: space-between;">
            <span class="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider">Weekly Spending Total</span>
            <span class="text-xs ${wowClass}">${wowLabel} vs last week</span>
          </div>
          <div class="text-2xl font-extrabold text-white mt-1">${symbol}${totalCurrentWeek.toLocaleString()}</div>
        </div>

        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 16px; padding: 14px 16px;">
          <span class="text-[10px] font-extrabold text-zinc-500 uppercase tracking-widest block mb-3">Category Breakdown (This Week)</span>
          <div class="flex flex-col gap-1.5">
            ${weeklyCatsHtml}
          </div>
        </div>
        
        <div class="flex flex-col gap-3" style="display: flex; flex-direction: column; gap: 12px;">
          <div class="coach-question-item" style="border-left: 3px solid #10b981;">
            <div class="coach-question-num" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="shield-check" class="w-4 h-4"></i>
            </div>
            <div class="coach-question-content">
              <h4 class="coach-question-title">What was necessary spending?</h4>
              <p class="coach-question-answer">Necessary core expenses sum up to <strong>${symbol}${necessarySpends.toLocaleString()}</strong> this week. This includes rent/housing, transport commute, groceries food, utilities, and education requirements.</p>
            </div>
          </div>
          
          <div class="coach-question-item" style="border-left: 3px solid #f43f5e;">
            <div class="coach-question-num" style="background: rgba(244, 63, 94, 0.1); color: #f43f5e; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="alert-circle" class="w-4 h-4"></i>
            </div>
            <div class="coach-question-content">
              <h4 class="coach-question-title">What could have been avoided?</h4>
              <p class="coach-question-answer">You spent <strong>${symbol}${avoidableSpends.toLocaleString()}</strong> on avoidable/discretionary items (leisure, impulse shopping, miscellaneous cashouts). Consider pausing subscription plans next week to build reserves.</p>
            </div>
          </div>
          
          <div class="coach-question-item" style="border-left: 3px solid #f59e0b;">
            <div class="coach-question-num" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <i data-lucide="flame" class="w-4 h-4"></i>
            </div>
            <div class="coach-question-content">
              <h4 class="coach-question-title">Which category is consuming the most money?</h4>
              <p class="coach-question-answer">Your highest outflow hotspot this week is <strong>${maxCat}</strong>, consuming a total of <strong>${symbol}${maxAmount.toLocaleString()}</strong>.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // B. Essential vs Non-Essential Spends Breakdown (Monthly)
  const { year: currentYear, month: currentMonth } = getActiveMonthFilterRange();
  const monthlyExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlyTotal = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);

  let essentialMonthly = 0;
  let nonEssentialMonthly = 0;

  const CATEGORY_CLASSIFICATION = {
    'Rent/Hostel': 'essential',
    'Food': 'essential',
    'Transport': 'essential',
    'Stationery': 'essential',
    'Education': 'essential',
    'Miscellaneous': 'non-essential',
    'Rent': 'essential',
    'Utilities': 'essential',
    'Groceries': 'essential',
    'Savings': 'essential',
    'EMI/Loan': 'essential',
    'Other Recurring': 'essential',
    'Shopping': 'non-essential',
    'Entertainment': 'non-essential',
    'Health': 'essential',
    'Bills': 'essential',
    'Other': 'non-essential'
  };

  monthlyExpenses.forEach(t => {
    const c = CATEGORY_CLASSIFICATION[t.category] || 'non-essential';
    if (c === 'essential') {
      essentialMonthly += t.amount;
    } else {
      nonEssentialMonthly += t.amount;
    }
  });

  const essentialPct = monthlyTotal > 0 ? Math.round((essentialMonthly / monthlyTotal) * 100) : 70;
  const nonEssentialPct = 100 - essentialPct;

  let adviceTitle = 'Healthy Spending Balance';
  let adviceDesc = 'Excellent! Discretionary shopping and play are well under 35% of total outflows. Your sandboxed stipends are highly secure!';
  let adviceClass = 'success';
  let adviceIcon = 'check-circle';

  if (nonEssentialPct > 40) {
    adviceTitle = 'High Discretionary Spends';
    adviceDesc = `Discretionary spends consume ${nonEssentialPct}% of your outflows. Pause luxury shopping or coffee surges to protect monthly allowance margins!`;
    adviceClass = 'danger';
    adviceIcon = 'alert-circle';
  } else if (nonEssentialPct > 25) {
    adviceTitle = 'Approaching Outflow Margin';
    adviceDesc = 'Discretionary spends consume over 25%. Limit non-essential commitments next week to boost active savings rate.';
    adviceClass = 'warning';
    adviceIcon = 'compass';
  }

  const essentialEl = document.getElementById('essentialSpendingContainer');
  if (essentialEl) {
    essentialEl.innerHTML = `
      <div class="flex flex-col text-left gap-4" style="display: flex; flex-direction: column; gap: 16px;">
        <div class="essential-progress-container" style="display: flex; flex-direction: column; gap: 12px; padding: 16px; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-color); border-radius: 16px; margin-bottom: 0;">
          <div class="flex justify-between text-[10px] font-extrabold text-zinc-400" style="display: flex; justify-content: space-between;">
            <span class="legend-badge essential" style="display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700;"><i class="w-2.5 h-2.5 text-emerald-500" data-lucide="circle"></i> Essential Spends (${essentialPct}%)</span>
            <span class="legend-badge non-essential" style="display: inline-flex; align-items: center; gap: 6px; font-size: 10px; font-weight: 700;"><i class="w-2.5 h-2.5 text-rose-500" data-lucide="circle"></i> Non-Essential (${nonEssentialPct}%)</span>
          </div>
          <div class="essential-ratio-bar" style="height: 12px; width: 100%; background: #f43f5e; border-radius: 6px; overflow: hidden; display: flex; box-shadow: inset 0 1px 3px rgba(0,0,0,0.4);">
            <div class="essential-ratio-fill" style="width: ${essentialPct}%; height: 100%; background: #10b981; border-radius: 6px 0 0 6px; transition: width 0.6s ease;"></div>
          </div>
          <div class="flex justify-between text-[10px] text-zinc-500 font-bold" style="display: flex; justify-content: space-between;">
            <span>${symbol}${essentialMonthly.toLocaleString()} necessary</span>
            <span>${symbol}${nonEssentialMonthly.toLocaleString()} avoidable</span>
          </div>
        </div>

        <div class="insight-advisory-card ${adviceClass} animate-fadeIn" style="margin: 0;">
          <div class="insight-advisory-icon"><i data-lucide="${adviceIcon}" class="w-5 h-5"></i></div>
          <div class="insight-advisory-content">
            <h4 class="insight-advisory-title">${adviceTitle}</h4>
            <p class="insight-advisory-desc">${adviceDesc}</p>
          </div>
        </div>
      </div>
    `;
  }

  // C. Forecast Alerts & Historical Comparisons
  const today = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentMonthExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  // Calculate true variable expenses (non-recurring) to find the regular daily average pace
  const variableExpenses = currentMonthExpenses.filter(t => !t.id.startsWith('tx-fixed-'));
  const variableTotal = variableExpenses.reduce((sum, t) => sum + t.amount, 0);

  // Projected variable spent based on daily pace
  const avgSpentPerDay = variableTotal / Math.max(1, today);
  const projectedVariableSpent = Math.round(avgSpentPerDay * daysInMonth);

  // Fixed commitments total (total sum of all user's configured bills for the month, paid or unpaid)
  const fixedTotal = state.fixedExpenses.reduce((sum, b) => sum + getMonthlyEquivalentOfBill(b), 0);

  // Total projected spent is the sum of daily variable pace + absolute fixed sum
  const projectedMonthlySpent = projectedVariableSpent + fixedTotal;

  let forecastHtml = '';
  if (projectedMonthlySpent > state.income) {
    const deficit = projectedMonthlySpent - state.income;
    forecastHtml = `
      <div class="insight-advisory-card danger animate-fadeIn" style="margin: 0 0 16px 0;">
        <div class="insight-advisory-icon"><i data-lucide="alert-circle" class="w-5 h-5"></i></div>
        <div class="insight-advisory-content text-left">
          <h4 class="insight-advisory-title">Budget Deficit Forecast</h4>
          <p class="insight-advisory-desc">At your current daily spending rate, you may exceed your monthly income by <strong>${symbol}${deficit.toLocaleString()}</strong> by month-end. You need to reduce non-essential spending immediately!</p>
        </div>
      </div>
    `;
  } else {
    const projectedSavings = state.income - projectedMonthlySpent;
    forecastHtml = `
      <div class="insight-advisory-card success animate-fadeIn" style="margin: 0 0 16px 0;">
        <div class="insight-advisory-icon"><i data-lucide="check-circle" class="w-5 h-5"></i></div>
        <div class="insight-advisory-content text-left">
          <h4 class="insight-advisory-title">Healthy Budget Forecast</h4>
          <p class="insight-advisory-desc">You are on track to save <strong>${symbol}${projectedSavings.toLocaleString()}</strong> by the end of this month! Excellent pacing control.</p>
        </div>
      </div>
    `;
  }

  // Get inflows vs outflows of last 4 months
  const nowComp = new Date();
  const pastMonths = [];
  for (let i = 3; i >= 0; i--) {
    const d = new Date(nowComp.getFullYear(), nowComp.getMonth() - i, 1);
    pastMonths.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      formatted: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    });
  }

  let histHtml = '';
  pastMonths.forEach(m => {
    const mExpenses = state.transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'expense' && d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    const mSpent = mExpenses.reduce((sum, t) => sum + t.amount, 0);

    const mIncome = state.transactions.filter(t => {
      const d = new Date(t.date);
      return t.type === 'income' && d.getMonth() === m.month && d.getFullYear() === m.year;
    });
    const mInflow = mIncome.length > 0 ? mIncome.reduce((sum, t) => sum + t.amount, 0) : state.income;

    const maxVal = Math.max(1, mInflow, mSpent);
    const spentPct = Math.min(100, Math.round((mSpent / maxVal) * 100));
    const inflowPct = Math.min(100, Math.round((mInflow / maxVal) * 100));

    histHtml += `
      <div class="flex items-center gap-3" style="display: flex; align-items: center; gap: 12px;">
        <span class="text-[10px] font-extrabold text-zinc-400 w-8 text-left">${m.label}</span>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
          <!-- Inflow Bar -->
          <div style="height: 6px; background: var(--bg-input); border-radius: 3px; width: 100%; overflow: hidden;">
            <div style="height: 100%; background: var(--income-gradient); border-radius: 3px; width: ${inflowPct}%"></div>
          </div>
          <!-- Outflow Bar -->
          <div style="height: 6px; background: var(--bg-input); border-radius: 3px; width: 100%; overflow: hidden;">
            <div style="height: 100%; background: var(--expense-gradient); border-radius: 3px; width: ${spentPct}%"></div>
          </div>
        </div>
        <span class="text-[9px] text-zinc-500 font-bold w-16 text-right">${symbol}${Math.round(mSpent)} spent</span>
      </div>
    `;
  });

  const forecastEl = document.getElementById('coachForecastContainer');
  if (forecastEl) {
    forecastEl.innerHTML = `
      <div class="flex flex-col gap-4" style="display: flex; flex-direction: column; gap: 16px;">
        ${forecastHtml}
        
        <div style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-color); border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px;">
          <h4 class="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest text-left" style="margin-bottom: 4px;">Last 4 Months Comparison</h4>
          <div class="flex flex-col gap-3" style="display: flex; flex-direction: column; gap: 12px;">
            ${histHtml}
          </div>
          <div style="display: flex; gap: 16px; justify-content: flex-start; margin-top: 4px;">
            <span class="legend-badge essential" style="font-size: 8px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;"><i class="w-2.5 h-2.5 text-emerald-500" data-lucide="circle"></i> Inflow Credits</span>
            <span class="legend-badge non-essential" style="font-size: 8px; display: inline-flex; align-items: center; gap: 6px; font-weight: 700;"><i class="w-2.5 h-2.5 text-rose-500" data-lucide="circle"></i> Outflow Debits</span>
          </div>
        </div>
      </div>
    `;
  }

  lucide.createIcons();
}

function drawWeekdayAveragesSvg() {
  const container = document.getElementById('trendBarChartContainer');
  if (!container) return;
  container.innerHTML = '';

  const { year: filterYear, month: filterMonth } = getActiveMonthFilterRange();

  // Initialize sums and counts for each weekday (0 = Sunday, 1 = Monday, etc.)
  const sums = Array(7).fill(0);
  const counts = Array(7).fill(0);

  // Group transactions in selected month by day of week
  state.transactions.forEach(t => {
    if (t.type === 'expense') {
      const d = new Date(t.date);
      if (d.getMonth() === filterMonth && d.getFullYear() === filterYear) {
        const dayOfWeek = d.getDay();
        sums[dayOfWeek] += t.amount;
        counts[dayOfWeek]++;
      }
    }
  });

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const averages = Array(7).fill(0);
  for (let i = 0; i < 7; i++) {
    averages[i] = counts[i] > 0 ? Math.round(sums[i] / counts[i]) : 0;
  }

  const maxVal = Math.max(10, ...averages) * 1.15;
  const symbol = state.currencySymbol || '₹';

  // We want to order them starting from Monday: Mon, Tue, Wed, Thu, Fri, Sat, Sun
  const mondayFirstOrder = [1, 2, 3, 4, 5, 6, 0];

  let barsHtml = '';
  mondayFirstOrder.forEach(dayIdx => {
    const avg = averages[dayIdx];
    const pct = Math.min(100, Math.round((avg / maxVal) * 100));
    const label = weekdays[dayIdx];

    // Check if it's the current weekday today
    const now = new Date();
    const isToday = now.getDay() === dayIdx;

    const labelStyle = isToday ? 'color: var(--accent-primary); font-weight: 800;' : 'color: #64748b;';

    barsHtml += `
      <div class="flex-1 flex flex-col items-center group cursor-pointer relative" style="flex: 1; display: flex; flex-direction: column; align-items: center;" title="${label}: Average ${symbol}${avg.toLocaleString()} spent per transaction">
        <div class="w-full bg-zinc-800 rounded-t-lg h-[90px] flex items-end overflow-hidden" style="width: 100%; border-top-left-radius: 8px; border-top-right-radius: 8px; height: 90px; display: flex; align-items: flex-end; overflow: hidden; background: var(--bg-input);">
          <div
            class="w-full rounded-t-md ${isToday ? 'current-day' : ''} transition-all"
            style="width: 100%; border-top-left-radius: 6px; border-top-right-radius: 6px; height: ${pct}%; background: ${isToday ? 'var(--accent-gradient)' : 'linear-gradient(135deg, #4b5563 0%, #374151 100%)'}; box-shadow: ${isToday ? '0 0 10px var(--accent-glow)' : 'none'}; transition: height 0.4s ease;"
          ></div>
        </div>
        <span class="text-[8px] font-bold mt-2" style="${labelStyle} font-size: 9px; margin-top: 8px;">${label}</span>
      </div>
    `;
  });

  container.innerHTML = `
    <div class="flex items-end justify-between h-[120px] px-4 relative mt-4" style="display: flex; align-items: flex-end; justify-content: space-between; height: 120px; padding: 0 16px; margin-top: 16px; gap: 8px;">
      ${barsHtml}
    </div>
  `;
}

function renderLedgerCategoryFilter() {
  const select = document.getElementById('categoryFilter');
  if (!select) return;

  const currentVal = select.value;
  select.innerHTML = '<option value="all">All Categories</option>';

  const categories = state.categories || ['Food', 'Transport', 'Shopping', 'Entertainment', 'Education', 'Health', 'Bills', 'Other'];
  categories.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.innerText = cat;
    select.appendChild(opt);
  });

  // Restore selected value if still valid
  if (categories.includes(currentVal)) {
    select.value = currentVal;
  } else {
    select.value = 'all';
    selectedCatFilter = 'all';
  }
}

// =============================================================
// PHASE 40: SAVINGS VAULT SYSTEM LOGIC
// =============================================================
function calculateRolloverSavings() {
  const previousMonthsMap = {};

  state.transactions.forEach(t => {
    if (!t.date) return;
    const d = new Date(t.date);
    const y = d.getFullYear();
    const m = d.getMonth();

    const today = new Date();
    // Strictly in a previous month relative to current calendar date
    if (y < today.getFullYear() || (y === today.getFullYear() && m < today.getMonth())) {
      const key = `${y}-${String(m + 1).padStart(2, '0')}`;
      if (!previousMonthsMap[key]) {
        previousMonthsMap[key] = { spent: 0, income: 0, hasLogs: true };
      }
      if (t.type === 'expense') {
        previousMonthsMap[key].spent += Number(t.amount || 0);
      } else if (t.type === 'income') {
        previousMonthsMap[key].income += Number(t.amount || 0);
      }
    }
  });

  let totalRolloverSavings = 0;
  const timelineData = [];

  Object.entries(previousMonthsMap).forEach(([monthKey, monthData]) => {
    if (monthData.hasLogs) {
      const [year, monthNum] = monthKey.split('-').map(Number);
      const dateObj = new Date(year, monthNum - 1, 1);
      const label = dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });

      // Clean logic using logged income if any, fallback to state.income
      const monthIncome = monthData.income > 0 ? monthData.income : state.income;
      const rollover = Math.max(0, monthIncome - monthData.spent);
      totalRolloverSavings += rollover;

      const targets = { Student: 0.30, Working: 0.50, Freelancer: 0.40, Other: 0.35 };
      const targetRate = targets[state.occupation || 'Student'] || 0.30;
      const savedRate = monthIncome > 0 ? (rollover / monthIncome) : 0;
      const metTarget = savedRate >= targetRate;

      timelineData.push({
        key: monthKey,
        label,
        spent: monthData.spent,
        saved: rollover,
        metTarget
      });
    }
  });

  timelineData.sort((a, b) => b.key.localeCompare(a.key));
  return { totalRolloverSavings, timelineData };
}

function renderSavingsTab() {
  const symbol = state.currencySymbol || '₹';
  const now = new Date();
  const income = getMonthlyIncome(now.getFullYear(), now.getMonth());

  // 1. Calculate historical rollover
  const { totalRolloverSavings, timelineData } = calculateRolloverSavings();

  // 2. Calculate current month discretionary savings
  const currentMonthExpenses = state.transactions.filter(t => {
    const d = new Date(t.date);
    return t.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const totalSpentCurrent = currentMonthExpenses.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const currentDiscretionarySavings = Math.max(0, income - totalSpentCurrent);

  // 3. Cumulative savings pool
  const totalSavingsPool = totalRolloverSavings + currentDiscretionarySavings;

  // 4. Update stats values in HTML
  const totalEl = document.getElementById('savingsVaultTotal');
  const sweptEl = document.getElementById('savingsVaultSwept');
  const activeEl = document.getElementById('savingsVaultActive');
  const rateEl = document.getElementById('savingsVaultRate');

  if (totalEl) totalEl.innerText = `${symbol}${totalSavingsPool.toLocaleString()}`;
  if (sweptEl) sweptEl.innerText = `${symbol}${totalRolloverSavings.toLocaleString()}`;
  if (activeEl) activeEl.innerText = `${symbol}${currentDiscretionarySavings.toLocaleString()}`;

  const rateTargets = { Student: '30%', Working: '50%', Freelancer: '40%', Other: '35%' };
  if (rateEl) rateEl.innerText = rateTargets[state.occupation || 'Student'] || '30%';

  // 5. Render Rollover History Timeline
  const historyContainer = document.getElementById('savingsHistoryContainer');
  if (historyContainer) {
    if (timelineData.length === 0) {
      historyContainer.innerHTML = `
        <div style="text-align: center; color: var(--text-muted); font-size: 10px; font-weight: 700; padding: 24px 10px; opacity: 0.7; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
          <i data-lucide="piggy-bank" class="w-6 h-6 opacity-45"></i>
          <span>No rollover sweeps recorded yet. Unutilized stipend will sweep here at month-end!</span>
        </div>
      `;
    } else {
      let timelineHtml = '';
      timelineData.forEach(item => {
        const metStr = item.metTarget ? 'Target Achieved' : 'Below Target';
        const badgeClass = item.metTarget ? '' : 'warning';
        const icon = item.metTarget ? 'shield-check' : 'piggy-bank';

        timelineHtml += `
          <div class="savings-timeline-item">
            <div class="savings-timeline-info">
              <div class="savings-timeline-badge ${badgeClass}">
                <i data-lucide="${icon}" class="w-3.5 h-3.5"></i>
              </div>
              <div class="savings-timeline-details">
                <span class="savings-timeline-month">${item.label}</span>
                <span class="savings-timeline-desc">${metStr} • Spent: ${symbol}${item.spent.toLocaleString()}</span>
              </div>
            </div>
            <span class="savings-timeline-amt">+${symbol}${item.saved.toLocaleString()}</span>
          </div>
        `;
      });
      historyContainer.innerHTML = timelineHtml;
    }
  }

  // 6. Savings Goals Dream Widget Rendering
  const activeWidget = document.getElementById('activeSavingsGoalWidget');
  if (activeWidget) {
    if (state.savingsGoalActive) {
      activeWidget.style.display = 'flex';

      const goalNameEl = document.getElementById('activeGoalName');
      const savedEl = document.getElementById('activeGoalSavedLabel');
      const pctEl = document.getElementById('activeGoalPctLabel');
      const fillEl = document.getElementById('activeGoalProgressFill');
      const badgeEl = document.getElementById('activeGoalStatusBadge');
      const tipEl = document.getElementById('activeGoalTip');

      if (goalNameEl) goalNameEl.innerText = state.savingsGoalTitle;

      const targetVal = state.savingsGoalTarget || 1;
      const pct = Math.min(100, Math.round((totalSavingsPool / targetVal) * 100));

      if (savedEl) savedEl.innerText = `${symbol}${totalSavingsPool.toLocaleString()} of ${symbol}${targetVal.toLocaleString()} saved`;
      if (pctEl) pctEl.innerText = `${pct}%`;
      if (fillEl) fillEl.style.width = `${pct}%`;

      if (badgeEl) {
        if (pct >= 100) {
          badgeEl.className = 'text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-pointer';
          badgeEl.innerHTML = `Dream Met! 🌟 <span style="font-size: 8px; font-weight: 700; text-decoration: underline; margin-left: 2px;">Reset</span>`;
          badgeEl.onclick = () => resetSavingsGoal();
        } else {
          badgeEl.className = 'text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 cursor-pointer';
          badgeEl.innerHTML = `Active 🎯 <span style="font-size: 8px; font-weight: 700; text-decoration: underline; margin-left: 2px;">Reset</span>`;
          badgeEl.onclick = () => resetSavingsGoal();
        }
      }

      if (tipEl) {
        if (pct >= 100) {
          tipEl.innerHTML = `🎉 <strong>Congratulations!</strong> You have successfully achieved your savings goal for "${state.savingsGoalTitle}"! Click reset above to lock a new savings dream!`;
          tipEl.style.color = '#10b981';
        } else {
          const remainingGoal = targetVal - totalSavingsPool;
          tipEl.innerHTML = `💡 You need <strong>${symbol}${remainingGoal.toLocaleString()}</strong> more to unlock your savings dream! You can do it!`;
          tipEl.style.color = 'var(--text-muted)';
        }
      }
    } else {
      activeWidget.style.display = 'none';
    }
  }

  // 7. Render MoM SVG Cumulative Savings Chart
  renderSavingsGrowthTrajectoryChart(timelineData, currentDiscretionarySavings);

  lucide.createIcons();
}

function resetSavingsGoal() {
  state.savingsGoalActive = false;
  state.savingsGoalTitle = '';
  state.savingsGoalTarget = 0;
  saveState();
  refreshDashboard();
  showToast('Savings dream goal reset successfully.', 'info');
}

function renderSavingsGrowthTrajectoryChart(timelineData, currentDiscretionarySavings) {
  const container = document.getElementById('savingsGrowthChartContainer');
  if (!container) return;

  container.innerHTML = '';

  const symbol = state.currencySymbol || '₹';
  const now = new Date();

  // Construct past 6 months data chronologically ascending (oldest to current month)
  const chartMonths = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    chartMonths.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short' }),
      year: d.getFullYear(),
      month: d.getMonth()
    });
  }

  // Calculate cumulative pool value at the end of each of these 6 months
  const chartPoints = [];
  let cumulativeSavings = 0;

  chartMonths.forEach((m, idx) => {
    const isCurrentMonth = (m.year === now.getFullYear() && m.month === now.getMonth());

    if (isCurrentMonth) {
      cumulativeSavings += currentDiscretionarySavings;
    } else {
      const match = timelineData.find(item => item.key === m.key);
      if (match) {
        cumulativeSavings += match.saved;
      }
    }

    chartPoints.push({
      label: m.label,
      cumulativeVal: cumulativeSavings,
      monthKey: m.key
    });
  });

  const width = 500;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 20;
  const paddingBottom = 48;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const maxVal = Math.max(1000, ...chartPoints.map(p => p.cumulativeVal)) * 1.15;
  const pointsCount = chartPoints.length;

  const getCoords = () => {
    return chartPoints.map((pt, idx) => {
      const x = paddingLeft + (idx / Math.max(1, pointsCount - 1)) * chartWidth;
      const y = height - paddingBottom - (pt.cumulativeVal / maxVal) * chartHeight;
      return { x, y, val: pt.cumulativeVal, label: pt.label };
    });
  };

  const coords = getCoords();

  // Bezier curve calculations
  const generateLinePath = (coords) => {
    if (coords.length === 0) return '';
    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const cpX1 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
      const cpY1 = coords[i - 1].y;
      const cpX2 = coords[i - 1].x + (coords[i].x - coords[i - 1].x) / 2;
      const cpY2 = coords[i].y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${coords[i].x} ${coords[i].y}`;
    }
    return path;
  };

  const generateAreaPath = (coords) => {
    const linePath = generateLinePath(coords);
    if (!linePath) return '';
    return `${linePath} L ${coords[coords.length - 1].x} ${height - paddingBottom} L ${coords[0].x} ${height - paddingBottom} Z`;
  };

  const linePath = generateLinePath(coords);
  const areaPath = generateAreaPath(coords);

  // Y Grid lines
  const yTicks = [0, maxVal * 0.25, maxVal * 0.5, maxVal * 0.75, maxVal].map(v => Math.round(v));
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const gridClr = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)';

  let gridlinesMarkup = '';
  yTicks.forEach(tick => {
    const y = height - paddingBottom - (tick / maxVal) * chartHeight;
    gridlinesMarkup += `
      <g style="opacity: 0.45; user-select: none;">
        <line x1="${paddingLeft}" y1="${y}" x2="${width - paddingRight}" y2="${y}" stroke="${gridClr}" stroke-width="1" stroke-dasharray="4 6" />
        <text x="${paddingLeft - 8}" y="${y + 4}" text-anchor="end" font-size="9" fill="#94a3b8" style="font-weight: 700; font-family: var(--font-family);">${symbol}${tick}</text>
      </g>
    `;
  });

  // X Axis Labels
  let xAxisMarkup = '';
  chartPoints.forEach((pt, idx) => {
    const x = paddingLeft + (idx / Math.max(1, pointsCount - 1)) * chartWidth;
    xAxisMarkup += `
      <text x="${x}" y="${height - 20}" text-anchor="middle" font-size="9" fill="#64748b" style="font-weight: 700; opacity: 0.8; font-family: var(--font-family);">${pt.label}</text>
    `;
  });

  // Circle point nodes
  let pointsMarkup = '';
  coords.forEach((pt, idx) => {
    pointsMarkup += `
      <circle
        cx="${pt.x}"
        cy="${pt.y}"
        r="5"
        fill="#6366f1"
        stroke="${isLight ? '#ffffff' : '#070a13'}"
        stroke-width="2"
        class="svg-line-point savings-chart-bar-hover"
        data-index="${idx}"
        data-val="${pt.val}"
        data-label="${pt.label}"
      />
    `;
  });

  container.innerHTML = `
    <div class="trend-chart-wrapper">
      <svg viewBox="0 0 ${width} ${height}" class="trend-chart-svg select-none">
        <defs>
          <linearGradient id="savingsAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366f1" stop-opacity="0.25" />
            <stop offset="100%" stop-color="#6366f1" stop-opacity="0.0" />
          </linearGradient>
        </defs>

        <!-- Grid lines -->
        ${gridlinesMarkup}

        <!-- Axis Labels -->
        ${xAxisMarkup}

        <!-- Area Gradient Fill -->
        ${areaPath ? `<path d="${areaPath}" fill="url(#savingsAreaGrad)" />` : ''}

        <!-- Bezier Line Curve -->
        ${linePath ? `<path d="${linePath}" fill="none" stroke="#6366f1" stroke-width="4" stroke-linecap="round" />` : ''}

        <!-- Circle point nodes -->
        ${pointsMarkup}
      </svg>

      <!-- Tooltip -->
      <div id="savingsChartTooltip" class="trend-chart-tooltip"></div>
    </div>
  `;

  // Attach hover event listeners to nodes
  const tooltip = document.getElementById('savingsChartTooltip');
  if (tooltip) {
    container.querySelectorAll('.svg-line-point').forEach(pt => {
      pt.addEventListener('mouseenter', (e) => {
        const val = parseFloat(e.target.dataset.val);
        const label = e.target.dataset.label;
        const cx = parseFloat(e.target.getAttribute('cx'));
        const cy = parseFloat(e.target.getAttribute('cy'));

        tooltip.innerHTML = `
          <span style="color: var(--text-secondary); font-weight: 700; display: block;">${label} End</span>
          <span style="display: flex; align-items: center; gap: 6px; margin-top: 2px; font-weight: 800;">
            <span style="width: 6px; height: 6px; border-radius: 50%; display: inline-block; background-color: #6366f1;"></span>
            Savings Pool: <strong style="color: var(--text-primary); font-weight: 800;">${symbol}${val.toLocaleString()}</strong>
          </span>
        `;

        tooltip.style.left = `${(cx / width) * 100}%`;
        tooltip.style.top = `${(cy / height) * 100}%`;
        tooltip.classList.add('visible');
      });

      pt.addEventListener('mouseleave', () => {
        tooltip.classList.remove('visible');
      });
    });
  }
}

function refreshDashboard() {
  const safeCall = (fn, label) => {
    try {
      fn();
    } catch (e) {
      console.error(`Error in rendering component "${label}":`, e);
    }
  };

  safeCall(updateDynamicCurrencySymbolsAcrossApp, 'updateDynamicCurrencySymbolsAcrossApp');
  safeCall(renderPredictiveDashboardBanner, 'renderPredictiveDashboardBanner');
  safeCall(renderDashboardStats, 'renderDashboardStats');
  safeCall(drawAllSvgCharts, 'drawAllSvgCharts');
  safeCall(renderFixedExpensesChecklist, 'renderFixedExpensesChecklist');
  safeCall(renderLedgerTable, 'renderLedgerTable');
  safeCall(renderCategoryBudgetsGrid, 'renderCategoryBudgetsGrid');
  safeCall(renderSidebarProfileCard, 'renderSidebarProfileCard');

  if (currentTab === 'insights') {
    safeCall(renderAICoachTab, 'renderAICoachTab');
    safeCall(renderSmartInsightsList, 'renderSmartInsightsList');
  } else if (currentTab === 'ledger') {
    safeCall(renderLedgerTable, 'renderLedgerTable');
  } else if (currentTab === 'budgets') {
    safeCall(renderCategoryBudgetsGrid, 'renderCategoryBudgetsGrid');
  } else if (currentTab === 'analytics') {
    safeCall(drawAllSvgCharts, 'drawAllSvgCharts');
  } else if (currentTab === 'savings') {
    safeCall(renderSavingsTab, 'renderSavingsTab');
  }
}
