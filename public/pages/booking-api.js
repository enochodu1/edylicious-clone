// Booking API Structure for Edylicious Tea Room
// This can be deployed as a serverless function (Vercel, Netlify) or Express server

// Example using Vercel Serverless Functions
// File: /api/booking.js

const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase (or any database)
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

// Email configuration
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Square API configuration
const { Client, Environment } = require('square');
const squareClient = new Client({
    accessToken: process.env.SQUARE_ACCESS_TOKEN,
    environment: Environment.Production
});

// Main booking handler
module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const bookingData = req.body;
        
        // Generate booking ID
        const bookingId = generateBookingId();
        bookingData.bookingId = bookingId;
        bookingData.createdAt = new Date().toISOString();
        
        // Calculate pricing
        const pricing = calculatePricing(bookingData);
        bookingData.pricing = pricing;
        
        // 1. Save to database
        const { data: booking, error: dbError } = await supabase
            .from('bookings')
            .insert([{
                id: bookingId,
                customer_name: bookingData.fullName,
                customer_email: bookingData.email,
                customer_phone: bookingData.phone,
                event_date: bookingData.preferredDate,
                event_time: bookingData.preferredTime,
                guest_count: bookingData.guestCount,
                package_type: bookingData.packageType,
                total_amount: pricing.total,
                deposit_amount: pricing.deposit,
                status: 'pending',
                data: bookingData
            }]);
            
        if (dbError) throw dbError;
        
        // 2. Create Square payment link
        const paymentLink = await createSquarePaymentLink(bookingData, pricing);
        
        // 3. Send confirmation email to customer
        await sendCustomerEmail(bookingData, paymentLink);
        
        // 4. Send notification email to restaurant
        await sendInternalEmail(bookingData, paymentLink);
        
        // 5. Schedule reminder (using a service like SendGrid or a cron job)
        await scheduleReminder(bookingData);
        
        return res.status(200).json({
            success: true,
            bookingId: bookingId,
            paymentLink: paymentLink,
            message: 'Booking created successfully'
        });
        
    } catch (error) {
        console.error('Booking error:', error);
        return res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// Helper Functions

function generateBookingId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `EDY-${timestamp}-${random}`;
}

function calculatePricing(bookingData) {
    const packages = {
        royal: 43.14,
        enhanced: 58,
        luxury: 75,
        custom: 0
    };
    
    const basePrice = packages[bookingData.packageType];
    if (basePrice === 0) return { subtotal: 0, total: 0, deposit: 0 };
    
    let subtotal = basePrice * bookingData.guestCount;
    
    // Add-ons
    if (bookingData.addOns.champagne) subtotal += 15 * bookingData.guestCount;
    if (bookingData.addOns.photography) subtotal += 75;
    if (bookingData.addOns.teaSelection) subtotal += 12 * bookingData.guestCount;
    if (bookingData.addOns.extendedTime) subtotal += 100;
    
    // Weekend surcharge
    let weekendSurcharge = 0;
    const date = new Date(bookingData.preferredDate);
    if (date.getDay() === 0 || date.getDay() === 6) {
        weekendSurcharge = 5 * bookingData.guestCount;
        subtotal += weekendSurcharge;
    }
    
    const serviceFee = subtotal * 0.03;
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

async function createSquarePaymentLink(bookingData, pricing) {
    try {
        const { result } = await squareClient.checkoutApi.createPaymentLink({
            idempotencyKey: bookingData.bookingId,
            order: {
                locationId: process.env.SQUARE_LOCATION_ID,
                lineItems: [
                    {
                        name: `Deposit for ${bookingData.eventType}`,
                        quantity: '1',
                        basePriceMoney: {
                            amount: Math.round(pricing.deposit * 100),
                            currency: 'USD'
                        }
                    }
                ],
                customerId: bookingData.customerId
            },
            checkoutOptions: {
                redirectUrl: 'https://edylicious.com/booking-confirmed',
                askForShippingAddress: false
            },
            prePopulatedData: {
                buyerEmail: bookingData.email,
                buyerPhoneNumber: bookingData.phone
            }
        });
        
        return result.paymentLink.url;
    } catch (error) {
        console.error('Square error:', error);
        // Fallback to manual payment link
        return `https://square.link/u/MANUAL_LINK`;
    }
}

async function sendCustomerEmail(bookingData, paymentLink) {
    const emailHtml = generateCustomerEmailHtml(bookingData, paymentLink);
    
    await transporter.sendMail({
        from: '"Edylicious Tea Room" <noreply@edylicious.com>',
        to: bookingData.email,
        subject: `Booking Confirmation - ${bookingData.bookingId}`,
        html: emailHtml
    });
}

async function sendInternalEmail(bookingData, paymentLink) {
    const emailHtml = generateInternalEmailHtml(bookingData, paymentLink);
    
    await transporter.sendMail({
        from: '"Booking System" <bookings@edylicious.com>',
        to: 'info@edylicious.com',
        subject: `New Booking - ${bookingData.fullName} - ${bookingData.preferredDate}`,
        html: emailHtml
    });
}

async function scheduleReminder(bookingData) {
    // Calculate reminder date (7 days before event)
    const eventDate = new Date(bookingData.preferredDate);
    const reminderDate = new Date(eventDate);
    reminderDate.setDate(reminderDate.getDate() - 7);
    
    // Store in database or use a scheduling service
    await supabase
        .from('reminders')
        .insert([{
            booking_id: bookingData.bookingId,
            send_date: reminderDate.toISOString(),
            type: 'one_week',
            status: 'scheduled'
        }]);
}

// Email HTML generators (simplified versions)
function generateCustomerEmailHtml(data, paymentLink) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .header { background-color: rgb(122, 41, 60); color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; }
                .button { display: inline-block; padding: 12px 30px; background-color: rgb(122, 41, 60); color: white; text-decoration: none; border-radius: 5px; }
                .details { background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Edylicious Tea Room</h1>
                <p>Your Booking Request Received</p>
            </div>
            <div class="content">
                <p>Dear ${data.fullName},</p>
                <p>Thank you for choosing Edylicious Tea Room! Your booking details:</p>
                <div class="details">
                    <p><strong>Booking ID:</strong> ${data.bookingId}</p>
                    <p><strong>Date:</strong> ${data.preferredDate}</p>
                    <p><strong>Time:</strong> ${data.preferredTime}</p>
                    <p><strong>Guests:</strong> ${data.guestCount}</p>
                    <p><strong>Total:</strong> $${data.pricing.total.toFixed(2)}</p>
                    <p><strong>Deposit Required:</strong> $${data.pricing.deposit.toFixed(2)}</p>
                </div>
                <p style="text-align: center;">
                    <a href="${paymentLink}" class="button">Pay Deposit Now</a>
                </p>
                <p>Questions? Call us at (972) 274-1261</p>
            </div>
        </body>
        </html>
    `;
}

function generateInternalEmailHtml(data, paymentLink) {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                table { width: 100%; border-collapse: collapse; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                .highlight { background: #fffacd; padding: 10px; }
            </style>
        </head>
        <body>
            <h2>New Booking Request</h2>
            <div class="highlight">
                <strong>Booking ID:</strong> ${data.bookingId}
            </div>
            <h3>Contact Information</h3>
            <table>
                <tr><td><strong>Name:</strong></td><td>${data.fullName}</td></tr>
                <tr><td><strong>Phone:</strong></td><td>${data.phone}</td></tr>
                <tr><td><strong>Email:</strong></td><td>${data.email}</td></tr>
            </table>
            <h3>Event Details</h3>
            <table>
                <tr><td><strong>Type:</strong></td><td>${data.eventType}</td></tr>
                <tr><td><strong>Package:</strong></td><td>${data.packageType}</td></tr>
                <tr><td><strong>Date:</strong></td><td>${data.preferredDate}</td></tr>
                <tr><td><strong>Time:</strong></td><td>${data.preferredTime}</td></tr>
                <tr><td><strong>Guests:</strong></td><td>${data.guestCount}</td></tr>
            </table>
            <h3>Pricing</h3>
            <table>
                <tr><td><strong>Total:</strong></td><td>$${data.pricing.total.toFixed(2)}</td></tr>
                <tr><td><strong>Deposit:</strong></td><td>$${data.pricing.deposit.toFixed(2)}</td></tr>
            </table>
            <p><strong>Payment Link:</strong> ${paymentLink}</p>
        </body>
        </html>
    `;
}

// Alternative: Simple Express Server Version
/*
const express = require('express');
const app = express();
app.use(express.json());

app.post('/api/booking', async (req, res) => {
    // Same logic as above
});

app.listen(3000, () => {
    console.log('Booking API running on port 3000');
});
*/

// Environment variables needed:
/*
SQUARE_ACCESS_TOKEN=your_token
SQUARE_LOCATION_ID=your_location
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
*/