
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


// =====================================
// 3. TICKET FORM SUBMISSION
// =====================================

const ticketForm = document.getElementById("ticketForm");
const notification = document.getElementById("notification");
const notificationMessage = document.getElementById("notificationMessage");

ticketForm.addEventListener("submit", function(event) {

    event.preventDefault();

    if (!ticketForm.checkValidity()) {
        ticketForm.reportValidity();
        return;
    }

    notificationMessage.textContent =
        "Your IT support request has been submitted successfully!";

    notification.classList.add("show");

    // Automatically hide notification after 5 seconds
    setTimeout(function() {
        notification.classList.remove("show");
    }, 5000);

    ticketForm.reset();

});


// =====================================
// 4. RESET FORM NOTIFICATION
// =====================================

ticketForm.addEventListener("reset", function() {

    notificationMessage.textContent =
        "The ticket form has been reset.";

    notification.classList.add("show");

    setTimeout(function() {
        notification.classList.remove("show");
    }, 3000);

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
