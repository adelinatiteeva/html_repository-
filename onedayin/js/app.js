(function () {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  const cityGrid = document.getElementById('city-grid');
  const offerList = document.getElementById('offer-list');
  const filterSelect = document.getElementById('offer-filter');
  const pricingButtons = document.querySelectorAll('.pricing-btn');
  const partnerForm = document.getElementById('partner-form');
  const partnerSuccess = document.getElementById('partner-success');
  const activityList = document.getElementById('activity-list');
  const leadOpen = document.getElementById('lead-open');
  const leadClose = document.getElementById('lead-close');
  const leadModal = document.getElementById('lead-modal');
  const leadForm = document.getElementById('lead-form');
  const leadEmailInput = document.getElementById('lead-email');
  const yearEl = document.getElementById('year');

  let activeCityId = null;
  let cities = [];
  let activityRules = [];
  let previouslyFocused = null;

  function initTheme() {
    const stored = localStorage.getItem('onedayin-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = stored || (prefersDark ? 'dark' : 'light');
    setTheme(theme);
  }

  function setTheme(theme) {
    body.setAttribute('data-theme', theme);
    themeToggle.textContent = theme === 'dark' ? '🌙' : '🌞';
    localStorage.setItem('onedayin-theme', theme);
  }

  function toggleTheme() {
    const current = body.getAttribute('data-theme') || 'light';
    setTheme(current === 'light' ? 'dark' : 'light');
  }

  async function loadData() {
    try {
      const response = await fetch('data/cities.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Network response was not ok');
      const json = await response.json();
      return json;
    } catch (error) {
      const seed = document.getElementById('seed-data');
      if (seed) {
        try {
          return JSON.parse(seed.textContent);
        } catch (parseError) {
          console.error('Failed to parse embedded seed data', parseError);
        }
      }
      console.error('Failed to load city data', error);
      return { cities: [], activityRules: [] };
    }
  }

  function renderActivityRules(rules) {
    activityList.innerHTML = '';
    rules.forEach((rule) => {
      const item = document.createElement('li');
      item.className = 'activity-card';
      item.innerHTML = `<h3>${rule.title}</h3><p>Proof: ${rule.proof}</p>`;
      activityList.appendChild(item);
    });
  }

  function renderCities(cityData) {
    cityGrid.innerHTML = '';
    cityData.forEach((city) => {
      const card = document.createElement('article');
      card.className = 'card city-card';
      card.tabIndex = 0;
      card.setAttribute('role', 'listitem');
      card.dataset.cityId = city.id;
      card.innerHTML = `
        <h3>${city.name}</h3>
        <p>${city.description}</p>
      `;
      card.addEventListener('click', () => setActiveCity(city.id));
      card.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setActiveCity(city.id);
        }
      });
      cityGrid.appendChild(card);
    });
  }

  function renderOffers(city) {
    offerList.innerHTML = '';
    if (!city) {
      offerList.innerHTML = '<p>No partners available yet.</p>';
      return;
    }
    const filterValue = filterSelect.value;
    const partners = city.partners.filter((partner) => {
      if (filterValue === 'all') return true;
      return partner.type === filterValue;
    });

    if (partners.length === 0) {
      const emptyState = document.createElement('p');
      emptyState.textContent = 'No partners match the selected filter.';
      offerList.appendChild(emptyState);
      return;
    }

    partners.forEach((partner) => {
      const card = document.createElement('article');
      card.className = 'card offer-card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <h3>${partner.name}</h3>
        <span class="offer-type">${formatOfferType(partner.type)}</span>
        <p>${partner.offer}</p>
        <p><strong>Address:</strong> ${partner.address}</p>
      `;
      offerList.appendChild(card);
    });
  }

  function formatOfferType(type) {
    const map = {
      discount: 'Discount',
      drink: 'Welcome drink',
      entry: 'Free entry'
    };
    return map[type] || type;
  }

  function setActiveCity(cityId) {
    activeCityId = cityId;
    const cards = cityGrid.querySelectorAll('.city-card');
    cards.forEach((card) => {
      card.classList.toggle('active', card.dataset.cityId === cityId);
    });
    const selected = cities.find((city) => city.id === cityId);
    renderOffers(selected);
    document.getElementById('offers').scrollIntoView({ behavior: 'smooth' });
  }

  function handlePricingClick(event) {
    const plan = event.currentTarget.dataset.plan;
    const detail = event.currentTarget.dataset.detail;
    const message = `Thank you! The ${plan} plan (${detail}) is coming soon.`;
    console.log('Pricing CTA:', { plan, detail });
    alert(message);
  }

  function validateEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  }

  function handlePartnerForm(event) {
    event.preventDefault();
    const nameInput = partnerForm.partnerName;
    const typeSelect = partnerForm.offerType;
    const contactInput = partnerForm.partnerContact;

    const errors = {
      name: nameInput.value.trim() === '' ? 'Please add the place name.' : '',
      type: typeSelect.value === '' ? 'Choose an offer type.' : '',
      contact: validateEmail(contactInput.value) ? '' : 'Enter a valid email.'
    };

    document.getElementById('partner-name-error').textContent = errors.name;
    document.getElementById('offer-type-error').textContent = errors.type;
    document.getElementById('partner-contact-error').textContent = errors.contact;

    if (!errors.name && !errors.type && !errors.contact) {
      const payload = {
        name: nameInput.value.trim(),
        type: typeSelect.value,
        contact: contactInput.value.trim()
      };
      console.log('Partner form submission:', payload);
      partnerSuccess.textContent = 'Thank you! We will reach out shortly.';
      partnerForm.reset();
    } else {
      partnerSuccess.textContent = '';
    }
  }

  function openLeadModal() {
    previouslyFocused = document.activeElement;
    leadModal.hidden = false;
    leadModal.classList.add('visible');
    leadEmailInput.focus();
  }

  function closeLeadModal() {
    leadModal.hidden = true;
    leadModal.classList.remove('visible');
    if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
      previouslyFocused.focus();
    }
    leadForm.reset();
    document.getElementById('lead-error').textContent = '';
    document.getElementById('lead-success').textContent = '';
  }

  function handleLeadForm(event) {
    event.preventDefault();
    const email = leadEmailInput.value.trim();
    if (!validateEmail(email)) {
      document.getElementById('lead-error').textContent = 'Please enter a valid email address.';
      document.getElementById('lead-success').textContent = '';
      return;
    }
    console.log('Lead submission:', { email });
    document.getElementById('lead-error').textContent = '';
    document.getElementById('lead-success').textContent = 'Thanks! We will keep you posted.';
  }

  function handleKeyDown(event) {
    if (event.key === 'Escape' && !leadModal.hidden) {
      closeLeadModal();
    }
  }

  function clickOutsideModal(event) {
    if (event.target === leadModal) {
      closeLeadModal();
    }
  }

  async function init() {
    initTheme();
    const data = await loadData();
    cities = data.cities || [];
    activityRules = data.activityRules || [];
    renderActivityRules(activityRules);
    renderCities(cities);
    if (cities.length > 0) {
      setActiveCity(cities[0].id);
    }

    filterSelect.addEventListener('change', () => {
      const city = cities.find((item) => item.id === activeCityId);
      renderOffers(city);
    });

    pricingButtons.forEach((button) => {
      button.addEventListener('click', handlePricingClick);
    });

    partnerForm.addEventListener('submit', handlePartnerForm);
    leadOpen.addEventListener('click', openLeadModal);
    leadClose.addEventListener('click', closeLeadModal);
    leadModal.addEventListener('click', clickOutsideModal);
    leadForm.addEventListener('submit', handleLeadForm);
    document.addEventListener('keydown', handleKeyDown);
    themeToggle.addEventListener('click', toggleTheme);

    if (yearEl) {
      yearEl.textContent = new Date().getFullYear();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
