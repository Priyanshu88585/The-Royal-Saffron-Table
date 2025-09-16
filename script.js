/* ===============================
   GLOBAL STATE
=================================*/
let cart = JSON.parse(localStorage.getItem("cart")) || [];
let users = JSON.parse(localStorage.getItem("users")) || [];
let currentUser = JSON.parse(localStorage.getItem("currentUser")) || null;
let reviews = JSON.parse(localStorage.getItem("reviews")) || {};

/* ===============================
   UTILITIES
=================================*/
function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI();
}

function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.innerText = message;
  toast.className = `show ${type}`;
  setTimeout(() => (toast.className = toast.className.replace("show", "")), 3000);
}

/* ===============================
   CART FUNCTIONS
=================================*/
function addToCart(item) {
  const existing = cart.find((i) => i.name === item.name);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart();
  playOrderSound();
  showToast(`${item.name} added to cart 🛒`);
}

function removeFromCart(name) {
  cart = cart.filter((i) => i.name !== name);
  saveCart();
  showToast(`${name} removed ❌`);
}

function updateCartUI() {
  const cartCountTop = document.getElementById("cartCountTop");
  if (cartCountTop) cartCountTop.innerText = cart.reduce((a, b) => a + b.qty, 0);

  const cartPopup = document.getElementById("cartPopup");
  if (!cartPopup) return;
  cartPopup.innerHTML = "";

  if (cart.length === 0) {
    cartPopup.innerHTML = "<p>Your cart is empty.</p>";
    return;
  }

  cart.forEach((item) => {
    const div = document.createElement("div");
    div.className = "cart-item";
    div.innerHTML = `
      <span>${item.name} (x${item.qty}) - ₹${item.price * item.qty}</span>
      <button onclick="removeFromCart('${item.name}')">Remove</button>
    `;
    cartPopup.appendChild(div);
  });

  const checkoutBtn = document.createElement("button");
  checkoutBtn.className = "btn-submit";
  checkoutBtn.innerText = "Proceed to Checkout";
  checkoutBtn.onclick = openCheckoutModal;
  cartPopup.appendChild(checkoutBtn);
}

/* ===============================
   AUTH FUNCTIONS
=================================*/
function openAuthModal(mode = "login") {
  const modal = document.getElementById("authModal");
  modal.style.display = "flex";
  document.getElementById("authTitle").innerText = mode === "login" ? "Login" : "Register";
  document.getElementById("registerFields").style.display = mode === "login" ? "none" : "block";
  modal.setAttribute("data-mode", mode);
}

function closeAuthModal() {
  document.getElementById("authModal").style.display = "none";
}

document.getElementById("authForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const mode = document.getElementById("authModal").getAttribute("data-mode");
  const email = document.getElementById("authEmail").value;
  const password = document.getElementById("authPassword").value;

  if (mode === "login") {
    const user = users.find((u) => u.email === email && u.password === password);
    if (user) {
      currentUser = user;
      localStorage.setItem("currentUser", JSON.stringify(user));
      showToast(`Welcome back, ${user.name}`);
      closeAuthModal();
      renderAuthArea();
    } else {
      showToast("Invalid credentials ❌", "error");
    }
  } else {
    const confirmPassword = document.getElementById("authConfirmPassword").value;
    const name = document.getElementById("authProfileName").value || "Guest";
    if (password !== confirmPassword) return showToast("Passwords don't match ❌", "error");

    const newUser = { email, password, name };
    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));
    currentUser = newUser;
    localStorage.setItem("currentUser", JSON.stringify(newUser));
    showToast(`Welcome, ${name}`);
    closeAuthModal();
    renderAuthArea();
  }
});

function renderAuthArea() {
  const area = document.getElementById("authAreaTop");
  if (!area) return;

  if (currentUser) {
    area.innerHTML = `
      <span style="margin-right:8px;">Hi, ${currentUser.name}</span>
      <button onclick="logout()">Logout</button>
    `;
  } else {
    area.innerHTML = `
      <button onclick="openAuthModal('login')">Login</button>
      <button onclick="openAuthModal('register')">Register</button>
    `;
  }
}

function logout() {
  currentUser = null;
  localStorage.removeItem("currentUser");
  renderAuthArea();
  showToast("Logged out ✅");
}

/* ===============================
   REVIEW FUNCTIONS
=================================*/
function openReviewModal(itemName) {
  if (!currentUser) return showToast("Login required to review ❌", "error");
  const modal = document.getElementById("reviewModal");
  document.getElementById("reviewItemId").value = itemName;
  document.getElementById("reviewName").value = currentUser.name;
  modal.style.display = "flex";
}

function closeReviewModal() {
  document.getElementById("reviewModal").style.display = "none";
}

document.getElementById("reviewForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const item = document.getElementById("reviewItemId").value;
  const rating = parseFloat(document.getElementById("reviewRating").value);
  const comment = document.getElementById("reviewComment").value;

  if (!reviews[item]) reviews[item] = [];
  reviews[item].push({ user: currentUser.name, rating, comment });
  localStorage.setItem("reviews", JSON.stringify(reviews));

  showToast("Review submitted ✅");
  closeReviewModal();
  renderReviews();
});

function renderReviews() {
  Object.keys(reviews).forEach((item) => {
    const ratings = reviews[item].map((r) => r.rating);
    const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const el = document.querySelector(`.averageRating[data-for="${item}"]`);
    if (el) el.innerHTML = `<span>⭐ ${avg.toFixed(1)} (${ratings.length})</span>`;
  });
}
/* ===============================
   CHECKOUT FUNCTIONS
=================================*/
function openCheckoutModal() {
  const modal = document.getElementById("checkoutModal");
  modal.style.display = "flex";

  const cart = JSON.parse(localStorage.getItem("cart") || "[]");
  const summary = document.getElementById("checkoutSummary");

  if (cart.length === 0) {
    summary.innerHTML = "<p style='color:red;'>Your cart is empty.</p>";
  } else {
    summary.innerHTML = cart
      .map((i) => `${i.name} (x${i.qty}) - ₹${i.qty * i.price}`)
      .join("<br>");
  }
}

function closeCheckoutModal() {
  document.getElementById("checkoutModal").style.display = "none";
}

document.getElementById("checkoutForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("checkoutName").value;
  const email = document.getElementById("checkoutEmail").value;
  const address = document.getElementById("checkoutAddress").value;

  let cart = JSON.parse(localStorage.getItem("cart") || "[]");
  if (cart.length === 0) {
    // Direct thankyou page bhi mat bhejna agar cart empty hai
    window.location.href = "thankyou.html?orderId=EMPTY";
    return;
  }

  let amount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const orderId = "ORD-" + Date.now();

  const order = {
    id: orderId,
    date: new Date().toISOString(),
    method: "Cash on Delivery",
    amount: amount,
    customer: { name, email, address },
    items: cart
  };

  let orders = JSON.parse(localStorage.getItem("orders") || "[]");
  orders.push(order);
  localStorage.setItem("orders", JSON.stringify(orders));

  localStorage.removeItem("cart");

  // ✅ No alerts, direct redirect
  window.location.href = `thankyou.html?orderId=${encodeURIComponent(orderId)}`;
});

/* ===============================
   FILTERS, SEARCH, SORT
=================================*/
function initFilters() {
  const buttons = document.querySelectorAll(".filter-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const cat = btn.getAttribute("data-cat");
      filterItems(cat);
    });
  });

  document.getElementById("searchInput")?.addEventListener("input", (e) => {
    searchItems(e.target.value);
  });

  document.getElementById("sortByRating")?.addEventListener("change", (e) => {
    sortItems(e.target.value);
  });
}

function filterItems(cat) {
  document.querySelectorAll(".itemCard").forEach((card) => {
    card.style.display = cat === "All" || card.dataset.category === cat ? "block" : "none";
  });
}

function searchItems(query) {
  query = query.toLowerCase();
  document.querySelectorAll(".itemCard").forEach((card) => {
    const name = card.dataset.name.toLowerCase();
    card.style.display = name.includes(query) ? "block" : "none";
  });
}

function sortItems(option) {
  const container = document.getElementById("itemCards");
  const cards = Array.from(container.children);
  if (option === "default") return;
  cards.sort((a, b) => {
    const ra = parseFloat(a.querySelector(".averageRating span")?.innerText.split(" ")[1]) || 0;
    const rb = parseFloat(b.querySelector(".averageRating span")?.innerText.split(" ")[1]) || 0;
    return option === "high" ? rb - ra : ra - rb;
  });
  container.innerHTML = "";
  cards.forEach((c) => container.appendChild(c));
}

/* ===============================
   DARK MODE
=================================*/
const darkToggle = document.getElementById("darkModeToggle");
if (darkToggle) {
  darkToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    darkToggle.innerText = document.body.classList.contains("dark") ? "☀️" : "🌙";
  });
}

/* ===============================
   SOUNDS
=================================*/
function playOrderSound() {
  const sound = document.getElementById("orderSound");
  sound?.play();
}

/* ===============================
   EVENT BINDINGS
=================================*/
window.onload = () => {
  updateCartUI();
  renderAuthArea();
  renderReviews();
  initFilters();

  // AddToCart + Review Buttons
  document.querySelectorAll(".addToCartBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".itemCard");
      addToCart({
        name: card.dataset.name,
        price: parseFloat(card.dataset.price),
        category: card.dataset.category,
      });
    });
  });

  document.querySelectorAll(".leaveReviewBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".itemCard");
      openReviewModal(card.dataset.name);
    });
  });

  // Close buttons
  document.getElementById("authCloseBtn")?.addEventListener("click", closeAuthModal);
  document.getElementById("closeReviewModal")?.addEventListener("click", closeReviewModal);
  document.getElementById("closeCheckoutModal")?.addEventListener("click", closeCheckoutModal);

  // Cart Icon
  document.getElementById("cartIconTop")?.addEventListener("click", () => {
    const popup = document.getElementById("cartPopup");
    popup.style.display = popup.style.display === "block" ? "none" : "block";
  });
};

