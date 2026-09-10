import { supabase } from "./supabase.js";

console.log("HOME SCRIPT LOADED ✅");

const eventsContainer = document.getElementById("eventsContainer");
const paginationContainer = document.getElementById("paginationContainer");

let currentPage = 1;
const itemsPerPage = 6;

// ======================================================
// 1. FAST & STABLE PUBLISHED EVENTS LOADER
// ======================================================
async function loadPublishedEvents(page = 1) {
    if (!eventsContainer) return;

    eventsContainer.innerHTML = `<div class="events-loading" style="color:var(--muted); text-align:center; grid-column:1/-1; padding: 40px;">Loading Prime-D Experience...</div>`;

    const { data: allEvents, error } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

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

    const totalItems = allEvents.length;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageEvents = allEvents.slice(startIndex, endIndex);

    eventsContainer.innerHTML = "";

    pageEvents.forEach((event) => {
        const card = document.createElement("article");
        card.className = "event-card";

        // Fallback cover image
        const coverUrl = event.cover_image_url || "images/hero.jpg";

        const imageWrapper = document.createElement("div");
        imageWrapper.className = "event-image";

        const image = document.createElement("img");
        image.src = coverUrl;
        image.alt = event.event_name || "Prime-D Event";
        image.loading = "eager";
        image.decoding = "async";
        image.style.objectFit = "cover";
        image.style.width = "100%";
        image.style.height = "100%";
        
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
    });

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
            <button id="prevPageBtn" class="primary-button" style="padding: 10px 20px; margin-top:0;" ${page === 1 ? "disabled style='opacity:0.4; cursor:not-allowed; margin-top:0;'" : ""}>
                ← Previous
            </button>
            <span style="color: var(--gold); font-weight: 600; font-size: 14px;">
                Page ${page} of ${totalPages}
            </span>
            <button id="nextPageBtn" class="primary-button" style="padding: 10px 20px; margin-top:0;" ${page === totalPages ? "disabled style='opacity:0.4; cursor:not-allowed; margin-top:0;'" : ""}>
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


// ======================================================
// 2. DYNAMIC HERO PHOTO LOADER
// ======================================================
async function applyDynamicHeroImage() {
    try {
        const heroSection = document.querySelector(".hero");
        if (!heroSection) return;

        const { data, error } = await supabase
            .from("site_settings")
            .select("value")
            .eq("key", "hero_image_url")
            .maybeSingle();

        if (error) {
            console.error("Hero Image Database Error:", error);
            return;
        }

        if (data && data.value) {
            const freshUrl = data.value;
            heroSection.style.setProperty(
                "background-image", 
                `linear-gradient(135deg, rgba(28, 26, 23, 0.40) 25%, rgba(28, 26, 23, 0.65)), url('${freshUrl}')`, 
                "important"
            );
            heroSection.style.setProperty("background-size", "cover", "important");
            heroSection.style.setProperty("background-position", "center center", "important");
            heroSection.style.setProperty("background-repeat", "no-repeat", "important");
        }
    } catch (err) {
        console.error("Hero Image Load Error:", err);
    }
}

applyDynamicHeroImage();


// ======================================================
// 3. INDEPENDENT SERVICE CATEGORIES TEXT LIST LOADER
// ======================================================
async function loadHomeServices() {
    const servicesContainer = document.getElementById("homeServicesContainer");
    if (!servicesContainer) return;

    const { data: categories, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading categories:", error);
        servicesContainer.innerHTML = `<div style="color: var(--muted, #a49c91); text-align: center;">Error loading categories: ${error.message}</div>`;
        return;
    }

    if (!categories || categories.length === 0) {
        servicesContainer.innerHTML = `<div style="color: var(--muted, #a49c91); text-align: center;">No service categories available right now.</div>`;
        return;
    }

    servicesContainer.innerHTML = "";

    const listWrapper = document.createElement("div");
    listWrapper.style.cssText = "display: flex; flex-direction: column; align-items: center; gap: 20px; max-width: 700px; margin: 0 auto; text-align: center;";

    categories.forEach(cat => {
        const link = document.createElement("a");
        link.href = `pages/packages.html?category=${cat.slug}`;
        link.style.cssText = "font-family: 'Cormorant Garamond', Georgia, serif; font-size: 28px; color: #ffffff; text-decoration: none; transition: 0.3s ease; display: inline-block; font-weight: 500;";
        
        link.onmouseover = () => { link.style.color = "var(--gold, #d4af37);"; };
        link.onmouseout = () => { link.style.color = "#ffffff"; };

        link.textContent = cat.name;
        listWrapper.appendChild(link);
    });

    servicesContainer.appendChild(listWrapper);
}

loadHomeServices();