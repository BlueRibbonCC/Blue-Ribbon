const GOOGLE_MAPS_API_KEY = "AIzaSyC0wTANShUs16bnqdH5cpSu4kBQFKamTOk";
const SERVICE_AREA_CENTER = Object.freeze({ lat: 39.2156262, lng: -77.1153263 });
const SERVICE_AREA_RADIUS_MILES = 23;
const METERS_PER_MILE = 1609.344;

const menuButton = document.querySelector(".menu-toggle");
const menuLabel = menuButton?.querySelector(".sr-only");
const siteNav = document.querySelector(".site-nav");
const header = document.querySelector("[data-header]");
const year = document.querySelector("[data-year]");
const serviceAreaMap = document.querySelector("#service-area-map");
const copyButtons = document.querySelectorAll("[data-copy]");
const toast = document.querySelector("[data-toast]");
const toastMessage = document.querySelector("[data-toast-message]");
const toastDismiss = document.querySelector("[data-toast-dismiss]");
let toastTimer;

const showMapMessage = (message, role = "status") => {
  if (!serviceAreaMap) return;
  serviceAreaMap.classList.add("service-map-frame--message");
  serviceAreaMap.setAttribute("role", role);
  serviceAreaMap.textContent = message;
};

window.initServiceMap = () => {
  if (!serviceAreaMap || !window.google?.maps) return;

  serviceAreaMap.classList.remove("service-map-frame--message");
  serviceAreaMap.setAttribute("role", "region");
  serviceAreaMap.textContent = "";

  const rootStyles = getComputedStyle(document.documentElement);
  const primaryColor = rootStyles.getPropertyValue("--color-primary").trim();
  const accentColor = rootStyles.getPropertyValue("--color-accent").trim();
  const map = new window.google.maps.Map(serviceAreaMap, {
    center: SERVICE_AREA_CENTER,
    zoom: 8,
    gestureHandling: "cooperative",
    mapTypeControl: false,
    streetViewControl: false,
  });

  const serviceRadius = new window.google.maps.Circle({
    map,
    center: SERVICE_AREA_CENTER,
    radius: SERVICE_AREA_RADIUS_MILES * METERS_PER_MILE,
    strokeColor: primaryColor,
    strokeOpacity: 0.95,
    strokeWeight: 3,
    fillColor: accentColor,
    fillOpacity: 0.22,
    clickable: false,
  });

  map.fitBounds(serviceRadius.getBounds(), 32);
};

window.gm_authFailure = () => {
  showMapMessage("The service-area map could not load. Check the API key and its website restrictions.", "alert");
};

const loadServiceAreaMap = () => {
  if (!serviceAreaMap) return;

  if (GOOGLE_MAPS_API_KEY === "PASTE_YOUR_GOOGLE_MAPS_API_KEY_HERE") {
    showMapMessage("Add your Google Maps API key at the top of script.js to load the 20-mile service-area map.");
    return;
  }

  const mapsScript = document.createElement("script");
  mapsScript.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}&callback=initServiceMap&loading=async&v=weekly`;
  mapsScript.async = true;
  mapsScript.onerror = () => {
    showMapMessage("The service-area map could not load. Check the API key and Maps JavaScript API settings.", "alert");
  };
  document.head.append(mapsScript);
};

const closeMenu = () => {
  menuButton?.setAttribute("aria-expanded", "false");
  siteNav?.classList.remove("is-open");
  document.body.classList.remove("menu-open");
  if (menuLabel) menuLabel.textContent = "Open navigation";
};

menuButton?.addEventListener("click", () => {
  const isOpen = menuButton.getAttribute("aria-expanded") === "true";
  menuButton.setAttribute("aria-expanded", String(!isOpen));
  siteNav?.classList.toggle("is-open", !isOpen);
  document.body.classList.toggle("menu-open", !isOpen);
  if (menuLabel) menuLabel.textContent = isOpen ? "Open navigation" : "Close navigation";
});

siteNav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", closeMenu);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});

window.addEventListener(
  "scroll",
  () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 8);
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  if (window.innerWidth > 832) closeMenu();
});

const hideToast = () => {
  if (!toast) return;
  toast.hidden = true;
  window.clearTimeout(toastTimer);
};

const showToast = (message, isError = false) => {
  if (!toast || !toastMessage) return;
  toast.setAttribute("role", isError ? "alert" : "status");
  toastMessage.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(hideToast, 5000);
};

const copyText = async (text) => {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.opacity = "0";
  document.body.append(helper);
  helper.select();

  const copied = document.execCommand("copy");
  helper.remove();

  if (!copied) throw new Error("Copy command failed");
};

copyButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    const text = button.dataset.copy;
    const label = button.dataset.copyLabel || "Contact information";
    if (!text) return;

    try {
      await copyText(text);
      showToast(`${label} copied.`);
    } catch {
      showToast(`Couldn’t copy ${label.toLowerCase()}. Select and copy it manually.`, true);
    }
  });
});

toastDismiss?.addEventListener("click", hideToast);

if (year) year.textContent = String(new Date().getFullYear());

loadServiceAreaMap();
