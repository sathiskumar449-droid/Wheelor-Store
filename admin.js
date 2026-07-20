/* -------------------------------------------------------------
 * WHEELOR Admin Dashboard Script
 * Handles Admin Security PIN Auth, Product Uploads, Local Storage Sync, and Traffic Analytics
 * ------------------------------------------------------------- */

const STORE_ADMIN_PIN = "9876@1234";

const LAZY_PANDA_BASE64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700"><rect width="600" height="700" fill="%23F4F0EA"/><path d="M150 70 Q300 95 450 70 L550 170 L470 250 L470 650 L130 650 L130 250 L50 170 Z" fill="%23FAF7F2" stroke="%23E2DDD3" stroke-width="4"/><path d="M250 70 Q300 110 350 70" fill="none" stroke="%23111118" stroke-width="4"/><rect x="275" y="105" width="50" height="24" fill="%23000" rx="3"/><text x="300" y="121" fill="%23FFF" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">WHEELOR</text><text x="300" y="195" fill="%23111118" font-family="sans-serif" font-weight="900" font-size="32" letter-spacing="1" text-anchor="middle">doing</text><text x="300" y="240" fill="%23111118" font-family="sans-serif" font-weight="900" font-size="44" letter-spacing="1" text-anchor="middle">nothing</text><ellipse cx="300" cy="365" rx="115" ry="75" fill="%23E5E7EB"/><circle cx="240" cy="305" r="18" fill="%23111118"/><circle cx="360" cy="305" r="18" fill="%23111118"/><ellipse cx="300" cy="345" rx="70" ry="55" fill="%23FFFFFF" stroke="%23111118" stroke-width="4"/><ellipse cx="272" cy="340" rx="12" ry="16" fill="%23111118"/><ellipse cx="328" cy="340" rx="12" ry="16" fill="%23111118"/><polygon points="300,357 290,369 310,369" fill="%23111118"/><path d="M288 380 Q300 393 312 380" fill="none" stroke="%23111118" stroke-width="4"/><rect x="335" y="365" width="38" height="52" fill="%23D97706" rx="8" stroke="%23111118" stroke-width="2"/><rect x="343" y="355" width="22" height="12" fill="%23FFFFFF" rx="2"/><line x1="354" y1="335" x2="354" y2="355" stroke="%23111118" stroke-width="4"/><rect x="235" y="455" width="130" height="28" fill="%23F3E8FF" rx="6"/><text x="300" y="475" fill="%23111118" font-family="sans-serif" font-weight="800" font-size="16" text-anchor="middle">is a</text><text x="300" y="520" fill="%23111118" font-family="sans-serif" font-weight="900" font-size="34" letter-spacing="1" text-anchor="middle">full-time job</text></svg>`;

const DEFAULT_PRODUCTS = [];

// Verify Admin Security PIN
function checkAdminAuth() {
  const isAuth = sessionStorage.getItem("WHEELOR_ADMIN_AUTH");
  const overlay = document.getElementById("adminPinAuthOverlay");
  
  if (isAuth === "true") {
    if (overlay) overlay.classList.remove("active");
  } else {
    if (overlay) overlay.classList.add("active");
  }
}

function verifyAdminPin(event) {
  event.preventDefault();
  const inputPin = document.getElementById("adminPinInput").value.trim();
  const errorElem = document.getElementById("adminPinError");

  if (inputPin === STORE_ADMIN_PIN) {
    sessionStorage.setItem("WHEELOR_ADMIN_AUTH", "true");
    document.getElementById("adminPinAuthOverlay").classList.remove("active");
    renderAnalytics();
    renderAdminProductsTable();
  } else {
    errorElem.innerText = "❌ Incorrect Admin PIN. Access Denied!";
    document.getElementById("adminPinInput").value = "";
  }
}

function lockAdminPanel() {
  sessionStorage.removeItem("WHEELOR_ADMIN_AUTH");
  const overlay = document.getElementById("adminPinAuthOverlay");
  if (overlay) overlay.classList.add("active");
}

// Load Products from LocalStorage or Set Default
function getStoredProducts() {
  const stored = localStorage.getItem("WHEELOR_PRODUCTS");
  if (stored) {
    try {
      let parsed = JSON.parse(stored);
      let cleaned = parsed.filter(p => p.frontImg && !p.frontImg.includes("./images/") && p.id !== "drop-01" && p.name !== "Lazy Panda Tee");
      
      const unique = [];
      const seen = new Set();
      for (const p of cleaned) {
        if (!seen.has(p.id) && !seen.has(p.name)) {
          seen.add(p.id);
          seen.add(p.name);
          unique.push(p);
        }
      }

      return unique;
    } catch(e) {
      return [];
    }
  } else {
    localStorage.setItem("WHEELOR_PRODUCTS", JSON.stringify([]));
    return [];
  }
}

function saveProducts(products) {
  try {
    localStorage.setItem("WHEELOR_PRODUCTS", JSON.stringify(products));
    return true;
  } catch (e) {
    console.error("LocalStorage Quota Exceeded:", e);
    alert("⚠️ LocalStorage Quota Exceeded! The image file size is too large for browser memory. Please try uploading a smaller image file or paste an image URL.");
    return false;
  }
}

// Convert and Compress uploaded file to Lightweight Base64 JPEG (max 1000px, 0.8 quality)
function convertImageFile(fileInput, targetInputId) {
  const file = fileInput.files[0];
  if (!file) return;

  const targetInput = document.getElementById(targetInputId);
  const formBtn = document.querySelector("#adminUploadForm button[type='submit']");
  
  if (targetInput) targetInput.placeholder = "⏳ Compressing image, please wait...";
  if (formBtn) {
    formBtn.disabled = true;
    formBtn.innerText = "⏳ COMPRESSING IMAGE...";
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement("canvas");
      const MAX_WIDTH = 1000;
      const MAX_HEIGHT = 1000;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      // Canvas JPEG compression reduces 5MB image to ~50KB
      const compressedBase64 = canvas.toDataURL("image/jpeg", 0.8);
      targetInput.value = compressedBase64;

      if (formBtn) {
        formBtn.disabled = false;
        formBtn.innerHTML = "🚀 PUBLISH DROP TO WEBSITE";
      }
    };
    img.onerror = function() {
      targetInput.value = e.target.result;
      if (formBtn) {
        formBtn.disabled = false;
        formBtn.innerHTML = "🚀 PUBLISH DROP TO WEBSITE";
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// Initialize Admin Dashboard
document.addEventListener("DOMContentLoaded", () => {
  checkAdminAuth();
  renderAnalytics();
  renderAdminProductsTable();

  // Real-time live update when users visit site or click WhatsApp
  window.addEventListener("storage", (e) => {
    if (e.key === "WHEELOR_PAGE_VIEWS" || e.key === "WHEELOR_WA_CLICKS") {
      renderAnalytics();
    }
    if (e.key === "WHEELOR_PRODUCTS") {
      renderAdminProductsTable();
    }
  });
});

// Render Traffic & Analytics Stats
function renderAnalytics() {
  const views = parseInt(localStorage.getItem("WHEELOR_PAGE_VIEWS") || "0", 10);
  const waClicks = parseInt(localStorage.getItem("WHEELOR_WA_CLICKS") || "0", 10);
  const products = getStoredProducts();

  const vElem = document.getElementById("statPageViews");
  const cElem = document.getElementById("statWaClicks");
  const pElem = document.getElementById("statProductsCount");
  const rElem = document.getElementById("statConversion");

  if (vElem) vElem.innerText = views.toLocaleString();
  if (cElem) cElem.innerText = waClicks.toLocaleString();
  if (pElem) pElem.innerText = products.length;

  const convRate = views > 0 ? ((waClicks / views) * 100).toFixed(1) : "0";
  if (rElem) rElem.innerText = `${convRate}%`;
}

function resetAnalyticsData() {
  if (confirm("Reset website page visits and enquiry click statistics?")) {
    localStorage.setItem("WHEELOR_PAGE_VIEWS", "0");
    localStorage.setItem("WHEELOR_WA_CLICKS", "0");
    renderAnalytics();
  }
}

// Render Products Table
function renderAdminProductsTable() {
  const tbody = document.getElementById("adminProductsTableBody");
  if (!tbody) return;

  const products = getStoredProducts();
  
  tbody.innerHTML = products.map((prod, index) => `
    <tr>
      <td><img src="${prod.frontImg}" alt="Front" class="admin-thumb" onerror="this.src='./images/logo.png'" /></td>
      <td><strong>${prod.name}</strong><br/><small style="color:var(--text-secondary);">${prod.color || 'Cream'}</small></td>
      <td><span class="badge-stock">${prod.category.toUpperCase()}</span></td>
      <td><strong style="color:var(--accent-orange);">₹${prod.price}</strong> <del style="font-size:0.75rem; color:var(--text-muted);">₹${prod.originalPrice}</del></td>
      <td>
        <button class="btn-admin-danger" onclick="deleteProduct('${prod.id}')">🗑️ DELETE</button>
      </td>
    </tr>
  `).join("");
}

// Handle Form Submission for New Product Upload
function handleProductUpload(event) {
  event.preventDefault();

  const title = document.getElementById("prodTitle").value.trim();
  const category = document.getElementById("prodCategory").value;
  const price = parseInt(document.getElementById("prodPrice").value, 10) || 399;
  const originalPrice = parseInt(document.getElementById("prodOriginalPrice").value, 10) || 799;
  const color = document.getElementById("prodColor").value.trim();
  const stock = document.getElementById("prodStock").value.trim();
  const frontImg = document.getElementById("prodFrontData").value.trim() || LAZY_PANDA_BASE64;
  const backImg = document.getElementById("prodBackData").value.trim() || frontImg;
  const tagline = document.getElementById("prodTagline").value.trim() || "Wear Beyond Ordinary";
  const description = document.getElementById("prodDesc").value.trim() || "Exclusive oversized graphic t-shirt.";

  if (!title) {
    alert("⚠️ Please fill in the product title!");
    return;
  }

  const discountCalc = Math.round(((originalPrice - price) / originalPrice) * 100);

  const newProduct = {
    id: "drop-" + Date.now(),
    name: title,
    category: category,
    categoryLabel: category === "oversized" ? "Oversized Fit" : (category === "anime" ? "Anime & Gaming" : "Streetwear Graphic"),
    price: price,
    originalPrice: originalPrice,
    discount: `${discountCalc}% OFF`,
    stockStatus: stock,
    color: color,
    fabric: "100% Cotton",
    tagline: tagline,
    description: description,
    frontImg: frontImg,
    backImg: backImg,
    currentView: "front",
    selectedSize: "M",
    badge: "NEW DROP"
  };

  const products = getStoredProducts();
  products.unshift(newProduct);
  const success = saveProducts(products);

  if (success) {
    document.getElementById("adminUploadForm").reset();
    alert(`✅ Drop "${title}" uploaded successfully! It is now live on the website.`);
    renderAdminProductsTable();
    renderAnalytics();
  }
}

// Delete Product
function deleteProduct(productId) {
  let products = getStoredProducts();
  const target = products.find(p => p.id === productId);

  if (target && confirm(`Are you sure you want to delete "${target.name}" from the store?`)) {
    products = products.filter(p => p.id !== productId);
    saveProducts(products);
    renderAdminProductsTable();
    renderAnalytics();
  }
}
