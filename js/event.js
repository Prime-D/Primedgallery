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

// LIGHTBOX (FULL-SCREEN PHOTO) DYNAMIC CREATION & SETUP
function setupLightboxModal() {
    if (document.getElementById("lightboxModal")) return;

    const modal = document.createElement("div");
    modal.id = "lightboxModal";
    modal.style.cssText = `
        display: none;
        position: fixed;
        z-index: 10000;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.93);
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(8px);
        cursor: pointer;
    `;

    const closeBtn = document.createElement("span");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = `
        position: absolute;
        top: 20px;
        right: 30px;
        color: #ffffff;
        font-size: 45px;
        font-weight: bold;
        cursor: pointer;
        user-select: none;
        transition: color 0.3s;
    `;
    closeBtn.onmouseover = () => closeBtn.style.color = "#d4af37";
    closeBtn.onmouseout = () => closeBtn.style.color = "#ffffff";

    const modalImg = document.createElement("img");
    modalImg.id = "lightboxImg";
    modalImg.alt = "Prime-D Event Full Resolution";
    modalImg.style.cssText = `
        max-width: 90%;
        max-height: 88vh;
        object-fit: contain;
        border-radius: 6px;
        box-shadow: 0 0 35px rgba(212, 175, 55, 0.25);
        cursor: default;
    `;

    modal.appendChild(closeBtn);
    modal.appendChild(modalImg);
    document.body.appendChild(modal);

    const closeModal = () => {
        modal.style.display = "none";
        modalImg.src = "";
    };

    closeBtn.addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "flex") {
            closeModal();
        }
    });
}

function openLightbox(imageUrl) {
    setupLightboxModal();
    const modal = document.getElementById("lightboxModal");
    const modalImg = document.getElementById("lightboxImg");

    if (modal && modalImg) {
        modalImg.src = imageUrl;
        modal.style.display = "flex";
    }
}

async function initEventDetails() {
    setupLightboxModal();

    if (!eventId) {
        eventTitle.textContent = "Event Not Found";
        return;
    }

    // 1. Fetch Event Info
    const { data: event, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

    if (error || !event) {
        eventTitle.textContent = "Unable to load event details.";
        return;
    }

    // Populate Event Meta
    eventTitle.textContent = event.event_name || "Untitled Event";
    eventDate.textContent = event.event_date ? "📅 " + formatDate(event.event_date) : "📅 Date unavailable";
    eventLocation.textContent = event.location ? "📍 " + event.location : "📍 Location unavailable";
    eventDescription.textContent = event.description || "No description provided for this event.";

    if (event.show_budget && event.budget) {
        eventBudget.style.display = "inline";
        eventBudget.textContent = "💰 Rs. " + Number(event.budget).toLocaleString("en-LK");
    }

    // 2. Fetch Categories
    loadEventCategories(eventId);

    // 3. Fetch Media
    loadEventMedia(eventId);
}

async function loadEventCategories(eventId) {
    const { data: categories } = await supabase
        .from("event_categories")
        .select("*")
        .eq("event_id", eventId);

    if (categories && categories.length > 0) {
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

    // All Button listener
    categoryFilterBar.querySelector('[data-category="all"]')?.addEventListener("click", (e) => {
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
        photosGrid.innerHTML = `<div class="empty-gallery-msg">Failed to load media.</div>`;
        videosGrid.innerHTML = `<div class="empty-gallery-msg">Failed to load media.</div>`;
        return;
    }

    allMediaItems = media;
    renderMediaByCategory("all");
}

function renderMediaByCategory(categoryId) {
    photosGrid.innerHTML = "";
    videosGrid.innerHTML = "";

    const filtered = categoryId === "all" 
        ? allMediaItems 
        : allMediaItems.filter(m => m.category_id === categoryId);

    const photos = filtered.filter(m => m.media_type === "photo" || m.media_type === "image");
    const videos = filtered.filter(m => m.media_type === "video");

    // Render Photos with Lightbox Trigger
    if (photos.length === 0) {
        photosGrid.innerHTML = `<div class="empty-gallery-msg">No photos available for this category.</div>`;
    } else {
        photos.forEach(item => {
            const card = document.createElement("div");
            card.className = "media-item-card";
            card.style.cursor = "pointer";
            card.innerHTML = `<img src="${item.file_url}" alt="Event Photo" loading="lazy">`;

            // Click -> Open Full Size Image
            card.addEventListener("click", () => {
                openLightbox(item.file_url);
            });

            photosGrid.appendChild(card);
        });
    }

    // Render Videos
    if (videos.length === 0) {
        videosGrid.innerHTML = `<div class="empty-gallery-msg">No videos available for this category.</div>`;
    } else {
        videos.forEach(item => {
            const card = document.createElement("div");
            card.className = "media-item-card";
            card.innerHTML = `
                <span class="video-card-badge">🎥 Video</span>
                <video src="${item.file_url}" controls></video>
            `;
            videosGrid.appendChild(card);
        });
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

initEventDetails();