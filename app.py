from flask import Flask, render_template, request, redirect, url_for, jsonify
import os
import json
from datetime import datetime

app = Flask(__name__)

# Data storage - in a real app, you'd use a database
TASKS_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tasks.json')

def load_tasks():
    try:
        if os.path.exists(TASKS_FILE):
            with open(TASKS_FILE, 'r') as f:
                return json.load(f)
        return []
    except Exception as e:
        print(f"Error loading tasks: {e}")
        return []

def save_tasks(tasks):
    try:
        with open(TASKS_FILE, 'w') as f:
            json.dump(tasks, f, indent=2)
    except Exception as e:
        print(f"Error saving tasks: {e}")

# Initialize with sample tasks if the file doesn't exist
if not os.path.exists(TASKS_FILE):
    initial_tasks = [
        {
            'id': 1,
            'content': 'Welcome to Task Manager! Add your tasks here.',
            'completed': False,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'priority': 'medium',
            'category': 'General'
        },
        {
            'id': 2,
            'content': 'Try marking a task as complete',
            'completed': False,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'priority': 'high',
            'category': 'Tutorial'
        },
        {
            'id': 3,
            'content': 'Delete a task you no longer need',
            'completed': False,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'priority': 'low',
            'category': 'Tutorial'
        }
    ]
    save_tasks(initial_tasks)

@app.route('/')
def index():
    tasks = load_tasks()
    categories = sorted(list(set(task.get('category', 'Uncategorized') for task in tasks)))
    return render_template('index.html', tasks=tasks, now=datetime.now(), categories=categories)

@app.route('/add_task', methods=['POST'])
def add_task():
    tasks = load_tasks()
    task_content = request.form.get('task_content')
    priority = request.form.get('priority', 'medium')
    category = request.form.get('category', 'General')
    
    if task_content:
        new_task = {
            'id': max([task.get('id', 0) for task in tasks], default=0) + 1,
            'content': task_content,
            'completed': False,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
            'priority': priority,
            'category': category
        }
        tasks.append(new_task)
        save_tasks(tasks)
    
    return redirect(url_for('index'))

@app.route('/toggle_task/<int:task_id>', methods=['POST'])
def toggle_task(task_id):
    tasks = load_tasks()
    
    for task in tasks:
        if task['id'] == task_id:
            task['completed'] = not task['completed']
            break
    
    save_tasks(tasks)
    return jsonify({'success': True})

@app.route('/delete_task/<int:task_id>', methods=['POST'])
def delete_task(task_id):
    tasks = load_tasks()
    tasks = [task for task in tasks if task['id'] != task_id]
    save_tasks(tasks)
    return jsonify({'success': True})

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    filter_type = request.args.get('filter', 'all')
    category = request.args.get('category', 'all')
    tasks = load_tasks()
    
    if filter_type == 'active':
        tasks = [task for task in tasks if not task['completed']]
    elif filter_type == 'completed':
        tasks = [task for task in tasks if task['completed']]
    
    if category != 'all':
        tasks = [task for task in tasks if task.get('category') == category]
    
    return jsonify(tasks)

@app.route('/update_task_priority/<int:task_id>', methods=['POST'])
def update_task_priority(task_id):
    priority = request.form.get('priority')
    tasks = load_tasks()
    
    for task in tasks:
        if task['id'] == task_id:
            task['priority'] = priority
            break
    
    save_tasks(tasks)
    return jsonify({'success': True})

@app.route('/update_task_category/<int:task_id>', methods=['POST'])
def update_task_category(task_id):
    category = request.form.get('category')
    tasks = load_tasks()
    
    for task in tasks:
        if task['id'] == task_id:
            task['category'] = category
            break
    
    save_tasks(tasks)
    return jsonify({'success': True})

if __name__ == '__main__':
    app.run(debug=True)