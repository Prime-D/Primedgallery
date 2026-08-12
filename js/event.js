console.log("EVENT.JS LOADED");

import { supabase } from "./supabase.js";

// ========================================
// GET EVENT ID
// ========================================

const params = new URLSearchParams(window.location.search);

const eventId = params.get("id");

console.log("Event ID:", eventId);


// ========================================
// CHECK EVENT ID
// ========================================

if (!eventId) {

    console.error("No event ID found");

    document.body.innerHTML =
        "<h1>Event not found.</h1>";

} else {

    loadEvent();

}


// ========================================
// LOAD EVENT
// ========================================

async function loadEvent() {

    console.log("Loading event...");


    // ========================================
    // GET EVENT
    // ========================================

    const {
        data: event,
        error: eventError
    } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();


    // ========================================
    // EVENT ERROR
    // ========================================

    if (eventError) {

        console.error(
            "Event error:",
            eventError
        );

        document.body.innerHTML =
            "<h1>Unable to load event.</h1>";

        return;
    }


    console.log(
        "Event loaded:",
        event
    );


    // ========================================
    // EVENT NAME
    // ========================================

    const eventName =
        document.getElementById("eventName");

    if (eventName) {

        eventName.textContent =
            event.event_name ||
            "Untitled Event";

    }


    // ========================================
    // DESCRIPTION TITLE
    // ========================================

    const descriptionTitle =
        document.getElementById("descriptionTitle");

    if (descriptionTitle) {

        descriptionTitle.textContent =
            event.event_name || "";

    }


    // ========================================
    // DESCRIPTION
    // ========================================

    const description =
        document.getElementById("eventDescription");

    if (description) {

        description.textContent =
            event.description ||
            "No description available.";

    }


    // ========================================
    // DATE
    // ========================================

    const eventDate =
        document.getElementById("eventDate");

    if (eventDate) {

        if (event.event_date) {

            const date =
                new Date(event.event_date);

            eventDate.textContent =
                "📅 " +
                date.toLocaleDateString(
                    "en-GB",
                    {
                        day: "numeric",
                        month: "long",
                        year: "numeric"
                    }
                );

        } else {

            eventDate.textContent =
                "📅 Date not available";

        }

    }


    // ========================================
    // LOCATION
    // ========================================

    const eventLocation =
        document.getElementById("eventLocation");

    if (eventLocation) {

        eventLocation.textContent =
            "📍 " +
            (
                event.location ||
                "Location not available"
            );

    }


    // ========================================
    // BUDGET
    // ========================================

    const eventBudget =
        document.getElementById("eventBudget");

    if (eventBudget) {

        if (
            event.show_budget === true &&
            event.budget !== null &&
            event.budget !== ""
        ) {

            eventBudget.textContent =
                "💰 Rs. " +
                Number(event.budget).toLocaleString(
                    "en-LK"
                );

            eventBudget.style.display =
                "inline";

        } else {

            eventBudget.style.display =
                "none";

        }

    }


    // ========================================
    // LOAD MEDIA
    // ========================================

    await loadMedia(event.id);

}


// ========================================
// LOAD MEDIA + CATEGORIES
// ========================================

async function loadMedia(eventId) {

    console.log("Loading media...");


    // ========================================
    // LOAD CATEGORIES
    // ========================================

    const {
        data: categories,
        error: categoryError
    } = await supabase
        .from("event_categories")
        .select("*")
        .eq("event_id", eventId)
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (categoryError) {

        console.error(
            "CATEGORY LOAD ERROR:",
            categoryError
        );

        return;
    }


    console.log(
        "Categories loaded:",
        categories
    );


    // ========================================
    // LOAD MEDIA
    // ========================================

    const {
        data: media,
        error: mediaError
    } = await supabase
        .from("event_media")
        .select("*")
        .eq("event_id", eventId)
        .order(
            "created_at",
            {
                ascending: true
            }
        );


    if (mediaError) {

        console.error(
            "MEDIA LOAD ERROR:",
            mediaError
        );

        return;
    }


    console.log(
        "Media loaded:",
        media
    );


    console.log(
        "MEDIA TYPES:",
        media.map(
            item => item.media_type
        )
    );


    // ========================================
    // GALLERY ELEMENTS
    // ========================================

    const photoGallery =
        document.getElementById(
            "photoGallery"
        );

    const videoGallery =
        document.getElementById(
            "videoGallery"
        );


    if (
        !photoGallery ||
        !videoGallery
    ) {

        console.error(
            "Gallery elements not found."
        );

        return;
    }


    // ========================================
    // CATEGORY CONTAINER
    // ========================================

    const categoryContainer =
        document.getElementById(
            "publicCategoryList"
        );


    if (!categoryContainer) {

        console.error(
            "publicCategoryList not found."
        );

        return;
    }


    categoryContainer.innerHTML = "";


    // ========================================
    // ALL MEDIA BUTTON
    // ========================================

    const allButton =
        document.createElement("button");

    allButton.type = "button";

    allButton.textContent =
        "All Media";

    allButton.className =
        "category-button active";


    categoryContainer.appendChild(
        allButton
    );


    // ========================================
    // CATEGORY BUTTONS
    // ========================================

    categories.forEach(
        category => {

            const button =
                document.createElement(
                    "button"
                );


            button.type = "button";


            button.textContent =
                category.category_name;


            button.className =
                "category-button";


            // ========================================
            // CATEGORY CLICK
            // ========================================

            button.addEventListener(
                "click",
                () => {

                    console.log(
                        "Category clicked:",
                        category.category_name
                    );


                    // Remove active
                    document
                        .querySelectorAll(
                            ".category-button"
                        )
                        .forEach(
                            btn => {

                                btn.classList.remove(
                                    "active"
                                );

                            }
                        );


                    // Add active
                    button.classList.add(
                        "active"
                    );


                    // Open category page
                    const categoryUrl =
                        "./category.html?event=" +
                        encodeURIComponent(eventId) +
                        "&category=" +
                        encodeURIComponent(category.id);


                    window.location.href =
                        categoryUrl;

                }
            );


            categoryContainer.appendChild(
                button
            );

        }
    );


    // ========================================
    // ALL MEDIA CLICK
    // ========================================

    allButton.addEventListener(
        "click",
        () => {

            console.log(
                "Showing all media"
            );


            document
                .querySelectorAll(
                    ".category-button"
                )
                .forEach(
                    btn => {

                        btn.classList.remove(
                            "active"
                        );

                    }
                );


            allButton.classList.add(
                "active"
            );


            displayCategoryMedia(
                null,
                media,
                photoGallery,
                videoGallery
            );

        }
    );


    // ========================================
    // SHOW ALL MEDIA FIRST
    // ========================================

    displayCategoryMedia(
        null,
        media,
        photoGallery,
        videoGallery
    );


    console.log(
        "Displaying media:",
        media
    );

}


// ========================================
// DISPLAY CATEGORY MEDIA
// ========================================

function displayCategoryMedia(
    categoryId,
    media,
    photoGallery,
    videoGallery
) {

    console.log(
        "Category selected:",
        categoryId
    );


    // ========================================
    // FILTER MEDIA
    // ========================================

    let filteredMedia = media;


    if (categoryId) {

        filteredMedia =
            media.filter(
                item =>
                    item.category_id ===
                    categoryId
            );

    }


    console.log(
        "Filtered media:",
        filteredMedia
    );


    // ========================================
    // CLEAR GALLERIES
    // ========================================

    photoGallery.innerHTML = "";

    videoGallery.innerHTML = "";


    let photoCount = 0;

    let videoCount = 0;


    // ========================================
    // DISPLAY MEDIA
    // ========================================

    filteredMedia.forEach(
        item => {


            // ========================================
            // PHOTO
            // ========================================

            if (
                item.media_type === "image" ||
                item.media_type === "photo"
            ) {

                const photoCard =
                    document.createElement(
                        "div"
                    );


                photoCard.className =
                    "media-card";


                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    item.file_url;


                img.alt =
                    "Event Photo";


                img.loading =
                    "lazy";


                img.addEventListener(
                    "error",
                    () => {

                        console.error(
                            "PHOTO LOAD ERROR:",
                            item.file_url
                        );

                    }
                );


                photoCard.appendChild(
                    img
                );


                photoGallery.appendChild(
                    photoCard
                );


                photoCount++;

            }


            // ========================================
            // VIDEO
            // ========================================

            if (
                item.media_type === "video"
            ) {

                const video =
                    document.createElement(
                        "video"
                    );


                video.controls =
                    true;


                video.playsInline =
                    true;


                video.preload =
                    "metadata";


                video.muted =
                    true;


                video.style.width =
                    "100%";


                video.style.maxWidth =
                    "100%";


                video.style.display =
                    "block";


                video.style.background =
                    "#000";


                video.style.objectFit =
                    "contain";


                const source =
                    document.createElement(
                        "source"
                    );


                source.src =
                    item.file_url;


                source.type =
                    item.mime_type ||
                    "video/mp4";


                video.appendChild(
                    source
                );


                video.addEventListener(
                    "loadedmetadata",
                    () => {

                        console.log(
                            "VIDEO LOADED:",
                            video.videoWidth,
                            "x",
                            video.videoHeight
                        );

                    }
                );


                video.addEventListener(
                    "error",
                    () => {

                        console.error(
                            "VIDEO ERROR:",
                            item.file_url,
                            video.error
                        );

                    }
                );


                videoGallery.appendChild(
                    video
                );


                videoCount++;

            }

        }
    );


    // ========================================
    // NO PHOTOS
    // ========================================

    if (photoCount === 0) {

        photoGallery.innerHTML =
            "<p>No photos available.</p>";

    }


    // ========================================
    // NO VIDEOS
    // ========================================

    if (videoCount === 0) {

        videoGallery.innerHTML =
            "<p>No videos available.</p>";

    }

}