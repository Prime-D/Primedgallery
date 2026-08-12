import { supabase } from "./supabase.js";

const eventsContainer = document.getElementById("eventsContainer");


// ==========================================
// LOAD EVENTS
// ==========================================

async function loadEvents() {

    try {

        eventsContainer.innerHTML = `
            <div class="events-loading">
                Loading events...
            </div>
        `;


        // Get events from Supabase
        const { data: events, error } = await supabase
    .from("events")
    .select("*");


        if (error) {

            console.error("Error loading events:", error);

            eventsContainer.innerHTML = `
                <div class="events-loading">
                    Unable to load events.
                </div>
            `;

            return;
        }


        // No events
        if (!events || events.length === 0) {

            eventsContainer.innerHTML = `
                <div class="events-loading">
                    No events available yet.
                </div>
            `;

            return;
        }


        // Get all event media
        const { data: media, error: mediaError } = await supabase
            .from("event_media")
            .select("*");


        if (mediaError) {
            console.error("Error loading media:", mediaError);
        }


        // Clear container
        eventsContainer.innerHTML = "";


        // Create cards
        events.forEach(event => {

            const eventMedia = (media || []).filter(
                item => item.event_id === event.id
            );


            // Find first image
            const firstImage = eventMedia.find(item => {

                const type = String(item.media_type || "").toLowerCase();

                return (
                    type === "photo" ||
                    type === "image" ||
                    type.includes("image")
                );

            });


            const imageUrl = firstImage
                ? firstImage.file_url
                : "images/event-1.jpg";


            // Category
            let category = "EVENT";

            if (event.category) {
                category = event.category;
            }

            if (event.category_name) {
                category = event.category_name;
            }


            // Event name
            const eventName =
                event.name ||
                event.event_name ||
                event.title ||
                "Untitled Event";


            // Date
            let eventDate = "Date not available";

            if (event.date) {

                const date = new Date(event.date);

                if (!isNaN(date)) {

                    eventDate = date.toLocaleDateString(
                        "en-GB",
                        {
                            day: "2-digit",
                            month: "long",
                            year: "numeric"
                        }
                    );
                }
            }


            // Location
            const location =
                event.location ||
                "Location not available";


            // Create card
            const card = document.createElement("div");

            card.className = "event-card";


            card.innerHTML = `

                <div class="event-image">

                    <img
                        src="${imageUrl}"
                        alt="${escapeHTML(eventName)}"
                    >

                </div>


                <div class="event-info">

                    <p class="event-type">
                        ${escapeHTML(category)}
                    </p>


                    <h3>
                        ${escapeHTML(eventName)}
                    </h3>


                    <p class="event-date">
                        📅 ${escapeHTML(eventDate)}
                    </p>


                    <p class="event-location">
                        📍 ${escapeHTML(location)}
                    </p>


                    <a
                        href="pages/event.html?id=${encodeURIComponent(event.id)}"
                        class="view-button"
                    >
                        View Event
                    </a>

                </div>

            `;


            eventsContainer.appendChild(card);

        });

    }

    catch (error) {

        console.error("Unexpected error:", error);

        eventsContainer.innerHTML = `
            <div class="events-loading">
                Something went wrong while loading events.
            </div>
        `;

    }

}


// ==========================================
// SECURITY - ESCAPE HTML
// ==========================================

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// ==========================================
// START
// ==========================================

loadEvents();