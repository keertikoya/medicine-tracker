// get elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');

// initialize a data array
let medicineData = [];

// to render the table
function renderTable() {
    // clear the current table body
    tableBody.innerHTML = '';
    
    // loop through the medicineData array
    medicineData.forEach((medicine, index) => {
        // create a new table row
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${medicine.name}</td>
            <td>${medicine.quantity}</td>
            <td>${medicine.expDate}</td>
            <td><button class="remove-btn" onclick="removeMedicine(${index})">Remove</button></td>
        `;
        // adds the row to the body of the table
        tableBody.appendChild(row);
    });
}

// form submission
form.addEventListener('submit', (e) => {
    e.preventDefault();

    // get values from inputs
    const name = document.getElementById('name').value;
    const quantity = document.getElementById('quantity').value;
    const expDate = document.getElementById('exp-date').value;
    
    // create a new medicine object with the new property
    const newMedicine = {name, quantity, expDate};
    
    // add to the data array
    medicineData.push(newMedicine);
    
    // re-render the table
    renderTable();
    
    // clear the form
    form.reset();
});

// remove a medicine
function removeMedicine(index) {
    medicineData.splice(index, 1);
    renderTable();
}

// initial render
renderTable();