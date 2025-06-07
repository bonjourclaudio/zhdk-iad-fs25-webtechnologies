class Status {
    static PENDING = "Pending";
    static IN_PROGRESS = "In Progress";
    static COMPLETED = "Completed";
}

class Task {
    title;
    description;
    dueDate;
    status;

    constructor(title, description, dueDate, status) {
        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.status = status;
    }
}

var tasks;

function retrieveTasks() {
    tasks = JSON.parse(localStorage.getItem("tasks")) || [];
}   

function addTask() {
    const title = document.getElementById("taskTitle").value;
    const description = document.getElementById("taskDescription").value;
    const dueDate = document.getElementById("taskDueDate").value;

    if (title && description && dueDate) {
        const newTask = new Task(title, description, dueDate, Status.PENDING);
        tasks.push(newTask);
        localStorage.setItem("tasks", JSON.stringify(tasks));
        updateTaskList();
        document.getElementById("taskForm").reset();
    } else {
        alert("Please fill in all fields.");
    }
}

function updateTaskList() {
    const taskList = document.getElementById("taskList");
    taskList.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.textContent = `${task.title} - ${task.status}`;
        li.addEventListener("click", () => {
            tasks[index].status = tasks[index].status === Status.COMPLETED ? Status.PENDING : Status.COMPLETED;
            updateTaskList();
            localStorage.setItem("tasks", JSON.stringify(tasks));
        });
        taskList.appendChild(li);
    });
}