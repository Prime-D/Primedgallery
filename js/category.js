
import { supabase } from "./supabase.js";

console.log("CATEGORY.JS LOADED");

// ========================================
// GET URL PARAMETERS
// ========================================

const params = new URLSearchParams(window.location.search);

const eventId = params.get("event");
const categoryId = params.get("category");

console.log("EVENT ID:", eventId);
console.log("CATEGORY ID:", categoryId);

// ========================================
// ELEMENTS
// ========================================

const categoryTitle = document.getElementById("categoryTitle");
const loadingMessage = document.getElementById("loadingMessage");

const photoGallery = document.getElementById("photoGallery");
const videoGallery = document.getElementById("videoGallery");

const photoSection = document.getElementById("photoSection");
const videoSection = document.getElementById("videoSection");

const backButton = document.getElementById("backButton");

// ========================================
// CHECK PARAMETERS
// ========================================

if (!eventId || !categoryId) {

    console.error("Event ID or Category ID missing.");

    document.body.innerHTML =
        "<h1>Category not found.</h1>";

} else {

    loadCategory();

}

// ========================================
// LOAD CATEGORY
// ========================================

async function loadCategory() {

    console.log("Loading category...");

    // ====================================
    // LOAD CATEGORY
    // ====================================

    const {
        data: category,
        error: categoryError
    } = await supabase
        .from("event_categories")
        .select("*")
        .eq("id", categoryId)
        .eq("event_id", eventId)
        .single();

    if (categoryError) {

        console.error(
            "CATEGORY ERROR:",
            categoryError
        );

        categoryTitle.textContent =
            "Category not found.";

        loadingMessage.textContent = "";

        return;
    }

    console.log(
        "CATEGORY LOADED:",
        category
    );

    // ====================================
    // CATEGORY TITLE
    // ====================================

    categoryTitle.textContent =
        category.category_name;

    // ====================================
    // BACK BUTTON
    // ====================================

    backButton.href =
        "./event.html?id=" + eventId;

    // ====================================
    // LOAD MEDIA
    // ====================================

    const {
        data: media,
        error: mediaError
    } = await supabase
        .from("event_media")
        .select("*")
        .eq("event_id", eventId)
        .eq("category_id", categoryId)
        .order("created_at", {
            ascending: true
        });

    if (mediaError) {

        console.error(
            "MEDIA ERROR:",
            mediaError
        );

        loadingMessage.textContent =
            "Unable to load media.";

        return;
    }

    console.log(
        "CATEGORY MEDIA:",
        media
    );

    // ====================================
    // STOP LOADING
    // ====================================

    loadingMessage.style.display =
        "none";

    // ====================================
    // CLEAR GALLERIES
    // ====================================

    photoGallery.innerHTML = "";
    videoGallery.innerHTML = "";

    // ====================================
    // SEPARATE PHOTOS / VIDEOS
    // ====================================

    const photos = media.filter(
        item =>
            item.media_type === "image" ||
            item.media_type === "photo"
    );

    const videos = media.filter(
        item =>
            item.media_type === "video"
    );

    console.log(
        "PHOTOS:",
        photos
    );

    console.log(
        "VIDEOS:",
        videos
    );

    // ====================================
    // DISPLAY PHOTOS
    // ====================================

    if (photos.length === 0) {

        photoSection.style.display =
            "none";

    } else {

        photoSection.style.display =
            "block";

        photos.forEach(
            (item, index) => {

                const card =
                    document.createElement("div");

                card.className =
                    "photo-card";

                card.style.cursor =
                    "pointer";

                const img =
                    document.createElement("img");

                img.src =
                    item.file_url;

                img.alt =
                    category.category_name;

                img.loading =
                    "lazy";

                img.addEventListener(
                    "load",
                    () => {

                        console.log(
                            "PHOTO LOADED:",
                            item.file_url
                        );

                    }
                );

                img.addEventListener(
                    "error",
                    () => {

                        console.error(
                            "PHOTO LOAD ERROR:",
                            item.file_url
                        );

                    }
                );

                // ====================================
                // OPEN PHOTO VIEWER
                // ====================================

                card.addEventListener(
                    "click",
                    () => {

                        console.log(
                            "OPENING PHOTO:",
                            item.file_url
                        );

                        openPhotoViewer(
                            photos,
                            index
                        );

                    }
                );

                card.appendChild(img);

                photoGallery.appendChild(card);

            }
        );

    }

    // ====================================
    // DISPLAY VIDEOS
    // ====================================

    if (videos.length === 0) {

        videoSection.style.display =
            "none";

    } else {

        videoSection.style.display =
            "block";

        videos.forEach(
            item => {

                const card =
                    document.createElement("div");

                card.className =
                    "video-card";

                card.style.cursor =
                    "pointer";

                const video =
                    document.createElement("video");

                video.controls = true;

                video.playsInline = true;

                video.preload = "metadata";

                video.muted = true;

                video.style.width = "100%";

                video.style.display = "block";

                const source =
                    document.createElement("source");

                source.src =
                    item.file_url;

                source.type =
                    item.mime_type ||
                    "video/mp4";

                video.appendChild(source);

                video.addEventListener(
                    "loadedmetadata",
                    () => {

                        console.log(
                            "VIDEO LOADED:",
                            item.file_url
                        );

                    }
                );

                video.addEventListener(
                    "error",
                    () => {

                        console.error(
                            "VIDEO LOAD ERROR:",
                            item.file_url,
                            video.error
                        );

                    }
                );

                // ====================================
                // OPEN VIDEO VIEWER
                // ====================================

                card.addEventListener(
                    "click",
                    (event) => {

                        /*
                         Prevent the normal video
                         controls from triggering
                         the viewer.
                        */

                        if (
                            event.target === video ||
                            event.target.closest("video")
                        ) {

                            return;
                        }

                        openVideoViewer(
                            item.file_url,
                            item.mime_type
                        );

                    }
                );

                card.appendChild(video);

                videoGallery.appendChild(card);

            }
        );

    }

    // ====================================
    // NO MEDIA
    // ====================================

    if (
        photos.length === 0 &&
        videos.length === 0
    ) {

        photoSection.style.display =
            "none";

        videoSection.style.display =
            "none";

        loadingMessage.style.display =
            "block";

        loadingMessage.textContent =
            "No photos or videos available.";

    }

}

// ========================================
// CREATE VIEWER
// ========================================

function createViewer() {

    let viewer =
        document.getElementById(
            "mediaViewer"
        );

    if (viewer) {
        return viewer;
    }

    viewer =
        document.createElement("div");

    viewer.id =
        "mediaViewer";

    viewer.innerHTML = `

        <button
            id="viewerClose"
            class="viewer-close"
        >
            ×
        </button>

        <button
            id="viewerPrev"
            class="viewer-prev"
        >
            ❮
        </button>

        <div
            id="viewerContent"
            class="viewer-content"
        ></div>

        <button
            id="viewerNext"
            class="viewer-next"
        >
            ❯
        </button>

    `;

    document.body.appendChild(viewer);

    // ====================================
    // CLOSE
    // ====================================

    document
        .getElementById("viewerClose")
        .addEventListener(
            "click",
            closeViewer
        );

    // ====================================
    // CLICK BACKGROUND TO CLOSE
    // ====================================

    viewer.addEventListener(
        "click",
        (event) => {

            if (
                event.target === viewer
            ) {

                closeViewer();

            }

        }
    );

    // ====================================
    // KEYBOARD
    // ====================================

    document.addEventListener(
        "keydown",
        (event) => {

            const activeViewer =
                document.getElementById(
                    "mediaViewer"
                );

            if (
                !activeViewer ||
                activeViewer.style.display !==
                    "flex"
            ) {

                return;
            }

            if (
                event.key === "Escape"
            ) {

                closeViewer();

            }

            if (
                event.key === "ArrowLeft"
            ) {

                document
                    .getElementById("viewerPrev")
                    .click();

            }

            if (
                event.key === "ArrowRight"
            ) {

                document
                    .getElementById("viewerNext")
                    .click();

            }

        }
    );

    return viewer;
}

// ========================================
// PHOTO VIEWER
// ========================================

let currentPhotos = [];
let currentPhotoIndex = 0;

function openPhotoViewer(
    photos,
    index
) {

    const viewer =
        createViewer();

    currentPhotos =
        photos;

    currentPhotoIndex =
        index;

    const content =
        document.getElementById(
            "viewerContent"
        );

    const prev =
        document.getElementById(
            "viewerPrev"
        );

    const next =
        document.getElementById(
            "viewerNext"
        );

    function showPhoto() {

        const photo =
            currentPhotos[
                currentPhotoIndex
            ];

        content.innerHTML = "";

        const img =
            document.createElement("img");

        img.src =
            photo.file_url;

        img.alt =
            "Event Photo";

        img.className =
            "viewer-image";

        content.appendChild(img);

        // ====================================
        // PREVIOUS
        // ====================================

        prev.style.display =
            currentPhotos.length > 1
                ? "block"
                : "none";

        // ====================================
        // NEXT
        // ====================================

        next.style.display =
            currentPhotos.length > 1
                ? "block"
                : "none";

    }

    prev.onclick = () => {

        currentPhotoIndex--;

        if (
            currentPhotoIndex < 0
        ) {

            currentPhotoIndex =
                currentPhotos.length - 1;

        }

        showPhoto();

    };

    next.onclick = () => {

        currentPhotoIndex++;

        if (
            currentPhotoIndex >=
            currentPhotos.length
        ) {

            currentPhotoIndex = 0;

        }

        showPhoto();

    };

    viewer.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";

    showPhoto();

}

// ========================================
// VIDEO VIEWER
// ========================================

function openVideoViewer(
    videoUrl,
    mimeType
) {

    const viewer =
        createViewer();

    const content =
        document.getElementById(
            "viewerContent"
        );

    const prev =
        document.getElementById(
            "viewerPrev"
        );

    const next =
        document.getElementById(
            "viewerNext"
        );

    content.innerHTML = "";

    const video =
        document.createElement("video");

    video.src =
        videoUrl;

    video.controls =
        true;

    video.autoplay =
        true;

    video.playsInline =
        true;

    video.className =
        "viewer-video";

    if (mimeType) {

        video.type =
            mimeType;

    }

    content.appendChild(video);

    prev.style.display =
        "none";

    next.style.display =
        "none";

    viewer.style.display =
        "flex";

    document.body.style.overflow =
        "hidden";

}

// ========================================
// CLOSE VIEWER
// ========================================

function closeViewer() {

    const viewer =
        document.getElementById(
            "mediaViewer"
        );

    if (!viewer) {
        return;
    }

    const content =
        document.getElementById(
            "viewerContent"
        );

    content.innerHTML = "";

    viewer.style.display =
        "none";

    document.body.style.overflow =
        "";

}

