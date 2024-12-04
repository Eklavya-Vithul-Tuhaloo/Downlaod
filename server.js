const express = require('express'); // Change const express = require('express') to import express from express
const router = express.Router();
const  MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const session = require('express-session');  // Add session
const app = express();
const cors = require('cors');
const http = require('http');
const axios = require('axios');
const {Server} = require('socket.io');
const server = http.createServer(app);
const io = new Server(server);
const nodemailer = require('nodemailer');
const PORT = 9000;
app.use(cors());   

// MongoDB URI and DB name
//const uri = "mongodb+srv://et523:zzclDLjLXs7Cvsan@cluster0.dpz3g.mongodb.net/<database>?retryWrites=true&w=majority";

const MONGODB_URI = "mongodb+srv://et523:zzclDLjLXs7Cvsan@cluster0.dpz3g.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const DB_NAME = "mo-download";
let db;
let postsCollection;
const secretKey = 'secret_key';
const onlineUsers = new Map();


app.use(session({
  secret: 'top-secret',  
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true for HTTPS
}));

app.use(cors({
    origin: "http://localhost:9000", 
    methods: ["GET", "POST"],
    credentials: true
  }));

// Connect to MongoDB
MongoClient.connect(MONGODB_URI, {useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
    // Check if the 'posts' collection exists, and if not, create it by inserting a dummy document
    const collection = db.collection('posts');
    collection.countDocuments({}, (err, count) => {
        if (err) {
            console.error('Error checking collection:', err);
        } else if (count === 0) {
            // Insert a dummy post to create the collection
            collection.insertOne({ userPost:'Initial dummy user',description: 'Initial dummy post', image: 'dummy.jpg' })
                .then(() => console.log('Created posts collection with dummy post.'));
        }
    });

    // Start the server only after the DB connection is successful
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch(err => console.error("Error connecting to MongoDB:", err));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Ensure the 'uploads' folder exists
const uploadDir = path.join(__dirname, '/', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });  // Create the folder if it doesn't exist
}

// Setup static file serving
app.use(express.static(path.join(__dirname, '/'))); // Serve files from the public folder

// Setup body parsing for JSON and FormData
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Setup Multer storage for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);  // Use the 'uploads' directory
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Ensure unique filenames
    }
});
const upload = multer({ storage });

// Handle POST request to upload image
app.post('/upload', upload.single('image'), async (req, res) => {
    console.log("Received file upload:", req.session.user.email);
    try {
        // Ensure user session exists
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'User not logged in.' });
        }

        // Ensure a file is uploaded
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded.' });
        }

        const user = req.session.user;
        const description = req.body.description;
        const image = req.file.filename;
        const imageUrl = `/uploads/${image}`; // URL for the uploaded file

        // Ensure the database is connected
        if (!db) {
            console.error("Database connection not established.");
            return res.status(500).json({ success: false, message: 'Database connection not established.' });
        }

        // Document to insert
        const post = { 
            userPost: user.email.split('@')[0], 
            description, 
            image, 
            imageUrl, 
            createdAt: new Date() // Add a timestamp for tracking
        };
        console.log("Post to insert:", post);	
        // Insert into the collection
        const collection = db.collection('posts');
        const result = await collection.insertOne(post);

        // Check insertion result
        if (!result.acknowledged) {
            console.error('Failed to insert post:', result);
            return res.status(500).json({ success: false, message: 'Failed to save post details in the database.' });
        }

        // Success response
        res.json({ success: true, imageUrl });
    } catch (err) {
        console.error("Error during file upload:", err); // Log the error
        res.status(500).json({ success: false, message: 'An unexpected error occurred.', error: err.message });
    }
});


// New route to fetch all uploaded images for the logged-in user
app.get('/images', async (req, res) => {
  console.log("Received request for /images");

  // Ensure user is logged in
  if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'User not logged in.' });
  }

  if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not established.' });
  }

  const collection = db.collection('posts');
  const userEmail = req.session.user.email.split('@')[0];

  try {
      // Find all posts made by the logged-in user
      const userPosts = await collection.find({ userPost: userEmail }).toArray();

      // Extract the image filenames from the user's posts
      const images = userPosts.map(post => post.image);
      console.log('User images:', images);
      console.log('User email:', userEmail);
      // Send back the images for the logged-in user
      res.json({ success: true, images });
  } catch (err) {
      console.error('Error fetching images:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch images.' });
  }
});


// Server-side route to fetch descriptions for the logged-in user
app.get('/descriptions', async (req, res) => {
  console.log("Received request for /descriptions");

  if (!db) {
      return res.status(500).json({ success: false, message: 'Database connection not established.' });
  }

  // Ensure user is logged in by checking session data
  if (!req.session || !req.session.user) {
      return res.status(401).json({ success: false, message: 'User not logged in.' });
  }

  const userEmail = req.session.user.email.split('@')[0];  // Assuming user email is stored in the session
  const collection = db.collection('posts');

  try {
      // Fetch posts for the logged-in user using the userEmail
      const documents = await collection.find({ userPost: userEmail }).toArray();

      // Extract descriptions of posts from the filtered documents
      const descriptions = documents.map(doc => doc.description);
      console.log('Descriptions:', userEmail);
      console.log('Descriptions:', descriptions);

      // Respond with the descriptions
      res.json({ success: true, posts: descriptions });
  } catch (err) {
      console.error('Error fetching posts:', err);
      return res.status(500).json({ success: false, message: 'Failed to fetch posts.' });
  }
});


// Signup Route
app.post('/signup', (req, res) => {
  const { email, password } = req.body;

  db.collection('users').insertOne({ email, password, username: email.split('@')[0] })
      .then(() => res.json({ success: true, message: 'Signup successful' }))
      .catch(err => {
          console.error(err);
          res.status(500).json({ success: false, message: 'An error occurred during signup' });
      });
});

// Login Route
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.collection('users').findOne({ email, password })
      .then(user => {
          if (user) {
              const token = jwt.sign({ username: user.username, email: user.email }, secretKey, { expiresIn: '1h' });
              req.session.user = { email: user.email, username: user.username };
              res.json({ success: true, message: 'Login successful', token, userId: user._id });
          } else {
              res.status(400).json({ success: false, message: 'Invalid email or password' });
          }
      })
      .catch(err => {
          console.error(err);
          res.status(500).json({ success: false, message: 'An error occurred during login' });
      });
});

// Middleware for JWT authentication
function authenticate(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Unauthorized' });

  jwt.verify(token, secretKey, (err, decoded) => {
      if (err) return res.status(401).json({ message: 'Unauthorized' });
      req.user = decoded;
      next();
  });
}

// Search Users Route
app.get('/all-users', authenticate, async (req, res) => {
  const { query } = req.query;
  const usersCollection = db.collection('users');
  const users = await usersCollection.find({ username: { $regex: query, $options: 'i' } }).toArray();
  res.json({ users });
});

// Send friend request 
app.post('/friend-request', authenticate, async (req, res) => {
  const { targetUsername } = req.body;
  const userCollection = db.collection('users');
  const friendRequestsCollection = db.collection('friendRequests');

  const targetUser = await userCollection.findOne({ username: targetUsername });
  if (!targetUser) return res.status(400).json({ message: 'User not found.' });

  const existingRequest = await friendRequestsCollection.findOne({ from: req.user.username, to: targetUsername });
  if (existingRequest) return res.status(400).json({ message: 'Friend request already sent.' });

  await friendRequestsCollection.insertOne({ from: req.user.username, to: targetUsername, status: 'pending' });
  res.status(200).json({ message: 'Friend request sent.' });
});

// Accept friend request 
app.post('/accept-friend', authenticate, async (req, res) => {
  const { fromUsername } = req.body;
  const friendRequestsCollection = db.collection('friendRequests');
  const friendsCollection = db.collection('friends');

  const request = await friendRequestsCollection.findOne({ from: fromUsername, to: req.user.username, status: 'pending' });
  if (!request) return res.status(400).json({ message: 'No pending friend request.' });

  await friendRequestsCollection.updateOne({ _id: request._id }, { $set: { status: 'accepted' } });
  await friendsCollection.insertOne({ user1: req.user.username, user2: fromUsername });
  res.status(200).json({ message: 'Friend request accepted.' });
});

// Get friends list 
app.get('/friends', authenticate, async (req, res) => {
  const friendsCollection = db.collection('friends');
  try {
      const friends = await friendsCollection.find({
          $or: [{ user1: req.user.username }, { user2: req.user.username }]
      }).toArray();

      const friendUsernames = new Set(
          friends.map(friend => (friend.user1 === req.user.username ? friend.user2 : friend.user1))
      );

      res.json({ success: true, friends: Array.from(friendUsernames) });
  } catch (error) {
      console.error('Error fetching friends:', error);
      res.status(500).json({ success: false, message: 'Error fetching friends.' });
  }
});

// Get pending friend requests
app.get('/friend-requests', authenticate, async (req, res) => {
    const friendRequestsCollection = db.collection('friendRequests');

    try {
        const requests = await friendRequestsCollection
            .find({ to: req.user.username, status: 'pending' })
            .toArray();
        res.status(200).json({ success: true, requests });
    } catch (error) {
        console.error('Error fetching friend requests:', error);
        res.status(500).json({ success: false, message: 'Error fetching friend requests.' });
    }
});

// Route to check session and user info
app.get('/session', (req, res) => {
    if (req.session.user) {
        res.json({ success: true, user: req.session.user });
    } else {
        res.json({ success: false });
    }
    });

// Decline friend request 
app.post('/decline-friend', authenticate, async (req, res) => {
  const { fromUsername } = req.body;
  const friendRequestsCollection = db.collection('friendRequests');

  const result = await friendRequestsCollection.deleteOne({
      from: fromUsername,
      to: req.user.username,
      status: 'pending'
  });

  if (result.deletedCount > 0) {
      res.status(200).json({ success: true, message: 'Friend request declined.' });
  } else {
      res.status(400).json({ success: false, message: 'No pending friend request found.' });
  }
});


// Get posts from followed users
app.get('/posts', async (req, res) => {
    // Ensure user is logged in
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'User not logged in.' });
    }

    try {
        // Retrieve the user's email and corresponding username
        const userEmail = req.session.user.email;
        const username = req.session.user.username; // Assume this is also stored in the session
    
        if (!username) {
            throw new Error("Username not found in session.");
        }
    
        console.log("User Email:", userEmail);
        console.log("Username:", username);
    
        // Query the friends collection with the username
        const friendsCollection = db.collection('friends');
        const followedUsers = await friendsCollection
            .find({ $or: [{ user1: username }, { user2: username }] })
            .toArray();
    
        // Debug log: Check if the query retrieved any documents
        if (!followedUsers || followedUsers.length === 0) {
            console.warn("No friends found for the user:", username);
        } else {
            console.log("Friends Found:", followedUsers);
        }
    
        // Extract emails of followed users
        const followedEmails = followedUsers.map(friend =>
            friend.user1 === username ? friend.user2 : friend.user1
        );
    
        console.log("Followed Usernames:", followedEmails);
    
        // Query the posts collection
        const postsCollection = db.collection('posts');
        const posts = await postsCollection
            .find({ userPost: { $in: followedEmails } })
            .toArray();
    
        // Debug log: Check if posts are retrieved
        if (!posts || posts.length === 0) {
            console.warn("No posts found for the followed users:", followedEmails);
        } else {
            console.log("Posts Retrieved:", posts);
        }
    
        res.json({ success: true, posts });
    } catch (err) {
        console.error("Error fetching posts:", err.message);
        res.status(500).json({ success: false, message: "Failed to fetch posts." });
    }
    
});

// Logout Route
app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Failed to log out." });
    }
    res.json({ success: true, message: "Logged out successfully." });
  });
});

// Middleware to parse JSON body
app.use(bodyParser.json());

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    host: 'smtp.mailersend.net',
    port: 587,
    secure: false, // Use `true` for SSL (port 465)
    auth: {
        user: 'MS_pnRU2C@trial-vywj2lpenqkg7oqz.mlsender.net', // Your MailSender email
        pass: 'dEBiVj2OptqfzeB8' // MailSender API key or password
    },
    tls: {
        ciphers: 'TLSv1.2'
    }
});

// API endpoint to handle email sending
app.post('/send-post-email', (req, res) => {
    const { email, imageUrl, description } = req.body;

    if (!email || !imageUrl || !description) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    // Construct the full path to the uploaded image
    const imagePath = path.join(__dirname, '/', imageUrl);

    const transporter = nodemailer.createTransport({
        host: 'smtp.mailersend.net',
        port: 587,
        secure: false,
        auth: {
            user: 'MS_pnRU2C@trial-vywj2lpenqkg7oqz.mlsender.net',
            pass: 'dEBiVj2OptqfzeB8',
        },
        tls: {
            ciphers: 'TLSv1.2',
        },
    });

    const mailOptions = {
        from: '"Your Name" <MS_pnRU2C@trial-vywj2lpenqkg7oqz.mlsender.net>',
        to: email,
        subject: 'Post Details',
        html: `
            <h2>Post Details</h2>
            <p><strong>Description:</strong> ${description}</p>
            <p><strong>Attached is the post image.</strong></p>
        `,
        attachments: [
            {
                filename: path.basename(imagePath), // The filename of the image
                path: imagePath, // Path to the image in the uploads folder
                cid: 'postImage', // Unique ID to reference the image in the HTML
            },
        ],
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error:', error);
            return res.status(500).json({ error: 'Error sending email' });
        }
        console.log('Email sent:', info.response);
        res.status(200).json({ message: 'Email sent successfully' });
    });
});