
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
