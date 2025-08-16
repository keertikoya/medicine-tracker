from flask import Flask, request, jsonify
import sqlite3

app = Flask(__name__)
DATABASE = 'medicine.db'

# connect to the database
def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

# create the medicine table if it doesn't exist
def create_table():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            exp_date TEXT NOT NULL,
            frequency TEXT NOT NULL
        )
    ''')
    conn.commit()
    conn.close()

# initial table creation
create_table()

@app.route('/api/medicines', methods=['GET'])
def get_medicines():
    conn = get_db_connection()
    medicines = conn.execute('SELECT * FROM medicines').fetchall()
    conn.close()
    return jsonify([dict(row) for row in medicines])

@app.route('/api/medicines', methods=['POST'])
def add_medicine():
    data = request.get_json()
    name = data['name']
    quantity = data['quantity']
    exp_date = data['expDate']
    frequency = data['frequency']

    conn = get_db_connection()
    conn.execute('INSERT INTO medicines (name, quantity, exp_date, frequency) VALUES (?, ?, ?, ?)',
                 (name, quantity, exp_date, frequency))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Medicine added successfully'}), 201

@app.route('/api/medicines/<int:id>', methods=['DELETE'])
def delete_medicine(id):
    conn = get_db_connection()
    conn.execute('DELETE FROM medicines WHERE id = ?', (id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Medicine deleted successfully'}), 200

if __name__ == '__main__':
    app.run(debug=True)