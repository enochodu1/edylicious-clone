// Enhanced Booking Form with Square Payment Integration and Email
let currentStep = 1;
const totalSteps = 9;

// Square Application ID (replace with your actual Square app ID)
const SQUARE_APP_ID = 'YOUR_SQUARE_APP_ID';
const SQUARE_LOCATION_ID = 'YOUR_SQUARE_LOCATION_ID';

// Email endpoint
const EMAIL_ENDPOINT = 'https://formspree.io/f/YOUR_FORM_ID'; // Replace with your Formspree ID or backend endpoint

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
    readyToBook: false,
    
    // Payment
    paymentNonce: null,
    bookingId: null
};

// Package prices
const packages = {
    royal: { name: 'Royal Tea Experience', price: 43.14 },
    enhanced: { name: 'Enhanced Celebration', price: 58 },
    luxury: { name: 'Luxury Private Experience', price: 75 },
    custom: { name: 'Custom VIP Experience', price: 0 }
};

// Initialize Square Payment
let squareCard;
let squarePaymentForm;

async function initializeSquarePayment() {
    if (!window.Square) {
        console.error('Square.js failed to load');
        return;
    }
    
    const payments = window.Square.payments(SQUARE_APP_ID, SQUARE_LOCATION_ID);
    
    try {
        squareCard = await payments.card();
        await squareCard.attach('#card-container');
        
        // Add payment button handler
        const paymentButton = document.getElementById('payment-button');
        if (paymentButton) {
            paymentButton.addEventListener('click', handlePaymentFormSubmit);
        }
    } catch (e) {
        console.error('Initializing Square payment form failed', e);
    }
}

// Generate unique booking ID
function generateBookingId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EDY-${timestamp}-${random}`;
}

// Calculate total with all fees
function calculateTotal() {
    const basePrice = packages[formData.packageType].price;
    if (basePrice === 0) return { subtotal: 0, total: 0, deposit: 0 }; // Custom package
    
    let subtotal = basePrice * formData.guestCount;
    
    // Add-on pricing
    if (formData.addOns.champagne) subtotal += 15 * formData.guestCount;
    if (formData.addOns.photography) subtotal += 75;
    if (formData.addOns.teaSelection) subtotal += 12 * formData.guestCount;
    if (formData.addOns.extendedTime) subtotal += 100;
    
    // Weekend pricing
    let weekendSurcharge = 0;
    if (formData.preferredDate) {
        const date = new Date(formData.preferredDate);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        if (isWeekend) {
            weekendSurcharge = 5 * formData.guestCount;
            subtotal += weekendSurcharge;
        }
    }
    
    // Calculate fees
    const serviceFee = subtotal * 0.03; // 3% service fee
    const total = subtotal + serviceFee;
    const deposit = total * 0.5;
    
    return {
        subtotal,
        serviceFee,
        weekendSurcharge,
        total,
        deposit
    };
}

// Format phone number
function formatPhoneNumber(phoneNumber) {
    const cleaned = phoneNumber.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return '(' + match[1] + ') ' + match[2] + '-' + match[3];
    }
    return phoneNumber;
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Send booking email
async function sendBookingEmail(bookingData) {
    const emailData = {
        to: 'info@edylicious.com',
        cc: bookingData.email,
        subject: `New Booking Request - ${bookingData.fullName} - ${bookingData.preferredDate}`,
        bookingId: bookingData.bookingId,
        ...bookingData
    };
    
    try {
        const response = await fetch(EMAIL_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(emailData)
        });
        
        if (!response.ok) {
            throw new Error('Email send failed');
        }
        
        return true;
    } catch (error) {
        console.error('Error sending email:', error);
        // Fallback: Create mailto link
        createMailtoFallback(bookingData);
        return false;
    }
}

// Create mailto link as fallback
function createMailtoFallback(bookingData) {
    const totals = calculateTotal();
    const subject = encodeURIComponent(`Booking Request - ${bookingData.fullName} - ${bookingData.preferredDate}`);
    const body = encodeURIComponent(`
New Booking Request
===================
Booking ID: ${bookingData.bookingId}

Contact Information:
Name: ${bookingData.fullName}
Phone: ${formatPhoneNumber(bookingData.phone)}
Email: ${bookingData.email}
Preferred Contact: ${bookingData.contactMethod}

Event Details:
Type: ${bookingData.eventType}
Package: ${packages[bookingData.packageType].name}
Date: ${bookingData.preferredDate}
Time: ${bookingData.preferredTime}
Guests: ${bookingData.guestCount}
${bookingData.flexibleDates ? `Backup Date: ${bookingData.backupDate} at ${bookingData.backupTime}` : ''}

Special Requirements:
${bookingData.dietaryRestrictions ? `Dietary: ${bookingData.dietaryRestrictions}` : ''}
${bookingData.photography ? '- Photography/filming during event' : ''}
${bookingData.privateRoom ? '- Private room requested' : ''}
${bookingData.extendedTime ? '- Extended time needed' : ''}
${bookingData.accessibilityNeeds ? '- Accessibility accommodations needed' : ''}
${bookingData.specialRequests ? `Special Requests: ${bookingData.specialRequests}` : ''}

Add-ons:
${bookingData.addOns.champagne ? '- Champagne Service' : ''}
${bookingData.addOns.photography ? '- Professional Photography' : ''}
${bookingData.addOns.teaSelection ? '- Take-Home Tea Selection' : ''}
${bookingData.addOns.extendedTime ? '- Extended Time' : ''}

Pricing:
Subtotal: $${totals.subtotal.toFixed(2)}
Service Fee: $${totals.serviceFee.toFixed(2)}
Total: $${totals.total.toFixed(2)}
Deposit Required: $${totals.deposit.toFixed(2)}

Investment Level: ${bookingData.investmentLevel}

Agreements:
- Deposit Agreement: ${bookingData.agreeDeposit ? 'Yes' : 'No'}
- Cancellation Policy: ${bookingData.agreeCancellation ? 'Yes' : 'No'}
- Ready to Book: ${bookingData.readyToBook ? 'Yes' : 'No'}
`);
    
    const mailtoLink = `mailto:info@edylicious.com?subject=${subject}&body=${body}`;
    window.location.href = mailtoLink;
}

// Create Square payment draft
async function createSquarePaymentDraft() {
    const totals = calculateTotal();
    formData.bookingId = generateBookingId();
    
    const paymentData = {
        idempotency_key: formData.bookingId,
        amount_money: {
            amount: Math.round(totals.deposit * 100), // Convert to cents
            currency: 'USD'
        },
        reference_id: formData.bookingId,
        note: `Deposit for ${formData.eventType} - ${formData.fullName} - ${formData.preferredDate}`,
        customer_id: formData.email, // You'd create a customer in Square first
        billing_address: {
            first_name: formData.fullName.split(' ')[0],
            last_name: formData.fullName.split(' ').slice(1).join(' '),
            email: formData.email,
            phone: formData.phone
        }
    };
    
    // In production, this would be sent to your backend
    console.log('Square Payment Draft:', paymentData);
    
    // For now, we'll simulate creating a payment link
    const paymentLink = `https://square.link/YourSquareAccount/${formData.bookingId}`;
    
    return {
        bookingId: formData.bookingId,
        paymentLink: paymentLink,
        amount: totals.deposit
    };
}

// Handle payment form submission
async function handlePaymentFormSubmit(event) {
    event.preventDefault();
    
    const paymentButton = document.getElementById('payment-button');
    paymentButton.disabled = true;
    paymentButton.innerHTML = 'Processing...';
    
    try {
        const result = await squareCard.tokenize();
        if (result.status === 'OK') {
            formData.paymentNonce = result.token;
            
            // Create payment draft
            const paymentDraft = await createSquarePaymentDraft();
            
            // Send booking email
            await sendBookingEmail({
                ...formData,
                paymentLink: paymentDraft.paymentLink,
                depositAmount: paymentDraft.amount
            });
            
            // Show success
            currentStep = 9;
            showStep(currentStep);
            
            // Update success message with payment info
            document.getElementById('successMessage').innerHTML = `
                Thank you ${formData.fullName}! We've received your booking request for ${formData.guestCount} guests 
                on ${formData.preferredDate} at ${formData.preferredTime}.
                <br><br>
                <strong>Booking ID:</strong> ${formData.bookingId}
                <br><br>
                You'll receive a confirmation email at ${formData.email} with your secure payment link 
                for the deposit of <strong>$${paymentDraft.amount.toFixed(2)}</strong>.
                <br><br>
                <a href="${paymentDraft.paymentLink}" class="btn btn-primary" style="margin-top: 1rem;">
                    Pay Deposit Now
                </a>
            `;
        } else {
            console.error('Tokenization failed:', result.errors);
            alert('Payment processing failed. Please try again.');
        }
    } catch (e) {
        console.error('Payment error:', e);
        alert('An error occurred. Please try again.');
    } finally {
        paymentButton.disabled = false;
        paymentButton.innerHTML = 'Submit Booking & Pay Deposit';
    }
}

// Enhanced submit booking function
async function submitBooking() {
    updateFormData();
    
    if (!canProceed()) return;
    
    // Show loading state
    const nextBtn = document.getElementById('nextBtn');
    const originalText = nextBtn.innerHTML;
    nextBtn.innerHTML = '<span class="spinner"></span> Processing...';
    nextBtn.disabled = true;
    
    try {
        // Create payment draft
        const paymentDraft = await createSquarePaymentDraft();
        
        // Send booking email
        const emailSent = await sendBookingEmail({
            ...formData,
            paymentLink: paymentDraft.paymentLink,
            depositAmount: paymentDraft.amount
        });
        
        // Store booking in localStorage for reference
        const bookingRecord = {
            ...formData,
            bookingId: paymentDraft.bookingId,
            timestamp: new Date().toISOString(),
            paymentLink: paymentDraft.paymentLink,
            depositAmount: paymentDraft.amount,
            emailSent: emailSent
        };
        
        localStorage.setItem(`booking_${paymentDraft.bookingId}`, JSON.stringify(bookingRecord));
        
        // Show success
        currentStep = 9;
        showStep(currentStep);
        
        // Update success message
        document.getElementById('successMessage').innerHTML = `
            Thank you ${formData.fullName}! We've received your booking request for ${formData.guestCount} guests 
            on ${formData.preferredDate} at ${formData.preferredTime}.
            <br><br>
            <strong>Booking ID:</strong> ${paymentDraft.bookingId}
            <br><br>
            ${emailSent ? 
                `You'll receive a confirmation email at ${formData.email} with your secure payment link.` :
                `Please check your email app to send the booking details to us.`
            }
            <br><br>
            <div style="background-color: #fef3c7; padding: 1rem; border-radius: 0.5rem; margin-top: 1rem;">
                <strong>Deposit Required:</strong> $${paymentDraft.amount.toFixed(2)}
                <br>
                <small>You'll receive a secure Square payment link via email</small>
            </div>
        `;
        
    } catch (error) {
        console.error('Booking submission error:', error);
        alert('There was an error submitting your booking. Please try again or call us at (972) 274-1261.');
    } finally {
        // Reset button
        nextBtn.innerHTML = originalText;
        nextBtn.disabled = false;
    }
}

// Show detailed review summary
function showReviewSummary() {
    const totals = calculateTotal();
    
    let summaryHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <div>
                <h3 style="font-size: 1.125rem; margin: 0;">${packages[formData.packageType].name}</h3>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.eventType}</p>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.preferredDate} at ${formData.preferredTime}</p>
                <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.guestCount} guests</p>
            </div>
            <div style="text-align: right;">
                <p style="font-size: 1rem; color: #6b7280; margin: 0;">Subtotal: $${totals.subtotal.toFixed(2)}</p>
                ${totals.weekendSurcharge > 0 ? `<p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Weekend surcharge: +$${totals.weekendSurcharge.toFixed(2)}</p>` : ''}
                <p style="font-size: 0.875rem; color: #6b7280; margin: 0;">Service fee: +$${totals.serviceFee.toFixed(2)}</p>
                <p style="font-size: 1.5rem; font-weight: 700; color: rgb(122, 41, 60); margin: 0.5rem 0 0;">$${totals.total.toFixed(2)}</p>
                <p style="font-size: 0.875rem; color: #6b7280;">Total estimate</p>
                <div style="background-color: #fef3c7; padding: 0.5rem; border-radius: 0.25rem; margin-top: 0.5rem;">
                    <p style="font-size: 0.875rem; color: #92400e; margin: 0; font-weight: 600;">Deposit: $${totals.deposit.toFixed(2)}</p>
                </div>
            </div>
        </div>
    `;
    
    // Add-ons breakdown
    const selectedAddOns = [];
    if (formData.addOns.champagne) selectedAddOns.push({name: 'Champagne Service', price: 15 * formData.guestCount});
    if (formData.addOns.photography) selectedAddOns.push({name: 'Professional Photography', price: 75});
    if (formData.addOns.teaSelection) selectedAddOns.push({name: 'Take-Home Tea Selection', price: 12 * formData.guestCount});
    if (formData.addOns.extendedTime) selectedAddOns.push({name: 'Extended Time', price: 100});
    
    if (selectedAddOns.length > 0) {
        summaryHTML += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                <h4 style="font-size: 1rem; margin: 0 0 0.5rem;">Add-ons:</h4>
                ${selectedAddOns.map(addon => `<p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">• ${addon.name}: +$${addon.price.toFixed(2)}</p>`).join('')}
            </div>
        `;
    }
    
    // Special requirements
    const specialReqs = [];
    if (formData.dietaryRestrictions) specialReqs.push(`Dietary: ${formData.dietaryRestrictions}`);
    if (formData.photography) specialReqs.push('Photography/filming during event');
    if (formData.privateRoom) specialReqs.push('Private room requested');
    if (formData.extendedTime) specialReqs.push('Extended time needed');
    if (formData.accessibilityNeeds) specialReqs.push('Accessibility accommodations needed');
    if (formData.specialRequests) specialReqs.push(formData.specialRequests);
    
    if (specialReqs.length > 0) {
        summaryHTML += `
            <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
                <h4 style="font-size: 1rem; margin: 0 0 0.5rem;">Special Requirements:</h4>
                ${specialReqs.map(req => `<p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">• ${req}</p>`).join('')}
            </div>
        `;
    }
    
    // Contact info
    summaryHTML += `
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e7eb;">
            <h4 style="font-size: 1rem; margin: 0 0 0.5rem;">Contact Information:</h4>
            <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.fullName}</p>
            <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formatPhoneNumber(formData.phone)}</p>
            <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">${formData.email}</p>
            <p style="font-size: 0.875rem; color: #4b5563; margin: 0.25rem 0;">Preferred contact: ${formData.contactMethod}</p>
        </div>
    `;
    
    document.getElementById('bookingSummary').innerHTML = summaryHTML;
    
    // Update deposit amount in agreement
    const depositCheckbox = document.querySelector('label[for="agreeDeposit"]');
    if (depositCheckbox) {
        depositCheckbox.innerHTML = `I understand a 50% deposit ($${totals.deposit.toFixed(2)}) is required to secure my reservation`;
    }
}

// Initialize everything
document.addEventListener('DOMContentLoaded', function() {
    // All previous initialization code...
    // ... (keep all the existing initialization code from booking.js)
    
    // Initialize Square Payment
    if (window.Square) {
        initializeSquarePayment();
    } else {
        // Load Square.js
        const script = document.createElement('script');
        script.src = 'https://sandbox.web.squarecdn.com/v1/square.js'; // Use production URL for live
        script.onload = initializeSquarePayment;
        document.head.appendChild(script);
    }
    
    // Phone number formatting
    document.getElementById('phone').addEventListener('input', function(e) {
        e.target.value = formatPhoneNumber(e.target.value);
    });
    
    // Email validation
    document.getElementById('email').addEventListener('blur', function(e) {
        if (!validateEmail(e.target.value) && e.target.value) {
            e.target.style.borderColor = '#dc2626';
            if (!e.target.nextElementSibling || !e.target.nextElementSibling.classList.contains('error-message')) {
                const error = document.createElement('p');
                error.className = 'error-message';
                error.style.cssText = 'color: #dc2626; font-size: 0.875rem; margin-top: 0.25rem;';
                error.textContent = 'Please enter a valid email address';
                e.target.parentNode.appendChild(error);
            }
        } else {
            e.target.style.borderColor = '';
            const error = e.target.parentNode.querySelector('.error-message');
            if (error) error.remove();
        }
    });
});

// Export functions for global access
window.nextStep = nextStep;
window.previousStep = previousStep;
window.resetForm = resetForm;
window.submitBooking = submitBooking;

// Keep all other functions from the original booking.js...