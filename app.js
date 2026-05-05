/*
  Project 4 Debug Notes
  Bugs fixed:
  - Removed repeated button event listeners that were recreated after every render.
  - Added input trimming and age validation so blank-looking values and invalid ages cannot be saved.
  - Added graceful fetch error handling with a visible status message instead of silent failures.

  Key refactors:
  - Wrapped the app in an IIFE to avoid unnecessary global variables.
  - Split rendering, form handling, API loading, searching, editing, and deletion into single-purpose functions.
  - Replaced inline HTML string rendering with DOM creation to reduce accidental markup issues.

  Creative enhancement:
  - Added profile editing, live search, profile counts, animated cards, and async sample profile loading from JSONPlaceholder.
*/

(() => {
  "use strict";

  const sampleProfiles = [
    {
      id: createId(),
      name: "Temi",
      age: 18,
      hobby: "Soccer",
      favoriteColor: "Blue",
      source: "starter"
    },
    {
      id: createId(),
      name: "Uvie",
      age: 19,
      hobby: "Gaming",
      favoriteColor: "Black",
      source: "starter"
    }
  ];

  let profiles = [...sampleProfiles];
  let searchTerm = "";

  const elements = {
    profileContainer: document.querySelector("#profileContainer"),
    profileForm: document.querySelector("#profileForm"),
    profileId: document.querySelector("#profileId"),
    formTitle: document.querySelector("#formTitle"),
    submitButton: document.querySelector("#submitButton"),
    cancelEditButton: document.querySelector("#cancelEditButton"),
    nameInput: document.querySelector("#name"),
    ageInput: document.querySelector("#age"),
    hobbyInput: document.querySelector("#hobby"),
    favoriteColorInput: document.querySelector("#favoriteColor"),
    searchInput: document.querySelector("#searchInput"),
    loadSampleProfilesButton: document.querySelector("#loadSampleProfiles"),
    statusMessage: document.querySelector("#statusMessage"),
    profileCount: document.querySelector("#profileCount"),
    filteredCount: document.querySelector("#filteredCount")
  };

  function initializeApp() {
    elements.profileForm.addEventListener("submit", handleProfileSubmit);
    elements.cancelEditButton.addEventListener("click", resetForm);
    elements.searchInput.addEventListener("input", handleSearch);
    elements.loadSampleProfilesButton.addEventListener("click", loadProfilesFromApi);
    elements.profileContainer.addEventListener("click", handleProfileAction);

    renderProfiles();
    showStatus("Ready to build a standout profile collection.");
  }

  function handleProfileSubmit(event) {
    event.preventDefault();

    const profileData = getProfileFormData();

    if (!isProfileValid(profileData)) {
      showStatus("Please enter a valid name, hobby, color, and age between 1 and 120.", "error");
      return;
    }

    if (profileData.id) {
      updateProfile(profileData);
      showStatus(`${profileData.name}'s profile was updated.`);
    } else {
      profiles = [
        {
          ...profileData,
          id: createId(),
          source: "custom"
        },
        ...profiles
      ];
      showStatus(`${profileData.name}'s profile was added.`);
    }

    resetForm();
    renderProfiles();
  }

  function getProfileFormData() {
    return {
      id: elements.profileId.value,
      name: elements.nameInput.value.trim(),
      age: Number(elements.ageInput.value),
      hobby: elements.hobbyInput.value.trim(),
      favoriteColor: elements.favoriteColorInput.value.trim()
    };
  }

  function isProfileValid(profile) {
    return (
      profile.name.length > 0 &&
      profile.hobby.length > 0 &&
      profile.favoriteColor.length > 0 &&
      Number.isInteger(profile.age) &&
      profile.age >= 1 &&
      profile.age <= 120
    );
  }

  function createId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return window.crypto.randomUUID();
    }

    return `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function updateProfile(updatedProfile) {
    profiles = profiles.map((profile) =>
      profile.id === updatedProfile.id
        ? { ...profile, ...updatedProfile, source: profile.source }
        : profile
    );
  }

  function handleSearch(event) {
    searchTerm = event.target.value.trim().toLowerCase();
    renderProfiles();
  }

  async function loadProfilesFromApi() {
    setLoadingState(true);
    showStatus("Fetching inspiration profiles from JSONPlaceholder...");

    try {
      const response = await fetch("https://jsonplaceholder.typicode.com/users?_limit=4");

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const users = await response.json();
      const importedProfiles = users.map(convertUserToProfile);

      profiles = mergeProfiles(importedProfiles, profiles);
      renderProfiles();
      showStatus("API profiles loaded successfully. You can edit them like your own.");
    } catch (error) {
      showStatus("Could not load API profiles. Check your connection and try again.", "error");
    } finally {
      setLoadingState(false);
    }
  }

  function convertUserToProfile(user) {
    const hobbyOptions = ["Photography", "Design", "Coding", "Travel", "Music"];
    const colorOptions = ["Teal", "Coral", "Gold", "Indigo", "Emerald"];

    return {
      id: `api-${user.id}`,
      name: user.name,
      age: 20 + user.id,
      hobby: hobbyOptions[user.id % hobbyOptions.length],
      favoriteColor: colorOptions[user.id % colorOptions.length],
      source: "api"
    };
  }

  function mergeProfiles(newProfiles, currentProfiles) {
    const existingIds = new Set(currentProfiles.map((profile) => profile.id));
    const uniqueProfiles = newProfiles.filter((profile) => !existingIds.has(profile.id));
    return [...uniqueProfiles, ...currentProfiles];
  }

  function handleProfileAction(event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
      return;
    }

    const { action, id } = button.dataset;

    if (action === "edit") {
      startEditingProfile(id);
    }

    if (action === "delete") {
      deleteProfile(id);
    }
  }

  function startEditingProfile(profileId) {
    const profile = profiles.find((item) => item.id === profileId);

    if (!profile) {
      showStatus("That profile could not be found.", "error");
      return;
    }

    elements.profileId.value = profile.id;
    elements.nameInput.value = profile.name;
    elements.ageInput.value = profile.age;
    elements.hobbyInput.value = profile.hobby;
    elements.favoriteColorInput.value = profile.favoriteColor;
    elements.formTitle.textContent = "Edit Profile";
    elements.submitButton.textContent = "Save Changes";
    elements.cancelEditButton.classList.remove("hidden");
    elements.nameInput.focus();
  }

  function deleteProfile(profileId) {
    const profile = profiles.find((item) => item.id === profileId);
    profiles = profiles.filter((item) => item.id !== profileId);
    renderProfiles();
    resetForm();

    if (profile) {
      showStatus(`${profile.name}'s profile was removed.`);
    }
  }

  function resetForm() {
    elements.profileForm.reset();
    elements.profileId.value = "";
    elements.formTitle.textContent = "Add a New Profile";
    elements.submitButton.textContent = "Add Profile";
    elements.cancelEditButton.classList.add("hidden");
  }

  function renderProfiles() {
    const visibleProfiles = getFilteredProfiles();

    elements.profileContainer.replaceChildren();
    elements.profileCount.textContent = profiles.length;
    elements.filteredCount.textContent = `${visibleProfiles.length} shown`;

    if (visibleProfiles.length === 0) {
      elements.profileContainer.appendChild(createEmptyState());
      return;
    }

    const fragment = document.createDocumentFragment();
    visibleProfiles.forEach((profile) => {
      fragment.appendChild(createProfileCard(profile));
    });
    elements.profileContainer.appendChild(fragment);
  }

  function getFilteredProfiles() {
    if (!searchTerm) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const searchableProfile = `${profile.name} ${profile.age} ${profile.hobby} ${profile.favoriteColor}`.toLowerCase();
      return searchableProfile.includes(searchTerm);
    });
  }

  function createProfileCard(profile) {
    const card = document.createElement("article");
    card.className = "profile-card";

    const accent = document.createElement("span");
    accent.className = "color-accent";
    accent.textContent = profile.favoriteColor;

    const title = document.createElement("h3");
    title.textContent = profile.name;

    const meta = document.createElement("p");
    meta.className = "profile-meta";
    meta.textContent = `${profile.age} years old`;

    const hobby = createDetail("Hobby", profile.hobby);
    const favoriteColor = createDetail("Favorite Color", profile.favoriteColor);
    const source = createDetail("Source", profile.source === "api" ? "API import" : "Custom profile");
    const actions = createProfileActions(profile.id);

    card.append(accent, title, meta, hobby, favoriteColor, source, actions);
    return card;
  }

  function createDetail(label, value) {
    const detail = document.createElement("p");
    detail.className = "profile-detail";

    const labelElement = document.createElement("span");
    labelElement.textContent = `${label}:`;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    detail.append(labelElement, valueElement);
    return detail;
  }

  function createProfileActions(profileId) {
    const actions = document.createElement("div");
    actions.className = "card-actions";

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "secondary-button";
    editButton.dataset.action = "edit";
    editButton.dataset.id = profileId;
    editButton.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "danger-button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = profileId;
    deleteButton.textContent = "Remove";

    actions.append(editButton, deleteButton);
    return actions;
  }

  function createEmptyState() {
    const emptyState = document.createElement("div");
    emptyState.className = "empty-state";
    emptyState.textContent = "No profiles match your search yet.";
    return emptyState;
  }

  function setLoadingState(isLoading) {
    elements.loadSampleProfilesButton.disabled = isLoading;
    elements.loadSampleProfilesButton.textContent = isLoading
      ? "Loading..."
      : "Load Sample Profiles";
  }

  function showStatus(message, type = "success") {
    elements.statusMessage.textContent = message;
    elements.statusMessage.dataset.type = type;
  }

  initializeApp();
})();
