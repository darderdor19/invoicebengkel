// ==========================================
// APPLICATION LOGIC - JOKO MANDIRI
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialise Lucide icons
    lucide.createIcons();

    // DOM Elements
    const invoiceNoInput = document.getElementById('invoice-no');
    const invoiceDateInput = document.getElementById('invoice-date');
    const clientNameInput = document.getElementById('client-name');
    const clientAddressInput = document.getElementById('client-address');
    const paymentMethodSelect = document.getElementById('payment-method');
    const bankInfoWrapper = document.getElementById('bank-info-wrapper');
    const bankNameInput = document.getElementById('bank-name');
    const bankAccountInput = document.getElementById('bank-account');
    const bankOwnerInput = document.getElementById('bank-owner');
    const signatureNameInput = document.getElementById('signature-name');
    const itemsTbody = document.getElementById('items-tbody');
    const addItemBtn = document.getElementById('add-item-btn');
    const grandTotalVal = document.getElementById('grand-total-val');
    const btnPreview = document.getElementById('btn-preview');
    
    // Modal Elements
    const previewModal = document.getElementById('preview-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnEditInvoice = document.getElementById('btn-edit-invoice');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnPrintDirect = document.getElementById('btn-print-direct');

    // PDF Preview DOM Elements
    const pdfInvoiceNo = document.getElementById('pdf-invoice-no');
    const pdfInvoiceDate = document.getElementById('pdf-invoice-date');
    const pdfClientName = document.getElementById('pdf-client-name');
    const pdfClientAddress = document.getElementById('pdf-client-address');
    const pdfItemsTbody = document.getElementById('pdf-items-tbody');
    const pdfGrandTotal = document.getElementById('pdf-grand-total');
    const pdfBankDetails = document.getElementById('pdf-bank-details');
    const pdfCashDetails = document.getElementById('pdf-cash-details');
    const pdfBankName = document.getElementById('pdf-bank-name');
    const pdfBankAccount = document.getElementById('pdf-bank-account');
    const pdfBankOwner = document.getElementById('pdf-bank-owner');
    const pdfSigNameUnder = document.getElementById('pdf-sig-name-under');

    // --- Helper Functions ---

    // Format number to Rupiah style (e.g., Rp 1.250.000)
    function formatRupiah(number) {
        if (isNaN(number)) return 'Rp 0';
        return 'Rp ' + Math.round(number).toLocaleString('id-ID');
    }

    // Parse formatRupiah back to a float number
    function parseRupiahInput(value) {
        return parseFloat(value.replace(/[^0-9]/g, '')) || 0;
    }

    // Format Date to Indonesian format (e.g. 28 Juni 2026)
    function formatDateIndo(dateString) {
        if (!dateString) return '-';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;

        const months = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
        
        const day = String(date.getDate()).padStart(2, '0');
        const monthIndex = date.getMonth();
        const year = date.getFullYear();

        return `${day} ${months[monthIndex]} ${year}`;
    }

    // Helper function to scale A4 invoice preview to fit modal container on mobile screens
    function adjustPreviewScale() {
        const renderArea = document.getElementById('invoice-pdf-render');
        if (!renderArea) return;
        const container = renderArea.parentElement;
        if (!container) return;

        const containerWidth = container.clientWidth;
        const targetWidth = 794; // approx A4 width in pixels (~210mm)

        if (containerWidth < targetWidth) {
            const scale = containerWidth / targetWidth;
            renderArea.style.transform = `scale(${scale})`;
            renderArea.style.transformOrigin = 'top center';
            container.style.height = `${1122 * scale}px`; // scale container height to match scaled content
        } else {
            renderArea.style.transform = 'none';
            container.style.height = 'auto';
        }
    }

    // Recalculate preview scale on screen resize
    window.addEventListener('resize', adjustPreviewScale);

    // Generate unique invoice number default based on a date string
    function generateInvoiceNumber(dateStr) {
        const date = dateStr ? new Date(dateStr) : new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const datePart = `${year}${month}${day}`;
        return `#BJM-${datePart}-001`;
    }

    // Set default date input to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;
    invoiceDateInput.value = todayStr;

    // Pre-populate Default Invoice Number based on today's date
    invoiceNoInput.value = generateInvoiceNumber(todayStr);

    // Event listener to automatically update the invoice date part of the invoice number
    invoiceDateInput.addEventListener('change', () => {
        const currentDateVal = invoiceDateInput.value; // YYYY-MM-DD
        if (currentDateVal) {
            const formattedDate = currentDateVal.replace(/-/g, '');
            const currentVal = invoiceNoInput.value;
            const pattern = /^#BJM-(\d{8})-(\d{3})$/;
            if (pattern.test(currentVal)) {
                const match = currentVal.match(pattern);
                invoiceNoInput.value = `#BJM-${formattedDate}-${match[2]}`;
            } else {
                invoiceNoInput.value = `#BJM-${formattedDate}-001`;
            }
        }
    });

    // --- Dynamic Table Logic (Dashboard) ---

    // Add a new row to the dashboard inputs table
    function addTableRow(description = '', qty = 1, price = 0) {
        const rowCount = itemsTbody.rows.length + 1;
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td class="center-align row-number">${rowCount}</td>
            <td>
                <input type="text" class="item-desc" placeholder="Contoh: Pembuatan Pagar Tralis Besi Hollow" value="${description}">
            </td>
            <td>
                <input type="number" class="item-qty center-align" min="1" placeholder="Qty" value="${qty}">
            </td>
            <td>
                <input type="number" class="item-price" min="0" placeholder="Harga Satuan" value="${price}">
            </td>
            <td class="right-align row-subtotal">
                ${formatRupiah(qty * price)}
            </td>
            <td class="center-align">
                <button type="button" class="btn-delete-row" title="Hapus baris">
                    <i data-lucide="trash-2"></i>
                </button>
            </td>
        `;

        itemsTbody.appendChild(row);
        lucide.createIcons();

        // Bind recalculate events to the newly added row
        const qtyInput = row.querySelector('.item-qty');
        const priceInput = row.querySelector('.item-price');
        const deleteBtn = row.querySelector('.btn-delete-row');

        qtyInput.addEventListener('input', () => calculateTotals());
        priceInput.addEventListener('input', () => calculateTotals());
        
        deleteBtn.addEventListener('click', () => {
            row.remove();
            updateRowNumbers();
            calculateTotals();
        });

        calculateTotals();
    }

    // Re-index column No after deleting a row
    function updateRowNumbers() {
        const rows = itemsTbody.querySelectorAll('tr');
        rows.forEach((row, index) => {
            row.querySelector('.row-number').textContent = index + 1;
        });
    }

    // Calculate totals across all rows and update UI displays
    function calculateTotals() {
        const rows = itemsTbody.querySelectorAll('tr');
        let grandTotal = 0;

        rows.forEach(row => {
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const subtotal = qty * price;
            grandTotal += subtotal;

            // Update row subtotal display
            row.querySelector('.row-subtotal').textContent = formatRupiah(subtotal);
        });

        // Update main dashboard summary display
        grandTotalVal.textContent = formatRupiah(grandTotal);
    }

    // Pre-fill with a default first row
    addTableRow('Jasa Pembuatan Kanopi Besi & Polycarbonate', 1, 3500000);

    // Add row button click handler
    addItemBtn.addEventListener('click', () => {
        addTableRow('', 1, 0);
    });

    // Toggle bank information inputs when payment method changes
    paymentMethodSelect.addEventListener('change', () => {
        if (paymentMethodSelect.value === 'tf') {
            bankInfoWrapper.style.display = 'grid';
        } else {
            bankInfoWrapper.style.display = 'none';
        }
    });

    // --- Modal Preview Handling ---

    // Populate data from form inputs to PDF HTML structure
    function populatePdfData() {
        pdfInvoiceNo.textContent = invoiceNoInput.value || '#-';
        pdfInvoiceDate.textContent = formatDateIndo(invoiceDateInput.value);
        pdfClientName.textContent = clientNameInput.value || 'Nama Pelanggan / Perusahaan';
        
        // Handle address newlines nicely
        const address = clientAddressInput.value || 'Alamat Lengkap Penerima';
        pdfClientAddress.innerHTML = address.replace(/\n/g, '<br>');

        // Payment Info
        if (paymentMethodSelect.value === 'tf') {
            pdfBankDetails.style.display = 'block';
            pdfCashDetails.style.display = 'none';
            pdfBankName.textContent = bankNameInput.value || 'Mandiri';
            pdfBankAccount.textContent = bankAccountInput.value || '-';
            pdfBankOwner.textContent = bankOwnerInput.value || 'Mujianto';
        } else {
            pdfBankDetails.style.display = 'none';
            pdfCashDetails.style.display = 'block';
        }

        // Signature Info
        pdfSigNameUnder.textContent = signatureNameInput.value || 'Mujianto';

        // Populate Table Items
        pdfItemsTbody.innerHTML = '';
        const rows = itemsTbody.querySelectorAll('tr');
        let grandTotal = 0;

        rows.forEach((row, index) => {
            const desc = row.querySelector('.item-desc').value || 'Tanpa Keterangan';
            const qty = parseFloat(row.querySelector('.item-qty').value) || 0;
            const price = parseFloat(row.querySelector('.item-price').value) || 0;
            const subtotal = qty * price;
            grandTotal += subtotal;

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="col-no">${index + 1}</td>
                <td class="col-desc">${desc}</td>
                <td class="col-qty">${qty}</td>
                <td class="col-price">${formatRupiah(price)}</td>
                <td class="col-subtotal">${formatRupiah(subtotal)}</td>
            `;
            pdfItemsTbody.appendChild(tr);
        });

        // Add padding rows if items count is small (to maintain aesthetics similar to image)
        const minRows = 4;
        const currentRowsCount = rows.length;
        if (currentRowsCount < minRows) {
            for (let i = currentRowsCount; i < minRows; i++) {
                const emptyTr = document.createElement('tr');
                emptyTr.innerHTML = `
                    <td class="col-no">&nbsp;</td>
                    <td class="col-desc">&nbsp;</td>
                    <td class="col-qty">&nbsp;</td>
                    <td class="col-price">&nbsp;</td>
                    <td class="col-subtotal">&nbsp;</td>
                `;
                pdfItemsTbody.appendChild(emptyTr);
            }
        }

        // Set Grand Total
        pdfGrandTotal.textContent = formatRupiah(grandTotal);
    }

    // Modal Control: Show Preview & Confirmation
    btnPreview.addEventListener('click', () => {
        // Validation check
        if (!clientNameInput.value.trim()) {
            alert('Silakan isi Nama Penerima / Tujuan terlebih dahulu.');
            clientNameInput.focus();
            return;
        }

        if (itemsTbody.rows.length === 0) {
            alert('Silakan tambahkan minimal satu item/bahan.');
            return;
        }

        // Populate PDF DOM
        populatePdfData();

        // Show Modal
        previewModal.style.display = 'flex';
        
        // Recalculate scaling after modal layout settles
        setTimeout(adjustPreviewScale, 50);
    });

    // Close Modal Controls
    function closeModal() {
        previewModal.style.display = 'none';
        const renderArea = document.getElementById('invoice-pdf-render');
        if (renderArea && renderArea.parentElement) {
            renderArea.parentElement.style.height = 'auto';
        }
    }

    btnCloseModal.addEventListener('click', closeModal);
    btnEditInvoice.addEventListener('click', closeModal);

    // Close modal if user clicks outside the modal card
    previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
            closeModal();
        }
    });

    // --- PDF Export and Printing ---

    // Download PDF handler using html2pdf (direct rendering with temporary scale-reset to prevent mobile clipping)
    btnDownloadPdf.addEventListener('click', () => {
        const renderArea = document.getElementById('invoice-pdf-render');
        if (!renderArea) return;
        
        const container = renderArea.parentElement;
        
        // Save original styles
        const originalTransform = renderArea.style.transform;
        const originalTransformOrigin = renderArea.style.transformOrigin;
        const originalContainerHeight = container.style.height;
        
        // Temporary reset scale styles for clean desktop-width canvas capture
        renderArea.style.transform = 'none';
        renderArea.style.transformOrigin = 'initial';
        container.style.height = 'auto';
        
        // Setup options - forcing A4 portrait mode and viewport width parameters
        const opt = {
            margin:       0,
            filename:     `Invoice_${clientNameInput.value.replace(/\s+/g, '_')}_${invoiceNoInput.value.replace(/#/g, '')}.pdf`,
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
                scale: 2, 
                useCORS: true, 
                letterRendering: true,
                backgroundColor: '#ffffff',
                windowWidth: 800, // Forces the layout to render as a desktop-width page in canvas
                scrollX: 0,       // Prevents offset clipping if the user scrolled
                scrollY: 0
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Disable button text and show spinner/loading state
        const originalText = btnDownloadPdf.innerHTML;
        btnDownloadPdf.innerHTML = '<i class="loading-spinner"></i> Mengunduh...';
        btnDownloadPdf.disabled = true;

        // Generate PDF directly from the unscaled element
        html2pdf().set(opt).from(renderArea).save().then(() => {
            // Restore original scaling styles
            renderArea.style.transform = originalTransform;
            renderArea.style.transformOrigin = originalTransformOrigin;
            container.style.height = originalContainerHeight;
            
            btnDownloadPdf.innerHTML = originalText;
            btnDownloadPdf.disabled = false;
        }).catch((err) => {
            console.error('PDF Generation Error:', err);
            alert('Terjadi kesalahan saat membuat PDF.');
            
            // Restore original scaling styles in case of error
            renderArea.style.transform = originalTransform;
            renderArea.style.transformOrigin = originalTransformOrigin;
            container.style.height = originalContainerHeight;
            
            btnDownloadPdf.innerHTML = originalText;
            btnDownloadPdf.disabled = false;
        });
    });

    // Print directly using browser print engine
    btnPrintDirect.addEventListener('click', () => {
        window.print();
    });
});
