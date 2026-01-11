# 💊 Medicine Tracker

A full-stack web application built to simplify **medication management and inventory tracking**. This tracker helps users stay organized by keeping all their prescriptions, over-the-counter medications, and supplements in one place.

I was inspired to create this after getting sick while traveling in India in the summer of 2025, when I was prescribed numerous unfamiliar pills, syrups, and tablets. Managing them all quickly became overwhelming, so I designed this tracker to help myself—and others in similar situations—stay organized, track doses, and avoid expired medications.

<img width="1287" height="768" alt="Screenshot 2026-01-10 at 5 22 53 PM" src="https://github.com/user-attachments/assets/4caf2e6d-f2cd-4c31-851b-f9cb3e3a17c3" />

---

## Features
- **CRUD Operations**: Add, view, update, and delete medications in a clean, interactive table.
- **Persistent Data Storage**: Flask backend with SQLite ensures data is saved even when the browser is closed.
- **Daily Medication Schedule**: Displays a filtered list of medications required on the current day.
- **Generate PDF Report**: Exports the full medication inventory as a clean, printable PDF for records or doctor visits.
- **Expiration Alerts**: Automatic highlighting of medications within one week of expiration.
- **Dynamic Search**: Real-time search filters medications by name as you type.
- **Interactive Progress Bar**: Tracks daily dose compliance; 100% completion triggers a confetti animation for positive feedback.
- **Modern UI**: Clean, minimalist design and a responsive layout for all screen sizes.

---

## Technologies Used

### Frontend
- **HTML5** – Application structure  
- **CSS3** – Styling, layout, and visual alerts  
- **JavaScript** – Client-side logic, form handling, real-time updates  

### Backend
- **Python** – Core backend language  
- **Flask** – REST API endpoints  
- **SQLite** – Lightweight database for persistence  
- **Flask-CORS** – Enables seamless frontend-backend communication  

---

## How to Run the Project

### 1. Clone the repository
git clone [your-repo-link]
cd [your-repo-folder]

### 2. Set up the backend
- **macOS/Linux**: python3 -m venv venv && source venv/bin/activate
- **Windows**: python -m venv venv && venv\Scripts\activate

- **Install the required Python packages**: pip install Flask Flask-CORS
- **Run the Flask server**: flask run

### 3. Run the frontend
Open the index.html file in your web browser. The application will automatically connect to the running Flask server.
