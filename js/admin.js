.select("id")
                .eq("event_id", currentEvent.id)
                .ilike("category_name", name)
                .maybeSingle();

            if (checkError) {
                console.error("CATEGORY CHECK ERROR:", checkError);
                if (categoryMessage) {
                    categoryMessage.textContent = "Error checking category: " + checkError.message;
                }
                return;
            }

            if (existing) {
                if (categoryMessage) {
                    categoryMessage.textContent = `Category "${name}" already exists.`;
                }
                return;
            }

            const { data, error } = await supabase
                .from("event_categories")
                .insert([
                    {
                        event_id: currentEvent.id,
                        category_name: name
                    }
                ])
                .select("*")
                .maybeSingle();

            if (error) {
                console.error("ADD CATEGORY ERROR:", error);
                if (categoryMessage) {
                    categoryMessage.textContent = "Error adding category: " + error.message;
                }
                return;
            }

            console.log("CATEGORY ADDED:", data);

            if (categoryName) {
                categoryName.value = "";
            }

            await loadCategories(currentEvent.id);

            if (categoryMessage) {
                categoryMessage.textContent = `Category "${name}" added successfully! ✅`;
            }
        }
    );
}

// ======================================================
// DELETE CATEGORY
// ======================================================

async function deleteCategory(categoryId, categoryNameText) {
    if (!categoryId) return;

    if (categoryMessage) {
        categoryMessage.textContent = `Deleting "${categoryNameText}"...`;
    }

    try {
        const { data: media, error: mediaLoadError } = await supabase
            .from("event_media")
            .select("*")
            .eq("category_id", categoryId);

        if (mediaLoadError) {
            console.error("CATEGORY MEDIA LOAD ERROR:", mediaLoadError);
            alert("Could not load category media:\n\n" + mediaLoadError.message);
            return;
        }

        const filePaths = [];
        (media || []).forEach((item) => {
            const path = getStoragePath(item.file_url);
            if (path) filePaths.push(path);
        });

        const { error: mediaDeleteError } = await supabase
            .from("event_media")
            .delete()
            .eq("category_id", categoryId);

        if (mediaDeleteError) {
            console.error("MEDIA DELETE ERROR:", mediaDeleteError);
            alert("Could not delete category media:\n\n" + mediaDeleteError.message);
            return;
        }

        const { data: deletedCategory, error: categoryDeleteError } = await supabase
            .from("event_categories")
            .delete()
            .eq("id", categoryId)
            .select("*");

        if (categoryDeleteError) {
            console.error("CATEGORY DELETE ERROR:", categoryDeleteError);
            alert("Category delete failed:\n\n" + categoryDeleteError.message);
            return;
        }

        if (!deletedCategory || deletedCategory.length === 0) {
            alert("Category was not deleted. Check Supabase DELETE policy.");
            return;
        }

        if (filePaths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from("event-media")
                .remove(filePaths);

            if (storageError) {
                console.error("STORAGE DELETE ERROR:", storageError);
            }
        }

        if (currentEvent) {
            await loadCategories(currentEvent.id);
        }

        if (categoryMediaList) {
            categoryMediaList.innerHTML = "";
        }

        if (categoryMessage) {
            categoryMessage.textContent = `Category "${categoryNameText}" deleted. 🗑️`;
        }
    } catch (error) {
        console.error("DELETE CATEGORY ERROR:", error);
        alert("Unexpected error deleting category:\n\n" + error.message);
    }
}

// ======================================================
// UPLOAD CATEGORY MEDIA
// ======================================================

if (uploadCategoryMediaBtn) {
    uploadCategoryMediaBtn.addEventListener("click", async () => {
        if (!currentEvent) {
            alert("Please select an event first.");
            return;
        }

        const categoryId = categorySelect?.value;
        if (!categoryId) {
            alert("Please select a category first.");
            return;
        }

        const fileInput = document.getElementById("categoryMediaInput");
        const files = fileInput?.files;

        if (!files || files.length === 0) {
            alert("Please select files to upload.");
            return;
        }

        if (categoryUploadMessage) {
            categoryUploadMessage.textContent = "Uploading media...";
        }

        let successCount = 0;

        for (const file of files) {
            try {
                const fileExt = file.name.split(".").pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
                const filePath = `${currentEvent.id}/${categoryId}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("event-media")
                    .upload(filePath, file);
``
                if (uploadError) {
                    console.error("FILE UPLOAD ERROR:", uploadError);
                    continue;
                }

                const { data: publicUrlData } = supabase.storage
                    .from("event-media")
                    .getPublicUrl(filePath);

                const mediaType = file.type.startsWith("video/") ? "video" : "photo";

                const { error: dbError } = await supabase
                    .from("event_media")
                    .insert([
                        {
                            event_id: currentEvent.id,
                            category_id: categoryId,
                            media_type: mediaType,
                            file_url: publicUrlData.publicUrl
                        }
                    ]);

                if (dbError) {
                    console.error("DB SAVE ERROR:", dbError);
                } else {
                    successCount++;
                }
            } catch (err) {
                console.error("UPLOAD LOOP ERROR:", err);
            }
        }

        if (fileInput) fileInput.value = "";

        if (categoryUploadMessage) {
            categoryUploadMessage.textContent = `${successCount} file(s) uploaded successfully! ✅`;
        }

        await loadCategoryMedia(categoryId);
    });
}

// ======================================================
// CATEGORY SELECT CHANGE (LOAD MEDIA)
// ======================================================

if (categorySelect) {
    categorySelect.addEventListener("change", async () => {
        const categoryId = categorySelect.value;
        if (!categoryId) {
            if (categoryMediaList) categoryMediaList.innerHTML = "";
            if (categoryMediaMessage) categoryMediaMessage.textContent = "";
            return;
        }

        await loadCategoryMedia(categoryId);
    });
}

// ======================================================
// LOAD CATEGORY MEDIA
// ======================================================

async function loadCategoryMedia(categoryId) {
    if (!categoryMediaList) return;

    categoryMediaList.innerHTML = "Loading media...";

    const { data: media, error } = await supabase
        .from("event_media")
        .select("*")
        .eq("category_id", categoryId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("LOAD MEDIA ERROR:", error);
        if (categoryMediaMessage) {
            categoryMediaMessage.textContent = "Error loading media: " + error.message;
        }
        return;
    }

    categoryMediaList.innerHTML = "";

    if (!media || media.length === 0) {
        if (categoryMediaMessage) {
            categoryMediaMessage.textContent = "No media uploaded for this category yet.";
        }
        return;
    }

    if (categoryMediaMessage) {
        categoryMediaMessage.textContent = `${media.length} item(s) found.`;
    }

    media.forEach((item) => {
        const card = document.createElement("div");
        card.className = "media-card";

        if (item.media_type === "video") {
            const video = document.createElement("video");
            video.src = item.file_url;
            video.controls = true;
            card.appendChild(video);
        } else {
            const img = document.createElement("img");
            img.src = item.file_url;
            img.alt = "Event Media";
            card.appendChild(img);
        }

        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.textContent = "🗑 Delete";
        deleteBtn.className = "delete-media-btn";

        deleteBtn.addEventListener("click", async () => {
            const ok = confirm("Delete this media item?");
            if (!ok) return;

            await deleteSingleMedia(item.id, item.file_url, categoryId);
        });

        card.appendChild(deleteBtn);
        categoryMediaList.appendChild(card);
    });
}

// ======================================================
// DELETE SINGLE MEDIA
// ======================================================

async function deleteSingleMedia(mediaId, fileUrl, categoryId) {
    try {
        const { error: dbError } = await supabase
            .from("event_media")
            .delete()
            .eq("id", mediaId);

        if (dbError) {
            console.error("MEDIA DB DELETE ERROR:", dbError);
            alert("Error deleting media record:\n\n" + dbError.message);
            return;
        }

        const path = getStoragePath(fileUrl);
        if (path) {
            const { error: storageError } = await supabase.storage
                .from("event-media")
                .remove([path]);

            if (storageError) {
                console.error("STORAGE DELETE ERROR:", storageError);
            }
        }

        await loadCategoryMedia(categoryId);
    } catch (err) {
        console.error("DELETE SINGLE MEDIA ERROR:", err);
        alert("Unexpected error deleting media:\n\n" + err.message);
    }
}

// ======================================================
// LOGOUT
// ======================================================

if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error("LOGOUT ERROR:", error);
            alert("Logout error: " + error.message);
            return;
        }

        window.location.href = "login.html";
    });
}

// ======================================================
// INIT
// ======================================================

async function init() {
    const authenticated = await checkAdminSession();
    if (authenticated) {
        await loadEvents();
    }
}

init();