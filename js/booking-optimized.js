// Optimized Booking Form JavaScript

class BookingForm {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 8;
    this.formData = this.getInitialFormData();
    this.packages = {
      royal: { name: 'Royal Tea Experience', price: 43.14 },
      enhanced: { name: 'Enhanced Celebration', price: 58.00 },
      luxury: { name: 'Luxury Private Experience', price: 75.00 },
      custom: { name: 'Custom VIP Experience', price: 0 }
    };
    
    this.init();
  }

  getInitialFormData() {
    return {
      packageType: '',
      eventType: '',
      preferredDate: '',
      preferredTime: '',
      backupDate: '',
      backupTime: '',
      flexibleDates: false,
      guestCount: 2,
      guestRange: { min: 2, max: 2 },
      countMayChange: false,
      dietaryRestrictions: '',
      photography: false,
      privateRoom: false,
      extendedTime: false,
      accessibilityNeeds: false,
      specialRequests: '',
      addOns: {
        champagne: false,
        photography: false,
        teaSelection: false,
        extendedTime: false
      },
      investmentLevel: 'standard',
      fullName: '',
      phone: '',
      email: '',
      contactMethod: 'text',
      agreeDeposit: false,
      agreeCancellation: false,
      readyToBook: false
    };
  }

  init() {
    // Use event delegation for better performance
    document.addEventListener('DOMContentLoaded', () => {
      this.setupEventListeners();
      this.setMinDate();
      this.updateProgressBar();
      this.updateGuestCount();
    });
  }

  setupEventListeners() {
    // Package selection - Event delegation
    document.addEventListener('click', (e) => {
      const packageCard = e.target.closest('.package-card');
      if (packageCard) {
        this.selectPackage(packageCard);
      }
      
      // Add-on items
      const addonItem = e.target.closest('.addon-item');
      if (addonItem) {
        this.toggleAddon(addonItem);
      }
    });

    // Navigation
    this.setupButton('nextBtn', () => this.nextStep());
    this.setupButton('backBtn', () => this.prevStep());
    this.setupButton('submitBooking', () => this.submitBooking());
    this.setupButton('newBooking', () => this.resetForm());
    
    // Guest counter
    this.setupButton('decreaseGuests', () => this.changeGuestCount(-1));
    this.setupButton('increaseGuests', () => this.changeGuestCount(1));
    
    // Form inputs - Use event delegation
    document.addEventListener('change', (e) => {
      const { id, type, checked, value } = e.target;
      
      // Handle different input types
      if (type === 'checkbox') {
        this.handleCheckbox(id, checked);
      } else if (id && this.formData.hasOwnProperty(id)) {
        this.formData[id] = value;
        this.updateNextButton();
      }
    });
  }

  setupButton(id, handler) {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', handler);
  }

  selectPackage(card) {
    document.querySelectorAll('.package-card').forEach(c => 
      c.classList.remove('selected')
    );
    card.classList.add('selected');
    this.formData.packageType = card.dataset.package;
    this.updateNextButton();
  }

  toggleAddon(item) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (checkbox) {
      checkbox.checked = !checkbox.checked;
      item.classList.toggle('selected', checkbox.checked);
      
      const addon = item.dataset.addon;
      if (this.formData.addOns[addon] !== undefined) {
        this.formData.addOns[addon] = checkbox.checked;
      }
      
      this.updateTotal();
    }
  }

  handleCheckbox(id, checked) {
    switch(id) {
      case 'flexibleDates':
        this.formData.flexibleDates = checked;
        this.toggleElement('backupDates', checked);
        break;
      case 'countMayChange':
        this.formData.countMayChange = checked;
        this.toggleElement('guestRange', checked);
        break;
      case 'agreeDeposit':
      case 'agreeCancellation':
      case 'readyToBook':
        this.formData[id] = checked;
        this.updateNextButton();
        break;
    }
  }

  toggleElement(id, show) {
    const element = document.getElementById(id);
    if (element) element.classList.toggle('hidden', !show);
  }

  changeGuestCount(delta) {
    const newCount = this.formData.guestCount + delta;
    if (newCount >= 2 && newCount <= 30) {
      this.formData.guestCount = newCount;
      this.updateGuestCount();
    }
  }

  updateGuestCount() {
    const countEl = document.getElementById('guestCount');
    if (countEl) countEl.textContent = this.formData.guestCount;
    
    const decreaseBtn = document.getElementById('decreaseGuests');
    const increaseBtn = document.getElementById('increaseGuests');
    
    if (decreaseBtn) decreaseBtn.disabled = this.formData.guestCount <= 2;
    if (increaseBtn) increaseBtn.disabled = this.formData.guestCount >= 30;
    
    // Show/hide alerts
    this.toggleElement('largeGroupAlert', this.formData.guestCount >= 20);
    this.toggleElement('maxCapacityAlert', this.formData.guestCount >= 30);
    
    const isChurchEvent = this.formData.eventType === 'Church Ladies Event' && 
                         this.formData.guestCount > 10;
    this.toggleElement('churchGroupSpecial', isChurchEvent);
    
    this.updateTotal();
  }

  calculateTotal() {
    if (!this.formData.packageType || this.packages[this.formData.packageType].price === 0) {
      return 0;
    }
    
    let total = this.packages[this.formData.packageType].price * this.formData.guestCount;
    
    // Add-ons
    if (this.formData.addOns.champagne) total += 15 * this.formData.guestCount;
    if (this.formData.addOns.photography) total += 75;
    if (this.formData.addOns.teaSelection) total += 12 * this.formData.guestCount;
    if (this.formData.addOns.extendedTime) total += 100;
    
    // Weekend pricing
    if (this.formData.preferredDate) {
      const date = new Date(this.formData.preferredDate);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      if (isWeekend) total += 5 * this.formData.guestCount;
    }
    
    return total;
  }

  updateTotal() {
    const total = this.calculateTotal();
    if (total > 0) {
      const totalEl = document.getElementById('totalAmount');
      const depositEl = document.getElementById('depositAmount');
      
      if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
      if (depositEl) depositEl.textContent = `$${(total * 0.5).toFixed(2)}`;
    }
  }

  updateProgressBar() {
    for (let i = 1; i <= this.totalSteps; i++) {
      const step = document.getElementById(`step${i}`);
      const line = document.getElementById(`line${i}`);
      
      if (step) {
        step.className = 'progress-step ' + 
          (i < this.currentStep ? 'completed' : 
           i === this.currentStep ? 'active' : 'inactive');
      }
      
      if (line) {
        line.className = 'progress-line' + 
          (i < this.currentStep ? ' completed' : '');
      }
    }
  }

  validateCurrentStep() {
    switch(this.currentStep) {
      case 1: return this.formData.packageType !== '';
      case 2: return this.formData.eventType && this.formData.preferredDate && this.formData.preferredTime;
      case 3: return this.formData.guestCount >= 2;
      case 4: return true;
      case 5: return true;
      case 6: return this.formData.fullName && this.formData.phone && this.formData.email;
      case 7: return this.formData.agreeDeposit && this.formData.agreeCancellation && this.formData.readyToBook;
      default: return true;
    }
  }

  updateNextButton() {
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.disabled = !this.validateCurrentStep();
  }

  nextStep() {
    if (this.currentStep < this.totalSteps && this.validateCurrentStep()) {
      this.currentStep++;
      this.showStep(this.currentStep);
      
      if (this.currentStep === 7) {
        this.updateSummary();
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  showStep(step) {
    // Hide all steps
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    
    // Show current step
    const currentStepEl = document.getElementById(`stepContent${step}`);
    if (currentStepEl) currentStepEl.classList.add('active');
    
    this.updateProgressBar();
    
    // Update navigation buttons
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    const navButtons = document.getElementById('navigationButtons');
    const progressContainer = document.getElementById('progressContainer');
    
    if (backBtn) backBtn.style.display = step > 1 ? 'block' : 'none';
    if (nextBtn) nextBtn.style.display = step < this.totalSteps ? 'block' : 'none';
    if (navButtons) navButtons.style.display = step === 9 ? 'none' : 'flex';
    if (progressContainer) progressContainer.style.display = step === 9 ? 'none' : 'block';
    
    this.updateNextButton();
  }

  updateSummary() {
    const updates = {
      summaryPackage: this.packages[this.formData.packageType].name,
      summaryEvent: this.formData.eventType,
      summaryDateTime: `${this.formData.preferredDate} at ${this.formData.preferredTime}`,
      summaryGuests: `${this.formData.guestCount} guests`
    };
    
    Object.entries(updates).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
    
    this.updateTotal();
    this.updateSummaryAddons();
    this.updateSummaryDietary();
  }

  updateSummaryAddons() {
    const hasAddons = Object.values(this.formData.addOns).some(addon => addon);
    this.toggleElement('summaryAddons', hasAddons);
    
    if (hasAddons) {
      const addonsList = document.getElementById('addonsList');
      if (addonsList) {
        const addonsHtml = [];
        if (this.formData.addOns.champagne) {
          addonsHtml.push('<p>• Champagne Service (+$15/guest)</p>');
        }
        if (this.formData.addOns.photography) {
          addonsHtml.push('<p>• Professional Photography (+$75)</p>');
        }
        if (this.formData.addOns.teaSelection) {
          addonsHtml.push('<p>• Take-Home Tea Selection (+$12/guest)</p>');
        }
        if (this.formData.addOns.extendedTime) {
          addonsHtml.push('<p>• Extended Time (+$100)</p>');
        }
        addonsList.innerHTML = addonsHtml.join('');
      }
    }
  }

  updateSummaryDietary() {
    const hasDietary = this.formData.dietaryRestrictions.trim();
    this.toggleElement('summaryDietary', hasDietary);
    
    if (hasDietary) {
      const dietaryText = document.getElementById('dietaryText');
      if (dietaryText) dietaryText.textContent = this.formData.dietaryRestrictions;
    }
  }

  async submitBooking() {
    const submitBtn = document.getElementById('submitBooking');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    
    if (submitBtn) submitBtn.disabled = true;
    if (submitText) submitText.classList.add('hidden');
    if (submitSpinner) submitSpinner.classList.remove('hidden');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Show success page
    this.currentStep = 9;
    this.showStep(9);
    
    // Update confirmation details
    const confirmations = {
      confirmationName: this.formData.fullName,
      confirmationGuests: this.formData.guestCount,
      confirmationDate: this.formData.preferredDate,
      confirmationTime: this.formData.preferredTime,
      confirmationEmail: this.formData.email
    };
    
    Object.entries(confirmations).forEach(([id, text]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    });
    
    // Reset button state
    if (submitBtn) submitBtn.disabled = false;
    if (submitText) submitText.classList.remove('hidden');
    if (submitSpinner) submitSpinner.classList.add('hidden');
  }

  setMinDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = ['preferredDate', 'backupDate'];
    dateInputs.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.min = today;
    });
  }

  resetForm() {
    this.currentStep = 1;
    this.formData = this.getInitialFormData();
    
    // Reset form elements
    document.querySelectorAll('input, select, textarea').forEach(element => {
      if (element.type === 'checkbox' || element.type === 'radio') {
        element.checked = false;
      } else {
        element.value = '';
      }
    });
    
    // Reset specific defaults
    const defaults = {
      guestCount: '2',
      contactText: true,
      investmentStandard: true
    };
    
    Object.entries(defaults).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) {
        if (typeof value === 'boolean') {
          el.checked = value;
        } else {
          el.textContent = value;
        }
      }
    });
    
    // Reset UI states
    document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
    document.querySelectorAll('.hidden').forEach(el => el.classList.add('hidden'));
    
    this.showStep(1);
    this.updateGuestCount();
  }
}

// Initialize the form
new BookingForm();