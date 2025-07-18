// Booking Form JavaScript
let currentStep = 1;
const totalSteps = 9;

// Form Data
let formData = {
    // Package
    packageType: 'royal',
    
    // Event Details
    eventType: '',
    preferredDate: '',
    preferredTime: '',
    backupDate: '',
    backupTime: '',
    flexibleDates: false,
    
    // Guest Info
    guestCount: 2,
    guestRange: { min: 2, max: 2 },
    countMayChange: false,
    
    // Special Requirements
    dietaryRestrictions: '',
    photography: false,
    privateRoom: false,
    extendedTime: false,
    accessibilityNeeds: false,
    specialRequests: '',
    
    // Add-ons
    addOns: {
        champagne: false,
        photography: false,
        teaSelection: false,
        extendedTime: false
    },
    
    // Investment Level
    investmentLevel: 'standard',
    
    // Contact Info
    fullName: '',
    phone: '',
    email: '',
    contactMethod: 'text',
    
    // Agreement
    agreeDeposit: false,
    agreeCancellation: false,
    readyToBook: false
};

// Package prices
const packages = {
    royal: { name: 'Royal Tea Experience', price: 43.14 },
    enhanced: { name: 'Enhanced Celebration', price: 58 },
    luxury: { name: 'Luxury Private Experience', price: 75 },
    custom: { name: 'Custom VIP Experience', price: 0 }
};

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('preferredDate').min = today;
    document.getElementById('backupDate').min = today;
    
    // Event listeners for package selection
    document.querySelectorAll('.package-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            formData.packageType = this.dataset.package;
        });
    });
    
    // Select default package
    document.querySelector('[data-package="royal"]').classList.add('selected');
    
    // Guest counter
    document.getElementById('decreaseGuests').addEventListener('click', function() {
        if (formData.guestCount > 2) {
            formData.guestCount--;
            updateGuestCount();
        }
    });
    
    document.getElementById('increaseGuests').addEventListener('click', function() {
        if (formData.guestCount < 30) {
            formData.guestCount++;
            updateGuestCount();
        }
    });
    
    // Flexible dates toggle
    document.getElementById('flexibleDates').addEventListener('change', function() {
        document.getElementById('backupDates').style.display = this.checked ? 'block' : 'none';
        formData.flexibleDates = this.checked;
    });
    
    // Guest count may change toggle
    document.getElementById('countMayChange').addEventListener('change', function() {
        document.getElementById('guestRange').style.display = this.checked ? 'block' : 'none';
        formData.countMayChange = this.checked;
    });
    
    // Form inputs
    document.querySelectorAll('input, select, textarea').forEach(input => {
        input.addEventListener('change', function() {
            updateFormData();
        });
    });
    
    // Add-on cards click handlers
    document.querySelectorAll('.addon-card').forEach(card => {
        card.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('input[type="checkbox"]');
                checkbox.checked = !checkbox.checked;
                updateFormData();
            }
        });
    });
});

function updateGuestCount() {
    document.getElementById('guestCount').textContent = formData.guestCount;
    
    // Update warnings
    const warnings = document.getElementById('guestWarnings');
    warnings.innerHTML = '';
    
    if (formData.guestCount > 20) {
        warnings.innerHTML = '<p style="font-size: 0.875rem; color: rgb(122, 41, 60);">Large groups (20+) will be accommodated in our private room</p>';
    }
    
    if (formData.guestCount === 30) {
        warnings.innerHTML += '<p style="font-size: 0.875rem; color: #dc2626;">30 guests is our maximum capacity</p>';
    }
    
    // Update min/max guest inputs
    document.getElementById('maxGuests').min = formData.guestCount;
    document.getElementById('minGuests').max = formData.guestCount;
}

function updateFormData() {
    // Get all form values
    formData.eventType = document.getElementById('eventType').value;
    formData.preferredDate = document.getElementById('preferredDate').value;
    formData.preferredTime = document.getElementById('preferredTime').value;
    formData.backupDate = document.getElementById('backupDate').value;
    formData.backupTime = document.getElementById('backupTime').value;
    
    formData.guestRange.min = parseInt(document.getElementById('minGuests').value) || 2;
    formData.guestRange.max = parseInt(document.getElementById('maxGuests').value) || 2;
    
    formData.dietaryRestrictions = document.getElementById('dietaryRestrictions').value;
    formData.photography = document.getElementById('photography').checked;
    formData.privateRoom = document.getElementById('privateRoom').checked;
    formData.extendedTime = document.getElementById('extendedTime').checked;
    formData.accessibilityNeeds = document.getElementById('accessibilityNeeds').checked;
    formData.specialRequests = document.getElementById('specialRequests').value;
    
    formData.addOns.champagne = document.getElementById('addOnChampagne').checked;
    formData.addOns.photography = document.getElementById('addOnPhotography').checked;
    formData.addOns.teaSelection = document.getElementById('addOnTeaSelection').checked;
    formData.addOns.extendedTime = document.getElementById('addOnExtendedTime').checked;
    
    formData.investmentLevel = document.querySelector('input[name="investmentLevel"]:checked').value;
    
    formData.fullName = document.getElementById('fullName').value;
    formData.phone = document.getElementById('phone').value;
    formData.email = document.getElementById('email').value;
    formData.contactMethod = document.querySelector('input[name="contactMethod"]:checked').value;
    
    formData.agreeDeposit = document.getElementById('agreeDeposit').checked;
    formData.agreeCancellation = document.getElementById('agreeCancellation').checked;
    formData.readyToBook = document.getElementById('readyToBook').checked;
}

function calculateTotal() {
    const basePrice = packages[formData.packageType].price;
    if (basePrice === 0) return 0; // Custom package
    
    let total = basePrice * formData.guestCount;
    
    // Add-on pricing
    if (formData.addOns.champagne) total += 15 * formData.guestCount;
    if (formData.addOns.photography) total += 75;
    if (formData.addOns.teaSelection) total += 12 * formData.guestCount;
    if (formData.addOns.extendedTime) total += 100;
    
    // Weekend pricing
    if (formData.preferredDate) {
        const date = new Date(formData.preferredDate);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        if (isWeekend) total += 5 * formData.guestCount;
    }
    
    return total;
}

function canProceed() {
    switch(currentStep) {
        case 1:
            return formData.packageType !== '';
        case 2:
            return formData.eventType && formData.preferredDate && formData.preferredTime;
        case 3:
            return formData.guestCount >= 2;
        case 4:
            return true; // Special requirements are optional
        case 5:
            return true; // Add-ons are optional
        case 6:
            return formData.fullName && formData.phone && formData.email;
        case 7:
            return formData.agreeDeposit && formData.agreeCancellation && formData.readyToBook;
        default:
            return true;
    }
}

function updateProgressBar() {
    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (index < currentStep - 1) {
            step.classList.add('completed');
            step.classList.remove('active');
        } else if (index === currentStep - 1) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    });
}

function showStep(step) {
    // Hide all sections
    document.querySelectorAll('.form-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show current section
    document.querySelector(`[data-step="${step}"]`).classList.add('active');
    
    // Update progress bar
    updateProgressBar();
    
    // Update navigation buttons
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    if (step === 1) {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'block';
    }
    
    if (step === 8) {
        nextBtn.textContent = 'Submit Booking Request';
        nextBtn.onclick = submitBooking;
    } else if (step === 9) {
        document.getElementById('navButtons').style.display = 'none';
        document.getElementById('progressContainer').style.display = 'none';
    } else {
        nextBtn.textContent = 'Next';
        nextBtn.onclick = nextStep;
    }
    
    // Update button state
    nextBtn.disabled = !canProceed();
    
    // Show review summary
    if (step === 7) {
        showReviewSummary();
    }
}

function showReviewSummary() {
    const total = calculateTotal();
    const deposit = total * 0.5;
    
    let summaryHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h3 style="font-size: 1.125rem; margin: 0;">${packages[formData.packageType].name}</h3>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.eventType}</p>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.preferredDate} at ${formData.preferredTime}</p>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.guestCount} guests</p>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 1.5rem; font-weight: 700; color: rgb(122, 41, 60); margin: 0;">$${total.toFixed(2)}</p>
                <p style="font-size: 0.875rem; color: #6b7280;">Total estimate</p>
                <p style="font-size: 0.875rem; color: #6b7280;">Deposit: $${deposit.toFixed(2)}</p>
            </div>
        </div>
    `;
    
    // Add-ons
    const selectedAddOns = [];
    if (formData.addOns.champagne) selectedAddOns.push('Champagne Service (+$15/guest)');
    if (formData.addOns.photography) selectedAddOns.push('Professional Photography (+$75)');
    if (formData.addOns.teaSelection) selectedAddOns.push('Take-Home Tea Selection (+$12/guest)');
    if (formData.addOns.extendedTime) selectedAddOns.push('Extended Time (+$100)');
    
    if (selectedAddOns.length > 0) {
        summaryHTML += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                <h4 style="font-size: 1rem; margin: 0 0 0.5rem;">Add-ons:</h4>
                ${selectedAddOns.map(addon => `<p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">• ${addon}</p>`).join('')}
            </div>
        `;
    }
    
    if (formData.dietaryRestrictions) {
        summaryHTML += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                <h4 style="font-size: 1rem; margin: 0 0 0.5rem;">Dietary Requirements:</h4>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0;">${formData.dietaryRestrictions}</p>
            </div>
        `;
    }
    
    document.getElementById('bookingSummary').innerHTML = summaryHTML;
}

function nextStep() {
    updateFormData();
    
    if (canProceed() && currentStep < totalSteps) {
        currentStep++;
        showStep(currentStep);
        window.scrollTo(0, 0);
    }
}

function previousStep() {
    if (currentStep > 1) {
        currentStep--;
        showStep(currentStep);
        window.scrollTo(0, 0);
    }
}

async function submitBooking() {
    updateFormData();
    
    if (!canProceed()) return;
    
    // Show loading state
    const nextBtn = document.getElementById('nextBtn');
    const originalText = nextBtn.innerHTML;
    nextBtn.innerHTML = '<span class="spinner"></span> Processing...';
    nextBtn.disabled = true;
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Show success
    currentStep = 9;
    showStep(currentStep);
    
    // Update success message
    document.getElementById('successMessage').innerHTML = `
        Thank you ${formData.fullName}! We've received your booking request for ${formData.guestCount} guests 
        on ${formData.preferredDate} at ${formData.preferredTime}.
        <br><br>
        You'll receive a confirmation email at ${formData.email} within the next 2 hours 
        with your secure payment link.
    `;
    
    // Reset button
    nextBtn.innerHTML = originalText;
    nextBtn.disabled = false;
}

function resetForm() {
    // Reset form data
    formData = {
        packageType: 'royal',
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
    
    // Reset form
    document.getElementById('bookingForm').reset();
    
    // Reset UI
    currentStep = 1;
    document.getElementById('navButtons').style.display = 'flex';
    document.getElementById('progressContainer').style.display = 'block';
    showStep(currentStep);
    
    // Reset package selection
    document.querySelectorAll('.package-card').forEach(c => c.classList.remove('selected'));
    document.querySelector('[data-package="royal"]').classList.add('selected');
}

// Monitor form changes for validation
document.addEventListener('change', function() {
    if (currentStep < 9) {
        const nextBtn = document.getElementById('nextBtn');
        nextBtn.disabled = !canProceed();
    }
});