const header = document.getElementById("siteHeader");
const menuBtn = document.getElementById("menuBtn");
const navLinks = document.getElementById("navLinks");
const reviews = Array.from(document.querySelectorAll(".review"));
const reviewDots = Array.from(document.querySelectorAll(".review-dot"));
const countElements = Array.from(document.querySelectorAll(".count"));
const revealTargets = Array.from(document.querySelectorAll(
    ".process h2, .process-card"
));
const modalOpenButtons = Array.from(document.querySelectorAll(".open-modal"));
const modalOverlays = Array.from(document.querySelectorAll(".modal-overlay"));
const enquiryForm = document.getElementById("enquiryForm");
const formStatus = document.getElementById("formStatus");

window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 18);
});

menuBtn.addEventListener("click", () => {
    navLinks.classList.toggle("open");
});

navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => navLinks.classList.remove("open"));
});

if (reviews.length > 1) {
    let reviewIndex = 0;

    const setActiveReview = (index) => {
        reviews.forEach((item, i) => item.classList.toggle("active", i === index));
        reviewDots.forEach((dot, i) => dot.classList.toggle("active", i === index));
        reviewIndex = index;
    };

    reviewDots.forEach((dot, i) => {
        dot.addEventListener("click", () => setActiveReview(i));
    });

    setInterval(() => {
        setActiveReview((reviewIndex + 1) % reviews.length);
    }, 3200);
}

const animateCount = (el) => {
    const target = Number(el.dataset.target || 0);
    const durationMs = 1400;
    const startTime = performance.now();

    const tick = (now) => {
        const progress = Math.min((now - startTime) / durationMs, 1);
        const value = Math.floor(progress * target);
        el.textContent = value.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(tick);
        }
    };

    requestAnimationFrame(tick);
};

const countObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            animateCount(entry.target);
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

countElements.forEach((item) => countObserver.observe(item));

revealTargets.forEach((el, index) => {
    el.classList.add("reveal-item");
    const delay = Math.min((index % 8) * 70, 420);
    el.style.transitionDelay = `${delay}ms`;
});

const revealObserver = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            obs.unobserve(entry.target);
        }
    });
}, { threshold: 0.14, rootMargin: "0px 0px -40px 0px" });

revealTargets.forEach((item) => revealObserver.observe(item));

const closeModal = (modal) => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
};

const openModal = (modal) => {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
};

modalOpenButtons.forEach((button) => {
    button.addEventListener("click", (event) => {
        event.preventDefault();
        const modalId = button.getAttribute("data-modal");
        const modal = document.getElementById(modalId);
        if (modal) {
            openModal(modal);
        }
    });
});

modalOverlays.forEach((overlay) => {
    overlay.addEventListener("click", (event) => {
        if (event.target === overlay || event.target.hasAttribute("data-close-modal")) {
            closeModal(overlay);
        }
    });
});

document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        const activeModal = modalOverlays.find((modal) => modal.classList.contains("is-open"));
        if (activeModal) {
            closeModal(activeModal);
        }
    }
});

const setFormStatus = (text, isError = false) => {
    if (!formStatus) return;
    formStatus.textContent = text;
    formStatus.classList.toggle("error", isError);
};

if (enquiryForm) {
    enquiryForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formData = new FormData(enquiryForm);
        const route = String(formData.get("submit_route") || "");
        const name = String(formData.get("full_name") || "");
        const phone = String(formData.get("phone") || "");
        const email = String(formData.get("email") || "");
        const moveType = String(formData.get("move_type") || "");
        const fromLocation = String(formData.get("from_location") || "");
        const toLocation = String(formData.get("to_location") || "");

        if (!route) {
            setFormStatus("Please choose a submit option first.", true);
            return;
        }

        const rawMessage =
            `New Enquiry\n` +
            `Name: ${name}\n` +
            `Phone: ${phone}\n` +
            `Email: ${email}\n` +
            `Move Type: ${moveType}\n` +
            `From: ${fromLocation}\n` +
            `To: ${toLocation}`;
        const encodedMessage = encodeURIComponent(rawMessage);

        if (route === "whatsapp") {
            const waUrl = `https://wa.me/971522013220?text=${encodedMessage}`;
            window.open(waUrl, "_blank", "noopener");
            setFormStatus("Opened WhatsApp with your enquiry details.");
            return;
        }

        if (route === "email") {
            const subject = encodeURIComponent(`New Enquiry - ${moveType || "Moving Service"}`);
            const body = encodeURIComponent(
                `Name: ${name}\n` +
                `Phone: ${phone}\n` +
                `Email: ${email}\n` +
                `Move Type: ${moveType}\n` +
                `From: ${fromLocation}\n` +
                `To: ${toLocation}`
            );
            window.location.href = `mailto:support@jimovers.com?subject=${subject}&body=${body}`;
            setFormStatus("Opened email app with your enquiry details.");
            return;
        }

        if (route === "server") {
            setFormStatus("Sending enquiry to website server...");
            try {
                const response = await fetch(enquiryForm.action || "mail.php", {
                    method: "POST",
                    body: formData,
                });
                if (!response.ok) {
                    throw new Error("Server request failed");
                }
                enquiryForm.reset();
                setFormStatus("Enquiry sent to website server successfully.");
            } catch (error) {
                setFormStatus("Server submit failed. Please try WhatsApp or Email option.", true);
            }
        }
    });
}
