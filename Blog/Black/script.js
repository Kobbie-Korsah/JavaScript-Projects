// ============================================
// DOM ELEMENT REFERENCES
// ============================================
let blogForm, submitBtn, blogList, postCount, formTitle, editModeBanner;
let titleInput, authorInput, dateInput, timeInput, contentInput;

// ============================================
// STATE MANAGEMENT
// ============================================
let posts = [];
let editingPostId = null; // Track which post is being edited

// ============================================
// INITIALIZATION
// ============================================
/**
 * Initialize DOM references and load posts when page loads
 */
function init() {
  // Get DOM element references
  blogForm = document.getElementById("blog-form");
  submitBtn = document.getElementById("submit-btn");
  blogList = document.getElementById("blog-list");
  postCount = document.getElementById("post-count");
  formTitle = document.getElementById("form-title");
  editModeBanner = document.getElementById("edit-mode-banner");

  // Form input fields
  titleInput = document.getElementById("title");
  authorInput = document.getElementById("author");
  dateInput = document.getElementById("date");
  timeInput = document.getElementById("time");
  contentInput = document.getElementById("content");

  // Set up event listeners
  setupEventListeners();

  // Load and render posts
  loadPosts();
  renderPosts();
  setDefaultDateTime();
}

/**
 * Set up all event listeners
 */
function setupEventListeners() {
  // Handle form submission
  submitBtn.addEventListener("click", addOrUpdatePost);

  // Allow Enter key in inputs (except textarea) to submit form
  [titleInput, authorInput, dateInput, timeInput].forEach(input => {
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addOrUpdatePost();
      }
    });
  });
}

/**
 * Set current date and time as default values
 */
function setDefaultDateTime() {
  const now = new Date();
  dateInput.valueAsDate = now;
  timeInput.value = now.toTimeString().slice(0, 5);
}

// ============================================
// DATA PERSISTENCE (USING IN-MEMORY STORAGE)
// ============================================
/**
 * Load blog posts from session storage
 * Note: Using sessionStorage instead of localStorage
 * as localStorage is not supported in Claude.ai artifacts
 */
function loadPosts() {
  try {
    const stored = sessionStorage.getItem("blogPosts");
    posts = stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Error loading posts:", error);
    posts = [];
  }
}

/**
 * Save blog posts to session storage
 */
function savePosts() {
  try {
    sessionStorage.setItem("blogPosts", JSON.stringify(posts));
  } catch (error) {
    console.error("Error saving posts:", error);
    alert("Failed to save blog posts. Storage might be full.");
  }
}

// ============================================
// FORM VALIDATION
// ============================================
/**
 * Validate all form inputs before submission
 * @returns {boolean} - true if all inputs are valid
 */
function validateForm() {
  const title = titleInput.value.trim();
  const author = authorInput.value.trim();
  const date = dateInput.value;
  const time = timeInput.value;
  const content = contentInput.value.trim();

  // Check if all fields are filled
  if (!title || !author || !date || !time || !content) {
    alert("⚠️ Please fill in all fields before publishing.");
    return false;
  }

  // Validate title length
  if (title.length < 3) {
    alert("⚠️ Title must be at least 3 characters long.");
    return false;
  }

  // Validate content length
  if (content.length < 10) {
    alert("⚠️ Content must be at least 10 characters long.");
    return false;
  }

  return true;
}

// ============================================
// CRUD OPERATIONS
// ============================================
/**
 * Add a new blog post or update existing one
 * Handles both create and update operations
 */
function addOrUpdatePost() {
  // Validate form before proceeding
  if (!validateForm()) return;

  // Collect form data
  const postData = {
    title: titleInput.value.trim(),
    author: authorInput.value.trim(),
    date: dateInput.value,
    time: timeInput.value,
    content: contentInput.value.trim(),
  };

  if (editingPostId !== null) {
    // UPDATE MODE: Find and update existing post
    const postIndex = posts.findIndex(p => p.id === editingPostId);
    if (postIndex !== -1) {
      posts[postIndex] = { ...posts[postIndex], ...postData };
    }
    exitEditMode();
  } else {
    // CREATE MODE: Add new post to beginning of array
    const newPost = {
      id: Date.now(), // Use timestamp as unique ID
      ...postData,
    };
    posts.unshift(newPost); // Add to beginning for better UX
  }

  // Persist changes and update UI
  savePosts();
  renderPosts();
  resetForm();
}

/**
 * Delete a blog post by ID
 * @param {number} id - Post ID to delete
 */
function deletePost(id) {
  // Confirm deletion to prevent accidents
  if (!confirm("Are you sure you want to delete this blog post?")) {
    return;
  }

  // Remove post from array
  posts = posts.filter(p => p.id !== id);
  
  // If we're deleting the post being edited, exit edit mode
  if (editingPostId === id) {
    exitEditMode();
    resetForm();
  }

  // Persist changes and update UI
  savePosts();
  renderPosts();
}

/**
 * Enter edit mode for a specific post
 * Populates form with existing post data
 * @param {number} id - Post ID to edit
 */
function editPost(id) {
  // Find the post to edit
  const post = posts.find(p => p.id === id);
  if (!post) return;

  // Populate form with post data
  titleInput.value = post.title;
  authorInput.value = post.author;
  dateInput.value = post.date;
  timeInput.value = post.time;
  contentInput.value = post.content;

  // Switch to edit mode
  editingPostId = id;
  formTitle.textContent = "Edit Blog Post";
  submitBtn.textContent = "Update Blog";
  editModeBanner.classList.add("active");

  // Scroll to form for better UX
  document.querySelector(".form-section").scrollIntoView({ 
    behavior: "smooth", 
    block: "start" 
  });
}

/**
 * Exit edit mode and return to create mode
 */
function exitEditMode() {
  editingPostId = null;
  formTitle.textContent = "Create a New Blog Post";
  submitBtn.textContent = "Publish Blog";
  editModeBanner.classList.remove("active");
}

// ============================================
// UI RENDERING
// ============================================
/**
 * Render all blog posts to the DOM
 * Handles both empty state and populated list
 */
function renderPosts() {
  // Clear existing content
  blogList.innerHTML = "";
  
  // Update post count
  postCount.textContent = posts.length;

  // Show empty state if no posts
  if (posts.length === 0) {
    blogList.innerHTML = `
      <div class="empty-state">
        📝 No blog posts yet. Start writing your first post!
      </div>
    `;
    return;
  }

  // Render each post as a card
  posts.forEach(post => {
    const card = document.createElement("div");
    card.className = "blog-card";

    // Use escapeHtml to prevent XSS attacks
    card.innerHTML = `
      <h3>${escapeHtml(post.title)}</h3>
      <div class="blog-meta">
        <span>👤 ${escapeHtml(post.author)}</span>
        <span>📅 ${formatDate(post.date)}</span>
        <span>🕐 ${post.time}</span>
      </div>
      <div class="blog-content">${escapeHtml(post.content)}</div>

      <div class="action-btns">
        <button class="btn-edit" onclick="editPost(${post.id})">✏️ Edit</button>
        <button class="btn-delete" onclick="deletePost(${post.id})">🗑️ Delete</button>
      </div>
    `;

    blogList.appendChild(card);
  });
}

/**
 * Reset form inputs to default state
 */
function resetForm() {
  titleInput.value = "";
  authorInput.value = "";
  contentInput.value = "";
  setDefaultDateTime();
  exitEditMode();
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
/**
 * Format date for better readability
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} - Formatted date string (e.g., "Nov 21, 2025")
 */
function formatDate(dateStr) {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { 
    year: "numeric", 
    month: "short", 
    day: "numeric" 
  });
}

/**
 * Escape HTML to prevent XSS (Cross-Site Scripting) attacks
 * Converts special characters to HTML entities
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text safe for HTML insertion
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================
// INITIALIZE APPLICATION
// ============================================

// Make functions globally accessible for inline onclick handlers
window.editPost = editPost;
window.deletePost = deletePost;

// Wait for DOM to be fully loaded before initializing
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}