// DR Installs - Scheduling Wizard

// =====================
// Pricing Data
// =====================
const PRICING = {
    opening: {
        '15-21':       295,
        '24-27':       315,
        '30-33':       330,
        '12x17-15x26': 345,
        '15x30-21x43': 345,
        '21x43+':      360,
    },
    closing: {
        '15-21':       285,
        '24-27':       305,
        '30-33':       320,
        '12x17-15x26': 320,
        '15x30-21x43': 335,
        '21x43+':      350,
    }
};

const SIZE_LABELS = {
    '15-21':       "15' – 21'",
    '24-27':       "24' – 27'",
    '30-33':       "30' – 33'",
    '12x17-15x26': "12'x17' – 15'x26'",
    '15x30-21x43': "15'x30' – 21'x43'",
    '21x43+':      "21'x43' +",
};

const TIME_LABELS = {
    morning:   'Morning (8–11 AM)',
    afternoon: 'Afternoon (12–3 PM)',
    evening:   'Evening (4–6 PM)',
};

// =====================
// State
// =====================
const state = {
    serviceType: 'opening',
    poolSize: null,
    addons: [],         // array of { value, price, label }

    serviceDate: '',
    serviceTime: '',
    customer: {},
    signatureName: '',
    signatureDate: '',
};

// =====================
// DOM Ready
// =====================
document.addEventListener('DOMContentLoaded', function () {
    initPricingLabels();
    initServiceTypeToggle();
    initSizeOptions();
    initAddonOptions();

    initDatePicker();
    initTimeSelect();
    initStepNav();
    initSignContract();
    initDownloadPdf();
});

// =====================
// Pricing Labels
// =====================
function initPricingLabels() {
    const type = state.serviceType;
    document.querySelectorAll('.size-price').forEach(el => {
        const opening = el.dataset.opening;
        const closing = el.dataset.closing;
        el.textContent = '$' + (type === 'opening' ? opening : closing);
    });
}

function updatePricingLabels() {
    const type = state.serviceType;
    document.querySelectorAll('.size-price').forEach(el => {
        el.textContent = '$' + (type === 'opening' ? el.dataset.opening : el.dataset.closing);
    });
}

// =====================
// Service Type Toggle
// =====================
function initServiceTypeToggle() {
    document.querySelectorAll('input[name="serviceType"]').forEach(radio => {
        radio.addEventListener('change', function () {
            state.serviceType = this.value;
            updatePricingLabels();
            toggleSubmergedCover();
            updatePriceDisplay();
        });
    });
}

function toggleSubmergedCover() {
    const el = document.querySelector('.opening-only');
    if (!el) return;
    if (state.serviceType === 'opening') {
        el.classList.remove('hidden');
    } else {
        el.classList.add('hidden');
        // uncheck if closing selected
        const cb = el.querySelector('input[type="checkbox"]');
        if (cb) cb.checked = false;
        state.addons = state.addons.filter(a => a.value !== 'submerged-cover');
    }
}

// =====================
// Pool Size
// =====================
function initSizeOptions() {
    document.querySelectorAll('input[name="poolSize"]').forEach(radio => {
        radio.addEventListener('change', function () {
            state.poolSize = this.value;
            updatePriceDisplay();
        });
    });
}

// =====================
// Add-ons
// =====================
const ADDON_LABELS = {
    'center-drain':    'Center Drain',
    'heater':          'Heater',
    'partial-deck':    'Partial Deck',
    'full-deck':       'Full Deck',
    'submerged-cover': 'Submerged Cover Removal',
};

function initAddonOptions() {
    document.querySelectorAll('input[name="addon"]').forEach(cb => {
        cb.addEventListener('change', function () {
            const val = this.value;
            const price = parseInt(this.dataset.price, 10);
            if (this.checked) {
                state.addons.push({ value: val, price, label: ADDON_LABELS[val] });
            } else {
                state.addons = state.addons.filter(a => a.value !== val);
            }
            updatePriceDisplay();
        });
    });
}

// =====================
// Date & Time
// =====================
function initDatePicker() {
    const input = document.getElementById('serviceDate');
    if (!input) return;
    // No past dates
    const today = new Date().toISOString().split('T')[0];
    input.setAttribute('min', today);
    input.addEventListener('change', function () {
        state.serviceDate = this.value;
    });
}

function initTimeSelect() {
    const select = document.getElementById('serviceTime');
    if (!select) return;
    select.addEventListener('change', function () {
        state.serviceTime = this.value;
    });
}

// =====================
// Price Display
// =====================
function updatePriceDisplay() {
    const type = state.serviceType;
    const size = state.poolSize;
    const basePrice = size ? (PRICING[type][size] || 0) : 0;
    const addonsTotal = state.addons.reduce((s, a) => s + a.price, 0);
    const total = basePrice + addonsTotal;

    // Base line
    const lineBase = document.getElementById('line-base');
    lineBase.querySelector('.price-value').textContent = size ? '$' + basePrice.toFixed(2) : '$0.00';

    // Addons line
    const lineAddons = document.getElementById('line-addons');
    if (addonsTotal > 0) {
        lineAddons.style.display = 'flex';
        lineAddons.querySelector('.price-value').textContent = '+$' + addonsTotal.toFixed(2);
    } else {
        lineAddons.style.display = 'none';
    }

    // Total
    document.getElementById('total-price').textContent = '$' + total.toFixed(2);
}

function calcTotal() {
    const type = state.serviceType;
    const size = state.poolSize;
    const base = size ? (PRICING[type][size] || 0) : 0;
    const addons = state.addons.reduce((s, a) => s + a.price, 0);
    return base + addons;
}

// =====================
// Step Navigation
// =====================
function initStepNav() {
    document.querySelectorAll('.btn-next').forEach(btn => {
        btn.addEventListener('click', function () {
            const nextStep = parseInt(this.dataset.next, 10);
            const currentStep = nextStep - 1;
            if (validateStep(currentStep)) {
                if (nextStep === 3) populateContract();
                goToStep(nextStep);
            }
        });
    });

    document.querySelectorAll('.btn-prev').forEach(btn => {
        btn.addEventListener('click', function () {
            const prevStep = parseInt(this.dataset.prev, 10);
            goToStep(prevStep);
        });
    });
}

function goToStep(stepNum) {
    // Hide all steps
    document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
    // Show target step
    document.getElementById('step-' + stepNum).classList.add('active');

    // Update progress bar
    document.querySelectorAll('.progress-step').forEach(ps => {
        const n = parseInt(ps.dataset.step, 10);
        ps.classList.remove('active', 'completed');
        if (n === stepNum) ps.classList.add('active');
        if (n < stepNum) ps.classList.add('completed');
    });

    // Update progress lines
    document.querySelectorAll('.progress-line').forEach((line, i) => {
        line.classList.toggle('completed', i < stepNum - 1);
    });

    // Scroll to top of wizard
    document.querySelector('.scheduling-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =====================
// Validation
// =====================
function validateStep(step) {
    if (step === 1) return validateStep1();
    if (step === 2) return validateStep2();
    return true;
}

function validateStep1() {
    let valid = true;
    const errors = [];

    if (!state.poolSize) {
        errors.push('Please select a pool size.');
        valid = false;
    }

    const date = document.getElementById('serviceDate');
    if (!date.value) {
        errors.push('Please select a service date.');
        date.classList.add('invalid');
        valid = false;
    } else {
        date.classList.remove('invalid');
        date.classList.add('valid');
        state.serviceDate = date.value;
    }

    const time = document.getElementById('serviceTime');
    if (!time.value) {
        errors.push('Please select a time window.');
        time.classList.add('invalid');
        valid = false;
    } else {
        time.classList.remove('invalid');
        state.serviceTime = time.value;
    }

    showStepError('step-1', errors);
    return valid;
}

function validateStep2() {
    let valid = true;
    const fields = ['customerName', 'customerAddress', 'customerCity', 'customerState', 'customerZip', 'customerEmail', 'customerPhone'];
    const values = {};

    fields.forEach(id => {
        const el = document.getElementById(id);
        if (!el.value.trim()) {
            el.classList.add('invalid');
            el.classList.remove('valid');
            valid = false;
        } else {
            el.classList.remove('invalid');
            el.classList.add('valid');
            values[id] = el.value.trim();
        }
    });

    // Email format
    const email = document.getElementById('customerEmail');
    if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.classList.add('invalid');
        valid = false;
    }

    if (!valid) {
        showStepError('step-2', ['Please fill in all required fields correctly.']);
    } else {
        state.customer = {
            name:    values.customerName,
            address: values.customerAddress,
            city:    values.customerCity,
            state:   values.customerState,
            zip:     values.customerZip,
            email:   values.customerEmail,
            phone:   values.customerPhone,
        };
    }

    return valid;
}

function showStepError(stepId, errors) {
    let errEl = document.querySelector('#' + stepId + ' .wizard-error');
    if (!errEl) {
        errEl = document.createElement('div');
        errEl.className = 'wizard-error';
        const step = document.getElementById(stepId);
        step.insertBefore(errEl, step.querySelector('.step-actions'));
    }
    if (errors.length) {
        errEl.innerHTML = '<i class="bi bi-exclamation-triangle"></i> ' + errors.join(' ');
        errEl.classList.add('show');
    } else {
        errEl.classList.remove('show');
    }
}

// =====================
// Populate Contract
// =====================
function populateContract() {
    const c = state.customer;
    const type = state.serviceType === 'opening' ? 'Pool Opening' : 'Pool Closing';
    const size = SIZE_LABELS[state.poolSize] || state.poolSize;
    const addonList = state.addons.length ? state.addons.map(a => a.label).join(', ') : 'None';
    const allAddonsStr = state.addons.length ? state.addons.map(a => a.label).join(', ') : 'None';
    const total = '$' + calcTotal().toFixed(2);
    const dateFormatted = formatDate(state.serviceDate);
    const timeFormatted = TIME_LABELS[state.serviceTime] || state.serviceTime;

    // Fill contract fields
    setText('contractCustomerName', c.name);
    setText('contractServiceType', type);
    setText('contractPoolSize', size);
    setText('contractAddons', allAddonsStr);
    setText('contractDate', dateFormatted);
    setText('contractTime', timeFormatted);
    setText('contractTotal', total);

    // Set today as default signature date
    const today = new Date().toISOString().split('T')[0];
    const sigDate = document.getElementById('signatureDate');
    if (sigDate && !sigDate.value) sigDate.value = today;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const [y, m, d] = dateStr.split('-');
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return months[parseInt(m, 10) - 1] + ' ' + parseInt(d, 10) + ', ' + y;
}

// =====================
// Sign Contract
// =====================
function initSignContract() {
    const btn = document.getElementById('signContractBtn');
    if (!btn) return;

    btn.addEventListener('click', function () {
        const sigName = document.getElementById('signatureName');
        const sigDate = document.getElementById('signatureDate');
        let valid = true;

        if (!sigName.value.trim()) {
            sigName.classList.add('invalid');
            valid = false;
        } else {
            sigName.classList.remove('invalid');
            sigName.classList.add('valid');
            state.signatureName = sigName.value.trim();
        }

        if (!sigDate.value) {
            sigDate.classList.add('invalid');
            valid = false;
        } else {
            sigDate.classList.remove('invalid');
            sigDate.classList.add('valid');
            state.signatureDate = sigDate.value;
        }

        if (!valid) {
            showStepError('step-3', ['Please type your full name and select a date to sign.']);
            return;
        }

        // Go to confirmation
        populateConfirmation();
        goToStep(4);
    });
}

// =====================
// Confirmation Summary
// =====================
function populateConfirmation() {
    const c = state.customer;
    const type = state.serviceType === 'opening' ? 'Pool Opening' : 'Pool Closing';
    const size = SIZE_LABELS[state.poolSize];
    const total = '$' + calcTotal().toFixed(2);
    const dateFormatted = formatDate(state.serviceDate);
    const timeFormatted = TIME_LABELS[state.serviceTime];
    const addons = state.addons.map(a => a.label).join(', ') || 'None';

    const rows = [
        ['Service', type],
        ['Pool Size', size],
        ['Add-Ons', addons],
        ['Date', dateFormatted],
        ['Time', timeFormatted],
        ['Name', c.name],
        ['Address', `${c.address}, ${c.city}, ${c.state} ${c.zip}`],
        ['Contact', `${c.email} | ${c.phone}`],
        ['Total', total],
    ];

    const container = document.getElementById('confirmationSummary');
    if (container) {
        container.innerHTML = rows.map(([label, value]) =>
            `<div class="summary-row"><span>${label}</span><span>${value}</span></div>`
        ).join('');
    }
}

// =====================
// PDF Generation
// =====================
function initDownloadPdf() {
    const btn = document.getElementById('downloadPdfBtn');
    if (!btn) return;
    btn.addEventListener('click', generatePdf);
}

async function generatePdf() {
    const btn = document.getElementById('downloadPdfBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-hourglass-split"></i> Generating PDF...';

    try {
        const { jsPDF } = window.jspdf;

        // The contract lives inside step-3 which is hidden (display:none) on step 4.
        // We need to temporarily make it visible for html2canvas to render it.
        const step3 = document.getElementById('step-3');
        const contractEl = document.getElementById('contractContent');
        const wasHidden = !step3.classList.contains('active');

        if (wasHidden) {
            step3.style.display = 'block';
            step3.style.position = 'absolute';
            step3.style.left = '-9999px';
            step3.style.top = '0';
        }

        // Give the browser a frame to lay out
        await new Promise(r => setTimeout(r, 100));

        const canvas = await html2canvas(contractEl, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff',
            windowWidth: 900,
        });

        // Restore hidden state
        if (wasHidden) {
            step3.style.display = '';
            step3.style.position = '';
            step3.style.left = '';
            step3.style.top = '';
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'pt',
            format: 'letter',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 30;
        const usableWidth = pageWidth - margin * 2;
        const usableHeight = pageHeight - margin * 2;

        // Scale image to fit page width
        const imgAspect = canvas.height / canvas.width;
        const scaledWidth = usableWidth;
        const scaledHeight = scaledWidth * imgAspect;

        if (scaledHeight <= usableHeight) {
            // Fits on one page
            pdf.addImage(imgData, 'JPEG', margin, margin, scaledWidth, scaledHeight);
        } else {
            // Multi-page: slice the source canvas into page-sized chunks
            const pxPerPage = (usableHeight / scaledHeight) * canvas.height;
            let srcY = 0;
            let page = 0;

            while (srcY < canvas.height) {
                if (page > 0) pdf.addPage();

                const sliceH = Math.min(pxPerPage, canvas.height - srcY);
                const sliceCanvas = document.createElement('canvas');
                sliceCanvas.width = canvas.width;
                sliceCanvas.height = sliceH;
                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, srcY, canvas.width, sliceH, 0, 0, canvas.width, sliceH);

                const sliceData = sliceCanvas.toDataURL('image/jpeg', 0.95);
                const sliceScaledH = (sliceH / canvas.width) * scaledWidth;
                pdf.addImage(sliceData, 'JPEG', margin, margin, scaledWidth, sliceScaledH);

                srcY += sliceH;
                page++;
            }
        }

        const customerName = state.customer.name || 'Customer';
        const dateStr = state.serviceDate || new Date().toISOString().split('T')[0];
        pdf.save(`DR-Installs-Contract-${customerName.replace(/\s+/g, '-')}-${dateStr}.pdf`);

    } catch (err) {
        console.error('PDF generation failed:', err);
        alert('PDF generation failed. Please try again or contact us directly at (815) 483-9713.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-file-earmark-pdf"></i> Download Contract PDF';
    }
}
