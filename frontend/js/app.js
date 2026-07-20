const API_URL = 'http://localhost:8000';
let token = localStorage.getItem('token');
let cart = [];

document.getElementById('loginBtn').addEventListener('click', function() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
});

document.getElementById('registerBtn').addEventListener('click', function() {
    document.getElementById('registerForm').style.display = 'block';
    document.getElementById('loginForm').style.display = 'none';
});

document.getElementById('login').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });
        
        if (response.ok) {
            const data = await response.json();
            token = data.token;
            localStorage.setItem('token', token);
            updateUI();
            loadMenu();
            loadOrders();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            alert('ورود موفقیت آمیز!');
        } else {
            const error = await response.json();
            alert('خطا: ' + error.detail);
        }
    } catch (error) {
        alert('خطا در ارتباط با سرور');
        console.error(error);
    }
});

document.getElementById('register').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const role = document.getElementById('regRole').value;

    try {
        const response = await fetch(API_URL + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, password: password, role: role })
        });

        if (response.ok) {
            alert('ثبت نام موفقیت آمیز! حالا وارد شوید');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('regName').value = '';
            document.getElementById('regEmail').value = '';
            document.getElementById('regPassword').value = '';
        } else {
            const error = await response.json();
            alert('ثبت نام ناموفق: ' + error.detail);
        }
    } catch (error) {
        alert('خطا در ارتباط با سرور');
        console.error(error);
    }
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('token');
    token = null;
    cart = [];
    updateUI();
    loadMenu();
    document.getElementById('ordersList').innerHTML = '<p style="color:#666;">هیچ سفارشی ثبت نشده است</p>';
    document.getElementById('cartItems').innerHTML = '<p>سبد خرید خالی است</p>';
    document.getElementById('totalPrice').textContent = '0';
    alert('با موفقیت خارج شدید');
});

async function loadMenu() {
    try {
        const response = await fetch(API_URL + '/menu/');
        if (!response.ok) throw new Error('خطا در دریافت منو');
        const items = await response.json();
        
        const menuContainer = document.getElementById('menuItems');
        menuContainer.innerHTML = '';
        
        if (items.length === 0) {
            menuContainer.innerHTML = '<p style="text-align:center;padding:20px;color:#666;">هیچ غذایی در منو وجود ندارد</p>';
            return;
        }
        
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const div = document.createElement('div');
            div.className = 'menu-item';
            
            let actions = '';
            if (token) {
                const role = getUserRole();
                actions = '<div class="actions">';
                if (role === 'admin') {
                    actions = actions + '<button onclick="editMenuItem(\'' + item._id + '\')" class="btn btn-warning">ویرایش</button>';
                    actions = actions + '<button onclick="deleteMenuItem(\'' + item._id + '\')" class="btn btn-danger">حذف</button>';
                } else if (item.is_available) {
                    actions = actions + '<button onclick="addToCart(\'' + item._id + '\', \'' + item.name + '\', ' + item.price + ')" class="btn btn-success">افزودن به سبد</button>';
                }
                actions = actions + '</div>';
            }

            const imageHtml = item.image_url 
                ? '<img src="' + API_URL + item.image_url + '" alt="' + item.name + '" class="menu-item-img">'
                : '<div class="menu-item-img menu-item-img-placeholder">🍽️</div>';

            div.innerHTML = imageHtml + '<h3>' + item.name + '</h3>' +
                '<span class="category">' + item.category + '</span>' +
                '<p class="description">' + item.description + '</p>' +
                '<div class="price">' + item.price.toLocaleString() + ' تومان</div>' +
                '<span class="status ' + (item.is_available ? 'available' : 'unavailable') + '">' +
                (item.is_available ? 'موجود' : 'ناموجود') +
                '</span>' +
                actions;
            menuContainer.appendChild(div);
        }
    } catch (error) {
        console.error('خطا در بارگذاری منو:', error);
        document.getElementById('menuItems').innerHTML = '<p style="color:red;text-align:center;">خطا در بارگذاری منو</p>';
    }
}

// دریافت اطلاعات یک غذا و پرکردن فرم برای ویرایش
async function editMenuItem(id) {
    try {
        const response = await fetch(API_URL + '/menu/' + id);
        if (!response.ok) throw new Error('خطا در دریافت اطلاعات غذا');
        const item = await response.json();

        document.getElementById('editingItemId').value = item._id;
        document.getElementById('editingItemImage').value = item.image_url || '';
        document.getElementById('menuName').value = item.name;
        document.getElementById('menuDesc').value = item.description;
        document.getElementById('menuPrice').value = item.price;
        document.getElementById('menuCategory').value = item.category;
        document.getElementById('menuAvailable').checked = item.is_available;

        document.querySelector('#addMenuForm h2').textContent = 'ویرایش غذا';
        document.querySelector('#addMenu button[type="submit"]').textContent = 'به‌روزرسانی';
        document.getElementById('addMenuForm').style.display = 'block';
    } catch (error) {
        alert('خطا در دریافت اطلاعات غذا');
        console.error(error);
    }
}

function addToCart(id, name, price) {
    console.log('Adding to cart:', id, name, price);
    
    if (!id || id === 'undefined' || id === 'null') {
        alert('خطا: شناسه غذا نامعتبر است');
        return;
    }
    
    let existing = null;
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === id) {
            existing = cart[i];
            break;
        }
    }
    
    if (existing) {
        existing.quantity = existing.quantity + 1;
    } else {
        cart.push({ id: id, name: name, price: price, quantity: 1 });
    }
    updateCart();
    alert(name + ' به سبد خرید اضافه شد!');
}

function updateCart() {
    const cartContainer = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalPrice');
    
    if (cart.length === 0) {
        cartContainer.innerHTML = '<p>سبد خرید خالی است</p>';
        totalSpan.textContent = '0';
        return;
    }
    
    cartContainer.innerHTML = '';
    let total = 0;
    
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = '<span>' + item.name + ' (' + item.quantity + ' عدد)</span>' +
            '<span>' + (item.price * item.quantity).toLocaleString() + ' تومان</span>' +
            '<button onclick="removeFromCart(' + i + ')" class="btn btn-danger" style="padding:5px 10px;">حذف</button>';
        cartContainer.appendChild(div);
        total = total + (item.price * item.quantity);
    }
    
    totalSpan.textContent = total.toLocaleString();
}

function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    updateCart();
    alert(item.name + ' از سبد خرید حذف شد!');
}

document.getElementById('checkoutBtn').addEventListener('click', async function() {
    if (!token) {
        alert('لطفاً ابتدا وارد شوید');
        return;
    }
    
    if (cart.length === 0) {
        alert('سبد خرید خالی است');
        return;
    }
    
    const items = [];
    for (let i = 0; i < cart.length; i++) {
        items.push({
            menu_item_id: cart[i].id,
            quantity: cart[i].quantity
        });
    }
    
    console.log('Sending order:', items);
    
    try {
        const response = await fetch(API_URL + '/orders/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ items: items })
        });
        
        if (response.ok) {
            const order = await response.json();
            alert('سفارش شما ثبت شد! شماره سفارش: ' + order.id.slice(0, 8));
            cart = [];
            updateCart();
            loadOrders();
        } else {
            const error = await response.json();
            alert('خطا در ثبت سفارش: ' + error.detail);
        }
    } catch (error) {
        alert('خطا در ارتباط با سرور');
        console.error(error);
    }
});

// نگاشت وضعیت‌های سفارش به متن فارسی
const STATUS_LABELS = {
    pending: 'در انتظار',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده'
};

function translateStatus(status) {
    return STATUS_LABELS[status] || status;
}

async function loadOrders(statusFilter) {
    if (!token) {
        document.getElementById('ordersList').innerHTML = '<p style="color:#666;">هیچ سفارشی ثبت نشده است</p>';
        return;
    }

    const role = getUserRole();
    let endpoint = role === 'admin' ? '/orders/' : '/orders/my';
    if (role === 'admin' && statusFilter) {
        endpoint = endpoint + '?status=' + statusFilter;
    }

    try {
        const response = await fetch(API_URL + endpoint, {
            headers: { 'Authorization': 'Bearer ' + token }
        });
        
        if (response.ok) {
            const orders = await response.json();
            const ordersContainer = document.getElementById('ordersList');
            ordersContainer.innerHTML = '';
            
            if (orders.length === 0) {
                ordersContainer.innerHTML = '<p style="color:#666;">هیچ سفارشی ثبت نشده است</p>';
                return;
            }
            
            for (let i = 0; i < orders.length; i++) {
                const order = orders[i];
                const div = document.createElement('div');
                div.className = 'order-item';
                
                let itemsHtml = '';
                if (order.items && order.items.length > 0) {
                    for (let j = 0; j < order.items.length; j++) {
                        const item = order.items[j];
                        const itemName = item.name ? item.name : '';
                        itemsHtml = itemsHtml + '<p>' + item.quantity + ' عدد ' + itemName + '- ' + (item.price * item.quantity).toLocaleString() + ' تومان</p>';
                    }
                } else {
                    itemsHtml = '<p>هیچ آیتمی در این سفارش نیست</p>';
                }

                let customerInfo = '';
                let statusHtml = '<span class="order-status ' + order.status + '">' + translateStatus(order.status) + '</span>';

                if (role === 'admin') {
                    const customerLabel = order.customer_name
                        ? (order.customer_name + (order.customer_email ? ' (' + order.customer_email + ')' : ''))
                        : order.user_id;
                    customerInfo = '<p class="order-customer">مشتری: ' + customerLabel + '</p>';
                    statusHtml = '<select class="status-select ' + order.status + '" onchange="updateOrderStatus(\'' + order.id + '\', this.value)">' +
                        '<option value="pending"' + (order.status === 'pending' ? ' selected' : '') + '>در انتظار</option>' +
                        '<option value="completed"' + (order.status === 'completed' ? ' selected' : '') + '>تکمیل شده</option>' +
                        '<option value="cancelled"' + (order.status === 'cancelled' ? ' selected' : '') + '>لغو شده</option>' +
                        '</select>';
                }
                
                div.innerHTML = '<div style="display: flex; justify-content: space-between; align-items: center;">' +
                    '<span>سفارش #' + order.id.slice(0, 8) + '</span>' +
                    statusHtml +
                    '</div>' +
                    customerInfo +
                    '<p>جمع کل: ' + order.total_price.toLocaleString() + ' تومان</p>' +
                    '<p>تاریخ: ' + new Date(order.created_at).toLocaleDateString('fa-IR') + '</p>' +
                    '<details>' +
                    '<summary>جزئیات سفارش</summary>' +
                    itemsHtml +
                    '</details>';
                ordersContainer.appendChild(div);
            }
        } else {
            const error = await response.json();
            alert('خطا در دریافت سفارشات: ' + error.detail);
        }
    } catch (error) {
        console.error('خطا در بارگذاری سفارشات:', error);
        document.getElementById('ordersList').innerHTML = '<p style="color:red;">خطا در بارگذاری سفارشات</p>';
    }
}

async function updateOrderStatus(id, newStatus) {
    try {
        const response = await fetch(API_URL + '/orders/' + id + '/status', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            const result = await response.json();
            alert('وضعیت سفارش تغییر کرد: ' + translateStatus(result.old_status) + ' ← ' + translateStatus(result.new_status));
            loadOrders();
        } else {
            const error = await response.json();
            alert('خطا در تغییر وضعیت: ' + error.detail);
            loadOrders();
        }
    } catch (error) {
        alert('خطا در ارتباط با سرور');
        console.error(error);
        loadOrders();
    }
}

function getUserRole() {
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        const payload = JSON.parse(jsonPayload);
        return payload.role;
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
}

function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const showAddMenuBtn = document.getElementById('showAddMenu');
    const authSection = document.getElementById('authSection');
    const ordersTitle = document.getElementById('ordersTitle');
    const ordersSection = document.getElementById('ordersSection');
    const cartSection = document.getElementById('cartSection');
    const orderFilters = document.getElementById('orderFilters');
    
    if (token) {
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        authSection.style.display = 'none';
        ordersSection.style.display = 'block';
        
        const role = getUserRole();
        if (role === 'admin') {
            showAddMenuBtn.style.display = 'inline-block';
            ordersTitle.textContent = '📦 مدیریت سفارشات (همه کاربران)';
            cartSection.style.display = 'none';
            orderFilters.style.display = 'flex';
        } else {
            showAddMenuBtn.style.display = 'none';
            ordersTitle.textContent = '📦 سفارشات من';
            cartSection.style.display = 'block';
            orderFilters.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        showAddMenuBtn.style.display = 'none';
        authSection.style.display = 'block';
        ordersTitle.textContent = '📦 سفارشات من';
        ordersSection.style.display = 'none';
        cartSection.style.display = 'block';
        orderFilters.style.display = 'none';
    }
}

document.getElementById('showAddMenu').addEventListener('click', function() {
    const form = document.getElementById('addMenuForm');
    if (form.style.display === 'block') {
        form.style.display = 'none';
    } else {
        form.style.display = 'block';
    }
});

document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        loadOrders(btn.dataset.status);
    });
});

document.getElementById('cancelAddMenu').addEventListener('click', function() {
    document.getElementById('addMenuForm').style.display = 'none';
    document.getElementById('addMenu').reset();
    document.getElementById('editingItemId').value = '';
    document.getElementById('editingItemImage').value = '';
    document.querySelector('#addMenuForm h2').textContent = 'افزودن غذای جدید';
    document.querySelector('#addMenu button[type="submit"]').textContent = 'ذخیره';
});

document.getElementById('addMenu').addEventListener('submit', async function(e) {
    e.preventDefault();

    const editingId = document.getElementById('editingItemId').value;
    const existingImage = document.getElementById('editingItemImage').value;
    const imageFile = document.getElementById('menuImage').files[0];
    let imageUrl = existingImage || null;

    try {
        if (imageFile) {
            const formData = new FormData();
            formData.append('file', imageFile);

            const uploadResponse = await fetch(API_URL + '/menu/upload-image', {
                method: 'POST',
                headers: { 'Authorization': 'Bearer ' + token },
                body: formData
            });

            if (uploadResponse.ok) {
                const uploadResult = await uploadResponse.json();
                imageUrl = uploadResult.url;
            } else {
                const error = await uploadResponse.json();
                alert('خطا در آپلود عکس: ' + error.detail);
                return;
            }
        }

        const data = {
            name: document.getElementById('menuName').value,
            description: document.getElementById('menuDesc').value,
            price: parseFloat(document.getElementById('menuPrice').value),
            category: document.getElementById('menuCategory').value,
            is_available: document.getElementById('menuAvailable').checked,
            image_url: imageUrl
        };

        const url = editingId ? (API_URL + '/menu/' + editingId) : (API_URL + '/menu/');
        const method = editingId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert(editingId ? 'غذا با موفقیت ویرایش شد!' : 'غذا با موفقیت اضافه شد!');
            document.getElementById('addMenuForm').style.display = 'none';
            document.getElementById('addMenu').reset();
            document.getElementById('editingItemId').value = '';
            document.getElementById('editingItemImage').value = '';
            document.getElementById('menuAvailable').checked = true;
            document.querySelector('#addMenuForm h2').textContent = 'افزودن غذای جدید';
            document.querySelector('#addMenu button[type="submit"]').textContent = 'ذخیره';
            loadMenu();
        } else {
            const error = await response.json();
            alert('خطا: ' + error.detail);
        }
    } catch (error) {
        alert('خطا در ارتباط با سرور');
        console.error(error);
    }
});

async function deleteMenuItem(id) {
    if (!confirm('آیا از حذف این غذا مطمئن هستید؟')) return;
    
    try {
        const response = await fetch(API_URL + '/menu/' + id, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + token
            }
        });
        
        if (response.ok) {
            alert('غذا حذف شد!');
            loadMenu();
        } else {
            const error = await response.json();
            alert('خطا در حذف غذا: ' + error.detail);
        }
    } catch (error) {
        alert('خطا در ارتباط با سرور');
        console.error(error);
    }
}

console.log('App started! Token:', token ? 'Yes' : 'No');
console.log('API URL:', API_URL);

updateUI();
loadMenu();
if (token) {
    loadOrders();
}

setInterval(function() {
    loadMenu();
}, 30000);