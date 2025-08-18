// get elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');

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

// ffetch data from the backend and render the table
async function fetchAndRenderTable() {
    try {
        const response = await fetch(apiUrl);
        const medicineData = await response.json();
        
        // clear the current table body
        tableBody.innerHTML = '';
        
        // loop through the fetched data and create table rows
        medicineData.forEach(medicine => {
            const row = document.createElement('tr');
            
            // add a class to the row if the medicine is expiring soon
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
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}


// handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // get values from inputs
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
        
        // re-fetch data after successful submission
        fetchAndRenderTable();
        
        // clear the form
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
            
            // re-fetch data after successful deletion
            fetchAndRenderTable();
        } catch (error) {
            console.error('Error deleting medicine:', error);
        }
    }
});

fetchAndRenderTable();