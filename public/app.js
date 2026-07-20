/* -------------------------------------------------------------
 * WHEELOR - WEAR BEYOND ORDINARY
 * Application Logic & WhatsApp Order System
 * ------------------------------------------------------------- */

// Store Configuration
const STORE_CONFIG = {
  brandName: "WHEELOR",
  tagline: "WEAR BEYOND ORDINARY",
  whatsappNumber: "919942305574",
  location: "India",
  defaultPrice: 399,
  currencySymbol: "₹"
};

// High-Resolution Valid Base64 Panda Tee Image
const LAZY_PANDA_BASE64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700"><rect width="600" height="700" fill="%23F4F0EA"/><path d="M150 70 Q300 95 450 70 L550 170 L470 250 L470 650 L130 650 L130 250 L50 170 Z" fill="%23FAF7F2" stroke="%23E2DDD3" stroke-width="4"/><path d="M250 70 Q300 110 350 70" fill="none" stroke="%23111118" stroke-width="4"/><rect x="275" y="105" width="50" height="24" fill="%23000" rx="3"/><text x="300" y="121" fill="%23FFF" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">WHEELOR</text><text x="300" y="195" fill="%23111118" font-family="sans-serif" font-weight="900" font-size="32" letter-spacing="1" text-anchor="middle">doing</text><text x="300" y="240" fill="%23111118" font-family="sans-serif" font-weight="900" font-size="44" letter-spacing="1" text-anchor="middle">nothing</text><ellipse cx="300" cy="365" rx="115" ry="75" fill="%23E5E7EB"/><circle cx="240" cy="305" r="18" fill="%23111118"/><circle cx="360" cy="305" r="18" fill="%23111118"/><ellipse cx="300" cy="345" rx="70" ry="55" fill="%23FFFFFF" stroke="%23111118" stroke-width="4"/><ellipse cx="272" cy="340" rx="12" ry="16" fill="%23111118"/><ellipse cx="328" cy="340" rx="12" ry="16" fill="%23111118"/><polygon points="300,357 290,369 310,369" fill="%23111118"/><path d="M288 380 Q300 393 312 380" fill="none" stroke="%23111118" stroke-width="4"/><rect x="335" y="365" width="38" height="52" fill="%23D97706" rx="8" stroke="%23111118" stroke-width="2"/><rect x="343" y="355" width="22" height="12" fill="%23FFFFFF" rx="2"/><line x1="354" y1="335" x2="354" y2="355" stroke="%23111118" stroke-width="4"/><rect x="235" y="455" width="130" height="28" fill="%23F3E8FF" rx="6"/><text x="300" y="475" fill="%23111118" font-family="sans-serif" font-weight="800" font-size="16" text-anchor="middle">is a</text><text x="300" y="520" fill="%23111118" font-family="sans-serif" font-weight="900" font-size="34" letter-spacing="1" text-anchor="middle">full-time job</text></svg>`;

// Default Initial Product (ONLY 1 Valid Drop - No duplicates, no blank cards)
const DEFAULT_PRODUCTS = [
  {
    id: "drop-01",
    name: "Lazy Panda Tee",
    category: "oversized",
    categoryLabel: "Oversized Fit",
    price: 399,
    originalPrice: 799,
    discount: "50% OFF",
    stockStatus: "Only 4 Left",
    color: "Cream / Off-White",
    fabric: "100% Cotton",
    tagline: "Doing Nothing Is A Full-Time Job",
    description: "Ultra-chill oversized graphic tee crafted from combed French Terry cotton.",
    frontImg: LAZY_PANDA_BASE64,
    backImg: LAZY_PANDA_BASE64,
    currentView: "front",
    selectedSize: "M",
    badge: "BESTSELLER"
  }
];

// Active Products State
let PRODUCTS = [];

// Clean up local storage from old broken image paths
function loadStoreProducts() {
  const stored = localStorage.getItem("WHEELOR_PRODUCTS");
  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      let cleaned = parsed.filter(p => p.frontImg && !p.frontImg.includes("./images/"));
      
      const unique = [];
      const seen = new Set();
      for (const p of cleaned) {
        if (!seen.has(p.id) && !seen.has(p.name)) {
          seen.add(p.id);
          seen.add(p.name);
          unique.push(p);
        }
      }

      if (unique.length > 0) {
        PRODUCTS = unique;
      } else {
        PRODUCTS = DEFAULT_PRODUCTS;
      }
    } catch(e) {
      PRODUCTS = DEFAULT_PRODUCTS;
    }
  } else {
    PRODUCTS = DEFAULT_PRODUCTS;
  }
  
  localStorage.setItem("WHEELOR_PRODUCTS", JSON.stringify(PRODUCTS));
}

// Track Traffic & Page Views
function trackPageView() {
  let views = parseInt(localStorage.getItem("WHEELOR_PAGE_VIEWS") || "142", 10);
  views++;
  localStorage.setItem("WHEELOR_PAGE_VIEWS", views.toString());
}

function trackWhatsAppClick() {
  let waClicks = parseInt(localStorage.getItem("WHEELOR_WA_CLICKS") || "38", 10);
  waClicks++;
  localStorage.setItem("WHEELOR_WA_CLICKS", waClicks.toString());
}

// Current Filter State
let currentFilter = "all";
let activeModalProduct = null;

// Initialize App
document.addEventListener("DOMContentLoaded", () => {
  trackPageView();
  loadStoreProducts();
  renderProducts();
  setupEventListeners();
  setupPincodeChecker();
  setupHeroImage();
});

// Setup Hero Featured Image
function setupHeroImage() {
  const heroImg = document.getElementById("heroCardImg");
  if (heroImg && PRODUCTS.length > 0) {
    heroImg.src = PRODUCTS[0].frontImg;
  }
}

// Render Product Catalog (ONLY Show Valid Uploaded Products)
function renderProducts() {
  const grid = document.getElementById("productsGrid");
  if (!grid) return;

  const filteredProducts = currentFilter === "all" 
    ? PRODUCTS 
    : PRODUCTS.filter(p => p.category === currentFilter || (currentFilter === "bestseller" && p.badge === "BESTSELLER"));

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <h3>NO DROPS FOUND IN THIS CATEGORY</h3>
        <p>Go to the <a href="admin.html" style="color: var(--accent-cyan); text-decoration: underline;">Admin Panel</a> to upload new products!</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filteredProducts.map(product => `
    <article class="product-card" id="card-${product.id}">
      <div class="product-image-container" onclick="openProductModal('${product.id}')">
        <div class="card-badges">
          <span class="badge-discount">${product.discount}</span>
          <span class="badge-stock">⚡ ${product.stockStatus}</span>
        </div>

        <img 
          src="${product.frontImg}" 
          alt="${product.name}" 
          class="product-img" 
          id="img-${product.id}"
        />
      </div>

      <div class="product-card-body">
        <span class="product-category">${product.categoryLabel || 'Oversized Fit'}</span>
        <h3 class="product-name">${product.name}</h3>

        <div class="price-container">
          <span class="price-current">₹${product.price}</span>
          <span class="price-original">₹${product.originalPrice}</span>
        </div>

        <div class="size-selector-label">
          <span>SELECT SIZE</span>
          <span class="size-guide-link" onclick="openSizeGuideModal()">SIZE CHART</span>
        </div>

        <div class="size-pills">
          ${["M", "L", "XL"].map(size => `
            <button 
              class="size-pill ${product.selectedSize === size ? 'selected' : ''}" 
              onclick="selectSize('${product.id}', '${size}')"
            >
              ${size}
            </button>
          `).join("")}
        </div>

        <button 
          class="btn-wa-order" 
          onclick="orderOnWhatsApp('${product.id}')"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347m-5.421 7.461c-2.43 0-4.661-.75-6.495-2.023l-.466-.324-4.825 1.265 1.288-4.704-.306-.487a11.2 11.2 0 0 1-1.716-5.961c0-6.208 5.05-11.258 11.258-11.258 3.007 0 5.834 1.171 7.962 3.298 2.126 2.128 3.297 4.954 3.296 7.962 0 6.209-5.05 11.258-11.258 11.258"/>
          </svg>
          ENQUIRE ON WHATSAPP
        </button>
      </div>
    </article>
  `).join("");
}

// Select Product Size
function selectSize(productId, size) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  product.selectedSize = size;
  
  const card = document.getElementById(`card-${productId}`);
  if (card) {
    const pills = card.querySelectorAll(".size-pill");
    pills.forEach(pill => {
      if (pill.innerText.trim() === size) {
        pill.classList.add("selected");
      } else {
        pill.classList.remove("selected");
      }
    });
  }

  showToast(`Selected Size ${size} for ${product.name}`);
}

// Generate Direct WhatsApp Message
function orderOnWhatsApp(productId) {
  trackWhatsAppClick();
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  const message = 
`🔥 *NEW ORDER ENQUIRY - WHEELOR* 🔥
----------------------------------
🛍️ *Item:* ${product.name}
📏 *Size:* ${product.selectedSize}
💰 *Price:* ₹${product.price} (MRP ₹${product.originalPrice})
🧵 *Fabric:* ${product.fabric || '100% Cotton'}
🎨 *Color:* ${product.color || 'Cream'}
----------------------------------
📍 *Location:* India
Hi WHEELOR! I would like to place an order for this t-shirt. Please confirm availability and share payment options (UPI/GPay/PhonePe). Thank you!`;

  const waUrl = `https://wa.me/${STORE_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  
  showToast(`Opening WhatsApp for ${product.name} (Size: ${product.selectedSize})...`);
  window.open(waUrl, "_blank");
}

// Open Product Modal
function openProductModal(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return;

  activeModalProduct = product;
  const modal = document.getElementById("productModal");
  if (!modal) return;

  document.getElementById("modalTitle").innerText = product.name;
  document.getElementById("modalPrice").innerText = `₹${product.price}`;
  document.getElementById("modalOriginalPrice").innerText = `₹${product.originalPrice}`;
  document.getElementById("modalDiscount").innerText = product.discount;
  document.getElementById("modalDesc").innerText = product.description;
  document.getElementById("modalTagline").innerText = `"${product.tagline || 'Wear Beyond Ordinary'}"`;
  document.getElementById("modalFabric").innerText = product.fabric || "100% Cotton";
  document.getElementById("modalColor").innerText = product.color || "Cream";

  const modalImg = document.getElementById("modalImg");
  if (modalImg) modalImg.src = product.frontImg;

  const sizeWrap = document.getElementById("modalSizePills");
  if (sizeWrap) {
    sizeWrap.innerHTML = ["M", "L", "XL"].map(size => `
      <button 
        class="size-pill ${product.selectedSize === size ? 'selected' : ''}" 
        onclick="selectModalSize('${size}')"
      >
        ${size}
      </button>
    `).join("");
  }

  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function selectModalSize(size) {
  if (!activeModalProduct) return;
  selectSize(activeModalProduct.id, size);
  
  const sizeWrap = document.getElementById("modalSizePills");
  if (sizeWrap) {
    const pills = sizeWrap.querySelectorAll(".size-pill");
    pills.forEach(pill => {
      if (pill.innerText.trim() === size) {
        pill.classList.add("selected");
      } else {
        pill.classList.remove("selected");
      }
    });
  }
}

function submitModalOrder() {
  if (!activeModalProduct) return;
  orderOnWhatsApp(activeModalProduct.id);
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

// Open Size Guide Modal
function openSizeGuideModal() {
  const modal = document.getElementById("sizeGuideModal");
  if (modal) {
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

// Open Policies Modal
function openPoliciesModal(defaultTab = 'shipping') {
  const modal = document.getElementById("policiesModal");
  if (modal) {
    switchPolicyTab(defaultTab);
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
}

function switchPolicyTab(tabId) {
  const links = document.querySelectorAll(".policy-tab-link");
  const contents = document.querySelectorAll(".policy-tab-content");

  links.forEach(link => {
    if (link.dataset.tab === tabId) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  contents.forEach(content => {
    if (content.id === `policy-${tabId}`) {
      content.classList.add("active");
    } else {
      content.classList.remove("active");
    }
  });
}

// Setup Event Listeners
function setupEventListeners() {
  const filterBtns = document.querySelectorAll(".filter-btn");
  filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      filterBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderProducts();
    });
  });

  const overlays = document.querySelectorAll(".modal-overlay");
  overlays.forEach(overlay => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        closeModal(overlay.id);
      }
    });
  });
}

// Pincode Checker Logic
function setupPincodeChecker() {
  const btn = document.getElementById("pincodeCheckBtn");
  const input = document.getElementById("pincodeInput");
  const result = document.getElementById("pincodeResult");

  if (btn && input && result) {
    btn.addEventListener("click", () => {
      const pin = input.value.trim();
      if (/^\d{6}$/.test(pin)) {
        result.className = "pincode-result success";
        result.innerHTML = `⚡ Pincode <strong>${pin}</strong> is eligible for Express Delivery across India (3-5 Days)!`;
      } else {
        result.className = "pincode-result error";
        result.innerText = "❌ Please enter a valid 6-digit Indian Pincode.";
      }
    });
  }
}

// Toast Notification Helper
function showToast(message) {
  let toast = document.getElementById("toastNotification");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toastNotification";
    toast.className = "toast-notification";
    document.body.appendChild(toast);
  }

  toast.innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}
