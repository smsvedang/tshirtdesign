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
  'YOUR_RECAPTCHA_V3_SITE_KEY',
  true // Token auto-refresh
);

// Firebase services ko initialize karein
const auth = firebase.auth();
console.log("Firebase & App Check Initialized.");

// =================================================================
// 2. DUMMY PRODUCT DATA (MongoDB ki jagah)
// =================================================================
// Jab tak aapka MongoDB backend API taiyaar nahi hota,
// hum products dikhane ke liye is dummy data ka istemaal karenge.

const dummyProducts = [
    {
        id: "p1",
        name: "Minimalist Astro Tee",
        price: 799,
        image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+1",
        description: "Premium quality 100% cotton tee for space lovers."
    },
    {
        id: "p2",
        name: "Abstract Waves Tee",
        price: 849,
        image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+2",
        description: "A cool design featuring abstract ocean waves."
    },
    {
        id: "p3",
        name: "Retro Arcade Tee",
        price: 799,
        image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+3",
        description: "Go back to the 80s with this retro arcade design."
    },
    {
        id: "p4",
        name: "Cityscape Sketch Tee",
        price: 849,
        image: "https://placehold.co/400x500/EEE/31343C?text=T-Shirt+4",
        description: "A stylish sketch of a modern city skyline."
    }
];

// =================================================================
// 3. MAIN APP LOGIC (Sabhi pages par chalega)
// =================================================================
document.addEventListener('DOMContentLoaded', () => {

    const cartCountElement = document.querySelector('.cart-count');

    // --- Cart Helper Functions (localStorage) ---

    // Cart ko localStorage se load karta hai
    function getCart() {
        const cart = localStorage.getItem('tshirtStoreCart');
        return cart ? JSON.parse(cart) : [];
    }

    // Cart ko localStorage mein save karta hai
    function saveCart(cart) {
        localStorage.setItem('tshirtStoreCart', JSON.stringify(cart));
        updateCartCount();
    }

    // Header mein cart count ko update karta hai
    function updateCartCount() {
        const cart = getCart();
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        if (cartCountElement) {
            cartCountElement.textContent = totalItems;
        }
    }

    // --- Page-Specific Logic ---
    // Hum check karenge ki hum kis page par hain

    // 1. PRODUCTS PAGE & HOME PAGE (Product Grid)
    if (document.querySelector('.product-grid')) {
        loadProducts();
    }

    // 2. PRODUCT DETAIL PAGE
    if (document.querySelector('.product-detail-section')) {
        loadProductDetail();
        attachAddToCartListener();
    }

    // 3. CART PAGE
    if (document.querySelector('.cart-page')) {
        loadCartPage();
    }

    // 4. AUTH PAGE (LOGIN/SIGNUP)
    if (document.querySelector('.auth-container')) {
        setupAuthPage();
    }

    // --- Function Definitions ---

    // (Products / Home page)
    function loadProducts() {
        const productGrid = document.querySelector('.product-grid');
        let productsHTML = '';

        // NOTE: Yahaan hum 'dummyProducts' use kar rahe hain
        // Baad mein aap yahaan 'fetch' karke apne MongoDB API se data laayenge
        dummyProducts.forEach(product => {
            productsHTML += `
                <div class="product-card">
                    <a href="product-detail.html?id=${product.id}">
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p class="price">₹${product.price}</p>
                    </a>
                </div>
            `;
        });
        productGrid.innerHTML = productsHTML;
    }

    // (Product Detail page)
    function loadProductDetail() {
        // Asli app mein, hum URL se product ID lenge (e.g., product-detail.html?id=p1)
        // Abhi ke liye, hum bas pehla dummy product dikha rahe hain
        
        // Product ID ko URL se nikalne ka code:
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        const product = dummyProducts.find(p => p.id === productId) || dummyProducts[0]; // Agar ID na mile toh pehla product dikhao

        document.querySelector('.product-image img').src = product.image;
        document.querySelector('.product-info h1').textContent = product.name;
        document.querySelector('.product-price').textContent = `₹${product.price}`;
        document.querySelector('.product-description').textContent = product.description;
        
        // Product ID ko button mein store karein taaki cart mein add kar sakein
        document.querySelector('.add-to-cart-btn').dataset.productId = product.id;
    }

    // (Product Detail page)
    function attachAddToCartListener() {
        const addToCartButton = document.querySelector('.add-to-cart-btn');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', (e) => {
                // Product ki details page se collect karo
                const productId = e.target.dataset.productId;
                const product = dummyProducts.find(p => p.id === productId);

                if (!product) {
                    alert("Error: Product not found!");
                    return;
                }
                
                const size = document.getElementById('size').value;
                const quantity = parseInt(document.getElementById('quantity').value);

                // Cart mein add karo
                addToCart(product.id, product.name, product.price, size, quantity, product.image);
            });
        }
    }

    // (Cart Logic)
    function addToCart(id, name, price, size, quantity, image) {
        const cart = getCart();
        
        // Ek unique ID banao (product id + size)
        const cartItemId = `${id}-${size}`;

        // Check karo ki item pehle se cart mein hai ya nahi
        const existingItem = cart.find(item => item.cartId === cartItemId);

        if (existingItem) {
            // Agar hai, toh quantity badhao
            existingItem.quantity += quantity;
        } else {
            // Agar nahi hai, toh naya item add karo
            cart.push({
                cartId: cartItemId,
                id: id,
                name: name,
                price: price,
                size: size,
                quantity: quantity,
                image: image
            });
        }

        saveCart(cart);
        alert(`${name} (Size: ${size}) has been added to your cart!`);
    }


    // (Cart Page)
    function loadCartPage() {
        const cartTableBody = document.querySelector('.cart-table tbody');
        if (!cartTableBody) return;

        const cart = getCart();
        let cartHTML = '';

        if (cart.length === 0) {
            cartTableBody.innerHTML = '<tr><td colspan="4">Your cart is empty.</td></tr>';
            updateCartSummary(0);
            return;
        }

        let subtotal = 0;

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            cartHTML += `
                <tr>
                    <td>
                        <div class="cart-product-info">
                            <img src="${item.image}" alt="${item.name}">
                            <div>
                                <p class="cart-product-title">${item.name}</p>
                                <p class="cart-product-size">Size: ${item.size}</p>
                                <button class="remove-item-btn" data-cartid="${item.cartId}">Remove</button>
                            </div>
                        </div>
                    </td>
                    <td>₹${item.price}</td>
                    <td><input class="item-quantity" type="number" value="${item.quantity}" min="1" data-cartid="${item.cartId}"></td>
                    <td>₹${itemTotal}</td>
                </tr>
            `;
        });

        cartTableBody.innerHTML = cartHTML;
        updateCartSummary(subtotal);
        attachCartPageListeners();
    }

    // (Cart Page)
    function updateCartSummary(subtotal) {
        const summarySubtotal = document.querySelector('.cart-summary .summary-row:nth-child(1) span:nth-child(2)');
        const summaryShipping = document.querySelector('.cart-summary .summary-row:nth-child(2) span:nth-child(2)');
        const summaryTotal = document.querySelector('.cart-summary .summary-total span:nth-child(2)');

        if (!summarySubtotal) return;

        const shippingCost = (subtotal > 0 && subtotal < 2000) ? 50 : 0; // Example: 50 shipping, free above 2000
        const total = subtotal + shippingCost;

        summarySubtotal.textContent = `₹${subtotal}`;
        summaryShipping.textContent = shippingCost === 0 ? 'Free' : `₹${shippingCost}`;
        summaryTotal.textContent = `₹${total}`;
    }

    // (Cart Page)
    function attachCartPageListeners() {
        // Remove Button Listeners
        document.querySelectorAll('.remove-item-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const cartId = e.target.dataset.cartid;
                removeFromCart(cartId);
            });
        });

        // Quantity Input Listeners
        document.querySelectorAll('.item-quantity').forEach(input => {
            input.addEventListener('change', (e) => {
                const cartId = e.target.dataset.cartid;
                const newQuantity = parseInt(e.target.value);
                updateItemQuantity(cartId, newQuantity);
            });
        });
    }

    // (Cart Logic)
    function removeFromCart(cartId) {
        let cart = getCart();
        cart = cart.filter(item => item.cartId !== cartId);
        saveCart(cart);
        loadCartPage(); // Cart page ko refresh karo
    }

    // (Cart Logic)
    function updateItemQuantity(cartId, newQuantity) {
        if (newQuantity < 1) {
            removeFromCart(cartId);
            return;
        }
        let cart = getCart();
        const item = cart.find(item => item.cartId === cartId);
        if (item) {
            item.quantity = newQuantity;
        }
        saveCart(cart);
        loadCartPage(); // Cart page ko refresh karo
    }

    // (Auth Page)
    function setupAuthPage() {
        const loginTab = document.getElementById('login-tab');
        const signupTab = document.getElementById('signup-tab');
        const authContainer = document.querySelector('.auth-container');
        const formTitle = document.getElementById('form-title');
        const submitButton = document.getElementById('submit-button');
        const authForm = document.getElementById('auth-form');

        // Tab switching
        loginTab.addEventListener('click', () => {
            authContainer.classList.remove('signup-mode');
            loginTab.classList.add('active');
            signupTab.classList.remove('active');
            formTitle.textContent = 'Login to Your Account';
            submitButton.textContent = 'Login';
        });

        signupTab.addEventListener('click', () => {
            authContainer.classList.add('signup-mode');
            signupTab.classList.add('active');
            loginTab.classList.remove('active');
            formTitle.textContent = 'Create a New Account';
            submitButton.textContent = 'Sign Up';
        });

        // Form Submission
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const name = document.getElementById('name').value;
            
            // Message clear karo
            showAuthMessage('', 'success'); // Clear any old message
            
            const isSignup = authContainer.classList.contains('signup-mode');

            if (isSignup) {
                // --- SIGNUP LOGIC ---
                if (name.trim() === '') {
                    showAuthMessage('Please enter your full name.', 'error');
                    return;
                }
                
                auth.createUserWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        // Signed in 
                        const user = userCredential.user;
                        // User ka profile update karo (naam add karo)
                        return user.updateProfile({
                            displayName: name
                        });
                    })
                    .then(() => {
                        showAuthMessage('Account created successfully! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'index.html'; // Homepage par bhejo
                        }, 2000);
                    })
                    .catch((error) => {
                        // Yahaan App Check error bhi aa sakta hai
                        console.error("Signup Error:", error);
                        showAuthMessage(error.message, 'error');
                    });

            } else {
                // --- LOGIN LOGIC ---
                auth.signInWithEmailAndPassword(email, password)
                    .then((userCredential) => {
                        // Signed in
                        showAuthMessage('Login successful! Redirecting...', 'success');
                        setTimeout(() => {
                            window.location.href = 'index.html'; // Homepage par bhejo
                        }, 2000);
                    })
                    .catch((error) => {
                        // Yahaan App Check error bhi aa sakta hai
                        console.error("Login Error:", error);
                        showAuthMessage(error.message, 'error');
                    });
            }
        });
    }

    // (Auth Page Helper)
    function showAuthMessage(message, type) {
        const authMessage = document.getElementById('auth-message');
        if (authMessage) {
            authMessage.textContent = message;
            authMessage.className = type; // 'success' ya 'error'
        }
    }


    // --- USER STATUS (Sabhi Pages par) ---
    // Check karta hai ki user logged in hai ya nahi
    auth.onAuthStateChanged((user) => {
        const accountLink = document.getElementById('nav-account-link');
        if (user) {
            // User is logged in
            console.log('User is logged in:', user.displayName || user.email);
            if (accountLink) {
                // Isse hum 'account.html' (jo baad mein banayenge) ya 'logout' button mein badal sakte hain
                accountLink.href = '#'; // Abhi ke liye link disable kar dete hain
                // Yahaan aap ek 'Logout' button bhi dynamically add kar sakte hain
            }
        } else {
            // User is logged out
            console.log('User is logged out.');
            if (accountLink) {
                accountLink.href = 'login.html';
            }
        }
    });


    // --- Initial Load ---
    // Page load hote hi cart count ko update karo
    updateCartCount();

});
