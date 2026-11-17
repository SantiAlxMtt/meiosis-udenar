document.addEventListener("DOMContentLoaded", () => {
    const htmlRoot = document.documentElement;
    const slides = Array.from(document.querySelectorAll(".slide"));
    const dotButtons = Array.from(document.querySelectorAll(".dot-btn"));
    const cards = Array.from(document.querySelectorAll(".interactive-card"));
    const mediaBoxes = Array.from(document.querySelectorAll(".media-box"));
    const mediaItems = Array.from(document.querySelectorAll(".lightbox-item"));
    const themeToggleBtn = document.getElementById("themeToggleBtn");

    // Split View Modal elements
    const splitViewModal = document.getElementById("splitViewModal");
    const splitViewDialog = document.getElementById("splitViewDialog");
    const splitCloseBtn = document.getElementById("splitCloseBtn");
    const splitViewGrid = document.getElementById("splitViewGrid");
    const splitSimStage = document.getElementById("splitSimStage");
    const splitCardIndex = document.getElementById("splitCardIndex");
    const splitCardTitle = document.getElementById("splitCardTitle");
    const splitCardKeywords = document.getElementById("splitCardKeywords");
    const splitConceptsList = document.getElementById("splitConceptsList");

    // Native Fullscreen Lightbox elements
    const lightboxModal = document.getElementById("lightboxModal");
    const lightboxContent = document.getElementById("lightboxContent");

    let currentIndex = 0;
    let isTransitioning = false;
    const totalSlides = slides.length;

    const VIDEO_SVG_ICON = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <polygon points="6 4 20 12 6 20 6 4"></polygon>
        </svg>
    `;

    const IMAGE_SVG_ICON = `
        <svg viewBox="0 0 24 24" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="3" ry="3"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
    `;

    // =========================================================================
    // 1. 3D DIRECTIONAL SLIDE NAVIGATION WITH TRANSITION LOCK
    // =========================================================================
    function syncSlideDirectionalStates(activeIdx) {
        slides.forEach((slide, idx) => {
            slide.classList.remove("active", "is-past", "is-future", "prev-exit");
            if (idx === activeIdx) {
                slide.classList.add("active");
                slide.scrollTop = 0;
            } else if (idx < activeIdx) {
                slide.classList.add("is-past", "prev-exit");
            } else {
                slide.classList.add("is-future");
            }
        });

        dotButtons.forEach((btn, idx) => {
            btn.classList.toggle("active", idx === activeIdx);
        });
    }

    function navigateToSlide(targetIndex) {
        if (
            isTransitioning ||
            targetIndex < 0 ||
            targetIndex >= totalSlides ||
            targetIndex === currentIndex
        ) {
            return;
        }

        isTransitioning = true;
        currentIndex = targetIndex;
        syncSlideDirectionalStates(currentIndex);

        setTimeout(() => {
            isTransitioning = false;
        }, 420);
    }

    syncSlideDirectionalStates(0);

    dotButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const target = parseInt(btn.getAttribute("data-slide-target"), 10);
            navigateToSlide(target);
        });
    });

    // =========================================================================
    // 2. THEME SYSTEM (DARK / LIGHT MODE) AND DYNAMIC IMAGE SWITCHING
    // =========================================================================
    function getActiveTheme() {
        return htmlRoot.getAttribute("data-theme") || "dark";
    }

    function updateThemeMedia(theme) {
        const allThemeNodes = document.querySelectorAll(".theme-img, .media-placeholder-canvas[data-dark-src]");

        allThemeNodes.forEach((node) => {
            const darkSrc = node.getAttribute("data-dark-src");
            const lightSrc = node.getAttribute("data-light-src");
            const targetSrc = theme === "light" ? (lightSrc || darkSrc) : darkSrc;
            if (!targetSrc) return;

            if (node.classList.contains("media-placeholder-canvas")) {
                node.setAttribute("data-current-src", targetSrc);
                const label = node.querySelector(".placeholder-filename");
                if (label) label.textContent = targetSrc;

                const probeImg = new Image();
                probeImg.onload = () => {
                    const restoredImg = document.createElement("img");
                    restoredImg.className = "lightbox-item theme-img";
                    restoredImg.src = targetSrc;
                    restoredImg.setAttribute("data-dark-src", darkSrc);
                    restoredImg.setAttribute("data-light-src", lightSrc || darkSrc);
                    restoredImg.alt = node.getAttribute("data-alt") || "";
                    attachMediaBehavior(restoredImg);
                    if (node.parentNode) {
                        node.parentNode.replaceChild(restoredImg, node);
                    }
                };
                probeImg.src = targetSrc;
            } else if (node.tagName.toLowerCase() === "img") {
                node.classList.add("theme-switching");
                node.setAttribute("src", targetSrc);
                setTimeout(() => node.classList.remove("theme-switching"), 220);
            }
        });
    }

    function toggleTheme() {
        const nextTheme = getActiveTheme() === "dark" ? "light" : "dark";
        htmlRoot.setAttribute("data-theme", nextTheme);
        document.body.setAttribute("data-theme", nextTheme);
        updateThemeMedia(nextTheme);
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleTheme();
        });
    }

    // =========================================================================
    // 3. NATIVE FULLSCREEN LIGHTBOX
    // =========================================================================
    function openLightboxWithNode(node) {
        if (!lightboxModal || !lightboxContent) return;
        lightboxContent.innerHTML = "";
        lightboxContent.appendChild(node);
        lightboxModal.classList.add("open");
        lightboxModal.setAttribute("aria-hidden", "false");
    }

    function closeLightbox() {
        if (!lightboxModal || !lightboxModal.classList.contains("open")) return;
        lightboxModal.classList.remove("open");
        lightboxModal.setAttribute("aria-hidden", "true");
        setTimeout(() => {
            lightboxContent.innerHTML = "";
        }, 420);
    }

    if (lightboxModal) {
        lightboxModal.addEventListener("click", closeLightbox);
    }

    function buildLightboxMediaClone(mediaEl) {
        const isVideo = mediaEl.tagName.toLowerCase() === "video";
        const activeSrc = mediaEl.currentSrc || mediaEl.getAttribute("src");

        if (isVideo) {
            const videoClone = document.createElement("video");
            videoClone.src = activeSrc;
            videoClone.autoplay = true;
            videoClone.loop = true;
            videoClone.muted = true;
            videoClone.playsInline = true;
            return videoClone;
        }

        const imgClone = document.createElement("img");
        if (mediaEl.classList.contains("theme-img")) {
            imgClone.className = "theme-img";
        }
        imgClone.src = activeSrc;
        imgClone.alt = mediaEl.getAttribute("alt") || "";
        const darkSrc = mediaEl.getAttribute("data-dark-src");
        const lightSrc = mediaEl.getAttribute("data-light-src");
        if (darkSrc) imgClone.setAttribute("data-dark-src", darkSrc);
        if (lightSrc) imgClone.setAttribute("data-light-src", lightSrc);
        return imgClone;
    }

    function openMediaBoxInLightbox(boxEl) {
        const mediaChild = boxEl.querySelector("video, img, .media-placeholder-canvas");
        if (!mediaChild) return;

        if (mediaChild.classList.contains("media-placeholder-canvas")) {
            openLightboxWithNode(mediaChild.cloneNode(true));
            return;
        }
        openLightboxWithNode(buildLightboxMediaClone(mediaChild));
    }

    // =========================================================================
    // 4. PLACEHOLDER GENERATOR AND MEDIA INTERACTION
    // =========================================================================
    function isInsideSplitCardPreview(el) {
        const parentCard = el.closest(".interactive-card");
        if (!parentCard) return false;
        return (
            !parentCard.classList.contains("visual-only-card") &&
            parentCard.querySelector(".split-data-template") !== null &&
            !el.closest("#splitSimStage")
        );
    }

    function createPlaceholderElement(srcAttr, isVideo, darkSrc = "", lightSrc = "", altText = "") {
        const wrapper = document.createElement("div");
        wrapper.className = "media-placeholder-canvas";
        wrapper.setAttribute("data-current-src", srcAttr);
        if (darkSrc) wrapper.setAttribute("data-dark-src", darkSrc);
        if (lightSrc) wrapper.setAttribute("data-light-src", lightSrc);
        if (altText) wrapper.setAttribute("data-alt", altText);

        wrapper.innerHTML = `
            <div class="placeholder-icon">${isVideo ? VIDEO_SVG_ICON : IMAGE_SVG_ICON}</div>
            <span class="placeholder-type-badge">${isVideo ? "SIMULACIÓN (.MP4)" : "IMAGEN (.JPG)"}</span>
            <span class="placeholder-filename">${srcAttr}</span>
        `;

        wrapper.addEventListener("click", (ev) => {
            if (isInsideSplitCardPreview(wrapper)) {
                return;
            }
            ev.stopPropagation();
            openLightboxWithNode(wrapper.cloneNode(true));
        });

        return wrapper;
    }

    function attachMediaBehavior(mediaEl) {
        const isVideo = mediaEl.tagName.toLowerCase() === "video";
        const darkSrc = mediaEl.getAttribute("data-dark-src") || "";
        const lightSrc = mediaEl.getAttribute("data-light-src") || "";
        const altText = mediaEl.getAttribute("alt") || "";

        const handleMediaError = () => {
            const currentSrc = mediaEl.getAttribute("src");
            const placeholder = createPlaceholderElement(currentSrc, isVideo, darkSrc, lightSrc, altText);
            if (mediaEl.parentNode) {
                mediaEl.parentNode.replaceChild(placeholder, mediaEl);
            }
        };

        mediaEl.addEventListener("error", handleMediaError);
        if (!isVideo && mediaEl.complete && mediaEl.naturalWidth === 0) {
            handleMediaError();
            return;
        }

        mediaEl.addEventListener("click", (ev) => {
            if (isInsideSplitCardPreview(mediaEl)) {
                return;
            }
            ev.stopPropagation();
            openLightboxWithNode(buildLightboxMediaClone(mediaEl));
        });
    }

    mediaItems.forEach(attachMediaBehavior);

    mediaBoxes.forEach((box) => {
        box.addEventListener("click", (ev) => {
            if (isInsideSplitCardPreview(box)) {
                return;
            }
            ev.stopPropagation();
            openMediaBoxInLightbox(box);
        });
    });

    // =========================================================================
    // 5. EXCLUSIVE BENTO-FLEX ACCORDION IN CONCEPT CARDS
    // =========================================================================
    function syncConceptListState(container) {
        const hasExpanded = container.querySelector(".concept-item.expanded") !== null;
        container.classList.toggle("has-expanded", hasExpanded);
    }

    function bindConceptCardsExclusiveAccordion(container) {
        const conceptItems = Array.from(container.querySelectorAll(".concept-item"));
        container.classList.remove("has-expanded");

        conceptItems.forEach((item, index) => {
            item.setAttribute("tabindex", "0");
            item.setAttribute("role", "button");
            item.setAttribute("aria-expanded", "false");

            const heading = item.querySelector("h4");
            if (heading && !item.querySelector(".concept-item-header")) {
                const headerBar = document.createElement("div");
                headerBar.className = "concept-item-header";

                const titleGroup = document.createElement("div");
                titleGroup.className = "concept-title-group";

                const stepBadge = document.createElement("span");
                stepBadge.className = "concept-step-badge";
                stepBadge.textContent = `CONCEPTO 0${index + 1}`;

                const toggleOrb = document.createElement("span");
                toggleOrb.className = "concept-toggle-orb";
                toggleOrb.setAttribute("aria-hidden", "true");
                toggleOrb.innerHTML = `<span class="concept-chevron"></span>`;

                item.insertBefore(headerBar, heading);
                titleGroup.appendChild(stepBadge);
                titleGroup.appendChild(heading);
                headerBar.appendChild(titleGroup);
                headerBar.appendChild(toggleOrb);
            }

            if (!item.querySelector(".concept-drawer")) {
                const headerBar = item.querySelector(".concept-item-header");
                const drawer = document.createElement("div");
                drawer.className = "concept-drawer";
                const inner = document.createElement("div");
                inner.className = "concept-drawer-inner";

                Array.from(item.children).forEach((child) => {
                    if (child !== headerBar) {
                        inner.appendChild(child);
                    }
                });

                drawer.appendChild(inner);
                item.appendChild(drawer);
            }

            item.addEventListener("mousemove", (ev) => {
                const rect = item.getBoundingClientRect();
                item.style.setProperty("--cmx", `${ev.clientX - rect.left}px`);
                item.style.setProperty("--cmy", `${ev.clientY - rect.top}px`);
            });

            item.addEventListener("click", (ev) => {
                ev.stopPropagation();
                const isAlreadyExpanded = item.classList.contains("expanded");

                conceptItems.forEach((otherItem) => {
                    otherItem.classList.remove("expanded");
                    otherItem.setAttribute("aria-expanded", "false");
                });

                if (!isAlreadyExpanded) {
                    item.classList.add("expanded");
                    item.setAttribute("aria-expanded", "true");
                }

                syncConceptListState(container);
            });

            item.addEventListener("keydown", (ev) => {
                if (ev.key === "Enter" || ev.key === " ") {
                    ev.preventDefault();
                    item.click();
                }
            });
        });

        syncConceptListState(container);
    }

    function buildSplitStageMediaNode(template, card) {
        const mediaType = template.getAttribute("data-media-type") || "image";
        const theme = getActiveTheme();

        if (mediaType === "video") {
            const simSrc = template.getAttribute("data-sim-src") || "sim_profase1.mp4";
            const video = document.createElement("video");
            video.className = "lightbox-item";
            video.src = simSrc;
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            video.playsInline = true;
            attachMediaBehavior(video);
            return video;
        }

        const previewNode = card ? card.querySelector(".card-preview-box [data-dark-src]") : null;
        const darkSrc =
            template.getAttribute("data-dark-src") ||
            (previewNode ? previewNode.getAttribute("data-dark-src") : "img_placeholder_dark.jpg");
        const lightSrc =
            template.getAttribute("data-light-src") ||
            (previewNode ? previewNode.getAttribute("data-light-src") : darkSrc);
        const activeSrc = theme === "light" ? lightSrc : darkSrc;

        const img = document.createElement("img");
        img.className = "lightbox-item theme-img";
        img.src = activeSrc;
        img.setAttribute("data-dark-src", darkSrc);
        img.setAttribute("data-light-src", lightSrc);
        img.alt = card && card.querySelector("h3") ? card.querySelector("h3").textContent : "";
        attachMediaBehavior(img);
        return img;
    }

    function openCardSplitView(card) {
        if (!splitViewModal) return;
        const template = card.querySelector(".split-data-template");
        if (!template) return;

        const chipEl = card.querySelector(".index-chip, .step-pill");
        const titleEl = card.querySelector("h3");
        const kwRowEl = card.querySelector(".kw-row");
        const splitPos = card.getAttribute("data-split-pos") || "left";

        splitViewGrid.setAttribute("data-sim-side", splitPos);
        splitCardIndex.textContent = chipEl ? chipEl.textContent : "";
        splitCardTitle.textContent = titleEl ? titleEl.textContent : "";
        splitCardKeywords.innerHTML = kwRowEl ? kwRowEl.innerHTML : "";

        splitConceptsList.innerHTML = template.innerHTML;
        bindConceptCardsExclusiveAccordion(splitConceptsList);

        splitSimStage.innerHTML = "";
        const stageMediaNode = buildSplitStageMediaNode(template, card);
        splitSimStage.appendChild(stageMediaNode);

        if (splitViewDialog) {
            splitViewDialog.scrollTop = 0;
        }

        card.classList.add("revealed");
        splitViewModal.classList.add("open");
        splitViewModal.setAttribute("aria-hidden", "false");
    }

    function closeCardSplitView() {
        if (!splitViewModal || !splitViewModal.classList.contains("open")) return;
        splitViewModal.classList.remove("open");
        splitViewModal.setAttribute("aria-hidden", "true");
        setTimeout(() => {
            splitSimStage.innerHTML = "";
        }, 420);
    }

    cards.forEach((card) => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty("--mx", `${x}px`);
            card.style.setProperty("--my", `${y}px`);
        });

        card.addEventListener("click", (e) => {
            if (card.classList.contains("accordion-card")) {
                e.stopPropagation();
                const isAlreadyExpanded = card.classList.contains("expanded");
                const parentSlide = card.closest(".slide");
                const siblingAccordions = parentSlide
                    ? Array.from(parentSlide.querySelectorAll(".accordion-card"))
                    : Array.from(document.querySelectorAll(".accordion-card"));

                siblingAccordions.forEach((otherCard) => {
                    otherCard.classList.remove("expanded", "revealed");
                });

                if (!isAlreadyExpanded) {
                    card.classList.add("expanded", "revealed");
                }
                return;
            }

            if (card.classList.contains("visual-only-card")) {
                e.stopPropagation();
                const box = card.querySelector(".media-box");
                if (box) {
                    card.classList.add("revealed");
                    openMediaBoxInLightbox(box);
                }
                return;
            }

            openCardSplitView(card);
        });

        card.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                card.click();
            }
        });
    });

    if (splitCloseBtn) {
        splitCloseBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            closeCardSplitView();
        });
    }

    if (splitViewModal && splitViewDialog) {
        splitViewModal.addEventListener("click", (e) => {
            if (!splitViewDialog.contains(e.target)) {
                closeCardSplitView();
            }
        });
    }

    // =========================================================================
    // 6. FULLSCREEN ('F' KEY) AND KEYBOARD CONTROLS
    // =========================================================================
    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && lightboxModal && lightboxModal.classList.contains("open")) {
            closeLightbox();
            return;
        }
        if (e.key === "Escape" && splitViewModal && splitViewModal.classList.contains("open")) {
            closeCardSplitView();
            return;
        }
        if (e.key === "f" || e.key === "F") {
            e.preventDefault();
            toggleFullscreen();
            return;
        }
        if (e.key === "t" || e.key === "T") {
            e.preventDefault();
            toggleTheme();
            return;
        }
        if (
            (lightboxModal && lightboxModal.classList.contains("open")) ||
            (splitViewModal && splitViewModal.classList.contains("open"))
        ) {
            return;
        }

        if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
            e.preventDefault();
            navigateToSlide(currentIndex + 1);
        } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
            e.preventDefault();
            navigateToSlide(currentIndex - 1);
        } else if (e.key === "Home") {
            e.preventDefault();
            navigateToSlide(0);
        } else if (e.key === "End") {
            e.preventDefault();
            navigateToSlide(totalSlides - 1);
        }
    });

    // =========================================================================
    // 7. SINGLE-INSTANCE TOUCH SWIPE FOR MOBILE AND TABLETS
    // =========================================================================
    let touchStartX = 0;
    let touchStartY = 0;
    let isSingleTouch = false;

    document.addEventListener(
        "touchstart",
        (e) => {
            if (!e.touches || e.touches.length !== 1) {
                isSingleTouch = false;
                return;
            }
            if (e.target.closest(".dot-navigation")) {
                isSingleTouch = false;
                return;
            }
            isSingleTouch = true;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        },
        { passive: true }
    );

    document.addEventListener(
        "touchend",
        (e) => {
            if (!isSingleTouch) return;
            isSingleTouch = false;

            if (
                (lightboxModal && lightboxModal.classList.contains("open")) ||
                (splitViewModal && splitViewModal.classList.contains("open"))
            ) {
                return;
            }
            if (!e.changedTouches || e.changedTouches.length !== 1) return;

            const deltaX = e.changedTouches[0].clientX - touchStartX;
            const deltaY = e.changedTouches[0].clientY - touchStartY;

            if (Math.abs(deltaX) > 60 && Math.abs(deltaX) > Math.abs(deltaY) * 1.6) {
                if (deltaX < 0) {
                    navigateToSlide(currentIndex + 1);
                } else {
                    navigateToSlide(currentIndex - 1);
                }
            }
        },
        { passive: true }
    );
});

// ===================
//     SantixCode
// ===================