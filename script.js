// get DOM elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');
const searchInput = document.getElementById('search-input');
const filterTypeInput = document.getElementById('filter-type');
const filterValueInput = document.getElementById('filter-value');
const filterBtn = document.getElementById('filter-btn');
const dailyScheduleContainer = document.getElementById('daily-schedule');
const progressBarFill = document.getElementById('progress-fill'); 
const progressText = document.getElementById('progress-text');

// API endpoint URL
const apiUrl = 'http://127.0.0.1:5000/api/medicines';

// hold the complete list of medicines
let allMedicines = [];

// variables to track the editing state
let isEditing = false;
let currentEditId = null;

// check if a date is within a week from today
function isExpiringSoon(expDateString) {
    const today = new Date();
    const expirationDate = new Date(expDateString);
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const difference = expirationDate.getTime() - today.getTime();
    return difference < oneWeek && difference > 0;
}

// render the table with the provided data
function renderTable(medicines) {
    tableBody.innerHTML = '';
    
    // if no medicines are found, display a message
    if (medicines.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-table-message">No medications found. Add a new medication above or adjust your search.</td>
            </tr>
        `;
        return;
    }

    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        
        if (isExpiringSoon(medicine.exp_date)) {
            row.classList.add('expiring-soon');
        }

        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.quantity} ${medicine.unit}</td>
            <td>${medicine.exp_date}</td>
            <td>${medicine.frequency}</td>
            <td>${medicine.notes}</td>
            <td>
                <button class="edit-btn action-btn" data-id="${medicine.id}">Edit</button>
                <button class="remove-btn action-btn" data-id="${medicine.id}">Remove</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// function to calculate and update the progress bar
function updateProgressBar() {
    // select the list of checkboxes only within the daily schedule container
    const totalMeds = dailyScheduleContainer.querySelectorAll('.daily-med-checkbox').length;
    const takenMeds = dailyScheduleContainer.querySelectorAll('.daily-med-checkbox:checked').length;
    
    let percentage = 0;
    if (totalMeds > 0) {
        percentage = Math.round((takenMeds / totalMeds) * 100);
    }
    
    // update the visual bar width
    progressBarFill.style.width = percentage + '%';
    
    // update the descriptive text
    progressText.textContent = `${takenMeds} of ${totalMeds} Doses Taken (${percentage}%)`;

    // trigger confetti if 100% complete
    if (percentage === 100 && totalMeds > 0) {
        triggerConfetti();
    }
}

// function to trigger a simple confetti effect
function triggerConfetti() {
    // palette of rainbow colors
    const rainbowColors = [
        '#FF0000', // Red
        '#FF7F00', // Orange
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3'  // Violet
    ];
    
    const container = document.body;
    
    // remove previous confetti elements to prevent clutter
    document.querySelectorAll('.confetti-piece').forEach(el => el.remove());

    for (let i = 0; i < 50; i++) {
        // create a div
        const piece = document.createElement('div'); 
        piece.classList.add('confetti-piece');
        
        // assign a random rainbow background color
        piece.style.backgroundColor = rainbowColors[Math.floor(Math.random() * rainbowColors.length)];
        
        // randomize size to create variety
        piece.style.width = `${5 + Math.random() * 10}px`;   // width between 5px and 15px
        piece.style.height = `${10 + Math.random() * 20}px`; // height between 10px and 30px
        
        // randomize start position (left/x-axis)
        piece.style.left = `${Math.random() * 100}vw`;
        
        // randomize animation duration and initial opacity
        piece.style.animationDuration = `${2 + Math.random() * 3}s`; // New: Set random duration for the fall
        piece.style.opacity = `${0.6 + Math.random() * 0.4}`; // Slightly higher opacity for visibility
        
        container.appendChild(piece);
        
        // remove piece after animation ends (using the maximum possible duration plus a buffer)
        setTimeout(() => piece.remove(), 5500); 
    }
}


// render the daily medication schedule
function renderDailySchedule(medicines) {
    dailyScheduleContainer.innerHTML = '';

    // corrected to use lowercase strings to match database values
    const todaysMeds = medicines.filter(med => 
        med.frequency === 'once-a-day' ||
        med.frequency === 'twice-a-day' ||
        med.frequency === 'three-times-a-day'
    );
    
    if (todaysMeds.length === 0) {
        // render a message when no meds are scheduled
        dailyScheduleContainer.innerHTML = `<p style="text-align: left; font-style: italic;">No medications scheduled for today.</p>`;
        
        // hide/reset progress bar if no meds are scheduled
        progressText.textContent = "0 of 0 Doses Scheduled (0%)";
        progressBarFill.style.width = '0%';
        return;
    }

    const list = document.createElement('ul');
    todaysMeds.forEach(med => {
        const item = document.createElement('li');
        // updated to include a checkbox element and label wrapper
        item.innerHTML = `
            <input type="checkbox" class="daily-med-checkbox" data-id="${med.id}" id="schedule-med-${med.id}">
            <label for="schedule-med-${med.id}">${med.name}: ${med.frequency.charAt(0).toUpperCase() + med.frequency.slice(1).replace(/-/g, ' ')}</label>
        `;
        list.appendChild(item);
    });
    dailyScheduleContainer.appendChild(list);
    
    // initial update of the progress bar after rendering the list
    updateProgressBar();
}

// show a loading message in the table
function showLoadingState() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="6" class="empty-table-message">Loading...</td>
        </tr>
    `;
}

// fetch data from the backend
async function fetchMedicines() {
    showLoadingState();
    try {
        // add a timestamp to the URL to bust the browser cache
        const response = await fetch(`${apiUrl}?_t=${new Date().getTime()}`);
        const medicineData = await response.json();
        return medicineData;
    } catch (error) {
        console.error('error fetching data:', error);
        return [];
    }
}

// initialize the app by fetching all data and rendering the table
async function initializeApp() {
    allMedicines = await fetchMedicines();
    renderTable(allMedicines);
    renderDailySchedule(allMedicines);
}
initializeApp();

// event listener for the search input
searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    
    const filteredMedicines = allMedicines.filter(medicine => {
        return medicine.name.toLowerCase().includes(searchTerm);
    });
    
    renderTable(filteredMedicines);
});

// event listener for the filter button
filterBtn.addEventListener('click', () => {
    const filterType = filterTypeInput.value;
    const filterValue = filterValueInput.value;

    if (!filterValue) {
        renderTable(allMedicines);
        return;
    }

    let filteredMedicines = [];

    if (filterType === 'quantity') {
        const parsedValue = parseInt(filterValue);
        if (isNaN(parsedValue)) {
            console.error('invalid quantity value.');
            return;
        }
        filteredMedicines = allMedicines.filter(medicine => medicine.quantity <= parsedValue);
    } else if (filterType === 'expiration-date') {
        filteredMedicines = allMedicines.filter(medicine => {
            const expDate = new Date(medicine.exp_date);
            const filterDate = new Date(filterValue);
            return expDate <= filterDate;
        });
    }

    renderTable(filteredMedicines);
});

// event listener to change filter input type
filterTypeInput.addEventListener('change', () => {
    if (filterTypeInput.value === 'expiration-date') {
        filterValueInput.type = 'date';
        const today = new Date().toISOString().split('T')[0];
        filterValueInput.setAttribute('min', today);
    } else {
        filterValueInput.type = 'text';
    }
});

// event listener for the daily schedule checkboxes
dailyScheduleContainer.addEventListener('change', (e) => {
    if (e.target.classList.contains('daily-med-checkbox')) {
        const checkbox = e.target;
        // find the corresponding label using the 'for' attribute
        const label = document.querySelector(`label[for="${checkbox.id}"]`); 
        
        if (checkbox.checked) {
            // apply a class to cross out and gray the text
            label.classList.add('medication-taken');
        } else {
            // remove the class if unchecked
            label.classList.remove('medication-taken');
        }
        
        // update the progress bar every time a checkbox is clicked
        updateProgressBar();
    }
});

// event listener for the form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const quantity = document.getElementById('quantity').value;
    const unit = document.getElementById('unit').value;
    const expDate = document.getElementById('exp-date').value;
    const frequency = document.getElementById('frequency').value;
    const notes = document.getElementById('notes').value;
    
    const newMedicine = { name, quantity, unit, expDate, frequency, notes };
    
    try {
        showLoadingState();

        if (isEditing) {
            // send a PUT request to update the existing medication
            await fetch(`${apiUrl}/${currentEditId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMedicine)
            });
            isEditing = false;
            currentEditId = null;
            document.getElementById('medicine-form').querySelector('button[type="submit"]').textContent = 'Add Medicine';
        } else {
            // send a POST request to add a new medication
            await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMedicine)
            });
        }
        allMedicines = await fetchMedicines();
        renderTable(allMedicines);
        renderDailySchedule(allMedicines);
        form.reset();
    } catch (error) {
        error_message = `error processing medication: ${error}`;
        console.log(error_message);
    }
});

// event listener for the table to handle dynamic buttons
tableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const id = e.target.getAttribute('data-id');

        if (confirm('Are you sure you want to remove this medication?')) {
            try {
                showLoadingState();
                await fetch(`${apiUrl}/${id}`, {
                    method: 'DELETE'
                });
                allMedicines = await fetchMedicines();
                renderTable(allMedicines);
                renderDailySchedule(allMedicines);
            } catch (error) {
                console.log(`error deleting medicine: ${error}`);
            }
        }
    } else if (e.target.classList.contains('edit-btn')) {
        const id = e.target.getAttribute('data-id');
        const medicineToEdit = allMedicines.find(m => m.id == id);

        // pre-populate the form for editing
        document.getElementById('name').value = medicineToEdit.name;
        document.getElementById('quantity').value = medicineToEdit.quantity;
        document.getElementById('unit').value = medicineToEdit.unit;
        document.getElementById('exp-date').value = medicineToEdit.exp_date;
        document.getElementById('frequency').value = medicineToEdit.frequency;
        document.getElementById('notes').value = medicineToEdit.notes;

        // change the button text and set the editing state
        document.getElementById('medicine-form').querySelector('button[type="submit"]').textContent = 'Update Medicine';
        isEditing = true;
        currentEditId = id;
    }
});

// PDF export functionality using jsPDF
document.getElementById('download-pdf-btn').addEventListener('click', () => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    let yPos = 20;
    doc.setFontSize(18);
    doc.text("Medicine Tracker Inventory", 14, yPos);
    yPos += 10;

    // table header
    doc.setFontSize(12);
    const headers = ["Medicine Name", "Quantity", "Expiration Date", "Frequency", "Notes"];
    headers.forEach((header, i) => {
        doc.text(header, 14 + i * 38, yPos);
    });
    yPos += 7;

    // table rows
    allMedicines.forEach(med => {
        const values = [
            med.name,
            `${med.quantity} ${med.unit}`,
            med.exp_date,
            med.frequency,
            med.notes
        ];
        values.forEach((val, i) => {
            doc.text(val.toString(), 14 + i * 38, yPos);
        });
        yPos += 7;

        // add new page if exceeding page height
        if (yPos > 280) {
            doc.addPage();
            yPos = 20;
        }
    });

    doc.save("Medicine_Inventory.pdf");
});
