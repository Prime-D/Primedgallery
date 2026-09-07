import { supabase } from "./supabase.js";

// GET EVENT ID FROM URL
const urlParams = new URLSearchParams(window.location.search);
const eventId = urlParams.get("id");

const eventTitle = document.getElementById("eventTitle");
const eventDate = document.getElementById("eventDate");
const eventLocation = document.getElementById("eventLocation");
const eventBudget = document.getElementById("eventBudget");
const eventDescription = document.getElementById("eventDescription");

const categoryFilterBar = document.getElementById("categoryFilterBar");
const photosGrid = document.getElementById("photosGrid");
const videosGrid = document.getElementById("videosGrid");

let allMediaItems = [];

/* ======================================================
   LIGHTBOX FULLSCREEN FIX (INDEPENDENT OVERLAY)
   ====================================================== */
function openLightbox(imageUrl) {
    // කලින් තිබූ Modal එකක් ඇත්නම් ඉවත් කිරීම
    const existingModal = document.getElementById("primeLightboxModal");
    if (existingModal) existingModal.remove();

    // 1. Full Screen Dark Overlay එක සාදා ගැනීම
    const overlay = document.createElement("div");
    overlay.id = "primeLightboxModal";
    overlay.style.cssText = `
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        background-color: rgba(0, 0, 0, 0.95) !important;
        z-index: 999999 !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        backdrop-filter: blur(8px);
        padding: 20px;
        box-sizing: border-box;
    `;

    // 2. Close Button එක (Top Right)
    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
        position: absolute !important;
        top: 15px !important;
        right: 25px !important;
        color: #ffffff !important;
        font-size: 50px !important;
        font-weight: bold !important;
        cursor: pointer !important;
        line-height: 1 !important;
        z-index: 1000000 !important;
        user-select: none;
        transition: color 0.2s ease;
    `;

    // 3. Full Size Image Element එක
    const img = document.createElement("img");
    img.src = imageUrl;
    img.style.cssText = `
        max-width: 95vw !important;
        max-height: 90vh !important;
        object-fit: contain !important;
        border-radius: 4px;
        box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
    `;

    overlay.appendChild(closeBtn);
    overlay.appendChild(img);
    document.body.appendChild(overlay);

    // Body Scroll වීම නතර කිරීම
    document.body.style.overflow = "hidden";

    // Close Function එක
    const closeLightbox = () => {
        overlay.remove();
        document.body.style.overflow = "auto";
    };

    // Events
    closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeLightbox();
    };

    overlay.onclick = (e) => {
        if (e.target !== img) {
            closeLightbox();
        }
    };

    const handleEsc = (e) => {
        if (e.key === "Escape") {
            closeLightbox();
            document.removeEventListener("keydown", handleEsc);
        }
    };
    document.addEventListener("keydown", handleEsc);
}

/* ======================================================
   INIT EVENT DETAILS
   ====================================================== */
async function initEventDetails() {
    if (!eventId) {
        if (eventTitle) eventTitle.textContent = "Event Not Found";
        return;
    }

    // Fetch Event Info
    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !event) {
        if (eventTitle) eventTitle.textContent = "Unable to load event details.";
        return;
    }

    // Populate Event Meta
    if (eventTitle) eventTitle.textContent = event.event_name || "Untitled Event";
    if (eventDate) eventDate.textContent = event.event_date ? "📅 " + formatDate(event.event_date) : "📅 Date unavailable";
    if (eventLocation) eventLocation.textContent = event.location ? "📍 " + event.location : "📍 Location unavailable";
    if (eventDescription) eventDescription.textContent = event.description || "No description provided for this event.";

    if (event.show_budget && event.budget && eventBudget) {
        eventBudget.style.display = "inline";
        eventBudget.textContent = "💰 Rs. " + Number(event.budget).toLocaleString("en-LK");
    }

    loadEventCategories(eventId);
    loadEventMedia(eventId);
}

async function loadEventCategories(eventId) {
    const { data: categories } = await supabase
        .from("event_categories")
        .select("*")
        .eq("event_id", eventId);

    if (categories && categories.length > 0 && categoryFilterBar) {
        categories.forEach(cat => {
            const btn = document.createElement("button");
            btn.className = "filter-btn";
            btn.setAttribute("data-category", cat.id);
            btn.textContent = cat.category_name;
            btn.addEventListener("click", (e) => {
                document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
                e.target.classList.add("active");
                renderMediaByCategory(cat.id);
            });
            categoryFilterBar.appendChild(btn);
        });
    }

    categoryFilterBar?.querySelector('[data-category="all"]')?.addEventListener("click", (e) => {
        document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
        e.target.classList.add("active");
        renderMediaByCategory("all");
    });
}

async function loadEventMedia(eventId) {
    const { data: media, error } = await supabase
        .from("event_media")
        .select("*")
        .eq("event_id", eventId);

    if (error || !media) {
        if (photosGrid) photosGrid.innerHTML = `<div class="empty-gallery-msg">Failed to load media.</div>`;
        if (videosGrid) videosGrid.innerHTML = `<div class="empty-gallery-msg">Failed to load media.</div>`;
        return;
    }

    allMediaItems = media;
    renderMediaByCategory("all");
}

function renderMediaByCategory(categoryId) {
    if (photosGrid) photosGrid.innerHTML = "";
    if (videosGrid) videosGrid.innerHTML = "";

    const filtered = categoryId === "all" 
        ? allMediaItems 
        : allMediaItems.filter(m => m.category_id === categoryId);

    const photos = filtered.filter(m => m.media_type === "photo" || m.media_type === "image");
    const videos = filtered.filter(m => m.media_type === "video");

    // Render Photos with Direct Lightbox Trigger
    if (photos.length === 0) {
        if (photosGrid) photosGrid.innerHTML = `<div class="empty-gallery-msg">No photos available for this category.</div>`;
    } else {
        photos.forEach(item => {
            const card = document.createElement("div");
            card.className = "media-item-card";
            card.style.cursor = "pointer";
            card.innerHTML = `<img src="${item.file_url}" alt="Event Photo" loading="lazy">`;

            // Card Click -> Open Full Size Image
            card.addEventListener("click", (e) => {
                e.preventDefault();
                e.stopPropagation();
                openLightbox(item.file_url);
            });

            if (photosGrid) photosGrid.appendChild(card);
        });
    }

    // Render Videos
    if (videos.length === 0) {
        if (videosGrid) videosGrid.innerHTML = `<div class="empty-gallery-msg">No videos available for this category.</div>`;
    } else {
        videos.forEach(item => {
            const card = document.createElement("div");
            card.className = "media-item-card";
            card.innerHTML = `
                <span class="video-card-badge">🎥 Video</span>
                <video src="${item.file_url}" controls></video>
            `;
            if (videosGrid) videosGrid.appendChild(card);
        });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

initEventDetails();