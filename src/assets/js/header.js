// Switch Delivery ↔ Pickup
function switchFulfillment(mode) {
  document.getElementById('btn-delivery')
    .classList.toggle('fulfillment-btn--active', mode === 'delivery');
  document.getElementById('btn-pickup')
    .classList.toggle('fulfillment-btn--active', mode === 'pickup');
}

// Open mobile menu
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  menu.classList.toggle('is-open');
  document.body.style.overflow = menu.classList.contains('is-open') ? 'hidden' : '';
}

// Open Salla's built-in search
function openSearch() {
  salla.event.dispatch('search::open');
}

// Open Salla's address modal
function openAddressModal() {
  salla.event.dispatch('address::selectAddress');
}