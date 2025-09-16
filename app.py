from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS # import CORS from the extension

# initialize the Flask application
app = Flask(__name__)
# enable CORS for all routes and origins
CORS(app) 
# define the name of the SQLite database file
DATABASE = 'medicine.db'

# get a database connection
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    # configure the connection to return rows as dictionaries, which is more useful
    conn.row_factory = sqlite3.Row
    return conn

# create the 'medicines' table if it doesn't exist
def create_table():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            unit TEXT NOT NULL,
            exp_date TEXT NOT NULL,
            frequency TEXT NOT NULL,
            notes TEXT
        )
    ''')
    conn.commit()
    conn.close()

# initial table creation
create_table()

# API endpoint to retrieve all medicines
@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    conn = get_db_connection()
    # SQL query to select all data from the medicines table
    medicines = conn.execute('SELECT * FROM medicines').fetchall()
    conn.close()
    # convert the list of row objects to a list of dictionaries and return as JSON
    return jsonify([dict(row) for row in medicines])

# API endpoint to add a new medicine
@app.route('/api/medicines', methods=['POST'])
def add_medicine():
    # get the JSON data sent from the frontend
    data = request.get_json()
    # extract data fields from the JSON
    name = data['name']
    quantity = data['quantity']
    unit = data['unit']
    exp_date = data['expDate']
    frequency = data['frequency']
    notes = data.get('notes', '')

    try:
        conn = get_db_connection()
        # execute a SQL INSERT statement with the received data
        conn.execute('INSERT INTO medicines (name, quantity, unit, exp_date, frequency, notes) VALUES (?, ?, ?, ?, ?, ?)',
            (name, quantity, unit, exp_date, frequency, notes))
        conn.commit()
        conn.close()
        # return a success message and HTTP status code 201 (Created)
        return jsonify({'message': 'Medicine added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# API endpoint to delete a medicine by its unique ID
@app.route('/api/medicines/<int:id>', methods=['DELETE'])
def delete_medicine(id):
    try:
        conn = get_db_connection()
        # execute a SQL DELETE statement for the specified ID
        conn.execute('DELETE FROM medicines WHERE id = ?', (id,))
        conn.commit()
        conn.close()
        # return a success message and HTTP status code 200 (OK)
        return jsonify({'message': 'Medicine deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# endpoint for updating a medication
@app.route('/api/medicines/<int:id>', methods=['PUT'])
def update_medicine(id):
    data = request.get_json()
    name = data['name']
    quantity = data['quantity']
    unit = data['unit']
    exp_date = data['expDate']
    frequency = data['frequency']
    notes = data.get('notes', '')
    
    try:
        conn = get_db_connection()
        conn.execute('UPDATE medicines SET name = ?, quantity = ?, unit = ?, exp_date = ?, frequency = ?, notes = ? WHERE id = ?',
            (name, quantity, unit, exp_date, frequency, notes, id))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Medicine updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
