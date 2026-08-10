const API_URL = 'https://food-ordering-cn8t.onrender.com';
let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let cart = [];
let allMenuItems = [];
let activeCategory = '';

/* ============================================================
   Toast notifications (جایگزین alert())
   ============================================================ */
function showToast(message, type) {
    type = type || 'info';
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    const icon = type === 'success' ? 'fa-circle-check' : (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-info');
    toast.innerHTML = '<i class="fa-solid ' + icon + '"></i><span>' + message + '</span>';
    container.appendChild(toast);

    setTimeout(function() {
        toast.classList.add('hide');
        setTimeout(function() { toast.remove(); }, 250);
    }, 3500);
}

/* ============================================================
   Loading state روی دکمه‌ها (جلوگیری از دو بار کلیک)
   ============================================================ */
function setButtonLoading(button, loading) {
    if (!button) return;
    const label = button.querySelector('.btn-label');
    const spinner = button.querySelector('.btn-spinner');
    button.disabled = loading;
    if (spinner) spinner.style.display = loading ? 'inline-block' : 'none';
    if (label) label.style.opacity = loading ? '0.6' : '1';
}

/* ============================================================
   نمایش / پنهان‌سازی رمز عبور
   ============================================================ */
document.querySelectorAll('.toggle-password').forEach(function(btn) {
    btn.addEventListener('click', function() {
        const input = document.getElementById(btn.dataset.target);
        const icon = btn.querySelector('i');
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });
});

/* ============================================================
   اعتبارسنجی زنده‌ی قدرت رمز عبور (مطابق قوانین بک‌اند)
   ============================================================ */
const PASSWORD_RULES = {
    length: function(v) { return v.length >= 8 && v.length <= 72; },
    upper: function(v) { return /[A-Z]/.test(v); },
    lower: function(v) { return /[a-z]/.test(v); },
    digit: function(v) { return /\d/.test(v); },
    special: function(v) { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v); }
};

function isPasswordValid(password) {
    return Object.keys(PASSWORD_RULES).every(function(key) {
        return PASSWORD_RULES[key](password);
    });
}

const regPasswordInput = document.getElementById('regPassword');
const regPasswordConfirmInput = document.getElementById('regPasswordConfirm');
const passwordMatchMsg = document.getElementById('passwordMatchMsg');

regPasswordInput.addEventListener('input', function() {
    const value = regPasswordInput.value;
    Object.keys(PASSWORD_RULES).forEach(function(key) {
        const li = document.querySelector('#passwordRules li[data-rule="' + key + '"]');
        const icon = li.querySelector('i');
        const valid = PASSWORD_RULES[key](value);
        li.classList.toggle('valid', valid);
        icon.classList.toggle('fa-circle-check', valid);
        icon.classList.toggle('fa-circle-xmark', !valid);
    });
    checkPasswordMatch();
});

function checkPasswordMatch() {
    const pass = regPasswordInput.value;
    const confirm = regPasswordConfirmInput.value;
    if (!confirm) {
        passwordMatchMsg.textContent = '';
        passwordMatchMsg.className = 'field-hint';
        return;
    }
    if (pass === confirm) {
        passwordMatchMsg.textContent = '✓ رمزها مطابقت دارند';
        passwordMatchMsg.className = 'field-hint ok';
    } else {
        passwordMatchMsg.textContent = '✗ رمزها با هم مطابقت ندارند';
        passwordMatchMsg.className = 'field-hint bad';
    }
}
regPasswordConfirmInput.addEventListener('input', checkPasswordMatch);

/* ============================================================
   ورود / خروج از فرم‌ها
   ============================================================ */
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
    const submitBtn = e.target.querySelector('button[type="submit"]');

    setButtonLoading(submitBtn, true);
    try {
        const response = await fetch(API_URL + '/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, password: password })
        });

        if (response.ok) {
            const data = await response.json();
            token = data.token;
            currentUser = data.user || null;
            localStorage.setItem('token', token);
            if (currentUser) localStorage.setItem('user', JSON.stringify(currentUser));
            updateUI();
            loadMenu();
            loadOrders();
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('loginEmail').value = '';
            document.getElementById('loginPassword').value = '';
            showToast('ورود موفقیت‌آمیز بود!', 'success');
        } else {
            const error = await response.json();
            showToast('خطا: ' + (error.detail || 'ورود ناموفق'), 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
        console.error(error);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

document.getElementById('register').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!isPasswordValid(password)) {
        showToast('رمز عبور شرایط لازم را ندارد', 'error');
        return;
    }
    if (password !== passwordConfirm) {
        showToast('رمز عبور و تکرار آن یکسان نیستند', 'error');
        return;
    }

    setButtonLoading(submitBtn, true);
    try {
        const response = await fetch(API_URL + '/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, email: email, password: password })
        });

        if (response.ok) {
            showToast('ثبت‌نام موفقیت‌آمیز بود! حالا وارد شوید', 'success');
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('registerForm').style.display = 'none';
            document.getElementById('register').reset();
            document.querySelectorAll('#passwordRules li').forEach(function(li) {
                li.classList.remove('valid');
                const icon = li.querySelector('i');
                icon.classList.add('fa-circle-xmark');
                icon.classList.remove('fa-circle-check');
            });
            passwordMatchMsg.textContent = '';
        } else {
            const error = await response.json();
            const detail = Array.isArray(error.detail)
                ? error.detail.map(function(d) { return d.msg; }).join('، ')
                : error.detail;
            showToast('ثبت‌نام ناموفق: ' + detail, 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
        console.error(error);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

document.getElementById('logoutBtn').addEventListener('click', function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    token = null;
    currentUser = null;
    cart = [];
    updateUI();
    loadMenu();
    document.getElementById('ordersList').innerHTML = '<p class="empty-state">هیچ سفارشی ثبت نشده است</p>';
    updateCart();
    showToast('با موفقیت خارج شدید', 'info');
});

/* ============================================================
   منوی غذاها
   ============================================================ */
function renderMenuSkeleton() {
    let html = '';
    for (let i = 0; i < 4; i++) {
        html += '<div class="skeleton-card">' +
            '<div class="skeleton-line skeleton-img"></div>' +
            '<div class="skeleton-line skeleton-title"></div>' +
            '<div class="skeleton-line skeleton-text"></div>' +
            '<div class="skeleton-line skeleton-text short"></div>' +
            '</div>';
    }
    document.getElementById('menuItems').innerHTML = html;
    document.getElementById('menuItems').classList.add('skeleton-grid');
    document.getElementById('menuItems').classList.remove('menu-grid');
}

function renderCategoryFilters(items) {
    const wrap = document.getElementById('categoryFilters');
    const categories = [];
    items.forEach(function(item) {
        if (item.category && categories.indexOf(item.category) === -1) {
            categories.push(item.category);
        }
    });

    if (categories.length < 2) {
        wrap.style.display = 'none';
        wrap.innerHTML = '';
        return;
    }

    wrap.style.display = 'flex';
    let html = '<button class="category-chip' + (activeCategory === '' ? ' active' : '') + '" data-category="">همه</button>';
    categories.forEach(function(cat) {
        html += '<button class="category-chip' + (activeCategory === cat ? ' active' : '') + '" data-category="' + cat + '">' + cat + '</button>';
    });
    wrap.innerHTML = html;

    wrap.querySelectorAll('.category-chip').forEach(function(chip) {
        chip.addEventListener('click', function() {
            activeCategory = chip.dataset.category;
            wrap.querySelectorAll('.category-chip').forEach(function(c) { c.classList.remove('active'); });
            chip.classList.add('active');
            renderMenuItems();
        });
    });
}

function renderMenuItems() {
    const menuContainer = document.getElementById('menuItems');
    menuContainer.classList.remove('skeleton-grid');
    menuContainer.classList.add('menu-grid');
    menuContainer.innerHTML = '';

    const items = activeCategory
        ? allMenuItems.filter(function(item) { return item.category === activeCategory; })
        : allMenuItems;

    if (items.length === 0) {
        menuContainer.innerHTML = '<p class="empty-state">هیچ غذایی در این دسته‌بندی وجود ندارد</p>';
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
                actions = actions + '<button onclick="addToCart(\'' + item._id + '\', \'' + item.name.replace(/'/g, "\\'") + '\', ' + item.price + ')" class="btn btn-success">افزودن به سبد</button>';
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
}

async function loadMenu() {
    try {
        renderMenuSkeleton();
        const response = await fetch(API_URL + '/menu/');
        if (!response.ok) throw new Error('خطا در دریافت منو');
        allMenuItems = await response.json();

        renderCategoryFilters(allMenuItems);

        // پر کردن پیشنهادهای دسته‌بندی برای فرم افزودن غذا
        const datalist = document.getElementById('categoryOptions');
        const cats = [];
        allMenuItems.forEach(function(item) {
            if (item.category && cats.indexOf(item.category) === -1) cats.push(item.category);
        });
        datalist.innerHTML = cats.map(function(c) { return '<option value="' + c + '">'; }).join('');

        if (allMenuItems.length === 0) {
            document.getElementById('menuItems').classList.remove('skeleton-grid');
            document.getElementById('menuItems').classList.add('menu-grid');
            document.getElementById('menuItems').innerHTML = '<p class="empty-state">هیچ غذایی در منو وجود ندارد</p>';
            return;
        }

        renderMenuItems();
    } catch (error) {
        console.error('خطا در بارگذاری منو:', error);
        document.getElementById('menuItems').classList.remove('skeleton-grid');
        document.getElementById('menuItems').innerHTML = '<p style="color:red;text-align:center;">خطا در بارگذاری منو</p>';
    }
}

/* ============================================================
   فرم افزودن / ویرایش غذا
   ============================================================ */
function openAddMenuPanel() {
    const panel = document.getElementById('addMenuForm');
    panel.classList.add('open');
    document.getElementById('showAddMenu').innerHTML = '<i class="fa-solid fa-xmark"></i> بستن فرم';
    setTimeout(function() {
        panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
}

function closeAddMenuPanel() {
    const panel = document.getElementById('addMenuForm');
    panel.classList.remove('open');
    document.getElementById('showAddMenu').innerHTML = '<i class="fa-solid fa-plus"></i> افزودن غذای جدید';
}

document.getElementById('showAddMenu').addEventListener('click', function() {
    const panel = document.getElementById('addMenuForm');
    if (panel.classList.contains('open')) {
        closeAddMenuPanel();
        document.getElementById('addMenu').reset();
        resetAddMenuFormState();
    } else {
        openAddMenuPanel();
    }
});

function resetAddMenuFormState() {
    document.getElementById('editingItemId').value = '';
    document.getElementById('editingItemImage').value = '';
    document.getElementById('menuAvailable').checked = true;
    document.querySelector('#addMenuForm h2').textContent = 'افزودن غذای جدید';
    document.querySelector('#addMenu button[type="submit"] .btn-label').textContent = 'ذخیره';
    document.getElementById('imagePreviewWrap').style.display = 'none';
    document.getElementById('imagePreview').src = '';
    document.getElementById('menuImage').value = '';
}

// پیش‌نمایش عکس انتخاب‌شده
document.getElementById('menuImage').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(ev) {
        document.getElementById('imagePreview').src = ev.target.result;
        document.getElementById('imagePreviewWrap').style.display = 'flex';
    };
    reader.readAsDataURL(file);
});

document.getElementById('removeImagePreview').addEventListener('click', function() {
    document.getElementById('menuImage').value = '';
    document.getElementById('editingItemImage').value = '';
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreviewWrap').style.display = 'none';
});

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

        if (item.image_url) {
            document.getElementById('imagePreview').src = API_URL + item.image_url;
            document.getElementById('imagePreviewWrap').style.display = 'flex';
        } else {
            document.getElementById('imagePreviewWrap').style.display = 'none';
        }

        document.querySelector('#addMenuForm h2').textContent = 'ویرایش غذا';
        document.querySelector('#addMenu button[type="submit"] .btn-label').textContent = 'به‌روزرسانی';
        openAddMenuPanel();
    } catch (error) {
        showToast('خطا در دریافت اطلاعات غذا', 'error');
        console.error(error);
    }
}

document.getElementById('cancelAddMenu').addEventListener('click', function() {
    closeAddMenuPanel();
    document.getElementById('addMenu').reset();
    resetAddMenuFormState();
});

document.getElementById('addMenu').addEventListener('submit', async function(e) {
    e.preventDefault();

    const editingId = document.getElementById('editingItemId').value;
    const existingImage = document.getElementById('editingItemImage').value;
    const imageFile = document.getElementById('menuImage').files[0];
    let imageUrl = existingImage || null;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    setButtonLoading(submitBtn, true);
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
                showToast('خطا در آپلود عکس: ' + error.detail, 'error');
                setButtonLoading(submitBtn, false);
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
            showToast(editingId ? 'غذا با موفقیت ویرایش شد!' : 'غذا با موفقیت اضافه شد!', 'success');
            closeAddMenuPanel();
            document.getElementById('addMenu').reset();
            resetAddMenuFormState();
            loadMenu();
        } else {
            const error = await response.json();
            showToast('خطا: ' + error.detail, 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
        console.error(error);
    } finally {
        setButtonLoading(submitBtn, false);
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
            showToast('غذا حذف شد!', 'success');
            loadMenu();
        } else {
            const error = await response.json();
            showToast('خطا در حذف غذا: ' + error.detail, 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
        console.error(error);
    }
}

/* ============================================================
   سبد خرید
   ============================================================ */
function addToCart(id, name, price) {
    if (!id || id === 'undefined' || id === 'null') {
        showToast('خطا: شناسه غذا نامعتبر است', 'error');
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
    showToast(name + ' به سبد خرید اضافه شد', 'success');
}

function changeQuantity(index, delta) {
    const item = cart[index];
    if (!item) return;
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart.splice(index, 1);
        showToast(item.name + ' از سبد خرید حذف شد', 'info');
    }
    updateCart();
}

function removeFromCart(index) {
    const item = cart[index];
    cart.splice(index, 1);
    updateCart();
    showToast(item.name + ' از سبد خرید حذف شد', 'info');
}

function updateCart() {
    const cartContainer = document.getElementById('cartItems');
    const totalSpan = document.getElementById('totalPrice');

    if (cart.length === 0) {
        cartContainer.innerHTML = '<p class="empty-state">سبد خرید خالی است</p>';
        totalSpan.textContent = '0';
        return;
    }

    cartContainer.innerHTML = '';
    let total = 0;

    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = '<span>' + item.name + '</span>' +
            '<div class="qty-controls">' +
            '<button class="qty-btn" onclick="changeQuantity(' + i + ', -1)" aria-label="کاهش تعداد">−</button>' +
            '<span class="qty-value">' + item.quantity + '</span>' +
            '<button class="qty-btn" onclick="changeQuantity(' + i + ', 1)" aria-label="افزایش تعداد">+</button>' +
            '</div>' +
            '<span>' + (item.price * item.quantity).toLocaleString() + ' تومان</span>' +
            '<button onclick="removeFromCart(' + i + ')" class="btn btn-danger btn-sm">حذف</button>';
        cartContainer.appendChild(div);
        total = total + (item.price * item.quantity);
    }

    totalSpan.textContent = total.toLocaleString();
}

document.getElementById('checkoutBtn').addEventListener('click', async function(e) {
    if (!token) {
        showToast('لطفاً ابتدا وارد شوید', 'error');
        return;
    }

    if (cart.length === 0) {
        showToast('سبد خرید خالی است', 'error');
        return;
    }

    const items = [];
    for (let i = 0; i < cart.length; i++) {
        items.push({
            menu_item_id: cart[i].id,
            quantity: cart[i].quantity
        });
    }

    const submitBtn = e.currentTarget;
    setButtonLoading(submitBtn, true);
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
            showToast('سفارش شما ثبت شد! شماره سفارش: ' + order.id.slice(0, 8), 'success');
            cart = [];
            updateCart();
            loadOrders();
        } else {
            const error = await response.json();
            showToast('خطا در ثبت سفارش: ' + error.detail, 'error');
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
        console.error(error);
    } finally {
        setButtonLoading(submitBtn, false);
    }
});

/* ============================================================
   سفارشات
   ============================================================ */
const STATUS_LABELS = {
    pending: 'در انتظار',
    completed: 'تکمیل شده',
    cancelled: 'لغو شده'
};

function translateStatus(status) {
    return STATUS_LABELS[status] || status;
}

function renderOrdersSkeleton() {
    let html = '';
    for (let i = 0; i < 3; i++) {
        html += '<div class="skeleton-card" style="margin-bottom:15px;">' +
            '<div class="skeleton-line skeleton-title"></div>' +
            '<div class="skeleton-line skeleton-text"></div>' +
            '<div class="skeleton-line skeleton-text short"></div>' +
            '</div>';
    }
    document.getElementById('ordersList').innerHTML = html;
}

async function loadOrders(statusFilter) {
    if (!token) {
        document.getElementById('ordersList').innerHTML = '<p class="empty-state">هیچ سفارشی ثبت نشده است</p>';
        return;
    }

    const role = getUserRole();
    let endpoint = role === 'admin' ? '/orders/' : '/orders/my';
    if (role === 'admin' && statusFilter) {
        endpoint = endpoint + '?status=' + statusFilter;
    }

    renderOrdersSkeleton();

    try {
        const response = await fetch(API_URL + endpoint, {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (response.ok) {
            const orders = await response.json();
            const ordersContainer = document.getElementById('ordersList');
            ordersContainer.innerHTML = '';

            if (orders.length === 0) {
                ordersContainer.innerHTML = '<p class="empty-state">هیچ سفارشی ثبت نشده است</p>';
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
            showToast('خطا در دریافت سفارشات: ' + error.detail, 'error');
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
            showToast('وضعیت سفارش تغییر کرد: ' + translateStatus(result.old_status) + ' ← ' + translateStatus(result.new_status), 'success');
            loadOrders();
        } else {
            const error = await response.json();
            showToast('خطا در تغییر وضعیت: ' + error.detail, 'error');
            loadOrders();
        }
    } catch (error) {
        showToast('خطا در ارتباط با سرور', 'error');
        console.error(error);
        loadOrders();
    }
}

document.querySelectorAll('.filter-btn').forEach(function(btn) {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.filter-btn').forEach(function(b) {
            b.classList.remove('active');
        });
        btn.classList.add('active');
        loadOrders(btn.dataset.status);
    });
});

/* ============================================================
   نقش کاربر از روی JWT
   ============================================================ */
function getUserRole() {
    if (currentUser && currentUser.role) return currentUser.role;
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

/* ============================================================
   به‌روزرسانی رابط کاربری بر اساس وضعیت ورود
   ============================================================ */
function updateUI() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const userGreeting = document.getElementById('userGreeting');
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

        if (currentUser && currentUser.name) {
            userGreeting.textContent = 'سلام، ' + currentUser.name;
            userGreeting.style.display = 'inline-block';
        } else {
            userGreeting.style.display = 'none';
        }

        const role = getUserRole();
        if (role === 'admin') {
            showAddMenuBtn.style.display = 'inline-block';
            ordersTitle.textContent = '📦 مدیریت سفارشات (همه کاربران)';
            cartSection.style.display = 'none';
            orderFilters.style.display = 'flex';
        } else {
            showAddMenuBtn.style.display = 'none';
            closeAddMenuPanel();
            ordersTitle.textContent = '📦 سفارشات من';
            cartSection.style.display = 'block';
            orderFilters.style.display = 'none';
        }
    } else {
        loginBtn.style.display = 'inline-block';
        registerBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        userGreeting.style.display = 'none';
        showAddMenuBtn.style.display = 'none';
        closeAddMenuPanel();
        authSection.style.display = 'block';
        ordersTitle.textContent = '📦 سفارشات من';
        ordersSection.style.display = 'none';
        cartSection.style.display = 'block';
        orderFilters.style.display = 'none';
    }
}

/* ============================================================
   شروع برنامه
   ============================================================ */
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
