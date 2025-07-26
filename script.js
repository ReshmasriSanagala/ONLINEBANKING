// API Configuration
const API_CONFIG = {
  BASE_URL: "http://localhost:8069",
  TIMEOUT: 10000,
  HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
}

// Global state
let currentUser = null
let userAccounts = []
let userPayees = []
let userTransactions = []
let authToken = null
let branches = []

// Dummy Data
const DUMMY_ACCOUNTS = [
  { accno: 1001, type: "Savings", balance: 50000, branch: { branchid: 1, branchname: "Downtown Branch" } },
  { accno: 1002, type: "Current", balance: 120000, branch: { branchid: 2, branchname: "Central Plaza Branch" } },
]


const DUMMY_TRANSACTIONS = [
  { date: "2025-07-15T10:00:00Z", type: "CREDIT", amount: 10000, balanceAmt: 50000, description: "Salary Deposit" },
  { date: "2025-07-14T14:30:00Z", type: "DEBIT", amount: -2500, balanceAmt: 40000, description: "Grocery Shopping" },
  { date: "2025-07-13T09:15:00Z", type: "CREDIT", amount: 5000, balanceAmt: 42500, description: "Freelance Payment" },
]

// Initialize application
document.addEventListener("DOMContentLoaded", () => {
  initTheme()
  initParallaxEffects()
  initScrollAnimations()
  loadBranches()

  // Close mobile menu when clicking on links
  document.querySelectorAll(".nav-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      document.querySelector(".nav-menu").classList.remove("show")
    })
  })

  // Close modals when clicking outside
  window.onclick = (event) => {
    const modals = document.querySelectorAll(".modal")
    modals.forEach((modal) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  }

  // Ensure login form submission is handled
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", handleLogin)
  }

  // Ensure logout button is handled
  const logoutBtn = document.getElementById("logoutBtn")
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      AuthService.logout()
    })
  }

  toggleLoginButtons(false)
})

//closing funcyion//

function closeForm() {
  document.querySelectorAll(".form-popup").forEach(form => {
    form.style.display = "none";
	document.getElementById("signup-form").style.display = "none";
	 document.getElementById("set-password-form").style.display = "none";
  });
}



// Parallax and Animation Effects
function initParallaxEffects() {
  const heroParticles = document.getElementById("heroParticles")
  for (let i = 0; i < 50; i++) {
    const particle = document.createElement("div")
    particle.className = "particle"
    particle.style.left = Math.random() * 100 + "%"
    particle.style.animationDelay = Math.random() * 8 + "s"
    particle.style.animationDuration = 8 + Math.random() * 4 + "s"
    heroParticles.appendChild(particle)
  }

  window.addEventListener("scroll", () => {
    const scrolled = window.pageYOffset
    const parallaxElements = document.querySelectorAll(".parallax")

    parallaxElements.forEach((element, index) => {
      const speed = 0.5 + index * 0.1
      const yPos = -(scrolled * speed)
      element.style.transform = `translateY(${yPos}px)`
    })

    const header = document.querySelector(".main-header")
    if (scrolled > 100) {
      header.classList.add("scrolled")
    } else {
      header.classList.remove("scrolled")
    }
  })
}

// Intersection Observer for scroll animations
function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("revealed")
      }
    })
  }, observerOptions)

  document.querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale").forEach((el) => {
    observer.observe(el)
  })

  const serviceCards = document.querySelectorAll(".service-card")
  serviceCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.2}s`
  })
}

// Theme Management
function toggleTheme() {
  const body = document.body
  const currentTheme = body.getAttribute("data-theme")
  const newTheme = currentTheme === "dark" ? "light" : "dark"

  body.setAttribute("data-theme", newTheme)
  localStorage.setItem("theme", newTheme)

  const themeToggle = document.querySelector(".theme-toggle")
  themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙"
}

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light"
  document.body.setAttribute("data-theme", savedTheme)

  const themeToggle = document.querySelector(".theme-toggle")
  themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙"
}

// Mobile menu toggle
function toggleMenu() {
  const navMenu = document.querySelector(".nav-menu")
  navMenu.classList.toggle("show")
}

// API Client
class APIClient {
  static async makeRequest(url, options = {}) {
    const defaultOptions = {
      method: "GET",
      headers: { ...API_CONFIG.HEADERS },
      timeout: API_CONFIG.TIMEOUT,
    }

    if (authToken) {
      defaultOptions.headers["Authorization"] = `Bearer ${authToken}`
    }

    const finalOptions = { ...defaultOptions, ...options }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${url}`, finalOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // ✅ Check if the response is JSON
      const contentType = response.headers.get("content-type")

      if (contentType && contentType.includes("application/json")) {
        return await response.json()
      } else {
        return await response.text() // fallback
      }

    } catch (error) {
      console.error("API request failed:", error)
      throw error
    }
  }
}


// Auth Service
class AuthService {
  static async login(custid, loginPassword) {
    try {
      const loginRes = await APIClient.makeRequest(`/login`, {
        method: "POST",
        body: JSON.stringify({ custid, loginPassword }),
      });

      if (!loginRes || !loginRes.custid) {
        return { success: false, message: "Invalid credentials" };
      }

      // Store the token if provided in the response
      if (loginRes.token) {
        authToken = loginRes.token;
        localStorage.setItem("authToken", authToken);
		return { success: true, user: currentUser, token: loginRes.token }; // Include the token in the return value

      }

      const customer = await APIClient.makeRequest(`/customers/${custid}`);
      if (customer) {
        currentUser = customer;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        return { success: true, user: currentUser };
      } else {
        return { success: false, message: "Customer details not found" };
      }
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: "Login failed: " + error.message };
    }
  }

  static logout() {
    authToken = null;
    localStorage.removeItem("authToken");
    currentUser = null;
    localStorage.removeItem("currentUser");
    userAccounts = [];
    userPayees = [];
    userTransactions = [];
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("homepage").style.display = "block";
    toggleLoginButtons(false);
    const loginModal = document.getElementById("loginModal");
    if (loginModal) loginModal.style.display = "none";
    console.log("✅ Logged out successfully");
  }
}

// Customer Service
class CustomerService {
  static async updateProfile(profileData) {
    try {
      const response = await APIClient.makeRequest(`/customers/${currentUser.custid}`, {
        method: "PUT",
        body: JSON.stringify(profileData),
      })
      return { success: true, data: response }
    } catch (error) {
      console.error("Error updating profile:", error)
      return { success: false, message: "Failed to update profile" }
    }
  }

  static async changePassword(passwordData) {
    try {
		

		if (!passwordData.customerId) {
		  passwordData.customerId = currentUser?.custid;
		}
		
		console.log("Sending password change for custid:", passwordData.customerId);

		const response = await APIClient.makeRequest(
		  `/login/customer/${passwordData.customerId}/password`, // ✅ CORRECT PATHally inject ID
        {
          method: "POST",
          body: JSON.stringify(passwordData),
        }
      )
      return { success: true }
    } catch (error) {
      console.error("Error changing password:", error)
      return { success: false, message: "Failed to change password" }
    }
  }
}

// Account Service
class AccountService {
  static async getAccountsByCustomerId(customerId) {
    return DUMMY_ACCOUNTS
  }

  static async createAccount(accountData) {
    try {
      const response = await APIClient.makeRequest("/accounts", {
        method: "POST",
        body: JSON.stringify({
          ...accountData,
          customer: { custid: currentUser.custid },
          balance: 0.0,
        }),
      })
      return { success: true, data: response }
    } catch (error) {
      console.error("Error creating account:", error)
      return { success: false, message: "Failed to create account" }
    }
  }

  static async getTransactions(accountId, filters = {}) {
    return DUMMY_TRANSACTIONS.filter(txn => {
      let matches = true
      if (filters.type) matches = matches && txn.type === filters.type
      if (filters.dateFrom) matches = matches && new Date(txn.date) >= new Date(filters.dateFrom)
      if (filters.dateTo) matches = matches && new Date(txn.date) <= new Date(filters.dateTo)
      return matches
    })
  }
}

// Transaction Service
class TransactionService {
  static async transfer(transferData) {
    try {
      const response = await APIClient.makeRequest("/transactions/transfer", {
        method: "POST",
        body: JSON.stringify({
          amount: Number.parseFloat(transferData.amount),
          type: "DEBIT",
          date: new Date().toISOString(),
          fromAccount: { accno: Number.parseInt(transferData.fromAccount) },
          toAccount: { accno: Number.parseInt(transferData.toAccount) },
          description: transferData.description || "Fund Transfer",
        }),
      })
      return { success: true, data: response }
    } catch (error) {
      console.error("Error processing transfer:", error)
      return { success: false, message: "Transfer failed. Please try again." }
    }
  }
}

// Payee Service
class PayeeService {
  static async getPayeesByCustomerId(customerId) {
    try {
      return await APIClient.makeRequest(`/payees/customer/${customerId}`)
    } catch (error) {
      console.error("Error fetching payees:", error)
      return []
    }
  }

  static async createPayee(payeeData) {
    try {
      const response = await APIClient.makeRequest("/payees", {
        method: "POST",
        body: JSON.stringify({
          ...payeeData,
          custid: currentUser.custid,
        }),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error("Error creating payee:", error);
      return { success: false, message: "Failed to add payee" };
    }
  }

  static async updatePayee(payeeId, payeeData) {
    try {
      const response = await APIClient.makeRequest(`/payees/${payeeId}`, {
        method: "PUT",
        body: JSON.stringify({
          ...payeeData,
          payeeid: payeeId,
          custid: currentUser.custid,
        }),
      });
      return { success: true, data: response };
    } catch (error) {
      console.error("Error updating payee:", error);
      return { success: false, message: "Failed to update payee" };
    }
  }
  static async deletePayee(payeeId) {
    console.log("🧨 Deleting Payee ID:", payeeId);
    try {
      const response = await APIClient.makeRequest(`/payees/${payeeId}`, {
        method: "DELETE",
      });

      const contentType = response.headers?.get("Content-Type");
      let result;

      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        result = await response.text(); // fallback if not JSON
      }

      console.log("Delete response:", result);

      return { success: response.ok }; // return success flag

    } catch (error) {
      console.error("❌ Error in deletePayee:", error);
      return { success: false, message: "Failed to delete payee" };
    }
  }
}
async function deletePayee(payeeId) {
  if (confirm("Are you sure you want to delete this payee?")) {
    const result = await PayeeService.deletePayee(payeeId);
    if (result.success) {
      alert("Payee deleted successfully!");
      userPayees = await PayeeService.getPayeesByCustomerId(currentUser.custid);
      loadPayees();
      populatePayeeSelect();
    } else {
      alert(result.message);
    }
  }
}



// Branch Service
class BranchService {
  static async getAllBranches() {
    try {
      return await APIClient.makeRequest("/branches")
    } catch (error) {
      console.error("Error fetching branches:", error)
      return []
    }
  }
}

// Modal Functions
function openLoginModal() {
  const loginModal = document.getElementById("loginModal")
  if (loginModal) {
    loginModal.style.display = "block"
  }
}

function closeLoginModal() {
  const loginModal = document.getElementById("loginModal")
  if (loginModal) {
    loginModal.style.display = "none"
    document.getElementById("loginForm").reset()
  }
}

function showAccountModal() {
  const accountModal = document.getElementById("accountModal")
  if (accountModal) {
    accountModal.style.display = "block"
    populateBranchSelect()
  }
}

function closeAccountModal() {
  const accountModal = document.getElementById("accountModal")
  if (accountModal) {
    accountModal.style.display = "none"
    document.getElementById("accountForm").reset()
  }
}

function showPayeeModal(payee = null) {
  const modal = document.getElementById("payeeModal");
  const title = document.getElementById("payeeModalTitle");
  const form = document.getElementById("payeeForm");

  if (payee) {
    title.textContent = "Edit Payee";
    document.getElementById("payeeId").value = payee.payeeid;
    document.getElementById("payeeName").value = payee.name;
    document.getElementById("payeeBank").value = payee.bank;
    document.getElementById("payeeIfsc").value = payee.ifsc;
    document.getElementById("payeeAccno").value = payee.accno;
  } else {
    title.textContent = "Add Payee";
    form.reset();
    document.getElementById("payeeId").value = ""; // clear payeeId if adding
  }

  modal.style.display = "block";
}

function closePayeeModal() {
  const modal = document.getElementById("payeeModal")
  if (modal) {
    modal.style.display = "none"
    document.getElementById("payeeForm").reset()
  }
}

// Dashboard Functions
function showSection(sectionName, clickedBtn = null) {
  document.querySelectorAll(".dashboard-section").forEach((section) => {
    section.classList.remove("active")
  })

  document.getElementById(`${sectionName}-section`).classList.add("active")

  document.querySelectorAll(".dashboard-nav .btn").forEach((btn) => {
    btn.classList.remove("btn-primary")
    btn.classList.add("btn-secondary")
  })

  if (clickedBtn) {
    clickedBtn.classList.remove("btn-secondary")
    clickedBtn.classList.add("btn-primary")
  } else {
    const defaultBtn = document.querySelector(`.dashboard-nav .btn[data-section="${sectionName}"]`)
    if (defaultBtn) {
      defaultBtn.classList.remove("btn-secondary")
      defaultBtn.classList.add("btn-primary")
    }
  }

  switch (sectionName) {
    case "accounts":
      loadAccounts()
      break
    case "transfer":
      loadTransferData()
      break
    case "payees":
      loadPayees()
      break
    case "transactions":
      loadTransactions()
      break
    case "profile":
      loadProfile()
      break
  }
}



async function loadDashboard(custId) {
  console.log("🔄 Loading dashboard for", custId)

  document.querySelector("main").style.display = "none"
  const dashboard = document.getElementById("dashboard")
  if (dashboard) {
    dashboard.style.display = "block"
  }

  try {
    document.getElementById("customerName").textContent = currentUser?.name || "Customer";

    userAccounts = await AccountService.getAccountsByCustomerId(currentUser.custid)
    userPayees = await PayeeService.getPayeesByCustomerId(currentUser.custid)

    populateAccountSelects()
    populatePayeeSelect()
	
	// Restore logged-in user if page refreshed
	if (!currentUser) {
	  const userFromStorage = localStorage.getItem("currentUser");
	  if (userFromStorage) {
	    currentUser = JSON.parse(userFromStorage);
	  }
	}


    if (userAccounts.length > 0) {
      const primaryAccount = userAccounts[0]
      document.getElementById("balance-amount").textContent = "*****"
      document.getElementById("balance-amount").setAttribute("data-balance", primaryAccount.balance)
      document.getElementById("accountDetails").textContent =
        `Account No: ${primaryAccount.accno} | ${primaryAccount.type}`

      const transactions = await AccountService.getTransactions(primaryAccount.accno)
      displayRecentTransactions(transactions.slice(0, 5))
    }

    showSection("overview")
  } catch (error) {
    console.error("❌ Error loading dashboard:", error)
    alert("Error loading dashboard. Please try again.")
  }
}

async function loadAccounts() {
  const accountsList = document.getElementById("accountsList")
  accountsList.innerHTML = ""

  userAccounts.forEach((account) => {
    const accountCard = document.createElement("div")
    accountCard.className = "account-card"
    accountCard.innerHTML = `
            <div class="account-type">${account.type} Account</div>
            <div class="account-number">Account No: ${account.accno}</div>
            <div class="account-balance-card">₹${account.balance.toLocaleString()}</div>
            <div class="account-actions">
                <button class="btn btn-primary" onclick="viewAccountTransactions(${account.accno})">View Transactions</button>
                <button class="btn btn-secondary" onclick="transferFromAccount(${account.accno})">Transfer</button>
            </div>
        `
    accountsList.appendChild(accountCard)
  })
}

async function loadTransferData() {
  populateAccountSelects()
  populatePayeeSelect()
}

async function loadPayees() {
  const payeesList = document.getElementById("payeesList")
  payeesList.innerHTML = ""

  userPayees.forEach((payee) => {
    const payeeCard = document.createElement("div")
    payeeCard.className = "payee-card"
    payeeCard.innerHTML = `
            <div class="payee-name">${payee.name}</div>
            <div class="payee-details">Bank: ${payee.bank}</div>
            <div class="payee-details">IFSC: ${payee.ifsc}</div>
            <div class="payee-details">Account: ${payee.accno}</div>
            <div class="payee-actions">
                <button class="btn btn-primary" onclick="transferToPayee(${payee.payeeid})">Transfer</button>
				<button class="btn btn-outline" onclick="deletePayee(${payee.payeeid})">Delete</button>

            </div>
        `
    payeesList.appendChild(payeeCard)
  })
}

async function loadTransactions() {
  const accountFilter = document.getElementById("accountFilter")
  accountFilter.innerHTML = '<option value="">All Accounts</option>'

  userAccounts.forEach((account) => {
    const option = document.createElement("option")
    option.value = account.accno
    option.textContent = `${account.accno} - ${account.type}`
    accountFilter.appendChild(option)
  })

  await filterTransactions()
}

async function loadProfile() {
  if (currentUser) {
    document.getElementById("profileName").value = currentUser.name || ""
    document.getElementById("profileEmail").value = currentUser.email || ""
    document.getElementById("profileDob").value = currentUser.dob || ""
    document.getElementById("profileAadhar").value = currentUser.aadharNumber || ""
    document.getElementById("profilePan").value = currentUser.pan || ""
    document.getElementById("profileAddress").value = currentUser.address || ""
  }
}

// Event Handlers
async function handleLogin(event) {
  event.preventDefault();
  const custId = document.getElementById("custid").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!custId || !password) {
    alert("Please enter both Customer ID and Password.");
    return;
  }

  const loginBtn = event.target.querySelector('button[type="submit"]');
  loginBtn.classList.add("loading");
  loginBtn.textContent = "Logging in...";

  try {
    const result = await AuthService.login(custId, password);
    if (result.success) {
      authToken = result.token; // Assuming the login response includes a token
      closeLoginModal();
      await loadDashboard(custId);
      toggleLoginButtons(true);
    } else {
      alert(result.message || "Invalid credentials. Please try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Login failed: " + error.message);
  } finally {
    loginBtn.classList.remove("loading");
    loginBtn.textContent = "Login";
  }
}

function toggleLoginButtons(isLoggedIn) {
  const loginBtn = document.getElementById("loginBtn")
  const logoutBtn = document.getElementById("logoutBtn")

  if (loginBtn && logoutBtn) {
    loginBtn.style.display = isLoggedIn ? "none" : "inline-block"
    logoutBtn.style.display = isLoggedIn ? "inline-block" : "none"
  }
}

async function handleTransfer(event) {
  event.preventDefault();

  if (!confirm('Are you sure you want to complete this transfer?')) {
    return;
  }

  const formData = new FormData(event.target);
  const transferData = Object.fromEntries(formData);

  // 🛡 Validation
  if (!transferData.fromAccount || !transferData.amount || isNaN(parseFloat(transferData.amount))) {
    alert("Please fill in all required fields with valid values.");
    return;
  }

  let toAccount = null;

  // 👉 Determine destination account
  if (transferData.transferType === "internal" || transferData.transferType === "external") {
    if (!transferData.toAccount) {
      alert("Please enter the destination account number");
      return;
    }
    toAccount = transferData.toAccount;
  } else if (transferData.transferType === "payee") {
    const selectedPayee = userPayees.find((p) => p.payeeid == transferData.payeeSelect);
    if (!selectedPayee) {
      alert("Please select a valid payee");
      return;
    }
    toAccount = selectedPayee.accno;
  }

  if (!toAccount) {
    alert("Destination account is missing.");
    return;
  }

  const transferBtn = event.target.querySelector('button[type="submit"]');
  transferBtn.classList.add("loading");
  transferBtn.textContent = "Processing...";

  try {
    const result = simulateDummyTransfer({
      ...transferData,
      toAccount: toAccount,
    });

    if (result.success) {
      alert("✅ Transfer completed successfully!");
      event.target.reset();
      document.getElementById("transferSummary").innerHTML = "<p>Fill the form to see transfer summary</p>";
      await loadDashboard(currentUser.custid); // ✅ refresh UI
    } else {
      alert("❌ " + result.message);
    }
  } catch (error) {
    console.error("Transfer failed:", error);
    alert("Something went wrong during the transfer.");
  } finally {
    transferBtn.classList.remove("loading");
    transferBtn.textContent = "Transfer Money";
  }
}



function simulateDummyTransfer(data) {
  const from = userAccounts.find(acc => acc.accno == data.fromAccount);
  const to = userAccounts.find(acc => acc.accno == data.toAccount);

  const amount = parseFloat(data.amount);
  const description = data.description || "Fund Transfer";

  if (!from) {
    return { success: false, message: "Source account not found." };
  }

  if (from.accno == data.toAccount) {
    return { success: false, message: "Cannot transfer to the same account." };
  }

  if (amount <= 0) {
    return { success: false, message: "Invalid amount." };
  }

  if (from.balance < amount) {
    return { success: false, message: "Insufficient balance." };
  }

  // ✅ Subtract (debit)
  from.balance -= amount;

  const now = new Date().toISOString();

  // 🧾 Add DEBIT transaction
  DUMMY_TRANSACTIONS.unshift({
    customerId: currentUser.custid,
    date: now,
    type: "DEBIT",
    amount: -amount,
    from: from.accno,
    to: data.toAccount,
    balanceAmt: from.balance,
    description,
  });

  // 💳 If destination is a known user account, simulate CREDIT
  if (to) {
    to.balance += amount;

    DUMMY_TRANSACTIONS.unshift({
      customerId: currentUser.custid,
      date: now,
      type: "CREDIT",
      amount: amount,
      from: from.accno,
      to: to.accno,
      balanceAmt: to.balance,
      description,
    });
  } else {
    // For payees (not accounts), simulate CREDIT log
    DUMMY_TRANSACTIONS.unshift({
      customerId: currentUser.custid,
      date: now,
      type: "CREDIT",
      amount: amount,
      from: from.accno,
      to: data.toAccount,
      balanceAmt: from.balance,
      description: "Transferred to payee/external",
    });
  }

  return { success: true };
}

async function handleAccountUpdate(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const accountData = Object.fromEntries(formData)

  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.textContent = "Creating..."

  try {
    const result = await AccountService.createAccount(accountData)
    if (result.success) {
      alert("Account created successfully!")
      closeAccountModal()
      userAccounts = await AccountService.getAccountsByCustomerId(currentUser.custid)
      loadAccounts()
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert("Failed to create account. Please try again.")
  } finally {
    submitBtn.classList.remove("loading")
    submitBtn.textContent = "Create Account"
  }
}

async function handlePayeeSubmit(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const payeeData = Object.fromEntries(formData)
  const payeeId = payeeData.payeeid

  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.textContent = payeeId ? "Updating..." : "Adding..."

  try {
    let result
    if (payeeId) {
      result = await PayeeService.updatePayee(payeeId, payeeData)
    } else {
      result = await PayeeService.createPayee(payeeData)
    }

    if (result.success) {
      alert(`Payee ${payeeId ? "updated" : "added"} successfully!`)
      closePayeeModal()
      userPayees = await PayeeService.getPayeesByCustomerId(currentUser.custid)
      loadPayees()
      populatePayeeSelect()
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert(`Failed to ${payeeId ? "update" : "add"} payee. Please try again.`)
  } finally {
    submitBtn.classList.remove("loading")
    submitBtn.textContent = "Save Payee"
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const profileData = Object.fromEntries(formData)

  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.textContent = "Updating..."

  try {
    const result = await CustomerService.updateProfile(profileData)
    if (result.success) {
      alert("Profile updated successfully!")
      currentUser = { ...currentUser, ...profileData }
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert("Failed to update profile. Please try again.")
  } finally {
    submitBtn.classList.remove("loading")
    submitBtn.textContent = "Update Profile"
  }
}

async function handlePasswordChange(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const passwordData = Object.fromEntries(formData)

  if (passwordData.newPassword !== passwordData.confirmPassword) {
    alert("New passwords do not match")
    return
  }

  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.textContent = "Changing..."

  try {
    const result = await CustomerService.changePassword(passwordData)
    if (result.success) {
      alert("Password changed successfully!")
      event.target.reset()
    } else {
      alert(result.message)
    }
  } catch (error) {
    alert("Failed to change password. Please try again.")
  } finally {
    submitBtn.classList.remove("loading")
    submitBtn.textContent = "Change Password"
  }
}

function handleContactForm(event) {
  event.preventDefault()
  const formData = new FormData(event.target)
  const contactData = Object.fromEntries(formData)

  const submitBtn = event.target.querySelector('button[type="submit"]')
  submitBtn.classList.add("loading")
  submitBtn.textContent = "Sending..."

  setTimeout(() => {
    alert("Message sent successfully! We will get back to you soon.")
    event.target.reset()
    submitBtn.classList.remove("loading")
    submitBtn.textContent = "Send Message"
  }, 2000)
}

function handleTransferTypeChange() {
  const transferType = document.getElementById("transferType").value
  const toAccountGroup = document.getElementById("toAccountGroup")
  const payeeGroup = document.getElementById("payeeGroup")
  const ifscGroup = document.getElementById("ifscGroup")

  toAccountGroup.style.display = "none"
  payeeGroup.style.display = "none"
  ifscGroup.style.display = "none"

  if (transferType === "internal" || transferType === "external") {
    toAccountGroup.style.display = "block"
    if (transferType === "external") {
      ifscGroup.style.display = "block"
    }
  } else if (transferType === "payee") {
    payeeGroup.style.display = "block"
  }

  updateTransferSummary()
}

// Utility Functions
function populateAccountSelects() {
  const fromAccountSelect = document.getElementById("fromAccount")
  fromAccountSelect.innerHTML = ""

  userAccounts.forEach((account) => {
    const option = document.createElement("option")
    option.value = account.accno
    option.textContent = `${account.accno} - ${account.type} (₹${account.balance.toLocaleString()})`
    fromAccountSelect.appendChild(option)
  })
}

function populatePayeeSelect() {
  const payeeSelect = document.getElementById("payeeSelect")
  payeeSelect.innerHTML = '<option value="">Select Payee</option>'

  userPayees.forEach((payee) => {
    const option = document.createElement("option")
    option.value = payee.payeeid
    option.textContent = `${payee.name} - ${payee.bank}`
    payeeSelect.appendChild(option)
  })
}

async function populateBranchSelect() {
  const branchSelect = document.getElementById("accountBranch")
  branchSelect.innerHTML = '<option value="">Select Branch</option>'

  branches.forEach((branch) => {
    const option = document.createElement("option")
    option.value = branch.branchid
    option.textContent = `${branch.branchname} - ${branch.ifsc}`
    branchSelect.appendChild(option)
  })
}

async function loadBranches() {
  branches = await BranchService.getAllBranches()
}

function updateTransferSummary() {
  const form = document.getElementById("transferForm")
  const formData = new FormData(form)
  const data = Object.fromEntries(formData)

  const summaryDiv = document.getElementById("transferSummary")

  if (data.fromAccount && data.amount && data.transferType) {
    const fromAccount = userAccounts.find((acc) => acc.accno == data.fromAccount)
    let summary = `
            <div style="margin-bottom: 15px;">
                <strong>From:</strong> ${fromAccount?.accno} - ${fromAccount?.type}<br>
                <strong>Amount:</strong> ₹${Number.parseFloat(data.amount || 0).toLocaleString()}
            </div>
        `

    if (data.transferType === "payee" && data.payeeSelect) {
      const payee = userPayees.find((p) => p.payeeid == data.payeeSelect)
      summary += `<div><strong>To:</strong> ${payee?.name} (${payee?.bank})</div>`
    } else if (data.toAccount) {
      summary += `<div><strong>To Account:</strong> ${data.toAccount}</div>`
    }

    if (data.description) {
      summary += `<div><strong>Description:</strong> ${data.description}</div>`
    }

    summaryDiv.innerHTML = summary
  } else {
    summaryDiv.innerHTML = "<p>Fill the form to see transfer summary</p>"
  }
}

function displayRecentTransactions(transactions) {
  const container = document.getElementById("recentTransactions")
  container.innerHTML = ""

  if (transactions.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary);">No recent transactions</p>'
    return
  }

  transactions.forEach((txn) => {
    const txnElement = document.createElement("div")
    txnElement.className = "transaction-item"
    txnElement.innerHTML = `
            <div>
                <strong>${new Date(txn.date).toLocaleDateString()}</strong><br>
                <small style="color: var(--text-secondary);">${txn.type} - ${txn.description || "Transaction"}</small>
            </div>
            <div class="transaction-amount ${txn.amount > 0 ? "positive" : "negative"}">
                ${txn.amount > 0 ? "+" : ""}₹${Math.abs(txn.amount).toLocaleString()}
            </div>
        `
    container.appendChild(txnElement)
  })
}

async function filterTransactions() {
  const accountFilter = document.getElementById("accountFilter").value
  const typeFilter = document.getElementById("typeFilter").value
  const dateFromFilter = document.getElementById("dateFromFilter").value
  const dateToFilter = document.getElementById("dateToFilter").value

  const transactionsList = document.getElementById("transactionsList")
  transactionsList.innerHTML =
    '<div class="transaction-row transaction-header"><div>Date</div><div>Type</div><div>Amount</div><div>Balance</div><div>Description</div></div>'

  try {
    let allTransactions = []

    if (accountFilter) {
      const transactions = await AccountService.getTransactions(accountFilter, {
        type: typeFilter,
        dateFrom: dateFromFilter,
        dateTo: dateToFilter,
      })
      allTransactions = transactions
    } else {
      for (const account of userAccounts) {
        const transactions = await AccountService.getTransactions(account.accno, {
          type: typeFilter,
          dateFrom: dateFromFilter,
          dateTo: dateToFilter,
        })
        allTransactions = [...allTransactions, ...transactions]
      }
    }

    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))

    allTransactions.forEach((txn) => {
      const row = document.createElement("div")
      row.className = "transaction-row"
      row.innerHTML = `
                <div>${new Date(txn.date).toLocaleDateString()}</div>
                <div><span class="transaction-amount ${txn.type === "CREDIT" ? "positive" : "negative"}">${txn.type}</span></div>
                <div class="transaction-amount ${txn.amount > 0 ? "positive" : "negative"}">
                    ${txn.amount > 0 ? "+" : ""}₹${Math.abs(txn.amount).toLocaleString()}
                </div>
                <div>₹${txn.balanceAmt.toLocaleString()}</div>
                <div>${txn.description || "Transaction"}</div>
            `
      transactionsList.appendChild(row)
    })

    if (allTransactions.length === 0) {
      const noDataRow = document.createElement("div")
      noDataRow.className = "transaction-row"
      noDataRow.innerHTML =
        '<div colspan="5" style="text-align: center; color: var(--text-secondary);">No transactions found</div>'
      transactionsList.appendChild(noDataRow)
    }
  } catch (error) {
    console.error("Error filtering transactions:", error)
  }
}

// Branch Functions
function findBranchCode() {
  const branchName = document.getElementById("branchName").value.toLowerCase()
  const resultDiv = document.getElementById("branchResult")

  const branchMap = {
    downtown: { name: "Downtown Branch", code: "DT001", address: "123 Main Street, Downtown", ifsc: "ORAC0001001" },
    central: {
      name: "Central Plaza Branch",
      code: "CP002",
      address: "456 Central Avenue, City Center",
      ifsc: "ORAC0001002",
    },
    "north plaza": {
      name: "North Plaza Branch",
      code: "NP003",
      address: "789 North Street, North Plaza",
      ifsc: "ORAC0001003",
    },
  }

  const branch = branchMap[branchName]

  if (branch) {
    resultDiv.className = "branch-result success"
    resultDiv.innerHTML = `
            <strong>${branch.name}</strong><br>
            Branch Code: <strong>${branch.code}</strong><br>
            IFSC: <strong>${branch.ifsc}</strong><br>
            Address: ${branch.address}
        `
  } else {
    resultDiv.className = "branch-result error"
    resultDiv.innerHTML = "Branch not found. Please check the branch name and try again."
  }

  resultDiv.style.display = "block"
}

// Additional Functions
function viewAccountTransactions(accountNo) {
  showSection("transactions")
  document.getElementById("accountFilter").value = accountNo
  filterTransactions()
}

function transferFromAccount(accountNo) {
  showSection("transfer")
  document.getElementById("fromAccount").value = accountNo
}

function transferToPayee(payeeId) {
  showSection("transfer")
  document.getElementById("transferType").value = "payee"
  handleTransferTypeChange()
  document.getElementById("payeeSelect").value = payeeId
}


// Add event listeners for form changes
document.addEventListener("DOMContentLoaded", () => {
  const transferForm = document.getElementById("transferForm")
  if (transferForm) {
    transferForm.addEventListener("input", updateTransferSummary)
    transferForm.addEventListener("change", updateTransferSummary)
  }
})

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]:not([href="#"])').forEach((anchor) => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute("href"));
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});


// Balance Toggle
let isBalanceVisible = false
const balanceAmount = document.getElementById("balance-amount")
const eyeIcon = document.getElementById("eye-icon")

if (balanceAmount && eyeIcon) {
  eyeIcon.addEventListener("click", () => {
    isBalanceVisible = !isBalanceVisible
    const actualBalance = balanceAmount.getAttribute("data-balance")
    balanceAmount.textContent = isBalanceVisible ? `₹${parseFloat(actualBalance).toLocaleString()}` : "*****"
    eyeIcon.classList.toggle("fa-eye")
    eyeIcon.classList.toggle("fa-eye-slash")
  })
}



//signup//

function startSignup(event) {
  if (event) event.preventDefault();

  console.log("✅ startSignup triggered");

  // Hide login modal if it's open
  const loginModal = document.getElementById("loginModal");
  if (loginModal) loginModal.style.display = "none";

  // Get signup form
  const signupForm = document.getElementById("signup-form");
  if (!signupForm) {
    console.error("❌ signup-form element not found!");
    return;
  }

  // Show signup form
  signupForm.style.display = "block";
  signupForm.style.visibility = "visible";
  signupForm.style.opacity = "1";

  // Hide password form if exists
  const passwordForm = document.getElementById("set-password-form");
  if (passwordForm) passwordForm.style.display = "none";
}

// Run all setup after DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // ⚡ Attach signup event
  const signupBtn = document.getElementById("signup-btn");
  if (signupBtn) signupBtn.addEventListener("click", startSignup);

  // ✅ Setup form handlers
  const personalForm = document.getElementById("personal-info-form");
  if (personalForm) {
    personalForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/customers/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

		if (response.ok) {
		  const customerId = result.custid; // or result.customerId based on response
		  alert("Personal details saved! Your Customer ID is: " + customerId);
		  
		  localStorage.setItem("registeredCustomerId", customerId);

		  // ✅ Show password form
		  document.getElementById("signup-form").style.display = "none";
		  document.getElementById("set-password-form").style.display = "block";
		  console.log("Attempt to show password form...");
		}
 else {
          alert("Error: " + (result.message || "Registration failed"));
        }
      } catch (error) {
        console.error("❌ Error submitting personal info:", error);
        alert("An error occurred while registering. Please try again.");
      }
    });
  }
  
  const passwordForm = document.getElementById("password-form");

  if (passwordForm) {
    passwordForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData.entries());

      const customerId = localStorage.getItem("registeredCustomerId"); // ← ✅ This is important

      if (!customerId) {
        alert("Customer ID missing. Please finish personal info registration first.");
        return;
      }

      if (data.loginPassword !== data.confirmPassword) {
        alert("Passwords do not match.");
        return;
      }

      const payload = {
        customerId: parseInt(customerId),
        loginPassword: data.loginPassword,
        txnPassword: data.txnPassword || ""
      };

      try {
        const response = await fetch(`http://localhost:8083/auth/set-password`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();

        if (response.ok) {
          alert("✅ Passwords set! Registration complete.");
          localStorage.removeItem("registeredCustomerId");
         window.location.href = "http://localhost:8069" // ✅ change to match your login page
        } else {
          alert("Error: " + (result.message || "Password setup failed"));
        }

      } catch (error) {
        console.error("❌ Error setting password:", error);
        alert("An error occurred while setting passwords.");
      }
    });
  }
}
)