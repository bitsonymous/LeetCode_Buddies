// Function to format the number of questions with difficulty-based colors into table rows
function formatQuestions(username, rating, questions) {
  return `
    <tr data-username="${username}">
      <td>${username || "Unknown"}</td>
      <td>${rating || "0"}</td>
      <td class="difficulty-all">${questions.All || 0}</td>
      <td class="difficulty-easy">${questions.Easy || 0}</td>
      <td class="difficulty-medium">${questions.Medium || 0}</td>
      <td class="difficulty-hard">${questions.Hard || 0}</td>
      <td><button class="delete-btn">Delete</button></td>
    </tr>
  `;
}

// Function to update the display with new stats inside the table
function updateDisplay(username, rating, questions) {
  const tableBody = document.getElementById('storedData');

  // Check if the user already exists in the table
  let userExists = false;
  Array.from(tableBody.children).forEach((item) => {
    if (item.dataset.username === username) {
      // Update existing user's rating and questions in the row
      item.innerHTML = formatQuestions(username, rating, questions);
      userExists = true;
    }
  });

  // If user does not exist, add a new row
  if (!userExists) {
    const tableRow = document.createElement('tr');
    tableRow.innerHTML = formatQuestions(username, rating, questions);

    // Add event listener for delete button
    tableRow.querySelector('.delete-btn').addEventListener('click', () => {
      deleteUser(username);
    });

    tableBody.appendChild(tableRow);
  }
}

// Function to store username, rating, and questions in localStorage
function saveDataToLocal(username, rating, questions) {
  const storedData = JSON.parse(localStorage.getItem('userRatings')) || [];

  // Check if username is already stored
  const userIndex = storedData.findIndex(user => user.username === username);

  if (userIndex === -1) {
    // If username not found, add new data
    storedData.push({ username, rating, questions });
  } else {
    // If username already exists, update the rating and questions
    storedData[userIndex].rating = rating;
    storedData[userIndex].questions = questions;
  }

  // Save updated list back to localStorage
  localStorage.setItem('userRatings', JSON.stringify(storedData));
}

// Function to delete a user from localStorage and UI
function deleteUser(username) {
  let storedData = JSON.parse(localStorage.getItem('userRatings')) || [];

  // Filter out the deleted user
  storedData = storedData.filter(user => user.username !== username);

  // Update localStorage
  localStorage.setItem('userRatings', JSON.stringify(storedData));

  // Update the display
  loadDataFromLocal();
}

// Function to retrieve and display stored data from localStorage
function loadDataFromLocal() {
  const storedData = JSON.parse(localStorage.getItem('userRatings')) || [];

  const tableBody = document.getElementById('storedData');
  tableBody.innerHTML = ''; // Clear the table

  // Display each user's data
  storedData.forEach(user => {
    updateDisplay(user.username, user.rating, user.questions);
  });
}

let currentSortField = 'username'; // Default sort field is 'username'
let sortDirection = 'asc'; // Default sort direction is ascending

// Function to sort data based on a field (username, rating, or questions)
function sortData(data, field, direction) {
  return data.sort((a, b) => {
    let valueA, valueB;

    // Access the field dynamically; handle nested fields like 'questions.All'
    valueA = field.includes('.') ? field.split('.').reduce((obj, key) => obj[key], a) : a[field];
    valueB = field.includes('.') ? field.split('.').reduce((obj, key) => obj[key], b) : b[field];

    // Convert to numbers if sorting by rating or questions
    if (field !== 'username') {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }

    // Handle string comparisons (like username)
    if (typeof valueA === 'string') {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    return direction === 'asc' ? (valueA > valueB ? 1 : -1) : (valueA < valueB ? 1 : -1);
  });
}

// Function to handle sort changes from dropdown
function handleSortChange(event) {
  currentSortField = event.target.value; // Update sort field based on selection
  loadSortedData(); // Reload the sorted data
}

// Function to load and display sorted data
function loadSortedData() {
  const storedData = JSON.parse(localStorage.getItem('userRatings')) || [];

  // Sort the data based on the current field and direction
  const sortedData = sortData(storedData, currentSortField, sortDirection);

  const tableBody = document.getElementById('storedData');
  tableBody.innerHTML = ''; // Clear the table

  // Display sorted data
  sortedData.forEach(user => {
    updateDisplay(user.username, user.rating, user.questions);
  });
}

// Function to handle sorting by column
function handleSort(field) {
  // Toggle sort direction if the same field is clicked again
  if (currentSortField === field) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortField = field; // Set new sort field
    sortDirection = 'asc'; // Reset to ascending
  }

  loadSortedData(); // Load the sorted data
}

// Add sorting event listeners to headers
function addSortingUI() {
  document.getElementById('sort-username').addEventListener('click', () => handleSort('username'));
  document.getElementById('sort-rating').addEventListener('click', () => handleSort('rating'));
  document.getElementById('sort-questions').addEventListener('click', () => handleSort('questions.All'));
}

// Show loading spinner
function showLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'block';
}

// Hide loading spinner
function hideLoadingSpinner() {
  document.getElementById('loading-spinner').style.display = 'none';
}

// Function to refresh all stored data (ratings and questions)
async function refreshAllData() {
  const storedData = JSON.parse(localStorage.getItem('userRatings')) || [];

  // Clear the table before refreshing the data
  const tableBody = document.getElementById('storedData');
  tableBody.innerHTML = ''; // Clear the table

  for (const user of storedData) {
    try {
      const ratingResponse = await fetch(`https://leetcodeapi-v1.vercel.app/rating/${user.username}`);
      if (!ratingResponse.ok) throw new Error('Failed to fetch rating');
      const ratingData = await ratingResponse.json();
      const roundedRating = Math.round(ratingData.rating); // Round rating to nearest integer

      const questionsResponse = await fetch(`https://leetcodeapi-v1.vercel.app/questions/${user.username}`);
      if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
      const questionsData = await questionsResponse.json();

      // Update display and LocalStorage
      updateDisplay(user.username, roundedRating, questionsData);
      saveDataToLocal(user.username, roundedRating, questionsData);

    } catch (error) {
      console.error(`Error fetching data for ${user.username}:`, error);
    }
  }
}

// Event listener for adding a new username
document.getElementById('fetch-rating').addEventListener('click', async () => {
  let username = document.getElementById('username').value.trim(); // Get the entered username

  if (!username) {
    alert('Please enter a LeetCode username!');
    return;
  }

  // Fetch rating and questions for the new username
  try {
    const ratingResponse = await fetch(`https://leetcodeapi-v1.vercel.app/rating/${username}`);
    if (!ratingResponse.ok) throw new Error('Failed to fetch rating');
    const ratingData = await ratingResponse.json();
    const roundedRating = Math.round(ratingData.rating); // Round rating to nearest integer

    const questionsResponse = await fetch(`https://leetcodeapi-v1.vercel.app/questions/${username}`);
    if (!questionsResponse.ok) throw new Error('Failed to fetch questions');
    const questionsData = await questionsResponse.json();

    // Display data and save it locally
    updateDisplay(username, roundedRating, questionsData);
    saveDataToLocal(username, roundedRating, questionsData);

    // Load the updated stored data
    loadDataFromLocal();

  } catch (error) {
    alert(`Error fetching data: ${error.message}`);
  }
});

document.getElementById('refresh-btn').addEventListener('click', async () => {
  showLoadingSpinner(); // Show spinner when refresh starts
  await refreshAllData(); // Refresh data
  loadSortedData(); // Reload sorted data
  hideLoadingSpinner(); // Hide spinner when refresh is complete
});

// Load stored data and refresh when the extension is opened
window.onload = async () => {
  showLoadingSpinner();  // Show spinner when loading starts
  // await refreshAllData();  // Refresh data when the extension is opened
  loadSortedData();       // Load sorted data (default by username)
  addSortingUI();         // Add sorting UI event listeners
  hideLoadingSpinner();   // Hide spinner when loading is complete
};




   