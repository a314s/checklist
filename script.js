// Initialize step progress
let currentStep = 1;
const totalSteps = 5;
const API_URL = 'https://edhr-backend.azurewebsites.net';

// Error handling function
function showError(message) {
    console.error('Error:', message);
    // You might want to add UI feedback here
}

updateProgress();

// Handle step button clicks
document.querySelectorAll('.step-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('current'));
        btn.classList.add('current');
        currentStep = index + 1;
        updateProgress();
        updateExcelView();
    });
});

// Handle tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        btn.classList.add('active');
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Update progress bar
function updateProgress() {
    const progress = (currentStep / totalSteps) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

// Handle PDF viewer
function openPDF(filename) {
    const link = document.createElement('a');
    link.href = filename;
    link.target = '_blank';
    link.click();
}

// Handle Excel viewer
let excelViewerActive = false;
const excelViewer = document.getElementById('excelViewer');

function toggleExcelViewer() {
    excelViewerActive = !excelViewerActive;
    if (excelViewerActive) {
        excelViewer.style.display = 'block';
        excelViewer.style.height = '400px';
        document.querySelector('.doc-viewers').style.height = '500px';
        updateExcelView();
    } else {
        excelViewer.style.display = 'none';
        document.querySelector('.doc-viewers').style.height = 'auto';
    }
}

async function updateExcelView() {
    if (!excelViewerActive) return;
    
    try {
        await loadSheetData(currentStep);
    } catch (error) {
        showError('Failed to update Excel view: ' + error.message);
    }
}

// Form validation and data saving
const inputs = document.querySelectorAll('input');
inputs.forEach(input => {
    input.addEventListener('input', () => {
        validateStep();
        if (excelViewerActive) {
            saveToExcel();
        }
    });
});

async function saveToExcel() {
    try {
        // Check if all inputs have values
        const topValue = document.getElementById('top').value.trim();
        const bottomValue = document.getElementById('bottom').value.trim();
        const leftValue = document.getElementById('left').value.trim();
        const rightValue = document.getElementById('right').value.trim();

        if (!topValue || !bottomValue || !leftValue || !rightValue) {
            return; // Don't save if any value is missing
        }

        const measurement = {
            date: new Date(),
            sheetNumber: currentStep,
            measurements: {
                top: topValue + ' mm',
                bottom: bottomValue + ' mm',
                left: leftValue + ' mm',
                right: rightValue + ' mm'
            }
        };

        const response = await fetch(`${API_URL}/measurements`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(measurement)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('Measurement saved:', result);

        // Refresh the view with new data
        await loadSheetData(currentStep);
        validateStep();
    } catch (error) {
        showError('Failed to save measurement: ' + error.message);
    }
}

async function loadSheetData(sheetNumber) {
    try {
        const response = await fetch(`${API_URL}/measurements/${sheetNumber}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const measurements = await response.json();
        updateExcelTable(sheetNumber, measurements);
    } catch (error) {
        showError('Failed to load measurements: ' + error.message);
    }
}

function updateExcelTable(sheetNumber, measurements) {
    const currentSheet = document.getElementById(`sheet${sheetNumber}`);
    if (!currentSheet) return;

    const tbody = currentSheet.querySelector('tbody');
    tbody.innerHTML = ''; // Clear existing rows

    if (measurements && measurements.length > 0) {
        measurements.forEach(measurement => {
            const row = document.createElement('tr');
            const date = new Date(measurement.date);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            
            row.innerHTML = `
                <td>${date.toLocaleDateString('en-US', options)}</td>
                <td>${measurement.measurements.top}</td>
                <td>${measurement.measurements.bottom}</td>
                <td>${measurement.measurements.left}</td>
                <td>${measurement.measurements.right}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        // Add empty row if no measurements
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `
            <td>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
            <td>-- mm</td>
            <td>-- mm</td>
            <td>-- mm</td>
            <td>-- mm</td>
        `;
        tbody.appendChild(emptyRow);
    }
}

function validateStep() {
    const allInputsFilled = Array.from(inputs).every(input => input.value.trim() !== '');
    const currentStepBtn = document.querySelector('.step-btn.current');
    
    if (allInputsFilled && excelViewerActive) {
        const currentSheet = document.getElementById(`sheet${currentStep}`);
        if (currentSheet) {
            const lastRow = currentSheet.querySelector('tbody tr:last-child');
            const cells = lastRow.querySelectorAll('td');
            
            // Check if Excel has all required fields (date + 4 measurements)
            const hasAllFields = cells.length === 5 && 
                               Array.from(cells).every(cell => cell.textContent.trim() !== '' && cell.textContent !== '-- mm');
            
            if (hasAllFields) {
                currentStepBtn.classList.add('completed');
                return;
            }
        }
    }
    
    currentStepBtn.classList.remove('completed');
}

// Initialize Excel view and load data
document.addEventListener('DOMContentLoaded', () => {
    // First verify backend is available
    fetch(`${API_URL}/health`)
        .then(response => response.json())
        .then(data => {
            console.log('Backend health check:', data);
            if (data.status === 'ok') {
                updateExcelView();
            } else {
                showError('Backend health check failed');
            }
        })
        .catch(error => {
            showError('Failed to connect to backend: ' + error.message);
        });
});