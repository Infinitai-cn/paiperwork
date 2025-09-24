function setAppropriateHelpImage() {
  const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const logoImg = document.getElementById("help-logo");
  if (logoImg) {
    // Detect if we're on GitHub Pages or local dev
    const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname.includes('githubusercontent.com');
    const currentPath = window.location.pathname;
    let basePath;
    
    if (isGitHubPages) {
      if (currentPath.includes('/github-help/')) {
        basePath = '';
      } else {
        basePath = 'github-help/';
      }
    } else {
      basePath = '../github-help/';
    }
    
    logoImg.src = isDarkMode
      ? `${basePath}images/Paiperwork-APP-dark.png`
      : `${basePath}images/Paiperwork-APP-light.png`;
    //console.log("Help logo set to:", logoImg.src);
  } else {
    console.warn("Help logo element not found");
  }
}

function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", function (e) {
      // Prevent default behavior which might cause unwanted scrolling
      e.preventDefault();

      // Get the section ID
      const sectionId = this.getAttribute("data-section");
      //console.log("Clicked tab:", sectionId);

      // Remove active class from all nav items and add to current
      navItems.forEach((nav) => nav.classList.remove("active"));
      this.classList.add("active");

      // Load the content for this section
      loadSectionContent(sectionId);
    });
  });

  //console.log(`Navigation setup complete with ${navItems.length} tabs`);
}
function createLightbox() {
  const lightbox = document.createElement("div");
  lightbox.className = "help-lightbox";
  lightbox.style.display = "none";
  lightbox.style.position = "fixed";
  lightbox.style.top = "0";
  lightbox.style.left = "0";
  lightbox.style.width = "100%";
  lightbox.style.height = "100%";
  lightbox.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  lightbox.style.zIndex = "1000";
  lightbox.style.alignItems = "center";
  lightbox.style.justifyContent = "center";
  lightbox.style.cursor = "zoom-out";
  lightbox.style.display = "none";

  const lightboxImg = document.createElement("img");
  lightboxImg.className = "help-lightbox-img";
  lightboxImg.style.maxWidth = "90%";
  lightboxImg.style.maxHeight = "90%";
  lightboxImg.style.objectFit = "contain";
  lightboxImg.style.border = "2px solid #fff";
  lightboxImg.style.boxShadow = "0 0 20px rgba(0,0,0,0.5)";

  lightbox.appendChild(lightboxImg);
  document.body.appendChild(lightbox);

  lightbox.addEventListener("click", function () {
    lightbox.style.display = "none";
  });

  return lightbox;
}

// Initialize lightbox once
let helpLightbox;

function createArticleElement(article) {
    if (!helpLightbox) {
        helpLightbox = createLightbox();
      }
  const articleElement = document.createElement("div");
  articleElement.className = "help-article";
  articleElement.id = article.id;

  // Create article title (paragraph header)
  const titleElement = document.createElement("h3");
  titleElement.textContent = article.title;
  articleElement.appendChild(titleElement);

  // Create article content (text)
  const contentElement = document.createElement("div");
  contentElement.className = "help-article-content";
  contentElement.innerHTML = article.content;
  articleElement.appendChild(contentElement);

    // Handle images - support both array format and legacy single image format
    if (article.images && Array.isArray(article.images) && article.images.length > 0) {
      // Handle multiple images from images array
      article.images.forEach(imageData => {
          const figureElement = createFigureElement(imageData.src, imageData.alt || article.title, imageData.caption);
          articleElement.appendChild(figureElement);
      });
  } 
  // Fall back to legacy single image format
  else if (article.image) {
      const figureElement = createFigureElement(article.image, article.imageAlt || article.title, article.imageCaption);
      articleElement.appendChild(figureElement);
  }

  return articleElement;

  return articleElement;
}
function createFigureElement(imageSrc, imageAlt, imageCaption) {
  const figureElement = document.createElement("figure");
  figureElement.className = "help-figure";

  const imageContainer = document.createElement("div");
  imageContainer.className = "image-container";
  imageContainer.style.maxWidth = "400px"; // Limit container width
  imageContainer.style.margin = "0 auto"; // Center the image container
  imageContainer.style.cursor = "zoom-in";

  const imageElement = document.createElement("img");
  
  // Detect if we're on GitHub Pages or local dev
  const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname.includes('githubusercontent.com');
  const currentPath = window.location.pathname;
  let basePath;
  
  if (isGitHubPages) {
    if (currentPath.includes('/github-help/')) {
      basePath = '';
    } else {
      basePath = 'github-help/';
    }
  } else {
    basePath = '../github-help/';
  }
  
  imageElement.src = `${basePath}images/help/${imageSrc}`;
  imageElement.alt = imageAlt;
  imageElement.className = "help-image";
  imageElement.setAttribute("loading", "lazy");

  // Add click event to show the full-size image
  imageContainer.addEventListener("click", function () {
    const lightboxImg = helpLightbox.querySelector(".help-lightbox-img");
    lightboxImg.src = imageElement.src;
    lightboxImg.alt = imageElement.alt;
    helpLightbox.style.display = "flex";
  });

  // Add load and error event handlers
  imageElement.addEventListener("load", function () {
    this.classList.add("loaded");
  });

  imageElement.addEventListener("error", function () {
    this.src = `${basePath}images/help/placeholder.png`;
    this.classList.add("loaded");
    //console.log(`Image not found: ${imageSrc}, using placeholder instead`);
  });  imageContainer.appendChild(imageElement);
  figureElement.appendChild(imageContainer);

  // Add caption if available
  if (imageCaption) {
      const captionElement = document.createElement("figcaption");
      captionElement.textContent = imageCaption;
      figureElement.appendChild(captionElement);
  }

  return figureElement;
}
function loadSectionContent(sectionId) {
  // Always target specifically the content div by ID
  const contentContainer = document.getElementById("help-content-target");
  if (!contentContainer) {
    console.error("Content container not found by ID");
    return;
  }

  // Check if helpContent exists and is loaded using window.helpContent
  if (!window.helpContent || !window.helpContentLoaded) {
    console.error("Help content not loaded yet");
    contentContainer.innerHTML = `<p>${Lang.get('loadingContent') || 'Loading content, please wait...'}</p>`;

    // Try again in a moment if content isn't loaded yet
    setTimeout(() => {
      if (window.helpContent) {
        loadSectionContent(sectionId);
      }
    }, 500);
    return;
  }

  // Get the section data from window.helpContent
  const sectionData = window.helpContent[sectionId];
  if (!sectionData) {
    console.warn(`No content found for section: ${sectionId}`);
    contentContainer.innerHTML = `<p>${Lang.get('contentComingSoon') || 'Content for this section coming soon.'}</p>`;
    return;
  }

  // Save current scroll position
  const scrollPos = window.scrollY;

  // ONLY clear the content container, not the header or navigation
  contentContainer.innerHTML = "";

  // Create section container
  const sectionElement = document.createElement("div");
  sectionElement.className = "help-section active";

  // Add section title
  const titleElement = document.createElement("h2");
  titleElement.textContent = sectionData.title;
  sectionElement.appendChild(titleElement);

  // Add section intro if available
  if (sectionData.intro) {
    const introElement = document.createElement("p");
    introElement.textContent = sectionData.intro;
    sectionElement.appendChild(introElement);
  }

  // Add articles
  if (sectionData.articles && sectionData.articles.length > 0) {
    // Create article index if there are multiple articles
    if (sectionData.articles.length > 1) {
      const indexElement = document.createElement("div");
      indexElement.className = "article-index";

      const indexTitle = document.createElement("h3");
      indexTitle.textContent = Lang.get('inThisSection') || 'In This Section:';
      indexElement.appendChild(indexTitle);

      const indexList = document.createElement("ul");
      indexList.className = "article-index-list";

      sectionData.articles.forEach((article) => {
        const listItem = document.createElement("li");
        listItem.className = "article-index-item";

        const link = document.createElement("a");
        link.className = "article-index-link";
        link.textContent = article.title;
        link.href = `#${article.id}`;
        link.addEventListener("click", function (e) {
          e.preventDefault();
          const targetArticle = document.getElementById(article.id);
          if (targetArticle) {
            targetArticle.scrollIntoView({ behavior: "smooth" });
          }
        });

        listItem.appendChild(link);
        indexList.appendChild(listItem);
      });

      indexElement.appendChild(indexList);
      sectionElement.appendChild(indexElement);
    }

    // Add each article
    sectionData.articles.forEach((article) => {
      const articleElement = createArticleElement(article);
      sectionElement.appendChild(articleElement);
    });
  } else {
    const noArticlesElement = document.createElement("p");
    noArticlesElement.textContent = Lang.get('noArticlesAvailable') || 'No articles available for this section.';
    sectionElement.appendChild(noArticlesElement);
  }

  contentContainer.appendChild(sectionElement);

  // Restore the scroll position - this prevents the page from jumping
  // Use setTimeout to ensure DOM changes are complete
  setTimeout(() => {
    window.scrollTo(0, scrollPos);
  }, 0);

  // Debug line to confirm header still exists after content is loaded
  //console.log(
  //"Header element exists:",
  //!!document.querySelector(".help-header")
  //);
  //console.log(
  //"Header element is visible:",
  //document.querySelector(".help-header").offsetParent !== null
  //);
}

function setupScrollDetection() {
  window.addEventListener("scroll", function () {
    const navigationWrapper = document.querySelector(".help-navigation-wrapper");
    if (navigationWrapper) {
      if (window.scrollY > 10) {
        navigationWrapper.parentElement.classList.add("scrolled");
      } else {
        navigationWrapper.parentElement.classList.remove("scrolled");
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", function () {
  //console.log("Help page initialized");

  // Set logo based on theme
  setAppropriateHelpImage();

  // Setup tab navigation
  setupNavigation();

  // Setup scroll detection
  setupScrollDetection();

  // Setup return button
  const closeButton = document.getElementById("close-help");
  if (closeButton) {
    closeButton.addEventListener("click", function () {
      try {
        // Check if we're on GitHub Pages
        const isGitHubPages = window.location.hostname.includes('github.io') || window.location.hostname.includes('githubusercontent.com');
        
        if (isGitHubPages) {
          // On GitHub Pages, go back to the repository main page
          window.location.href = '../';
        } else {
          // For local development, scroll to top to show tabs
          if (window.scrollTo) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          } else {
            window.scrollTo(0, 0);
          }

          // Ensure the navigation wrapper is visible at the top
          const navWrapper = document.querySelector('.help-navigation-wrapper') || document.querySelector('.help-header');
          if (navWrapper && navWrapper.scrollIntoView) {
            navWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }

          // Focus the first tab for accessibility
          const firstNav = document.querySelector('.nav-item');
          if (firstNav && firstNav.focus) {
            firstNav.focus();
          }
        }
      } catch (err) {
        // Fallback: instant scroll if anything goes wrong
        window.scrollTo(0, 0);
      }
    });
  }

  // Check if content is loaded before trying to use it (using window.helpContent)
  if (window.helpContentLoaded && window.helpContent) {
    // Load content for the first tab by default
    const activeTab =
      document.querySelector(".nav-item.active") ||
      document.querySelector(".nav-item");
    if (activeTab) {
      const sectionId = activeTab.getAttribute("data-section");
      if (sectionId) {
        loadSectionContent(sectionId);
      }
    }
  } else {
    console.warn("Help content not loaded yet, will try again");
    // Try again in a moment
    setTimeout(() => {
      if (window.helpContent) {
        const activeTab =
          document.querySelector(".nav-item.active") ||
          document.querySelector(".nav-item");
        if (activeTab) {
          loadSectionContent(activeTab.getAttribute("data-section"));
        }
      } else {
        console.error("Help content failed to load after timeout");
        document.getElementById("help-content-target").innerHTML =
          "<p>Error loading help content. Please refresh the page and try again.</p>";
      }
    }, 1000);
  }
});

// Delegated fallback: ensure the close-help button always scrolls to top
document.addEventListener('click', function (e) {
  const target = e.target;
  if (target && (target.id === 'close-help' || target.closest && target.closest('#close-help'))) {
    try {
      if (window.scrollTo) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        window.scrollTo(0, 0);
      }
      const navWrapper = document.querySelector('.help-navigation-wrapper') || document.querySelector('.help-header');
      if (navWrapper && navWrapper.scrollIntoView) {
        navWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      const firstNav = document.querySelector('.nav-item');
      if (firstNav && firstNav.focus) firstNav.focus();
    } catch (err) {
      window.scrollTo(0, 0);
    }
  }
});
