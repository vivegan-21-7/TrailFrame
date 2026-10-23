const form = document.getElementById("search-form");
const input = document.getElementById("topic-input");
const results = document.getElementById("results");
const statusText = document.getElementById("result-count");
const emptyState = document.getElementById("empty-state");
const searchButton = document.getElementById("search-button");
const chips = document.querySelectorAll(".chip");

async function searchImages(query) {
  const url =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    "&gsrsearch=" + encodeURIComponent(query) +
    "&gsrnamespace=6&gsrlimit=12&prop=imageinfo&iiprop=url|extmetadata" +
    "&iiurlwidth=500&format=json&origin=*";

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Image API status: " + response.status);
  }

  const data = await response.json();
  return Object.values(data.query?.pages || {});
}

function renderResults(items, query) {
  results.innerHTML = "";

  const usableItems = items.filter(
    item => item.imageinfo?.[0]?.thumburl || item.imageinfo?.[0]?.url
  );

  emptyState.hidden = usableItems.length > 0;

  if (usableItems.length === 0) {
    statusText.textContent = `No results for “${query}”`;
    emptyState.querySelector("h3").textContent = "No images found.";
    emptyState.querySelector("p").textContent =
      "Try another topic or a simpler search phrase.";
    return;
  }

  statusText.textContent = `Showing ${usableItems.length} results for “${query}”`;
  emptyState.querySelector("h3").textContent = "Your next idea starts here.";
  emptyState.querySelector("p").textContent =
    "Search for a topic to make room for inspiration. Your image collection will appear in this space.";

  usableItems.forEach(item => {
    const info = item.imageinfo[0];
    const card = document.createElement("article");
    card.className = "card";

    const link = document.createElement("a");
    link.className = "card-link";
    link.href = info.descriptionurl || info.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Open full image: ${item.title}`);

    const img = document.createElement("img");
    img.src = info.thumburl || info.url;
    img.alt = item.title.replace(/^File:/, "").replace(/_/g, " ");
    img.loading = "lazy";

    const caption = document.createElement("div");
    caption.className = "card-caption";

    const title = document.createElement("h3");
    title.textContent = item.title.replace(/^File:/, "").replace(/_/g, " ");

    const note = document.createElement("p");
    note.textContent = "Open image ↗";

    caption.appendChild(title);
    caption.appendChild(note);
    link.appendChild(img);
    link.appendChild(caption);
    card.appendChild(link);
    results.appendChild(card);
  });
}

form.addEventListener("submit", async event => {
  event.preventDefault();

  const query = input.value.trim();
  if (!query) {
    statusText.textContent = "Type a topic to get started";
    input.focus();
    return;
  }

  // Loading state: tell the user the request is in progress.
  statusText.innerHTML = '<span class="loading-indicator" aria-hidden="true"></span> Searching…';
  searchButton.disabled = true;
  searchButton.textContent = "Searching…";
  results.innerHTML = "";
  emptyState.hidden = true;

  try {
    const items = await searchImages(query);
    renderResults(items, query);
  } catch (error) {
    console.error(error);
    statusText.textContent = "Search failed";
    results.innerHTML = "";
    emptyState.hidden = false;
    emptyState.querySelector("h3").textContent = "Couldn't load images.";
    emptyState.querySelector("p").textContent =
      "Check your internet connection and try again.";
  } finally {
    searchButton.disabled = false;
    searchButton.innerHTML = 'Search <span aria-hidden="true">↗</span>';
  }
});

chips.forEach(chip => {
  chip.addEventListener("click", () => {
    input.value = chip.dataset.query;
    form.requestSubmit();
  });
});
