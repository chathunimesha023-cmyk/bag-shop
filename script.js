/**
 * T&C BAGS — Interactive Script
 * Handles Cart Drawer, Mobile Navigation, Scroll Reveals, Search Modal & Form Handling
 */

document.addEventListener('DOMContentLoaded', () => {
  // ==========================================
  // CART STATE & LOGIC
  // ==========================================
  const CART_STORAGE_KEY = 'tc_bags_cart_v1';
  let cart = [];

  // Load from LocalStorage
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (saved) {
      cart = JSON.parse(saved);
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
    cart = [];
  }

  const cartDrawer = document.getElementById('cartDrawer');
  const cartBackdrop = document.getElementById('cartBackdrop');
  const cartOpenBtn = document.getElementById('cartOpenBtn');
  const cartCloseBtn = document.getElementById('cartCloseBtn');
  const cartItemsContainer = document.getElementById('cartItems');
  const cartFooter = document.getElementById('cartFooter');
  const cartCountBadge = document.getElementById('cartCount');
  const cartBadgeTotal = document.getElementById('cartBadgeTotal');
  const cartSubtotalAmount = document.getElementById('cartSubtotalAmount');
  const clearCartBtn = document.getElementById('clearCartBtn');
  const checkoutBtn = document.getElementById('checkoutBtn');
  const toast = document.getElementById('toast');
  let toastTimer = null;

  function saveCart() {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Could not save cart:', e);
    }
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  function openCartDrawer() {
    if (cartDrawer && cartBackdrop) {
      cartDrawer.classList.add('open');
      cartBackdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeCartDrawer() {
    if (cartDrawer && cartBackdrop) {
      cartDrawer.classList.remove('open');
      cartBackdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function renderCart() {
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Update Badges
    if (cartCountBadge) {
      cartCountBadge.textContent = totalCount;
      cartCountBadge.classList.remove('bump');
      void cartCountBadge.offsetWidth; // Trigger reflow
      cartCountBadge.classList.add('bump');
    }

    if (cartBadgeTotal) {
      cartBadgeTotal.textContent = `${totalCount} item${totalCount === 1 ? '' : 's'}`;
    }

    if (cartSubtotalAmount) {
      cartSubtotalAmount.textContent = `Rs. ${subtotal.toLocaleString('en-IN')}.00`;
    }

    if (!cartItemsContainer) return;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = `
        <div class="cart-empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <p>Your shopping bag is currently empty.</p>
          <a href="#collection" class="btn btn-line btn-sm" id="cartStartShopping">Explore Collection</a>
        </div>
      `;
      if (cartFooter) cartFooter.style.display = 'none';

      const startShoppingBtn = document.getElementById('cartStartShopping');
      if (startShoppingBtn) {
        startShoppingBtn.addEventListener('click', (e) => {
          e.preventDefault();
          closeCartDrawer();
          const target = document.querySelector('#collection');
          if (target) target.scrollIntoView({ behavior: 'smooth' });
        });
      }
      return;
    }

    if (cartFooter) cartFooter.style.display = 'block';

    cartItemsContainer.innerHTML = cart.map(item => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.img}" alt="${item.title}" class="cart-item-img">
        <div class="cart-item-details">
          <h4>${item.title}</h4>
          <p class="cart-item-material">${item.material || 'T&C Artisan'}</p>
          <div class="cart-item-bottom">
            <span class="cart-item-price">Rs. ${(item.price * item.quantity).toLocaleString('en-IN')}.00</span>
            <div class="qty-control">
              <button class="qty-btn" data-action="decrease" data-id="${item.id}" aria-label="Decrease quantity">&minus;</button>
              <span class="qty-val">${item.quantity}</span>
              <button class="qty-btn" data-action="increase" data-id="${item.id}" aria-label="Increase quantity">&plus;</button>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Attach quantity listeners
    cartItemsContainer.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = btn.getAttribute('data-id');
        const action = btn.getAttribute('data-action');
        if (action === 'increase') {
          updateQuantity(id, 1);
        } else if (action === 'decrease') {
          updateQuantity(id, -1);
        }
      });
    });
  }

  function addToCart(product) {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: Number(product.price),
        material: product.material,
        img: product.img,
        quantity: 1
      });
    }

    saveCart();
    renderCart();
    showToast(`Added "${product.title}" to your bag!`);
    openCartDrawer();
  }

  function updateQuantity(id, delta) {
    const itemIndex = cart.findIndex(item => item.id === id);
    if (itemIndex > -1) {
      cart[itemIndex].quantity += delta;
      if (cart[itemIndex].quantity <= 0) {
        const removedTitle = cart[itemIndex].title;
        cart.splice(itemIndex, 1);
        showToast(`Removed "${removedTitle}" from bag.`);
      }
      saveCart();
      renderCart();
    }
  }

  // Hook Add to Bag buttons
  document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = {
        id: btn.getAttribute('data-id'),
        title: btn.getAttribute('data-title'),
        price: btn.getAttribute('data-price'),
        material: btn.getAttribute('data-material'),
        img: btn.getAttribute('data-img')
      };
      addToCart(product);
    });
  });

  // Cart Open & Close listeners
  if (cartOpenBtn) cartOpenBtn.addEventListener('click', openCartDrawer);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCartDrawer);
  if (cartBackdrop) cartBackdrop.addEventListener('click', closeCartDrawer);

  if (clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear your shopping bag?')) {
        cart = [];
        saveCart();
        renderCart();
        showToast('Shopping bag cleared.');
      }
    });
  }

  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
      if (cart.length === 0) return;
      const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      alert(`Thank you for your order!\n\nTotal: Rs. ${total.toLocaleString('en-IN')}.00\nOur studio team will prepare your bags for dispatch.`);
      cart = [];
      saveCart();
      renderCart();
      closeCartDrawer();
      showToast('Order confirmed! Thank you.');
    });
  }

  // Initial cart render
  renderCart();

  // ==========================================
  // MOBILE NAVIGATION
  // ==========================================
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.classList.toggle('active', isOpen);
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        menuToggle.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // ==========================================
  // SCROLL-TRIGGERED NAV STYLING
  // ==========================================
  const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    if (nav) {
      if (window.scrollY > 40) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
  }, { passive: true });

  // ==========================================
  // SCROLL REVEAL ANIMATIONS
  // ==========================================
  const reveals = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => observer.observe(el));
  } else {
    // Fallback for older browsers
    reveals.forEach(el => el.classList.add('revealed'));
  }

  // Immediate check for elements in viewport
  setTimeout(() => {
    reveals.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 50) {
        el.classList.add('revealed');
      }
    });
  }, 100);

  // ==========================================
  // QUICK SEARCH MODAL
  // ==========================================
  const searchBtn = document.getElementById('searchBtn');
  const searchModal = document.getElementById('searchModal');
  const searchClose = document.getElementById('searchClose');
  const searchInput = document.getElementById('searchInput');
  const searchResults = document.getElementById('searchResults');

  // Product catalog for search
  const catalog = [
    {
      id: 'bag-01',
      title: 'The Structured Top-Handle Satchel',
      price: 4500,
      material: 'Two-tone leather · Solid brass disc closure',
      img: 'assets/bag-structured-satchel.jpg'
    },
    {
      id: 'bag-02',
      title: 'The Cloud Puffer Tote',
      price: 2850,
      material: 'Quilted soft-shell · Reinforced shoulder straps',
      img: 'assets/bag-cloud-puffer.jpg'
    },
    {
      id: 'bag-03',
      title: 'The Sweet Beat Corduroy Tote',
      price: 1950,
      material: 'Heavyweight ribbed corduroy · Bear embroidery',
      img: 'assets/bag-corduroy-bear.jpg'
    },
    {
      id: 'bag-04',
      title: 'The Bunny Utility Crossbody Tote',
      price: 2200,
      material: 'Durable dual-tone canvas · Quick-release buckle',
      img: 'assets/bag-bunny-canvas.jpg'
    }
  ];

  function openSearch() {
    if (searchModal && searchInput) {
      searchModal.classList.add('open');
      searchModal.setAttribute('aria-hidden', 'false');
      searchInput.value = '';
      displaySearchResults(catalog);
      setTimeout(() => searchInput.focus(), 100);
      document.body.style.overflow = 'hidden';
    }
  }

  function closeSearch() {
    if (searchModal) {
      searchModal.classList.remove('open');
      searchModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  function displaySearchResults(items) {
    if (!searchResults) return;
    if (items.length === 0) {
      searchResults.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem; padding: 1rem 0;">No matching bags found. Try searching for "leather", "tote", or "corduroy".</p>';
      return;
    }

    searchResults.innerHTML = items.map(item => `
      <div class="search-result-item" data-id="${item.id}">
        <img src="${item.img}" alt="${item.title}">
        <div style="flex-grow: 1;">
          <h5 style="font-family: var(--font-serif); font-size: 1rem; margin-bottom: 2px;">${item.title}</h5>
          <span style="font-family: var(--font-mono); font-size: 0.85rem; color: var(--accent-terracotta);">Rs. ${item.price.toLocaleString('en-IN')}.00</span>
        </div>
        <button class="btn btn-line btn-sm quick-add" data-id="${item.id}">Add</button>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(itemEl => {
      itemEl.addEventListener('click', (e) => {
        if (e.target.closest('.quick-add')) return;
        const id = itemEl.getAttribute('data-id');
        closeSearch();
        const targetCard = document.querySelector(`article[data-id="${id}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.style.outline = '2px solid var(--accent-gold)';
          setTimeout(() => targetCard.style.outline = '', 2000);
        }
      });
    });

    searchResults.querySelectorAll('.quick-add').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const prod = catalog.find(c => c.id === id);
        if (prod) {
          addToCart(prod);
          closeSearch();
        }
      });
    });
  }

  if (searchBtn) searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      if (!q) {
        displaySearchResults(catalog);
        return;
      }
      const filtered = catalog.filter(c => 
        c.title.toLowerCase().includes(q) ||
        c.material.toLowerCase().includes(q)
      );
      displaySearchResults(filtered);
    });
  }

  // Close modals on Escape key
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCartDrawer();
      closeSearch();
    }
  });

  // ==========================================
  // NEWSLETTER FORM
  // ==========================================
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');
  const newsletterNote = document.getElementById('newsletterNote');

  if (newsletterForm && newsletterEmail && newsletterNote) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      if (email) {
        newsletterNote.textContent = `Thank you! We've sent a confirmation to ${email}.`;
        newsletterNote.style.color = 'var(--accent-gold)';
        newsletterEmail.value = '';
        setTimeout(() => {
          newsletterNote.textContent = '';
        }, 5000);
      }
    });
  }
});
