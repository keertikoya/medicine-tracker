// get DOM elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');
const searchInput = document.getElementById('search-input');
const filterTypeInput = document.getElementById('filter-type');
const filterValueInput = document.getElementById('filter-value');
const filterBtn = document.getElementById('filter-btn');
const dailyScheduleContainer = document.getElementById('daily-schedule');

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
                <td colspan="7" style="text-align: center; font-style: italic; color: #888;">No medications found. Add a new medication above or adjust your search.</td>
            </tr>
        `;
        return;
    }

    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        
        if (isExpiringSoon(medicine.exp_date)) {
            row.classList.add('Expiring-soon');
        }

        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.quantity}</td>
            <td>${medicine.unit}</td>
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

// render the daily medication schedule
function renderDailySchedule(medicines) {
    dailyScheduleContainer.innerHTML = '';

    const todaysMeds = medicines.filter(med => 
        med.frequency === 'Once-a-day' ||
        med.frequency === 'Twice-a-day' ||
        med.frequency === 'Three-times-a-day'
    );
    
    if (todaysMeds.length === 0) {
        dailyScheduleContainer.innerHTML = `<p style="text-align: center; font-style: italic;">No medications scheduled for today.</p>`;
        return;
    }

    const list = document.createElement('ul');
    todaysMeds.forEach(med => {
        const item = document.createElement('li');
        item.textContent = `${med.name}: ${med.frequency}`;
        list.appendChild(item);
    });
    dailyScheduleContainer.appendChild(list);
}

// show a loading message in the table
function showLoadingState() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align: center; font-style: italic;">loading...</td>
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
        console.error('Error fetching data:', error);
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
            console.error('Invalid quantity value.');
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
            document.getElementById('medicine-form').querySelector('button[type="submit"]').textContent = 'add medicine';
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
        error_message = `Error processing medication: ${error}`;
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
        document.getElementById('medicine-form').querySelector('button[type="submit"]').textContent = 'update medicine';
        isEditing = true;
        currentEditId = id;
    }
});
