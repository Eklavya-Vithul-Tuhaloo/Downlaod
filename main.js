document.addEventListener("DOMContentLoaded", () => {
    navigateTo(window.location.hash);
});

window.addEventListener("hashchange", () => {
    navigateTo(window.location.hash);
});

function navigateTo(hash) {
    switch (hash) {
        case "#/signup":
            loadSignupPage();
            break;
        case "#/login":
            loadLoginPage();
            break;
        case "#/my-content":
            loadUploadPage();
            break;
        case "#/all-users":
            loadAllUsersPage();
            break;
        case "#/save-post":
            loadGalleryPage();
            break;
        case "#/friend-requests":
            loadFriendRequestsPage();
            break;
        case "#/friend-list":
            loadFriendsPage();
            break;
        case "#/home":
            loadHomePage();
            break;
        case "#/chat":
            loadChatPage();
            break;
        default:
            loadSignupPage();
            break;
    }
}

// Function to handle search
function loadSearchUsers() {    
    return `
    <div>
        <input type="text" placeholder="Search by name or email">
    </div>`;
}

// Function to display search results
function displayUserResults(users) {
    const resultsContainer = document.getElementById("userResults");
    resultsContainer.innerHTML = '';  // Clear previous results
  
    if (users.length === 0) {
      resultsContainer.innerHTML = '<p>No user found.</p>';
    } else {
      // If only one user is found, display their email
      const user = users[0];
      resultsContainer.innerHTML = `
        <p>User found:</p>
        <p class="my-2">${user.email}</p>`;
    }
  }
  

// Render header and footer (same as before)
function renderHeader() {
    return `
        <header>
            <h1>Mo file share</h1>
            <nav>
                <a href="#/login">Login</a>  
                <a href="#/signup">Signup</a>
                <a href="#/all-users">Search Users</a> 
                <a href="#/my-content">Upload Content</a>
                <a href="#/save-post">My Content</a>
                <a href="#/friend-requests">Friend Request</a>
                <a href="#/friend-list">Friends</a>    
                <a href="#/home">Home</a>
                <a href="#/chat">Chat</a>
            </nav>
        </header>`;
}

function renderFooter() {
    return `
        <footer>
            <p>&copy; Made By Eklavya</p>
        </footer>`;
}

function loadPageContent(content) {
    const app = document.getElementById("app");
    if (app) {
        app.innerHTML = renderHeader() + content + renderFooter();
    } else {
        console.error("Element with id 'app' not found.");
    }
}

async function loadHomePage() {
    const homeContent = `
        <div>
            <h2>File Sharing Website</h2>
            <div id="postsContainer">Loading posts...</div>
        </div>`;
    loadPageContent(homeContent); // Load the initial content with a loading message

    try {
        const response = await fetch('/posts', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.status === 401) {
            // Redirect to login if user is not logged in
            alert('You need to be logged in to view the home page.');
            window.location.hash = '/login';
            loadLoginPage();
            return;
        }

        const data = await response.json();

        if (data.success && data.posts) {
            displayPosts(data.posts); // Call the displayPosts function to render posts
        } else {
            document.getElementById("postsContainer").textContent = 'No posts found.';
        }
    } catch (error) {
        console.error('Error fetching posts:', error);
        document.getElementById("postsContainer").textContent = 'Failed to load posts.';
    }
}


document.addEventListener('DOMContentLoaded', function() {
    // Fetch posts dynamically from the backend
    fetch('/posts')
        .then(response => response.json())
        .then(posts => {
            displayPosts(posts); // Call the function to display posts
        })
        .catch(error => console.error('Error loading posts:', error));
});

// Function to dynamically render the posts
function displayPosts(posts) {
    let postsHTML = `
        <h3>Recently Added</h3>
        <div>
            <label for="userEmail">Enter your email:</label>
            <input type="email" id="userEmail" placeholder="Enter your email" required />
        </div>
        <div style="display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
    `;

    posts.forEach(post => {
        const postImage = post.imageUrl
            ? `<img src="${post.imageUrl}" alt="Post Image" style="width: 100%; height: auto; border-radius: 8px;">`
            : '';
        postsHTML += `
            <div class="post" style="border: 1px solid #ddd; padding: 10px; border-radius: 8px; background-color: #fff;">
                ${postImage}
                <p>${post.description}</p>
                <small>By: ${post.userPost} on ${new Date(post.createdAt).toLocaleString()}</small>
                <button class="send-email-button" data-image-url="${post.imageUrl}" data-description="${post.description || ''}">Send to Email</button>
            </div>
        `;
    });

    postsHTML += `</div>`;
    document.getElementById("postsContainer").innerHTML = postsHTML;

    // Event delegation for sending the post via email
    document.getElementById("postsContainer").addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('send-email-button')) {
            const imageUrl = event.target.getAttribute('data-image-url');
            const description = event.target.getAttribute('data-description');
            sendPostToEmail(imageUrl, description);
        }
    });
}

// Function to send the post details to the user's email
function sendPostToEmail(imageUrl, description) {
    const userEmail = document.getElementById("userEmail");

    // Ensure the email input field exists
    if (!userEmail || !userEmail.value) {
        alert("Please enter your email address.");
        return;
    }

    // Send the email using a POST request to the backend
    fetch('/send-post-email', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email: userEmail.value,
            imageUrl: imageUrl, // Ensure imageUrl is passed correctly
            description: description
        })
    })
    .then(response => response.json())
    .then(data => {
        alert('Email sent successfully!');
    })
    .catch(error => {
        console.error('Error sending email:', error);
        alert('There was an error sending the email.');
    });
}

function loadLoginPage() {
    const loginContent = `
<div class="wrapper" style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100%; background-color: #f5f5f5;">
    <div class="form-container" style="width: 100%; max-width: 500px; padding: 20px; background-color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px;">
        <div class="slide-controls" style="margin-bottom: 20px; text-align: center;">
            <label for="login" class="slide login" style="font-size: 24px; font-weight: bold; color: #333;">Login</label>
        </div>
        <div class="form-inner">
            <form class="login" id="loginForm" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="field" style="margin-bottom: 15px;">
                    <input type="text" placeholder="Email Address" required id="loginEmail" style="width: 100%; padding: 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;">
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <input type="password" placeholder="Password" required id="loginPassword" style="width: 100%; padding: 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;">
                </div>
                <div class="field" style="text-align: center; color: black;">
                    <input type="submit" value="Login" style="background-color: #4CAF50; color: white; border: none; padding: 15px; font-size: 16px; border-radius: 5px; cursor: pointer; width: 100%; transition: background-color 0.3s ease;">
                </div>
            </form>
        </div>
    </div>
</div>
`;
    loadPageContent(loginContent);

    document.getElementById("loginForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;

        try {
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token', data.token); // Save token for authentication
                alert(data.message);
                window.location.hash = '/all-users';
                loadAllUsersPage();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Login failed. Please try again.'+ error);
        }
    });
}


// Signup Page (redirect to All Users page on success)
function loadSignupPage() {
    const signupContent = `
<div class="wrapper" style="display: flex; justify-content: center; align-items: center; height: 100vh; width: 100%; background-color: #f5f5f5;">
    <div class="form-container" style="width: 100%; max-width: 500px; padding: 20px; background-color: white; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); border-radius: 8px;">
        <div class="slide-controls" style="margin-bottom: 20px; text-align: center;">
            <label for="signup" class="slide signup" style="font-size: 24px; font-weight: bold; color: #333;">Signup</label>
            <div class="slide-tab" style="margin-top: 10px; width: 50px; height: 4px; background-color: #4CAF50; border-radius: 2px; margin-left: auto; margin-right: auto;"></div>
        </div>
        <div class="form-inner">
            <form class="signup" id="signupForm" style="display: flex; flex-direction: column; gap: 20px;">
                <div class="field" style="margin-bottom: 15px;">
                    <input type="text" placeholder="Email Address" required id="signupEmail" style="width: 100%; padding: 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;">
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <input type="password" placeholder="Password" required id="signupPassword" style="width: 100%; padding: 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;">
                </div>
                <div class="field" style="margin-bottom: 15px;">
                    <input type="password" placeholder="Confirm Password" required id="confirmPassword" style="width: 100%; padding: 15px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px;">
                </div>
                <div class="field" style="text-align: center; color: black;">
                    <input type="submit" value="Signup" style="background-color: #4CAF50; color: white; border: none; padding: 15px; font-size: 16px; border-radius: 5px; cursor: pointer; width: 100%; transition: background-color 0.3s ease;">
                </div>
            </form>
        </div>
    </div>
</div>`;

    loadPageContent(signupContent);

    // Handle signup form submission
    document.getElementById("signupForm").addEventListener("submit", async function (event) {
        event.preventDefault();
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        try {
            const response = await fetch('/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.hash = '/home';
                loadLoginPage();
            } else {
                alert(data.message);
            }
        } catch (error) {
            alert('Signup failed. Please try again.');
        }
    });
}

function loadAllUsersPage() {
    const allUsersContent = `
        <div class="text-center my-4" style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100vh; width: 100%; background-color: #f5f5f5;">
            <div style="width: 100%; max-width: 600px; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
                    <input type="text" id="searchInput" placeholder="Search by name or email" class="p-2" 
                        style="width: 80%; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; margin-right: 10px;">
                    <button id="searchButton" class="p-2" 
                            style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                        Search
                    </button>
                </div>
                <div id="userResults" style="margin-top: 20px; color: #333;"></div>
            </div>
        </div>`;
    loadPageContent(allUsersContent);

    // Add event listener to the search button
    document.getElementById("searchButton").addEventListener("click", searchUsers);
}

// Function to handle the search
async function searchUsers() {
    const query = document.getElementById("searchInput").value.trim();

    if (!query) {
        alert("Please enter a search query.");
        return;
    }

    try {
        const response = await fetch(`/all-users?query=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        if (response.ok) {
            const users = data.users.map(user => `
                <div style="padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px; background-color: #f9f9f9; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 16px; color: #333;">${user.username}</span>
                    <button onclick="sendFriendRequest('${user.username}')" 
                            style="padding: 5px 10px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 14px; cursor: pointer;">
                        Send Friend Request
                    </button>
                </div>
            `).join('');

            const allUsersContent = `
                <div class="text-center my-4" style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100vh; width: 100%; background-color: #f5f5f5;">
                    <div style="width: 100%; max-width: 600px; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
                            <input type="text" id="searchInput" placeholder="Search by name or email" class="p-2" 
                                style="width: 80%; padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; margin-right: 10px;">
                            <button id="searchButton" class="p-2" 
                                    style="padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                                Search
                            </button>
                        </div>
                        <div id="userResults" style="margin-top: 20px; color: #333;">
                            ${users || '<p style="text-align: center; color: #666;">No users found.</p>'}
                        </div>
                    </div>
                </div>
            `;
            document.getElementById("app").innerHTML = allUsersContent;

            // Reattach the search button listener for reusability
            document.getElementById("searchButton").addEventListener("click", fetchAndDisplayUsers);
        } else {
            alert(data.message || 'Error searching for users.');
        }
    } catch (error) {
        alert('Error connecting to the server. Please try again.' + errpr);
    }
}

// Function to display search results
function displayUserResults(users) {
    const resultsContainer = document.getElementById("userResults");
    resultsContainer.innerHTML = ''; // Clear previous results

    if (users.length === 0) {
        resultsContainer.innerHTML = '<p>No user found.</p>';
    } else {
        users.forEach(user => {
            const userId = sessionStorage.getItem('userId');
            const isFollowing = user.followers && user.followers.includes(userId);  // Assuming followers are an array of userIds

            resultsContainer.innerHTML += `
                <div class="user-result my-2 p-4 border-b">
                    <p>${user.email}</p>
                    <button class="subscribe-btn p-2 ${isFollowing ? 'bg-red-500' : 'bg-blue-500'} text-white rounded" 
                            data-user-id="${user._id}">
                        ${isFollowing ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                </div>`;
        });

        // Add event listeners for subscribe/unsubscribe buttons
        const subscribeButtons = document.querySelectorAll(".subscribe-btn");
        subscribeButtons.forEach(button => {
            button.addEventListener("click", handleFollowUnfollow);
        });
    }
}
// Send Friend Request
async function sendFriendRequest(username) {
    try {
        const response = await fetch('/friend-request', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ targetUsername: username })
        });
        const data = await response.json();
        alert(data.message);
    } catch (error) {
        alert('Error sending friend request.');
    }
}

// Load Friends Page
async function loadFriendsPage() {
    try {
        const response = await fetch('/friends', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        if (response.ok) {
            const friends = data.friends.map(username => `
                <div>${username}</div>
            `).join('');
            loadPageContent(`
                <div>
                    <h2>Your Friends</h2>
                    ${friends || '<p>You have no friends yet.</p>'}
                </div>
            `);
        } else {
            alert(data.message || 'Error loading friends.');
        }
    } catch (error) {
        alert('Error connecting to the server.');
    }
}

// Load Friend Requests Page
async function loadFriendRequestsPage() {
    try {
        const response = await fetch('/friend-requests', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await response.json();

        if (response.ok) {
            const requestsContent = data.requests.map(request => `
                <div style="display: flex; align-items: center; justify-content: space-between; padding: 10px; border-bottom: 1px solid #ddd;">
                    <span style="font-size: 18px; color: #333;">${request.from}</span>
                    <div>
                        <button onclick="acceptFriendRequest('${request.from}')" 
                            style="padding: 10px 15px; background-color: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; margin-right: 10px;">
                            Accept
                        </button>
                        <button onclick="declineFriendRequest('${request.from}')" 
                            style="padding: 10px 15px; background-color: #f44336; color: white; border: none; border-radius: 5px; cursor: pointer;">
                            Decline
                        </button>
                    </div>
                </div>
            `).join('');

            const requestsPageContent = `
                <div style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100vh; width: 100%; background-color: #f5f5f5;">
                    <div style="width: 100%; max-width: 600px; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                        <h2 style="text-align: center; font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px;">Pending Friend Requests</h2>
                        ${requestsContent || '<p style="text-align: center; color: #555;">No pending requests.</p>'}
                    </div>
                </div>
            `;

            loadPageContent(requestsPageContent);
        } else {
            alert(data.message || 'Error fetching friend requests.');
        }
    } catch (error) {
        alert('Error connecting to the server.');
    }
}


// Accept Friend Request
async function acceptFriendRequest(fromUsername) {
    try {
        const response = await fetch('/accept-friend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fromUsername })
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadFriendRequestsPage(); // Refresh the list
        } else {
            alert(data.message || 'Error accepting friend request.');
        }
    } catch (error) {
        alert('Error connecting to the server.');
    }
}

// Decline Friend Request
async function declineFriendRequest(fromUsername) {
    try {
        const response = await fetch('/decline-friend', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ fromUsername })
        });
        const data = await response.json();

        if (response.ok) {
            alert(data.message);
            loadFriendRequestsPage(); // Refresh the list
        } else {
            alert(data.message || 'Error declining friend request.');
        }
    } catch (error) {
        alert('Error connecting to the server.');
    }
}

// My Content Page (add post functionality with userId)
function loadUploadPage() {
    const uploadContent = `
        <div class="text-center my-4" style="display: flex; justify-content: center; align-items: center; flex-direction: column; height: 100vh; width: 100%; background-color: #f5f5f5;">
            <div style="width: 100%; max-width: 600px; padding: 20px; background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
                <h2 style="text-align: center; font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px;">Upload a File</h2>
                <form id="uploadForm" enctype="multipart/form-data" style="display: flex; flex-direction: column; gap: 15px;">
                    <input type="file" name="image" required id="fileInput" 
                        style="padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; cursor: pointer; width: 100%;">
                    <textarea name="description" placeholder="Enter description" required 
                        style="padding: 10px; font-size: 16px; border: 1px solid #ccc; border-radius: 5px; width: 100%; height: 120px;"></textarea>
                    <button type="submit" id="uploadButton" 
                        style="padding: 10px 20px; background-color: #007bff; item-align:center; color: white; border: none; border-radius: 5px; font-size: 16px; cursor: pointer;">
                        Upload
                    </button>
                </form>
                <div id="fileNameDisplay" style="margin-top: 10px; font-weight: bold; color: #333;"></div>
                <div id="uploadStatus" style="margin-top: 20px; color: #333;"></div>
            </div>
        </div>`;

    loadPageContent(uploadContent);

    const fileInput = document.getElementById("fileInput");
    const fileNameDisplay = document.getElementById("fileNameDisplay");

    // Display the selected file name below the upload button when a file is chosen
    fileInput.addEventListener("change", function() {
        const file = fileInput.files[0];
        if (file) {
            fileNameDisplay.textContent = `Selected file: ${file.name}`;  // Show file name
        } else {
            fileNameDisplay.textContent = "No file selected";  // Show this if no file is selected
        }
    });

    // Handle the form submission
    document.getElementById("uploadForm").addEventListener("submit", function (event) {
        event.preventDefault();
        const formData = new FormData(this);

        fetch('/upload', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("uploadStatus").textContent = 'Upload successful!';
                
                // Reset the form fields
                fileInput.value = '';  // Clear the file input
                document.querySelector('textarea[name="description"]').value = '';  
                fileNameDisplay.textContent = "No file selected";  
                
                // Show success alert
                alert('Post uploaded successfully!');

            } else {
               document.getElementById("uploadStatus").textContent = 'Upload failed.';
            }
        })
        .catch(err => {
            console.error(err);
            document.getElementById("uploadStatus").textContent = 'An error occurred.';
        });
    });
}

// Function to load the gallery page with images and descriptions side by side
function loadGalleryPage() {
    // Fetch both images and descriptions concurrently using `Promise.all`
    Promise.all([fetch('/images'), fetch('/descriptions')])
        .then(([imagesResponse, descriptionsResponse]) => {
            // Check for successful responses
            if (!imagesResponse.ok || !descriptionsResponse.ok) {
                throw new Error('Failed to load images or descriptions');
            }
            return Promise.all([imagesResponse.json(), descriptionsResponse.json()]);
        })
        .then(([imagesData, descriptionsData]) => {
            // Check if the fetched data is in the expected format
            if (imagesData.success && descriptionsData.success && Array.isArray(imagesData.images) && Array.isArray(descriptionsData.posts)) {
                // Create gallery content with images and descriptions
                const galleryContent = `
                    <div class="text-center my-4" style="text-align: center; margin: 40px auto; max-width: 1024px; width: 100%;">
                        <h2 style="font-size: 24px; font-weight: bold; color: #333; margin-bottom: 20px;">Image Gallery with Descriptions</h2>
                        <div class="gallery" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; justify-items: center; padding: 20px;">
                            ${imagesData.images.map((image, index) => `
                                <div class="gallery-item" style="text-align: center; background-color: #fff; padding: 15px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); width: 100%;">
                                    <img src="/uploads/${image}" alt="Image ${index + 1}" width="200" style="border-radius: 8px; max-width: 100%; height: auto; object-fit: cover;">
                                    <p style="font-size: 14px; color: #535062; margin-top: 10px; font-family: 'Inter', sans-serif;">
                                        ${descriptionsData.posts[index] || 'No description available'}
                                    </p>
                                </div>
                            `).join('')}
                        </div>
                    </div>`;                                    
                // Insert the generated HTML into the page
                loadPageContent(galleryContent);
            } else {
                document.getElementById("app").innerHTML = '<p>No images or descriptions found.</p>';
            }
        })
        .catch(err => {
            console.error('Error loading images or descriptions:', err);
            document.getElementById("app").innerHTML = '<p>Error loading gallery and descriptions. Please try again later.</p>';
        });
}
