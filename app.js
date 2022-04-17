/******************************************************************************
***
* ITE5315 – Project
* I declare that this assignment is my own work in accordance with Humber Academic Policy.
* No part of this assignment has been copied manually or electronically from any other source
* (including web sites) or distributed to other students.
*
* Group Member Names: Guray Demirezen, Vishnu Pillai
* Student IDs: N01451141, N01454618
* Date: April 11, 2022
*
*
******************************************************************************
**/

// Import all required modules
require('dotenv').config()
var express = require('express');
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
const exphbs = require("express-handlebars");
const session = require('express-session');
var path = require('path');

// Initialize express app
var port = process.env.PORT || 8000;
var app = express();
app.use(bodyParser.urlencoded({ 'extended': 'true' }));         // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json

// Configure the database
var dbConfig = require('./config/database');
const connectionString = dbConfig.url;
const Restaurants = require('./models/restaurants');
const db = new Restaurants();

// Configure handlebars
// Access static files in public directory
app.use(express.static(path.join(__dirname, 'public')));

// Register handlebars as the rendering engine for views
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

// Configure session
app.use(session({
    secret: 'secretdb_groupproject_sshhhhh99281',
    saveUninitialized: true,
    resave: true
}));

// Routes

// Home Page
// Display index.hbs on the home page
app.get('/', ensureLogin, function (req, res) {
    res.render('index', { title: 'Group Project', user: req.session.user });
});

// Login page 
app.get('/login', function (req, res) {
    res.render('login');
});

// Login page
// get the user name and the password and then connect to mongodb
app.post('/login', function (req, res) {
    var userName = req.body.uName;
    var password = req.body.password;

    if (userName === "" || password === "") {
        // Render 'Missing credentials'
        return res.render("login", { errorMsg: "Missing credentials, enter both username and password." });
    }

    if (userName === process.env.USER_NAME && password === process.env.PASSWORD) {
        // Add the user on the session and redirect them to the dashboard page.
        req.session.user = {
            userName: userName,
        };

        db.initialize(connectionString)
            .then(function () {
                res.redirect("/");
            })
            .catch(function (err) {
                res.render('login');
                // Show error message if couldn't connect
                console.log(`Could not connect to Atlas server, error: '${err}'`);
            });

    } else {
        // render 'invalid username or password'
        res.render("login", { errorMsg: "Invalid username or password!" });
    }

});

// Log a user out by destroying their session and redirecting them to /login
app.get("/logout", function (req, res) {
    req.session.destroy();
    res.redirect("/login");
});

// Update route
// When user clicks on the update sign, it will call update.hbs
app.get('/api/update', ensureLogin, async function (req, res) {
    let id = req.query.restaurantId;

    let updatingRestaurant = await db.Restaurant.findOne({ restaurant_id: id }).lean();

    console.log(updatingRestaurant);
    res.render('update', { data: updatingRestaurant });

})

// When user finishes updating, it will go back to main page
app.post('/api/update', ensureLogin, async function (req, res) {
    mydate = req.body.gradingDate;
    mygrade = req.body.grade;
    myScore = req.body.score;

    sess = req.session;

    page = sess.page
    perPage = sess.perPage
    myborough = sess.borough

    let myGrades = [];

    for (let i = 0; i < mydate.length; i++) {
        myGrades.push({
            date: mydate[i],
            grade: mygrade[i],
            score: myScore[i]
        })
    }

    let restaurant = {
        address: {
            building: req.body.buildingNumber,
            //coord: [req.body.longitude, req.body.latitude],
            street: req.body.streetName,
            zipcode: req.body.zipCode
        },
        borough: req.body.borough,
        cuisine: req.body.cuisine,
        grades: myGrades,
        name: req.body.restaurantName,
        restaurant_id: req.body.restaurantId
    }

    await db.Restaurant.findOneAndUpdate({ restaurant_id: restaurant.restaurant_id }, restaurant);

    res.redirect("filterRestaurants?restaurant_id=" + restaurant.restaurant_id);

})

// Delete route
// When user clicks on the delete button
// It will delete the restaurant data and go back to main page
app.get('/api/delete', ensureLogin, async function (req, res) {
    let id = req.query.restaurantId;
    await db.Restaurant.findOneAndDelete({ restaurant_id: id });

    res.redirect("filterRestaurants")

})

// It will display only the matching restaurant data
app.post('/api/search', ensureLogin, async function (req, res) {
    let resId = req.body.restaurantID;
    result = await db.getRestaurantByRestaurantId(resId);

    if (result != null) {
        console.log(result);
        res.redirect("filterRestaurants?restaurant_id=" + resId);
    }
    else {
        try {
            res.render("display", { title: 'Filtered Restaurant Results', data: result });
        }
        catch (err) {
            res.status(400).json({ error: `${err}` })
        }
    }
})

// Insert route
// It will display the insertRestaurant.hbs
app.get('/api/insert', ensureLogin, function (req, res) {
    res.render('insertRestaurant');
})

// It will insert the new data to the database then go back to the main page
app.post('/api/insert', ensureLogin, async function (req, res) {

    let restaurant = {
        address: {
            building: req.body.buildingNumber,
            //coord: [req.body.longitude, req.body.latitude],
            street: req.body.streetName,
            zipcode: req.body.zipCode
        },
        borough: req.body.borough,
        cuisine: req.body.cuisine,
        grades: [
            {
                date: req.body.gradingDate,
                grade: req.body.grade,
                score: req.body.score
            }]
        ,
        name: req.body.restaurantName,
        restaurant_id: req.body.restaurantId
    }

    await db.Restaurant.create(restaurant, function (err) {
        if (err) {
            console.log(`error occurs: '${err}'`);
        }
    });

    res.redirect("filterRestaurants?restaurant_id=" + restaurant.restaurant_id);

});

// Add new restaurant document to collection using the body of the request
app.post('/api/restaurants', ensureLogin, async function (req, res) {
    var newRestaurant = await db.addNewRestaurant(req.body);
    try {
        res.status(201).json({ message: newRestaurant });
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
})

// Get all restaurant objects based on a page that the user enters, and can also filter by borough if user enters it
// The final page in database: page=253&perPage=100
app.get('/api/restaurants', ensureLogin, async function (req, res) {
    var page = req.query.page;
    var perPage = req.query.perPage;
    var borough = req.query.borough;
    var result = await db.getAllRestaurants(page, perPage, borough);
    try {
        if (result.length > 0) {
            res.status(200).json(result);
        }
        else {
            res.status(404).json({
                error: 'There are no restaurants found at that page!',
            })
        }
    }
    catch (err) {
        res.status(400).json({ error: `${err}` })
    }
});

// Retrieves a restaurant which has a specific id from the database
app.get('/api/restaurants/:id', ensureLogin, async function (req, res) {
    // Get the id
    let id = req.params.id
    var result = await db.getRestaurantById(id);

    // Show result or error message
    try {
        if (result) {
            res.status(200).json(result);
        }
        else {
            res.status(404).json({ error: 'There are no restaurant matches with that ID!' });
        }
    }
    catch (err) {
        res.status(400).json({ error: err });
    }
});

// Update/overwrite a restaurant in the database using its id
app.put('/api/restaurants/:id', ensureLogin, async function (req, res) {
    // Get the id
    let id = req.params.id

    // Update the restaurant by using its id
    var result = await db.updateRestaurantById(req.body, id);
    try {
        if (result) {
            console.log(res);
            res.status(200).json({ message: result });
        }
        else {
            res.status(404).json({ error: 'There are no restaurant matches with that ID!' });
        }
    }
    catch {
        res.status(400).json({ error: `Error occurred in updating restaurant with id: ${id}, ${error}` });
    }
});

// Delete a restaurant from the database using id
app.delete('/api/restaurants/:id', ensureLogin, async function (req, res) {
    // Get the id
    let id = req.params.id

    // Delete the restaurant
    var result = await db.deleteRestaurantById(id);
    try {
        if (result) {
            res.status(200).json({ message: result });
        }
        else {
            res.status(404).json({ error: 'There are no restaurant matches with that ID!' });
        }
    }
    catch {
        res.status(400).json({
            error_message: `Error occurred when deleting a restaurant with id: ${id}, ${error}`
        });
    }
});

// Display handlebar form to filter restaurants
app.get("/api/searchRestaurants", ensureLogin, function (req, res) {
    res.render("filterRestaurants", { title: 'Search Restaurants' });

});

// Get the restaurant data entered in form and display the details in a table
app.post('/api/searchrestaurants', ensureLogin, async function (req, res) {
    var page = req.body.page;
    var perPage = req.body.perPage;
    var borough = req.body.borough;

    console.log("Page: " + page + "\n" + "Results per page: " + perPage + "\n" + "Borough: " + borough)
    sess = req.session;

    sess.page = page;
    sess.perPage = perPage;
    sess.borough = borough;
    res.redirect("filterRestaurants")

});


// Display handlebar form to filter restaurants
app.get("/api/filterRestaurants", ensureLogin, async function (req, res) {

    let resId = req.query.restaurant_id;

    sess = req.session;

    page = sess.page
    perPage = sess.perPage
    borough = sess.borough
    var result

    if (resId) {
        result2 = await db.getRestaurantByRestaurantId(resId);
        perPage = null;
        result = [result2];
    } else {
        result = await db.getAllRestaurants(page, perPage, borough);
    }

    try {
        res.render("display", { title: 'Filtered Restaurant Results', data: result, page: page, perPage: perPage, borough: borough });
    }
    catch (err) {
        res.status(400).json({ error: `${err}` })
    }

});

// Search for a restaurant by its id for updating
app.get('/api/updateRestaurant/:restaurant_id', ensureLogin, async function (req, res) {
    let id = req.params.restaurant_id;
    let updatingRestaurant = await db.getRestaurantById(id)
    console.log(updatingRestaurant);
    res.render('update', { data: updatingRestaurant });
})

// Update a restaurant
app.post('/api/updateRestaurant', ensureLogin, async function (req, res) {
    mydate = req.body.gradingDate;
    mygrade = req.body.grade;
    myScore = req.body.score;

    let myGrades = [];

    for (let i = 0; i < mydate.length; i++) {
        myGrades.push({
            date: mydate[i],
            grade: mygrade[i],
            score: myScore[i]
        })
    }

    let restaurant = {
        address: {
            building: req.body.buildingNumber,
            //coord: [req.body.longitude, req.body.latitude],
            street: req.body.streetName,
            zipcode: req.body.zipCode
        },
        borough: req.body.borough,
        cuisine: req.body.cuisine,
        grades: myGrades,
        name: req.body.restaurantName,
        restaurant_id: req.body.restaurantId
    }

    await db.Restaurant.findOneAndUpdate({ restaurant_id: restaurant.restaurant_id }, restaurant);
    let findUpdated = await db.Restaurant.findOne({ restaurant_id: restaurant.restaurant_id }).lean();

    res.render('display', { data: findUpdated });
})

// Check if user is authenticated
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

app.listen(port, () => {
    console.log(`App listening on: ${port}`);
});
