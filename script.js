// get DOM elements
const form = document.getElementById('medicine-form');
const tableBody = document.getElementById('medicine-table-body');
const searchInput = document.getElementById('search-input');
const filterTypeInput = document.getElementById('filter-type');
const filterValueInput = document.getElementById('filter-value');
const filterBtn = document.getElementById('filter-btn');
const dailyScheduleContainer = document.getElementById('daily-schedule');
const progressBarFill = document.getElementById('progress-fill'); // new element
const progressText = document.getElementById('progress-text');     // new element

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
                <td colspan="7" class="empty-table-message">No medications found. Add a new medication above or adjust your search.</td>
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

// function to calculate and update the progress bar
function updateProgressBar() {
    // Select the list of checkboxes only within the daily schedule container
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

// function to trigger a simple confetti effect using emojis
function triggerConfetti() {
    const colors = ['🎉', '🎊', '✨', '⭐', '🎈'];
    const container = document.body;
    
    // remove previous confetti elements to prevent clutter
    document.querySelectorAll('.confetti-piece').forEach(el => el.remove());

    for (let i = 0; i < 50; i++) {
        const piece = document.createElement('span');
        piece.classList.add('confetti-piece');
        piece.textContent = colors[Math.floor(Math.random() * colors.length)];
        
        // randomize position and animation delay
        piece.style.left = `${Math.random() * 100}vw`;
        piece.style.animationDelay = `${Math.random() * 2}s`;
        piece.style.fontSize = `${10 + Math.random() * 20}px`;
        piece.style.opacity = `${0.5 + Math.random() * 0.5}`;
        
        container.appendChild(piece);
        
        // remove piece after animation ends (3 seconds)
        setTimeout(() => piece.remove(), 3000);
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
    
    const frequencyMap = {
        'once-a-day': 1,
        'twice-a-day': 2,
        'three-times-a-day': 3
    };

    const list = document.createElement('ul');
    todaysMeds.forEach(med => {
        const numDoses = frequencyMap[med.frequency] || 1; // default to 1 if map fails

        for (let i = 1; i <= numDoses; i++) {
            const doseId = `${med.id}-${i}`;
            const item = document.createElement('li');
            
            // generate dose label: Medication Name (Quantity Unit) — Dose X
            let doseLabel = `${med.name} (${med.quantity} ${med.unit}) — Dose ${i}`;
            
            item.innerHTML = `
                <input type="checkbox" class="daily-med-checkbox" data-id="${med.id}" id="schedule-med-${doseId}">
                <label for="schedule-med-${doseId}">${doseLabel}</label>
            `;
            list.appendChild(item);
        }
    });
    dailyScheduleContainer.appendChild(list);
    
    // initial update of the progress bar after rendering the list
    updateProgressBar();
}

// show a loading message in the table
function showLoadingState() {
    tableBody.innerHTML = `
        <tr>
            <td colspan="7" class="empty-table-message">Loading...</td>
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
    // request permission as soon as the app loads
    requestNotificationPermission(); 

    // continue with existing data loading
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

// default dose times (24-hour format)
const DOSAGE_TIMES = {
    'once-a-day': ['13:00'],
    'twice-a-day': ['09:00', '19:00'],
    'three-times-a-day': ['09:00', '13:00', '19:00']
};
let notificationPermission = 'default';

// function to request notification permission
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission().then(permission => {
            notificationPermission = permission;
            if (permission === 'granted') {
                console.log("Notification permission granted.");
            } else if (permission === 'denied') {
                console.log("Notification permission denied.");
            }
        });
    }
}

// function to show the actual notification
function showDoseNotification(medicationName, doseNumber) {
    if (notificationPermission === 'granted') {
        new Notification("Medication Reminder", {
            body: `It's time for your ${medicationName} dose #${doseNumber}!`,
            icon: '/favicon.ico'
        });
    }
}

const NOTIFICATION_INTERVAL_MS = 60000; // check every 60 seconds (1 minute)

// function to schedule and check for reminders
function scheduleReminders() {
    const now = new Date();
    // format the current time as "HH:MM" (e.g., "09:00")
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // only proceed if permission is granted
    if (notificationPermission !== 'granted') return;

    // use a variable that should hold the current list of meds
    const activeMeds = typeof allMedicines !== 'undefined' ? allMedicines : [];

    activeMeds.forEach(med => {
        const times = DOSAGE_TIMES[med.frequency];
        
        if (times) {
            times.forEach((dueTime, index) => {
                // check if the current time matches the scheduled time
                if (currentTime === dueTime) {
                    // Ccheck if the corresponding checkbox is already checked
                    const doseId = `${med.id}-${index + 1}`;
                    // checkbox must be fetched from the main document
                    const checkbox = document.getElementById(`schedule-med-${doseId}`);
                    
                    // only show reminder if the dose has NOT been taken yet
                    if (checkbox && !checkbox.checked) {
                        showDoseNotification(med.name, index + 1);
                    }
                }
            });
        }
    });
}

// start checking for reminders every minute
setInterval(scheduleReminders, NOTIFICATION_INTERVAL_MS);
