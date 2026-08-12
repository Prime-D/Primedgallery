import { supabase } from "./supabase.js";

console.log("HOME SCRIPT LOADED ✅");

// ======================================================
// ELEMENTS
// ======================================================

const eventsContainer =
    document.getElementById("eventsContainer");


// ======================================================
// LOAD PUBLISHED EVENTS
// ======================================================

async function loadPublishedEvents() {

    if (!eventsContainer) {
        console.error(
            "eventsContainer not found."
        );
        return;
    }

    console.log(
        "Loading published events..."
    );

    eventsContainer.innerHTML = `
        <div class="events-loading">
            Loading events...
        </div>
    `;


    const {
        data: events,
        error
    } = await supabase
        .from("events")
        .select("*")
        .eq("published", true)
        .order(
            "event_date",
            {
                ascending: false
            }
        );


    if (error) {

        console.error(
            "HOME EVENT LOAD ERROR:",
            error
        );

        eventsContainer.innerHTML = `
            <div class="events-loading">
                Unable to load events.
            </div>
        `;

        return;
    }


    console.log(
        "PUBLISHED EVENTS:",
        events
    );


    if (
        !events ||
        events.length === 0
    ) {

        eventsContainer.innerHTML = `
            <div class="events-loading">
                No published events yet.
            </div>
        `;

        return;
    }


    eventsContainer.innerHTML = "";


    // ==================================================
    // CREATE CARDS
    // ==================================================

    events.forEach(
        (event) => {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "event-card";


            // ==================================================
            // IMAGE
            // ==================================================

            const imageWrapper =
                document.createElement(
                    "div"
                );

            imageWrapper.className =
                "event-image";


            const image =
                document.createElement(
                    "img"
                );

            image.src =
                "images/hero.jpg";

            image.alt =
                event.event_name ||
                "Prime-D Event";


            imageWrapper.appendChild(
                image
            );


            // ==================================================
            // INFO
            // ==================================================

            const info =
                document.createElement(
                    "div"
                );

            info.className =
                "event-info";


            // TYPE

            const type =
                document.createElement(
                    "p"
                );

            type.className =
                "event-type";

            type.textContent =
                "PRIME-D EVENT";


            // NAME

            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                event.event_name ||
                "Untitled Event";


            // DATE

            const date =
                document.createElement(
                    "p"
                );

            date.className =
                "event-date";

            date.textContent =
                event.event_date
                    ? "📅 " +
                      formatDate(
                          event.event_date
                      )
                    : "📅 Date not available";


            // LOCATION

            const location =
                document.createElement(
                    "p"
                );

            location.className =
                "event-location";

            location.textContent =
                event.location
                    ? "📍 " +
                      event.location
                    : "📍 Location not available";


            // ==================================================
            // BUDGET
            // ==================================================

            if (
                event.show_budget &&
                event.budget !== null &&
                event.budget !== undefined
            ) {

                const budget =
                    document.createElement(
                        "p"
                    );

                budget.className =
                    "event-date";

                budget.textContent =
                    "💰 " +
                    formatBudget(
                        event.budget
                    );

                info.appendChild(
                    budget
                );
            }


            // ==================================================
            // VIEW BUTTON
            // ==================================================

            const viewButton =
                document.createElement(
                    "a"
                );

            viewButton.className =
                "view-button";

            viewButton.textContent =
                "View Event →";

            viewButton.href =
                `pages/event.html?id=${event.id}`;


            // ==================================================
            // BUILD CARD
            // ==================================================

            info.appendChild(
                type
            );

            info.appendChild(
                title
            );

            info.appendChild(
                date
            );

            info.appendChild(
                location
            );

            info.appendChild(
                viewButton
            );


            card.appendChild(
                imageWrapper
            );

            card.appendChild(
                info
            );


            eventsContainer.appendChild(
                card
            );


            // ==================================================
            // LOAD COVER IMAGE
            // ==================================================

            loadEventCoverImage(
                event.id,
                image
            );

        }
    );

}


// ======================================================
// LOAD COVER IMAGE
// ======================================================

async function loadEventCoverImage(
    eventId,
    imageElement
) {

    try {

        const {
            data: media,
            error
        } = await supabase
            .from("event_media")
            .select("*")
            .eq(
                "event_id",
                eventId
            )
            .eq(
                "media_type",
                "image"
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(1);


        if (error) {

            console.error(
                "EVENT COVER IMAGE ERROR:",
                error
            );

            return;
        }


        if (
            media &&
            media.length > 0 &&
            media[0].file_url
        ) {

            imageElement.src =
                media[0].file_url;

        }

    } catch (error) {

        console.error(
            "COVER IMAGE ERROR:",
            error
        );

    }

}


// ======================================================
// FORMAT DATE
// ======================================================

function formatDate(
    dateString
) {

    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return dateString;
    }


    return date.toLocaleDateString(
        "en-US",
        {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    );

}


// ======================================================
// FORMAT BUDGET
// ======================================================

function formatBudget(
    amount
) {

    const number =
        Number(amount);


    if (
        Number.isNaN(number)
    ) {

        return "Budget unavailable";
    }


    return (
        "Rs. " +
        number.toLocaleString(
            "en-LK"
        )
    );

}


// ======================================================
// START
// ======================================================

loadPublishedEvents();