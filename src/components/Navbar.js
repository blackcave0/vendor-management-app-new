// Navbar.js - Responsive left navigation component
document.addEventListener("DOMContentLoaded", function () {
  const navbarContainer = document.getElementById("navbar-container");

  if (navbarContainer) {
    // Get user info from session storage
    const userString = sessionStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const isAdmin = user && user.role === "admin";

    // Create navbar HTML structure
    navbarContainer.innerHTML = `
      <div class="navbar">
        <div class="navbar-header">
          <h2>Vendor Management</h2>
          <button id="navbar-toggle" class="navbar-toggle">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
        </div>
        <nav class="navbar-menu">
          <ul>
            <li data-page="dashboard">
              <a href="dashboard.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>Dashboard</span>
              </a>
            </li>
            <li data-page="vendor">
              <a href="vendor.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                <span>Vendors</span>
              </a>
            </li>
            <li data-page="product">
              <a href="product.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
                <span>Products</span>
              </a>
            </li>
            <li data-page="estimates">
              <a href="estimates.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>Estimates</span>
              </a>
            </li>
            <li data-page="inventory">
              <a href="inventory.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
                <span>Inventory</span>
              </a>
            </li>
            <li data-page="sales">
              <a href="sales.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                <span>Sales</span>
              </a>
            </li>
            <li data-page="reports">
              <a href="reports.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                <span>Reports</span>
              </a>
            </li>
            ${
              isAdmin
                ? `
            <li data-page="users">
              <a href="users.html">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                <span>User Management</span>
              </a>
            </li>
            `
                : ""
            }
          </ul>
        </nav>
        <div class="navbar-footer">
          <div class="user-info">
            <span id="sidebar-user-name" class="user-name">${
              user ? user.username : ""
            }</span>
            <span id="sidebar-user-role" class="user-role">${
              user ? `(${user.role})` : ""
            }</span>
          </div>
          <button id="sidebar-logout-btn" class="logout-btn">Logout</button>
        </div>
      </div>
    `;

    // Handle navbar toggle for mobile devices
    const navbarToggle = document.getElementById("navbar-toggle");
    const navbar = document.querySelector(".navbar");

    if (navbarToggle) {
      navbarToggle.addEventListener("click", function () {
        navbar.classList.toggle("navbar-collapsed");
      });
    }

    // Set active page in navbar
    const currentPage = window.location.pathname.split("/").pop().split(".")[0];
    const activeMenuItem = document.querySelector(
      `[data-page="${currentPage}"]`
    );

    if (activeMenuItem) {
      activeMenuItem.classList.add("active");
    }

    // Add logout functionality to sidebar logout button
    const sidebarLogoutBtn = document.getElementById("sidebar-logout-btn");

    if (sidebarLogoutBtn) {
      sidebarLogoutBtn.addEventListener("click", () => {
        sessionStorage.removeItem("user");
        window.location.href = "login.html";
      });
    }
  }
});
