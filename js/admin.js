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
// LOAD DROPDOWN & AUTO-SELECT (EVENTS)
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

    if (editCoverPreview) {
        if (evt.cover_image_url) {
            editCoverPreview.innerHTML = `<img src="${evt.cover_image_url}" style="max-height: 120px; border-radius: 6px; border: 1px solid #ddd; margin-top: 5px;">`;
        } else {
            editCoverPreview.innerHTML = `<small style="color:#888;">No cover photo set for this event.</small>`;
        }
    }

    if (eventStatus) eventStatus.textContent = `Status: ${evt.published ? "🟢 Published" : "🔴 Draft"}`;
    if (eventManagementPanel) eventManagementPanel.style.display = "block";
}

if (eventSelect) {
    eventSelect.addEventListener("change", () => {
        loadSelectedEventDetails(eventSelect.value);
    });
}

// CREATE EVENT
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

        const { error } = await supabase.from("events").insert([
            {
                event_name: eventName,
                event_date: eventDate,
                location: location,
                description: description,
                budget: budget ? parseFloat(budget) : null,
                show_budget: showBudget,
                published: false
            }
        ]);

        if (error) {
            message.textContent = "Error: " + error.message;
        } else {
            message.textContent = "Event created successfully!";
            eventForm.reset();
            loadEventDropdown();
        }
    });
}

// SAVE / PUBLISH / UNPUBLISH / DELETE EVENT
if (saveEventBtn) {
    saveEventBtn.addEventListener("click", async () => {
        if (!currentSelectedEvent) return;
        eventStatus.textContent = "Saving changes...";

        let coverUrl = currentSelectedEvent.cover_image_url || null;

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

            const { error: dbError } = await supabase
                .from("site_settings")
                .upsert({ key: "hero_image_url", value: urlData.publicUrl }, { onConflict: "key" });

            if (dbError) throw dbError;

            if (heroPhotoMessage) heroPhotoMessage.textContent = "Hero photo updated successfully! ✅";
            if (heroPhotoInput) heroPhotoInput.value = "";
        } catch (err) {
            if (heroPhotoMessage) heroPhotoMessage.textContent = "Hero photo upload failed: " + err.message;
        }
    });
}

// ======================================================
// INDEPENDENT SERVICE CATEGORIES MANAGEMENT
// ======================================================
const addServiceCategoryForm = document.getElementById("addServiceCategoryForm");
const adminServiceCatsList = document.getElementById("adminServiceCatsList");

async function loadAdminServiceCategories() {
    if (!adminServiceCatsList) return;

    const { data: categories, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error loading service categories:", error);
        return;
    }

    adminServiceCatsList.innerHTML = "";
    if (!categories || categories.length === 0) {
        adminServiceCatsList.innerHTML = `<div style="color: #a0a0a0; font-size: 13px;">No service categories created yet.</div>`;
        return;
    }

    categories.forEach(cat => {
        const item = document.createElement("div");
        item.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: #121212; padding: 10px 15px; border-radius: 6px; border: 1px solid #2a2a2a; color:#fff; margin-bottom: 8px;";
        item.innerHTML = `
            <div>
                <strong style="color: #c5a059;">${cat.icon || "✨"} ${cat.name}</strong> 
                <span style="color: #888; font-size: 12px; margin-left: 10px;">(slug: ${cat.slug})</span>
            </div>
            <button onclick="deleteServiceCategory('${cat.id}')" style="background: #ff4d4d; color: #fff; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 12px;">Delete</button>
        `;
        adminServiceCatsList.appendChild(item);
    });
}

addServiceCategoryForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("catName").value.trim();
    const slug = document.getElementById("catSlug").value.trim().toLowerCase().replace(/\s+/g, '-');
    const icon = document.getElementById("catIcon").value.trim() || "✨";
    const description = document.getElementById("catDesc").value.trim();
    const catImageFile = document.getElementById("catImageFile");
    const catBgFile = document.getElementById("catBgFile"); // Category Background Image

    let imageUrl = "";
    if (catImageFile && catImageFile.files && catImageFile.files[0]) {
        const file = catImageFile.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `cat_${slug}_${Date.now()}.${fileExt}`;
        const filePath = `categories/${fileName}`;

        const { error: uploadErr } = await supabase.storage
            .from("event-media")
            .upload(filePath, file, { cacheControl: '0', upsert: true });

        if (!uploadErr) {
            const { data: urlData } = supabase.storage
                .from("event-media")
                .getPublicUrl(filePath);
            imageUrl = urlData.publicUrl;
        } else {
            alert("Banner image upload failed: " + uploadErr.message);
            return;
        }
    }

    let bgImageUrl = "";
    if (catBgFile && catBgFile.files && catBgFile.files[0]) {
        const file = catBgFile.files[0];
        const fileExt = file.name.split('.').pop();
        const fileName = `cat_bg_${slug}_${Date.now()}.${fileExt}`;
        const filePath = `categories/${fileName}`;

        const { error: uploadErr } = await supabase.storage
            .from("event-media")
            .upload(filePath, file, { cacheControl: '0', upsert: true });

        if (!uploadErr) {
            const { data: urlData } = supabase.storage
                .from("event-media")
                .getPublicUrl(filePath);
            bgImageUrl = urlData.publicUrl;
        } else {
            alert("Background image upload failed: " + uploadErr.message);
            return;
        }
    }

    if (!name || !slug) return;

    const { error } = await supabase
        .from("service_categories")
        .insert([{ name, slug, icon, description, image_url: imageUrl, bg_image: bgImageUrl }]);

    if (error) {
        alert("Failed to add category: " + error.message);
    } else {
        alert("Category added successfully with images! ✅");
        addServiceCategoryForm.reset();
        document.getElementById("catIcon").value = "✨";
        loadAdminServiceCategories();
        loadAdminPackageDropdowns();
    }
});

window.deleteServiceCategory = async (id) => {
    if (confirm("Are you sure you want to delete this service category?")) {
        const { error } = await supabase
            .from("service_categories")
            .delete()
            .eq("id", id);

        if (error) {
            alert("Delete failed: " + error.message);
        } else {
            loadAdminServiceCategories();
            loadAdminPackageDropdowns();
        }
    }
};

// ======================================================
// LOAD CATEGORIES & PACKAGES INTO ADMIN DROPDOWNS
// ======================================================
async function loadAdminPackageDropdowns() {
    const categorySelect = document.getElementById("pkgCategorySlug");
    const packageSelect = document.getElementById("pkgSelectDropdown");

    if (categorySelect) {
        const { data: categories, error } = await supabase
            .from("service_categories")
            .select("slug, name")
            .order("created_at", { ascending: false });

        if (!error && categories) {
            categorySelect.innerHTML = `<option value="">-- Select Category --</option>`;
            categories.forEach(cat => {
                categorySelect.innerHTML += `<option value="${cat.slug}">${cat.name}</option>`;
            });
        }
    }

    if (packageSelect) {
        const { data: packages, error } = await supabase
            .from("packages")
            .select("id, package_name, category_slug")
            .order("created_at", { ascending: false });

        if (!error && packages) {
            packageSelect.innerHTML = `<option value="">-- Select Package --</option>`;
            packages.forEach(pkg => {
                packageSelect.innerHTML += `<option value="${pkg.id}">${pkg.package_name} (${pkg.category_slug})</option>`;
            });
        }
    }
}

// ======================================================
// HANDLE ADD PACKAGE FORM SUBMISSION
// ======================================================
const addPackageForm = document.getElementById("addPackageForm");
if (addPackageForm) {
    addPackageForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const category_slug = document.getElementById("pkgCategorySlug").value;
        const package_name = document.getElementById("pkgName").value;
        const description = document.getElementById("pkgDesc").value;
        const pkgImageFile = document.getElementById("pkgImageFile");
        const pkgBgFile = document.getElementById("pkgBgFile"); // Package Background Image

        let imageUrl = "";
        if (pkgImageFile && pkgImageFile.files && pkgImageFile.files[0]) {
            const file = pkgImageFile.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `pkg_${Date.now()}.${fileExt}`;
            const filePath = `packages/${fileName}`;

            const { error: uploadErr } = await supabase.storage
                .from("event-media")
                .upload(filePath, file, { cacheControl: '0', upsert: true });

            if (!uploadErr) {
                const { data: urlData } = supabase.storage
                    .from("event-media")
                    .getPublicUrl(filePath);
                imageUrl = urlData.publicUrl;
            } else {
                alert("Cover image upload failed: " + uploadErr.message);
                return;
            }
        }

        let bgImageUrl = "";
        if (pkgBgFile && pkgBgFile.files && pkgBgFile.files[0]) {
            const file = pkgBgFile.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `pkg_bg_${Date.now()}.${fileExt}`;
            const filePath = `packages/${fileName}`;

            const { error: uploadErr } = await supabase.storage
                .from("event-media")
                .upload(filePath, file, { cacheControl: '0', upsert: true });

            if (!uploadErr) {
                const { data: urlData } = supabase.storage
                    .from("event-media")
                    .getPublicUrl(filePath);
                bgImageUrl = urlData.publicUrl;
            } else {
                alert("Background image upload failed: " + uploadErr.message);
                return;
            }
        }

        const { error } = await supabase
            .from("packages")
            .insert([{ category_slug, package_name, description, image_url: imageUrl, bg_image: bgImageUrl }]);

        if (error) {
            alert("Error adding package: " + error.message);
        } else {
            alert("Package added successfully with images! ✅");
            addPackageForm.reset();
            loadAdminPackageDropdowns();
        }
    });
}

// ======================================================
// HANDLE ADD PACKAGE SERVICE / CHECKLIST ITEM FORM
// ======================================================
const addPkgServiceForm = document.getElementById("addPkgServiceForm");
if (addPkgServiceForm) {
    addPkgServiceForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const package_id = document.getElementById("pkgSelectDropdown").value;
        const title = document.getElementById("pkgServiceTitle").value;
        const icon = document.getElementById("pkgServiceIcon").value || "✨";

        const { error } = await supabase
            .from("package_services")
            .insert([{ package_id, title, icon }]);

        if (error) {
            alert("Error adding service item: " + error.message);
        } else {
            alert("Service checklist item added successfully! ✅");
            addPkgServiceForm.reset();
        }
    });
}

// Initial Loads
loadAdminServiceCategories();
loadAdminPackageDropdowns();