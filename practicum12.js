
// =====================================
// 1. KNOWLEDGE BASE READ MORE BUTTONS
// =====================================

const readButtons = document.querySelectorAll(".read-btn");

readButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const content = button.nextElementSibling;

        content.classList.toggle("show");

        if (content.classList.contains("show")) {
            button.textContent = "Read Less";
        } else {
            button.textContent = "Read More";
        }

    });

});


// =====================================
// 2. SHOW AND HIDE IT INFORMATION CARD
// =====================================

const infoButton = document.getElementById("infoButton");
const infoCard = document.getElementById("infoCard");

infoButton.addEventListener("click", function() {

    infoCard.classList.toggle("show");

    if (infoCard.classList.contains("show")) {
        infoButton.textContent = "Hide IT Information";
    } else {
        infoButton.textContent = "Show IT Information";
    }

});


// =====================================================================
// 3. TICKET FORM VALIDATION
//    Input constraints, custom error messages and success message
// =====================================================================

const ticketForm = document.getElementById("ticketForm");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notificationMessage");

let notificationTimer = null;
let isSubmitting = false;

// ----- Form controls -----
const requestDate = document.getElementById("date");
const description = document.getElementById("description");
const descriptionCounter = document.getElementById("description-counter");
const assetTag = document.getElementById("asset-tag");
const attachment = document.getElementById("attachment");
const confirmBox = document.getElementById("confirm");

const priorityRadios = ticketForm.querySelectorAll('input[name="priority"]');
const issueBoxes = ticketForm.querySelectorAll('input[name="issue"]');

// Every single-value control (text, email, number, tel, date, select, textarea, file)
const singleFields = Array.from(
    ticketForm.querySelectorAll(
        "input:not([type='radio']):not([type='checkbox']), select, textarea"
    )
);
singleFields.push(confirmBox);

// ----- Date limits: today and up to 30 days back -----
function toDateString(dateObject) {
    const year = dateObject.getFullYear();
    const month = String(dateObject.getMonth() + 1).padStart(2, "0");
    const day = String(dateObject.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
}

const todayDate = new Date();
const earliestDate = new Date();
earliestDate.setDate(todayDate.getDate() - 30);

requestDate.setAttribute("max", toDateString(todayDate));
requestDate.setAttribute("min", toDateString(earliestDate));

// ----- Error messages for each field and each kind of problem -----
const ERROR_MESSAGES = {
    "name": {
        valueMissing: "Enter your full name.",
        tooShort: "Name must be at least 3 characters long.",
        patternMismatch: "Use letters, spaces, dots, apostrophes or hyphens only."
    },
    "email": {
        valueMissing: "Enter your work email address.",
        typeMismatch: "Enter a valid email address, e.g. name@company.com.",
        patternMismatch: "Enter a valid email address, e.g. name@company.com."
    },
    "employee-id": {
        valueMissing: "Enter your employee ID.",
        badInput: "Employee ID must contain numbers only.",
        rangeUnderflow: "Employee ID must be 1000 or higher.",
        rangeOverflow: "Employee ID cannot be higher than 99999."
    },
    "phone": {
        valueMissing: "Enter a contact phone number.",
        patternMismatch: "Phone number must be exactly 10 digits (numbers only)."
    },
    "date": {
        valueMissing: "Select the request date.",
        badInput: "Enter a valid date.",
        rangeUnderflow: "Request date cannot be older than 30 days.",
        rangeOverflow: "Request date cannot be in the future."
    },
    "department": {
        valueMissing: "Select your department."
    },
    "summary": {
        valueMissing: "Enter a short summary of the issue.",
        tooShort: "Summary must be at least 5 characters long."
    },
    "asset-tag": {
        patternMismatch: "Asset tag format must be APX- followed by 5 digits (e.g. APX-12345)."
    },
    "affected-users": {
        valueMissing: "Enter how many users are affected.",
        badInput: "Enter a whole number.",
        rangeUnderflow: "At least 1 user must be affected.",
        rangeOverflow: "Affected users cannot be more than 500."
    },
    "description": {
        valueMissing: "Describe your technical problem.",
        tooShort: "Description must be at least 20 characters long.",
        tooLong: "Description cannot be longer than 500 characters."
    },
    "confirm": {
        valueMissing: "Tick the box to confirm your details are accurate."
    }
};

const VALIDITY_ORDER = [
    "valueMissing", "typeMismatch", "badInput", "tooShort",
    "tooLong", "patternMismatch", "rangeUnderflow", "rangeOverflow"
];

// Response promise shown in the success message
const SLA_TEXT = {
    "P1 Critical": "A technician will respond within 15 minutes.",
    "P2 High": "A technician will respond within 1 hour.",
    "P3 Medium": "A technician will respond within 4 hours.",
    "P4 Low": "A technician will respond within 12 hours."
};

// ----- Show / clear an error message under a field -----
function showError(errorId, message, field) {

    const errorElement = document.getElementById(errorId + "-error");

    if (errorElement) {
        errorElement.textContent = message;
    }

    if (field) {
        if (message) {
            field.setAttribute("aria-invalid", "true");
        } else {
            field.removeAttribute("aria-invalid");
        }
    }
}

// ----- Pick the right message for the problem the browser found -----
function getErrorMessage(field) {

    const messages = ERROR_MESSAGES[field.id] || {};
    const validity = field.validity;

    for (let i = 0; i < VALIDITY_ORDER.length; i++) {
        const problem = VALIDITY_ORDER[i];
        if (validity[problem]) {
            return messages[problem] || field.validationMessage;
        }
    }

    return field.validationMessage;
}

// ----- Extra rule: file type and size -----
function checkFile(field) {

    if (field.files.length === 0) {
        return "";   // optional field
    }

    const file = field.files[0];
    const allowedType = /\.(jpg|jpeg|png|pdf|doc|docx)$/i;
    const maxSize = 2 * 1024 * 1024;   // 2 MB

    if (!allowedType.test(file.name)) {
        return "Only JPG, PNG, PDF, DOC or DOCX files are allowed.";
    }

    if (file.size > maxSize) {
        return "File is too large. The maximum size is 2 MB.";
    }

    return "";
}

// ----- Validate one control -----
function validateField(field) {

    // Clear the old custom message so the browser re-checks the real rules
    field.setCustomValidity("");

    let message = "";

    if (field.type === "file") {
        message = checkFile(field);
    }

    if (message === "" && !field.validity.valid) {
        message = getErrorMessage(field);
    }

    // Our own text is also what reportValidity() will show
    field.setCustomValidity(message);
    showError(field.id, message, field);

    return message === "";
}

// ----- Validate the priority radio group -----
function validatePriority() {

    const chosen = ticketForm.querySelector('input[name="priority"]:checked');
    const message = chosen ? "" : "Select a priority level for this issue.";

    priorityRadios[0].setCustomValidity(message);
    showError("priority", message);

    return message === "";
}

// ----- Validate the issue type checkbox group -----
function validateIssues() {

    const chosen = ticketForm.querySelector('input[name="issue"]:checked');
    const message = chosen ? "" : "Select at least one type of technical issue.";

    issueBoxes[0].setCustomValidity(message);
    showError("issue", message);

    return message === "";
}

// ----- Mark a field so it can show red / green styling -----
function markTouched(field) {

    if (!field.required && field.value === "") {
        field.classList.remove("touched");   // empty optional field stays neutral
    } else {
        field.classList.add("touched");
    }
}

// ----- Validate everything and return how many problems were found -----
function validateAll() {

    let problems = 0;

    singleFields.forEach(function(field) {
        markTouched(field);
        if (!validateField(field)) {
            problems++;
        }
    });

    if (!validatePriority()) { problems++; }
    if (!validateIssues())   { problems++; }

    return problems;
}

// ----- Show a success or error message under the form -----
function showNotification(message, type, duration) {

    notificationMessage.textContent = message;

    notification.classList.remove("success", "error");
    notification.classList.add("show", type);

    clearTimeout(notificationTimer);

    notificationTimer = setTimeout(function() {
        notification.classList.remove("show");
    }, duration);

    if (type === "success") {
        notification.scrollIntoView({ behavior: "smooth", block: "center" });
    }
}

// ----- Remove all red / green styling and error text -----
function clearValidationState() {

    singleFields.forEach(function(field) {
        field.classList.remove("touched");
        field.setCustomValidity("");
        field.removeAttribute("aria-invalid");
    });

    priorityRadios[0].setCustomValidity("");
    issueBoxes[0].setCustomValidity("");

    document.querySelectorAll(".error-message").forEach(function(element) {
        element.textContent = "";
    });

    // The reset event fires before the values are cleared, so wait one tick
    setTimeout(function() {
        descriptionCounter.textContent = "0 / " + description.maxLength;
    }, 0);
}

// ----- Live validation while the user fills in the form -----
singleFields.forEach(function(field) {

    // Validate when the user leaves the field
    field.addEventListener("blur", function() {
        markTouched(field);
        validateField(field);
    });

    // Re-check while typing, but only after the field has been touched
    field.addEventListener("input", function() {
        if (field.classList.contains("touched")) {
            validateField(field);
        }
    });

    // Selects, dates, files and checkboxes report on change
    field.addEventListener("change", function() {
        markTouched(field);
        validateField(field);
    });
});

priorityRadios.forEach(function(radio) {
    radio.addEventListener("change", validatePriority);
});

issueBoxes.forEach(function(box) {
    box.addEventListener("change", validateIssues);
});

// Character counter for the description box
description.addEventListener("input", function() {
    descriptionCounter.textContent =
        description.value.length + " / " + description.maxLength;
});

// Asset tags are always capital letters
assetTag.addEventListener("input", function() {
    assetTag.value = assetTag.value.toUpperCase();
});

// ----- Submit -----
ticketForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const problems = validateAll();

    if (problems > 0 || !ticketForm.checkValidity()) {

        showNotification(
            "Please fix the " + problems + " highlighted field(s) and submit again.",
            "error",
            6000
        );

        const firstInvalid = ticketForm.querySelector(
            "input:invalid, select:invalid, textarea:invalid"
        );

        if (firstInvalid) {
            firstInvalid.focus();
            firstInvalid.reportValidity();
        }

        return;
    }

    // ----- Everything is valid: show the success message -----
    const ticketNumber =
        "TKT-" + new Date().getFullYear() + "-" +
        Math.floor(1000 + Math.random() * 9000);

    const priority = ticketForm.querySelector('input[name="priority"]:checked').value;
    const employeeName = document.getElementById("name").value.trim();

    showNotification(
        "Success! Ticket " + ticketNumber + " has been submitted for " +
        employeeName + ". " + SLA_TEXT[priority],
        "success",
        10000
    );

    // Stop the reset event from replacing the success message
    isSubmitting = true;
    ticketForm.reset();
    isSubmitting = false;
});


// =====================================
// 4. RESET FORM
// =====================================

ticketForm.addEventListener("reset", function() {

    clearValidationState();

    if (!isSubmitting) {
        showNotification("The ticket form has been reset.", "success", 3000);
    }

});


// =====================================
// 5. NAVIGATION CLICK EFFECT
// =====================================

const navigationLinks = document.querySelectorAll(".nav-menu a");

navigationLinks.forEach(function(link) {

    link.addEventListener("click", function() {

        navigationLinks.forEach(function(item) {
            item.classList.remove("active");
        });

        link.classList.add("active");

    });

});


// =====================================
// 6. SERVICE CARD INTERACTION
// =====================================

const serviceCards = document.querySelectorAll(".service-card");

serviceCards.forEach(function(card) {

    card.addEventListener("click", function() {

        card.classList.toggle("selected");

    });

});


// =====================================================================
// 7. LIVE INCIDENT & ASSET TRACKER
//    Dynamic DOM manipulation: ADD, MODIFY, DISPLAY and REMOVE
//    industry-specific (IT helpdesk) information without reloading.
// =====================================================================

// ---------- Data (kept in memory) ----------
let trackerItems = [
    {
        id: 1,
        title: "VPN disconnects every 30 minutes",
        category: "Network",
        priority: "P2",
        owner: "Anita R.",
        status: "Open"
    },
    {
        id: 2,
        title: "Dell Latitude 5420 - screen flicker",
        category: "Hardware",
        priority: "P3",
        owner: "Karthik S.",
        status: "Open"
    },
    {
        id: 3,
        title: "MFA reset for Finance team lead",
        category: "Access Control",
        priority: "P4",
        owner: "Meena V.",
        status: "Resolved"
    }
];

let nextItemId = 4;
let editingId = null;   // id of the item currently in edit mode

const PRIORITY_LABELS = {
    P1: "P1 - Critical",
    P2: "P2 - High",
    P3: "P3 - Medium",
    P4: "P4 - Low"
};

// ---------- Element references ----------
const trackerForm        = document.getElementById("trackerForm");
const trackerTitle       = document.getElementById("trackerTitle");
const trackerCategory    = document.getElementById("trackerCategory");
const trackerPriority    = document.getElementById("trackerPriority");
const trackerOwner       = document.getElementById("trackerOwner");
const trackerError       = document.getElementById("trackerError");
const trackerSearch      = document.getElementById("trackerSearch");
const trackerFilter      = document.getElementById("trackerFilter");
const trackerCount       = document.getElementById("trackerCount");
const trackerList        = document.getElementById("trackerList");
const trackerEmpty       = document.getElementById("trackerEmpty");
const clearResolvedBtn   = document.getElementById("clearResolvedBtn");


// ---------- Helper: floating toast message ----------
function showToast(message, type) {

    const toast = document.createElement("div");
    toast.className = "toast toast-" + (type || "info");
    toast.textContent = message;
    toast.setAttribute("role", "status");

    document.body.appendChild(toast);

    setTimeout(function() {
        toast.remove();
    }, 3000);
}


// ---------- Helper: build a small badge span ----------
function createBadge(text, extraClass) {

    const badge = document.createElement("span");
    badge.className = "badge" + (extraClass ? " " + extraClass : "");
    badge.textContent = text;

    return badge;
}


// ---------- Helper: build a button ----------
function createButton(text, className, label) {

    const button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.textContent = text;
    button.setAttribute("aria-label", label);

    return button;
}


// ---------- Helper: build a <select> with options ----------
function createSelect(options, selectedValue, label) {

    const select = document.createElement("select");
    select.setAttribute("aria-label", label);

    options.forEach(function(opt) {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.text;
        if (opt.value === selectedValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });

    return select;
}


// ---------- DISPLAY: build the normal (read-only) list item ----------
function buildDisplayItem(item, li) {

    const main = document.createElement("div");
    main.className = "item-main";

    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = item.title;

    const meta = document.createElement("div");
    meta.className = "item-meta";
    meta.appendChild(createBadge(PRIORITY_LABELS[item.priority]));
    meta.appendChild(createBadge(item.category));
    meta.appendChild(createBadge("Tech: " + (item.owner || "Unassigned")));
    meta.appendChild(createBadge(item.status, "status-" + item.status.toLowerCase()));

    main.appendChild(title);
    main.appendChild(meta);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const resolveText = item.status === "Open" ? "Mark Resolved" : "Reopen";
    const resolveBtn = createButton(resolveText, "btn-resolve", resolveText + ": " + item.title);
    const editBtn    = createButton("Edit", "btn-edit", "Edit: " + item.title);
    const deleteBtn  = createButton("Delete", "btn-delete", "Delete: " + item.title);

    resolveBtn.addEventListener("click", function() {
        toggleStatus(item.id);
    });

    editBtn.addEventListener("click", function() {
        editingId = item.id;
        renderTracker();
    });

    deleteBtn.addEventListener("click", function() {
        removeItem(item.id, li);
    });

    actions.appendChild(resolveBtn);
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(main);
    li.appendChild(actions);
}


// ---------- MODIFY: build the inline edit form for one item ----------
function buildEditItem(item, li) {

    const fields = document.createElement("div");
    fields.className = "edit-fields";

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = item.title;
    titleInput.maxLength = 80;
    titleInput.setAttribute("aria-label", "Incident title");

    const categorySelect = createSelect([
        { value: "Hardware",       text: "Hardware" },
        { value: "Software",       text: "Software" },
        { value: "Network",        text: "Network" },
        { value: "Access Control", text: "Access Control" }
    ], item.category, "Category");

    const prioritySelect = createSelect([
        { value: "P1", text: "P1 - Critical" },
        { value: "P2", text: "P2 - High" },
        { value: "P3", text: "P3 - Medium" },
        { value: "P4", text: "P4 - Low" }
    ], item.priority, "Priority");

    const ownerInput = document.createElement("input");
    ownerInput.type = "text";
    ownerInput.value = item.owner;
    ownerInput.maxLength = 40;
    ownerInput.setAttribute("aria-label", "Assigned technician");

    fields.appendChild(titleInput);
    fields.appendChild(categorySelect);
    fields.appendChild(prioritySelect);
    fields.appendChild(ownerInput);

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const saveBtn   = createButton("Save", "btn-save", "Save changes");
    const cancelBtn = createButton("Cancel", "btn-cancel", "Cancel editing");

    saveBtn.addEventListener("click", function() {

        const newTitle = titleInput.value.trim();

        if (newTitle.length < 3) {
            titleInput.setAttribute("aria-invalid", "true");
            titleInput.focus();
            showToast("Title must be at least 3 characters.", "danger");
            return;
        }

        item.title    = newTitle;
        item.category = categorySelect.value;
        item.priority = prioritySelect.value;
        item.owner    = ownerInput.value.trim();

        editingId = null;
        renderTracker();
        showToast("Incident updated.", "success");
    });

    cancelBtn.addEventListener("click", function() {
        editingId = null;
        renderTracker();
    });

    actions.appendChild(saveBtn);
    actions.appendChild(cancelBtn);

    li.appendChild(fields);
    li.appendChild(actions);

    // Put the cursor in the title box straight away
    setTimeout(function() {
        titleInput.focus();
    }, 0);
}


// ---------- DISPLAY: re-draw the whole list ----------
function renderTracker(newItemId) {

    const searchText   = trackerSearch.value.trim().toLowerCase();
    const statusFilter = trackerFilter.value;

    // Clear the old list
    trackerList.innerHTML = "";

    const visibleItems = trackerItems.filter(function(item) {

        const matchesStatus = statusFilter === "All" || item.status === statusFilter;

        const searchable = (item.title + " " + item.category + " " + item.owner).toLowerCase();
        const matchesSearch = searchable.includes(searchText);

        return matchesStatus && matchesSearch;
    });

    visibleItems.forEach(function(item) {

        const li = document.createElement("li");
        li.className = "tracker-item prio-" + item.priority;
        li.setAttribute("data-id", item.id);

        if (item.status === "Resolved") {
            li.classList.add("is-resolved");
        }

        if (item.id === editingId) {
            buildEditItem(item, li);
        } else {
            buildDisplayItem(item, li);
        }

        // Entry animation for a newly added item
        if (item.id === newItemId) {
            li.classList.add("enter");
            trackerList.appendChild(li);
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    li.classList.remove("enter");
                });
            });
        } else {
            trackerList.appendChild(li);
        }
    });

    // Empty-state message
    if (visibleItems.length === 0) {
        trackerEmpty.textContent = trackerItems.length === 0
            ? "The tracker is empty. Add your first incident above."
            : "No incidents match your search or filter.";
        trackerEmpty.classList.add("show");
    } else {
        trackerEmpty.classList.remove("show");
    }

    updateCounter();
}


// ---------- DISPLAY: summary counter ----------
function updateCounter() {

    const openCount = trackerItems.filter(function(item) {
        return item.status === "Open";
    }).length;

    const resolvedCount = trackerItems.length - openCount;

    trackerCount.textContent =
        openCount + " open / " + resolvedCount + " resolved";
}


// ---------- ADD: create a new incident ----------
trackerForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = trackerTitle.value.trim();

    if (title.length < 3) {
        trackerError.textContent =
            "Enter an incident or asset name of at least 3 characters.";
        trackerTitle.setAttribute("aria-invalid", "true");
        trackerTitle.focus();
        return;
    }

    trackerError.textContent = "";
    trackerTitle.removeAttribute("aria-invalid");

    const newItem = {
        id: nextItemId++,
        title: title,
        category: trackerCategory.value,
        priority: trackerPriority.value,
        owner: trackerOwner.value.trim(),
        status: "Open"
    };

    trackerItems.unshift(newItem);   // newest on top

    // Make sure the new item is visible even if a filter is active
    trackerSearch.value = "";
    trackerFilter.value = "All";

    renderTracker(newItem.id);
    showToast("Incident added to the tracker.", "success");

    trackerForm.reset();
    trackerTitle.focus();
});


// ---------- MODIFY: toggle Open / Resolved ----------
function toggleStatus(id) {

    const item = trackerItems.find(function(entry) {
        return entry.id === id;
    });

    if (!item) { return; }

    item.status = item.status === "Open" ? "Resolved" : "Open";

    renderTracker();
    showToast(
        item.status === "Resolved" ? "Marked as resolved." : "Incident reopened.",
        "info"
    );
}


// ---------- REMOVE: delete one incident ----------
function removeItem(id, li) {

    // Play the exit animation, then remove from the DOM
    li.classList.add("leaving");

    setTimeout(function() {
        trackerItems = trackerItems.filter(function(entry) {
            return entry.id !== id;
        });

        li.remove();

        // Refresh counter and empty state without rebuilding everything
        if (trackerList.querySelector(".tracker-item") === null) {
            renderTracker();
        } else {
            updateCounter();
        }

        showToast("Incident removed.", "danger");
    }, 350);
}


// ---------- REMOVE: clear every resolved incident ----------
clearResolvedBtn.addEventListener("click", function() {

    const resolvedBefore = trackerItems.filter(function(item) {
        return item.status === "Resolved";
    }).length;

    if (resolvedBefore === 0) {
        showToast("There are no resolved incidents to clear.", "info");
        return;
    }

    trackerItems = trackerItems.filter(function(item) {
        return item.status !== "Resolved";
    });

    renderTracker();
    showToast(resolvedBefore + " resolved incident(s) cleared.", "danger");
});


// ---------- DISPLAY: live search and filter ----------
trackerSearch.addEventListener("input", function() {
    renderTracker();
});

trackerFilter.addEventListener("change", function() {
    renderTracker();
});

// Clear the validation message while the user types
trackerTitle.addEventListener("input", function() {
    if (trackerTitle.value.trim().length >= 3) {
        trackerError.textContent = "";
        trackerTitle.removeAttribute("aria-invalid");
    }
});


// ---------- First draw when the page loads ----------
renderTracker();


// =====================================================================
// 8. API-INTEGRATED TICKET QUEUE
//    Retrieves JSON from an endpoint with fetch(), shows a loading
//    indicator, handles errors and builds the table dynamically.
// =====================================================================

// ---------- Endpoints ----------
const API_BASE = "https://jsonplaceholder.typicode.com";
const TICKETS_URL = API_BASE + "/todos?_limit=20";   // used as helpdesk tickets
const TECHNICIANS_URL = API_BASE + "/users";         // used as support technicians
const REQUEST_TIMEOUT = 10000;                       // 10 seconds

// ---------- Element references ----------
const loadTicketsBtn  = document.getElementById("loadTicketsBtn");
const testErrorBtn    = document.getElementById("testErrorBtn");
const retryBtn        = document.getElementById("retryBtn");
const apiStatusFilter = document.getElementById("apiStatusFilter");
const apiUpdated      = document.getElementById("apiUpdated");
const apiLoading      = document.getElementById("apiLoading");
const apiError        = document.getElementById("apiError");
const apiErrorMessage = document.getElementById("apiErrorMessage");
const apiStats        = document.getElementById("apiStats");
const apiTableWrapper = document.getElementById("apiTableWrapper");
const apiTableBody    = document.getElementById("apiTableBody");
const apiEmpty        = document.getElementById("apiEmpty");

let apiTickets = [];   // the data received from the API (after mapping)


// ---------- Helper: fetch JSON with timeout and status check ----------
async function fetchJson(url) {

    const controller = new AbortController();
    const timer = setTimeout(function() {
        controller.abort();
    }, REQUEST_TIMEOUT);

    try {
        const response = await fetch(url, { signal: controller.signal });

        // fetch() only rejects on network failure, so check the HTTP status ourselves
        if (!response.ok) {
            throw new Error("The server responded with error " + response.status + ".");
        }

        return await response.json();

    } catch (error) {

        if (error.name === "AbortError") {
            throw new Error("The request timed out after 10 seconds. Please try again.");
        }

        if (error instanceof TypeError) {
            throw new Error("Could not reach the server. Check your internet connection.");
        }

        throw error;

    } finally {
        clearTimeout(timer);
    }
}


// ---------- Helper: turn the raw API records into helpdesk tickets ----------
function mapTickets(todos, users) {

    const priorityByIndex = ["P1", "P2", "P3", "P4"];

    return todos.map(function(todo) {

        const technician = users.find(function(user) {
            return user.id === todo.userId;
        });

        const title = String(todo.title);

        return {
            id: todo.id,
            reference: "TKT-" + String(todo.id).padStart(4, "0"),
            issue: title.charAt(0).toUpperCase() + title.slice(1),
            technician: technician ? technician.name : "Unassigned",
            site: technician && technician.address ? technician.address.city : "-",
            priority: priorityByIndex[todo.id % 4],
            status: todo.completed ? "Resolved" : "Open"
        };
    });
}


// ---------- UI state helpers ----------
function setLoading(isLoading) {

    apiLoading.classList.toggle("show", isLoading);

    loadTicketsBtn.disabled = isLoading;
    testErrorBtn.disabled = isLoading;
    retryBtn.disabled = isLoading;
    apiStatusFilter.disabled = isLoading;

    loadTicketsBtn.textContent = isLoading ? "Loading..." : "Refresh Tickets";
}

function showApiError(message) {

    apiErrorMessage.textContent = message;
    apiError.classList.add("show");

    // Remove old data so the person never sees stale results next to an error
    apiTickets = [];
    apiTableBody.innerHTML = "";
    apiStats.innerHTML = "";
    apiTableWrapper.style.display = "none";
    apiEmpty.classList.remove("show");
    apiUpdated.textContent = "";
}

function hideApiError() {

    apiError.classList.remove("show");
    apiErrorMessage.textContent = "";
}


// ---------- DISPLAY: summary cards ----------
function createStatCard(value, label, extraClass) {

    const card = document.createElement("div");
    card.className = "stat-card" + (extraClass ? " " + extraClass : "");

    const valueElement = document.createElement("span");
    valueElement.className = "stat-value";
    valueElement.textContent = value;

    const labelElement = document.createElement("span");
    labelElement.className = "stat-label";
    labelElement.textContent = label;

    card.appendChild(valueElement);
    card.appendChild(labelElement);

    return card;
}

function renderStats() {

    const open = apiTickets.filter(function(ticket) {
        return ticket.status === "Open";
    }).length;

    const resolved = apiTickets.length - open;

    const criticalOpen = apiTickets.filter(function(ticket) {
        return ticket.status === "Open" && ticket.priority === "P1";
    }).length;

    apiStats.innerHTML = "";
    apiStats.appendChild(createStatCard(apiTickets.length, "Total tickets"));
    apiStats.appendChild(createStatCard(open, "Open"));
    apiStats.appendChild(createStatCard(resolved, "Resolved"));
    apiStats.appendChild(createStatCard(criticalOpen, "Critical (P1) open", "stat-critical"));
}


// ---------- DISPLAY: table rows ----------
function createCell(text, className) {

    const cell = document.createElement("td");
    cell.textContent = text;

    if (className) {
        cell.className = className;
    }

    return cell;
}

function createBadgeCell(text, badgeClass) {

    const cell = document.createElement("td");
    const badge = document.createElement("span");

    badge.className = "badge " + badgeClass;
    badge.textContent = text;

    cell.appendChild(badge);

    return cell;
}

function renderApiTable() {

    const filter = apiStatusFilter.value;

    const visibleTickets = apiTickets.filter(function(ticket) {
        return filter === "All" || ticket.status === filter;
    });

    apiTableBody.innerHTML = "";

    visibleTickets.forEach(function(ticket) {

        const row = document.createElement("tr");

        row.appendChild(createCell(ticket.reference, "col-ticket"));
        row.appendChild(createCell(ticket.issue, "col-issue"));
        row.appendChild(createCell(ticket.technician));
        row.appendChild(createCell(ticket.site));
        row.appendChild(createBadgeCell(
            PRIORITY_LABELS[ticket.priority],
            "prio-badge-" + ticket.priority
        ));
        row.appendChild(createBadgeCell(
            ticket.status,
            "status-" + ticket.status.toLowerCase()
        ));

        apiTableBody.appendChild(row);
    });

    // Show the table or the empty message
    if (visibleTickets.length === 0) {
        apiTableWrapper.style.display = "none";
        apiEmpty.classList.add("show");
    } else {
        apiTableWrapper.style.display = "";
        apiEmpty.classList.remove("show");
    }
}


// ---------- MAIN: request the data and show it ----------
async function loadTickets(ticketsUrl) {

    setLoading(true);
    hideApiError();

    // Hide the empty table header while the first request is running
    if (apiTickets.length === 0) {
        apiTableWrapper.style.display = "none";
    }

    try {
        // Request both endpoints at the same time
        const results = await Promise.all([
            fetchJson(ticketsUrl || TICKETS_URL),
            fetchJson(TECHNICIANS_URL)
        ]);

        const todos = results[0];
        const users = results[1];

        if (!Array.isArray(todos) || !Array.isArray(users)) {
            throw new Error("The API returned data in an unexpected format.");
        }

        apiTickets = mapTickets(todos, users);

        renderStats();
        renderApiTable();

        apiUpdated.textContent =
            "Last updated: " + new Date().toLocaleTimeString();

    } catch (error) {

        showApiError(error.message || "Something went wrong while loading tickets.");

    } finally {

        // Runs whether the request worked or failed
        setLoading(false);
    }
}


// ---------- Events ----------
loadTicketsBtn.addEventListener("click", function() {
    loadTickets();
});

retryBtn.addEventListener("click", function() {
    loadTickets();
});

// Calls a URL that does not exist so the error handling can be demonstrated
testErrorBtn.addEventListener("click", function() {
    loadTickets(API_BASE + "/tickets-that-do-not-exist");
});

apiStatusFilter.addEventListener("change", function() {
    if (apiTickets.length > 0) {
        renderApiTable();
    }
});


// ---------- Load the data when the page opens ----------
loadTickets();
