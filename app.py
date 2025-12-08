from flask import Flask, request, jsonify, render_template_string, send_from_directory, session
from db import get_connection
from functools import wraps
import os

app = Flask(__name__)
app.secret_key = "library_secret_key"

@app.route('/')
def home():
    with open('index.html', 'r', encoding='utf-8') as f:
        html = f.read()
    return render_template_string(html)

@app.route('/<path:filename>')
def serve_static(filename):
    return send_from_directory(os.getcwd(), filename)

def admin_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if session.get('role') != 'admin':
            return jsonify({"status": "Admin access required"}), 403
        return f(*args, **kwargs)
    return wrapper

def student_required(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        if session.get('role') != 'student':
            return jsonify({"status": "Student access required"}), 403
        return f(*args, **kwargs)
    return wrapper

@app.route('/signup', methods=['POST'])
def signup():
    data = request.json
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM users WHERE username=%s", (data['username'],))
    if cur.fetchone():
        con.close()
        return jsonify({"status": "User already exists"}), 400
    role = data.get('role', 'student')
    cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
                (data['username'], data['password'], role))
    con.commit()
    con.close()
    return jsonify({"status": f"Signup successful as {role}"})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM users WHERE username=%s AND password=%s", (data['username'], data['password']))
    user = cur.fetchone()
    con.close()
    if user:
        session['user_id'] = user['id']
        session['username'] = user['username']
        session['role'] = user['role']
        return jsonify({"status": f"Login successful as {user['role']}"})
    return jsonify({"status": "Invalid credentials"}), 401

@app.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"status": "Logged out"})

@app.route('/books', methods=['GET'])
def get_books():
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM books")
    data = cur.fetchall()
    con.close()
    return jsonify(data)

@app.route('/books', methods=['POST'])
@admin_required
def add_book():
    data = request.json
    con = get_connection()
    cur = con.cursor()
    cur.execute("INSERT INTO books (title, author, copies, available) VALUES (%s, %s, %s, %s)",
                (data['title'], data['author'], data['copies'], data['copies']))
    con.commit()
    con.close()
    return jsonify({"status": "Book added successfully"})

@app.route('/books/<int:book_id>', methods=['PUT'])
@admin_required
def update_book(book_id):
    data = request.json
    con = get_connection()
    cur = con.cursor()
    cur.execute("UPDATE books SET title=%s, author=%s, copies=%s WHERE id=%s",
                (data['title'], data['author'], data['copies'], book_id))
    con.commit()
    con.close()
    return jsonify({"status": "Book updated successfully"})

@app.route('/books/<int:book_id>', methods=['DELETE'])
@admin_required
def delete_book(book_id):
    con = get_connection()
    cur = con.cursor()
    cur.execute("DELETE FROM books WHERE id=%s", (book_id,))
    con.commit()
    con.close()
    return jsonify({"status": "Book deleted successfully"})

@app.route('/books/search', methods=['GET'])
def search_books():
    query = request.args.get('q', '')
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM books WHERE title LIKE %s OR author LIKE %s",
                (f"%{query}%", f"%{query}%"))
    data = cur.fetchall()
    con.close()
    return jsonify(data)

@app.route('/issue', methods=['POST'])
@student_required
def issue_book():
    data = request.json
    user_id = session.get('user_id')
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT * FROM books WHERE id=%s", (data['book_id'],))
    book = cur.fetchone()
    if not book or book['available'] <= 0:
        con.close()
        return jsonify({"status": "Book not available"})
    cur.execute("INSERT INTO issue_records (user_id, book_id, status) VALUES (%s, %s, 'issued')",
                (user_id, data['book_id']))
    cur.execute("UPDATE books SET available = available - 1 WHERE id=%s", (data['book_id'],))
    con.commit()
    con.close()
    return jsonify({"status": "Book issued successfully"})

@app.route('/return', methods=['POST'])
@student_required
def return_book():
    data = request.json
    issue_id = data.get('issue_id')
    user_id = session.get('user_id')

    if not issue_id:
        return jsonify({"status": "Issue record ID required"}), 400

    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT book_id, status FROM issue_records WHERE id=%s AND user_id=%s", (issue_id, user_id))
    record = cur.fetchone()
    if not record:
        con.close()
        return jsonify({"status": "Issue record not found"}), 404
    if record['status'] == 'returned':
        con.close()
        return jsonify({"status": "Book already returned"}), 400

    cur.execute("UPDATE issue_records SET status='returned', return_date=CURRENT_DATE WHERE id=%s", (issue_id,))
    cur.execute("UPDATE books SET available = available + 1 WHERE id=%s", (record['book_id'],))
    con.commit()
    con.close()
    return jsonify({"status": "Book returned successfully"})

@app.route('/student/issued', methods=['GET'])
@student_required
def student_issued_books():
    user_id = session.get('user_id')
    con = get_connection()
    cur = con.cursor()
    cur.execute("""
        SELECT ir.id AS issue_id, b.id AS book_id, b.title, b.author,
               ir.status, ir.issue_date, ir.return_date
        FROM issue_records ir
        JOIN books b ON ir.book_id = b.id
        WHERE ir.user_id=%s
    """, (user_id,))
    data = cur.fetchall()
    con.close()
    return jsonify(data)

@app.route('/students', methods=['GET'])
@admin_required
def get_students():
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT id, username, role FROM users WHERE role='student'")
    data = cur.fetchall()
    con.close()
    return jsonify(data)

@app.route('/addStudent', methods=['POST'])
@admin_required
def add_student():
    data = request.json
    con = get_connection()
    cur = con.cursor()
    cur.execute("INSERT INTO users (username, password, role) VALUES (%s, %s, 'student')",
                (data['username'], data['password']))
    con.commit()
    con.close()
    return jsonify({"status": "Student added successfully"})

@app.route('/requestBook', methods=['POST'])
@student_required
def request_book():
    data = request.json
    user_id = session.get('user_id')
    con = get_connection()
    cur = con.cursor()
    cur.execute("INSERT INTO book_requests (user_id, book_id, status) VALUES (%s, %s, 'pending')",
                (user_id, data['book_id']))
    con.commit()
    con.close()
    return jsonify({"status": "Book requested successfully"})

@app.route('/bookRequests', methods=['GET'])
@admin_required
def get_book_requests():
    con = get_connection()
    cur = con.cursor()
    cur.execute("""
        SELECT br.id, u.username as student, b.title as book, br.status
        FROM book_requests br
        JOIN users u ON u.id = br.user_id
        JOIN books b ON b.id = br.book_id
    """)
    data = cur.fetchall()
    con.close()
    return jsonify(data)

@app.route('/approveRequest/<int:request_id>', methods=['POST'])
@admin_required
def approve_request(request_id):
    con = get_connection()
    cur = con.cursor()
    cur.execute("SELECT book_id, user_id FROM book_requests WHERE id=%s AND status='pending'", (request_id,))
    req = cur.fetchone()
    if not req:
        con.close()
        return jsonify({"status": "Request not found or already processed"}), 404
    cur.execute("UPDATE book_requests SET status='approved' WHERE id=%s", (request_id,))
    cur.execute("INSERT INTO issue_records (user_id, book_id, status) VALUES (%s, %s, 'issued')",
                (req['user_id'], req['book_id']))
    cur.execute("UPDATE books SET available = available - 1 WHERE id=%s", (req['book_id'],))
    con.commit()
    con.close()
    return jsonify({"status": "Request approved and book issued"})

@app.route('/issueReport', methods=['GET'])
@admin_required
def issue_report():
    con = get_connection()
    cur = con.cursor()
    cur.execute("""
        SELECT ir.id, u.username as student, b.title as book, ir.issue_date, ir.return_date, ir.status
        FROM issue_records ir
        JOIN users u ON u.id = ir.user_id
        JOIN books b ON b.id = ir.book_id
    """)
    data = cur.fetchall()
    con.close()
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
