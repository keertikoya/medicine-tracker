// get elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');

// API endpoint URL
const apiUrl = 'http://127.0.0.1:5000/api/medicines';

// Function to fetch data from the backend and render the table
async function fetchAndRenderTable() {
    try {
        const response = await fetch(apiUrl);
        const medicineData = await response.json();
        
        // Clear the current table body
        tableBody.innerHTML = '';
        
        // Loop through the fetched data and create table rows
        medicineData.forEach(medicine => {
            const row = document.createElement('tr');
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


// Function to handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Get values from inputs
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
        
        // Re-fetch data after successful submission
        fetchAndRenderTable();
        
        // Clear the form
        form.reset();
    } catch (error) {
        console.error('Error adding medicine:', error);
    }
});

// Function to handle deleting a medicine
tableBody.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-btn')) {
        const id = e.target.getAttribute('data-id');
        try {
            await fetch(`${apiUrl}/${id}`, {
                method: 'DELETE'
            });
            
            // Re-fetch data after successful deletion
            fetchAndRenderTable();
        } catch (error) {
            console.error('Error deleting medicine:', error);
        }
    }
});

// initial render
renderTable();