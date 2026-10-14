document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const title = document.createElement("h4");
        title.textContent = name;
        activityCard.appendChild(title);

        const description = document.createElement("p");
        description.textContent = details.description;
        activityCard.appendChild(description);

        const schedule = document.createElement("p");
        const scheduleLabel = document.createElement("strong");
        scheduleLabel.textContent = "Schedule:";
        schedule.append(scheduleLabel, ` ${details.schedule}`);
        activityCard.appendChild(schedule);

        const availability = document.createElement("p");
        const availabilityLabel = document.createElement("strong");
        availabilityLabel.textContent = "Availability:";
        availability.append(availabilityLabel, ` ${spotsLeft} spots left`);
        activityCard.appendChild(availability);

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";

        const participantsHeading = document.createElement("h5");
        participantsHeading.textContent = "Participants";
        participantsSection.appendChild(participantsHeading);

        const participantsList = document.createElement("ul");
        participantsList.className = "participants-list";
        details.participants.forEach((participant) => {
          const listItem = document.createElement("li");

          const participantEmail = document.createElement("span");
          participantEmail.textContent = participant;
          listItem.appendChild(participantEmail);

          const removeButton = document.createElement("button");
          removeButton.type = "button";
          removeButton.className = "remove-participant";
          removeButton.dataset.activity = name;
          removeButton.dataset.email = participant;
          removeButton.setAttribute("aria-label", `Unregister ${participant} from ${name}`);
          removeButton.title = "Unregister participant";

          const deleteIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          deleteIcon.setAttribute("viewBox", "0 0 24 24");
          deleteIcon.setAttribute("aria-hidden", "true");
          deleteIcon.setAttribute("focusable", "false");
          const deletePath = document.createElementNS("http://www.w3.org/2000/svg", "path");
          deletePath.setAttribute("d", "M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6");
          deletePath.setAttribute("fill", "none");
          deletePath.setAttribute("stroke", "currentColor");
          deletePath.setAttribute("stroke-width", "2");
          deletePath.setAttribute("stroke-linecap", "round");
          deletePath.setAttribute("stroke-linejoin", "round");
          deleteIcon.appendChild(deletePath);
          removeButton.appendChild(deleteIcon);
          listItem.appendChild(removeButton);

          participantsList.appendChild(listItem);
        });
        participantsSection.appendChild(participantsList);
        activityCard.appendChild(participantsSection);

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  activitiesList.addEventListener("click", async (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const removeButton = event.target.closest(".remove-participant");
    if (!removeButton) {
      return;
    }

    removeButton.disabled = true;
    const { activity, email } = removeButton.dataset;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to unregister participant");
      }

      messageDiv.textContent = result.message;
      messageDiv.className = "success";
      messageDiv.classList.remove("hidden");
      await fetchActivities();
    } catch (error) {
      messageDiv.textContent = error.message || "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      removeButton.disabled = false;
      console.error("Error unregistering participant:", error);
    }

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
