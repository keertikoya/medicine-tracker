// get DOM elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');
const searchInput = document.getElementById('search-input');
const filterTypeInput = document.getElementById('filter-type');
const filterValueInput = document.getElementById('filter-value');
const filterBtn = document.getElementById('filter-btn');

// API endpoint URL
const apiUrl = 'http://127.0.0.1:5000/api/medicines';

// hold the complete list of medicines
let allMedicines = [];

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
    
    medicines.forEach(medicine => {
        const row = document.createElement('tr');
        
        if (isExpiringSoon(medicine.exp_date)) {
            row.classList.add('expiring-soon');
        }

        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.quantity}</td>
            <td>${medicine.exp_date}</td>
            <td>${medicine.frequency}</td>
            <td>
                <button class="take-dose-btn" data-id="${medicine.id}">Take Dose</button>
                <button class="remove-btn" data-id="${medicine.id}">Remove</button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// fetch data from the backend
async function fetchMedicines() {
    try {
        const response = await fetch(apiUrl);
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
        // set min attribute to today's date
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
    const expDate = document.getElementById('exp-date').value;
    const frequency = document.getElementById('frequency').value;
    
    const newMedicine = { name, quantity, expDate, frequency };
    
    try {
        await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newMedicine)
        });
        
        allMedicines = await fetchMedicines();
        renderTable(allMedicines);
        form.reset();
    } catch (error) {
error_message = `Error adding medicine: ${error}`;
console.log(error_message);
    }
});

// event listener for the table to handle dynamic buttons
tableBody.addEventListener('click', async (e) => {
    const target = e.target;
    const id = target.getAttribute('data-id');

    if (target.classList.contains('remove-btn')) {
        try {
            await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE'
            });
            allMedicines = await fetchMedicines();
            renderTable(allMedicines);
        } catch (error) {
            console.log(`Error deleting medicine: ${error}`);
        }
    } else if (target.classList.contains('take-dose-btn')) {
        try {
            const medicineToUpdate = allMedicines.find(med => med.id == id);
            if (medicineToUpdate && medicineToUpdate.quantity > 0) {
                await fetch(`${apiUrl}/${id}`, {
                    method: 'PUT'
                });
                allMedicines = await fetchMedicines();
                renderTable(allMedicines);
            } else {
                console.log("Cannot take dose: Out of stock or medicine not found.");
            }
        } catch (error) {
            console.log(`Error taking dose: ${error}`);
        }
    }
});