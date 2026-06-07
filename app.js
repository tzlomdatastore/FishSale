// LocalStorage မှ စာရင်းများကို ရယူရန် သို့မဟုတ် Structure တည်ဆောက်ရန်
let state = {
    prices: JSON.parse(localStorage.getItem('TZLOM_prices')) || { 'star-big': 0, 'star-small': 0, 'yoe-big': 0, 'yoe-small': 0 },
    sales: JSON.parse(localStorage.getItem('TZLOM_sales')) || [],
    inventory: JSON.parse(localStorage.getItem('TZLOM_inventory')) || { 'star-big': 0, 'star-small': 0, 'yoe-big': 0, 'yoe-small': 0 }
};

let currentEditingId = null;

// စတင်ချိန်တွင် Dynamic အချက်အလက်များ ဖော်ပြပေးရန်
document.addEventListener("DOMContentLoaded", () => {
    updateDateTime();
    loadPricesIntoUI();
    calculateReceipt();
    renderSalesList();
    renderSummary();
    renderInventory();
    setInterval(updateDateTime, 30000); // ၃၀ စက္ကန့်တိုင်း အချိန် Update လုပ်မည်
});

// ရက်စွဲနှင့် အချိန်ပြသရန်
function updateDateTime() {
    const now = new Date();
    const dateStr = `${String(now.getDate()).padStart(2, '0')}-${String(now.getMonth() + 1).padStart(2, '0')}-${now.getFullYear()}`;
    let hours = now.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const timeStr = `(${String(hours).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')})${ampm}`;
    
    const element = document.getElementById('receipt-datetime');
    if (element) element.innerText = `${dateStr} ${timeStr}`;
}

// Tab ပြောင်းလဲခြင်းစနစ်
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');

    // Tab ပြောင်းတိုင်း သက်ဆိုင်ရာ data များကို refresh လုပ်ရန်
    if (tabId === 'tab-sales') renderSalesList();
    if (tabId === 'tab-summary') renderSummary();
    if (tabId === 'tab-inventory') renderInventory();
}

// Setting တန်ဖိုးများကို UI ထဲ ထည့်သွင်းခြင်း
function loadPricesIntoUI() {
    // Receipt UI အတွက်
    document.getElementById('price-star-big').innerText = state.prices['star-big'];
    document.getElementById('price-star-small').innerText = state.prices['star-small'];
    document.getElementById('price-yoe-big').innerText = state.prices['yoe-big'];
    document.getElementById('price-yoe-small').innerText = state.prices['yoe-small'];

    // Setting UI အတွက်
    document.getElementById('set-price-star-big').value = state.prices['star-big'];
    document.getElementById('set-price-star-small').value = state.prices['star-small'];
    document.getElementById('set-price-yoe-big').value = state.prices['yoe-big'];
    document.getElementById('set-price-yoe-small').value = state.prices['yoe-small'];
}

// ဈေးနှုန်း ပြင်ဆင်သိမ်းဆည်းခြင်း
function savePrice(key) {
    const inputVal = parseFloat(document.getElementById(`set-price-${key}`).value) || 0;
    state.prices[key] = inputVal;
    localStorage.setItem('TZLOM_prices', JSON.stringify(state.prices));
    loadPricesIntoUI();
    calculateReceipt();
    alert("ဈေးနှုန်း သိမ်းဆည်းပြီးပါပြီ။");
}

// ပြေစာတန်ဖိုးများ Auto တွက်ချက်ခြင်း
function calculateReceipt() {
    const qBigStar = parseInt(document.getElementById('qty-star-big').value) || 0;
    const qSmallStar = parseInt(document.getElementById('qty-star-small').value) || 0;
    const qBigYoe = parseInt(document.getElementById('qty-yoe-big').value) || 0;
    const qSmallYoe = parseInt(document.getElementById('qty-yoe-small').value) || 0;

    const tBigStar = qBigStar * state.prices['star-big'];
    const tSmallStar = qSmallStar * state.prices['star-small'];
    const tBigYoe = qBigYoe * state.prices['yoe-big'];
    const tSmallYoe = qSmallYoe * state.prices['yoe-small'];

    document.getElementById('total-star-big').innerText = tBigStar;
    document.getElementById('total-star-small').innerText = tSmallStar;
    document.getElementById('total-yoe-big').innerText = tBigYoe;
    document.getElementById('total-yoe-small').innerText = tSmallYoe;

    const grandTotal = tBigStar + tSmallStar + tBigYoe + tSmallYoe;
    document.getElementById('receipt-grand-total').innerText = grandTotal;
}

// ပြေစာအား အရောင်းစာရင်းသို့ သိမ်းဆည်းခြင်း
function saveInvoice(status) {
    const qBigStar = parseInt(document.getElementById('qty-star-big').value) || 0;
    const qSmallStar = parseInt(document.getElementById('qty-star-small').value) || 0;
    const qBigYoe = parseInt(document.getElementById('qty-yoe-big').value) || 0;
    const qSmallYoe = parseInt(document.getElementById('qty-yoe-small').value) || 0;
    
    const grandTotal = parseFloat(document.getElementById('receipt-grand-total').innerText) || 0;
    const shopName = document.getElementById('shop-name').value.trim() || "အမည်မသိဆိုင်";
    const shopPhone = document.getElementById('shop-phone').value.trim() || "-";
    const note = document.getElementById('receipt-note').value.trim() || "-";

    if(grandTotal === 0 && shopName === "အမည်မသိဆိုင်") {
        alert("ကျေးဇူးပြု၍ စာရင်း အချက်အလက် ထည့်သွင်းပါ။");
        return;
    }

    const newSale = {
        id: 'sale_' + Date.now(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        time: document.getElementById('receipt-datetime').innerText.split(' ')[1] || '',
        shopName: shopName,
        shopPhone: shopPhone,
        note: note,
        status: status, // 'Paid', 'Due', 'Pending'
        items: { 'star-big': qBigStar, 'star-small': qSmallStar, 'yoe-big': qBigYoe, 'yoe-small': qSmallYoe },
        grandTotal: grandTotal
    };

    state.sales.push(newSale);
    localStorage.setItem('TZLOM_sales', JSON.stringify(state.sales));

    // Form များကို Reset ပြန်လုပ်ခြင်း
    document.getElementById('qty-star-big').value = 0;
    document.getElementById('qty-star-small').value = 0;
    document.getElementById('qty-yoe-big').value = 0;
    document.getElementById('qty-yoe-small').value = 0;
    document.getElementById('shop-name').value = '';
    document.getElementById('shop-phone').value = '';
    document.getElementById('receipt-note').value = '';
    
    calculateReceipt();
    alert("စာရင်း သိမ်းဆည်းပြီးပါပြီဗျာ။");
}

// အရောင်းစာရင်းဇယား ရေးဆွဲခြင်း
function renderSalesList() {
    const tbody = document.getElementById('sales-list-body');
    tbody.innerHTML = '';

    if(state.sales.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center;">စာရင်းမရှိသေးပါ။</td></tr>`;
        return;
    }

    // နောက်ဆုံးသွင်းထားတာ အပေါ်ဆုံးပြရန် Reverse လုပ်ခြင်း
    [...state.sales].reverse().forEach(sale => {
        const tr = document.createElement('tr');
        
        let statusClass = 'row-pending';
        let statusText = 'စာရင်းသွင်းပြီး';
        if(sale.status === 'Paid') { statusClass = 'row-paid'; statusText = 'ငွေချေပြီး'; }
        if(sale.status === 'Due') { statusClass = 'row-due'; statusText = 'ချေရန်ကျန်'; }

        tr.className = statusClass;
        tr.style.cursor = 'pointer';
        tr.onclick = () => openDetailsModal(sale.id);

        tr.innerHTML = `
            <td>${sale.date}</td>
            <td>${sale.shopName}</td>
            <td>${sale.grandTotal}</td>
            <td>${statusText}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Popup Details မီနူးဖွင့်ခြင်း
function openDetailsModal(id) {
    currentEditingId = id;
    const sale = state.sales.find(s => s.id === id);
    if(!sale) return;

    const modal = document.getElementById('details-modal');
    const content = document.getElementById('modal-body-content');
    
    let statusTxt = sale.status === 'Paid' ? 'ငွေချေပြီး' : (sale.status === 'Due' ? 'ချေရန်ကျန်' : 'စာရင်းသွင်းပြီး');

    content.innerHTML = `
        <div style="line-height: 1.6;">
            <p><strong>ရက်စွဲ:</strong> ${sale.date} (${sale.time})</p>
            <p><strong>ဆိုင်အမည်:</strong> <input type="text" id="edit-mod-shop" value="${sale.shopName}" disabled style="padding:4px; border-radius:4px; border:1px solid #ccc;"></p>
            <p><strong>ဖုန်းနံပါတ်:</strong> <input type="text" id="edit-mod-phone" value="${sale.shopPhone}" disabled style="padding:4px; border-radius:4px; border:1px solid #ccc;"></p>
            <p><strong>အခြေအနေ:</strong> 
                <select id="edit-mod-status" disabled style="padding:4px; border-radius:4px;">
                    <option value="Paid" ${sale.status === 'Paid'?'selected':''}>ငွေချေပြီး</option>
                    <option value="Due" ${sale.status === 'Due'?'selected':''}>ချေရန်ကျန်</option>
                    <option value="Pending" ${sale.status === 'Pending'?'selected':''}>စာရင်းသွင်းပြီး</option>
                </select>
            </p>
            <p><strong>မှတ်ချက်:</strong> <input type="text" id="edit-mod-note" value="${sale.note}" disabled style="padding:4px; border-radius:4px; border:1px solid #ccc;"></p>
            <h4 style="margin-top:10px;">ဝယ်ယူသည့်ပစ္စည်းများ:</h4>
            <ul>
                <li>ကြယ်-ကြီး: <input type="number" id="edit-mod-q-sb" value="${sale.items['star-big']}" disabled style="width:50px;"> ခု</li>
                <li>ကြယ်-သေး: <input type="number" id="edit-mod-q-ss" value="${sale.items['star-small']}" disabled style="width:50px;"> ခု</li>
                <li>ယိုး-ကြီး: <input type="number" id="edit-mod-q-yb" value="${sale.items['yoe-big']}" disabled style="width:50px;"> ခု</li>
                <li>ယိုး-သေး: <input type="number" id="edit-mod-q-ys" value="${sale.items['yoe-small']}" disabled style="width:50px;"> ခု</li>
            </ul>
            <p style="margin-top:10px; font-size:16px;"><strong>စုစုပေါင်းသင့်ငွေ:</strong> <span id="edit-mod-total">${sale.grandTotal}</span> ကျပ်</p>
        </div>
    `;

    document.getElementById('modal-btn-edit').style.display = 'inline-block';
    document.getElementById('modal-btn-save').style.display = 'none';
    
    // Edit Button Logic
    document.getElementById('modal-btn-edit').onclick = () => {
        document.querySelectorAll('#modal-body-content input, #modal-body-content select').forEach(el => el.disabled = false);
        document.getElementById('modal-btn-edit').style.display = 'none';
        document.getElementById('modal-btn-save').style.display = 'inline-block';
    };

    // Save Button Logic
    document.getElementById('modal-btn-save').onclick = () => {
        const saleIndex = state.sales.findIndex(s => s.id === currentEditingId);
        if(saleIndex !== -1) {
            const uSB = parseInt(document.getElementById('edit-mod-q-sb').value) || 0;
            const uSS = parseInt(document.getElementById('edit-mod-q-ss').value) || 0;
            const uYB = parseInt(document.getElementById('edit-mod-q-yb').value) || 0;
            const uYS = parseInt(document.getElementById('edit-mod-q-ys').value) || 0;

            state.sales[saleIndex].shopName = document.getElementById('edit-mod-shop').value;
            state.sales[saleIndex].shopPhone = document.getElementById('edit-mod-phone').value;
            state.sales[saleIndex].status = document.getElementById('edit-mod-status').value;
            state.sales[saleIndex].note = document.getElementById('edit-mod-note').value;
            state.sales[saleIndex].items = { 'star-big': uSB, 'star-small': uSS, 'yoe-big': uYB, 'yoe-small': uYS };
            
            // ပြန်တွက်ချက်ခြင်း
            state.sales[saleIndex].grandTotal = (uSB * state.prices['star-big']) + (uSS * state.prices['star-small']) + (uYB * state.prices['yoe-big']) + (uYS * state.prices['yoe-small']);
            
            localStorage.setItem('TZLOM_sales', JSON.stringify(state.sales));
            closeModal();
            renderSalesList();
        }
    };

    // Delete Button Logic
    document.getElementById('modal-btn-delete').onclick = () => {
        if(confirm("ဤစာရင်းကို အပြီးဖျက်လိုပါသလား?")) {
            state.sales = state.sales.filter(s => s.id !== currentEditingId);
            localStorage.setItem('TZLOM_sales', JSON.stringify(state.sales));
            closeModal();
            renderSalesList();
        }
    };

    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('details-modal').style.display = 'none';
}

// အရောင်းစာရင်း ပေါင်းချုပ် တွက်ချက်ခြင်း
function renderSummary() {
    const startInput = document.getElementById('filter-start-date').value;
    const endInput = document.getElementById('filter-end-date').value;

    let filteredSales = state.sales;

    // ရက်စွဲ Filter သတ်မှတ်ထားလျှင် စစ်ထုတ်ရန်
    if (startInput && endInput) {
        filteredSales = state.sales.filter(s => s.date >= startInput && s.date <= endInput);
    }

    let totals = { 'star-big': 0, 'star-small': 0, 'yoe-big': 0, 'yoe-small': 0 };
    let shopNames = new Set();
    let paidAmt = 0;
    let dueAmt = 0;
    let grandTotal = 0;

    filteredSales.forEach(sale => {
        totals['star-big'] += sale.items['star-big'] || 0;
        totals['star-small'] += sale.items['star-small'] || 0;
        totals['yoe-big'] += sale.items['yoe-big'] || 0;
        totals['yoe-small'] += sale.items['yoe-small'] || 0;

        shopNames.add(sale.shopName);
        grandTotal += sale.grandTotal;

        if (sale.status === 'Paid') paidAmt += sale.grandTotal;
        if (sale.status === 'Due') dueAmt += sale.grandTotal;
    });

    // ဇယားထဲ ထည့်သွင်းခြင်း
    document.getElementById('sum-qty-star-big').innerText = totals['star-big'];
    document.getElementById('sum-amt-star-big').innerText = totals['star-big'] * state.prices['star-big'];

    document.getElementById('sum-qty-star-small').innerText = totals['star-small'];
    document.getElementById('sum-amt-star-small').innerText = totals['star-small'] * state.prices['star-small'];

    document.getElementById('sum-qty-yoe-big').innerText = totals['yoe-big'];
    document.getElementById('sum-amt-yoe-big').innerText = totals['yoe-big'] * state.prices['yoe-big'];

    document.getElementById('sum-qty-yoe-small').innerText = totals['yoe-small'];
    document.getElementById('sum-amt-yoe-small').innerText = totals['yoe-small'] * state.prices['yoe-small'];

    document.getElementById('sum-grand-total').innerText = grandTotal;

    // အောက်ခြေ Card များအတွက်
    document.getElementById('sum-shop-count').innerText = shopNames.size;
    document.getElementById('sum-paid-total').innerText = paidAmt;
    document.getElementById('sum-due-total').innerText = dueAmt;
}

// ပစ္စည်းလက်ကျန် စာရင်းတွက်ချက်ခြင်း
function renderInventory() {
    let autoSales = { 'star-big': 0, 'star-small': 0, 'yoe-big': 0, 'yoe-small': 0 };

    // အရောင်းစာရင်းအားလုံးမှ Auto Link ပေါင်းယူခြင်း
    state.sales.forEach(sale => {
        autoSales['star-big'] += sale.items['star-big'] || 0;
        autoSales['star-small'] += sale.items['star-small'] || 0;
        autoSales['yoe-big'] += sale.items['yoe-big'] || 0;
        autoSales['yoe-small'] += sale.items['yoe-small'] || 0;
    });

    // UI အတွင်း ထည့်ခြင်း
    ['star-big', 'star-small', 'yoe-big', 'yoe-small'].forEach(key => {
        document.getElementById(`inv-stock-${key}`).value = state.inventory[key] || 0;
        document.getElementById(`inv-auto-${key}`).innerText = autoSales[key];
        
        // လက်ကျန် = ရရှိအရေအတွက် - Auto ရောင်းပြီး
        let remaining = (state.inventory[key] || 0) - autoSales[key];
        const remEl = document.getElementById(`inv-rem-${key}`);
        remEl.innerText = remaining;
        
        // ပစ္စည်းပြတ်ခါနီးလျှင် အနီရောင်ပြောင်းရန်
        if(remaining <= 3) {
            remEl.style.color = 'red';
        } else {
            remEl.style.color = 'black';
        }
    });
}

// ရရှိအရေအတွက်ကို ကိုယ်တိုင်ရိုက်ထည့်ပြီး သိမ်းခြင်း
function saveInventoryStock() {
    ['star-big', 'star-small', 'yoe-big', 'yoe-small'].forEach(key => {
        const val = parseInt(document.getElementById(`inv-stock-${key}`).value) || 0;
        state.inventory[key] = val;
    });
    localStorage.setItem('TZLOM_inventory', JSON.stringify(state.inventory));
    renderInventory();
}
