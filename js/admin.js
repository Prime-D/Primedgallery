import { supabase } from "./supabase.js";

console.log("ADMIN SCRIPT LOADED ✅");

// ======================================================
// DOM ELEMENTS
// ======================================================
const logoutBtn = document.getElementById("logoutBtn");
const eventForm = document.getElementById("eventForm");
const message = document.getElementById("message");

const eventSelect = document.getElementById("eventSelect");
const eventManagementPanel = document.getElementById("eventManagementPanel");
const eventManagementMessage = document.getElementById("eventManagementMessage");
const eventStatus = document.getElementById("eventStatus");

// Edit Event Inputs
const editEventName = document.getElementById("editEventName");
const editEventDate = document.getElementById("editEventDate");
const editLocation = document.getElementById("editLocation");
const editEventCoverInput = document.getElementById("editEventCoverInput");
const editCoverPreview = document.getElementById("editCoverPreview");
const editDescription = document.getElementById("editDescription");
const editBudget = document.getElementById("editBudget");
const editShowBudget = document.getElementById("editShowBudget");

// Action Buttons
const saveEventBtn = document.getElementById("saveEventBtn");
const publishEventBtn = document.getElementById("publishEventBtn");
const unpublishEventBtn = document.getElementById("unpublishEventBtn");
const deleteEventBtn = document.getElementById("deleteEventBtn");

// Home Hero Photo Elements
const heroPhotoInput = document.getElementById("heroPhotoInput");
const uploadHeroPhotoBtn = document.getElementById("uploadHeroPhotoBtn");
const heroPhotoMessage = document.getElementById("heroPhotoMessage");

// Category Elements
const categoryNameInput = document.getElementById("categoryName");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryMessage = document.getElementById("categoryMessage");
const categoryList = document.getElementById("categoryList");
const categorySelect = document.getElementById("categorySelect");

// Media Upload Elements
const categoryPhotos = document.getElementById("categoryPhotos");
const categoryVideos = document.getElementById("categoryVideos");
const uploadCategoryMediaBtn = document.getElementById("uploadCategoryMediaBtn");
const categoryUploadMessage = document.getElementById("categoryUploadMessage");
const categoryMediaList = document.getElementById("categoryMediaList");

let currentSelectedEvent = null;

// ======================================================
// AUTH CHECK
// ======================================================
async function checkAuth() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = "login.html";
    }
}
checkAuth();

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        await supabase.auth.signOut();
        window.location.href = "login.html";
    });
}

// ======================================================
// LOAD DROPDOWN & AUTO-SELECT
// ======================================================
async function loadEventDropdown() {
    if (!eventSelect) return;

    const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading events:", error);
        return;
    }

    eventSelect.innerHTML = `<option value="">-- Select Event --</option>`;
    
    events.forEach(evt => {
        const option = document.createElement("option");
        option.value = evt.id;
        option.textContent = `${evt.event_name} ${evt.published ? "(Published)" : "(Draft)"}`;
        eventSelect.appendChild(option);
    });

    if (events.length > 0) {
        eventSelect.value = events[0].id;
        loadSelectedEventDetails(events[0].id);
    }
}
loadEventDropdown();

// ======================================================
// LOAD EVENT DETAILS FUNCTION
// ======================================================
async function loadSelectedEventDetails(eventId) {
    if (!eventId) {
        if (eventManagementPanel) eventManagementPanel.style.display = "none";
        currentSelectedEvent = null;
        return;
    }

    const { data: evt, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !evt) {
        if (eventManagementMessage) eventManagementMessage.textContent = "Failed to fetch event details.";
        return;
    }

    currentSelectedEvent = evt;
    if (editEventName) editEventName.value = evt.event_name || "";
    if (editEventDate) editEventDate.value = evt.event_date || "";
    if (editLocation) editLocation.value = evt.location || "";
    if (editDescription) editDescription.value = evt.description || "";
    if (editBudget) editBudget.value = evt.budget || "";
    if (editShowBudget) editShowBudget.checked = !!evt.show_budget;

    // Cover Image Preview Setup
    if (editCoverPreview) {
        if (evt.cover_image_url) {
            editCoverPreview.innerHTML = `<img src="${evt.cover_image_url}" style="max-height: 120px; border-radius: 6px; border: 1px solid #ddd; margin-top: 5px;">`;
        } else {
            editCoverPreview.innerHTML = `<small style="color:#888;">No cover photo set for this event.</small>`;
        }
    }

    if (eventStatus) eventStatus.textContent = `Status: ${evt.published ? "🟢 Published" : "🔴 Draft"}`;
    if (eventManagementPanel) eventManagementPanel.style.display = "block";

    loadCategoriesForEvent(evt.id);
}

if (eventSelect) {
    eventSelect.addEventListener("change", () => {
        loadSelectedEventDetails(eventSelect.value);
    });
}

// ======================================================
// CREATE EVENT
// ======================================================
if (eventForm) {
    eventForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        message.textContent = "Creating event...";

        const eventName = document.getElementById("eventName").value;
        const eventDate = document.getElementById("eventDate").value;
        const location = document.getElementById("location").value;
        const description = document.getElementById("description").value;
        const budget = document.getElementById("budget").value;
        const showBudget = document.getElementById("showBudget").checked;

        const { data, error } = await supabase.from("events").insert([
            {
                event_name: eventName,
                event_date: eventDate,
                location: location,
                description: description,
                budget: budget ? parseFloat(budget) : null,
                show_budget: showBudget,
                published: false
            }
        ]).select();

        if (error) {
            message.textContent = "Error: " + error.message;
        } else {
            message.textContent = "Event created successfully!";
            eventForm.reset();
            loadEventDropdown();
        }
    });
}

// ======================================================
// SAVE / PUBLISH / UNPUBLISH / DELETE
// ======================================================
if (saveEventBtn) {
    saveEventBtn.addEventListener("click", async () => {
        if (!currentSelectedEvent) return;
        eventStatus.textContent = "Saving changes...";

        let coverUrl = currentSelectedEvent.cover_image_url || null;

        // Cover Photo Upload Logic
        if (editEventCoverInput && editEventCoverInput.files.length > 0) {
            const file = editEventCoverInput.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `cover_${currentSelectedEvent.id}_${Date.now()}.${fileExt}`;
            const filePath = `event_covers/${fileName}`;

            const { error: uploadErr } = await supabase.storage
                .from("event-media")
                .upload(filePath, file, { cacheControl: '0', upsert: true });

            if (!uploadErr) {
                const { data: urlData } = supabase.storage
                    .from("event-media")
                    .getPublicUrl(filePath);
                coverUrl = urlData.publicUrl;
            } else {
                console.error("Cover Upload Error:", uploadErr);
            }
        }

        const { error } = await supabase.from("events").update({
            event_name: editEventName.value,
            event_date: editEventDate.value,
            location: editLocation.value,
            description: editDescription.value,
            budget: editBudget.value ? parseFloat(editBudget.value) : null,
            show_budget: editShowBudget.checked,
            cover_image_url: coverUrl
        }).eq("id", currentSelectedEvent.id);

        if (!error) {
            eventStatus.textContent = "Changes saved! ✅";
            if (editEventCoverInput) editEventCoverInput.value = "";
            loadEventDropdown();
        } else {
            eventStatus.textContent = "Error: " + error.message;
        }
    });
}

if (publishEventBtn) {
    publishEventBtn.addEventListener("click", async () => {
        if (!currentSelectedEvent) return;
        const { error } = await supabase.from("events").update({ published: true }).eq("id", currentSelectedEvent.id);
        if (!error) {
            eventStatus.textContent = "Event Published! 🟢";
            currentSelectedEvent.published = true;
            loadEventDropdown();
        }
    });
}

if (unpublishEventBtn) {
    unpublishEventBtn.addEventListener("click", async () => {
        if (!currentSelectedEvent) return;
        const { error } = await supabase.from("events").update({ published: false }).eq("id", currentSelectedEvent.id);
        if (!error) {
            eventStatus.textContent = "Event Unpublished (Draft) 🔴";
            currentSelectedEvent.published = false;
            loadEventDropdown();
        }
    });
}

if (deleteEventBtn) {
    deleteEventBtn.addEventListener("click", async () => {
        if (!currentSelectedEvent) return;
        if (!confirm("Are you sure you want to delete this event?")) return;

        const { error } = await supabase.from("events").delete().eq("id", currentSelectedEvent.id);
        if (!error) {
            alert("Event deleted successfully!");
            eventManagementPanel.style.display = "none";
            loadEventDropdown();
        }
    });
}

// ======================================================
// HOME HERO PHOTO MANAGEMENT
// ======================================================
if (uploadHeroPhotoBtn) {
    uploadHeroPhotoBtn.addEventListener("click", async () => {
        const file = heroPhotoInput ? heroPhotoInput.files[0] : null;
        if (!file) {
            if (heroPhotoMessage) heroPhotoMessage.textContent = "Please select an image file first.";
            return;
        }

        if (heroPhotoMessage) heroPhotoMessage.textContent = "Uploading hero photo...";

        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `hero_bg_${Date.now()}.${fileExt}`;
            const filePath = `hero/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from("event-media")
                .upload(filePath, file, { cacheControl: '0', upsert: true });

            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage
                .from("event-media")
                .getPublicUrl(filePath);

            const newHeroUrl = urlData.publicUrl;

            const { error: dbError } = await supabase
                .from("site_settings")
                .upsert({ key: "hero_image_url", value: newHeroUrl }, { onConflict: "key" });

            if (dbError) throw dbError;

            if (heroPhotoMessage) heroPhotoMessage.textContent = "Hero photo updated successfully! ✅";
            if (heroPhotoInput) heroPhotoInput.value = "";

        } catch (err) {
            console.error("Hero Upload Error:", err);
            if (heroPhotoMessage) heroPhotoMessage.textContent = "Hero photo upload failed: " + err.message;
        }
    });
}

// ======================================================
// CATEGORIES & MEDIA
// ======================================================
async function loadCategoriesForEvent(eventId) {
    const { data: categories, error } = await supabase.from("event_categories").select("*").eq("event_id", eventId);

    if (error) return;

    if (categoryList) categoryList.innerHTML = "";
    if (categorySelect) categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;

    categories.forEach(cat => {
        if (categoryList) {
            const item = document.createElement("div");
            item.className = "category-item";
            item.innerHTML = `
                <span>${cat.category_name}</span>
                <button class="delete-category-btn" data-id="${cat.id}">Delete</button>
            `;
            categoryList.appendChild(item);
        }

        if (categorySelect) {
            const opt = document.createElement("option");
            opt.value = cat.id;
            opt.textContent = cat.category_name;
            categorySelect.appendChild(opt);
        }
    });

    if (categories.length > 0 && categorySelect) {
        categorySelect.value = categories[0].id;
        loadCategoryMedia(categories[0].id);
    }

    document.querySelectorAll(".delete-category-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const catId = e.target.getAttribute("data-id");
            if (confirm("Delete this category?")) {
                await supabase.from("event_categories").delete().eq("id", catId);
                loadCategoriesForEvent(eventId);
            }
        });
    });
}

if (addCategoryBtn) {
    addCategoryBtn.addEventListener("click", async () => {
        if (!currentSelectedEvent) {
            if (categoryMessage) categoryMessage.textContent = "Please select an event first.";
            return;
        }
        const name = categoryNameInput.value.trim();
        if (!name) return;

        const { error } = await supabase.from("event_categories").insert([
            { event_id: currentSelectedEvent.id, category_name: name }
        ]);

        if (!error) {
            categoryNameInput.value = "";
            loadCategoriesForEvent(currentSelectedEvent.id);
        }
    });
}

if (categorySelect) {
    categorySelect.addEventListener("change", () => {
        loadCategoryMedia(categorySelect.value);
    });
}

if (uploadCategoryMediaBtn) {
    uploadCategoryMediaBtn.addEventListener("click", async () => {
        const categoryId = categorySelect.value;
        if (!categoryId || !currentSelectedEvent) {
            categoryUploadMessage.textContent = "Select Category first.";
            return;
        }

        const photos = categoryPhotos ? Array.from(categoryPhotos.files) : [];
        const videos = categoryVideos ? Array.from(categoryVideos.files) : [];

        if (photos.length === 0 && videos.length === 0) {
            categoryUploadMessage.textContent = "Select at least one photo or video.";
            return;
        }

        categoryUploadMessage.textContent = "Uploading media...";

        try {
            for (const file of photos) {
                const filePath = `events/${currentSelectedEvent.id}/${Date.now()}_${file.name}`;
                await supabase.storage.from("event-media").upload(filePath, file);
                const { data: urlData } = supabase.storage.from("event-media").getPublicUrl(filePath);

                await supabase.from("event_media").insert([
                    { event_id: currentSelectedEvent.id, category_id: categoryId, media_type: "photo", file_url: urlData.publicUrl }
                ]);
            }

            for (const file of videos) {
                const filePath = `events/${currentSelectedEvent.id}/${Date.now()}_${file.name}`;
                await supabase.storage.from("event-media").upload(filePath, file);
                const { data: urlData } = supabase.storage.from("event-media").getPublicUrl(filePath);

                await supabase.from("event_media").insert([
                    { event_id: currentSelectedEvent.id, category_id: categoryId, media_type: "video", file_url: urlData.publicUrl }
                ]);
            }

            categoryUploadMessage.textContent = "Uploaded successfully! ✅";
            if (categoryPhotos) categoryPhotos.value = "";
            if (categoryVideos) categoryVideos.value = "";
            loadCategoryMedia(categoryId);
        } catch (err) {
            categoryUploadMessage.textContent = "Error: " + err.message;
        }
    });
}

async function loadCategoryMedia(categoryId) {
    if (!categoryId || !categoryMediaList) return;

    categoryMediaList.innerHTML = "Loading media...";

    const { data: mediaItems, error } = await supabase
        .from("event_media")
        .select("*")
        .eq("category_id", categoryId);

    if (error || !mediaItems || mediaItems.length === 0) {
        categoryMediaList.innerHTML = `<div class="no-media">No uploaded media found for this category.</div>`;
        return;
    }

    categoryMediaList.innerHTML = "";

    mediaItems.forEach(item => {
        const card = document.createElement("div");
        card.className = "admin-media-card";

        if (item.media_type === "photo" || item.media_type === "image") {
            card.innerHTML = `
                <img src="${item.file_url}" alt="Media">
                <div class="admin-media-info">
                    <button class="delete-media-btn" data-id="${item.id}">Delete Photo</button>
                </div>
            `;
        } else {
            card.innerHTML = `
                <video src="${item.file_url}" controls></video>
                <div class="admin-media-info">
                    <button class="delete-media-btn" data-id="${item.id}">Delete Video</button>
                </div>
            `;
        }
        categoryMediaList.appendChild(card);
    });

    document.querySelectorAll(".delete-media-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const mediaId = e.target.getAttribute("data-id");
            if (confirm("Delete this media?")) {
                await supabase.from("event_media").delete().eq("id", mediaId);
                loadCategoryMedia(categoryId);
            }
        });
    });
}