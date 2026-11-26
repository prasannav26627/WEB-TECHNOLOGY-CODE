
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


// =====================================================================
// 9. IT TASK MANAGER  (CRUD + LOCAL STORAGE)
//    Create, Read, Update and Delete helpdesk tasks. Everything is saved
//    in the browser's localStorage so it survives a page refresh.
// =====================================================================

// ---------- Settings ----------
const TASK_STORAGE_KEY = "apextech.helpdesk.tasks";
const TASK_STATUSES = ["To Do", "In Progress", "Done"];
const TASK_STATUS_CLASS = {
    "To Do": "status-todo",
    "In Progress": "status-progress",
    "Done": "status-done"
};

// ---------- Element references ----------
const taskForm          = document.getElementById("taskForm");
const taskFormHeading   = document.getElementById("taskFormHeading");
const taskTitle         = document.getElementById("taskTitle");
const taskAssignee      = document.getElementById("taskAssignee");
const taskCategory      = document.getElementById("taskCategory");
const taskPriority      = document.getElementById("taskPriority");
const taskDue           = document.getElementById("taskDue");
const taskStatus        = document.getElementById("taskStatus");
const taskNotes         = document.getElementById("taskNotes");
const taskError         = document.getElementById("taskError");
const taskSaveBtn       = document.getElementById("taskSaveBtn");
const taskCancelBtn     = document.getElementById("taskCancelBtn");
const taskSearch        = document.getElementById("taskSearch");
const taskStatusFilter  = document.getElementById("taskStatusFilter");
const taskSort          = document.getElementById("taskSort");
const taskClearDoneBtn  = document.getElementById("taskClearDoneBtn");
const taskResetBtn      = document.getElementById("taskResetBtn");
const taskSaved         = document.getElementById("taskSaved");
const taskStats         = document.getElementById("taskStats");
const taskTableWrapper  = document.getElementById("taskTableWrapper");
const taskTableBody     = document.getElementById("taskTableBody");
const taskEmpty         = document.getElementById("taskEmpty");

let tasks = [];             // the task list (array of objects)
let nextTaskId = 1;         // id for the next new task
let editingTaskId = null;   // id of the task currently being edited


// ---------- Helper: a date a number of days from today (YYYY-MM-DD) ----------
function dateFromToday(days) {

    const date = new Date();
    date.setDate(date.getDate() + days);

    return toDateString(date);
}


// ---------- Helper: readable date such as 12 Nov 2026 ----------
function formatDueDate(dateString) {

    const date = new Date(dateString + "T00:00:00");

    if (Number.isNaN(date.getTime())) {
        return dateString;
    }

    return date.toLocaleDateString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// ---------- Sample tasks, shown the first time the page is opened ----------
function createSampleTasks() {

    return [
        {
            id: 1,
            title: "Patch Windows servers",
            assignee: "Anita R.",
            category: "Security",
            priority: "P1",
            due: dateFromToday(2),
            status: "In Progress",
            notes: "Apply the latest security updates to the file and print servers.",
            createdAt: new Date().toISOString()
        },
        {
            id: 2,
            title: "Replace laptop batteries for Sales team",
            assignee: "Karthik S.",
            category: "Hardware",
            priority: "P3",
            due: dateFromToday(5),
            status: "To Do",
            notes: "",
            createdAt: new Date().toISOString()
        },
        {
            id: 3,
            title: "Renew VPN certificates",
            assignee: "Meena V.",
            category: "Network",
            priority: "P2",
            due: dateFromToday(-1),
            status: "To Do",
            notes: "Certificates expire this week. Test remote login afterwards.",
            createdAt: new Date().toISOString()
        },
        {
            id: 4,
            title: "Audit MFA enrolment for Finance",
            assignee: "Meena V.",
            category: "Access Control",
            priority: "P3",
            due: dateFromToday(7),
            status: "To Do",
            notes: "",
            createdAt: new Date().toISOString()
        },
        {
            id: 5,
            title: "Verify weekly backup restore",
            assignee: "Anita R.",
            category: "Security",
            priority: "P4",
            due: dateFromToday(-2),
            status: "Done",
            notes: "Restore test completed successfully.",
            createdAt: new Date().toISOString()
        }
    ];
}


// ---------- Make sure data read from storage has the right shape ----------
function isValidTask(item) {

    return item !== null &&
        typeof item === "object" &&
        typeof item.title === "string" &&
        item.title.trim() !== "" &&
        Number.isFinite(Number(item.id));
}

function normaliseTask(item) {

    return {
        id: Number(item.id),
        title: item.title.trim(),
        assignee: typeof item.assignee === "string" ? item.assignee : "",
        category: typeof item.category === "string" && item.category !== "" ? item.category : "Software",
        priority: PRIORITY_LABELS[item.priority] ? item.priority : "P3",
        due: typeof item.due === "string" ? item.due : "",
        status: TASK_STATUSES.includes(item.status) ? item.status : "To Do",
        notes: typeof item.notes === "string" ? item.notes : "",
        createdAt: typeof item.createdAt === "string" ? item.createdAt : new Date().toISOString()
    };
}


// ---------- READ from localStorage ----------
function loadTasks() {

    try {
        const stored = localStorage.getItem(TASK_STORAGE_KEY);

        // First visit: nothing saved yet, so start with the sample tasks
        if (stored === null) {
            return createSampleTasks();
        }

        const parsed = JSON.parse(stored);

        if (!Array.isArray(parsed)) {
            throw new Error("Saved tasks are not a list.");
        }

        return parsed.filter(isValidTask).map(normaliseTask);

    } catch (error) {
        // Storage blocked or data damaged: fall back to the sample tasks
        return createSampleTasks();
    }
}


// ---------- WRITE to localStorage ----------
function saveTasks() {

    try {
        localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
        taskSaved.textContent =
            "Saved in this browser at " + new Date().toLocaleTimeString();
        return true;

    } catch (error) {
        taskSaved.textContent = "Not saved: browser storage is unavailable.";
        showToast("Could not save tasks. Browser storage is unavailable or full.", "danger");
        return false;
    }
}


// ---------- Helper: is this task past its due date? ----------
function isOverdue(task) {

    return task.due !== "" &&
        task.due < toDateString(new Date()) &&
        task.status !== "Done";
}


// ---------- Helper: two-click confirmation for risky buttons ----------
function disarmButton(button) {

    button.setAttribute("data-armed", "false");
    button.textContent = button.getAttribute("data-original-text");
    button.classList.remove("armed");
}

function confirmThenRun(button, action) {

    // Second click within 3 seconds: do the action
    if (button.getAttribute("data-armed") === "true") {
        clearTimeout(button.armTimer);
        disarmButton(button);
        action();
        return;
    }

    // First click: ask for confirmation
    button.setAttribute("data-original-text", button.textContent);
    button.setAttribute("data-armed", "true");
    button.textContent = "Click again to confirm";
    button.classList.add("armed");

    button.armTimer = setTimeout(function() {
        disarmButton(button);
    }, 3000);
}


// ---------- DISPLAY: summary cards ----------
function renderTaskStats() {

    const countByStatus = function(status) {
        return tasks.filter(function(task) {
            return task.status === status;
        }).length;
    };

    const overdueCount = tasks.filter(isOverdue).length;

    taskStats.innerHTML = "";
    taskStats.appendChild(createStatCard(tasks.length, "Total tasks"));
    taskStats.appendChild(createStatCard(countByStatus("To Do"), "To Do"));
    taskStats.appendChild(createStatCard(countByStatus("In Progress"), "In Progress"));
    taskStats.appendChild(createStatCard(countByStatus("Done"), "Done"));
    taskStats.appendChild(createStatCard(overdueCount, "Overdue", "stat-critical"));
}


// ---------- DISPLAY: sorting ----------
function compareTasks(a, b, mode) {

    if (mode === "due") {
        if (a.due && b.due) {
            const byDate = a.due.localeCompare(b.due);
            return byDate !== 0 ? byDate : b.id - a.id;
        }
        if (a.due) { return -1; }   // tasks without a due date go last
        if (b.due) { return 1; }
        return b.id - a.id;
    }

    if (mode === "priority") {
        const byPriority = a.priority.localeCompare(b.priority);   // P1 first
        return byPriority !== 0 ? byPriority : b.id - a.id;
    }

    return b.id - a.id;   // newest first
}


// ---------- DISPLAY: build one table row ----------
function buildTaskRow(task) {

    const row = document.createElement("tr");
    row.className = "task-row";
    row.setAttribute("data-id", task.id);

    const overdue = isOverdue(task);

    if (task.status === "Done") { row.classList.add("is-done"); }
    if (overdue)                { row.classList.add("overdue"); }
    if (task.id === editingTaskId) { row.classList.add("editing"); }

    // Task title and notes
    const taskCell = document.createElement("td");

    const titleElement = document.createElement("span");
    titleElement.className = "task-title";
    titleElement.textContent = task.title;
    taskCell.appendChild(titleElement);

    if (task.notes) {
        const notesElement = document.createElement("span");
        notesElement.className = "task-notes";
        notesElement.textContent = task.notes;
        taskCell.appendChild(notesElement);
    }

    row.appendChild(taskCell);
    row.appendChild(createCell(task.assignee || "Unassigned"));
    row.appendChild(createCell(task.category));
    row.appendChild(createBadgeCell(
        PRIORITY_LABELS[task.priority],
        "prio-badge-" + task.priority
    ));

    // Due date (with an Overdue badge when late)
    const dueCell = createCell(task.due ? formatDueDate(task.due) : "No due date");

    if (overdue) {
        dueCell.appendChild(document.createElement("br"));
        dueCell.appendChild(createBadge("Overdue", "overdue-badge"));
    }

    row.appendChild(dueCell);

    // UPDATE status straight from the table
    const statusCell = document.createElement("td");

    const statusOptions = TASK_STATUSES.map(function(status) {
        return { value: status, text: status };
    });

    const statusSelect = createSelect(statusOptions, task.status, "Status for " + task.title);
    statusSelect.className = "task-status " + TASK_STATUS_CLASS[task.status];

    statusSelect.addEventListener("change", function() {
        changeTaskStatus(task.id, statusSelect.value);
    });

    statusCell.appendChild(statusSelect);
    row.appendChild(statusCell);

    // Edit and Delete buttons
    const actionsCell = document.createElement("td");
    const actions = document.createElement("div");
    actions.className = "item-actions";

    const editBtn   = createButton("Edit", "btn-edit", "Edit task: " + task.title);
    const deleteBtn = createButton("Delete", "btn-delete", "Delete task: " + task.title);

    editBtn.addEventListener("click", function() {
        startEditTask(task.id);
    });

    deleteBtn.addEventListener("click", function() {
        confirmThenRun(deleteBtn, function() {
            deleteTask(task.id, row);
        });
    });

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    actionsCell.appendChild(actions);
    row.appendChild(actionsCell);

    return row;
}


// ---------- READ / DISPLAY: draw the table ----------
function renderTasks() {

    const searchText   = taskSearch.value.trim().toLowerCase();
    const statusFilter = taskStatusFilter.value;
    const sortMode     = taskSort.value;

    const visibleTasks = tasks.filter(function(task) {

        const matchesStatus = statusFilter === "All" || task.status === statusFilter;

        const searchable = (
            task.title + " " + task.assignee + " " + task.category + " " + task.notes
        ).toLowerCase();

        return matchesStatus && searchable.includes(searchText);
    });

    visibleTasks.sort(function(a, b) {
        return compareTasks(a, b, sortMode);
    });

    taskTableBody.innerHTML = "";

    visibleTasks.forEach(function(task) {
        taskTableBody.appendChild(buildTaskRow(task));
    });

    // Table or empty-state message
    if (visibleTasks.length === 0) {
        taskTableWrapper.style.display = "none";
        taskEmpty.textContent = tasks.length === 0
            ? "No tasks yet. Add your first task above."
            : "No tasks match your search or filter.";
        taskEmpty.classList.add("show");
    } else {
        taskTableWrapper.style.display = "";
        taskEmpty.classList.remove("show");
    }

    renderTaskStats();
}


// ---------- Form helpers ----------
function resetTaskForm() {

    taskForm.reset();
    editingTaskId = null;

    taskFormHeading.textContent = "Add a new task";
    taskSaveBtn.textContent = "Add Task";
    taskCancelBtn.hidden = true;
    taskForm.classList.remove("is-editing");

    taskError.textContent = "";
    taskTitle.removeAttribute("aria-invalid");
}

function validateTaskForm() {

    const title = taskTitle.value.trim();

    if (title.length < 3) {
        return "Enter a task title of at least 3 characters.";
    }

    if (title.length > 80) {
        return "The task title cannot be longer than 80 characters.";
    }

    if (taskDue.value !== "" && Number.isNaN(Date.parse(taskDue.value))) {
        return "Enter a valid due date.";
    }

    return "";
}


// ---------- UPDATE: load a task into the form ----------
function startEditTask(id) {

    const task = tasks.find(function(entry) {
        return entry.id === id;
    });

    if (!task) { return; }

    editingTaskId = id;

    taskTitle.value    = task.title;
    taskAssignee.value = task.assignee;
    taskCategory.value = task.category;
    taskPriority.value = task.priority;
    taskDue.value      = task.due;
    taskStatus.value   = task.status;
    taskNotes.value    = task.notes;

    taskFormHeading.textContent = "Edit task";
    taskSaveBtn.textContent = "Save Changes";
    taskCancelBtn.hidden = false;
    taskForm.classList.add("is-editing");
    taskError.textContent = "";

    renderTasks();   // highlights the row being edited

    taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
    taskTitle.focus();
}


// ---------- UPDATE: change only the status ----------
function changeTaskStatus(id, newStatus) {

    const task = tasks.find(function(entry) {
        return entry.id === id;
    });

    if (!task) { return; }

    task.status = newStatus;

    if (saveTasks()) {
        showToast("Status changed to " + newStatus + ".", "info");
    }

    renderTasks();
}


// ---------- DELETE: remove one task ----------
function deleteTask(id, row) {

    // Fade the row out, then remove it from the DOM and from storage
    row.classList.add("leaving");

    setTimeout(function() {

        tasks = tasks.filter(function(entry) {
            return entry.id !== id;
        });

        saveTasks();
        row.remove();

        // If the task being edited was deleted, clear the form
        if (editingTaskId === id) {
            resetTaskForm();
        }

        if (taskTableBody.querySelector("tr") === null) {
            renderTasks();   // shows the empty message
        } else {
            renderTaskStats();
        }

        showToast("Task deleted.", "danger");
    }, 350);
}


// ---------- CREATE and UPDATE: form submit ----------
taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const problem = validateTaskForm();

    if (problem !== "") {
        taskError.textContent = problem;
        taskTitle.setAttribute("aria-invalid", "true");
        taskTitle.focus();
        return;
    }

    taskError.textContent = "";
    taskTitle.removeAttribute("aria-invalid");

    const values = {
        title: taskTitle.value.trim(),
        assignee: taskAssignee.value.trim(),
        category: taskCategory.value,
        priority: taskPriority.value,
        due: taskDue.value,
        status: taskStatus.value,
        notes: taskNotes.value.trim()
    };

    let message;

    if (editingTaskId !== null) {

        // UPDATE an existing task
        const task = tasks.find(function(entry) {
            return entry.id === editingTaskId;
        });

        if (task) {
            Object.assign(task, values);
        }

        message = "Task updated.";

    } else {

        // CREATE a new task
        const newTask = Object.assign({
            id: nextTaskId++,
            createdAt: new Date().toISOString()
        }, values);

        tasks.push(newTask);

        message = "Task added.";
    }

    if (saveTasks()) {
        showToast(message, "success");
    }

    // Make sure the new or edited task is visible
    taskSearch.value = "";
    taskStatusFilter.value = "All";

    resetTaskForm();
    renderTasks();
});

taskCancelBtn.addEventListener("click", function() {
    resetTaskForm();
    renderTasks();
});

// Escape key cancels editing
taskForm.addEventListener("keydown", function(event) {
    if (event.key === "Escape" && editingTaskId !== null) {
        resetTaskForm();
        renderTasks();
    }
});


// ---------- Toolbar: search, filter and sort ----------
taskSearch.addEventListener("input", renderTasks);
taskStatusFilter.addEventListener("change", renderTasks);
taskSort.addEventListener("change", renderTasks);


// ---------- DELETE: clear every finished task ----------
taskClearDoneBtn.addEventListener("click", function() {

    const doneCount = tasks.filter(function(task) {
        return task.status === "Done";
    }).length;

    if (doneCount === 0) {
        showToast("There are no finished tasks to clear.", "info");
        return;
    }

    confirmThenRun(taskClearDoneBtn, function() {

        tasks = tasks.filter(function(task) {
            return task.status !== "Done";
        });

        if (editingTaskId !== null && !tasks.some(function(task) { return task.id === editingTaskId; })) {
            resetTaskForm();
        }

        saveTasks();
        renderTasks();
        showToast(doneCount + " finished task(s) cleared.", "danger");
    });
});


// ---------- Restore the sample tasks ----------
taskResetBtn.addEventListener("click", function() {

    confirmThenRun(taskResetBtn, function() {

        tasks = createSampleTasks();
        nextTaskId = tasks.length + 1;

        saveTasks();
        resetTaskForm();
        renderTasks();
        showToast("Sample tasks restored.", "info");
    });
});


// ---------- Keep several open tabs in sync ----------
window.addEventListener("storage", function(event) {

    if (event.key === TASK_STORAGE_KEY) {
        tasks = loadTasks();
        nextTaskId = tasks.reduce(function(max, task) {
            return Math.max(max, task.id);
        }, 0) + 1;

        if (editingTaskId !== null) {
            resetTaskForm();
        }

        renderTasks();
    }
});


// ---------- Start: load saved tasks and draw the table ----------
tasks = loadTasks();

nextTaskId = tasks.reduce(function(max, task) {
    return Math.max(max, task.id);
}, 0) + 1;

saveTasks();    // stores the sample tasks on the very first visit
renderTasks();


// =====================================================================
// 10. IT HELP CENTER
//     Search + category filter + accordion (details / summary)
//     The guides react instantly as the person types or clicks.
// =====================================================================

const helpSearch      = document.querySelector("#helpSearch");
const helpClearBtn    = document.querySelector("#helpClearBtn");
const helpExpandBtn   = document.querySelector("#helpExpandBtn");
const helpCollapseBtn = document.querySelector("#helpCollapseBtn");
const helpCount       = document.querySelector("#helpCount");
const helpEmpty       = document.querySelector("#helpEmpty");
const helpChips       = Array.from(document.querySelectorAll(".help-chip"));
const helpItems       = Array.from(document.querySelectorAll(".help-item"));


// ---------- Which category chip is selected? ----------
function getActiveHelpCategory() {

    const activeChip = helpChips.find(function(chip) {
        return chip.classList.contains("active");
    });

    return activeChip ? activeChip.getAttribute("data-category") : "All";
}


// ---------- Does a guide match the search text and the category? ----------
function matchesHelp(item, query, category) {

    const matchesCategory =
        category === "All" || item.getAttribute("data-category") === category;

    // Search the visible text and the hidden keywords
    const searchable = (
        item.textContent + " " + item.getAttribute("data-keywords")
    ).toLowerCase();

    return matchesCategory && (query === "" || searchable.includes(query));
}


// ---------- Update the whole Help Center ----------
function updateHelpCenter() {

    const query = helpSearch.value.trim().toLowerCase();
    const category = getActiveHelpCategory();

    // Number shown on each category chip (follows the search text)
    helpChips.forEach(function(chip) {

        const chipCategory = chip.getAttribute("data-category");

        const count = helpItems.filter(function(item) {
            return matchesHelp(item, query, chipCategory);
        }).length;

        chip.querySelector(".help-chip-count").textContent = count;
    });

    // Show or hide each guide
    const matches = helpItems.filter(function(item) {
        return matchesHelp(item, query, category);
    });

    helpItems.forEach(function(item) {
        item.classList.toggle("is-hidden", !matches.includes(item));
    });

    helpCount.textContent =
        "Showing " + matches.length + " of " + helpItems.length + " guides";

    helpEmpty.classList.toggle("show", matches.length === 0);

    // One clear answer: open it straight away
    if (query !== "" && matches.length === 1) {
        matches[0].open = true;
    }
}


// ---------- Select one category chip ----------
function setActiveHelpChip(selectedChip) {

    helpChips.forEach(function(chip) {
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
    });

    selectedChip.classList.add("active");
    selectedChip.setAttribute("aria-pressed", "true");

    updateHelpCenter();
}


// ---------- Events ----------
helpSearch.addEventListener("input", updateHelpCenter);

helpSearch.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        helpSearch.value = "";
        updateHelpCenter();
    }
});

helpChips.forEach(function(chip) {
    chip.addEventListener("click", function() {
        setActiveHelpChip(chip);
    });
});

helpClearBtn.addEventListener("click", function() {

    helpSearch.value = "";

    const allChip = helpChips.find(function(chip) {
        return chip.getAttribute("data-category") === "All";
    });

    setActiveHelpChip(allChip);
    helpSearch.focus();
});

helpExpandBtn.addEventListener("click", function() {
    helpItems
        .filter(function(item) { return !item.classList.contains("is-hidden"); })
        .forEach(function(item) { item.open = true; });
});

helpCollapseBtn.addEventListener("click", function() {
    helpItems.forEach(function(item) { item.open = false; });
});

updateHelpCenter();


// =====================================================================
// 11. HARDWARE CATALOG + COMPARISON TOOL
//     Category tabs, availability filter, image cards and a
//     side-by-side comparison of any two devices.
// =====================================================================

// ---------- Device data ----------
const DEVICES = [
    { id: 1, name: "ApexBook 14 Pro",         type: "Laptop",     spec: "Intel Core i7, 16 GB RAM, 512 GB SSD",             warranty: 3, price: 74900, stock: "In stock" },
    { id: 2, name: "ApexBook 15 Standard",    type: "Laptop",     spec: "Intel Core i5, 8 GB RAM, 256 GB SSD",              warranty: 1, price: 52500, stock: "In stock" },
    { id: 3, name: "Apex Vision 24-inch",     type: "Monitor",    spec: "24-inch Full HD IPS, HDMI and DisplayPort",        warranty: 3, price: 12800, stock: "Low stock" },
    { id: 4, name: "Apex Vision 27-inch 4K",  type: "Monitor",    spec: "27-inch 4K UHD, USB-C with 65 W charging",         warranty: 3, price: 31500, stock: "In stock" },
    { id: 5, name: "Apex KeyPro Keyboard",    type: "Peripheral", spec: "Full-size wireless, Bluetooth and 2.4 GHz",        warranty: 1, price: 3200,  stock: "In stock" },
    { id: 6, name: "Apex Precision Mouse",    type: "Peripheral", spec: "Ergonomic, 4000 DPI, silent click",                warranty: 1, price: 1450,  stock: "Out of stock" },
    { id: 7, name: "Apex Router AX3000",      type: "Networking", spec: "Wi-Fi 6 dual band, 4 gigabit LAN ports",           warranty: 2, price: 9800,  stock: "In stock" },
    { id: 8, name: "Apex 24-Port Switch",     type: "Networking", spec: "24 gigabit ports, managed, rack-mount",            warranty: 3, price: 22400, stock: "Low stock" }
];

const STOCK_CLASS = {
    "In stock": "stock-in",
    "Low stock": "stock-low",
    "Out of stock": "stock-out"
};

// Rows of the comparison table
const COMPARE_ROWS = [
    {
        label: "Category",
        value: function(device) { return device.type; }
    },
    {
        label: "Key specification",
        value: function(device) { return device.spec; }
    },
    {
        label: "Warranty",
        value: function(device) { return device.warranty + (device.warranty === 1 ? " year" : " years"); },
        number: function(device) { return device.warranty; },
        better: "high"
    },
    {
        label: "Price",
        value: function(device) { return formatPrice(device.price); },
        number: function(device) { return device.price; },
        better: "low"
    },
    {
        label: "Availability",
        value: function(device) { return device.stock; }
    }
];

// ---------- Element references ----------
const deviceGrid        = document.querySelector("#deviceGrid");
const deviceStockFilter = document.querySelector("#deviceStockFilter");
const deviceCount       = document.querySelector("#deviceCount");
const deviceEmpty       = document.querySelector("#deviceEmpty");
const deviceTabs        = Array.from(document.querySelectorAll(".device-tab"));

const comparePanel        = document.querySelector("#comparePanel");
const compareTitle        = document.querySelector("#compareTitle");
const compareHint         = document.querySelector("#compareHint");
const compareClearBtn     = document.querySelector("#compareClearBtn");
const compareTableWrapper = document.querySelector("#compareTableWrapper");
const compareHead         = document.querySelector("#compareHead");
const compareBody         = document.querySelector("#compareBody");

let selectedDeviceIds = [];   // ids of the devices chosen for comparison (max 2)


// ---------- Helper: price in rupees ----------
function formatPrice(amount) {
    return "\u20B9" + amount.toLocaleString("en-IN");
}


// ---------- Helper: draw a simple device picture (SVG used as an image) ----------
function createDeviceImage(type) {

    let shapes = "";

    if (type === "Laptop") {
        shapes =
            '<rect x="48" y="22" width="104" height="68" rx="6" fill="#102a43"/>' +
            '<rect x="55" y="29" width="90" height="54" rx="2" fill="#18a0ae"/>' +
            '<path d="M28 96h144l-10 13H38z" fill="#64748b"/>';

    } else if (type === "Monitor") {
        shapes =
            '<rect x="36" y="14" width="128" height="78" rx="6" fill="#102a43"/>' +
            '<rect x="43" y="21" width="114" height="64" rx="2" fill="#18a0ae"/>' +
            '<rect x="92" y="92" width="16" height="16" fill="#64748b"/>' +
            '<rect x="70" y="106" width="60" height="7" rx="3" fill="#64748b"/>';

    } else if (type === "Peripheral") {
        shapes = '<rect x="26" y="38" width="148" height="58" rx="8" fill="#102a43"/>';

        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 10; col++) {
                shapes +=
                    '<rect x="' + (35 + col * 13.5) + '" y="' + (47 + row * 14) +
                    '" width="10" height="10" rx="2" fill="#18a0ae"/>';
            }
        }

    } else {
        shapes =
            '<rect x="52" y="26" width="5" height="40" fill="#64748b"/>' +
            '<rect x="143" y="26" width="5" height="40" fill="#64748b"/>' +
            '<rect x="26" y="64" width="148" height="34" rx="6" fill="#102a43"/>' +
            '<circle cx="48" cy="81" r="4" fill="#2e9e5b"/>' +
            '<circle cx="64" cy="81" r="4" fill="#18a0ae"/>' +
            '<circle cx="80" cy="81" r="4" fill="#18a0ae"/>' +
            '<rect x="118" y="76" width="44" height="10" rx="3" fill="#64748b"/>';
    }

    const svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 130">' +
        '<rect width="200" height="130" fill="#eaf6fa"/>' + shapes + '</svg>';

    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}


// ---------- Which tab is selected? ----------
function getActiveDeviceType() {

    const activeTab = deviceTabs.find(function(tab) {
        return tab.classList.contains("active");
    });

    return activeTab ? activeTab.getAttribute("data-type") : "All";
}


// ---------- DISPLAY: build one device card ----------
function buildDeviceCard(device) {

    const isSelected = selectedDeviceIds.includes(device.id);

    const card = document.createElement("div");
    card.className = "device-card" + (isSelected ? " selected" : "");
    card.setAttribute("data-id", device.id);

    // Picture
    const photo = document.createElement("div");
    photo.className = "device-photo";

    const image = document.createElement("img");
    image.src = createDeviceImage(device.type);
    image.alt = device.name + " (" + device.type + ")";

    photo.appendChild(image);
    card.appendChild(photo);

    if (isSelected) {
        const flag = document.createElement("span");
        flag.className = "compare-flag";
        flag.textContent = "Selected";
        card.appendChild(flag);
    }

    // Text
    const body = document.createElement("div");
    body.className = "device-body";

    const typeElement = document.createElement("span");
    typeElement.className = "device-type";
    typeElement.textContent = device.type;

    const nameElement = document.createElement("h4");
    nameElement.className = "device-name";
    nameElement.textContent = device.name;

    const specElement = document.createElement("p");
    specElement.className = "device-spec";
    specElement.textContent = device.spec;

    const meta = document.createElement("div");
    meta.className = "device-meta";

    const priceElement = document.createElement("span");
    priceElement.className = "device-price";
    priceElement.textContent = formatPrice(device.price);

    meta.appendChild(priceElement);
    meta.appendChild(createBadge(device.stock, STOCK_CLASS[device.stock]));

    // Compare button
    const buttonText = isSelected ? "Remove from comparison" : "Add to comparison";
    const compareButton = createButton(
        buttonText,
        "compare-btn" + (isSelected ? " on" : ""),
        buttonText + ": " + device.name
    );
    compareButton.setAttribute("aria-pressed", isSelected ? "true" : "false");

    compareButton.addEventListener("click", function() {
        toggleCompare(device.id);
    });

    body.appendChild(typeElement);
    body.appendChild(nameElement);
    body.appendChild(specElement);
    body.appendChild(meta);
    body.appendChild(compareButton);
    card.appendChild(body);

    return card;
}


// ---------- DISPLAY: draw the catalog ----------
function renderDevices() {

    const type = getActiveDeviceType();
    const stock = deviceStockFilter.value;

    const visibleDevices = DEVICES.filter(function(device) {
        return (type === "All" || device.type === type) &&
               (stock === "All" || device.stock === stock);
    });

    deviceGrid.innerHTML = "";

    visibleDevices.forEach(function(device) {
        deviceGrid.appendChild(buildDeviceCard(device));
    });

    deviceCount.textContent =
        "Showing " + visibleDevices.length + " of " + DEVICES.length + " devices";

    deviceEmpty.classList.toggle("show", visibleDevices.length === 0);
}


// ---------- DISPLAY: draw the comparison panel ----------
function renderComparison() {

    const selectedDevices = selectedDeviceIds.map(function(id) {
        return DEVICES.find(function(device) {
            return device.id === id;
        });
    });

    comparePanel.classList.toggle("show", selectedDevices.length > 0);

    if (selectedDevices.length === 0) {
        return;
    }

    compareHead.innerHTML = "";
    compareBody.innerHTML = "";

    // Only one device chosen so far
    if (selectedDevices.length === 1) {
        compareTitle.textContent = "Comparing: " + selectedDevices[0].name;
        compareHint.textContent = "Select one more device to see the comparison.";
        compareTableWrapper.style.display = "none";
        return;
    }

    // Two devices chosen: build the table
    compareTitle.textContent =
        selectedDevices[0].name + " vs " + selectedDevices[1].name;
    compareHint.textContent =
        "Green cells show the better value for warranty and price.";
    compareTableWrapper.style.display = "";

    const headRow = document.createElement("tr");

    ["Specification", selectedDevices[0].name, selectedDevices[1].name].forEach(function(title) {
        const th = document.createElement("th");
        th.textContent = title;
        headRow.appendChild(th);
    });

    compareHead.appendChild(headRow);

    COMPARE_ROWS.forEach(function(row) {

        const tr = document.createElement("tr");
        tr.appendChild(createCell(row.label, "compare-label"));

        const cells = selectedDevices.map(function(device) {
            return createCell(row.value(device));
        });

        // Mark the better value
        if (row.better) {
            const first = row.number(selectedDevices[0]);
            const second = row.number(selectedDevices[1]);

            if (first !== second) {
                const firstIsBetter = row.better === "low" ? first < second : first > second;
                cells[firstIsBetter ? 0 : 1].classList.add("better");
            }
        }

        cells.forEach(function(cell) {
            tr.appendChild(cell);
        });

        compareBody.appendChild(tr);
    });
}


// ---------- Add or remove a device from the comparison ----------
function toggleCompare(deviceId) {

    if (selectedDeviceIds.includes(deviceId)) {

        selectedDeviceIds = selectedDeviceIds.filter(function(id) {
            return id !== deviceId;
        });

    } else if (selectedDeviceIds.length >= 2) {

        showToast("You can compare two devices at a time. Remove one first.", "info");
        return;

    } else {
        selectedDeviceIds.push(deviceId);
    }

    renderDevices();
    renderComparison();

    // When the second device is chosen, bring the table into view
    if (selectedDeviceIds.length === 2) {
        comparePanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}


// ---------- Events ----------
deviceTabs.forEach(function(tab) {

    tab.addEventListener("click", function() {

        deviceTabs.forEach(function(other) {
            other.classList.remove("active");
            other.setAttribute("aria-pressed", "false");
        });

        tab.classList.add("active");
        tab.setAttribute("aria-pressed", "true");

        renderDevices();
    });
});

deviceStockFilter.addEventListener("change", renderDevices);

compareClearBtn.addEventListener("click", function() {
    selectedDeviceIds = [];
    renderDevices();
    renderComparison();
});


// ---------- First draw ----------
renderDevices();
renderComparison();


// =====================================================================
// 12. HELPDESK SETTINGS  (custom toggle switches + LOCAL STORAGE)
//     Each switch changes how the application behaves straight away
//     and is remembered after the page is refreshed.
// =====================================================================

// ---------- Settings ----------
const SETTINGS_KEY = "apextech.helpdesk.settings";
const AUTO_REFRESH_SECONDS = 30;

const DEFAULT_SETTINGS = {
    autoRefresh: false,    // reload the API ticket queue every 30 seconds
    majorIncident: false,  // red banner and P1 highlighting
    showNotes: true        // show technician notes in the task table
};

const SETTING_LABELS = {
    autoRefresh: "Auto-refresh ticket queue",
    majorIncident: "Major incident mode",
    showNotes: "Show task notes"
};

// ---------- Element references ----------
const settingToggles    = Array.from(document.querySelectorAll(".setting-toggle"));
const incidentBanner    = document.getElementById("incidentBanner");
const incidentOffBtn    = document.getElementById("incidentOffBtn");
const autoRefreshStatus = document.getElementById("autoRefreshStatus");
const settingsSaved     = document.getElementById("settingsSaved");
const settingsResetBtn  = document.getElementById("settingsResetBtn");

let settings = loadSettings();
let autoRefreshTimer = null;
let autoRefreshLeft = AUTO_REFRESH_SECONDS;


// ---------- READ the saved settings ----------
function loadSettings() {

    const result = Object.assign({}, DEFAULT_SETTINGS);

    try {
        const stored = localStorage.getItem(SETTINGS_KEY);

        if (stored === null) {
            return result;   // first visit: use the defaults
        }

        const parsed = JSON.parse(stored);

        // Only accept true / false values for the known settings
        Object.keys(DEFAULT_SETTINGS).forEach(function(name) {
            if (parsed && typeof parsed[name] === "boolean") {
                result[name] = parsed[name];
            }
        });

    } catch (error) {
        // Storage blocked or data damaged: keep the defaults
    }

    return result;
}


// ---------- WRITE the settings ----------
function saveSettings() {

    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        settingsSaved.textContent =
            "Settings saved in this browser at " + new Date().toLocaleTimeString();
        return true;

    } catch (error) {
        settingsSaved.textContent = "Settings could not be saved: browser storage is unavailable.";
        return false;
    }
}


// ---------- Auto-refresh behaviour ----------
function updateAutoRefreshStatus() {

    autoRefreshStatus.textContent = autoRefreshTimer === null
        ? "Not refreshing automatically."
        : "Next refresh in " + autoRefreshLeft + " s";
}

function autoRefreshTick() {

    // Do not count down while the tab is hidden
    if (document.hidden) {
        return;
    }

    autoRefreshLeft--;

    if (autoRefreshLeft <= 0) {
        autoRefreshLeft = AUTO_REFRESH_SECONDS;

        // Skip if a request is already running
        if (!loadTicketsBtn.disabled) {
            loadTickets();
        }
    }

    updateAutoRefreshStatus();
}

function stopAutoRefresh() {

    clearInterval(autoRefreshTimer);
    autoRefreshTimer = null;
    updateAutoRefreshStatus();
}

function startAutoRefresh() {

    stopAutoRefresh();

    autoRefreshLeft = AUTO_REFRESH_SECONDS;
    autoRefreshTimer = setInterval(autoRefreshTick, 1000);
    updateAutoRefreshStatus();
}


// ---------- Change the application for one setting ----------
function applySetting(name, isOn) {

    if (name === "autoRefresh") {

        if (isOn) {
            startAutoRefresh();
        } else {
            stopAutoRefresh();
        }

    } else if (name === "majorIncident") {

        document.body.classList.toggle("major-incident", isOn);
        incidentBanner.classList.toggle("show", isOn);

    } else if (name === "showNotes") {

        document.body.classList.toggle("hide-task-notes", !isOn);
    }
}


// ---------- Update the look of one switch row ----------
function syncToggleLook(toggle) {

    const row = toggle.closest(".setting-row");

    row.classList.toggle("is-on", toggle.checked);
    row.querySelector(".switch-state").textContent = toggle.checked ? "On" : "Off";
}


// ---------- Put every switch in the saved position and apply it ----------
function applyAllSettings() {

    settingToggles.forEach(function(toggle) {

        const name = toggle.getAttribute("data-setting");

        toggle.checked = settings[name];
        syncToggleLook(toggle);
        applySetting(name, toggle.checked);
    });
}


// ---------- When a switch is clicked ----------
settingToggles.forEach(function(toggle) {

    toggle.addEventListener("change", function() {

        const name = toggle.getAttribute("data-setting");

        settings[name] = toggle.checked;

        syncToggleLook(toggle);
        applySetting(name, toggle.checked);

        if (saveSettings()) {
            showToast(
                SETTING_LABELS[name] + (toggle.checked ? " turned on." : " turned off."),
                toggle.checked ? "success" : "info"
            );
        }
    });
});


// ---------- "Turn off" button inside the red banner ----------
incidentOffBtn.addEventListener("click", function() {

    const majorToggle = document.getElementById("majorIncidentToggle");

    majorToggle.checked = false;
    majorToggle.dispatchEvent(new Event("change"));
});


// ---------- Back to the default settings ----------
settingsResetBtn.addEventListener("click", function() {

    confirmThenRun(settingsResetBtn, function() {

        settings = Object.assign({}, DEFAULT_SETTINGS);

        applyAllSettings();

        if (saveSettings()) {
            showToast("Settings restored to defaults.", "info");
        }
    });
});


// ---------- Keep several open tabs in sync ----------
window.addEventListener("storage", function(event) {

    if (event.key === SETTINGS_KEY) {
        settings = loadSettings();
        applyAllSettings();
    }
});


// ---------- Start: put the switches where they were last time ----------
applyAllSettings();
