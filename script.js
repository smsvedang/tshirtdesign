// =================================================================
// 1. FIREBASE AUR APP CHECK SETUP
// =================================================================

// ⚠️ IMPORTANT: Apni Firebase project config yahaan paste karein
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBTPxLRI-yE7Cz8F0Gj4Z9DBdOso5O-k_w",
  authDomain: "tshirtdesigns-51835.firebaseapp.com",
  projectId: "tshirtdesigns-51835",
  storageBucket: "tshirtdesigns-51835.firebasestorage.app",
  messagingSenderId: "48671345421",
  appId: "1:48671345421:web:afd8d6f692f188c0cd3e44",
  measurementId: "G-4RJD4C6PZ0"
};

// Firebase ko initialize karein
firebase.initializeApp(firebaseConfig);

// App Check ko initialize karein
const appCheck = firebase.appCheck();

// App Check ko activate karein
// ⚠️ IMPORTANT: Apna reCAPTCHA v3 'Site Key' yahaan daalein
appCheck.activate(
  '6LchTu8rAAAAAFlkAO8O6REC9Ij66f7uvTbo85J8',
  true // Token auto-refresh
);

// Firebase services ko initialize karein
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider(); // Google provider
console.log("Firebase, App Check & Google Auth Initialized.");

// =================================================================
// 2. DUMMY PRODUCT DATA (MongoDB ki jagah)
// =================================================================
const dummyProducts = [
    { id: "p1", name: "Minimalist Astro Tee", price: 799, image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+1", description: "Premium quality 100% cotton tee for space lovers." },
    { id: "p2", name: "Abstract Waves Tee", price: 849, image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+2", description: "A cool design featuring abstract ocean waves." },
    { id: "p3", name: "Retro Arcade Tee", price: 799, image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+3", description: "Go back to the 80s with this retro arcade design." },
    { id: "p4", name: "Cityscape Sketch Tee", price: 849, image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+4", description: "A stylish sketch of a modern city skyline." }
];

// =================================================================
// 3. MAIN APP LOGIC (Sabhi pages par chalega)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    const cartCountElement = document.querySelector('.cart-count');

    // --- Cart Helper Functions (localStorage) ---
    function getCart() { const cart = localStorage.getItem('tshirtStoreCart'); return cart ? JSON.parse(cart) : []; }
    function saveCart(cart) { localStorage.setItem('tshirtStoreCart', JSON.stringify(cart)); updateCartCount(); }
    function updateCartCount() {
        const cart = getCart();
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartCountElement) cartCountElement.textContent = totalItems;
    }

    // --- Page-Specific Logic ---
    if (document.querySelector('.product-grid')) loadProducts();
    if (document.querySelector('.product-detail-section')) loadProductDetail();
    if (document.querySelector('.cart-page')) loadCartPage();
    if (document.querySelector('.auth-container')) setupAuthPage(false); // login.html ke liye
    if (document.getElementById('auth-modal-overlay')) setupAuthModal(); // index.html ke modal ke liye

    // --- Product & Cart Functions ---
    function loadProducts() {
        const productGrid = document.querySelector('.product-grid');
        let productsHTML = '';
        dummyProducts.forEach(product => {
            productsHTML += `
                <div class="product-card">
                    <a href="product-detail.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p class="price">₹${product.price}</p>
                    </a>
                </div>`;
        });
        productGrid.innerHTML = productsHTML;
    }

    function loadProductDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = dummyProducts.find(p => p.id === productId) || dummyProducts[0];
        document.querySelector('.product-image img').src = product.image;
        document.querySelector('.product-info h1').textContent = product.name;
        document.querySelector('.product-price').textContent = `₹${product.price}`;
        document.querySelector('.product-description').textContent = product.description;
        document.querySelector('.add-to-cart-btn').dataset.productId = product.id;
        attachAddToCartListener();
    }

    function attachAddToCartListener() {
        const addToCartButton = document.querySelector('.add-to-cart-btn');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', (e) => {
                const productId = e.target.dataset.productId;
                const product = dummyProducts.find(p => p.id === productId);
                if (!product) return;
                const size = document.getElementById('size').value;
                const quantity = parseInt(document.getElementById('quantity').value);
                addToCart(product.id, product.name, product.price, size, quantity, product.image);
            });
        }
    }

    function addToCart(id, name, price, size, quantity, image) {
        const cart = getCart();
        const cartItemId = `${id}-${size}`;
        const existingItem = cart.find(item => item.cartId === cartItemId);
        if (existingItem) existingItem.quantity += quantity;
        else cart.push({ cartId: cartItemId, id, name, price, size, quantity, image });
        saveCart(cart);
        alert(`${name} (Size: ${size}) has been added to your cart!`);
    }

    function loadCartPage() {
        const cartTableBody = document.querySelector('.cart-table tbody');
        if (!cartTableBody) return;
        const cart = getCart();
        let cartHTML = '';
        if (cart.length === 0) {
            cartTableBody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
            updateCartSummary(0); return;
        }
        let subtotal = 0;
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;
            cartHTML += `
                <tr>
                    <td><div classclass="cart-product-info"><img src="${item.image}" alt="${item.name}"><div><p class="cart-product-title">${item.name}</p><p class="cart-product-size">Size: ${item.size}</p><button class="remove-item-btn" data-cartid="${item.cartId}">Remove</button></div></div></td>
                    <td>₹${item.price}</td>
                    <td><input class="item-quantity" type="number" value="${item.quantity}" min="1" data-cartid="${item.cartId}"></td>
                    <td>₹${itemTotal}</td>
                </tr>`;
        });
        cartTableBody.innerHTML = cartHTML;
        updateCartSummary(subtotal);
        attachCartPageListeners();
    }

    function updateCartSummary(subtotal) {
        const summarySubtotal = document.querySelector('.cart-summary .summary-row:nth-child(1) span:nth-child(2)');
        const summaryShipping = document.querySelector('.cart-summary .summary-row:nth-child(2) span:nth-child(2)');
        const summaryTotal = document.querySelector('.cart-summary .summary-total span:nth-child(2)');
        if (!summarySubtotal) return;
        const shippingCost = (subtotal > 0 && subtotal < 2000) ? 50 : 0;
        const total = subtotal + shippingCost;
        summarySubtotal.textContent = `₹${subtotal}`;
        summaryShipping.textContent = shippingCost === 0 ? 'Free' : `₹${shippingCost}`;
        summaryTotal.textContent = `₹${total}`;
    }

    function attachCartPageListeners() {
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (e) => removeFromCart(e.target.dataset.cartid));
        });
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', (e) => updateItemQuantity(e.target.dataset.cartid, parseInt(e.target.value)));
        });
    }

    function removeFromCart(cartId) {
        let cart = getCart();
        cart = cart.filter(item => item.cartId !== cartId);
        saveCart(cart); loadCartPage();
    }
    
    function updateItemQuantity(cartId, newQuantity) {
        if (newQuantity < 1) { removeFromCart(cartId); return; }
        let cart = getCart();
        const item = cart.find(item => item.cartId === cartId);
        if (item) item.quantity = newQuantity;
        saveCart(cart); loadCartPage();
    }

    // --- (NEW) AUTH MODAL (POPUP) LOGIC ---
    function setupAuthModal() {
        const modalOverlay = document.getElementById('auth-modal-overlay');
        const modalTrigger = document.getElementById('nav-account-link');
        const modalClose = document.getElementById('modal-close-btn');

        if (modalTrigger) {
            modalTrigger.addEventListener('click', (e) => {
                e.preventDefault();
                modalOverlay.classList.add('show');
            });
        }
        if (modalClose) {
            modalClose.addEventListener('click', () => modalOverlay.classList.remove('show'));
        }
        // Overlay par click karke close karna
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    modalOverlay.classList.remove('show');
                }
            });
        }
        
        // Modal ke andar auth forms ko set up karna
        setupAuthPage(true);
    }
    
    // --- AUTH (LOGIN/SIGNUP) LOGIC ---
    // (isModal = true agar popup se call hua, false agar login.html se)
    function setupAuthPage(isModal) {
        const C_ID = isModal ? '#auth-modal-overlay' : 'body'; // Container ID
        const I_PREFIX = isModal ? 'modal-' : ''; // Input ID prefix

        const container = document.querySelector(C_ID);
        if (!container) return;

        const loginTab = container.querySelector('#login-tab');
        const signupTab = container.querySelector('#signup-tab');
        const authContainer = container.querySelector('.auth-container');
        const formTitle = container.querySelector('#form-title');
        const submitButton = container.querySelector('#submit-button');
        const authForm = container.querySelector('#auth-form');
        const googleBtn = container.querySelector('#google-signin-btn');

        // Tab switching
        loginTab.addEventListener('click', () => {
            authContainer.classList.remove('signup-mode');
            loginTab.classList.add('active'); signupTab.classList.remove('active');
            formTitle.textContent = 'Login to Your Account';
            submitButton.textContent = 'Login';
        });

        signupTab.addEventListener('click', () => {
            authContainer.classList.add('signup-mode');
            signupTab.classList.add('active'); loginTab.classList.remove('active');
            formTitle.textContent = 'Create a New Account';
            submitButton.textContent = 'Sign Up';
        });

        // Form Submission
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = container.querySelector(`#${I_PREFIX}email`).value;
            const password = container.querySelector(`#${I_PREFIX}password`).value;
            const name = isModal ? container.querySelector(`#${I_PREFIX}name`).value : (container.querySelector('#name') ? container.querySelector('#name').value : '');
            
            showAuthMessage('', 'success', C_ID); // Clear
            const isSignup = authContainer.classList.contains('signup-mode');

            if (isSignup) {
                // --- SIGNUP LOGIC ---
                if (name.trim() === '') {
                    showAuthMessage('Please enter your full name.', 'error', C_ID);
                    return;
                }
                auth.createUserWithEmailAndPassword(email, password)
                    .then(userCredential => userCredential.user.updateProfile({ displayName: name }))
                    .then(() => handleAuthSuccess('Account created!', C_ID))
                    .catch(error => showAuthMessage(error.message, 'error', C_ID));
            } else {
                // --- LOGIN LOGIC ---
                auth.signInWithEmailAndPassword(email, password)
                    .then(() => handleAuthSuccess('Login successful!', C_ID))
                    .catch(error => showAuthMessage(error.message, 'error', C_ID));
            }
        });
        
        // --- (NEW) GOOGLE SIGN-IN LOGIC ---
        if(googleBtn) {
            googleBtn.addEventListener('click', () => {
                showAuthMessage('', 'success', C_ID); // Clear
                auth.signInWithPopup(googleProvider)
                    .then(() => handleAuthSuccess('Google Sign-in successful!', C_ID))
                    .catch(error => showAuthMessage(error.message, 'error', C_ID));
            });
        }
    }

    function handleAuthSuccess(message, containerId) {
        showAuthMessage(message + ' Redirecting...', 'success', containerId);
        setTimeout(() => {
            // Agar modal (popup) se login kiya hai, toh bas modal band karo
            if (containerId === '#auth-modal-overlay') {
                document.getElementById('auth-modal-overlay').classList.remove('show');
            } else {
                // Agar login.html se kiya hai, toh homepage par bhejo
                window.location.href = 'index.html';
            }
        }, 2000);
    }
    
    function showAuthMessage(message, type, containerId) {
        const authMessage = document.querySelector(containerId).querySelector('#auth-message');
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = type;
        }
    }

    // --- (UPDATED) USER STATUS & LOGOUT (Sabhi Pages par) ---
    auth.onAuthStateChanged((user) => {
        const accountLink = document.getElementById('nav-account-link'); // User icon link
        const navUserInfo = document.getElementById('nav-user-info'); // User name span
        const logoutBtn = document.getElementById('logout-btn');

        if (user) {
            // User is logged in
            console.log('User is logged in:', user.displayName || user.email);
            if (accountLink) accountLink.style.display = 'none'; // Hide user icon
            if (navUserInfo) {
                navUserInfo.style.display = 'block';
                navUserInfo.querySelector('.user-name').textContent = user.displayName || user.email.split('@')[0];
            }
        } else {
            // User is logged out
            console.log('User is logged out.');
            if (accountLink) {
                accountLink.style.display = 'block'; // Show user icon
                accountLink.href = 'login.html'; // Default link
                
                // Agar modal page par hai, toh link ko modal trigger banao
                if(document.getElementById('auth-modal-overlay')) {
                    accountLink.href = '#'; 
                }
            }
            if (navUserInfo) navUserInfo.style.display = 'none'; // Hide user info
        }
    });
    
    // Logout Button Logic
    const logoutBtn = document.getElementById('logout-btn');
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                console.log('User signed out.');
                window.location.href = 'index.html'; // Sign out karke homepage par bhejo
            });
        });
    }

    // --- Initial Load ---
    updateCartCount();
});
