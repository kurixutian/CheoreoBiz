// ================= FIREBASE INIT =================
const firebaseConfig = {
    apiKey: "AIzaSyBHoIPA427QslTdey1oh-rvHcmRZhn3YCs",
    authDomain: "cheoreobiz-ledger.firebaseapp.com",
    databaseURL: "https://cheoreobiz-ledger-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "cheoreobiz-ledger",
    storageBucket: "cheoreobiz-ledger.firebasestorage.app",
    messagingSenderId: "225796143144",
    appId: "1:225796143144:web:5c833edc28c7ec069ddd1d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// ================= GLOBAL STATE =================
let inventory = [];
let orders = [];
let bundles = [];
let cart = [];
let activityLog = [];
let stockHistory = [];
let bnplRecords = [];

let currentFilter = 'all';
let currentOrderTab = 'all';
let dashboardTimeframe = 'all';
let ordersPerPage = 10;
let currentOrdersPage = 1;

let draftBundleItems = [];
let editingBundleId = null;

// Internal Supplier Batch State
let currentApFilter = 'all';
let confirmProceedCallback = null;

// Persistent Transaction Edit Session State
let editingOrderId = null;

// Multi-Column Table Sort Stack Systems
// Each item in stack: { col: string, dir: 'asc'|'desc' }
let orderSortStack = [];
let bundleSortStack = [];
let bnplSortStack = [];
let inventorySortStack = [];

const itemNameInput = document.getElementById('item-name');
const customDropdown = document.getElementById('custom-dropdown');

// Global Layout Action Listeners
document.addEventListener('click', (e) => {
    const itemInput = document.getElementById('item-name');
    const itemDropdown = document.getElementById('custom-dropdown');
    if (itemInput && itemDropdown && !itemInput.contains(e.target) && !itemDropdown.contains(e.target)) {
        itemDropdown.classList.add('hidden');
    }

    const custInput = document.getElementById('pos-customer');
    const custDropdown = document.getElementById('customer-dropdown');
    if (custInput && custDropdown && !custInput.contains(e.target) && !custDropdown.contains(e.target)) {
        custDropdown.classList.add('hidden');
    }

    const bItemInput = document.getElementById('batch-item-search');
    const bItemDropdown = document.getElementById('batch-item-dropdown');
    if (bItemInput && bItemDropdown && !bItemInput.contains(e.target) && !bItemDropdown.contains(e.target)) {
        bItemDropdown.classList.add('hidden');
    }

    const sInput = document.getElementById('bnpl-supplier');
    const sDropdown = document.getElementById('supplier-dropdown');
    if (sInput && sDropdown && !sInput.contains(e.target) && !sDropdown.contains(e.target)) {
        sDropdown.classList.add('hidden');
    }

    // Modal Click-outside Close Logic for Calculator
    const calcPopup = document.getElementById('calculator-popup');
    const calcWrapper = document.getElementById('calculator-wrapper');
    if (calcPopup && !calcPopup.classList.contains('hidden') && calcWrapper && !calcWrapper.contains(e.target) && !e.target.closest('button[title="Quick Calculator"]')) {
        toggleCalculator(false);
    }
});

// ESC Key Listener to Close Active Popups
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeCartModal();
        toggleCalculator(false);
    }
});

// Configure Confirmation Modal Callback Triggers
document.addEventListener('DOMContentLoaded', () => {
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    const proceedBtn = document.getElementById('confirm-proceed-btn');
    
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeModal('confirmation-popup-modal');
            confirmProceedCallback = null;
        });
    }
    if (proceedBtn) {
        proceedBtn.addEventListener('click', () => {
            if (confirmProceedCallback) confirmProceedCallback();
            closeModal('confirmation-popup-modal');
            confirmProceedCallback = null;
        });
    }
});

// Universal Backdrop Close Utility for Standard Modals
function closeModalOnBackdrop(e, modalId) {
    if (e.target === e.currentTarget) {
        closeModal(modalId);
    }
}

// Show Custom Confirmation Popup UI
function requestUserConfirmation(title, message, proceedText, callback) {
    document.getElementById('confirm-modal-title').innerText = title;
    document.getElementById('confirm-modal-message').innerText = message;
    
    const proceedBtn = document.getElementById('confirm-proceed-btn');
    proceedBtn.innerText = proceedText;
    if (proceedText === 'Clear' || proceedText === 'Delete') {
        proceedBtn.className = "flex-1 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl transition-colors btn-transition";
    } else {
        proceedBtn.className = "flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-3 rounded-xl transition-colors btn-transition";
    }
    
    confirmProceedCallback = callback;
    openModal('confirmation-popup-modal');
}

// Set Default Date Inputs
function initDateDefaults() {
    const pDateInput = document.getElementById('bnpl-purchasedate');
    const dDateInput = document.getElementById('bnpl-duedate');
    const today = new Date().toISOString().split('T')[0];
    if (pDateInput) pDateInput.value = today;
    if (dDateInput) dDateInput.value = today;
}

// ================= UTILITIES =================
function initIcons() { if (window.lucide) lucide.createIcons(); }

function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    
    const bgClass = type === 'success' ? 'bg-emerald-500' : (type === 'error' ? 'bg-rose-500' : (type === 'info' ? 'bg-indigo-500' : 'bg-slate-800'));
    const icon = type === 'success' ? 'check-circle' : (type === 'error' ? 'alert-circle' : 'info');
    
    toast.className = `flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl shadow-${type === 'success' ? 'emerald' : 'rose'}-500/20 text-sm font-bold text-white transition-all duration-300 transform translate-y-[-20px] opacity-0 scale-95 ${bgClass} border border-white/10 backdrop-blur-md z-[100]`;
    toast.innerHTML = `<i data-lucide="${icon}" class="w-5 h-5"></i><span>${message}</span>`;
    
    container.appendChild(toast);
    initIcons();
    
    requestAnimationFrame(() => toast.classList.remove('translate-y-[-20px]', 'opacity-0', 'scale-95'));
    setTimeout(() => {
        toast.classList.add('translate-y-[-20px]', 'opacity-0', 'scale-95');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Global Modal Animation Handler Methods
function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        const inner = modal.querySelector('div');
        if (inner) inner.classList.remove('scale-95');
    }, 10);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('opacity-0');
    const inner = modal.querySelector('div');
    if (inner) inner.classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function logActivity(type, message) {
    const timestamp = Date.now();
    activityLog.unshift({
        id: 'act-' + timestamp,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type, message, timestamp
    });
    if (activityLog.length > 50) activityLog.pop();
}

function getOrderItems(order) {
    if (order.items && Array.isArray(order.items)) return order.items;
    return [{
        id: order.itemId || "legacy-id",
        name: order.itemName || "Unknown Product",
        qty: order.orderQty || 1,
        sellPrice: (order.totalRevenue / (order.orderQty || 1)) || 0,
        unitCost: (order.totalCost / (order.orderQty || 1)) || 0,
        effectiveTotal: order.totalRevenue || 0,
        totalCost: order.totalCost || 0,
        totalProfit: order.totalProfit || 0
    }];
}

// ================= FLOATING CALCULATOR ENGINE =================
function toggleCalculator(show) {
    const popup = document.getElementById('calculator-popup');
    const wrapper = document.getElementById('calculator-wrapper');
    if (!popup || !wrapper) return;
    if (show) {
        popup.classList.remove('hidden');
        setTimeout(() => {
            popup.classList.remove('opacity-0');
            wrapper.classList.remove('scale-95');
        }, 10);
    } else {
        popup.classList.add('opacity-0');
        wrapper.classList.add('scale-95');
        setTimeout(() => popup.classList.add('hidden'), 200);
    }
}

function pressCalc(val) {
    const screen = document.getElementById('calc-screen');
    if (!screen) return;
    if (val === 'C') { screen.value = '0'; }
    else if (val === '=') {
        try {
            let expr = screen.value.replace(/[^0-9\+\-\*\.\/]/g, '');
            if (!expr) return;
            let result = new Function(`return (${expr})`)();
            screen.value = Number(result).toString();
        } catch (e) { screen.value = 'Error'; }
    } else {
        if (screen.value === '0' || screen.value === 'Error') screen.value = val;
        else screen.value += val;
    }
}

// ================= CART MODAL ENGINE =================
function openCartModal() {
    if (window.innerWidth >= 1280) return; // Desktop uses static column
    const modal = document.getElementById('cartModal');
    const wrapper = document.getElementById('cart-wrapper');
    if (!modal || !wrapper) return;
    
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        wrapper.classList.remove('scale-95');
    }, 10);
}

function closeCartModal() {
    if (window.innerWidth >= 1280) return;
    const modal = document.getElementById('cartModal');
    const wrapper = document.getElementById('cart-wrapper');
    if (!modal || !wrapper) return;
    
    modal.classList.add('opacity-0');
    wrapper.classList.add('scale-95');
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function closeCartOnBackdrop(e) {
    if (window.innerWidth >= 1280) return;
    if (e.target === e.currentTarget) {
        closeCartModal();
    }
}

// ================= AUTHENTICATION =================
auth.onAuthStateChanged(user => {
    const authScreen = document.getElementById('auth-screen');
    const appWrapper = document.getElementById('app-wrapper');
    
    if (user) {
        authScreen.classList.add('hidden');
        appWrapper.classList.remove('hidden');
        appWrapper.classList.add('flex');
        startRealtimeSync();
        initTheme();
        initDateDefaults();
    } else {
        authScreen.classList.remove('hidden');
        appWrapper.classList.add('hidden');
        appWrapper.classList.remove('flex');
    }
    initIcons();
});

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    auth.signInWithEmailAndPassword(email, password).then(() => showToast('Signed in successfully', 'success')).catch(() => document.getElementById('auth-error').classList.remove('hidden'));
}

function handleLogout() {
    auth.signOut();
}

// ================= DATABASE WRAPPERS =================
function saveInventory() { db.ref('inventory').set(inventory); }
function saveOrders() { db.ref('orders').set(orders); }
function saveBundles() { db.ref('bundles').set(bundles); }
function saveActivityLog() { db.ref('activityLog').set(activityLog); }
function saveStockHistory() { db.ref('stockHistory').set(stockHistory); }
function saveBnpl() { db.ref('bnplRecords').set(bnplRecords); }

// ================= FIREBASE REALTIME SYNC =================
function startRealtimeSync() {
    db.ref('inventory').on('value', snapshot => { 
        const data = snapshot.val(); 
        inventory = data ? Object.values(data) : []; 
        renderUI(); 
    });
    db.ref('orders').on('value', snapshot => { 
        const data = snapshot.val(); 
        orders = data ? Object.values(data) : []; 
        orders.forEach(o => { if(!o.status) o.status = 'active'; }); 
        renderUI(); 
    });
    
    db.ref('bundles').on('value', snapshot => { 
        const data = snapshot.val(); 
        bundles = data ? Object.values(data) : []; 
        renderBundlesTable(); 
        renderCart(); 
    });
    
    db.ref('bnplRecords').on('value', snapshot => {
        const data = snapshot.val();
        bnplRecords = data ? Object.values(data) : [];
        renderBnplUI();
    });

    db.ref('activityLog').on('value', snapshot => { 
        const data = snapshot.val(); 
        activityLog = data ? Object.values(data) : []; 
        renderActivityLog(); 
    });

    db.ref('stockHistory').on('value', snapshot => { 
        const data = snapshot.val(); 
        stockHistory = data ? Object.values(data) : []; 
        if(document.getElementById('stock-history-modal') && !document.getElementById('stock-history-modal').classList.contains('hidden')) { 
            renderStockHistory(); 
        } 
        renderSummary(); 
        renderBatchMatrixTable();
    });
}

// ================= RENDER INTERACTION PIPELINES =================
function renderUI() {
    renderInventoryTable();
    renderOrdersTable();
    renderSummary();
    renderPOSCatalog();
    populateBundleItemSelect();
    renderActivityLog();
    renderBundlesTable(); 
    renderBnplUI();
    initIcons();
}

// ================= THEME & NAVIGATION =================
function initTheme() {
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
    updateThemeIcons();
}

function confirmClearActivityLog() {
    requestUserConfirmation("Clear Activity Log", "Are you sure you want to permanently clear the activity records?", "Clear", () => {
        activityLog = [];
        saveActivityLog();
        renderActivityLog();
        showToast("Activity history cleared", "info");
    });
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) { 
        html.classList.remove('dark'); 
        localStorage.setItem('theme', 'light'); 
    } else { 
        html.classList.add('dark'); 
        localStorage.setItem('theme', 'dark'); 
    }
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    const iconName = isDark ? 'sun' : 'moon';
    const deskIcon = document.getElementById('theme-icon');
    if (deskIcon) { 
        deskIcon.setAttribute('data-lucide', iconName); 
        lucide.createIcons({attrs:{class:['w-4','h-4']}}); 
    }
}

function switchTab(tabId) {
    document.querySelectorAll('[data-tab-content]').forEach(sec => {
        if(sec.dataset.tabContent === tabId) { 
            sec.classList.remove('hidden'); 
            sec.classList.add('block', 'animate-fade-in'); 
        } else { 
            sec.classList.add('hidden'); 
            sec.classList.remove('block', 'animate-fade-in'); 
        }
    });
    document.querySelectorAll('[data-tab-btn]').forEach(btn => {
        if (btn.dataset.tabBtn === tabId) { 
            btn.classList.add('tab-active'); 
            btn.classList.remove('text-slate-500', 'hover:bg-slate-100', 'dark:hover:bg-slate-800'); 
        } else { 
            btn.classList.remove('tab-active'); 
            btn.classList.add('text-slate-500', 'hover:bg-slate-100', 'dark:hover:bg-slate-800'); 
        }
    });
    if (tabId === 'orders') { renderPOSCatalog(); renderOrdersTable(); }
    if (tabId === 'bundles') renderBundlesTable(); 
    if (tabId === 'bnpl') renderBnplUI();
    if (tabId === 'inventory') renderInventoryTable();
}

// ================= DASHBOARD LOGIC =================
function setDashboardTimeframe(tf) {
    dashboardTimeframe = tf;
    document.querySelectorAll('[data-timeframe]').forEach(btn => {
        if(btn.dataset.timeframe === tf) { 
            btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); 
            btn.classList.remove('text-slate-500'); 
        } else { 
            btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); 
            btn.classList.add('text-slate-500'); 
        }
    });
    renderSummary();
}

function isWithinTimeframe(dateStr, tf) {
    if (tf === 'all') return true;
    if (!dateStr || dateStr === 'N/A') return false;
    const date = new Date(dateStr);
    if (isNaN(date)) return true;
    const now = new Date();
    if (tf === 'today') return date.toDateString() === now.toDateString();
    if (tf === 'week') {
        const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
        now.setHours(23,59,59,999);
        const lastDay = new Date(now.setDate(now.getDate() - now.getDay() + 6));
        return date >= firstDay && date <= lastDay;
    }
    if (tf === 'month') return date.getMonth() === new Date().getMonth() && date.getFullYear() === new Date().getFullYear();
    return true;
}

function openFinancialModal(type) {
    const list = document.getElementById('details-modal-list');
    const head = document.getElementById('details-modal-head');
    if (!list || !head) return;
    list.innerHTML = '';
    let title = ''; let icon = '';

    if(type === 'revenue' || type === 'profit') {
        let timeFilteredOrders = orders.filter(o => o.status !== 'cancelled' && isWithinTimeframe(o.date, dashboardTimeframe));
        
        if (type === 'profit') {
            timeFilteredOrders = timeFilteredOrders.filter(o => o.isPaid === true && o.isReceived === true);
        }

        title = type === 'revenue' ? `Gross Sales Details (${dashboardTimeframe})` : `Net Profit Details (${dashboardTimeframe})`;
        icon = type === 'revenue' ? 'trending-up' : 'piggy-bank';
        
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Date & Receipt ID</th>
                <th class="py-3 px-3 sm:px-4">Baskets Line Items</th>
                <th class="py-3 px-3 sm:px-4 text-right">Revenue</th>
                <th class="py-3 px-3 sm:px-4 text-right">Profit</th>
            </tr>
        `;

        if(timeFilteredOrders.length === 0) list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold">No data matching filters for this timeframe.</td></tr>`;
        timeFilteredOrders.forEach(o => {
            const lines = getOrderItems(o).map(i => `${i.qty}x ${i.name}`).join('<br>');
            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5"><div class="font-bold text-slate-900 dark:text-white">${o.id}</div><div class="text-[10px] text-slate-500 mt-0.5">${o.date}</div></td>
                    <td class="py-3 px-3 sm:px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 leading-normal">${lines}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400">₱ ${o.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-emerald-600 dark:text-emerald-400">₱ ${o.totalProfit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                </tr>
            `;
        });
    } else if (type === 'outstanding') {
        title = 'Outstanding Balances'; icon = 'clock-4';
        
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Customer & Receipt ID</th>
                <th class="py-3 px-3 sm:px-4 text-right">Total Owed</th>
                <th class="py-3 px-3 sm:px-4 text-right">Amount Paid</th>
                <th class="py-3 px-3 sm:px-4 text-right text-rose-500">Balance Due</th>
            </tr>
        `;

        let unpaid = orders.filter(o => o.status !== 'cancelled' && (o.totalRevenue - (o.amountPaid || 0)) > 0);
        if(unpaid.length === 0) list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold">No outstanding balances.</td></tr>`;
        unpaid.forEach(o => {
            const due = o.totalRevenue - (o.amountPaid || 0);
            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5"><div class="font-bold text-slate-900 dark:text-white">${o.customerName}</div><div class="text-[10px] text-slate-500 mt-0.5">${o.id}</div></td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-slate-700 dark:text-slate-300">₱ ${o.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-emerald-600 dark:text-emerald-400">₱ ${(o.amountPaid||0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-rose-600 dark:text-rose-400">₱ ${due.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                </tr>
            `;
        });
    } else if (type === 'inventory_value') {
        title = 'Inventory Value Breakdown'; icon = 'layers';
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Product Name</th>
                <th class="py-3 px-3 sm:px-4 text-center">In Stock</th>
                <th class="py-3 px-3 sm:px-4 text-right">Cost Price</th>
                <th class="py-3 px-3 sm:px-4 text-right text-blue-500">Total Value</th>
            </tr>
        `;
        let validStock = inventory.filter(i => i.stockQty > 0);
        if(validStock.length === 0) list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold">No active inventory value.</td></tr>`;
        validStock.forEach(i => {
            const value = i.stockQty * (i.unitCost || 0);
            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5 font-bold text-slate-900 dark:text-white">${i.name}</td>
                    <td class="py-3 px-3 sm:px-4 text-center font-bold text-slate-700 dark:text-slate-300">${i.stockQty}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-semibold text-slate-500">₱ ${(i.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-blue-600 dark:text-blue-400">₱ ${value.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                </tr>
            `;
        });
    } else if (type === 'expected_sales' || type === 'expected_profit') {
        title = type === 'expected_sales' ? 'Expected Sales Breakdown' : 'Expected Profit Breakdown';
        icon = type === 'expected_sales' ? 'tag' : 'trending-up';
        let colColor = type === 'expected_sales' ? 'text-indigo-500' : 'text-emerald-500';
        let valColor = type === 'expected_sales' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400';
        
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Product Name</th>
                <th class="py-3 px-3 sm:px-4 text-center">In Stock</th>
                <th class="py-3 px-3 sm:px-4 text-right">${type === 'expected_sales' ? 'Selling Price' : 'Profit/Item'}</th>
                <th class="py-3 px-3 sm:px-4 text-right ${colColor}">Expected Total</th>
            </tr>
        `;
        let validStock = inventory.filter(i => i.stockQty > 0);
        if(validStock.length === 0) list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold">No active inventory.</td></tr>`;
        validStock.forEach(i => {
            let unitVal = type === 'expected_sales' ? (i.sellPrice || 0) : ((i.sellPrice || 0) - (i.unitCost || 0));
            let expectedTotal = i.stockQty * unitVal;
            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5 font-bold text-slate-900 dark:text-white">${i.name}</td>
                    <td class="py-3 px-3 sm:px-4 text-center font-bold text-slate-700 dark:text-slate-300">${i.stockQty}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-semibold text-slate-500">₱ ${unitVal.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black ${valColor}">₱ ${expectedTotal.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                </tr>
            `;
        });
    } else if (type === 'money_spent') {
        title = 'Money Spent (Purchase History)'; icon = 'shopping-bag';
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Date</th>
                <th class="py-3 px-3 sm:px-4">Product Name</th>
                <th class="py-3 px-3 sm:px-4 text-center">Qty Purchased</th>
                <th class="py-3 px-3 sm:px-4 text-right text-amber-500">Total Spent</th>
            </tr>
        `;
        if(stockHistory.length === 0) list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold">No purchase history.</td></tr>`;
        stockHistory.forEach(sh => {
            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5 text-[11px] font-bold text-slate-500">${sh.date}</td>
                    <td class="py-3 px-3 sm:px-4 font-bold text-slate-900 dark:text-white">${sh.productName}</td>
                    <td class="py-3 px-3 sm:px-4 text-center font-bold text-slate-700 dark:text-slate-300">${sh.qtyAdded}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-amber-600 dark:text-amber-400">₱ ${sh.totalCost.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                </tr>
            `;
        });
    }

    document.getElementById('details-modal-title').innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 text-indigo-500"></i> ${title}`;
    openModal('details-modal');
    initIcons();
}

function openDashboardModal(filterType) {
    let filtered = [...inventory];
    let title = "Total Products"; let icon = "box";
    
    if(filterType === 'low') {
        filtered = filtered.filter(i => i.stockQty <= 3 && i.stockQty > 0);
        title = "Low Stock Items"; icon = "alert-triangle";
    } else if(filterType === 'out') {
        filtered = filtered.filter(i => i.stockQty <= 0);
        title = "Out of Stock Items"; icon = "x-circle";
    }
    
    const list = document.getElementById('dash-modal-list'); 
    if(!list) return;
    list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="3" class="py-12 text-center text-slate-400 font-bold"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>No products to show.</td></tr>`;
    } else {
        filtered.forEach(item => {
            let badge = item.stockQty <= 0 ? `<span class="inline-block bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Out of Stock</span>`
                : (item.stockQty <= 3 ? `<span class="inline-block bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">Low Stock</span>` : `<span class="inline-block bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">In Stock</span>`);

            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5 font-bold text-slate-900 dark:text-white">${item.name}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400">₱ ${(item.sellPrice || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                    <td class="py-3 px-4 sm:px-5 text-right flex items-center justify-end gap-2"><span class="font-black text-sm">${item.stockQty}</span>${badge}</td>
                </tr>
            `;
        });
    }

    document.getElementById('dash-modal-title').innerHTML = `<i data-lucide="${icon}" class="w-5 h-5 text-indigo-500"></i> ${title}`;
    openModal('dash-products-modal'); initIcons();
}

function renderActivityLog() {
    const container = document.getElementById('activity-log-container');
    if (!container) return; container.innerHTML = '';

    if (activityLog.length === 0) {
        container.innerHTML = `<div class="py-6 text-center text-slate-400 text-xs font-bold"><i data-lucide="history" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>No recent activity.</div>`;
        initIcons(); return;
    }

    activityLog.slice(0, 15).forEach(act => {
        let icon = 'info', iconColor = 'text-slate-500 bg-slate-100 dark:bg-slate-800';
        if(act.type === 'stock_in') { icon = 'package-plus'; iconColor = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-500/20'; }
        else if(act.type === 'sale') { icon = 'shopping-cart'; iconColor = 'text-indigo-500 bg-indigo-50 dark:bg-indigo-500/20'; }
        else if(act.type === 'stock_adj') { icon = 'settings-2'; iconColor = 'text-amber-500 bg-amber-50 dark:bg-amber-500/20'; }

        container.innerHTML += `
            <div class="relative flex items-center gap-4">
                <div class="z-10 w-8 h-8 flex items-center justify-center rounded-full shadow-sm flex-shrink-0 ${iconColor} border border-slate-200/50 dark:border-slate-700/50"><i data-lucide="${icon}" class="w-4 h-4"></i></div>
                <div class="flex-1 min-w-0 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">${act.message}</p>
                    <p class="text-[10px] font-black text-slate-500 uppercase tracking-wide mt-0.5">${act.date}</p>
                </div>
            </div>
        `;
    });
    initIcons();
}

// ================= UNIVERSAL MULTI-COLUMN SORT HELPER =================
function handleMultiColumnSortToggle(stack, col, isShift) {
    const existingIndex = stack.findIndex(item => item.col === col);
    if (isShift) {
        if (existingIndex < 0) {
            stack.push({ col, dir: 'asc' });
        } else if (stack[existingIndex].dir === 'asc') {
            stack[existingIndex].dir = 'desc';
        } else {
            stack.splice(existingIndex, 1);
        }
    } else {
        if (existingIndex === 0 && stack.length === 1) {
            if (stack[0].dir === 'asc') {
                stack[0].dir = 'desc';
            } else {
                stack.length = 0;
            }
        } else {
            stack.length = 0;
            stack.push({ col, dir: 'asc' });
        }
    }
}

function updateSortHeaderIcons(prefix, stack, columns) {
    columns.forEach(col => {
        const el = document.getElementById(`${prefix}-${col}`);
        if (!el) return;
        const stackIndex = stack.findIndex(item => item.col === col);
        if (stackIndex >= 0) {
            const item = stack[stackIndex];
            const arrow = item.dir === 'asc' ? '↑' : '↓';
            const badge = stack.length > 1 ? `<span class="sort-priority-badge">${stackIndex + 1}</span>` : '';
            el.innerHTML = ` ${arrow}${badge}`;
        } else {
            el.innerText = '';
        }
    });
}

// ================= INVENTORY LOGIC =================
function toggleInventorySort(column, event) {
    const isShift = event && event.shiftKey;
    handleMultiColumnSortToggle(inventorySortStack, column, isShift);
    updateSortHeaderIcons('sort-icon-inv', inventorySortStack, ['name', 'stock', 'cpp', 'price', 'profit', 'margin', 'value']);
    renderInventoryTable();
}

function showDropdown() {
    if (!itemNameInput || !customDropdown) return;
    const filter = itemNameInput.value.trim().toLowerCase();
    customDropdown.innerHTML = '';
    if (!filter) { customDropdown.classList.add('hidden'); return; }

    const filteredItems = inventory.filter(item => item.name.toLowerCase().includes(filter));
    if (filteredItems.length > 0) {
        filteredItems.forEach(item => {
            const row = document.createElement('div');
            row.className = "px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-bold flex justify-between items-center transition-colors group";
            row.innerHTML = `<span class="group-hover:text-indigo-600 dark:group-hover:text-indigo-400">${item.name}</span><span class="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-md group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900">₱ ${(item.sellPrice || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;
            row.addEventListener('mousedown', () => {
                itemNameInput.value = item.name;
                document.getElementById('sell-price').value = item.sellPrice || 0;
                customDropdown.classList.add('hidden');
            });
            customDropdown.appendChild(row);
        });
        customDropdown.classList.remove('hidden');
    } else { customDropdown.classList.add('hidden'); }
}

if(itemNameInput) {
    itemNameInput.addEventListener('focus', showDropdown);
    itemNameInput.addEventListener('input', showDropdown);
}

function handleStockSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('item-name').value.trim();
    const sellPrice = parseFloat(document.getElementById('sell-price').value);
    const fileInput = document.getElementById('item-image-file');

    const recMin = parseFloat(document.getElementById('stock-rec-cpp-min')?.value) || 0;
    const recMax = parseFloat(document.getElementById('stock-rec-cpp-max')?.value) || 0;

    if (fileInput && fileInput.files && fileInput.files[0]) {
        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const max_size = 300; 
                let width = img.width, height = img.height;
                if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
                else { if (height > max_size) { width *= max_size / height; height = max_size; } }
                canvas.width = width; canvas.height = height;
                canvas.getContext('2d').drawImage(img, 0, 0, width, height);
                commitNewProduct(name, sellPrice, canvas.toDataURL('image/jpeg', 0.8), recMin, recMax);
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else commitNewProduct(name, sellPrice, null, recMin, recMax);
}

function commitNewProduct(name, sellPrice, base64Image, recMin = 0, recMax = 0) {
    const existingIndex = inventory.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingIndex > -1) {
        showToast("Product is already registered. Please edit details below instead.", "error");
    } else {
        inventory.push({ 
            id: Date.now().toString(), 
            name, 
            unitCost: 0, 
            sellPrice, 
            stockQty: 0, 
            image: base64Image,
            recCppMin: recMin,
            recCppMax: recMax
        });
        logActivity('stock_adj', `Registered new empty product container: ${name}`);
        showToast("New product container registered", "success");
    }
    saveInventory();
    saveActivityLog();
    
    document.getElementById('stock-form').reset();
    if(customDropdown) customDropdown.classList.add('hidden');
}

function openStockHistoryModal() {
    renderStockHistory();
    openModal('stock-history-modal');
}

function renderStockHistory() {
    const list = document.getElementById('stock-history-list');
    if(!list) return;
    list.innerHTML = '';
    
    if(stockHistory.length === 0) {
        list.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-slate-400 font-bold"><i data-lucide="history" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>No stock history records.</td></tr>`;
        initIcons(); return;
    }

    stockHistory.forEach(sh => {
        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 sm:px-5 text-[11px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">${sh.date}</td>
                <td class="py-3 px-3 sm:px-4 font-bold text-slate-900 dark:text-white">${sh.productName}</td>
                <td class="py-3 px-3 sm:px-4 text-center font-black text-indigo-600 dark:text-indigo-400">+${sh.qtyAdded}</td>
                <td class="py-3 px-3 sm:px-4 text-right font-semibold text-slate-600 dark:text-slate-300">₱ ${(sh.costPerItem || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="py-3 px-4 sm:px-5 text-right font-black text-amber-600 dark:text-amber-400">₱ ${(sh.totalCost || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            </tr>
        `;
    });
}

function editStock(id) {
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    document.getElementById('edit-stock-id').value = item.id;
    document.getElementById('edit-stock-name').value = item.name;
    document.getElementById('edit-stock-qty').value = item.stockQty;
    document.getElementById('edit-stock-cost').value = (item.unitCost || 0).toFixed(2);
    document.getElementById('edit-stock-price').value = item.sellPrice || 0;
    
    const minVal = item.recCppMin || 0;
    const maxVal = item.recCppMax || 0;
    if(document.getElementById('edit-stock-rec-min')) document.getElementById('edit-stock-rec-min').value = minVal || '';
    if(document.getElementById('edit-stock-rec-max')) document.getElementById('edit-stock-rec-max').value = maxVal || '';
    if(document.getElementById('edit-rec-cpp-display')) document.getElementById('edit-rec-cpp-display').innerText = `₱${minVal.toFixed(2)} - ₱${maxVal.toFixed(2)}`;
    
    document.getElementById('edit-stock-image-file').value = ''; 
    document.getElementById('edit-stock-adj-qty').value = ''; 
    openModal('stock-modal');
}

function saveStockEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-stock-id').value;
    const name = document.getElementById('edit-stock-name').value.trim();
    const price = parseFloat(document.getElementById('edit-stock-price').value);
    const fileInput = document.getElementById('edit-stock-image-file');
    
    const adjType = document.getElementById('edit-stock-adj-type').value;
    const adjQty = parseInt(document.getElementById('edit-stock-adj-qty').value) || 0;

    const item = inventory.find(i => i.id === id);
    if (item) {
        let requiresOrderUpdate = false;
        if(item.name !== name) {
            orders.forEach(o => { if(o.itemName === item.name) o.itemName = name; });
            requiresOrderUpdate = true;
        }

        if (adjQty !== 0) {
            item.stockQty += adjQty;
            logActivity('stock_adj', `Manually adjusted stock level of ${name} by ${adjQty > 0 ? '+'+adjQty : adjQty} (${adjType})`);
        }

        item.name = name; 
        item.sellPrice = price;
        
        const completeSave = () => {
            saveInventory();
            saveActivityLog();
            if(requiresOrderUpdate) saveOrders();
            showToast("Product updated", "success"); 
            closeModal('stock-modal');
        };

        if (fileInput && fileInput.files && fileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let w = img.width, h = img.height; const max_size = 300;
                    if (w > h) { if (w > max_size) { h *= max_size / w; w = max_size; } } else { if (h > max_size) { w *= max_size / h; h = max_size; } }
                    canvas.width = w; canvas.height = h; canvas.getContext('2d').drawImage(img, 0, 0, w, h);
                    item.image = canvas.toDataURL('image/jpeg', 0.8); completeSave();
                }
                img.src = event.target.result;
            }
            reader.readAsDataURL(fileInput.files[0]);
        } else completeSave();
    }
}

function getSortedInventory() {
    let sorted = [...inventory];
    if (inventorySortStack.length > 0) {
        sorted.sort((a, b) => {
            for (let sortObj of inventorySortStack) {
                const { col, dir } = sortObj;
                const dirMod = dir === 'asc' ? 1 : -1;
                let diff = 0;
                
                if (col === 'name') diff = a.name.localeCompare(b.name);
                else if (col === 'stock') diff = (a.stockQty || 0) - (b.stockQty || 0);
                else if (col === 'cpp') diff = (a.unitCost || 0) - (b.unitCost || 0);
                else if (col === 'price') diff = (a.sellPrice || 0) - (b.sellPrice || 0);
                else if (col === 'profit') diff = ((a.sellPrice || 0) - (a.unitCost || 0)) - ((b.sellPrice || 0) - (b.unitCost || 0));
                else if (col === 'margin') {
                    const mA = a.sellPrice > 0 ? ((a.sellPrice - (a.unitCost || 0)) / a.sellPrice) : 0;
                    const mB = b.sellPrice > 0 ? ((b.sellPrice - (b.unitCost || 0)) / b.sellPrice) : 0;
                    diff = mA - mB;
                }
                else if (col === 'value') diff = ((a.stockQty || 0) * (a.unitCost || 0)) - ((b.stockQty || 0) * (b.unitCost || 0));

                if (diff !== 0) return diff * dirMod;
            }
            return 0;
        });
    }
    return sorted;
}

function renderInventoryTable() {
    const list = document.getElementById('inventory-list'); 
    if(!list) return; list.innerHTML = '';
    
    const displayList = getSortedInventory();
    
    if(displayList.length === 0) { 
        list.innerHTML = `<tr><td colspan="8" class="py-12 text-center text-slate-400"><i data-lucide="package-open" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm font-bold">Stock room is empty</p></td></tr>`; 
        initIcons(); return; 
    }
    
    displayList.forEach(item => {
        let detailBlock = '';
        if (item.image) detailBlock = `<div class="flex items-center gap-3"><img src="${item.image}" class="w-10 h-10 object-cover rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0"><div class="flex flex-col"><span class="font-bold text-slate-900 dark:text-white max-w-[150px] truncate">${item.name}</span></div></div>`;
        else detailBlock = `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm flex-shrink-0 border border-indigo-100 dark:border-indigo-800/50">${item.name.substring(0,2).toUpperCase()}</div><div class="flex flex-col"><span class="font-bold text-slate-900 dark:text-white max-w-[150px] truncate">${item.name}</span></div></div>`;

        const averageCPP = item.unitCost || 0;
        const sellingPrice = item.sellPrice || 0;
        const profitPerPiece = sellingPrice - averageCPP;
        const profitMargin = sellingPrice > 0 ? (profitPerPiece / sellingPrice) * 100 : 0;
        const totalValue = item.stockQty * averageCPP;

        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer";
        
        row.onclick = (e) => {
            if (e.target.closest('.action-prevent-trigger') || e.target.closest('button')) return;
            editStock(item.id);
        };

        row.innerHTML = `
            <td class="py-3 px-4 sm:px-5 whitespace-nowrap">
                ${detailBlock}
            </td>
            <td class="py-3 px-3 sm:px-4 text-center">
                <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black tracking-wide ${item.stockQty <= 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : (item.stockQty <= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')} border ${item.stockQty <= 0 ? 'border-rose-200 dark:border-rose-800/30' : (item.stockQty <= 3 ? 'border-amber-200 dark:border-amber-800/30' : 'border-slate-200 dark:border-slate-700/50')}">${item.stockQty} pcs</span>
            </td>
            <td class="py-3 px-3 sm:px-4 text-right text-slate-500 font-semibold tracking-tight">₱ ${averageCPP.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
            <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400 tracking-tight">₱ ${sellingPrice.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td class="py-3 px-3 sm:px-4 text-right font-bold text-emerald-600 tracking-tight">₱ ${profitPerPiece.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-500">${profitMargin.toFixed(2)}%</td>
            <td class="py-3 px-3 sm:px-4 text-right font-semibold text-slate-700 dark:text-slate-200">₱ ${totalValue.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
            <td class="py-3 px-4 sm:px-5 text-right action-prevent-trigger">
                <div class="flex items-center justify-end gap-1.5 sm:gap-2">
                    <button onclick="addToCart('${item.id}'); switchTab('orders');" title="Sell" class="p-2 sm:p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800/30 shadow-sm btn-transition min-h-[36px] min-w-[36px] flex items-center justify-center"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
            </td>
        `;
        list.appendChild(row);
    });
}

// ================= BUNDLES & PROMOS LOGIC =================
function toggleBundleSort(column, event) {
    const isShift = event && event.shiftKey;
    handleMultiColumnSortToggle(bundleSortStack, column, isShift);
    updateSortHeaderIcons('sort-icon-bundle', bundleSortStack, ['name', 'includes', 'price', 'status']);
    renderBundlesTable();
}

function populateBundleItemSelect() {
    const select = document.getElementById('bundle-item-select');
    if(!select) return; select.innerHTML = '<option value="">Select product...</option>';
    inventory.forEach(item => select.innerHTML += `<option value="${item.id}">${item.name} (₱ ${(item.sellPrice || 0).toFixed(2)})</option>`);
}

function handleBundleTypeChange() {
    const type = document.getElementById('bundle-type').value;
    if (type === 'same' && draftBundleItems.length > 1) { draftBundleItems = [draftBundleItems[0]]; renderDraftBundleItems(); }
}

function addDraftBundleItem() {
    const select = document.getElementById('bundle-item-select');
    const qtyInput = document.getElementById('bundle-item-qty');
    const itemId = select.value; const qty = parseInt(qtyInput.value) || 1;
    const type = document.getElementById('bundle-type').value;

    if(!itemId) return; const item = inventory.find(i => i.id === itemId);

    if (type === 'same' && draftBundleItems.length >= 1) draftBundleItems = [{ itemId, name: item.name, qty }];
    else { const existing = draftBundleItems.find(d => d.itemId === itemId); if(existing) existing.qty += qty; else draftBundleItems.push({ itemId, name: item.name, qty }); }
    
    select.value = ''; qtyInput.value = '1'; renderDraftBundleItems();
}

function removeDraftBundleItem(index) { draftBundleItems.splice(index, 1); renderDraftBundleItems(); }

function renderDraftBundleItems() {
    const list = document.getElementById('draft-bundle-list'); 
    if (!list) return;
    list.innerHTML = '';
    draftBundleItems.forEach((d, i) => {
        list.innerHTML += `<div class="flex justify-between items-center bg-white dark:bg-slate-800 p-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-600"><span>${d.qty}x ${d.name}</span><button type="button" onclick="removeDraftBundleItem(${i})" class="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-md btn-transition"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div>`;
    }); initIcons();
}

function handleBundleSubmit(e) {
    e.preventDefault();
    const type = document.getElementById('bundle-type').value;
    const name = document.getElementById('bundle-name').value.trim();
    const price = parseFloat(document.getElementById('bundle-price').value);

    if(draftBundleItems.length === 0) { showToast("Add items to the promo bundle.", "error"); return; }
    if(editingBundleId) {
        const index = bundles.findIndex(b => b.id === editingBundleId);
        if (index > -1) {
            bundles[index] = { ...bundles[index], type, name, price, items: draftBundleItems };
            showToast("Promo updated", "success"); cancelBundleEdit();
        }
    } else {
        bundles.push({ id: 'bndl-' + Date.now().toString(), type, name, price, isActive: true, items: draftBundleItems });
        showToast("New promo created", "success"); document.getElementById('bundle-form').reset(); draftBundleItems = []; renderDraftBundleItems();
    } 
    saveBundles(); 
}

function editBundle(id) {
    const bundle = bundles.find(b => b.id === id); if(!bundle) return;
    editingBundleId = bundle.id;

    document.getElementById('bundle-type').value = bundle.type;
    document.getElementById('bundle-name').value = bundle.name;
    document.getElementById('bundle-price').value = bundle.price;
    draftBundleItems = JSON.parse(JSON.stringify(bundle.items)); renderDraftBundleItems();

    document.getElementById('bundle-submit-btn').innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> Update Promo';
    document.getElementById('bundle-cancel-btn').classList.remove('hidden'); window.scrollTo({ top: 0, behavior: 'smooth' }); initIcons();
}

function cancelBundleEdit() {
    editingBundleId = null; document.getElementById('bundle-form').reset(); draftBundleItems = []; renderDraftBundleItems();
    document.getElementById('bundle-submit-btn').innerHTML = '<i data-lucide="check-circle" class="w-4 h-4"></i> Save Promo';
    document.getElementById('bundle-cancel-btn').classList.add('hidden'); initIcons();
}

function toggleBundleStatus(id) { 
    const bundle = bundles.find(b => b.id === id); 
    if(bundle) { 
        bundle.isActive = !bundle.isActive; 
        saveBundles(); 
        showToast(bundle.isActive ? "Promo enabled" : "Promo disabled", "info"); 
    } 
}

function deleteBundle(id) { 
    requestUserConfirmation("Delete Promo", "Permanently delete this promo bundle?", "Delete", () => {
        bundles = bundles.filter(b => b.id !== id); 
        saveBundles(); 
        showToast("Promo deleted", "success"); 
    });
}

function getSortedBundles() {
    let sorted = [...bundles];
    sorted.sort((a, b) => {
        // DEFAULT BEHAVIOR: Active promos always appear first
        if (a.isActive !== b.isActive) {
            return a.isActive ? -1 : 1;
        }

        // Apply multi-column sorting within sections
        if (bundleSortStack.length > 0) {
            for (let sortObj of bundleSortStack) {
                const { col, dir } = sortObj;
                const dirMod = dir === 'asc' ? 1 : -1;
                let diff = 0;

                if (col === 'name') diff = a.name.localeCompare(b.name);
                else if (col === 'includes') {
                    const strA = a.items.map(i => `${i.qty}x ${i.name}`).join(', ');
                    const strB = b.items.map(i => `${i.qty}x ${i.name}`).join(', ');
                    diff = strA.localeCompare(strB);
                }
                else if (col === 'price') diff = (a.price || 0) - (b.price || 0);
                else if (col === 'status') diff = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);

                if (diff !== 0) return diff * dirMod;
            }
        }
        return 0;
    });
    return sorted;
}

function renderBundlesTable() {
    const list = document.getElementById('bundles-list'); if(!list) return; list.innerHTML = '';
    
    const displayBundles = getSortedBundles();

    if(displayBundles.length === 0) { list.innerHTML = `<tr><td colspan="5" class="py-12 text-center"><div class="flex flex-col items-center justify-center text-slate-400"><i data-lucide="tags" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="sm:text-sm text-xs font-bold">No promos active.</p></div></td></tr>`; initIcons(); return; }

    displayBundles.forEach(bundle => {
        const itemsStr = bundle.items.map(i => `<span class="inline-block bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-md font-bold text-[10px] mr-1.5 mb-1.5 shadow-sm border border-slate-200 dark:border-slate-600">${i.qty}x ${i.name}</span>`).join('');
        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${!bundle.isActive ? 'opacity-50 grayscale' : ''}">
                <td class="py-4 px-4 sm:px-5"><div class="font-black text-sm text-slate-900 dark:text-white">${bundle.name}</div><div class="text-[9px] uppercase tracking-wider font-bold text-indigo-500 mt-1">${bundle.type} Item Bundle</div></td>
                <td class="py-4 px-3 sm:px-4 text-xs">${itemsStr}</td>
                <td class="py-4 px-3 sm:px-4 text-right font-black text-emerald-600 dark:text-emerald-400 tracking-tight">₱ ${bundle.price.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="py-4 px-3 sm:px-4 text-center"><label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" onchange="toggleBundleStatus('${bundle.id}')" class="sr-only peer" ${bundle.isActive ? 'checked' : ''}><div class="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500 shadow-inner"></div></label></td>
                <td class="py-4 px-4 sm:px-5 text-right whitespace-nowrap"><button onclick="editBundle('${bundle.id}')" title="Edit" class="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors btn-transition"><i data-lucide="edit-2" class="w-4 h-4"></i></button><button onclick="deleteBundle('${bundle.id}')" title="Delete" class="p-2 sm:p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>
            </tr>
        `;
    }); initIcons();
}

// ================= POS CART ENGINE & LOGIC =================
function calculateCart() {
    let cartSnapshot = JSON.parse(JSON.stringify(cart));
    let savings = 0; let appliedBundles = []; let total = 0;
    cartSnapshot.forEach(item => { item.remainingQty = item.qty; item.discountedAmount = 0; });

    let activeBundles = bundles.filter(b => b.isActive);
    let sameItemBundles = activeBundles.filter(b => b.type === 'same' && b.items.length > 0).sort((a,b) => b.items[0].qty - a.items[0].qty);
    let mixedBundles = activeBundles.filter(b => b.type === 'mixed');

    mixedBundles.forEach(bundle => {
        let possibleApps = Infinity;
        bundle.items.forEach(bi => { let cItem = cartSnapshot.find(c => c.id === bi.itemId); if (!cItem) possibleApps = 0; else possibleApps = Math.min(possibleApps, Math.floor(cItem.remainingQty / bi.qty)); });
        if (possibleApps > 0 && possibleApps !== Infinity) {
            let regCost = 0, itemsInvolved = [];
            bundle.items.forEach(bi => {
                let cItem = cartSnapshot.find(c => c.id === bi.itemId); cItem.remainingQty -= (bi.qty * possibleApps);
                let costPart = (bi.qty * possibleApps * cItem.sellPrice); regCost += costPart; itemsInvolved.push({item: cItem, part: costPart});
            });
            let bCost = bundle.price * possibleApps, save = regCost - bCost;
            if(save > 0) {
                savings += save; appliedBundles.push({name: bundle.name, times: possibleApps, save: save});
                itemsInvolved.forEach(inv => inv.item.discountedAmount += (save * (inv.part / regCost)));
            }
        }
    });

    sameItemBundles.forEach(bundle => {
        let bi = bundle.items[0], cItem = cartSnapshot.find(c => c.id === bi.itemId);
        if (cItem && cItem.remainingQty >= bi.qty) {
            let apps = Math.floor(cItem.remainingQty / bi.qty);
            let regCost = apps * bi.qty * cItem.sellPrice, bCost = apps * bundle.price, save = regCost - bCost;
            if(save > 0) { cItem.remainingQty -= (apps * bi.qty); savings += save; appliedBundles.push({name: bundle.name, times: apps, save: save}); cItem.discountedAmount += save; }
        }
    });

    cartSnapshot.forEach(item => { item.effectiveTotal = (item.qty * item.sellPrice) - item.discountedAmount; item.effectivePrice = item.effectiveTotal / item.qty; total += item.effectiveTotal; });
    return { total, savings, appliedBundles, items: cartSnapshot };
}

function renderPOSCatalog() {
    const grid = document.getElementById('pos-catalog-grid'); const searchEl = document.getElementById('pos-search');
    if(!grid || !searchEl) return; grid.innerHTML = '';
    const searchVal = searchEl.value.toLowerCase(); const itemsToDisplay = inventory.filter(i => i.name.toLowerCase().includes(searchVal));
    
    if(itemsToDisplay.length === 0) { grid.innerHTML = `<div class="col-span-full py-12 flex flex-col items-center justify-center text-slate-400"><i data-lucide="search-x" class="w-10 h-10 mb-3 opacity-30"></i><p class="text-sm font-bold">No products found.</p></div>`; initIcons(); return; }

    itemsToDisplay.forEach(item => {
        let imageBlock = item.image ? `<div class="aspect-square w-full rounded-[14px] mb-3 overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50"><img src="${item.image}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"></div>`
            : `<div class="aspect-square w-full rounded-[14px] mb-3 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-3xl border border-indigo-100/50 dark:border-indigo-800/50 shadow-inner">${item.name.substring(0,2).toUpperCase()}</div>`;
        const outOfStock = item.stockQty <= 0;
        grid.innerHTML += `
            <div onclick="${outOfStock ? '' : `addToCart('${item.id}')`}" class="bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl p-3 flex flex-col justify-between transition-all shadow-sm ${outOfStock ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer group active:scale-[0.98]'}">
                <div>${imageBlock}<h4 class="font-bold text-xs leading-tight mb-1 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors line-clamp-2">${item.name}</h4><span class="text-[10px] font-black uppercase tracking-wider ${outOfStock ? 'text-rose-500' : 'text-slate-500'}">${item.stockQty} in stock</span></div>
                <div class="mt-3 flex items-center justify-between"><span class="text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-tight">₱ ${(item.sellPrice || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span>${!outOfStock ? `<div class="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i></div>` : ''}</div>
            </div>
        `;
    }); initIcons();
}

function addToCart(itemId) {
    const item = inventory.find(i => i.id === itemId); if(!item || item.stockQty <= 0) return;
    const cartItem = cart.find(c => c.id === itemId);
    if(cartItem) { 
        if(cartItem.qty + 1 > item.stockQty) { showToast("Max stock reached", "info"); return; } 
        cartItem.qty++; 
    } else {
        cart.push({ id: item.id, name: item.name, sellPrice: item.sellPrice || 0, unitCost: item.unitCost || 0, maxStock: item.stockQty, qty: 1 }); 
    }
    renderCart();
}

function updateCartQty(id, change) {
    const match = cart.find(c => c.id === id); if(!match) return; match.qty += change;
    if(match.qty <= 0) {
        cart = cart.filter(c => c.id !== id);
    } else if(match.qty > match.maxStock) { 
        match.qty = match.maxStock; 
        showToast("Max stock limit reached", "info"); 
    } 
    renderCart();
}

function updateCartBadge() {
    const totalQty = cart.reduce((accum, item) => accum + item.qty, 0);
    const badgeCountEl = document.getElementById('cart-badge-count');
    const fabBadgeCountEl = document.getElementById('mobile-fab-badge-count');

    let badgeText = '';
    if (totalQty > 99) {
        badgeText = '99+';
    } else if (totalQty > 0) {
        badgeText = totalQty.toString();
    }

    [badgeCountEl, fabBadgeCountEl].forEach(el => {
        if (!el) return;
        if (totalQty === 0) {
            el.innerText = '0';
            el.classList.add('hidden');
            el.classList.remove('flex');
        } else {
            el.innerText = badgeText;
            el.classList.remove('hidden');
            el.classList.add('flex');
        }
    });
}

function renderSmartSuggestions() {
    const container = document.getElementById('smart-suggestions-list');
    if (!container) return;

    const cartIds = cart.map(c => c.id);
    const candidates = inventory.filter(i => !cartIds.includes(i.id) && i.stockQty > 0);
    
    if (cart.length === 0 || candidates.length === 0) {
        container.innerHTML = `
            <div class="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 text-slate-400 dark:text-slate-500 text-[11px] font-medium flex items-center gap-2">
                <i data-lucide="info" class="w-3.5 h-3.5 text-slate-400"></i>
                Add catalog products to populate dynamic complementary recommendations.
            </div>`;
        if (window.lucide) lucide.createIcons();
        return;
    }

    const topPicks = candidates.slice(0, 2);
    container.innerHTML = '';
    
    topPicks.forEach(item => {
        container.innerHTML += `
            <div class="suggestion-item-card flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 text-xs font-semibold animate-scale-in">
                <div class="min-w-0 flex-1 pr-2">
                    <p class="text-slate-900 dark:text-slate-200 font-bold truncate">${item.name}</p>
                    <p class="text-[10px] text-slate-400 font-medium">Available: ${item.stockQty} left • ₱ ${item.sellPrice.toFixed(2)}</p>
                </div>
                <button type="button" onclick="addToCart('${item.id}')" class="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-lg btn-transition flex items-center gap-1 shadow-xs flex-shrink-0">
                    <i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Add
                </button>
            </div>
        `;
    });
    if (window.lucide) lucide.createIcons();
}

function renderCart() {
    const container = document.getElementById('cart-items-container'); if(!container) return; container.innerHTML = '';
    
    const modeBadge = document.getElementById('cart-mode-badge');
    const actionBtn = document.getElementById('cart-action-btn');
    const cartTitle = document.getElementById('cart-title');

    if (editingOrderId) {
        if(modeBadge) modeBadge.classList.remove('hidden');
        if(actionBtn) actionBtn.innerText = "Cancel";
        if(cartTitle) cartTitle.innerText = `Edit: ${editingOrderId}`;
    } else {
        if(modeBadge) modeBadge.classList.add('hidden');
        if(actionBtn) actionBtn.innerText = "Clear";
        if(cartTitle) cartTitle.innerText = "Current Cart";
    }

    updateCartBadge();

    if (cart.length === 0) {
        container.innerHTML = `<div class="py-12 flex flex-col items-center justify-center text-slate-400 pointer-events-none"><i data-lucide="shopping-bag" class="w-12 h-12 mb-3 opacity-30"></i><p class="text-[11px] font-black uppercase tracking-wider">Cart is empty</p></div>`;
        document.getElementById('cart-total-display').innerText = '0.00'; 
        document.getElementById('cart-subtotal-display').innerText = '0.00';
        document.getElementById('cart-discount-display').innerText = '0.00';
        document.getElementById('cart-tax-display').innerText = '0.00';
        renderSmartSuggestions();
        initIcons();
        return;
    }

    const cartCalc = calculateCart();

    cart.forEach(item => {
        const calcItem = cartCalc.items.find(c => c.id === item.id) || item;
        let priceDisplay = `<span class="text-[11px] font-semibold text-slate-500">₱ ${item.sellPrice.toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;
        if (calcItem.discountedAmount > 0) priceDisplay += `<span class="ml-1.5 text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-100 dark:border-emerald-800/30">- ₱ ${calcItem.discountedAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;

        container.innerHTML += `
            <div class="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-600 animate-scale-in">
                <div class="flex flex-col flex-1 min-w-0 mr-3"><span class="font-bold text-slate-900 dark:text-slate-100 truncate text-xs mb-0.5">${item.name}</span><div>${priceDisplay}</div></div>
                <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100/50 dark:border-slate-700/50 shadow-inner">
                    <button onclick="updateCartQty('${item.id}', -1)" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all hover:shadow-sm min-h-[36px] min-w-[36px]"><i data-lucide="minus" class="w-4 h-4"></i></button>
                    <span class="w-6 text-center font-black text-sm text-slate-900 dark:text-white">${item.qty}</span>
                    <button onclick="updateCartQty('${item.id}', 1)" class="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all hover:shadow-sm min-h-[36px] min-w-[36px]"><i data-lucide="plus" class="w-4 h-4"></i></button>
                </div>
            </div>
        `;
    });

    if (cartCalc.appliedBundles.length > 0) {
        let bundlesHtml = cartCalc.appliedBundles.map(b => `<div class="flex justify-between text-[11px] text-emerald-700 dark:text-emerald-400 font-bold"><span><i data-lucide="tag" class="w-3 h-3 inline mr-1.5 mb-0.5"></i>${b.times}x ${b.name}</span><span>- ₱ ${b.save.toLocaleString(undefined, {minimumFractionDigits:2})}</span></div>`).join('');
        container.innerHTML += `<div class="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700 space-y-1.5 bg-emerald-50 dark:bg-emerald-500/10 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-inner"><div class="text-[9px] uppercase font-black text-emerald-800 dark:text-emerald-300 mb-2 tracking-wider">Applied Promos</div>${bundlesHtml}</div>`;
    }
    
    const formattedTotalStr = cartCalc.total.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    document.getElementById('cart-total-display').innerText = formattedTotalStr;
    document.getElementById('cart-subtotal-display').innerText = (cartCalc.total + cartCalc.savings).toLocaleString(undefined, {minimumFractionDigits:2});
    document.getElementById('cart-discount-display').innerText = cartCalc.savings.toLocaleString(undefined, {minimumFractionDigits:2});
    document.getElementById('cart-tax-display').innerText = (cartCalc.total * 0.12).toLocaleString(undefined, {minimumFractionDigits:2});
    
    if(document.getElementById('pos-paid-full').checked) document.getElementById('pos-paid-amount').value = cartCalc.total.toFixed(2);
    
    renderSmartSuggestions();
    initIcons();
}

// ================= TRANSACTION POST & HISTORY LOGIC =================
function setOrderTab(tab) {
    currentOrderTab = tab;
    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        btn.className = "flex-1 md:flex-none px-3 py-1.5 text-[10px] font-semibold rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-200 whitespace-nowrap";
    });
    const activeBtn = document.getElementById(`tab-${tab}-orders`);
    if (activeBtn) {
        activeBtn.className = "flex-1 md:flex-none px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs hover:text-slate-900 transition-all duration-200 whitespace-nowrap";
    }
    currentOrdersPage = 1;
    renderOrdersTable();
}

function changeRowsPerPage() { 
    ordersPerPage = parseInt(document.getElementById('rows-per-page-select').value); 
    currentOrdersPage = 1; 
    renderOrdersTable(); 
}

function prevOrdersPage() { 
    if (currentOrdersPage > 1) { 
        currentOrdersPage--; 
        renderOrdersTable(); 
    } 
}

function nextOrdersPage() { 
    let filtered = getFilteredOrders(); 
    if (currentOrdersPage < Math.ceil(filtered.length / ordersPerPage)) { 
        currentOrdersPage++; 
        renderOrdersTable(); 
    } 
}

function toggleOrderSort(column, event) {
    const isShift = event && event.shiftKey;
    handleMultiColumnSortToggle(orderSortStack, column, isShift);
    updateSortHeaderIcons('sort-icon', orderSortStack, ['customer', 'date', 'total', 'payment', 'delivery']);
    renderOrdersTable();
}

function getFilteredOrders() {
    let filtered = [...orders];
    
    switch (currentOrderTab) {
        case 'cancelled':
            filtered = filtered.filter(o => o.status === 'cancelled');
            break;
        case 'active':
            filtered = filtered.filter(o => o.status !== 'cancelled' && !o.isPaid);
            break;
        case 'completed':
            filtered = filtered.filter(o => o.status !== 'cancelled' && o.isPaid);
            break;
        default:
            break;
    }

    const searchVal = (document.getElementById('history-search')?.value || '').trim().toLowerCase();
    if (searchVal) {
        filtered = filtered.filter(o => {
            const itemsMatch = getOrderItems(o).some(i => i.name.toLowerCase().includes(searchVal));
            return (o.id.toLowerCase().includes(searchVal) || 
                    o.customerName.toLowerCase().includes(searchVal) || 
                    itemsMatch);
        });
    }

    filtered.sort((a, b) => {
        // If user defined explicit multi-column sorting stack
        if (orderSortStack.length > 0) {
            for (let sortObj of orderSortStack) {
                const { col, dir } = sortObj;
                const dirMod = dir === 'asc' ? 1 : -1;
                let diff = 0;

                if (col === 'customer') diff = a.customerName.localeCompare(b.customerName);
                else if (col === 'date') diff = new Date(a.date || 0) - new Date(b.date || 0);
                else if (col === 'total') diff = (a.totalRevenue || 0) - (b.totalRevenue || 0);
                else if (col === 'payment') diff = (a.isPaid ? 1 : 0) - (b.isPaid ? 1 : 0);
                else if (col === 'delivery') diff = (a.isReceived ? 1 : 0) - (b.isReceived ? 1 : 0);

                if (diff !== 0) return diff * dirMod;
            }
            return 0;
        }

        // DEFAULT ORDERING:
        // 1. Unpaid orders first
        // 2. Most recent transaction first within section
        // 3. Then all paid transactions
        // 4. Most recent first within each section
        const aUnpaid = (!a.isPaid && a.status !== 'cancelled') ? 0 : 1;
        const bUnpaid = (!b.isPaid && b.status !== 'cancelled') ? 0 : 1;

        if (aUnpaid !== bUnpaid) {
            return aUnpaid - bUnpaid;
        }

        // Within same payment status group, sort by most recent transaction first
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        if (dateA !== dateB) {
            return dateB - dateA;
        }

        return b.id.localeCompare(a.id);
    });
    
    return filtered;
}

function toggleOrderPaid(orderId) { 
    const order = orders.find(o => o.id === orderId); 
    if (order && order.status !== 'cancelled') { 
        if (order.isPaid) { 
            order.amountPaid = 0; 
            order.isPaid = false; 
        } else { 
            order.amountPaid = order.totalRevenue; 
            order.isPaid = true; 
        } 
        saveOrders(); 
        renderOrdersTable();
        renderSummary();
        showToast("Payment status updated", "success"); 
    } 
}

function toggleOrderReceived(orderId) { 
    const order = orders.find(o => o.id === orderId); 
    if (order && order.status !== 'cancelled') { 
        order.isReceived = !order.isReceived; 
        saveOrders(); 
        renderOrdersTable();
        renderSummary();
        showToast("Delivery status updated", "success"); 
    } 
}

/**
 * POS Order Editing Bug Fix
 * Opening an order for editing populates fields without modifying stock quantities.
 */
function editOrder(id) {
    const order = orders.find(o => o.id === id); 
    if (!order || order.status === 'cancelled') return;
    
    if (editingOrderId) {
        if (!confirm("An editing session is already active. Discard those changes and open this ticket?")) return;
    }

    editingOrderId = order.id;

    // Load existing order items into active cart for display/editing
    cart = getOrderItems(order).map(item => {
        const invItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase());
        return {
            id: invItem ? invItem.id : item.id,
            name: item.name,
            sellPrice: item.sellPrice,
            unitCost: item.unitCost,
            maxStock: invItem ? (invItem.stockQty + item.qty) : item.qty,
            qty: item.qty
        };
    });

    document.getElementById('pos-customer').value = order.customerName;
    
    const pAmtInput = document.getElementById('pos-paid-amount');
    const pFullCheck = document.getElementById('pos-paid-full');
    if (pFullCheck) pFullCheck.checked = order.isPaid;
    if (pAmtInput) {
        pAmtInput.disabled = order.isPaid;
        if (order.isPaid) pAmtInput.classList.add('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
        else pAmtInput.classList.remove('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
        pAmtInput.value = (order.amountPaid !== undefined) ? order.amountPaid : '';
    }

    renderCart();
    switchTab('orders');
    openCartModal();
    showToast(`Loaded order ${order.id} for editing`, "info");
}

function cancelOrder(id) {
    const order = orders.find(o => o.id === id);
    if (order && order.status !== 'cancelled') {
        requestUserConfirmation(
            "Void Transaction Order",
            `Cancel transaction ticket for ${order.customerName}?\nThis rolls back all item quantities back to active warehouse inventory.`,
            "Proceed",
            () => {
                getOrderItems(order).forEach(item => {
                    const invItem = inventory.find(i => i.name.toLowerCase() === item.name.toLowerCase()); 
                    if (invItem) invItem.stockQty += item.qty;
                });
                order.status = 'cancelled'; order.isPaid = false; order.isReceived = false; order.amountPaid = 0;
                saveOrders();
                saveInventory();
                renderUI();
                showToast("Order transaction voided", "info");
            }
        );
    }
}

function deleteOrderPermanently(id) {
    requestUserConfirmation(
        "Delete Order",
        "Permanently purge this order from the registry database? This cannot be undone.",
        "Delete",
        () => {
            orders = orders.filter(o => o.id !== id);
            saveOrders();
            renderUI();
            showToast("Order record purged", "success");
        }
    );
}

function renderOrdersTable() {
    const list = document.getElementById('orders-list'); if(!list) return; list.innerHTML = '';
    let filtered = getFilteredOrders();
    const totalPages = Math.ceil(filtered.length / ordersPerPage) || 1; if(currentOrdersPage > totalPages) currentOrdersPage = totalPages;
    document.getElementById('pagination-info-text').innerText = `Showing page ${currentOrdersPage} of ${totalPages} (${filtered.length} total)`;
    const pageSlicedOrders = filtered.slice((currentOrdersPage - 1) * ordersPerPage, ((currentOrdersPage - 1) * ordersPerPage) + ordersPerPage);

    if(pageSlicedOrders.length === 0) { list.innerHTML = `<tr><td colspan="7" class="py-12 text-center text-slate-400"><div class="flex flex-col items-center justify-center"><i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm font-bold">No records found.</p></div></td></tr>`; initIcons(); return; }
    
    pageSlicedOrders.forEach(order => {
        const due = order.totalRevenue - (order.amountPaid || 0); const isCancelled = order.status === 'cancelled';
        
        let pBadge = isCancelled ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg uppercase tracking-wider"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Void</span>`
            : (order.isPaid ? `<button onclick="event.stopPropagation(); toggleOrderPaid('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/30 uppercase tracking-wider hover:bg-emerald-100"><i data-lucide="check" class="w-3 h-3"></i> Paid</button>`
                : ((order.amountPaid || 0) > 0 ? `<button onclick="event.stopPropagation(); toggleOrderPaid('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800/30 uppercase tracking-wider hover:bg-emerald-100"><i data-lucide="clock" class="w-3 h-3"></i> Bal: ₱ ${due.toFixed(2)}</button>`
                    : `<button onclick="event.stopPropagation(); toggleOrderPaid('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/30 uppercase tracking-wider hover:bg-rose-100"><i data-lucide="alert-circle" class="w-3 h-3"></i> Unpaid</button>`));
        
        const delBtn = isCancelled ? `<span class="text-slate-400 font-bold text-xl">-</span>` 
            : (order.isReceived ? `<button onclick="event.stopPropagation(); toggleOrderReceived('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200/70 hover:bg-slate-200 uppercase tracking-wider"><i data-lucide="package-check" class="w-3.5 h-3.5 text-emerald-500"></i> Delivered</button>`
                : `<button onclick="event.stopPropagation(); toggleOrderReceived('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-500 rounded-lg border border-slate-200/70 shadow-sm hover:bg-slate-50 uppercase tracking-wider"><i data-lucide="truck" class="w-3.5 h-3.5 text-amber-500"></i> Pending</button>`);

        const editBadge = order.isEdited && !isCancelled ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 align-middle">Edited</span>` : '';
        const itemsListStr = getOrderItems(order).map(i => `${i.qty}x ${i.name}`).join(', ');

        let actionHtml = `<button onclick="event.stopPropagation(); generateReceipt('${order.id}')" title="Receipt" class="p-2 sm:p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="receipt" class="w-4 h-4"></i></button>`;
        
        if(!isCancelled) {
            actionHtml += `<button onclick="event.stopPropagation(); editOrder('${order.id}')" title="Edit Order" class="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors btn-transition"><i data-lucide="edit" class="w-4 h-4"></i></button><button onclick="event.stopPropagation(); cancelOrder('${order.id}')" title="Cancel Order" class="p-2 sm:p-2.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="x-circle" class="w-4 h-4"></i></button>`;
        }

        if (isCancelled) {
            actionHtml += `<button onclick="event.stopPropagation(); deleteOrderPermanently('${order.id}')" title="Delete Permanently" class="p-2 sm:p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
        }

        const row = document.createElement('tr');
        row.className = "hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer " + (isCancelled ? 'opacity-50 grayscale bg-slate-50/30 dark:bg-slate-900/20' : '');
        
        row.onclick = () => { generateReceipt(order.id); };

        row.innerHTML = `
            <td class="w-[20%] py-3 px-4 sm:px-5 truncate-cell">
                <div class="font-bold text-sm text-slate-900 dark:text-white truncate" title="${order.customerName}">${order.customerName}${editBadge}</div>
            </td>
            <td class="w-[15%] py-3 px-3 sm:px-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
                ${order.date || "N/A"}
            </td>
            <td class="w-[25%] py-3 px-3 sm:px-4 text-xs font-medium text-slate-600 dark:text-slate-300 truncate-cell" title="${itemsListStr}">
                ${itemsListStr}
            </td>
            <td class="w-[13%] py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400 tracking-tight ${isCancelled?'line-through':''}">
                ₱ ${order.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}
            </td>
            <td class="w-[12%] py-3 px-3 sm:px-4 text-center action-prevent-trigger">
                ${pBadge}
            </td>
            <td class="w-[12%] py-3 px-3 sm:px-4 text-center action-prevent-trigger">
                ${delBtn}
            </td>
            <td class="w-[8%] py-3 px-4 sm:px-5 text-right action-prevent-trigger">
                <div class="flex items-center justify-end gap-1 sm:gap-1.5">
                    ${actionHtml}
                </div>
            </td>
        `;
        list.appendChild(row);
    }); initIcons();
}

// ================= CHECKOUT & CLEAR CART =================
function clearCart() {
    if (cart.length === 0) {
        showToast("Cart is already empty", "info");
        return;
    }
    requestUserConfirmation("Clear Cart", "This will remove all items from your current cart. Are you sure?", "Clear", () => {
        if (editingOrderId) {
            editingOrderId = null;
            const modeBadge = document.getElementById('cart-mode-badge');
            const actionBtn = document.getElementById('cart-action-btn');
            const cartTitle = document.getElementById('cart-title');
            if (modeBadge) modeBadge.classList.add('hidden');
            if (actionBtn) actionBtn.innerText = "Clear";
            if (cartTitle) cartTitle.innerText = "Current Cart";
            document.getElementById('pos-customer').value = '';
            const pAmtInput = document.getElementById('pos-paid-amount');
            const pFullCheck = document.getElementById('pos-paid-full');
            if (pFullCheck) pFullCheck.checked = false;
            if (pAmtInput) {
                pAmtInput.disabled = false;
                pAmtInput.classList.remove('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
                pAmtInput.value = '';
            }
        }
        cart = [];
        renderCart();
        closeCartModal();
        showToast("Cart cleared", "info");
    });
}

/**
 * POS Order Editing Bug Fix (Idempotent Checkout)
 * When editing an existing order, update existing transaction in place.
 * Editing an order must NOT modify inventory stock quantities.
 */
function checkoutCart() {
    if (cart.length === 0) { showToast("Cart is empty", "error"); return; }
    const customerName = document.getElementById('pos-customer').value.trim() || "Walk-in Customer";
    const paidAmount = parseFloat(document.getElementById('pos-paid-amount').value) || 0;
    const cartCalc = calculateCart();
    const totalDue = cartCalc.total;

    if (paidAmount > totalDue) { showToast("Payment exceeds total due", "error"); return; }

    const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        qty: item.qty,
        sellPrice: item.sellPrice,
        unitCost: item.unitCost,
        effectiveTotal: item.qty * item.sellPrice,
        totalCost: item.qty * (item.unitCost || 0),
        totalProfit: item.qty * ((item.sellPrice || 0) - (item.unitCost || 0))
    }));

    const totalRevenue = cartCalc.total;
    const totalCost = orderItems.reduce((sum, i) => sum + i.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;

    if (editingOrderId) {
        // UPDATE EXISTING ORDER IN-PLACE
        const existingOrderIndex = orders.findIndex(o => o.id === editingOrderId);
        if (existingOrderIndex > -1) {
            orders[existingOrderIndex].customerName = customerName;
            orders[existingOrderIndex].amountPaid = paidAmount;
            orders[existingOrderIndex].isPaid = paidAmount >= totalDue;
            orders[existingOrderIndex].items = orderItems;
            orders[existingOrderIndex].totalRevenue = totalRevenue;
            orders[existingOrderIndex].totalCost = totalCost;
            orders[existingOrderIndex].totalProfit = totalProfit;
            orders[existingOrderIndex].isEdited = true;
            
            saveOrders();
            logActivity('sale', `Updated order ${editingOrderId} for ${customerName}`);
            showToast(`Order ${editingOrderId} updated successfully!`, "success");
            generateReceipt(editingOrderId);
            editingOrderId = null;
        } else {
            showToast("Error locating existing order to update", "error");
            return;
        }
    } else {
        // CREATE NEW ORDER - Stock decreases ONLY when creating a new order
        cart.forEach(item => {
            const invItem = inventory.find(i => i.id === item.id);
            if (invItem) {
                invItem.stockQty -= item.qty;
            }
        });

        const newOrder = {
            id: 'ORD-' + Date.now().toString().slice(-6),
            customerName: customerName,
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            items: orderItems,
            totalRevenue: totalRevenue,
            totalCost: totalCost,
            totalProfit: totalProfit,
            amountPaid: paidAmount,
            isPaid: paidAmount >= totalDue,
            isReceived: false,
            status: 'active',
            isEdited: false
        };

        orders.push(newOrder);
        logActivity('sale', `Sale to ${customerName}: ${newOrder.id} for ₱${totalRevenue.toFixed(2)}`);

        saveOrders();
        saveInventory();
        showToast(`Order ${newOrder.id} completed successfully!`, "success");
        generateReceipt(newOrder.id);
    }

    cart = [];
    document.getElementById('pos-customer').value = '';
    document.getElementById('pos-paid-amount').value = '';
    document.getElementById('pos-paid-full').checked = false;
    
    const modeBadge = document.getElementById('cart-mode-badge');
    const actionBtn = document.getElementById('cart-action-btn');
    const cartTitle = document.getElementById('cart-title');
    if (modeBadge) modeBadge.classList.add('hidden');
    if (actionBtn) actionBtn.innerText = "Clear";
    if (cartTitle) cartTitle.innerText = "Current Cart";

    saveActivityLog();
    renderCart();
    renderUI();
    closeCartModal();
}

function togglePaidFullCheck(checkbox) {
    const total = parseFloat(document.getElementById('cart-total-display').innerText) || 0;
    const paidInput = document.getElementById('pos-paid-amount');
    if (!paidInput) return;
    if (checkbox.checked) {
        paidInput.value = total.toFixed(2);
        paidInput.disabled = true;
        paidInput.classList.add('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
    } else {
        paidInput.value = '';
        paidInput.disabled = false;
        paidInput.classList.remove('opacity-50', 'bg-slate-100', 'dark:bg-slate-700');
    }
}

function filterCustomers() {
    const input = document.getElementById('pos-customer');
    const dropdown = document.getElementById('customer-dropdown');
    if (!input || !dropdown) return;
    const query = input.value.trim().toLowerCase();
    const distinctCustomers = [...new Set(orders.map(o => o.customerName))].filter(Boolean);
    dropdown.innerHTML = '';
    const matches = distinctCustomers.filter(c => c.toLowerCase().includes(query));
    if (matches.length > 0 && query.length > 0) {
        matches.forEach(c => {
            const div = document.createElement('div');
            div.className = "px-4 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors";
            div.innerText = c;
            div.onmousedown = () => {
                input.value = c;
                dropdown.classList.add('hidden');
            };
            dropdown.appendChild(div);
        });
        dropdown.classList.remove('hidden');
        dropdown.classList.add('flex');
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
    }
}

// ================= SUPPLIER MODULE =================
function toggleBnplSort(column, event) {
    const isShift = event && event.shiftKey;
    handleMultiColumnSortToggle(bnplSortStack, column, isShift);
    updateSortHeaderIcons('sort-icon-bnpl', bnplSortStack, ['supplier', 'date', 'product', 'financials', 'status']);
    renderBnplTable();
}

function filterSuppliers() {
    const input = document.getElementById('bnpl-supplier');
    const dropdown = document.getElementById('supplier-dropdown');
    if(!input || !dropdown) return;

    const query = input.value.trim().toLowerCase();
    const distinctSuppliers = [...new Set(bnplRecords.map(b => b.supplierName))].filter(Boolean);
    dropdown.innerHTML = '';

    const matches = distinctSuppliers.filter(s => s.toLowerCase().includes(query));
    if (matches.length > 0) {
        matches.forEach(s => {
            const block = document.createElement('div');
            block.className = "px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors";
            block.innerText = s;
            block.onmousedown = () => {
                input.value = s;
                dropdown.classList.add('hidden');
            };
            dropdown.appendChild(block);
        });
        dropdown.classList.remove('hidden');
        dropdown.classList.add('flex');
    } else {
        dropdown.classList.add('hidden');
        dropdown.classList.remove('flex');
    }
}

function createNewBatchPrompt() {
    const batchName = prompt("Enter custom batch name/identifier:");
    if (batchName && batchName.trim()) {
        const select = document.getElementById('bnpl-batch-number');
        const opt = document.createElement('option');
        opt.value = batchName.trim();
        opt.innerText = batchName.trim();
        opt.selected = true;
        select.appendChild(opt);
        showToast("Custom batch identifier created", "success");
    }
}

function searchBatchItem() {
    const input = document.getElementById('batch-item-search');
    const dropdown = document.getElementById('batch-item-dropdown');
    if(!input || !dropdown) return;
    const text = input.value.trim().toLowerCase();
    dropdown.innerHTML = '';

    const matches = inventory.filter(item => item.name.toLowerCase().includes(text));
    
    if(matches.length > 0) {
        matches.forEach(item => {
            const row = document.createElement('div');
            row.className = "px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-200 flex justify-between";
            row.innerHTML = `<span>${item.name}</span><span class="text-[10px] text-slate-400 font-bold">Price: ₱ ${(item.sellPrice || 0).toFixed(2)}</span>`;
            row.onmousedown = () => { 
                input.value = item.name; 
                dropdown.classList.add('hidden'); 
                runBatchMetricsCalc();
            };
            dropdown.appendChild(row);
        });
        dropdown.classList.remove('hidden'); dropdown.classList.add('flex');
    } else { 
        dropdown.classList.add('hidden'); 
    }
    runBatchMetricsCalc();
}

function runBatchMetricsCalc() {
    const nameInput = document.getElementById('batch-item-search');
    const qtyInput = document.getElementById('batch-item-qty');
    const costInput = document.getElementById('batch-item-cost');
    if (!nameInput || !qtyInput || !costInput) return;

    const name = nameInput.value.trim();
    const qty = parseFloat(qtyInput.value) || 0;
    const cost = parseFloat(costInput.value) || 0;
    
    const previewBlock = document.getElementById('batch-item-preview');
    const cppEl = document.getElementById('preview-cpp');
    const spEl = document.getElementById('preview-sp');
    const pppEl = document.getElementById('preview-ppp');
    const marginEl = document.getElementById('preview-margin');

    if(!previewBlock || !name || qty <= 0 || cost <= 0) {
        if(previewBlock) previewBlock.classList.add('hidden');
        return;
    }

    const cpp = cost / qty;
    const invMatch = inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    const sp = invMatch ? (invMatch.sellPrice || 0) : 0;
    const profitPerPc = sp - cpp;
    const margin = sp > 0 ? ((profitPerPc / sp) * 100) : 0;

    if(cppEl) cppEl.innerText = cpp.toFixed(2);
    if(spEl) spEl.innerText = sp.toFixed(2);
    if(pppEl) pppEl.innerText = profitPerPc.toFixed(2);
    if(marginEl) marginEl.innerText = margin.toFixed(2);

    previewBlock.classList.remove('hidden');
}

function commitBatchItemsToInventory(items) {
    items.forEach(item => {
        const existingIndex = inventory.findIndex(inv => inv.name.toLowerCase() === item.itemName.toLowerCase());
        const addedQty = item.qty;
        const itemCost = item.totalCost;

        const historyEntry = {
            id: 'SH-' + Date.now().toString().slice(-6) + '-' + Math.floor(Math.random() * 1000),
            productName: item.itemName,
            qtyAdded: addedQty,
            costPerItem: item.costPerPiece,
            totalCost: itemCost,
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        };
        stockHistory.unshift(historyEntry);

        if(existingIndex > -1) {
            const existing = inventory[existingIndex];
            const currentStock = existing.stockQty || 0;
            const currentCPP = existing.unitCost || 0;
            
            const existingTotalValue = currentStock * currentCPP;
            const newTotalValue = existingTotalValue + itemCost;
            const combinedStockCount = currentStock + addedQty;
            
            existing.unitCost = combinedStockCount > 0 ? (newTotalValue / combinedStockCount) : item.costPerPiece;
            existing.stockQty = combinedStockCount;
        } else {
            inventory.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 3),
                name: item.itemName,
                unitCost: item.costPerPiece,
                sellPrice: item.sellingPrice || item.costPerPiece * 1.25, 
                stockQty: addedQty,
                recCppMin: 0,
                recCppMax: 0
            });
        }
    });
    saveInventory();
    saveStockHistory();
}

function handleSupplierPurchaseSubmit(e) {
    e.preventDefault();
    const supplier = document.getElementById('bnpl-supplier').value.trim();
    const purchaseDate = document.getElementById('bnpl-purchasedate').value;
    const dueDate = document.getElementById('bnpl-duedate').value;
    const batchNumber = document.getElementById('bnpl-batch-number').value;
    const prodName = document.getElementById('batch-item-search').value.trim();
    const qty = parseInt(document.getElementById('batch-item-qty').value) || 0;
    const totalCost = parseFloat(document.getElementById('batch-item-cost').value) || 0;
    const notes = document.getElementById('bnpl-notes').value.trim() || 'N/A';
    const inventoryReceived = document.getElementById('bnpl-received-checkbox').checked;

    if(qty <= 0 || totalCost <= 0 || !prodName) {
        showToast("Please provide valid quantity, cost, and product details.", "error");
        return;
    }

    const cpp = totalCost / qty;
    const invMatch = inventory.find(i => i.name.toLowerCase() === prodName.toLowerCase());
    const sellingPrice = invMatch ? (invMatch.sellPrice || 0) : 0;

    const singleBatchItem = [{
        itemName: prodName,
        qty: qty,
        totalCost: totalCost,
        costPerPiece: cpp,
        sellingPrice: sellingPrice
    }];

    const newRecord = {
        id: 'AP-' + Date.now().toString().slice(-6),
        supplierName: supplier,
        invoiceNumber: batchNumber, 
        purchaseDate: purchaseDate,
        dueDate: dueDate,
        notes: notes,
        items: singleBatchItem,
        totalAmount: totalCost,
        amountPaid: 0,
        payments: [], 
        isReceived: inventoryReceived,
        receivedDate: inventoryReceived ? new Date().toISOString() : null,
        status: 'unpaid'
    };

    if (inventoryReceived) {
        commitBatchItemsToInventory(singleBatchItem);
    }

    bnplRecords.push(newRecord);
    saveBnpl();

    document.getElementById('bnpl-form').reset();
    const previewBlock = document.getElementById('batch-item-preview');
    if (previewBlock) previewBlock.classList.add('hidden');
    initDateDefaults();
    
    renderBnplUI();
    showToast("Supplier purchase logged successfully", "success");
}

function openSupplierPurchaseEdit(id) {
    const record = bnplRecords.find(b => b.id === id);
    if (!record) return;

    document.getElementById('edit-bnpl-id').value = record.id;
    document.getElementById('edit-bnpl-supplier-name').value = record.supplierName;
    document.getElementById('edit-bnpl-invoice-number').value = record.invoiceNumber || '';
    document.getElementById('edit-bnpl-purchase-date').value = record.purchaseDate || '';
    document.getElementById('edit-bnpl-due-date').value = record.dueDate || '';
    document.getElementById('edit-bnpl-notes-field').value = record.notes === 'N/A' ? '' : record.notes;

    openModal('supplier-purchase-edit-modal');
}

function saveSupplierPurchaseEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-bnpl-id').value;
    const record = bnplRecords.find(b => b.id === id);

    if (record) {
        record.supplierName = document.getElementById('edit-bnpl-supplier-name').value.trim();
        record.invoiceNumber = document.getElementById('edit-bnpl-invoice-number').value.trim();
        record.purchaseDate = document.getElementById('edit-bnpl-purchase-date').value;
        record.dueDate = document.getElementById('edit-bnpl-due-date').value;
        record.notes = document.getElementById('edit-bnpl-notes-field').value.trim() || 'N/A';

        saveBnpl();
        closeModal('supplier-purchase-edit-modal');
        renderBnplUI();
        showToast("Supplier purchase modified", "success");
    }
}

function deleteSupplierPurchase(id) {
    const record = bnplRecords.find(b => b.id === id);
    if (!record) return;

    const proceedDeletion = () => {
        if (record.isReceived) {
            record.items.forEach(item => {
                const matchedItem = inventory.find(i => i.name.toLowerCase() === item.itemName.toLowerCase());
                if (matchedItem) {
                    const currentStock = matchedItem.stockQty || 0;
                    const currentCPP = matchedItem.unitCost || 0;
                    
                    const originalValue = currentStock * currentCPP;
                    const removedValue = item.totalCost;
                    const balancedStockCount = Math.max(0, currentStock - item.qty);
                    
                    matchedItem.unitCost = balancedStockCount > 0 ? (Math.max(0, originalValue - removedValue) / balancedStockCount) : 0;
                    matchedItem.stockQty = balancedStockCount;
                }
            });
            saveInventory();
        }
        bnplRecords = bnplRecords.filter(b => b.id !== id);
        saveBnpl();
        renderBnplUI();
        showToast("Supplier purchase record successfully deleted", "info");
    };

    if (record.isReceived) {
        requestUserConfirmation(
            "Delete Supplier Purchase", 
            "This supplier purchase has already added inventory. Deleting it will also remove the inventory added by this purchase. Do you want to continue?", 
            "Delete", 
            proceedDeletion
        );
    } else {
        requestUserConfirmation(
            "Delete Supplier Purchase", 
            "Are you sure you want to delete this pending supplier purchase?", 
            "Delete", 
            proceedDeletion
        );
    }
}

function openApPaymentModal(id) {
    const bill = bnplRecords.find(b => b.id === id);
    if(!bill) return;
    const currentPaid = bill.amountPaid || 0;
    const bal = bill.totalAmount - currentPaid;

    document.getElementById('ap-pay-id').value = bill.id;
    document.getElementById('ap-pay-supplier').innerText = bill.supplierName;
    document.getElementById('ap-pay-balance').innerText = `₱ ${bal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    document.getElementById('ap-pay-amount').value = bal.toFixed(2);

    openModal('ap-payment-modal');
}

function saveApPayment(e) {
    e.preventDefault();
    const id = document.getElementById('ap-pay-id').value;
    const payVal = parseFloat(document.getElementById('ap-pay-amount').value) || 0;

    const bill = bnplRecords.find(b => b.id === id);
    if(bill) {
        const currentPaid = bill.amountPaid || 0;
        const bal = bill.totalAmount - currentPaid;
        if (payVal > bal + 0.01) {
            showToast("Payment cannot exceed outstanding balance", "error");
            return;
        }

        if(!bill.payments) bill.payments = [];
        bill.payments.push({
            amount: payVal,
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        });

        bill.amountPaid = currentPaid + payVal;
        const newBal = bill.totalAmount - bill.amountPaid;

        if (newBal <= 0.01) bill.status = 'fully_paid';
        else bill.status = 'partially_paid';

        saveBnpl();
        closeModal('ap-payment-modal');
        renderBnplUI();
        showToast("AP payment successfully updated", "success");
    }
}

function viewPaymentHistory(id) {
    const bill = bnplRecords.find(b => b.id === id);
    if(!bill) return;

    document.getElementById('history-supplier-name').innerText = bill.supplierName;
    document.getElementById('history-invoice-number').innerText = bill.invoiceNumber || 'N/A';
    document.getElementById('history-total-purchase').innerText = `₱ ${bill.totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`;

    const container = document.getElementById('payment-logs-container');
    if (!container) return;
    container.innerHTML = '';

    const payments = bill.payments || [];
    if(payments.length === 0) {
        container.innerHTML = `<p class="text-xs text-slate-400 font-bold text-center py-4">No payments recorded yet.</p>`;
    } else {
        payments.forEach(p => {
            container.innerHTML += `
                <div class="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                    <span class="text-slate-500 font-medium">${p.date}</span>
                    <span class="font-black text-emerald-600 dark:text-emerald-400">₱ ${p.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                </div>
            `;
        });
    }
    openModal('payment-history-modal');
}

function receiveSupplierStockBatch(id) {
    const bill = bnplRecords.find(b => b.id === id);
    if(!bill || bill.isReceived) return;

    commitBatchItemsToInventory(bill.items);
    bill.isReceived = true;
    bill.receivedDate = new Date().toISOString();
    saveBnpl();
    renderBnplUI();
    showToast("Active inventory updated", "success");
}

function setBnplHistoryFilter(f) {
    currentApFilter = f;
    document.querySelectorAll('[data-ap-btn]').forEach(btn => {
        if(btn.dataset.apBtn === f) {
            btn.className = "flex-1 sm:flex-none px-2.5 py-1.5 rounded bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white uppercase tracking-wider font-bold";
        } else {
            btn.className = "flex-1 sm:flex-none px-2.5 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider font-bold";
        }
    });
    renderBnplTable();
}

function getSortedBnplRecords() {
    let filtered = [...bnplRecords];
    if(currentApFilter === 'unpaid') filtered = filtered.filter(b => b.status === 'unpaid');
    else if(currentApFilter === 'partial') filtered = filtered.filter(b => b.status === 'partially_paid');
    else if(currentApFilter === 'paid') filtered = filtered.filter(b => b.status === 'fully_paid');

    filtered.sort((a, b) => {
        // DEFAULT BEHAVIOR: Unpaid supplier purchases always appear first
        const aUnpaid = a.status !== 'fully_paid' ? 0 : 1;
        const bUnpaid = b.status !== 'fully_paid' ? 0 : 1;
        if (aUnpaid !== bUnpaid) {
            return aUnpaid - bUnpaid;
        }

        // Apply multi-column sorting within unpaid / paid sections
        if (bnplSortStack.length > 0) {
            for (let sortObj of bnplSortStack) {
                const { col, dir } = sortObj;
                const dirMod = dir === 'asc' ? 1 : -1;
                let diff = 0;

                if (col === 'supplier') diff = a.supplierName.localeCompare(b.supplierName);
                else if (col === 'date') diff = new Date(a.purchaseDate || 0) - new Date(b.purchaseDate || 0);
                else if (col === 'product') {
                    const strA = a.items.map(i => i.itemName).join(', ');
                    const strB = b.items.map(i => i.itemName).join(', ');
                    diff = strA.localeCompare(strB);
                }
                else if (col === 'financials') diff = (a.totalAmount || 0) - (b.totalAmount || 0);
                else if (col === 'status') diff = a.status.localeCompare(b.status);

                if (diff !== 0) return diff * dirMod;
            }
        }

        // Default secondary sort: newest first
        return new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0);
    });

    return filtered;
}

function renderBnplTable() {
    const list = document.getElementById('bnpl-list');
    if(!list) return; list.innerHTML = '';

    const filtered = getSortedBnplRecords();

    if(filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-slate-400 font-bold"><i data-lucide="truck" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>No supplier purchases recorded.</td></tr>`;
        initIcons(); return;
    }

    filtered.forEach(b => {
        let statusLabel = '';
        if(b.status === 'fully_paid') statusLabel = `<span class="inline-block bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Fully Paid</span>`;
        else if(b.status === 'partially_paid') statusLabel = `<span class="inline-block bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Partial</span>`;
        else statusLabel = `<span class="inline-block bg-rose-100 dark:bg-rose-500/20 text-rose-800 dark:text-rose-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Unpaid</span>`;

        const unpaidBal = b.totalAmount - (b.amountPaid || 0);
        const dueDateStr = b.dueDate || 'N/A';

        const itemsStr = b.items.map(item => `
            <div class="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                • ${item.qty}x ${item.itemName} <span class="text-slate-400 text-[10px]">(₱ ${item.costPerPiece.toFixed(2)}/pc)</span>
            </div>
        `).join('');

        let receivedAction = '';
        if(b.isReceived) {
            const rDate = b.receivedDate ? new Date(b.receivedDate).toLocaleDateString() : '';
            receivedAction = `<div class="flex flex-col items-center"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg"><i data-lucide="package-check" class="w-3 h-3"></i> Stocks Loaded</span><span class="text-[9px] text-slate-400 mt-0.5">${rDate}</span></div>`;
        } else {
            receivedAction = `<button onclick="receiveSupplierStockBatch('${b.id}')" title="Load Quantities to Inventory" class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800/30 btn-transition flex items-center gap-1"><i data-lucide="download-cloud" class="w-3.5 h-3.5"></i> Receive Stocks</button>`;
        }

        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-black text-slate-900 dark:text-white text-xs">${b.supplierName}</div>
                    <div class="text-[10px] font-bold text-slate-400 mt-0.5">Batch: ${b.invoiceNumber || 'N/A'}</div>
                </td>
                <td class="py-3 px-3 text-xs">
                    <div class="text-slate-500">Pur: ${b.purchaseDate}</div>
                    <div class="text-rose-500 font-semibold mt-0.5">Due: ${dueDateStr}</div>
                </td>
                <td class="py-3 px-3 min-w-[150px]">${itemsStr}</td>
                <td class="py-3 px-3 text-right">
                    <div class="font-black text-slate-800 dark:text-white">Total: ₱ ${b.totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                    <div class="text-[10px] text-emerald-600 font-bold mt-0.5">Paid: ₱ ${(b.amountPaid || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                    <div class="text-[10px] text-rose-500 font-bold mt-0.5">Bal: ₱ ${unpaidBal.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
                </td>
                <td class="py-3 px-3 text-center">
                    <div class="flex flex-col items-center gap-1.5">
                        ${statusLabel}
                        ${receivedAction}
                    </div>
                </td>
                <td class="py-3 px-4 text-right whitespace-nowrap">
                    <div class="flex items-center justify-end gap-1.5">
                        ${unpaidBal > 0.01 ? `<button onclick="openApPaymentModal('${b.id}')" title="Record AP Payment Balance" class="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 rounded-lg border border-emerald-100 dark:border-emerald-800/30 btn-transition"><i data-lucide="coins" class="w-4 h-4"></i></button>` : ''}
                        <button onclick="viewPaymentHistory('${b.id}')" title="View Payment History" class="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-lg border border-indigo-100 dark:border-indigo-800/30 btn-transition"><i data-lucide="eye" class="w-4 h-4"></i></button>
                        <button onclick="openSupplierPurchaseEdit('${b.id}')" title="Modify Invoice Fields" class="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg btn-transition"><i data-lucide="edit" class="w-4 h-4"></i></button>
                        <button onclick="deleteSupplierPurchase('${b.id}')" title="Delete Invoice Record" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg btn-transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }); initIcons();
}

function renderBnplUI() {
    renderBnplTable();
    renderBatchMatrixTable();

    let pool = 0;
    orders.forEach(o => {
        if(o.status !== 'cancelled') pool += (o.amountPaid || 0);
    });

    let totalApPaid = 0;
    let totalApUnpaid = 0;

    bnplRecords.forEach(b => {
        totalApPaid += (b.amountPaid || 0);
        totalApUnpaid += (b.totalAmount - (b.amountPaid || 0));
    });

    const liquidSafe = pool - totalApPaid;
    
    const poolEl = document.getElementById('cashflow-liquid-pool');
    const unpaidEl = document.getElementById('cashflow-unpaid-bnpl');
    const paidEl = document.getElementById('cashflow-paid-bnpl');

    if(poolEl) poolEl.innerText = liquidSafe.toLocaleString(undefined, {minimumFractionDigits: 2});
    if(unpaidEl) unpaidEl.innerText = totalApUnpaid.toLocaleString(undefined, {minimumFractionDigits: 2});
    if(paidEl) paidEl.innerText = totalApPaid.toLocaleString(undefined, {minimumFractionDigits: 2});
}

function renderBatchMatrixTable() {
    const list = document.getElementById('batch-matrix-list');
    if(!list) return; list.innerHTML = '';

    let productMap = {};
    
    stockHistory.forEach(sh => {
        let name = sh.productName;
        if(!productMap[name]) productMap[name] = { spent: 0, sold: 0 };
        productMap[name].spent += (sh.totalCost || 0);
    });

    orders.forEach(o => {
        if(o.status === 'cancelled') return;
        getOrderItems(o).forEach(i => {
            let name = i.name;
            if(!productMap[name]) productMap[name] = { spent: 0, sold: 0 };
            productMap[name].sold += (i.effectiveTotal || 0);
        });
    });

    let entries = Object.keys(productMap);
    if(entries.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="py-8 text-center text-slate-400 font-bold">No inventory or sales context logged yet.</td></tr>`;
        return;
    }

    entries.forEach(name => {
        let spent = productMap[name].spent;
        let sold = productMap[name].sold;
        let profit = sold - spent;

        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-5 font-bold text-slate-900 dark:text-white">${name}</td>
                <td class="py-3 px-4 text-right font-semibold text-amber-600 dark:text-amber-400">₱ ${spent.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="py-3 px-4 text-right font-semibold text-indigo-600 dark:text-indigo-400">₱ ${sold.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="py-3 px-5 text-right font-black ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}">₱ ${profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            </tr>
        `;
    });
}

// ================= EXPORT & RECEIPT =================
function generateReceipt(orderId) {
    const order = orders.find(o => o.id === orderId); if (!order) return;
    const paidVal = order.amountPaid !== undefined ? order.amountPaid : (order.isPaid ? order.totalRevenue : 0);
    const statusLine = order.status === 'cancelled' ? 'VOID/CANCELLED' : (order.isPaid ? 'FULLY PAID' : (paidVal > 0 ? `PARTIAL (₱ ${(order.totalRevenue - paidVal).toFixed(2)} Bal)` : 'UNPAID'));
    
    let itemsInvoiceMatrix = '';
    let totalDiscount = 0;
    
    getOrderItems(order).forEach(i => {
        const originalSubtotal = i.qty * (i.sellPrice || 0);
        const itemDiscount = originalSubtotal - (i.effectiveTotal || originalSubtotal);
        totalDiscount += itemDiscount;
        
        itemsInvoiceMatrix += `${i.name.padEnd(16)} x${i.qty.toString().padEnd(2)} ₱ ${originalSubtotal.toFixed(2).padStart(8)}\n`;
        if (itemDiscount > 0.01) {
            itemsInvoiceMatrix += `  Discount:         -₱ ${itemDiscount.toFixed(2).padStart(8)}\n`;
        }
    });

    const receiptEl = document.getElementById('receipt-text');
    if (receiptEl) {
        receiptEl.innerText = `================================\n      CHEOREOBIZ INVOICE\n================================\nDate: ${order.date || "N/A"}\nTxn : ${order.id}\n${order.isEdited ? '(Invoice reflects edited items)\n' : ''}Billed To: ${order.customerName}\n\nLine Items:\n--------------------------------\n${itemsInvoiceMatrix}--------------------------------\nSubtotal:           ₱ ${(order.totalRevenue + totalDiscount).toFixed(2).padStart(10)}\nTotal Discount:    -₱ ${totalDiscount.toFixed(2).padStart(10)}\nGrand Total:        ₱ ${order.totalRevenue.toFixed(2).padStart(10)}\nAmount Paid:        ₱ ${paidVal.toFixed(2).padStart(10)}\nBalance Due:        ₱ ${(order.totalRevenue - paidVal).toFixed(2).padStart(10)}\n--------------------------------\nPayment:  ${statusLine}\nDelivery: ${order.isReceived ? 'Fulfilled' : 'Pending'}\n\nThank you for your business!\n================================`;
    }
    openModal('receipt-modal');
}

function copyReceiptToClipboard() { 
    const textEl = document.getElementById('receipt-text');
    if (!textEl) return;
    navigator.clipboard.writeText(textEl.innerText).then(() => { 
        showToast("Receipt copied", "success"); 
        closeModal('receipt-modal'); 
    }); 
}

function exportToCSV() {
    if (orders.length === 0) { showToast("No records to export", "error"); return; }
    let csv = "data:text/csv;charset=utf-8,Date,ReceiptID,Customer,ItemsSummary,TotalRevenue,TotalCost,TotalProfit,Paid,Status,Delivery,Edited\r\n";
    orders.forEach(o => { 
        const itemsSummaryLine = getOrderItems(o).map(i => `${i.qty}x${i.name}`).join(' | ');
        csv += `"${o.date||'N/A'}","${o.id}","${o.customerName.replace(/"/g, '""')}","${itemsSummaryLine.replace(/"/g, '""')}",${o.totalRevenue},${o.totalCost},${o.totalProfit},${o.amountPaid||0},${o.status === 'cancelled' ? 'Cancelled' : (o.isPaid ? 'Paid' : 'Due')},${o.isReceived ? 'Delivered' : 'Pending'},${o.isEdited?'Yes':'No'}\r\n`; 
    });
    const a = document.createElement("a"); a.href = encodeURI(csv); a.download = `cheoreobiz_report_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(a); a.click(); a.remove();
}

function exportData() {
    const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ inventory, orders, bundles, stockHistory, activityLog, bnplRecords }, null, 2));
    a.download = `cheoreobiz_backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.remove(); showToast("Backup downloaded", "success");
}

// ================= SUMMARY / STATS KPI LOGIC =================
function renderSummary() {
    let revenue = 0; let profit = 0; let totalSpent = 0;
    let completedOrdersCount = 0; 
    let completedOrdersTotalValue = 0;

    let validOrders = orders.filter(o => o.status !== 'cancelled' && isWithinTimeframe(o.date, dashboardTimeframe));
    validOrders.forEach(o => { 
        revenue += o.totalRevenue; 
        if (o.isPaid === true && o.isReceived === true) {
            completedOrdersCount++; 
            completedOrdersTotalValue += o.totalRevenue;
            if (o.totalProfit !== undefined) {
                profit += o.totalProfit;
            } else {
                profit += (o.totalRevenue - (o.totalCost || 0));
            }
        }
    });

    let pendingBalance = 0;
    orders.forEach(o => { if(o.status !== 'cancelled') pendingBalance += (o.totalRevenue - (o.amountPaid || 0)); });

    let activeStockHistory = stockHistory.filter(sh => isWithinTimeframe(sh.date, dashboardTimeframe));
    activeStockHistory.forEach(sh => totalSpent += (sh.totalCost || 0));

    let inventoryVal = 0;
    let expectedSalesVal = 0;
    let expectedProfitVal = 0;
    let totalProductsCount = inventory.length;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    inventory.forEach(i => {
        const currentStock = i.stockQty || 0;
        const avgCPP = i.unitCost || 0;
        const price = i.sellPrice || 0;

        inventoryVal += currentStock * avgCPP;
        expectedSalesVal += currentStock * price;
        expectedProfitVal += currentStock * (price - avgCPP);

        if(currentStock <= 0) outOfStockCount++;
        else if(currentStock <= 3) lowStockCount++;
    });

    const revEl = document.getElementById('summary-revenue');
    const profEl = document.getElementById('summary-profit');
    const roiEl = document.getElementById('summary-roi');
    const completedOrdersEl = document.getElementById('summary-completed-orders');
    const completedValueEl = document.getElementById('summary-completed-value-display');
    const apBalEl = document.getElementById('stat-pending-balance');

    const dValueEl = document.getElementById('dash-inv-value');
    const dSpentEl = document.getElementById('dash-money-spent');
    const dExpectedSalesEl = document.getElementById('dash-exp-sales');
    const dExpectedProfitEl = document.getElementById('dash-exp-profit');

    const totalProdEl = document.getElementById('dash-total-products');
    const lowStockEl = document.getElementById('dash-low-stock');
    const outStockEl = document.getElementById('dash-out-stock');

    if(revEl) revEl.innerText = revenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    if(profEl) profEl.innerText = profit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    if(apBalEl) apBalEl.innerText = pendingBalance.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});

    if (roiEl) {
        const spentDivisor = totalSpent || inventoryVal;
        const roi = spentDivisor > 0 ? (profit / spentDivisor) * 100 : 0;
        roiEl.innerText = `${roi.toFixed(1)}% ROI`;
    }

    if (completedOrdersEl) {
        completedOrdersEl.innerText = `${completedOrdersCount} Completed Orders`;
    }
    if (completedValueEl) {
        completedValueEl.innerText = completedOrdersTotalValue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2});
    }

    if(dValueEl) dValueEl.innerText = inventoryVal.toLocaleString(undefined, {minimumFractionDigits: 2});
    if(dSpentEl) dSpentEl.innerText = totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2});
    if(dExpectedSalesEl) dExpectedSalesEl.innerText = expectedSalesVal.toLocaleString(undefined, {minimumFractionDigits: 2});
    if(dExpectedProfitEl) dExpectedProfitEl.innerText = expectedProfitVal.toLocaleString(undefined, {minimumFractionDigits: 2});

    if(totalProdEl) totalProdEl.innerText = totalProductsCount;
    if(lowStockEl) lowStockEl.innerText = lowStockCount;
    if(outStockEl) outStockEl.innerText = outOfStockCount;
}
