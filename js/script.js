import { supabase } from "./supabase.js";

console.log("HOME SCRIPT LOADED ✅");

const eventsContainer = document.getElementById("eventsContainer");
const paginationContainer = document.getElementById("paginationContainer");

let currentPage = 1;
const itemsPerPage = 6; // PC එකේ පේළි 2කට Cards 6ක් (3x2), Mobile එකේ එකින් එක Cards 6ක්

async function loadPublishedEvents(page = 1) {
    if (!eventsContainer) return;

    eventsContainer.innerHTML = `<div class="events-loading" style="color:var(--muted); text-align:center; grid-column:1/-1;">Loading events...</div>`;

    // Total Events ගණන ලබා ගැනීම
    const { data: allEvents, error } = await supabase
        .from("events")
        .select("*")
        .eq("published", true);

    if (error) {
        console.error("HOME EVENT LOAD ERROR:", error);
        eventsContainer.innerHTML = `<div class="events-loading" style="color:var(--muted); text-align:center; grid-column:1/-1;">Unable to load events.</div>`;
        return;
    }

    if (!allEvents || allEvents.length === 0) {
        eventsContainer.innerHTML = `<div class="events-loading" style="color:var(--muted); text-align:center; grid-column:1/-1;">No published events yet.</div>`;
        if (paginationContainer) paginationContainer.innerHTML = "";
        return;
    }

    // Pagination Calculators (Slice Events Array)
    const totalItems = allEvents.length;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEvents = allEvents.slice(startIndex, endIndex);

    eventsContainer.innerHTML = "";

    pageEvents.forEach((event) => {
        const card = document.createElement("article");
        card.className = "event-card";

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "event-image";

        const image = document.createElement("img");
        image.src = "images/hero.jpg";
        image.alt = event.event_name || "Prime-D Event";
        imageWrapper.appendChild(image);

        const info = document.createElement("div");
        info.className = "event-info";

        const type = document.createElement("p");
        type.className = "event-type";
        type.textContent = "PRIME-D EVENT";

        const title = document.createElement("h3");
        title.textContent = event.event_name || "Untitled Event";

        const date = document.createElement("p");
        date.className = "event-date";
        date.textContent = event.event_date ? "📅 " + formatDate(event.event_date) : "📅 Date not available";

        const location = document.createElement("p");
        location.className = "event-location";
        location.textContent = event.location ? "📍 " + event.location : "📍 Location not available";

        info.appendChild(type);
        info.appendChild(title);
        info.appendChild(date);
        info.appendChild(location);

        if (event.show_budget && event.budget !== null && event.budget !== undefined) {
            const budget = document.createElement("p");
            budget.className = "event-date";
            budget.textContent = "💰 " + formatBudget(event.budget);
            info.appendChild(budget);
        }

        const viewButton = document.createElement("a");
        viewButton.className = "view-button";
        viewButton.textContent = "View Event →";
        viewButton.href = `pages/event.html?id=${event.id}`;
        info.appendChild(viewButton);

        card.appendChild(imageWrapper);
        card.appendChild(info);
        eventsContainer.appendChild(card);

        loadEventCoverImage(event.id, image);
    });

    // Render Pagination Controls
    renderPagination(totalItems, page);
}

function renderPagination(totalItems, page) {
    if (!paginationContainer) return;

    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) {
        paginationContainer.innerHTML = "";
        return;
    }

    paginationContainer.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 40px; width: 100%;">
            <button id="prevPageBtn" class="primary-button" style="padding: 10px 20px;" ${page === 1 ? "disabled style='opacity:0.4; cursor:not-allowed;'" : ""}>
                ← Previous
            </button>
            <span style="color: var(--gold); font-weight: 600; font-size: 14px;">
                Page ${page} of ${totalPages}
            </span>
            <button id="nextPageBtn" class="primary-button" style="padding: 10px 20px;" ${page === totalPages ? "disabled style='opacity:0.4; cursor:not-allowed;'" : ""}>
                Next →
            </button>
        </div>
    `;

    document.getElementById("prevPageBtn")?.addEventListener("click", () => {
        if (currentPage > 1) {
            currentPage--;
            loadPublishedEvents(currentPage);
            document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
        }
    });

    document.getElementById("nextPageBtn")?.addEventListener("click", () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadPublishedEvents(currentPage);
            document.getElementById("events")?.scrollIntoView({ behavior: "smooth" });
        }
    });
}

async function loadEventCoverImage(eventId, imageElement) {
    try {
        const { data: media, error } = await supabase
            .from("event_media")
            .select("*")
            .eq("event_id", eventId)
            .in("media_type", ["image", "photo"])
            .order("created_at", { ascending: true })
            .limit(1);

        if (!error && media && media.length > 0 && media[0].file_url) {
            imageElement.src = media[0].file_url;
        }
    } catch (error) {
        console.error("COVER IMAGE ERROR:", error);
    }
}

function formatDate(dateString) {
    const date = new Date(dateString + "T00:00:00");
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatBudget(amount) {
    const number = Number(amount);
    if (Number.isNaN(number)) return "Budget unavailable";
    return "Rs. " + number.toLocaleString("en-LK");
}

loadPublishedEvents(currentPage);

// Dynamic Hero Photo Loading
async function applyDynamicHeroImage() {
    try {
        const heroSection = document.querySelector(".hero");
        if (!heroSection) return;

        const { data, error } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "hero_image_url")
            .maybeSingle();

        if (!error && data && data.value) {
            heroSection.style.backgroundImage = `linear-gradient(135deg, rgba(28, 26, 23, 0.88) 25%, rgba(28, 26, 23, 0.50)), url('${data.value}')`;
        }
    } catch (err) {
        console.error("Hero Image Load Error:", err);
    }
}

applyDynamicHeroImage();