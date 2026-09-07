import { supabase } from "./supabase.js";

console.log("HOME SCRIPT LOADED ✅");

const eventsContainer = document.getElementById("eventsContainer");

async function loadPublishedEvents() {
    if (!eventsContainer) return;

    eventsContainer.innerHTML = `<div class="events-loading">Loading events...</div>`;

    // Database Fetch Request (order එක ඉවත් කර ආරක්ෂිත ලෙස Fetch කරනු ලැබේ)
    const { data: events, error } = await supabase
        .from("events")
        .select("*")
        .eq("published", true);

    if (error) {
        console.error("HOME EVENT LOAD ERROR:", error);
        eventsContainer.innerHTML = `<div class="events-loading">Unable to load events.</div>`;
        return;
    }

    if (!events || events.length === 0) {
        eventsContainer.innerHTML = `<div class="events-loading">No published events yet.</div>`;
        return;
    }

    eventsContainer.innerHTML = "";

    events.forEach((event) => {
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

loadPublishedEvents();
// Dynamic Hero Photo Loading (Fixed Version)
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