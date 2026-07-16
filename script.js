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
let currentSort = 'newest';
let currentOrderTab = 'active'; 
let dashboardTimeframe = 'all';
let ordersPerPage = 10;
let currentOrdersPage = 1;

let draftBundleItems = [];
let editingBundleId = null;
let editOrderTempItem = null;
let isMobileCartExpanded = false; 

// Internal Supplier Batch State
let currentBatchItems = [];
let currentApFilter = 'all';

// Global layout action listeners
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

    // Click outside bindings for Batch entry
    const bItemInput = document.getElementById('batch-item-search');
    const bItemDropdown = document.getElementById('batch-item-dropdown');
    if(bItemInput && bItemDropdown && !bItemInput.contains(e.target) && !bItemDropdown.contains(e.target)) {
        bItemDropdown.classList.add('hidden');
    }

    // Click outside bindings for calculator wrapper
    const calcPopup = document.getElementById('calculator-popup');
    const calcWrapper = document.getElementById('calculator-wrapper');
    if(calcPopup && !calcPopup.classList.contains('hidden') && calcWrapper && !calcWrapper.contains(e.target) && !e.target.closest('button[title="Quick Calculator"]') && !e.target.closest('button[title="Quick Calc"]')) {
        toggleCalculator(false);
    }
});

// Set default date inputs
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

function openModal(id) {
    const modal = document.getElementById(id);
    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95');
    }, 10);
}

function closeModal(id) {
    const modal = document.getElementById(id);
    modal.classList.add('opacity-0');
    modal.querySelector('div').classList.add('scale-95');
    setTimeout(() => modal.classList.add('hidden'), 200);
}

function logActivity(type, message) {
    const timestamp = Date.now();
    activityLog.unshift({
        id: 'act-' + timestamp,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        type, message, timestamp
    });
    if (activityLog.length > 50) activityLog.pop();
}

// ================= FLOATING HEADER CALCULATOR ENGINE =================
function toggleCalculator(show) {
    const popup = document.getElementById('calculator-popup');
    if(!popup) return;
    if(show) {
        popup.classList.remove('hidden');
        setTimeout(() => { popup.classList.remove('opacity-0'); document.getElementById('calculator-wrapper').classList.remove('scale-95'); }, 10);
    } else {
        popup.classList.add('opacity-0');
        document.getElementById('calculator-wrapper').classList.add('scale-95');
        setTimeout(() => popup.classList.add('hidden'), 200);
    }
}

function pressCalc(val) {
    const screen = document.getElementById('calc-screen');
    if(!screen) return;
    if(val === 'C') { screen.value = '0'; }
    else if(val === '=') {
        try {
            let expr = screen.value.replace(/[^0-9\+\-\*\.\/]/g, '');
            if(!expr) return;
            let result = new Function(`return (${expr})`)();
            screen.value = Number(result).toString();
        } catch(e) { screen.value = 'Error'; }
    } else {
        if(screen.value === '0' || screen.value === 'Error') screen.value = val;
        else screen.value += val;
    }
}

function toggleMobileCart(forceExpand = null) {
    if (window.innerWidth >= 1280) return; 
    const panel = document.getElementById('current-cart-panel');
    const chevron = document.getElementById('mobile-cart-chevron');
    const backdrop = document.getElementById('cart-backdrop');
    
    if (forceExpand !== null) isMobileCartExpanded = forceExpand;
    else isMobileCartExpanded = !isMobileCartExpanded;
    
    if (isMobileCartExpanded) {
        panel.classList.remove('translate-y-[calc(100%-56px)]');
        panel.classList.add('translate-y-0');
        if (chevron) chevron.classList.add('rotate-180');
        if (backdrop) { backdrop.classList.remove('hidden'); setTimeout(() => backdrop.classList.add('opacity-100'), 10); }
    } else {
        panel.classList.remove('translate-y-0');
        panel.classList.add('translate-y-[calc(100%-56px)]');
        if (chevron) chevron.classList.remove('rotate-180');
        if (backdrop) { backdrop.classList.remove('opacity-100'); setTimeout(() => backdrop.classList.add('hidden'), 300); }
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

function handleLogout() { if(confirm("Log out of your session?")) auth.signOut().then(() => window.location.reload()); }

// ================= DATABASE WRAPPERS =================
function saveInventory() { db.ref('inventory').set(inventory); }
function saveOrders() { db.ref('orders').set(orders); }
function saveBundles() { db.ref('bundles').set(bundles); }
function saveActivityLog() { db.ref('activityLog').set(activityLog); }
function saveStockHistory() { db.ref('stockHistory').set(stockHistory); }
function saveBnpl() { db.ref('bnplRecords').set(bnplRecords); }

// ================= FIREBASE REALTIME SYNC =================
function startRealtimeSync() {
    db.ref('inventory').on('value', snapshot => { const data = snapshot.val(); inventory = data ? Object.values(data) : []; renderUI(); });
    db.ref('orders').on('value', snapshot => { const data = snapshot.val(); orders = data ? Object.values(data) : []; orders.forEach(o => { if(!o.status) o.status = 'active'; }); renderUI(); });
    
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

    db.ref('activityLog').on('value', snapshot => { const data = snapshot.val(); activityLog = data ? Object.values(data) : []; renderActivityLog(); });
    db.ref('stockHistory').on('value', snapshot => { 
        const data = snapshot.val(); 
        stockHistory = data ? Object.values(data) : []; 
        if(document.getElementById('stock-history-modal') && !document.getElementById('stock-history-modal').classList.contains('hidden')) { renderStockHistory(); } 
        renderSummary(); 
        renderBatchMatrixTable();
    });
}

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
    if (localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
    updateThemeIcons();
}

function toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) { html.classList.remove('dark'); localStorage.setItem('theme', 'light'); } 
    else { html.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    updateThemeIcons();
}

function updateThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    const iconName = isDark ? 'sun' : 'moon';
    const deskIcon = document.getElementById('theme-icon');
    const mobIcon = document.querySelector('.theme-icon-mobile');
    if (deskIcon) { deskIcon.setAttribute('data-lucide', iconName); lucide.createIcons({attrs:{class:['w-4','h-4']}}); }
    if (mobIcon) { mobIcon.setAttribute('data-lucide', iconName); lucide.createIcons(); }
}

function switchTab(tabId) {
    document.querySelectorAll('[data-tab-content]').forEach(sec => {
        if(sec.dataset.tabContent === tabId) { sec.classList.remove('hidden'); sec.classList.add('block', 'animate-fade-in'); } 
        else { sec.classList.add('hidden'); sec.classList.remove('block', 'animate-fade-in'); }
    });
    document.querySelectorAll('[data-tab-btn]').forEach(btn => {
        if (btn.dataset.tabBtn === tabId) { btn.classList.add('tab-active'); btn.classList.remove('text-slate-500', 'hover:bg-slate-100', 'dark:hover:bg-slate-800'); } 
        else { btn.classList.remove('tab-active'); btn.classList.add('text-slate-500', 'hover:bg-slate-100', 'dark:hover:bg-slate-800'); }
    });
    if (tabId === 'orders') { renderPOSCatalog(); toggleMobileCart(false); }
    if (tabId === 'bundles') renderBundlesTable(); 
    if (tabId === 'bnpl') renderBnplUI();
}

// ================= DASHBOARD LOGIC =================
function setDashboardTimeframe(tf) {
    dashboardTimeframe = tf;
    document.querySelectorAll('[data-timeframe]').forEach(btn => {
        if(btn.dataset.timeframe === tf) { btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); btn.classList.remove('text-slate-500'); } 
        else { btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); btn.classList.add('text-slate-500'); }
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

function renderSummary() {
    let rev = 0, cost = 0, profit = 0, debt = 0;
    orders.forEach(o => {
        if(o.status === 'cancelled') return; 
        const paid = o.amountPaid || 0; 
        debt += (o.totalRevenue - paid);
        if (isWithinTimeframe(o.date, dashboardTimeframe)) { rev += o.totalRevenue; cost += o.totalCost; profit += o.totalProfit; }
    });
    
    let inventoryValue = 0;
    let expectedSales = 0;
    let totalRemaining = 0, lowStock = 0, outOfStock = 0;
    
    inventory.forEach(i => {
        inventoryValue += (i.stockQty * (i.unitCost || 0));
        expectedSales += (i.stockQty * (i.sellPrice || 0));
        
        totalRemaining += i.stockQty;
        if(i.stockQty <= 0) outOfStock++;
        else if(i.stockQty <= 3) lowStock++;
    });

    let expectedProfit = expectedSales - inventoryValue;
    let moneySpent = 0;
    stockHistory.forEach(sh => { moneySpent += sh.totalCost; });

    document.getElementById('summary-revenue').innerText = rev.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('summary-profit').innerText = profit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('summary-roi').innerText = `${cost > 0 ? ((profit/cost)*100).toFixed(0) : 0}% ROI`;
    document.getElementById('stat-pending-balance').innerText = debt.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    
    document.getElementById('dash-inv-value').innerText = inventoryValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('dash-money-spent').innerText = moneySpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('dash-exp-sales').innerText = expectedSales.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    document.getElementById('dash-exp-profit').innerText = expectedProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});

    document.getElementById('dash-total-products').innerText = inventory.length;
    document.getElementById('dash-low-stock').innerText = lowStock;
    document.getElementById('dash-out-stock').innerText = outOfStock;
}

function openFinancialModal(type) {
    const list = document.getElementById('details-modal-list');
    const head = document.getElementById('details-modal-head');
    list.innerHTML = '';
    let title = ''; let icon = '';

    if(type === 'revenue' || type === 'profit') {
        let timeFilteredOrders = orders.filter(o => o.status !== 'cancelled' && isWithinTimeframe(o.date, dashboardTimeframe));
        title = type === 'revenue' ? `Gross Sales Details (${dashboardTimeframe})` : `Net Profit Details (${dashboardTimeframe})`;
        icon = type === 'revenue' ? 'trending-up' : 'piggy-bank';
        
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Date & ID</th>
                <th class="py-3 px-3 sm:px-4">Item & Qty</th>
                <th class="py-3 px-3 sm:px-4 text-right">Revenue</th>
                <th class="py-3 px-3 sm:px-4 text-right">Profit</th>
            </tr>
        `;

        if(timeFilteredOrders.length === 0) list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold">No sales data for this timeframe.</td></tr>`;
        timeFilteredOrders.forEach(o => {
            list.innerHTML += `
                <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td class="py-3 px-4 sm:px-5"><div class="font-bold text-slate-900 dark:text-white">${o.id}</div><div class="text-[10px] text-slate-500 mt-0.5">${o.date}</div></td>
                    <td class="py-3 px-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300">${o.orderQty}x ${o.itemName}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400">₱ ${o.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                    <td class="py-3 px-3 sm:px-4 text-right font-black text-emerald-600 dark:text-emerald-400">₱ ${o.totalProfit.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</td>
                </tr>
            `;
        });
    } else if (type === 'outstanding') {
        title = 'Outstanding Balances'; icon = 'clock-4';
        
        head.innerHTML = `
            <tr class="text-slate-500 text-[10px] font-black tracking-wider text-left uppercase">
                <th class="py-3 px-4 sm:px-5">Customer & ID</th>
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
    
    const list = document.getElementById('dash-modal-list'); list.innerHTML = '';
    if (filtered.length === 0) {
        list.innerHTML = `<tr><td colspan="4" class="py-12 text-center text-slate-400 font-bold"><i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 opacity-50"></i>No products to show.</td></tr>`;
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

// ================= INVENTORY LOGIC =================
const itemNameInput = document.getElementById('item-name');
const customDropdown = document.getElementById('custom-dropdown');

function showDropdown() {
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

function calcStockCost() {
    let qty = parseFloat(document.getElementById('stock-qty-added').value) || 0;
    let cost = parseFloat(document.getElementById('stock-cost-per-item').value) || 0;
    document.getElementById('stock-total-cost').innerText = `₱ ${(qty * cost).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function handleStockSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('item-name').value.trim();
    const qtyAdded = parseInt(document.getElementById('stock-qty-added').value);
    const costPerItem = parseFloat(document.getElementById('stock-cost-per-item').value);
    const sellPrice = parseFloat(document.getElementById('sell-price').value);
    const fileInput = document.getElementById('item-image-file');

    if (fileInput.files && fileInput.files[0]) {
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
                commitStockBatch(name, qtyAdded, costPerItem, sellPrice, canvas.toDataURL('image/jpeg', 0.8));
            }
            img.src = event.target.result;
        }
        reader.readAsDataURL(fileInput.files[0]);
    } else commitStockBatch(name, qtyAdded, costPerItem, sellPrice, null);
}

function commitStockBatch(name, qtyAdded, costPerItem, sellPrice, base64Image) {
    const totalCost = qtyAdded * costPerItem;

    const historyEntry = {
        id: 'SH-' + Date.now().toString().slice(-6),
        productName: name,
        qtyAdded: qtyAdded,
        costPerItem: costPerItem,
        totalCost: totalCost,
        date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    };
    stockHistory.unshift(historyEntry);

    const existingIndex = inventory.findIndex(item => item.name.toLowerCase() === name.toLowerCase());

    if (existingIndex > -1) {
        const existing = inventory[existingIndex];
        const totalStockCount = existing.stockQty + qtyAdded;
        
        const existingTotalValue = existing.stockQty * (existing.unitCost || 0);
        const newTotalValue = existingTotalValue + totalCost;
        const weightedCost = totalStockCount > 0 ? (newTotalValue / totalStockCount) : costPerItem;

        existing.stockQty = totalStockCount;
        existing.unitCost = weightedCost;
        existing.sellPrice = sellPrice;
        if(base64Image) existing.image = base64Image;
        
        logActivity('stock_adj', `Added ${qtyAdded} units to existing stock: ${name}`);
        showToast("Stock merged and updated", "success");
    } else {
        inventory.push({ 
            id: Date.now().toString(), 
            name, 
            unitCost: costPerItem, 
            sellPrice, 
            stockQty: qtyAdded, 
            image: base64Image 
        });
        logActivity('stock_adj', `Registered new product batch: ${name}`);
        showToast("New product registered", "success");
    }
    saveInventory();
    saveStockHistory();
    saveActivityLog();
    
    document.getElementById('stock-form').reset();
    document.getElementById('stock-total-cost').innerText = '₱ 0.00';
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
    document.getElementById('edit-stock-cost').value = item.unitCost || 0;
    document.getElementById('edit-stock-price').value = item.sellPrice || 0;
    document.getElementById('edit-stock-image-file').value = ''; 
    openModal('stock-modal');
}

function saveStockEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-stock-id').value;
    const name = document.getElementById('edit-stock-name').value.trim();
    const qty = parseInt(document.getElementById('edit-stock-qty').value);
    const cost = parseFloat(document.getElementById('edit-stock-cost').value);
    const price = parseFloat(document.getElementById('edit-stock-price').value);
    const fileInput = document.getElementById('edit-stock-image-file');

    const item = inventory.find(i => i.id === id);
    if (item) {
        let requiresOrderUpdate = false;
        if(item.name !== name) {
            orders.forEach(o => { if(o.itemName === item.name) o.itemName = name; });
            requiresOrderUpdate = true;
        }
        const qtyDiff = qty - item.stockQty;
        item.name = name; item.stockQty = qty; item.sellPrice = price; item.unitCost = cost;
        
        const completeSave = () => {
            logActivity('stock_adj', `Manually edited details for ${name} ${qtyDiff !== 0 ? `(Diff: ${qtyDiff > 0 ? '+'+qtyDiff : qtyDiff})` : ''}`);
            saveInventory();
            saveActivityLog();
            if(requiresOrderUpdate) saveOrders();
            showToast("Product updated", "success"); 
            closeModal('stock-modal');
        };

        if (fileInput.files && fileInput.files[0]) {
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

function renderInventoryTable() {
    const list = document.getElementById('inventory-list'); 
    if(!list) return; list.innerHTML = '';
    
    if(inventory.length === 0) { 
        list.innerHTML = `<tr><td colspan="5" class="py-12 text-center text-slate-400"><i data-lucide="package-open" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm font-bold">Stock room is empty</p></td></tr>`; 
        initIcons(); return; 
    }
    
    inventory.forEach(item => {
        let detailBlock = '';
        if (item.image) detailBlock = `<div class="flex items-center gap-3"><img src="${item.image}" class="w-10 h-10 object-cover rounded-xl shadow-sm border border-slate-200/50 dark:border-slate-700/50 flex-shrink-0"><div class="flex flex-col"><span class="font-bold text-slate-900 dark:text-white max-w-[150px] truncate">${item.name}</span></div></div>`;
        else detailBlock = `<div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-sm flex-shrink-0 border border-indigo-100 dark:border-indigo-800/50">${item.name.substring(0,2).toUpperCase()}</div><div class="flex flex-col"><span class="font-bold text-slate-900 dark:text-white max-w-[150px] truncate">${item.name}</span></div></div>`;

        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4 sm:px-5 whitespace-nowrap">${detailBlock}</td>
                <td class="py-3 px-3 sm:px-4 text-center">
                    <span class="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black tracking-wide ${item.stockQty <= 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' : (item.stockQty <= 3 ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300')} border ${item.stockQty <= 0 ? 'border-rose-200 dark:border-rose-800/30' : (item.stockQty <= 3 ? 'border-amber-200 dark:border-amber-800/30' : 'border-slate-200 dark:border-slate-700/50')}">${item.stockQty} pcs</span>
                </td>
                <td class="py-3 px-3 sm:px-4 text-right text-slate-500 font-semibold tracking-tight">₱ ${(item.unitCost || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400 tracking-tight">₱ ${(item.sellPrice || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="py-3 px-4 sm:px-5 text-right"><div class="flex items-center justify-end gap-1.5 sm:gap-2"><button onclick="addToCart('${item.id}'); switchTab('orders');" title="Sell" class="p-2 sm:p-2.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 rounded-xl transition-colors border border-indigo-100 dark:border-indigo-800/30 shadow-sm btn-transition min-h-[36px] min-w-[36px] flex items-center justify-center"><i data-lucide="plus" class="w-4 h-4"></i></button><button onclick="editStock('${item.id}')" title="Edit" class="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors btn-transition border border-transparent hover:border-slate-200 dark:hover:border-slate-600 min-h-[36px] min-w-[36px] flex items-center justify-center"><i data-lucide="edit-2" class="w-4 h-4"></i></button></div></td>
            </tr>
        `;
    });
}

// ================= BUNDLES & PROMOS LOGIC =================
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
    const list = document.getElementById('draft-bundle-list'); list.innerHTML = '';
    draftBundleItems.forEach((d, i) => {
        list.innerHTML += `<div class="flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-600"><span>${d.qty}x ${d.name}</span><button type="button" onclick="removeDraftBundleItem(${i})" class="text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 rounded-md btn-transition"><i data-lucide="x" class="w-3.5 h-3.5"></i></button></div>`;
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
        bundles[index] = { ...bundles[index], type, name, price, items: draftBundleItems };
        showToast("Promo updated", "success"); cancelBundleEdit();
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

function toggleBundleStatus(id) { const bundle = bundles.find(b => b.id === id); if(bundle) { bundle.isActive = !bundle.isActive; saveBundles(); showToast(bundle.isActive ? "Promo enabled" : "Promo disabled", "info"); } }
function deleteBundle(id) { if(confirm("Permanently delete this promo bundle?")) { bundles = bundles.filter(b => b.id !== id); saveBundles(); showToast("Promo deleted", "success"); } }

function renderBundlesTable() {
    const list = document.getElementById('bundles-list'); if(!list) return; list.innerHTML = '';
    if(bundles.length === 0) { list.innerHTML = `<tr><td colspan="5" class="py-12 text-center"><div class="flex flex-col items-center justify-center text-slate-400"><i data-lucide="tags" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm font-bold">No promos active.</p></div></td></tr>`; initIcons(); return; }

    bundles.forEach(bundle => {
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
        if (possibleApps > 0) {
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
                <div>${imageBlock}<h4 class="font-bold text-xs leading-tight mb-1 text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">${item.name}</h4><span class="text-[10px] font-black uppercase tracking-wider ${outOfStock ? 'text-rose-500' : 'text-slate-500'}">${item.stockQty} in stock</span></div>
                <div class="mt-3 flex items-center justify-between"><span class="text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-tight">₱ ${(item.sellPrice || 0).toLocaleString(undefined, {minimumFractionDigits:2})}</span>${!outOfStock ? `<div class="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-700 group-hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors shadow-sm"><i data-lucide="plus" class="w-4 h-4"></i></div>` : ''}</div>
            </div>
        `;
    }); initIcons();
}

function addToCart(itemId) {
    const item = inventory.find(i => i.id === itemId); if(!item || item.stockQty <= 0) return;
    const cartItem = cart.find(c => c.id === itemId);
    if(cartItem) { if(cartItem.qty + 1 > item.stockQty) { showToast("Max stock reached", "info"); return; } cartItem.qty++; } 
    else cart.push({ id: item.id, name: item.name, sellPrice: item.sellPrice || 0, unitCost: item.unitCost || 0, maxStock: item.stockQty, qty: 1 }); 
    
    renderCart();
    toggleMobileCart(true); 
}

function updateCartQty(id, change) {
    const match = cart.find(c => c.id === id); if(!match) return; match.qty += change;
    if(match.qty <= 0) {
        cart = cart.filter(c => c.id !== id);
        if (cart.length === 0) toggleMobileCart(false); 
    }
    else if(match.qty > match.maxStock) { match.qty = match.maxStock; showToast("Max stock limit reached", "info"); } renderCart();
}

function renderCart() {
    const container = document.getElementById('cart-items-container'); if(!container) return; container.innerHTML = '';
    
    const badgeCountEl = document.getElementById('cart-badge-count');
    const headerTotalEl = document.getElementById('mobile-cart-total-header');

    if(cart.length === 0) {
        container.innerHTML = `<div class="absolute inset-0 flex flex-col items-center justify-center text-slate-400 pointer-events-none"><i data-lucide="shopping-bag" class="w-12 h-12 mb-3 opacity-30"></i><p class="text-[11px] font-black uppercase tracking-wider">Cart is empty</p></div>`;
        document.getElementById('cart-total-display').innerText = '0.00'; 
        if(badgeCountEl) badgeCountEl.classList.add('hidden');
        if(headerTotalEl) headerTotalEl.innerText = '₱ 0.00';
        initIcons(); return;
    }

    const cartCalc = calculateCart();
    
    let totalItemQuantity = cart.reduce((accum, item) => accum + item.qty, 0);
    if (badgeCountEl) {
        badgeCountEl.innerText = totalItemQuantity;
        badgeCountEl.classList.remove('hidden');
    }

    cart.forEach(item => {
        const calcItem = cartCalc.items.find(c => c.id === item.id);
        let priceDisplay = `<span class="text-[11px] font-semibold text-slate-500">₱ ${item.sellPrice.toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;
        if (calcItem.discountedAmount > 0) priceDisplay += `<span class="ml-1.5 text-[10px] font-black text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded shadow-sm border border-emerald-100 dark:border-emerald-800/30">- ₱ ${calcItem.discountedAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</span>`;

        container.innerHTML += `
            <div class="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 shadow-sm transition-all hover:border-indigo-300 dark:hover:border-indigo-600 animate-scale-in">
                <div class="flex flex-col flex-1 min-w-0 mr-3"><span class="font-bold text-slate-900 dark:text-slate-100 truncate text-xs mb-0.5">${item.name}</span><div>${priceDisplay}</div></div>
                <div class="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-100 dark:border-slate-700/50 shadow-inner">
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
    if(headerTotalEl) headerTotalEl.innerText = `₱ ${formattedTotalStr} (${totalItemQuantity} items)`;
    
    if(document.getElementById('pos-paid-full').checked) document.getElementById('pos-paid-amount').value = cartCalc.total.toFixed(2);
    initIcons();
}

function togglePaidFullCheck(cb) {
    const input = document.getElementById('pos-paid-amount');
    if(cb.checked) { input.value = calculateCart().total.toFixed(2); input.disabled = true; input.classList.add('opacity-50', 'bg-slate-100', 'dark:bg-slate-700'); } 
    else { input.value = ''; input.disabled = false; input.classList.remove('opacity-50', 'bg-slate-100', 'dark:bg-slate-700'); }
}

function clearCart() { 
    cart = []; const pf = document.getElementById('pos-paid-full'); const pamt = document.getElementById('pos-paid-amount');
    if(pf) pf.checked = false;
    if(pamt) { pamt.disabled = false; pamt.classList.remove('opacity-50', 'bg-slate-100', 'dark:bg-slate-700'); pamt.value = ''; }
    renderCart(); 
    toggleMobileCart(false);
}

function filterCustomers() {
    const input = document.getElementById('pos-customer'); const dropdown = document.getElementById('customer-dropdown');
    if(!input || !dropdown) return;
    
    const filter = input.value.trim().toLowerCase();
    const uniqueCustomers = [...new Set(orders.map(o => o.customerName))].filter(Boolean);
    dropdown.innerHTML = '';
    
    const matches = uniqueCustomers.filter(c => c.toLowerCase().includes(filter));
    if(matches.length > 0) {
        matches.forEach(c => {
            const row = document.createElement('div');
            row.className = "px-4 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-200 transition-colors";
            row.innerText = c;
            row.onmousedown = () => { input.value = c; dropdown.classList.add('hidden'); };
            dropdown.appendChild(row);
        });
        dropdown.classList.remove('hidden'); dropdown.classList.add('flex');
    } else { dropdown.classList.add('hidden'); dropdown.classList.remove('flex'); }
}

function checkoutCart() {
    const customer = document.getElementById('pos-customer').value.trim();
    if(cart.length === 0) { showToast("Add items to cart first", "error"); return; }
    if(!customer) { showToast("Customer name is required", "error"); document.getElementById('pos-customer').focus(); return; }
    
    const cartCalc = calculateCart();
    const totalVal = cartCalc.total;
    let totalPaid = parseFloat(document.getElementById('pos-paid-amount').value) || 0;
    if(document.getElementById('pos-paid-full').checked) totalPaid = totalVal;

    cartCalc.items.forEach(cartItem => {
        const invItem = inventory.find(i => i.id === cartItem.id); if(!invItem) return;
        invItem.stockQty -= cartItem.qty;
        const rev = cartItem.effectiveTotal, cost = cartItem.qty * cartItem.unitCost;
        const itemPaid = totalVal > 0 ? (totalPaid * (rev / totalVal)) : 0;

        orders.push({
            id: 'ORD-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substr(2,3).toUpperCase(),
            customerName: customer, itemName: cartItem.name, orderQty: cartItem.qty,
            totalRevenue: rev, totalCost: cost, totalProfit: rev - cost,
            amountPaid: itemPaid, isPaid: itemPaid >= rev - 0.01, isReceived: false, status: 'active', isEdited: false,
            date: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
        });
    });
    
    logActivity('sale', `Processed sale of ${cart.length} items to ${customer}`);
    showToast("Sale completed successfully", "success"); clearCart(); document.getElementById('pos-customer').value = ''; 
    
    saveInventory();
    saveOrders();
    saveActivityLog();
    toggleMobileCart(false);
    switchTab('orders');
}

// ================= ORDERS LOGIC =================
function setOrderTab(tab) {
    currentOrderTab = tab;
    const btnActive = document.getElementById('tab-active-orders'), btnCancel = document.getElementById('tab-cancelled-orders'), filters = document.getElementById('active-filters');
    if(tab === 'active') {
        btnActive.classList.replace('text-slate-500', 'bg-white'); btnActive.classList.replace('hover:text-slate-700', 'dark:bg-slate-600'); btnActive.classList.add('shadow-sm', 'text-slate-800', 'dark:text-white');
        btnCancel.classList.replace('bg-white', 'text-slate-500'); btnCancel.classList.replace('dark:bg-slate-600', 'hover:text-slate-700'); btnCancel.classList.remove('shadow-sm', 'text-slate-800', 'dark:text-white');
        if(filters) filters.classList.remove('opacity-50', 'pointer-events-none');
    } else {
        btnCancel.classList.replace('text-slate-500', 'bg-white'); btnCancel.classList.replace('hover:text-slate-700', 'dark:bg-slate-600'); btnCancel.classList.add('shadow-sm', 'text-slate-800', 'dark:text-white');
        btnActive.classList.replace('bg-white', 'text-slate-500'); btnActive.classList.replace('dark:bg-slate-600', 'hover:text-slate-700'); btnActive.classList.remove('shadow-sm', 'text-slate-800', 'dark:text-white');
        if(filters) filters.classList.add('opacity-50', 'pointer-events-none');
    } currentOrdersPage = 1; renderOrdersTable();
}

function changeRowsPerPage() { ordersPerPage = parseInt(document.getElementById('rows-per-page-select').value); currentOrdersPage = 1; renderOrdersTable(); }

function applyOrderFilter(f) { 
    currentFilter = f; currentOrdersPage = 1;
    document.querySelectorAll('[data-filter-btn]').forEach(btn => {
        if(btn.dataset.filterBtn === f) { btn.classList.add('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); btn.classList.remove('text-slate-500'); } 
        else { btn.classList.remove('bg-white', 'dark:bg-slate-700', 'shadow-sm', 'text-slate-800', 'dark:text-white'); btn.classList.add('text-slate-500'); }
    }); renderOrdersTable(); 
}

function applyOrderSorting() { currentSort = document.getElementById('order-sorter').value; currentOrdersPage = 1; renderOrdersTable(); }
function prevOrdersPage() { if (currentOrdersPage > 1) { currentOrdersPage--; renderOrdersTable(); } }
function nextOrdersPage() { let filtered = getFilteredOrders(); if (currentOrdersPage < Math.ceil(filtered.length / ordersPerPage)) { currentOrdersPage++; renderOrdersTable(); } }

function getFilteredOrders() {
    let filtered = [...orders];
    if(currentOrderTab === 'cancelled') filtered = filtered.filter(o => o.status === 'cancelled');
    else {
        filtered = filtered.filter(o => o.status !== 'cancelled');
        if(currentFilter === 'unpaid') filtered = filtered.filter(o => !o.isPaid);
        if(currentFilter === 'pending') filtered = filtered.filter(o => !o.isReceived);
    }
    if(currentSort === 'newest') filtered.sort((a, b) => b.id.localeCompare(a.id));
    else if(currentSort === 'oldest') filtered.sort((a, b) => a.id.localeCompare(b.id));
    else if(currentSort === 'customer') filtered.sort((a, b) => a.customerName.localeCompare(b.customerName));
    else if(currentSort === 'profit') filtered.sort((a, b) => b.totalProfit - a.totalProfit);
    return filtered;
}

function toggleOrderPaid(orderId) { 
    const order = orders.find(o => o.id === orderId); 
    if (order && order.status !== 'cancelled') { 
        if (order.isPaid) { order.amountPaid = 0; order.isPaid = false; } 
        else { order.amountPaid = order.totalRevenue; order.isPaid = true; } 
        saveOrders(); 
        showToast("Payment updated", "success"); 
    } 
}

function toggleOrderReceived(orderId) { 
    const order = orders.find(o => o.id === orderId); 
    if (order && order.status !== 'cancelled') { 
        order.isReceived = !order.isReceived; 
        saveOrders(); 
        showToast("Delivery updated", "success"); 
    } 
}

function editOrder(id) {
    const order = orders.find(o => o.id === id); if (!order || order.status === 'cancelled') return;
    document.getElementById('edit-order-id').value = order.id; document.getElementById('edit-order-customer').value = order.customerName; document.getElementById('edit-order-qty').value = order.orderQty; document.getElementById('edit-order-paid').value = order.amountPaid || 0;
    editOrderTempItem = inventory.find(i => i.name.toLowerCase() === order.itemName.toLowerCase()); openModal('order-modal');
}

function adjustEditOrderQty(change) {
    const input = document.getElementById('edit-order-qty'); let val = parseInt(input.value) + change; if(val < 1) val = 1;
    const order = orders.find(o => o.id === document.getElementById('edit-order-id').value);
    if(order && editOrderTempItem) { const available = editOrderTempItem.stockQty + order.orderQty; if(val > available) { val = available; showToast("Maximum inventory limit reached", "info"); } }
    input.value = val;
}

function saveOrderEdit(e) {
    e.preventDefault();
    const id = document.getElementById('edit-order-id').value, customer = document.getElementById('edit-order-customer').value.trim(), qty = parseInt(document.getElementById('edit-order-qty').value), paid = parseFloat(document.getElementById('edit-order-paid').value);
    const order = orders.find(o => o.id === id); if(!order) return;
    if(editOrderTempItem) {
        const diff = order.orderQty - qty; editOrderTempItem.stockQty += diff; order.orderQty = qty;
        const effectiveUnitPrice = order.totalRevenue / (order.orderQty + diff); order.totalRevenue = qty * effectiveUnitPrice; 
        order.totalCost = qty * editOrderTempItem.unitCost; order.totalProfit = order.totalRevenue - order.totalCost;
    }
    order.customerName = customer; order.amountPaid = paid; order.isPaid = paid >= order.totalRevenue - 0.01; order.isEdited = true;
    
    saveOrders();
    saveInventory();
    closeModal('order-modal'); 
    showToast("Order updated", "success");
}

function cancelOrder(id) {
    const order = orders.find(o => o.id === id);
    if (order && order.status !== 'cancelled' && confirm(`Cancel order for ${order.customerName}?\nRefunds ${order.orderQty} items to stock.`)) {
        const item = inventory.find(i => i.name.toLowerCase() === order.itemName.toLowerCase()); if (item) item.stockQty += order.orderQty;
        order.status = 'cancelled'; order.isPaid = false; order.isReceived = false; order.amountPaid = 0;
        saveOrders();
        saveInventory();
        showToast("Order cancelled", "info");
    }
}

function deleteOrderPermanently(id) {
    if(confirm("Permanently delete this order from the database? This action cannot be undone.")) {
        orders = orders.filter(o => o.id !== id);
        saveOrders();
        showToast("Order permanently deleted", "success");
    }
}

function renderOrdersTable() {
    const list = document.getElementById('orders-list'); if(!list) return; list.innerHTML = '';
    let filtered = getFilteredOrders();
    const totalPages = Math.ceil(filtered.length / ordersPerPage) || 1; if(currentOrdersPage > totalPages) currentOrdersPage = totalPages;
    document.getElementById('pagination-info-text').innerText = `Showing page ${currentOrdersPage} of ${totalPages} (${filtered.length} total)`;
    const pageSlicedOrders = filtered.slice((currentOrdersPage - 1) * ordersPerPage, ((currentOrdersPage - 1) * ordersPerPage) + ordersPerPage);

    if(pageSlicedOrders.length === 0) { list.innerHTML = `<tr><td colspan="6" class="py-12 text-center text-slate-400"><div class="flex flex-col items-center justify-center"><i data-lucide="inbox" class="w-12 h-12 mx-auto mb-3 opacity-30"></i><p class="text-sm font-bold">No records found.</p></div></td></tr>`; initIcons(); return; }
    
    pageSlicedOrders.forEach(order => {
        const due = order.totalRevenue - (order.amountPaid || 0); const isCancelled = order.status === 'cancelled'; const isLocked = (order.isPaid || order.isReceived) && !isCancelled;
        
        let pBadge = isCancelled ? `<span class="inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg uppercase tracking-wider"><i data-lucide="x-circle" class="w-3.5 h-3.5"></i> Void</span>`
            : (order.isPaid ? `<button onclick="toggleOrderPaid('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200 dark:border-emerald-800/30 uppercase tracking-wider hover:bg-emerald-100"><i data-lucide="check" class="w-3 h-3"></i> Paid</button>`
                : ((order.amountPaid || 0) > 0 ? `<button onclick="toggleOrderPaid('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800/30 uppercase tracking-wider hover:bg-amber-100"><i data-lucide="clock" class="w-3 h-3"></i> Bal: ₱ ${due.toFixed(0)}</button>`
                    : `<button onclick="toggleOrderPaid('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800/30 uppercase tracking-wider hover:bg-rose-100"><i data-lucide="alert-circle" class="w-3 h-3"></i> Unpaid</button>`));
        
        const delBtn = isCancelled ? `<span class="text-slate-400 font-bold text-xl">-</span>` 
            : (order.isReceived ? `<button onclick="toggleOrderReceived('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-200 uppercase tracking-wider"><i data-lucide="package-check" class="w-3.5 h-3.5 text-emerald-500"></i> Delivered</button>`
                : `<button onclick="toggleOrderReceived('${order.id}')" class="btn-transition inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-black bg-white dark:bg-slate-900 text-slate-500 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 uppercase tracking-wider"><i data-lucide="truck" class="w-3.5 h-3.5 text-amber-500"></i> Pending</button>`);

        const editBadge = order.isEdited && !isCancelled ? `<span class="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 align-middle">Edited</span>` : '';
        
        let actionHtml = `<button onclick="generateReceipt('${order.id}')" title="Receipt" class="p-2 sm:p-2.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="receipt" class="w-4 h-4"></i></button>`;
        
        if(!isCancelled && !isLocked) {
            actionHtml += `<button onclick="editOrder('${order.id}')" title="Edit" class="p-2 sm:p-2.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors btn-transition"><i data-lucide="edit" class="w-4 h-4"></i></button><button onclick="cancelOrder('${order.id}')" title="Cancel Order" class="p-2 sm:p-2.5 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="x-circle" class="w-4 h-4"></i></button>`;
        } else if (isLocked && !isCancelled) {
            actionHtml += `<span title="Locked (Paid/Delivered)" class="p-2 sm:p-2.5 text-slate-300 dark:text-slate-600 cursor-not-allowed"><i data-lucide="lock" class="w-4 h-4"></i></span>`;
        }

        if (isCancelled) {
            actionHtml += `<button onclick="deleteOrderPermanently('${order.id}')" title="Delete Permanently" class="p-2 sm:p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-xl transition-colors btn-transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>`;
        }

        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${isCancelled ? 'opacity-50 grayscale bg-slate-50/30 dark:bg-slate-900/20' : ''}">
                <td class="py-3 px-4 sm:px-5"><div class="flex flex-col"><div class="font-black text-sm text-slate-900 dark:text-white">${order.customerName}${editBadge}</div><span class="text-[11px] text-slate-500 font-bold mt-0.5">${order.orderQty}x ${order.itemName}</span><span class="text-[9px] text-slate-400 mt-1 font-semibold tracking-wide uppercase">${order.id} • ${order.date || "N/A"}</span></div></td>
                <td class="py-3 px-3 sm:px-4 text-right font-black text-indigo-600 dark:text-indigo-400 tracking-tight ${isCancelled?'line-through':''}">₱ ${order.totalRevenue.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="py-3 px-3 sm:px-4 text-right font-black text-emerald-600 dark:text-emerald-400 tracking-tight ${isCancelled?'line-through text-slate-400 dark:text-slate-500':''}">₱ ${order.totalProfit.toLocaleString(undefined, {minimumFractionDigits:2})}</td>
                <td class="py-3 px-3 sm:px-4 text-center">${pBadge}</td>
                <td class="py-3 px-3 sm:px-4 text-center">${delBtn}</td>
                <td class="py-3 px-4 sm:px-5 text-right"><div class="flex items-center justify-end gap-1 sm:gap-1.5">${actionHtml}</div></td>
            </tr>
        `;
    }); initIcons();
}

// ================= REDESIGNED SUPPLIER ACCOUNTS PAYABLE & MODULE =================

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
            row.innerHTML = `<span>${item.name}</span><span class="text-[10px] text-slate-400 font-bold">RRP: ₱ ${(item.sellPrice || 0).toFixed(2)}</span>`;
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
    const name = document.getElementById('batch-item-search').value.trim();
    const qty = parseFloat(document.getElementById('batch-item-qty').value) || 0;
    const cost = parseFloat(document.getElementById('batch-item-cost').value) || 0;
    
    const previewBlock = document.getElementById('batch-item-preview');
    const cppEl = document.getElementById('preview-cpp');
    const spEl = document.getElementById('preview-sp');
    const pppEl = document.getElementById('preview-ppp');
    const totalProfitEl = document.getElementById('preview-total-profit');

    if(!name || qty <= 0 || cost <= 0) {
        previewBlock.classList.add('hidden');
        return;
    }

    const cpp = cost / qty;
    const invMatch = inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    const sp = invMatch ? (invMatch.sellPrice || 0) : 0;
    const profitPerPc = sp - cpp;
    const estimatedTotalProfit = profitPerPc * qty;

    cppEl.innerText = cpp.toFixed(2);
    spEl.innerText = sp.toFixed(2);
    pppEl.innerText = profitPerPc.toFixed(2);
    totalProfitEl.innerText = estimatedTotalProfit.toFixed(2);

    previewBlock.classList.remove('hidden');
}

function queueItemToBatch() {
    const name = document.getElementById('batch-item-search').value.trim();
    const qty = parseInt(document.getElementById('batch-item-qty').value) || 0;
    const cost = parseFloat(document.getElementById('batch-item-cost').value) || 0;

    if(!name) { showToast("Enter product name", "error"); return; }
    if(qty <= 0) { showToast("Quantity must be greater than zero", "error"); return; }
    if(cost <= 0) { showToast("Total cost must be greater than zero", "error"); return; }

    const cpp = cost / qty;
    const invMatch = inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
    const sellingPrice = invMatch ? (invMatch.sellPrice || 0) : 0;

    currentBatchItems.push({
        itemName: name,
        qty: qty,
        totalCost: cost,
        costPerPiece: cpp,
        sellingPrice: sellingPrice
    });

    document.getElementById('batch-item-search').value = '';
    document.getElementById('batch-item-qty').value = '';
    document.getElementById('batch-item-cost').value = '';
    document.getElementById('batch-item-preview').classList.add('hidden');

    renderCurrentBatchQueue();
    updateTotalSupplierBatchCost();
}

function removeQueuedBatchItem(index) {
    currentBatchItems.splice(index, 1);
    renderCurrentBatchQueue();
    updateTotalSupplierBatchCost();
}

function renderCurrentBatchQueue() {
    const container = document.getElementById('queued-batch-items');
    container.innerHTML = '';

    currentBatchItems.forEach((item, index) => {
        container.innerHTML += `
            <div class="flex justify-between items-center bg-white dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-xs text-slate-700 dark:text-slate-300">
                <div class="flex flex-col">
                    <span class="font-bold text-slate-900 dark:text-white">${item.itemName}</span>
                    <span class="text-[10px] text-slate-400 font-medium">Qty: ${item.qty} • Total: ₱ ${item.totalCost.toFixed(2)} • CPP: ₱ ${item.costPerPiece.toFixed(2)}</span>
                </div>
                <button type="button" onclick="removeQueuedBatchItem(${index})" class="text-rose-500 hover:text-rose-700 p-1 bg-rose-50 dark:bg-rose-950/30 rounded btn-transition"><i data-lucide="x" class="w-3.5 h-3.5"></i></button>
            </div>
        `;
    });
    initIcons();
}

function updateTotalSupplierBatchCost() {
    const sum = currentBatchItems.reduce((acc, curr) => acc + curr.totalCost, 0);
    document.getElementById('bnpl-total-cost').innerText = `₱ ${sum.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
}

// Global shared abstraction helper to add physical quantities inside current workspace safely
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
            const newQty = existing.stockQty + addedQty;
            
            const existingValue = existing.stockQty * (existing.unitCost || 0);
            const weightedCost = newQty > 0 ? ((existingValue + itemCost) / newQty) : item.costPerPiece;

            existing.stockQty = newQty;
            existing.unitCost = weightedCost;
        } else {
            inventory.push({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 3),
                name: item.itemName,
                unitCost: item.costPerPiece,
                sellPrice: item.sellingPrice || item.costPerPiece * 1.25, 
                stockQty: addedQty
            });
        }
    });
    saveInventory();
    saveStockHistory();
}

function handleSupplierPurchaseSubmit(e) {
    e.preventDefault();
    const supplier = document.getElementById('bnpl-supplier').value.trim();
    const invoice = document.getElementById('bnpl-invoice').value.trim();
    const purchaseDate = document.getElementById('bnpl-purchasedate').value;
    const dueDate = document.getElementById('bnpl-duedate').value;
    const notes = document.getElementById('bnpl-notes').value.trim() || 'N/A';
    const inventoryReceived = document.getElementById('bnpl-received-checkbox').checked;

    if(currentBatchItems.length === 0) {
        showToast("Your purchase batch must contain at least 1 item", "error");
        return;
    }

    const totalAmount = currentBatchItems.reduce((acc, curr) => acc + curr.totalCost, 0);

    const newRecord = {
        id: 'AP-' + Date.now().toString().slice(-6),
        supplierName: supplier,
        invoiceNumber: invoice,
        purchaseDate: purchaseDate,
        dueDate: dueDate,
        notes: notes,
        items: currentBatchItems,
        totalAmount: totalAmount,
        amountPaid: 0,
        payments: [], 
        isReceived: inventoryReceived,
        status: 'unpaid'
    };

    if (inventoryReceived) {
        commitBatchItemsToInventory(currentBatchItems);
    }

    bnplRecords.push(newRecord);
    saveBnpl();

    currentBatchItems = [];
    document.getElementById('bnpl-form').reset();
    document.getElementById('bnpl-total-cost').innerText = '₱ 0.00';
    document.getElementById('queued-batch-items').innerHTML = '';
    initDateDefaults();
    
    renderBnplUI();
    showToast("Supplier purchase logged successfully", "success");
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

    if(confirm(`Receive stock batch from ${bill.supplierName}?\nThis will permanently update your inventory and restock history.`)) {
        commitBatchItemsToInventory(bill.items);
        bill.isReceived = true;
        saveBnpl();
        renderBnplUI();
        showToast("Active inventory updated", "success");
    }
}

function deleteSupplierPurchase(id) {
    if(confirm("Permanently wipe supplier purchase entry?\nNote: Inventory stock levels will remain unchanged.")) {
        bnplRecords = bnplRecords.filter(b => b.id !== id);
        saveBnpl();
        renderBnplUI();
        showToast("Supplier invoice removed", "success");
    }
}

function setBnplHistoryFilter(f) {
    currentApFilter = f;
    document.querySelectorAll('[data-ap-btn]').forEach(btn => {
        if(btn.dataset.apBtn === f) {
            btn.className = "px-2.5 py-1.5 rounded bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white uppercase tracking-wider font-bold";
        } else {
            btn.className = "px-2.5 py-1.5 rounded text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 uppercase tracking-wider font-bold";
        }
    });
    renderBnplTable();
}

function renderBnplUI() {
    renderBnplTable();
    renderBatchMatrixTable();
    
    let absoluteCollectedPOSCash = 0;
    orders.forEach(o => { if(o.status !== 'cancelled') absoluteCollectedPOSCash += (o.amountPaid || 0); });

    let unpaidCommitments = 0;
    let paidCommitments = 0;

    bnplRecords.forEach(b => {
        unpaidCommitments += (b.totalAmount - (b.amountPaid || 0));
        paidCommitments += (b.amountPaid || 0);
    });

    let pureLiquidPool = absoluteCollectedPOSCash - paidCommitments;

    document.getElementById('cashflow-liquid-pool').innerText = pureLiquidPool.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('cashflow-unpaid-bnpl').innerText = unpaidCommitments.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('cashflow-paid-bnpl').innerText = paidCommitments.toLocaleString(undefined, {minimumFractionDigits: 2});
}

function renderBnplTable() {
    const list = document.getElementById('bnpl-list');
    if(!list) return; list.innerHTML = '';

    let filtered = [...bnplRecords];
    if(currentApFilter === 'unpaid') filtered = filtered.filter(b => b.status === 'unpaid');
    else if(currentApFilter === 'partial') filtered = filtered.filter(b => b.status === 'partially_paid');
    else if(currentApFilter === 'paid') filtered = filtered.filter(b => b.status === 'fully_paid');

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
            receivedAction = `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 rounded-lg"><i data-lucide="package-check" class="w-3 h-3"></i> Stocks Loaded</span>`;
        } else {
            receivedAction = `<button onclick="receiveSupplierStockBatch('${b.id}')" title="Load Quantities to Inventory" class="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase rounded-lg transition-colors border border-indigo-100 dark:border-indigo-800/30 btn-transition flex items-center gap-1"><i data-lucide="download-cloud" class="w-3.5 h-3.5"></i> Receive Stocks</button>`;
        }

        list.innerHTML += `
            <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td class="py-3 px-4">
                    <div class="font-black text-slate-900 dark:text-white text-xs">${b.supplierName}</div>
                    <div class="text-[10px] font-bold text-slate-400 mt-0.5">Inv: ${b.invoiceNumber || 'N/A'}</div>
                </td>
                <td class="py-3 px-3 text-xs">
                    <div class="text-slate-500">Pur: ${b.purchaseDate}</div>
                    <div class="text-rose-500 font-semibold mt-0.5">Due: ${dueDateStr}</div>
                </td>
                <td class="py-3 px-3 min-w-[150px]">${itemsStr}</td>
                <td class="py-3 px-3 text-right">
                    <div class="font-black text-slate-800 dark:text-slate-200">Total: ₱ ${b.totalAmount.toLocaleString(undefined, {minimumFractionDigits:2})}</div>
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
                        <button onclick="deleteSupplierPurchase('${b.id}')" title="Delete Invoice Record" class="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg btn-transition"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    </div>
                </td>
            </tr>
        `;
    }); initIcons();
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
        let name = o.itemName;
        if(!productMap[name]) productMap[name] = { spent: 0, sold: 0 };
        productMap[name].sold += (o.totalRevenue || 0);
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
    document.getElementById('receipt-text').innerText = `================================\n      CHEOREOBIZ INVOICE\n================================\nDate: ${order.date || "N/A"}\nTxn : ${order.id}\n${order.isEdited ? '(Invoice reflects edited items)\n' : ''}Billed To: ${order.customerName}\nItem:      ${order.itemName}\nQuantity:  ${order.orderQty} pcs\n\n--------------------------------\nSubtotal:           ₱ ${order.totalRevenue.toFixed(2)}\nAmount Paid:        ₱ ${paidVal.toFixed(2)}\nBalance Due:        ₱ ${(order.totalRevenue - paidVal).toFixed(2)}\n--------------------------------\nPayment:  ${statusLine}\nDelivery: ${order.isReceived ? 'Fulfilled' : 'Pending'}\n\nThank you for your business!\n================================`;
    openModal('receipt-modal');
}

function copyReceiptToClipboard() { navigator.clipboard.writeText(document.getElementById('receipt-text').innerText).then(() => { showToast("Receipt copied", "success"); closeModal('receipt-modal'); }); }

function exportToCSV() {
    if (orders.length === 0) { showToast("No records to export", "error"); return; }
    let csv = "data:text/csv;charset=utf-8,Date,ID,Customer,Item,Quantity,Sales,Cost,Profit,Paid,Status,Delivery,Edited\r\n";
    orders.forEach(o => { csv += `"${o.date||'N/A'}","${o.id}","${o.customerName.replace(/"/g, '""')}","${o.itemName.replace(/"/g, '""')}",${o.orderQty},${o.totalRevenue},${o.totalCost},${o.totalProfit},${o.amountPaid||0},${o.status === 'cancelled' ? 'Cancelled' : (o.isPaid ? 'Paid' : 'Due')},${o.isReceived ? 'Delivered' : 'Pending'},${o.isEdited?'Yes':'No'}\r\n`; });
    const a = document.createElement("a"); a.href = encodeURI(csv); a.download = `cheoreobiz_report_${new Date().toISOString().split('T')[0]}.csv`; document.body.appendChild(a); a.click(); a.remove();
}

function exportData() {
    const a = document.createElement('a'); a.href = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ inventory, orders, bundles, stockHistory, activityLog, bnplRecords }, null, 2));
    a.download = `cheoreobiz_backup_${new Date().toISOString().split('T')[0]}.json`; document.body.appendChild(a); a.remove(); showToast("Backup downloaded", "success");
}

function importData(event) {
    const file = event.target.files[0]; if(!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if(data.inventory) inventory = data.inventory; if(data.orders) orders = data.orders; if(data.bundles) bundles = data.bundles; if(data.activityLog) activityLog = data.activityLog; if(data.stockHistory) stockHistory = data.stockHistory; if(data.bnplRecords) bnplRecords = data.bnplRecords;
            
            saveInventory();
            saveOrders();
            saveBundles();
            saveActivityLog();
            saveStockHistory();
            saveBnpl();

            showToast("System restored", "success"); document.getElementById('import-file').value = '';
        } catch(err) { showToast("Invalid backup file format", "error"); }
    }; reader.readAsText(file);
}
