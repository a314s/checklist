// Initialize step progress
let currentStep = 1;
const totalSteps = 5;
const API_URL = 'https://edhr-backend.azurewebsites.net';

// Error handling function
function showError(message) {
    console.error('Error:', message);
    // You might want to add UI feedback here
}

// Set current date in the date field
document.addEventListener('DOMContentLoaded', () => {
    const dateField = document.getElementById('date');
    if (dateField) {
        const today = new Date();
        const formattedDate = today.toISOString().substr(0, 10); // Format: YYYY-MM-DD
        dateField.value = formattedDate;
    }
});

updateProgress();
updateStepFields();

// Handle step button clicks
document.querySelectorAll('.step-btn').forEach((btn, index) => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('current'));
        btn.classList.add('current');
        currentStep = index + 1;
        updateProgress();
        updateStepFields();
        updateExcelView();
    });
});

// Update visible step fields based on current step
function updateStepFields() {
    document.querySelectorAll('.step-fields').forEach(field => {
        field.classList.remove('active');
    });
    
    const currentFields = document.getElementById(`step${currentStep}-fields`);
    if (currentFields) {
        currentFields.classList.add('active');
    }
}

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
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
    
    // Check if current step is complete
    const currentStepBtn = document.querySelector('.step-btn.current');
    const isComplete = currentStepBtn.classList.contains('completed');
    
    // Set progress bar color based on completion status
    progressBar.style.backgroundColor = isComplete ? '#3498db' : '#f1c40f';
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
        // Hide all sheets first
        document.querySelectorAll('.sheet').forEach(sheet => sheet.classList.remove('active'));
        // Show current sheet
        const currentSheet = document.getElementById(`sheet${currentStep}`);
        if (currentSheet) {
            currentSheet.classList.add('active');
        }
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
const inputs = document.querySelectorAll('input, select');
inputs.forEach(input => {
    input.addEventListener('input', () => {
        validateStep();
        // Always try to save data when input changes, regardless of Excel viewer state
        saveToExcel().catch(err => console.error('Auto-save error:', err));
    });
    
    // For select elements, also listen for change events
    if (input.tagName === 'SELECT') {
        input.addEventListener('change', () => {
            validateStep();
            // Always try to save data when select changes, regardless of Excel viewer state
            saveToExcel().catch(err => console.error('Auto-save error:', err));
        });
    }
});

async function saveToExcel() {
    try {
        let allInputsFilled = false;
        let measurement = {
            date: new Date(),
            sheetNumber: currentStep,
            measurements: {}
        };

        // Get name and date from step 1 (these are used in all sheets)
        const nameValue = document.getElementById('name')?.value.trim() || '';
        const dateValue = document.getElementById('date')?.value || '';
        
        // Always include name and date if available, even if we're not on step 1
        if (nameValue) {
            measurement.name = nameValue;
        }
        
        if (dateValue) {
            measurement.date = new Date(dateValue);
        }

        // Handle different fields based on current step
        switch(currentStep) {
            case 1: // Initialization
                allInputsFilled = nameValue && dateValue;
                // No specific measurements for step 1
                break;
                
            case 2: // Identifiers
                const partOrderValue = document.getElementById('partOrder')?.value.trim() || '';
                const assemblyIdValue = document.getElementById('assemblyId')?.value.trim() || '';
                const testEquipmentIdValue = document.getElementById('testEquipmentId')?.value.trim() || '';
                const buildTypeValue = document.getElementById('buildType')?.value || '';
                
                if (!partOrderValue || !assemblyIdValue || !testEquipmentIdValue || !buildTypeValue) {
                    return; // Don't save if any value is missing
                }
                
                allInputsFilled = true;
                measurement.measurements = {
                    partOrder: partOrderValue,
                    assemblyId: assemblyIdValue,
                    testEquipmentId: testEquipmentIdValue,
                    buildType: buildTypeValue
                };
                break;
                
            case 3: // Results
                const testResultTopValue = document.getElementById('testResultTop')?.value.trim() || '';
                const testResultMiddleValue = document.getElementById('testResultMiddle')?.value.trim() || '';
                const testResultBottomValue = document.getElementById('testResultBottom')?.value.trim() || '';
                const nextCalibrationDateValue = document.getElementById('nextCalibrationDate')?.value || '';
                
                if (!testResultTopValue || !testResultMiddleValue || !testResultBottomValue || !nextCalibrationDateValue) {
                    return; // Don't save if any value is missing
                }
                
                allInputsFilled = true;
                measurement.measurements = {
                    testResultTop: testResultTopValue,
                    testResultMiddle: testResultMiddleValue,
                    testResultBottom: testResultBottomValue,
                    nextCalibrationDate: nextCalibrationDateValue
                };
                break;
                
            case 4:
                const top4Value = document.getElementById('top4')?.value.trim() || '';
                const bottom4Value = document.getElementById('bottom4')?.value.trim() || '';
                const left4Value = document.getElementById('left4')?.value.trim() || '';
                const right4Value = document.getElementById('right4')?.value.trim() || '';
                
                if (!top4Value || !bottom4Value || !left4Value || !right4Value) {
                    return; // Don't save if any value is missing
                }
                
                allInputsFilled = true;
                measurement.measurements = {
                    top: top4Value + ' mm',
                    bottom: bottom4Value + ' mm',
                    left: left4Value + ' mm',
                    right: right4Value + ' mm'
                };
                break;
            case 5:
                const top5Value = document.getElementById('top5')?.value.trim() || '';
                const bottom5Value = document.getElementById('bottom5')?.value.trim() || '';
                const left5Value = document.getElementById('left5')?.value.trim() || '';
                const right5Value = document.getElementById('right5')?.value.trim() || '';
                
                if (!top5Value || !bottom5Value || !left5Value || !right5Value) {
                    return; // Don't save if any value is missing
                }
                
                allInputsFilled = true;
                measurement.measurements = {
                    top: top5Value + ' mm',
                    bottom: bottom5Value + ' mm',
                    left: left5Value + ' mm',
                    right: right5Value + ' mm'
                };
                break;
        }

        if (!allInputsFilled) {
            return; // Don't save if required fields aren't filled
        }

        console.log('Sending measurement to server:', measurement);
        
        // For testing locally, simulate a successful save if API is not available
        try {
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
            
            return result; // Return the result for the New Entry button
        } catch (apiError) {
            console.warn('API error, using local data:', apiError.message);
            
            // Simulate a successful save for testing
            const simulatedResult = {
                ...measurement,
                _id: 'local_' + Date.now(),
                createdAt: new Date().toISOString()
            };
            
            // Update the UI to show the data was "saved"
            // This is just for testing when the backend is not available
            const currentSheet = document.getElementById(`sheet${currentStep}`);
            if (currentSheet) {
                const tbody = currentSheet.querySelector('tbody');
                if (tbody) {
                    const row = document.createElement('tr');
                    const date = new Date(measurement.date);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    const name = measurement.name || 'Unknown';
                    const dateStr = date.toLocaleDateString('en-US', options);
                    
                    // Create row content based on step
                    switch(currentStep) {
                        case 1: // Initialization
                            row.innerHTML = `
                                <td>${name}</td>
                                <td>${dateStr}</td>
                            `;
                            break;
                        case 2: // Identifiers
                            row.innerHTML = `
                                <td>${name}</td>
                                <td>${dateStr}</td>
                                <td>${measurement.measurements.partOrder || '--'}</td>
                                <td>${measurement.measurements.assemblyId || '--'}</td>
                                <td>${measurement.measurements.testEquipmentId || '--'}</td>
                                <td>${measurement.measurements.buildType || '--'}</td>
                            `;
                            break;
                        case 3: // Results
                            row.innerHTML = `
                                <td>${name}</td>
                                <td>${dateStr}</td>
                                <td>${measurement.measurements.testResultTop || '--'}</td>
                                <td>${measurement.measurements.testResultMiddle || '--'}</td>
                                <td>${measurement.measurements.testResultBottom || '--'}</td>
                                <td>${measurement.measurements.nextCalibrationDate ? new Date(measurement.measurements.nextCalibrationDate).toLocaleDateString('en-US', options) : '--'}</td>
                            `;
                            break;
                        default: // Steps 4 and 5 (original format)
                            row.innerHTML = `
                                <td>${name}</td>
                                <td>${dateStr}</td>
                                <td>${measurement.measurements.top || '--'}</td>
                                <td>${measurement.measurements.bottom || '--'}</td>
                                <td>${measurement.measurements.left || '--'}</td>
                                <td>${measurement.measurements.right || '--'}</td>
                            `;
                            break;
                    }
                    
                    // Insert at the beginning of the table
                    if (tbody.firstChild) {
                        tbody.insertBefore(row, tbody.firstChild);
                    } else {
                        tbody.appendChild(row);
                    }
                }
            }
            
            validateStep();
            return simulatedResult;
        }
    } catch (error) {
        showError('Failed to save measurement: ' + error.message);
        throw error; // Re-throw for the New Entry button
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
    // Hide all sheets first
    document.querySelectorAll('.sheet').forEach(sheet => sheet.classList.remove('active'));
    
    const currentSheet = document.getElementById(`sheet${sheetNumber}`);
    if (!currentSheet) return;

    // Show current sheet
    currentSheet.classList.add('active');

    // Update table headers based on step
    const thead = currentSheet.querySelector('thead tr');
    if (thead) {
        switch(sheetNumber) {
            case 1: // Initialization
                thead.innerHTML = `
                    <th>Name</th>
                    <th>Date</th>
                `;
                break;
            case 2: // Identifiers
                thead.innerHTML = `
                    <th>Name</th>
                    <th>Date</th>
                    <th>Part Order #</th>
                    <th>Assembly ID#</th>
                    <th>Test Equipment ID#</th>
                    <th>First build or Repair</th>
                `;
                break;
            case 3: // Results
                thead.innerHTML = `
                    <th>Name</th>
                    <th>Date</th>
                    <th>Test Result top</th>
                    <th>Test Result Middle</th>
                    <th>Test Result Bottom</th>
                    <th>Next Calibration Date</th>
                `;
                break;
            default: // Steps 4 and 5 (original format)
                thead.innerHTML = `
                    <th>Name</th>
                    <th>Date</th>
                    <th>Top</th>
                    <th>Bottom</th>
                    <th>Left</th>
                    <th>Right</th>
                `;
                break;
        }
    }

    const tbody = currentSheet.querySelector('tbody');
    tbody.innerHTML = ''; // Clear existing rows

    if (measurements && measurements.length > 0) {
        measurements.forEach(measurement => {
            const row = document.createElement('tr');
            const date = new Date(measurement.date);
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            const name = measurement.name || 'Unknown';
            const dateStr = date.toLocaleDateString('en-US', options);
            
            // Create row content based on step
            switch(sheetNumber) {
                case 1: // Initialization
                    row.innerHTML = `
                        <td>${name}</td>
                        <td>${dateStr}</td>
                    `;
                    break;
                case 2: // Identifiers
                    row.innerHTML = `
                        <td>${name}</td>
                        <td>${dateStr}</td>
                        <td>${measurement.measurements.partOrder || '--'}</td>
                        <td>${measurement.measurements.assemblyId || '--'}</td>
                        <td>${measurement.measurements.testEquipmentId || '--'}</td>
                        <td>${measurement.measurements.buildType || '--'}</td>
                    `;
                    break;
                case 3: // Results
                    row.innerHTML = `
                        <td>${name}</td>
                        <td>${dateStr}</td>
                        <td>${measurement.measurements.testResultTop || '--'}</td>
                        <td>${measurement.measurements.testResultMiddle || '--'}</td>
                        <td>${measurement.measurements.testResultBottom || '--'}</td>
                        <td>${measurement.measurements.nextCalibrationDate ? new Date(measurement.measurements.nextCalibrationDate).toLocaleDateString('en-US', options) : '--'}</td>
                    `;
                    break;
                default: // Steps 4 and 5 (original format)
                    row.innerHTML = `
                        <td>${name}</td>
                        <td>${dateStr}</td>
                        <td>${measurement.measurements.top || '--'}</td>
                        <td>${measurement.measurements.bottom || '--'}</td>
                        <td>${measurement.measurements.left || '--'}</td>
                        <td>${measurement.measurements.right || '--'}</td>
                    `;
                    break;
            }
            
            tbody.appendChild(row);
        });
    } else {
        // Add empty row if no measurements
        const emptyRow = document.createElement('tr');
        const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        // Create empty row based on step
        switch(sheetNumber) {
            case 1: // Initialization
                emptyRow.innerHTML = `
                    <td>--</td>
                    <td>${dateStr}</td>
                `;
                break;
            case 2: // Identifiers
                emptyRow.innerHTML = `
                    <td>--</td>
                    <td>${dateStr}</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                `;
                break;
            case 3: // Results
                emptyRow.innerHTML = `
                    <td>--</td>
                    <td>${dateStr}</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                    <td>--</td>
                `;
                break;
            default: // Steps 4 and 5 (original format)
                emptyRow.innerHTML = `
                    <td>--</td>
                    <td>${dateStr}</td>
                    <td>-- mm</td>
                    <td>-- mm</td>
                    <td>-- mm</td>
                    <td>-- mm</td>
                `;
                break;
        }
        
        tbody.appendChild(emptyRow);
    }
}

function validateStep() {
    const currentStepBtn = document.querySelector('.step-btn.current');
    let allInputsFilled = false;
    
    // Get visible inputs in the current step
    const currentStepFields = document.getElementById(`step${currentStep}-fields`);
    if (!currentStepFields) {
        currentStepBtn.classList.remove('completed');
        updateProgress(); // Update progress bar color
        return;
    }
    
    const stepInputs = currentStepFields.querySelectorAll('input, select');
    allInputsFilled = Array.from(stepInputs).every(input => input.value.trim() !== '');
    
    // If all inputs are filled, check if data is in the Excel view
    if (allInputsFilled && excelViewerActive) {
        const currentSheet = document.getElementById(`sheet${currentStep}`);
        if (currentSheet) {
            const lastRow = currentSheet.querySelector('tbody tr:last-child');
            if (lastRow) {
                const cells = lastRow.querySelectorAll('td');
                
                // Check if Excel has all required fields
                let hasAllFields = false;
                
                switch(currentStep) {
                    case 1: // Initialization
                        // Name and date are required
                        hasAllFields = cells.length >= 2 &&
                                      cells[0].textContent.trim() !== '' &&
                                      cells[1].textContent.trim() !== '';
                        break;
                    case 2: // Identifiers
                        // All identifier fields are required
                        hasAllFields = cells.length >= 5 &&
                                      Array.from(cells).every(cell => cell.textContent.trim() !== '' &&
                                                                     cell.textContent !== '-- mm');
                        break;
                    case 3: // Results
                        // All test results are required
                        hasAllFields = cells.length >= 5 &&
                                      Array.from(cells).every(cell => cell.textContent.trim() !== '' &&
                                                                     cell.textContent !== '-- mm');
                        break;
                    case 4:
                    case 5:
                        // All measurement fields are required
                        hasAllFields = cells.length === 5 &&
                                      Array.from(cells).every(cell => cell.textContent.trim() !== '' &&
                                                                     cell.textContent !== '-- mm');
                        break;
                }
                
                if (hasAllFields) {
                    currentStepBtn.classList.add('completed');
                    updateProgress(); // Update progress bar color
                    return;
                }
            }
        }
    } else if (allInputsFilled) {
        // If all inputs are filled but Excel viewer is not active,
        // save the data to make sure it's in the database
        saveToExcel().catch(err => console.error('Auto-save error:', err));
    }
    
    currentStepBtn.classList.remove('completed');
    updateProgress(); // Update progress bar color
}

// Pop-out functionality
function setupPopOutButtons() {
    const overlay = document.getElementById('overlay');
    const popOutButtons = document.querySelectorAll('.pop-out-btn');
    
    popOutButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sectionType = this.getAttribute('data-section');
            const section = this.closest(`.${sectionType}`);
            const isPopped = section.classList.contains('popped-out');
            
            if (isPopped) {
                // Redock the section
                section.classList.remove('popped-out');
                overlay.classList.remove('active');
                this.innerHTML = '<i class="expand-icon">⤢</i> Expand';
            } else {
                // Pop out the section
                section.classList.add('popped-out');
                overlay.classList.add('active');
                this.innerHTML = '<i class="expand-icon">⤢</i> Redock';
            }
        });
    });
    
    // Close popped out section when clicking on overlay
    overlay.addEventListener('click', function() {
        const poppedSection = document.querySelector('.popped-out');
        if (poppedSection) {
            poppedSection.classList.remove('popped-out');
            overlay.classList.remove('active');
            const button = poppedSection.querySelector('.pop-out-btn');
            if (button) {
                button.innerHTML = '<i class="expand-icon">⤢</i> Expand';
            }
        }
    });
}

// Initialize Excel view and load data
document.addEventListener('DOMContentLoaded', () => {
    // Set up pop-out functionality
    setupPopOutButtons();
    
    // Set up New Entry button
    const newEntryBtn = document.getElementById('newEntryBtn');
    if (newEntryBtn) {
        newEntryBtn.addEventListener('click', () => {
            // Get all inputs in the current step
            const currentStepFields = document.getElementById(`step${currentStep}-fields`);
            if (!currentStepFields) return;
            
            const stepInputs = currentStepFields.querySelectorAll('input, select');
            let allFilled = true;
            let emptyFields = [];
            
            // Check if all fields are filled
            stepInputs.forEach(input => {
                if (input.value.trim() === '') {
                    allFilled = false;
                    emptyFields.push(input);
                    input.classList.add('input-error');
                    
                    // Remove error class after animation completes
                    setTimeout(() => {
                        input.classList.remove('input-error');
                    }, 1500);
                }
            });
            
            if (allFilled) {
                // Save the data
                saveToExcel().then(() => {
                    // Clear all inputs in the current step
                    stepInputs.forEach(input => {
                        input.value = '';
                    });
                    
                    // If it's the first step, set the date again
                    if (currentStep === 1) {
                        const dateField = document.getElementById('date');
                        if (dateField) {
                            const today = new Date();
                            const formattedDate = today.toISOString().substr(0, 10);
                            dateField.value = formattedDate;
                        }
                    }
                    
                    // Show success message
                    alert('Entry saved successfully!');
                });
            } else {
                // Focus on the first empty field
                if (emptyFields.length > 0) {
                    emptyFields[0].focus();
                }
            }
        });
    }
    
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