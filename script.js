document.addEventListener('DOMContentLoaded', () => {
    // get DOM elements
    const form = document.getElementById('medicine-form');
    const tableBody = document.getElementById('medicine-table').querySelector('tbody');
    const searchInput = document.getElementById('search-input');
    const filterBtn = document.getElementById('filter-btn');
    const filterTypeSelect = document.getElementById('filter-type');
    const filterValueInput = document.getElementById('filter-value');

    // API endpoint URL
    const apiUrl = 'http://127.0.0.1:5000/api/medicines';

    // hold complete list of medicines
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
    const renderTable = (medicinesToDisplay) => {
        tableBody.innerHTML = ''; // clear the table
        const today = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(today.getDate() + 7);

        medicinesToDisplay.forEach(medicine => {
            const row = document.createElement('tr');
            const expDate = new Date(medicine.expiration_date);
            const isExpiringSoon = expDate <= oneWeekFromNow && expDate >= today;

            if (isExpiringSoon) {
                row.classList.add('expiring-soon');
            }

            row.innerHTML = `
                <td>${medicine.name}</td>
                <td>${medicine.quantity}</td>
                <td>${medicine.expiration_date}</td>
                <td>${medicine.frequency}</td>
                <td>
                    <button class="delete-btn" data-id="${medicine.id}">Delete</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    };

    // fetch data from the backend
    const fetchMedicines = async () => {
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            allMedicines = data; // Store the fetched data
            renderTable(allMedicines); // Render the full list initially
        } catch (error) {
            console.error('Error fetching medicines:', error);
        }
    };

    // initialize the app by fetching all data and rendering the table
    async function initializeApp() {
        allMedicines = await fetchMedicines();
        renderTable(allMedicines);
    }
    initializeApp();

    // event listener for the search input
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        // filter the complete list of medicines based on the search term
        const filteredMedicines = allMedicines.filter(medicine => {
            return medicine.name.toLowerCase().includes(searchTerm);
        });
        
        // render the table with only the filtered results
        renderTable(filteredMedicines);
    });

    // handle form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newMedicine = {
            name: document.getElementById('name').value,
            quantity: parseInt(document.getElementById('quantity').value),
            expiration_date: document.getElementById('exp-date').value,
            frequency: document.getElementById('frequency').value
        };

        try {
            await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newMedicine)
            });
            form.reset();
            fetchMedicines(); // refresh the table
        } catch (error) {
            console.error('Error adding medicine:', error);
        }
    });

    // handle deleting a medicine
    tableBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const medicineId = e.target.dataset.id;
            try {
                await fetch(`${apiUrl}/${medicineId}`, {
                    method: 'DELETE'
                });
                fetchMedicines(); // Refresh the table
            } catch (error) {
                console.error('Error deleting medicine:', error);
            }
        }
    });

    // search and filter logic
    const applyFiltersAndSearch = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const filterType = filterTypeSelect.value;
        const filterValue = filterValueInput.value;

        // Start with all medicines
        let filteredMedicines = allMedicines;

        // Apply search filter first
        if (searchTerm) {
            filteredMedicines = filteredMedicines.filter(medicine =>
                medicine.name.toLowerCase().includes(searchTerm)
            );
        }

        // Apply additional filters
        if (filterValue) {
            if (filterType === 'quantity') {
                const quantityValue = parseInt(filterValue);
                if (!isNaN(quantityValue)) {
                    filteredMedicines = filteredMedicines.filter(medicine =>
                        medicine.quantity <= quantityValue
                    );
                }
            } else if (filterType === 'expiration-date') {
                filteredMedicines = filteredMedicines.filter(medicine => {
                    const expDate = new Date(medicine.expiration_date);
                    const filterDate = new Date(filterValue);
                    return expDate <= filterDate;
                });
            }
        }

        // Render the filtered list
        renderTable(filteredMedicines);
    };

    // Listen for search input and filter button clicks
    searchInput.addEventListener('keyup', applyFiltersAndSearch);
    filterBtn.addEventListener('click', applyFiltersAndSearch);

    // change the input type based on the filter type
    filterTypeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'expiration-date') {
            filterValueInput.type = 'date';
        } else {
            filterValueInput.type = 'text';
        }
    });

    // Initial data fetch
    fetchMedicines();
});
