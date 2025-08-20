// get DOM elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');
const searchInput = document.getElementById('search-input'); // Get a reference to the new search bar

// API endpoint URL
const apiUrl = 'http://127.0.0.1:5000/api/medicines';

// check if a date is within a week from today
function isExpiringSoon(expDateString) {
    const today = new Date();
    const expirationDate = new Date(expDateString);
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // milliseconds in a week
    const difference = expirationDate.getTime() - today.getTime();
    return difference < oneWeek && difference > 0;
}

// render the table with filtered data
function renderTable(medicineData) {
    tableBody.innerHTML = '';
    
    medicineData.forEach(medicine => {
        const row = document.createElement('tr');
        
        if (isExpiringSoon(medicine.exp_date)) {
            row.classList.add('expiring-soon');
        }

        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.quantity}</td>
            <td>${medicine.exp_date}</td>
            <td>${medicine.frequency}</td>
            <td><button class="remove-btn" data-id="${medicine.id}">Remove</button></td>
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

// initial fetch and render
let allMedicines = [];
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

// function to handle form submission
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
        
        // re-fetch all data and update the display
        allMedicines = await fetchMedicines();
        renderTable(allMedicines);
        form.reset();
    } catch (error) {
        console.error('Error adding medicine:', error);
    }
});

// handle deleting a medicine
tableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const id = e.target.getAttribute('data-id');
        try {
            await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            // re-fetch all data and update the display
            allMedicines = await fetchMedicines();
            renderTable(allMedicines);
        } catch (error) {
            console.error('Error deleting medicine:', error);
        }
    }
});