(() => {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const citiesGrid = document.getElementById('citiesGrid');
  const offersList = document.getElementById('offersList');
  const filterSelect = document.getElementById('offerFilter');
  const activityList = document.getElementById('activityList');
  const partnerForm = document.getElementById('partnerForm');
  const partnerFeedback = document.getElementById('partnerFeedback');
  const leadTrigger = document.getElementById('leadTrigger');
  const leadModal = document.getElementById('leadModal');
  const leadForm = document.getElementById('leadForm');
  const leadFeedback = document.getElementById('leadFeedback');
  const leadEmail = document.getElementById('leadEmail');
  const leadClose = document.getElementById('leadClose');
  const yearElement = document.getElementById('year');

  const state = {
    cities: [],
    activityRules: [],
    activeCityId: null,
    filter: 'all'
  };

  const typeLabels = {
    discount: 'Discount',
    drink: 'Welcome drink',
    entry: 'Free entry'
  };

  function applyTheme(theme) {
    const nextTheme = theme === 'dark' ? 'dark' : 'light';
    root.setAttribute('data-theme', nextTheme);
    themeToggle.setAttribute('aria-pressed', String(nextTheme === 'dark'));
    localStorage.setItem('onedayin-theme', nextTheme);
  }

  function initTheme() {
    const stored = localStorage.getItem('onedayin-theme');
    if (stored) {
      applyTheme(stored);
      return;
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(prefersDark ? 'dark' : 'light');
  }

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  async function loadData() {
    try {
      const response = await fetch('data/cities.json', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return await response.json();
    } catch (error) {
      console.warn('Falling back to embedded data', error);
      const seed = document.getElementById('seed-data');
      if (seed && seed.textContent) {
        try {
          return JSON.parse(seed.textContent);
        } catch (parseError) {
          console.error('Could not parse embedded data', parseError);
        }
      }
      return { cities: [], activityRules: [] };
    }
  }

  function renderActivities() {
    if (!activityList) return;
    activityList.innerHTML = '';
    if (!state.activityRules.length) {
      const li = document.createElement('li');
      li.textContent = 'Complete one mindful activity to unlock your perk.';
      activityList.append(li);
      return;
    }
    state.activityRules.forEach((rule) => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${rule.title}</strong> — ${rule.proof}`;
      activityList.append(li);
    });
  }

  function setActiveCity(cityId, scrollToOffers = false) {
    state.activeCityId = cityId;
    renderCities();
    renderOffers();
    if (scrollToOffers) {
      const offersSection = document.getElementById('offers');
      offersSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderCities() {
    if (!citiesGrid) return;
    citiesGrid.innerHTML = '';
    state.cities.forEach((city) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('role', 'listitem');
      const isActive = city.id === state.activeCityId;
      if (isActive) {
        card.classList.add('active');
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'city-button';
      button.setAttribute('aria-pressed', String(isActive));
      button.innerHTML = `
        <h3>${city.name}</h3>
        <p>${city.description}</p>
      `;
      button.addEventListener('click', () => setActiveCity(city.id, true));
      card.append(button);
      citiesGrid.append(card);
    });
    if (!state.activeCityId && state.cities.length) {
      setActiveCity(state.cities[0].id, false);
    }
  }

  function renderOffers() {
    if (!offersList) return;
    offersList.innerHTML = '';
    const activeCity = state.cities.find((city) => city.id === state.activeCityId);
    if (!activeCity) {
      const empty = document.createElement('p');
      empty.textContent = 'Select a city to see available partner perks.';
      offersList.append(empty);
      return;
    }
    const partners = activeCity.partners || [];
    const filtered = state.filter === 'all'
      ? partners
      : partners.filter((partner) => partner.type === state.filter);

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No offers match this filter yet. Try another one!';
      offersList.append(empty);
      return;
    }

    filtered.forEach((partner) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.setAttribute('role', 'listitem');
      card.innerHTML = `
        <h3>${partner.name}</h3>
        <p>${partner.offer}</p>
        <p><strong>${typeLabels[partner.type] || 'Offer'}</strong></p>
        <p>${partner.address}</p>
      `;
      offersList.append(card);
    });
  }

  filterSelect?.addEventListener('change', (event) => {
    state.filter = event.target.value;
    renderOffers();
  });

  document.querySelectorAll('.pricing-btn').forEach((button) => {
    button.addEventListener('click', (event) => {
      const plan = event.currentTarget.getAttribute('data-plan');
      console.log(`Pricing selected: ${plan}`);
      alert(`Thank you! The ${plan} plan will be available at checkout.`);
    });
  });

  partnerForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(partnerForm);
    const name = formData.get('partnerName')?.toString().trim();
    const type = formData.get('partnerType')?.toString();
    const contact = formData.get('partnerContact')?.toString().trim();

    if (!name || !type || !contact) {
      partnerFeedback.textContent = 'Please fill in all fields.';
      partnerForm.reportValidity();
      return;
    }

    console.log('Partner submission', { name, type, contact });
    partnerFeedback.textContent = 'Thank you! We will get back to you soon.';
    partnerForm.reset();
  });

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  leadTrigger?.addEventListener('click', () => {
    leadFeedback.textContent = '';
    leadForm.reset();
    leadModal.showModal();
    setTimeout(() => leadEmail.focus(), 50);
  });

  leadClose?.addEventListener('click', () => {
    leadModal.close();
  });

  leadModal?.addEventListener('cancel', (event) => {
    event.preventDefault();
    leadModal.close();
  });

  leadForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = leadEmail.value.trim();
    if (!emailPattern.test(email)) {
      leadFeedback.textContent = 'Please enter a valid email address.';
      leadEmail.focus();
      return;
    }
    console.log('Lead email submitted', email);
    leadFeedback.textContent = 'Thank you! You are on the list.';
  });

  loadData().then((data) => {
    state.cities = Array.isArray(data.cities) ? data.cities : [];
    state.activityRules = Array.isArray(data.activityRules) ? data.activityRules : [];
    renderActivities();
    renderCities();
    renderOffers();
  });

  initTheme();
})();
