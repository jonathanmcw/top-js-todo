import "./styles.css";
import { compareAsc, format } from "date-fns";


class Task {

    static id = 0;

    constructor(name, description, dueDate, notes, checklist, active) {
        this.id = Task.id;
        this.name = name ? name : 'Unnamed task';
        this.description = description ? description : '';
        this.dueDate = dueDate ? format(new Date(dueDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
        this.notes = notes ? notes : '';
        this.checklist = checklist ? checklist : '';
        this.active = active ? true : false;
        Task.id++;
    }

    get info () {
        return `${this.name} ${this.description}`
    }
}

class Project {

    constructor(name, active = false) {
        this.name = name;
        this.tasks = [];
        this.active = active ? true : false;
    }
}

class App {
    
    static selectedProjectIndex = 0; 

    constructor(renderer) {
        this.projects = [];
        this.renderer = renderer;
        this.renderer.setApp(this);
        this.renderer.initializeDialogs();
        // this.renderer.initializeUpdateTaskDialog();
    }

    addProject(name, active = false) {
        const project = new Project(name, active);
        this.projects.push(project);
        this.renderer.renderProjectList(this.projects);
    }

    // missing update Project details, or rename projects

    deleteProject(selectedProjectIndex) {
        this.selectedProjectIndex = selectedProjectIndex !== undefined ? selectedProjectIndex : this.projects.findIndex((project) => project.active);

        if (this.selectedProjectIndex !== -1) {
            this.projects.splice(this.selectedProjectIndex, 1);
            this.renderer.renderProjectList(this.projects);

            if (this.selectedProjectIndex >= this.projects.length) {
                this.selectedProjectIndex = this.projects.length - 1;
            }

            if (this.selectedProjectIndex >= 0) {
                this.selectProject(this.selectedProjectIndex);
            } else {
                this.renderer.renderProjectDetails({ name: '' });
                this.renderer.renderTaskList({ tasks: [] });
            }
        }
    }

    selectProject(selectedProjectIndex) {
        this.selectedProjectIndex = selectedProjectIndex !== undefined ? selectedProjectIndex : this.projects.findIndex((project) => project.active);

        if (this.selectedProjectIndex !== -1) {
            this.projects.forEach((project, index) => {
                project.active = index === this.selectedProjectIndex;
                // console.log(project.active);
            });
        }
        // console.log(this.selectedProjectIndex);
        this.renderer.renderProjectList(this.projects);
        this.renderer.renderProjectDetails(this.projects[this.selectedProjectIndex]);
        this.renderer.renderTaskList(this.projects[this.selectedProjectIndex]);
        // debugger;
    }

    addTaskToProject(selectedProjectIndex = 0, taskName, taskDescription, dueDate, notes ) {
        const task = new Task(taskName, taskDescription, dueDate, notes);
        this.projects[selectedProjectIndex].tasks.push(task);
        this.selectProject(selectedProjectIndex);
    }

    updateTaskInProject(selectedProjectIndex, taskId, taskName, taskDescription, dueDate, notes) {
        this.selectedProjectIndex = selectedProjectIndex !== undefined ? selectedProjectIndex : this.projects.findIndex((project) => project.active);

        const taskIndex = this.projects[this.selectedProjectIndex].tasks.findIndex((task) => task.id == taskId);

        if (taskIndex !== -1) {
            const taskToUpdate = this.projects[this.selectedProjectIndex].tasks[taskIndex];
            taskToUpdate.name = taskName;
            taskToUpdate.description = taskDescription;
            taskToUpdate.dueDate = dueDate;
            taskToUpdate.notes = notes;
            console.log("index:" + taskIndex);
        } else {
            console.error(`Task with ID ${taskId} not found in project ${this.selectedProjectIndex}`);
        }
        this.selectProject(this.selectedProjectIndex);
    }

    deleteTaskFromProject(selectedProjectIndex, taskId) 
    {
        this.selectedProjectIndex = selectedProjectIndex !== undefined ? selectedProjectIndex : this.projects.findIndex((project) => project.active);

        console.log(taskId);
        const taskIndex = this.projects[this.selectedProjectIndex].tasks.findIndex((task) => task.id == taskId);

        if (taskIndex !== -1) {
            this.projects[this.selectedProjectIndex].tasks.splice(taskIndex, 1);
        } else {
            console.error(`Task with ID ${taskId} not found in project ${this.selectedProjectIndex}`);
        }
        this.selectProject(this.selectedProjectIndex);
    }
}

class Renderer {

    constructor() {
        this.app = null;
        // this.isTaskHandlerInitialized = false;
        // this.isUpdateTaskHandlerInitialized = false;
        // this.initializeTaskDialog();
    }

    setApp(app) {
        this.app = app;
    }

    renderProjectList(projects = []) {
        const projectListDOM = document.getElementById("project-list");

        while(projectListDOM.firstChild) {
            projectListDOM.removeChild(projectListDOM.firstChild);
        }

        projects.forEach(project => {
            const projectItem = this.renderProjectItem(project);
            projectListDOM.appendChild(projectItem);
            projectItem.addEventListener("click", (e) => {
                this.app.selectProject(projects.indexOf(project));
            })
        })
        
    }

    renderProjectItem(project) {
        // return `<li class="project">${project.name}</li>`;
        const projectItemDOM = document.createElement("li");
        projectItemDOM.classList.add("project");
        project.active ? projectItemDOM.classList.add("active") : null;
        projectItemDOM.textContent = project.name
        return projectItemDOM;
        // there could be only 1 selected project at one time
    }

    renderProjectDetails(project) {
        const projectDetailsDOM = document.getElementById("project-name");
        projectDetailsDOM.textContent = project.name;
    }

    renderTaskList(project) {
        
        const tasks = project? project.tasks : [];
        const taskListDOM = document.getElementById("task-list");
        
        while (taskListDOM.firstChild) {
            taskListDOM.removeChild(taskListDOM.firstChild);            
        }

        const taskDialog = document.querySelector("#task-dialog");
        const taskDialogTitle = taskDialog.querySelector("#task-dialog-title");

        const form = taskDialog.querySelector("form");
        const confirmTaskButton = taskDialog.querySelector("form button[type='submit']");

        tasks.forEach(task => {
            const taskItem = this.renderTaskItem(task);
            taskListDOM.appendChild(taskItem);

            taskItem.addEventListener("click", () => {
                taskDialogTitle.textContent = "Update Task";
                confirm.textContent = "Done";

                const deleteTaskButton = taskDialog.querySelector("#delete-task-button");
                deleteTaskButton.style.display = "block";

                taskDialog.showModal();
                document.body.classList.add("dialog-open");

                form.dataset.action = "update";
                form.dataset.taskIndex = task.id;

                console.log(form.dataset.taskIndex);
                console.log(task.id);
                form.querySelector("[name='task-name']").value = task.name;
                form.querySelector("[name='description']").value = task.description;
                form.querySelector("textarea[name='notes']").value = task.notes;
                form.querySelector("[name=due-date]").value = task.dueDate;

                confirmTaskButton.textContent = "Done";
            });
        });
    }

    renderTaskItem(task) {
        const taskItem = document.createElement("div");
        taskItem.classList.add("task-item");
        
        const taskItemDOM = `
            <h1>${task.name}</h1>
            <p class="description">${task.description}</p>
            <div class="meta">
                <p class="project">my-project</p>
                <p class="due-date">${task.dueDate}</p>
                <p class="status">${task.status}</p>
            </div>
            <div class="details">
                <p class="notes">${task.notes}</p>
                <p class="checklist">${task.id}</p>
            </div>
            `;

        taskItem.innerHTML = taskItemDOM;

        return taskItem;
    }

    // initializeProjectDialog() {
    //     const dialog = document.querySelector("#project-dialog");
    //     const openButton = document.querySelector("#new-project-button");
    //     const taskDialogTitle = dialog.querySelector("#dialog-title");
    //     const closeButton = dialog.querySelector("#close-dialog");
    //     const confirmTaskButton = dialog.querySelector("form button[type='submit']");
    //     const deleteTaskButton = dialog.querySelector("#delete-button");
    //     const form = dialog.querySelector("form");


    // }

    initializeDialogs() {
        const dialogs = document.querySelectorAll("dialog");

        const openProjectDialogButton = document.querySelector("#new-project-button");
        const openTaskDialogButton = document.querySelector("#new-task-button");

        const projectDialog = document.querySelector("#project-dialog");
        const taskDialog = document.querySelector("#task-dialog");   

        const projectDialogTitle = projectDialog.querySelector("#project-dialog-title");
        const taskDialogTitle = taskDialog.querySelector("#task-dialog-title");

        const projectForm = projectDialog.querySelector("#project-form");
        const taskForm = taskDialog.querySelector("#task-form");
        
        const defaultDueDate = document.querySelector("input[name='due-date']");

        const confirmProjectButton = projectDialog.querySelector("#confirm-project-button");
        const confirmTaskButton = taskDialog.querySelector("#confirm-task-button");

        const deleteProjectButton = document.querySelector("#delete-project-button");
        const deleteTaskButton = taskDialog.querySelector("#delete-task-button");

        defaultDueDate.valueAsDate = new Date();

        openProjectDialogButton.addEventListener("click", () => {
            projectDialogTitle.textContent = "New Project";
            projectDialog.showModal();
            document.body.classList.add("dialog-open");

            projectForm.dataset.action = "new";
            confirmProjectButton.textContent = "Add project";
        });

        openTaskDialogButton.addEventListener("click", () => {
            taskDialogTitle.textContent = "New Task";
            taskDialog.showModal();
            document.body.classList.add("dialog-open");

            taskForm.dataset.action = "new";
            confirmTaskButton.textContent = "Add Task";
            deleteTaskButton.style.display = "none";
        });

        dialogs.forEach(dialog => {
            const closeDialogButton = dialog.querySelector(".close-dialog");

            closeDialogButton.addEventListener("click", () => {
                dialog.close();
                document.body.classList.remove("dialog-open");
            });

            dialog.addEventListener("click", (event) => {
                const rect = dialog.getBoundingClientRect();
                const isInDialog = rect.top <= event.clientY && event.clientY <= rect.top + rect.height &&
                                   rect.left <= event.clientX && event.clientX <= rect.left + rect.width;
                if (!isInDialog) {
                    dialog.close();
                    document.body.classList.remove("dialog-open");
                }
            });

        })

        const projectHandler = (e) => {
            e.preventDefault();
            // const action = projectForm.dataset.action;
            const projectName = projectForm.querySelector("[name='project-name']").value;
            this.app.addProject(projectName);

            projectDialog.close();
            document.body.classList.remove("dialog-open");
        }

        const taskHandler = (e) => {
            e.preventDefault();
            const action = taskForm.dataset.action;
            const taskId = taskForm.dataset.taskIndex;     
            const taskName = taskForm.querySelector("[name='task-name']").value;
            const taskDescription = taskForm.querySelector("[name='description']").value;
            const notes = taskForm.querySelector("textarea[name='notes']").value;
            const dueDate = taskForm.querySelector("input[name=due-date]").value;
            
            // not necessarily calling addTask function directly, could be update also
            // console.log(form.dataset.action);
            switch (action) {
                case "new":
                    this.app.addTaskToProject(this.app.selectedProjectIndex, taskName, taskDescription, dueDate, notes);
                    break;
                case "update":
                    console.log(taskId);
                    this.app.updateTaskInProject(this.app.selectedProjectIndex, taskId, taskName, taskDescription, dueDate, notes);
                    break;
            }

            taskDialog.close();
            document.body.classList.remove("dialog-open");
        };

        const deleteProjectHandler = (e) => {
            e.preventDefault();
            this.app.deleteProject(this.app.selectedProjectIndex);
        }

        const deleteTaskHandler = (e) => {
            e.preventDefault();
            // const action = form.dataset.action;
            const taskId = taskForm.dataset.taskIndex;     
            this.app.deleteTaskFromProject(this.app.selectedProjectIndex, taskId);
            taskDialog.close();
            document.body.classList.remove("dialog-open");
        }

        confirmProjectButton.addEventListener("click", projectHandler);
        confirmTaskButton.addEventListener("click", taskHandler);

        deleteProjectButton.addEventListener("click", deleteProjectHandler);
        deleteTaskButton.addEventListener("click", deleteTaskHandler);

    }

}

const renderer = new Renderer();
const app = new App(renderer);

// Concept, family to do list with AI consultation
app.addProject("Default Project");
app.addProject("WS To Do");
app.addProject("CY To Do");
app.addProject("MK To Do");
app.addTaskToProject(0, "Buy groceries", "Pick up milk, eggs, and bread from the store.");
app.addTaskToProject(0, "Go for a run", "Run 5 kilometers around the neighborhood.");
app.addTaskToProject(0, "Read a book", "Finish reading the last two chapters of the novel.");
app.addTaskToProject(1, "Clean the house", "Vacuum the living room and dust the shelves.");
app.addTaskToProject(1, "Cook dinner", "Prepare spaghetti and meatballs for dinner.");
app.addTaskToProject(2, "Call a friend", "Catch up with John over the phone.");
app.addTaskToProject(2, "Plan a trip", "Research destinations and book flights for the vacation.");
app.addTaskToProject(3, "Meditate", "Spend 20 minutes meditating in a quiet space.");
app.addTaskToProject(3, "Write in journal", "Reflect on the day and write in the journal.");
app.addTaskToProject(3, "Practice guitar", "Practice playing chords and scales on the guitar.");
app.selectProject(0);
// debugger;
