import { supabase } from "./supabase.js";

console.log("ADMIN JS LOADED");

// ======================================================
// ELEMENTS
// ======================================================

const eventForm = document.getElementById("eventForm");
const message = document.getElementById("message");
const uploadMessage = document.getElementById("uploadMessage");
const logoutBtn = document.getElementById("logoutBtn");

const eventSelect = document.getElementById("eventSelect");

const categoryName = document.getElementById("categoryName");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const categoryMessage = document.getElementById("categoryMessage");
const categoryList = document.getElementById("categoryList");
const categorySelect = document.getElementById("categorySelect");

const uploadCategoryMediaBtn =
    document.getElementById("uploadCategoryMediaBtn");

const categoryUploadMessage =
    document.getElementById("categoryUploadMessage");

const categoryMediaMessage =
    document.getElementById("categoryMediaMessage");

const categoryMediaList =
    document.getElementById("categoryMediaList");

// ======================================================
// EVENT MANAGEMENT
// ======================================================

const eventManagementMessage =
    document.getElementById("eventManagementMessage");

const eventManagementPanel =
    document.getElementById("eventManagementPanel");

const editEventName =
    document.getElementById("editEventName");

const editEventDate =
    document.getElementById("editEventDate");

const editLocation =
    document.getElementById("editLocation");

const editDescription =
    document.getElementById("editDescription");

const editBudget =
    document.getElementById("editBudget");

const editShowBudget =
    document.getElementById("editShowBudget");

const saveEventBtn =
    document.getElementById("saveEventBtn");

const cancelEditBtn =
    document.getElementById("cancelEditBtn");

const publishEventBtn =
    document.getElementById("publishEventBtn");

const unpublishEventBtn =
    document.getElementById("unpublishEventBtn");

const deleteEventBtn =
    document.getElementById("deleteEventBtn");

const eventStatus =
    document.getElementById("eventStatus");

let currentEvent = null;

// ======================================================
// DEBUG
// ======================================================

console.log("Event form:", eventForm);
console.log("Event select:", eventSelect);
console.log("Category select:", categorySelect);
console.log("Upload category button:", uploadCategoryMediaBtn);
console.log("Category media list:", categoryMediaList);
console.log("Event management panel:", eventManagementPanel);

// ======================================================
// AUTH CHECK
// ======================================================

async function checkAdminSession() {

    const { data, error } =
        await supabase.auth.getSession();

    if (error) {

        console.error(
            "SESSION CHECK ERROR:",
            error
        );

        window.location.href = "login.html";

        return false;
    }

    if (!data?.session) {

        console.warn(
            "NO ACTIVE ADMIN SESSION"
        );

        window.location.href = "login.html";

        return false;
    }

    console.log(
        "ADMIN SESSION VERIFIED ✅"
    );

    return true;
}

// ======================================================
// CREATE EVENT
// ======================================================

if (eventForm) {

    eventForm.addEventListener(
        "submit",
        async (e) => {

            e.preventDefault();

            if (message) {
                message.textContent =
                    "Creating event...";
            }

            const eventName =
                document
                    .getElementById("eventName")
                    ?.value
                    .trim();

            const eventDate =
                document
                    .getElementById("eventDate")
                    ?.value;

            const location =
                document
                    .getElementById("location")
                    ?.value
                    .trim();

            const description =
                document
                    .getElementById("description")
                    ?.value
                    .trim();

            const budget =
                document
                    .getElementById("budget")
                    ?.value;

            const showBudget =
                document
                    .getElementById("showBudget")
                    ?.checked;

            if (!eventName) {

                if (message) {
                    message.textContent =
                        "Please enter event name.";
                }

                return;
            }

            const { data: event, error } =
                await supabase
                    .from("events")
                    .insert([
                        {
                            event_name: eventName,
                            event_date: eventDate || null,
                            location: location || null,
                            description: description || null,
                            budget:
                                budget !== ""
                                    ? Number(budget)
                                    : null,
                            show_budget:
                                Boolean(showBudget),
                            published: false
                        }
                    ])
                    .select("*")
                    .maybeSingle();

            if (error) {

                console.error(
                    "EVENT CREATION ERROR:",
                    error
                );

                if (message) {
                    message.textContent =
                        "Error creating event: " +
                        error.message;
                }

                return;
            }

            if (!event) {

                if (message) {
                    message.textContent =
                        "Event was not created.";
                }

                return;
            }

            console.log(
                "EVENT CREATED:",
                event
            );

            currentEvent = event;

            if (message) {

                message.textContent =
                    "Event created successfully! ✅";

                const eventLink =
                    document.createElement("a");

                eventLink.href =
                    "./event.html?id=" +
                    event.id;

                eventLink.textContent =
                    "Open Event Page";

                eventLink.target = "_blank";

                eventLink.className =
                    "primary-button";

                eventLink.style.display =
                    "inline-block";

                eventLink.style.marginTop =
                    "10px";

                message.appendChild(
                    document.createElement("br")
                );

                message.appendChild(
                    eventLink
                );
            }

            await loadEvents();

            if (eventSelect) {
                eventSelect.value =
                    event.id;
            }

            await loadCategories(
                event.id
            );

            loadEventManagementPanel(
                event
            );

            if (categoryMessage) {
                categoryMessage.textContent =
                    "Event selected. Add categories below.";
            }

            eventForm.reset();
        }
    );
}

// ======================================================
// LOAD EVENTS
// ======================================================

async function loadEvents() {

    if (!eventSelect) {
        return;
    }

    console.log(
        "Loading existing events..."
    );

    const { data: events, error } =
        await supabase
            .from("events")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

    if (error) {

        console.error(
            "EVENT LOAD ERROR:",
            error
        );

        return;
    }

    console.log(
        "EXISTING EVENTS:",
        events
    );

    eventSelect.innerHTML =
        '<option value="">-- Select Event --</option>';

    (events || []).forEach(
        (event) => {

            const option =
                document.createElement("option");

            option.value =
                event.id;

            option.textContent =
                event.event_name +
                (
                    event.published
                        ? " 🟢 Published"
                        : " 🔴 Draft"
                );

            eventSelect.appendChild(
                option
            );
        }
    );
}

// ======================================================
// SELECT EVENT
// ======================================================

if (eventSelect) {

    eventSelect.addEventListener(
        "change",
        async () => {

            const eventId =
                eventSelect.value;

            if (!eventId) {

                currentEvent = null;

                clearEventManagement();

                if (categorySelect) {
                    categorySelect.innerHTML =
                        '<option value="">-- Select Category --</option>';
                }

                if (categoryList) {
                    categoryList.innerHTML = "";
                }

                if (categoryMediaList) {
                    categoryMediaList.innerHTML = "";
                }

                return;
            }

            console.log(
                "SELECTED EVENT ID:",
                eventId
            );

            const { data: event, error } =
                await supabase
                    .from("events")
                    .select("*")
                    .eq("id", eventId)
                    .maybeSingle();

            if (error) {

                console.error(
                    "SELECT EVENT ERROR:",
                    error
                );

                return;
            }

            if (!event) {

                console.error(
                    "EVENT NOT FOUND"
                );

                return;
            }

            currentEvent = event;

            console.log(
                "CURRENT EVENT:",
                currentEvent
            );

            loadEventManagementPanel(
                event
            );

            await loadCategories(
                event.id
            );

            if (categoryMessage) {
                categoryMessage.textContent =
                    "Selected event: " +
                    event.event_name;
            }
        }
    );
}

// ======================================================
// LOAD EVENT MANAGEMENT PANEL
// ======================================================

function loadEventManagementPanel(event) {

    if (!event) {
        return;
    }

    if (eventManagementPanel) {
        eventManagementPanel.style.display =
            "block";
    }

    if (editEventName) {
        editEventName.value =
            event.event_name || "";
    }

    if (editEventDate) {
        editEventDate.value =
            event.event_date || "";
    }

    if (editLocation) {
        editLocation.value =
            event.location || "";
    }

    if (editDescription) {
        editDescription.value =
            event.description || "";
    }

    if (editBudget) {
        editBudget.value =
            event.budget ?? "";
    }

    if (editShowBudget) {
        editShowBudget.checked =
            Boolean(event.show_budget);
    }

    updateEventStatus(event);

    if (eventManagementMessage) {
        eventManagementMessage.textContent =
            "Event selected.";
    }
}

// ======================================================
// CLEAR EVENT MANAGEMENT
// ======================================================

function clearEventManagement() {

    if (eventManagementPanel) {
        eventManagementPanel.style.display =
            "none";
    }

    if (eventManagementMessage) {
        eventManagementMessage.textContent =
            "";
    }

    if (eventStatus) {
        eventStatus.textContent =
            "";
    }
}

// ======================================================
// UPDATE STATUS
// ======================================================

function updateEventStatus(event) {

    if (!eventStatus) {
        return;
    }

    if (event.published) {

        eventStatus.textContent =
            "Status: 🟢 PUBLISHED";

        eventStatus.style.color =
            "green";

    } else {

        eventStatus.textContent =
            "Status: 🔴 DRAFT / UNPUBLISHED";

        eventStatus.style.color =
            "#d32f2f";
    }
}

// ======================================================
// SAVE EVENT EDIT
// IMPORTANT: NO .single()
// ======================================================

if (saveEventBtn) {

    saveEventBtn.addEventListener(
        "click",
        async () => {

            if (!currentEvent) {

                alert(
                    "Please select an event first."
                );

                return;
            }

            const name =
                editEventName?.value.trim();

            const date =
                editEventDate?.value;

            const location =
                editLocation?.value.trim();

            const description =
                editDescription?.value.trim();

            const budget =
                editBudget?.value;

            const showBudget =
                editShowBudget?.checked;

            if (!name) {

                alert(
                    "Please enter event name."
                );

                return;
            }

            if (eventManagementMessage) {
                eventManagementMessage.textContent =
                    "Saving changes...";
            }

            const { data, error } =
                await supabase
                    .from("events")
                    .update({
                        event_name: name,
                        event_date: date || null,
                        location: location || null,
                        description: description || null,
                        budget:
                            budget !== ""
                                ? Number(budget)
                                : null,
                        show_budget:
                            Boolean(showBudget)
                    })
                    .eq(
                        "id",
                        currentEvent.id
                    )
                    .select("*");

            if (error) {

                console.error(
                    "EVENT UPDATE ERROR:",
                    error
                );

                if (eventManagementMessage) {
                    eventManagementMessage.textContent =
                        "Update error: " +
                        error.message;
                }

                return;
            }

            if (!data || data.length === 0) {

                console.error(
                    "EVENT UPDATE RETURNED 0 ROWS"
                );

                if (eventManagementMessage) {
                    eventManagementMessage.textContent =
                        "Event was not updated. Check Supabase UPDATE policy.";
                }

                return;
            }

            currentEvent =
                data[0];

            console.log(
                "EVENT UPDATED:",
                currentEvent
            );

            loadEventManagementPanel(
                currentEvent
            );

            await loadEvents();

            if (eventSelect) {
                eventSelect.value =
                    currentEvent.id;
            }

            if (eventManagementMessage) {
                eventManagementMessage.textContent =
                    "Event updated successfully! ✅";
            }
        }
    );
}

// ======================================================
// CANCEL EDIT
// ======================================================

if (cancelEditBtn) {

    cancelEditBtn.addEventListener(
        "click",
        () => {

            if (!currentEvent) {
                return;
            }

            loadEventManagementPanel(
                currentEvent
            );

            if (eventManagementMessage) {
                eventManagementMessage.textContent =
                    "Changes cancelled.";
            }
        }
    );
}

// ======================================================
// PUBLISH
// ======================================================

if (publishEventBtn) {

    publishEventBtn.addEventListener(
        "click",
        async () => {

            await setEventPublished(true);
        }
    );
}

// ======================================================
// UNPUBLISH
// ======================================================

if (unpublishEventBtn) {

    unpublishEventBtn.addEventListener(
        "click",
        async () => {

            await setEventPublished(false);
        }
    );
}

// ======================================================
// SET PUBLISHED
// IMPORTANT: NO .single()
// ======================================================

async function setEventPublished(published) {

    if (!currentEvent) {

        alert(
            "Please select an event first."
        );

        return;
    }

    const actionText =
        published
            ? "publish"
            : "unpublish";

    const confirmed =
        confirm(
            `Are you sure you want to ${actionText} "${currentEvent.event_name}"?`
        );

    if (!confirmed) {
        return;
    }

    if (eventManagementMessage) {
        eventManagementMessage.textContent =
            published
                ? "Publishing event..."
                : "Unpublishing event...";
    }

    const { data, error } =
        await supabase
            .from("events")
            .update({
                published: published
            })
            .eq(
                "id",
                currentEvent.id
            )
            .select("*");

    if (error) {

        console.error(
            "PUBLISH STATUS ERROR:",
            error
        );

        if (eventManagementMessage) {
            eventManagementMessage.textContent =
                "Status update error: " +
                error.message;
        }

        return;
    }

    if (!data || data.length === 0) {

        console.error(
            "PUBLISH UPDATE RETURNED 0 ROWS"
        );

        if (eventManagementMessage) {
            eventManagementMessage.textContent =
                "Status was not changed. Check Supabase UPDATE policy.";
        }

        return;
    }

    currentEvent =
        data[0];

    updateEventStatus(
        currentEvent
    );

    await loadEvents();

    if (eventSelect) {
        eventSelect.value =
            currentEvent.id;
    }

    if (eventManagementMessage) {

        eventManagementMessage.textContent =
            published
                ? "Event published successfully! 🟢"
                : "Event unpublished successfully! 🔴";
    }

    console.log(
        "PUBLISHED STATUS UPDATED:",
        currentEvent
    );
}

// ======================================================
// GET STORAGE PATH
// ======================================================

function getStoragePath(fileUrl) {

    if (!fileUrl) {
        return null;
    }

    const marker =
        "/storage/v1/object/public/event-media/";

    const index =
        fileUrl.indexOf(marker);

    if (index === -1) {

        console.warn(
            "Could not find storage path:",
            fileUrl
        );

        return null;
    }

    return fileUrl.substring(
        index + marker.length
    );
}

// ======================================================
// DELETE EVENT
// ======================================================

async function deleteEvent() {

    if (!currentEvent) {

        alert(
            "Please select an event first."
        );

        return;
    }

    const eventId =
        currentEvent.id;

    const eventName =
        currentEvent.event_name ||
        "this event";

    const confirmed =
        confirm(
            `DELETE EVENT?\n\n` +
            `"${eventName}"\n\n` +
            `This will delete:\n` +
            `• Event\n` +
            `• Categories\n` +
            `• Photos\n` +
            `• Videos\n\n` +
            `This action cannot be undone.`
        );

    if (!confirmed) {
        return;
    }

    if (eventManagementMessage) {
        eventManagementMessage.textContent =
            "Deleting event...";
    }

    try {

        // --------------------------------------------------
        // 1. LOAD EVENT MEDIA
        // --------------------------------------------------

        const {
            data: media,
            error: mediaLoadError
        } = await supabase
            .from("event_media")
            .select("*")
            .eq(
                "event_id",
                eventId
            );

        if (mediaLoadError) {

            console.error(
                "EVENT MEDIA LOAD ERROR:",
                mediaLoadError
            );

            alert(
                "Could not load event media:\n\n" +
                mediaLoadError.message
            );

            return;
        }

        // --------------------------------------------------
        // 2. STORAGE PATHS
        // --------------------------------------------------

        const filePaths = [];

        (media || []).forEach(
            (item) => {

                const path =
                    getStoragePath(
                        item.file_url
                    );

                if (path) {
                    filePaths.push(path);
                }
            }
        );

        console.log(
            "EVENT STORAGE FILES:",
            filePaths
        );

        // --------------------------------------------------
        // 3. DELETE MEDIA DATABASE RECORDS
        // --------------------------------------------------

        const {
            error: mediaDeleteError
        } = await supabase
            .from("event_media")
            .delete()
            .eq(
                "event_id",
                eventId
            );

        if (mediaDeleteError) {

            console.error(
                "EVENT MEDIA DELETE ERROR:",
                mediaDeleteError
            );

            alert(
                "Could not delete event media:\n\n" +
                mediaDeleteError.message
            );

            return;
        }

        // --------------------------------------------------
        // 4. DELETE CATEGORIES
        // --------------------------------------------------

        const {
            error: categoryDeleteError
        } = await supabase
            .from("event_categories")
            .delete()
            .eq(
                "event_id",
                eventId
            );

        if (categoryDeleteError) {

            console.error(
                "CATEGORY DELETE ERROR:",
                categoryDeleteError
            );

            alert(
                "Could not delete categories:\n\n" +
                categoryDeleteError.message
            );

            return;
        }

        // --------------------------------------------------
        // 5. DELETE EVENT
        // --------------------------------------------------

        const {
            data: deletedEvent,
            error: eventDeleteError
        } = await supabase
            .from("events")
            .delete()
            .eq(
                "id",
                eventId
            )
            .select("*");

        if (eventDeleteError) {

            console.error(
                "EVENT DELETE ERROR:",
                eventDeleteError
            );

            alert(
                "Event delete failed:\n\n" +
                eventDeleteError.message
            );

            return;
        }

        if (
            !deletedEvent ||
            deletedEvent.length === 0
        ) {

            alert(
                "Event was not deleted.\n\n" +
                "Please check the Supabase DELETE policy for events."
            );

            return;
        }

        console.log(
            "EVENT DELETED:",
            deletedEvent
        );

        // --------------------------------------------------
        // 6. DELETE STORAGE
        // --------------------------------------------------

        if (filePaths.length > 0) {

            const {
                error: storageError
            } = await supabase.storage
                .from("event-media")
                .remove(
                    filePaths
                );

            if (storageError) {

                console.error(
                    "STORAGE DELETE ERROR:",
                    storageError
                );

                alert(
                    `Event "${eventName}" was deleted, ` +
                    `but some storage files could not be removed.\n\n` +
                    storageError.message
                );
            }
        }

        // --------------------------------------------------
        // 7. CLEAR UI
        // --------------------------------------------------

        currentEvent = null;

        if (eventSelect) {
            eventSelect.value = "";
        }

        if (categorySelect) {
            categorySelect.innerHTML =
                '<option value="">-- Select Category --</option>';
        }

        if (categoryList) {
            categoryList.innerHTML = "";
        }

        if (categoryMediaList) {
            categoryMediaList.innerHTML = "";
        }

        if (categoryMessage) {
            categoryMessage.textContent =
                "Please select an event.";
        }

        if (categoryMediaMessage) {
            categoryMediaMessage.textContent = "";
        }

        clearEventManagement();

        // --------------------------------------------------
        // 8. RELOAD EVENTS
        // --------------------------------------------------

        await loadEvents();

        if (message) {
            message.textContent =
                `"${eventName}" deleted successfully! 🗑️`;
        }

        console.log(
            "EVENT DELETE COMPLETED ✅"
        );

    } catch (error) {

        console.error(
            "UNEXPECTED DELETE ERROR:",
            error
        );

        alert(
            "Unexpected delete error:\n\n" +
            error.message
        );
    }
}

// ======================================================
// DELETE EVENT BUTTON
// ======================================================

if (deleteEventBtn) {

    deleteEventBtn.addEventListener(
        "click",
        async () => {

            await deleteEvent();
        }
    );
}

// ======================================================
// LOAD CATEGORIES
// ======================================================

async function loadCategories(eventId) {

    if (!categorySelect) {
        return;
    }

    console.log(
        "Loading categories..."
    );

    const {
        data: categories,
        error
    } = await supabase
        .from("event_categories")
        .select("*")
        .eq(
            "event_id",
            eventId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "CATEGORY LOAD ERROR:",
            error
        );

        if (categoryMessage) {
            categoryMessage.textContent =
                "Category load error: " +
                error.message;
        }

        return;
    }

    console.log(
        "CATEGORIES LOADED:",
        categories
    );

    categorySelect.innerHTML =
        '<option value="">-- Select Category --</option>';

    if (categoryList) {
        categoryList.innerHTML = "";
    }

    (categories || []).forEach(
        (category) => {

            const option =
                document.createElement("option");

            option.value =
                category.id;

            option.textContent =
                category.category_name;

            categorySelect.appendChild(
                option
            );

            if (categoryList) {

                const item =
                    document.createElement("div");

                item.className =
                    "category-item";

                const title =
                    document.createElement("strong");

                title.textContent =
                    category.category_name;

                const deleteBtn =
                    document.createElement("button");

                deleteBtn.type = "button";

                deleteBtn.textContent =
                    "🗑 Delete";

                deleteBtn.className =
                    "delete-category-btn";

                deleteBtn.addEventListener(
                    "click",
                    async () => {

                        const ok =
                            confirm(
                                `Delete category "${category.category_name}"?\n\n` +
                                `All photos and videos inside this category will also be deleted.`
                            );

                        if (!ok) {
                            return;
                        }

                        await deleteCategory(
                            category.id,
                            category.category_name
                        );
                    }
                );

                item.appendChild(title);
                item.appendChild(deleteBtn);

                categoryList.appendChild(item);
            }
        }
    );

    if (categoryMessage) {

        if (!categories || categories.length === 0) {

            categoryMessage.textContent =
                "No categories yet. Add one.";

        } else {

            categoryMessage.textContent =
                `${categories.length} categor${
                    categories.length === 1
                        ? "y"
                        : "ies"
                } available.`;
        }
    }
}

// ======================================================
// ADD CATEGORY
// ======================================================

if (addCategoryBtn) {

    addCategoryBtn.addEventListener(
        "click",
        async () => {

            if (!currentEvent) {

                if (categoryMessage) {
                    categoryMessage.textContent =
                        "Please select an event first.";
                }

                return;
            }

            const name =
                categoryName?.value.trim();

            if (!name) {

                if (categoryMessage) {
                    categoryMessage.textContent =
                        "Please enter category name.";
                }

                return;
            }

            if (categoryMessage) {
                categoryMessage.textContent =
                    "Adding category...";
            }

            const {
                data: existing,
                error: checkError
            } = await supabase
                .from("event_categories")
                .select("id")
                .eq(
                    "event_id",
                    currentEvent.id
                )
                .eq(
                    "category_name",
                    name
                );

            if (checkError) {

                console.error(
                    "CATEGORY CHECK ERROR:",
                    checkError
                );

                if (categoryMessage) {
                    categoryMessage.textContent =
                        checkError.message;
                }

                return;
            }

            if (
                existing &&
                existing.length > 0
            ) {

                if (categoryMessage) {
                    categoryMessage.textContent =
                        "This category already exists.";
                }

                return;
            }

            const {
                data: category,
                error
            } = await supabase
                .from("event_categories")
                .insert([
                    {
                        event_id:
                            currentEvent.id,

                        category_name:
                            name
                    }
                ])
                .select("*")
                .maybeSingle();

            if (error) {

                console.error(
                    "CATEGORY CREATE ERROR:",
                    error
                );

                if (categoryMessage) {
                    categoryMessage.textContent =
                        "Category create error: " +
                        error.message;
                }

                return;
            }

            if (!category) {
                return;
            }

            console.log(
                "CATEGORY CREATED:",
                category
            );

            if (categoryName) {
                categoryName.value = "";
            }

            await loadCategories(
                currentEvent.id
            );

            if (categorySelect) {
                categorySelect.value =
                    category.id;
            }

            await loadCategoryMedia(
                category.id
            );

            if (categoryMessage) {
                categoryMessage.textContent =
                    `"${name}" added successfully! ✅`;
            }
        }
    );
}

// ======================================================
// CATEGORY SELECT
// ======================================================

if (categorySelect) {

    categorySelect.addEventListener(
        "change",
        async () => {

            const categoryId =
                categorySelect.value;

            if (!categoryId) {

                if (categoryMediaList) {
                    categoryMediaList.innerHTML =
                        "";
                }

                if (categoryMediaMessage) {
                    categoryMediaMessage.textContent =
                        "";
                }

                return;
            }

            await loadCategoryMedia(
                categoryId
            );
        }
    );
}

// ======================================================
// LOAD CATEGORY MEDIA
// ======================================================

async function loadCategoryMedia(categoryId) {

    if (!categoryMediaList || !categoryId) {
        return;
    }

    categoryMediaList.innerHTML = "";

    const {
        data: media,
        error
    } = await supabase
        .from("event_media")
        .select("*")
        .eq(
            "category_id",
            categoryId
        )
        .order(
            "created_at",
            {
                ascending: true
            }
        );

    if (error) {

        console.error(
            "CATEGORY MEDIA ERROR:",
            error
        );

        if (categoryMediaMessage) {
            categoryMediaMessage.textContent =
                "Media load error: " +
                error.message;
        }

        return;
    }

    if (!media || media.length === 0) {

        categoryMediaList.innerHTML =
            "<p class='no-media'>No media uploaded.</p>";

        if (categoryMediaMessage) {
            categoryMediaMessage.textContent =
                "No media uploaded.";
        }

        return;
    }

    if (categoryMediaMessage) {
        categoryMediaMessage.textContent =
            `${media.length} media file(s).`;
    }

    media.forEach(
        (item) => {

            const card =
                document.createElement("div");

            card.className =
                "admin-media-card";

            if (
                item.media_type === "video"
            ) {

                const video =
                    document.createElement("video");

                video.src =
                    item.file_url;

                video.controls = true;

                card.appendChild(video);

            } else {

                const img =
                    document.createElement("img");

                img.src =
                    item.file_url;

                img.alt =
                    "Event media";

                card.appendChild(img);
            }

            const deleteBtn =
                document.createElement("button");

            deleteBtn.type = "button";

            deleteBtn.textContent =
                "🗑 Delete";

            deleteBtn.className =
                "delete-media-btn";

            deleteBtn.addEventListener(
                "click",
                async () => {

                    const ok =
                        confirm(
                            "Delete this photo/video?"
                        );

                    if (!ok) {
                        return;
                    }

                    await deleteMedia(item);
                }
            );

            card.appendChild(deleteBtn);

            categoryMediaList.appendChild(card);
        }
    );
}

// ======================================================
// DELETE MEDIA
// ======================================================

async function deleteMedia(media) {

    if (!media || !media.id) {

        alert(
            "Invalid media item."
        );

        return;
    }

    const filePath =
        getStoragePath(
            media.file_url
        );

    const {
        data: deletedRows,
        error: databaseError
    } = await supabase
        .from("event_media")
        .delete()
        .eq(
            "id",
            media.id
        )
        .select("*");

    if (databaseError) {

        console.error(
            "MEDIA DELETE ERROR:",
            databaseError
        );

        alert(
            "Database delete failed:\n\n" +
            databaseError.message
        );

        return;
    }

    if (
        !deletedRows ||
        deletedRows.length === 0
    ) {

        alert(
            "Media was NOT deleted.\n\n" +
            "Please check event_media DELETE policy."
        );

        return;
    }

    if (filePath) {

        const {
            error: storageError
        } = await supabase.storage
            .from("event-media")
            .remove([
                filePath
            ]);

        if (storageError) {

            console.error(
                "STORAGE DELETE ERROR:",
                storageError
            );
        }
    }

    if (
        categorySelect &&
        categorySelect.value
    ) {

        await loadCategoryMedia(
            categorySelect.value
        );
    }

    if (categoryMediaMessage) {
        categoryMediaMessage.textContent =
            "Photo/video deleted successfully! 🗑️";
    }

    console.log(
        "MEDIA DELETED SUCCESSFULLY ✅"
    );
}

// ======================================================
// DELETE CATEGORY
// ======================================================

async function deleteCategory(
    categoryId,
    categoryNameValue
) {

    if (!currentEvent) {

        alert(
            "Please select an event first."
        );

        return;
    }

    if (categoryMessage) {
        categoryMessage.textContent =
            `Deleting "${categoryNameValue}"...`;
    }

    const {
        data: media,
        error: mediaLoadError
    } = await supabase
        .from("event_media")
        .select("*")
        .eq(
            "event_id",
            currentEvent.id
        )
        .eq(
            "category_id",
            categoryId
        );

    if (mediaLoadError) {

        console.error(
            "CATEGORY MEDIA LOAD ERROR:",
            mediaLoadError
        );

        return;
    }

    const filePaths = [];

    (media || []).forEach(
        (item) => {

            const path =
                getStoragePath(
                    item.file_url
                );

            if (path) {
                filePaths.push(path);
            }
        }
    );

    const {
        error: mediaDeleteError
    } = await supabase
        .from("event_media")
        .delete()
        .eq(
            "event_id",
            currentEvent.id
        )
        .eq(
            "category_id",
            categoryId
        );

    if (mediaDeleteError) {

        console.error(
            "MEDIA DELETE ERROR:",
            mediaDeleteError
        );

        if (categoryMessage) {
            categoryMessage.textContent =
                mediaDeleteError.message;
        }

        return;
    }

    const {
        data: deletedCategory,
        error: categoryDeleteError
    } = await supabase
        .from("event_categories")
        .delete()
        .eq(
            "id",
            categoryId
        )
        .eq(
            "event_id",
            currentEvent.id
        )
        .select("*");

    if (categoryDeleteError) {

        console.error(
            "CATEGORY DELETE ERROR:",
            categoryDeleteError
        );

        return;
    }

    if (
        !deletedCategory ||
        deletedCategory.length === 0
    ) {

        alert(
            "Category was NOT deleted. Check DELETE policy."
        );

        return;
    }

    if (filePaths.length > 0) {

        const {
            error: storageError
        } = await supabase.storage
            .from("event-media")
            .remove(filePaths);

        if (storageError) {
            console.error(
                "CATEGORY STORAGE DELETE ERROR:",
                storageError
            );
        }
    }

    if (categorySelect) {
        categorySelect.value = "";
    }

    if (categoryMediaList) {
        categoryMediaList.innerHTML = "";
    }

    if (categoryMediaMessage) {
        categoryMediaMessage.textContent = "";
    }

    await loadCategories(
        currentEvent.id
    );

    if (categoryMessage) {
        categoryMessage.textContent =
            `"${categoryNameValue}" deleted successfully! 🗑️`;
    }

    console.log(
        "CATEGORY DELETED SUCCESSFULLY ✅"
    );
}

// ======================================================
// UPLOAD CATEGORY MEDIA
// ======================================================

if (uploadCategoryMediaBtn) {

    uploadCategoryMediaBtn.addEventListener(
        "click",
        async () => {

            if (!currentEvent) {

                if (categoryUploadMessage) {
                    categoryUploadMessage.textContent =
                        "Please select an event first.";
                }

                return;
            }

            const categoryId =
                categorySelect?.value;

            if (!categoryId) {

                if (categoryUploadMessage) {
                    categoryUploadMessage.textContent =
                        "Please select a category.";
                }

                return;
            }

            const photoInput =
                document.getElementById(
                    "categoryPhotos"
                );

            const videoInput =
                document.getElementById(
                    "categoryVideos"
                );

            if (!photoInput || !videoInput) {

                if (categoryUploadMessage) {
                    categoryUploadMessage.textContent =
                        "Photo/video inputs not found.";
                }

                return;
            }

            const photos =
                Array.from(
                    photoInput.files || []
                );

            const videos =
                Array.from(
                    videoInput.files || []
                );

            const files = [
                ...photos,
                ...videos
            ];

            if (files.length === 0) {

                if (categoryUploadMessage) {
                    categoryUploadMessage.textContent =
                        "Please select photos or videos.";
                }

                return;
            }

            for (
                let i = 0;
                i < files.length;
                i++
            ) {

                const file =
                    files[i];

                const safeFileName =
                    file.name.replace(
                        /[^a-zA-Z0-9._-]/g,
                        "_"
                    );

                const fileName =
                    `${currentEvent.id}/${categoryId}/${Date.now()}-${i}-${safeFileName}`;

                if (categoryUploadMessage) {
                    categoryUploadMessage.textContent =
                        `Uploading ${i + 1} / ${files.length}...`;
                }

                console.log(
                    "UPLOADING:",
                    fileName
                );

                const {
                    error: uploadError
                } = await supabase.storage
                    .from("event-media")
                    .upload(
                        fileName,
                        file
                    );

                if (uploadError) {

                    console.error(
                        "STORAGE UPLOAD ERROR:",
                        uploadError
                    );

                    if (categoryUploadMessage) {
                        categoryUploadMessage.textContent =
                            "Upload error: " +
                            uploadError.message;
                    }

                    return;
                }

                const {
                    data: publicUrlData
                } = supabase.storage
                    .from("event-media")
                    .getPublicUrl(
                        fileName
                    );

                const fileUrl =
                    publicUrlData.publicUrl;

                const mediaType =
                    file.type?.startsWith("video/")
                        ? "video"
                        : "image";

                const {
                    data: mediaData,
                    error: mediaError
                } = await supabase
                    .from("event_media")
                    .insert([
                        {
                            event_id:
                                currentEvent.id,

                            category_id:
                                categoryId,

                            file_url:
                                fileUrl,

                            media_type:
                                mediaType
                        }
                    ])
                    .select("*");

                if (mediaError) {

                    console.error(
                        "MEDIA DATABASE ERROR:",
                        mediaError
                    );

                    await supabase.storage
                        .from("event-media")
                        .remove([
                            fileName
                        ]);

                    if (categoryUploadMessage) {
                        categoryUploadMessage.textContent =
                            "Database error: " +
                            mediaError.message;
                    }

                    return;
                }

                console.log(
                    "MEDIA SAVED:",
                    mediaData
                );
            }

            if (categoryUploadMessage) {
                categoryUploadMessage.textContent =
                    `All ${files.length} photos/videos uploaded successfully! ✅`;
            }

            photoInput.value = "";
            videoInput.value = "";

            await loadCategoryMedia(
                categoryId
            );
        }
    );
}

// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        async () => {

            await supabase.auth.signOut();

            window.location.href =
                "login.html";
        }
    );
}

// ======================================================
// INITIALIZE
// ======================================================

async function initializeAdmin() {

    const authenticated =
        await checkAdminSession();

    if (!authenticated) {
        return;
    }

    await loadEvents();
}

// ======================================================
// START
// ======================================================

initializeAdmin();