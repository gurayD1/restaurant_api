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
var mongoose = require('mongoose');
var bodyParser = require('body-parser');         // pull information from HTML POST (express4)
const exphbs = require("express-handlebars");
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

// Routes

// Home Page
// Display index.hbs on the home page
app.get('/', function (req, res) {
	res.render('index', { title: 'Group Project' });
  }); 

// Add new restaurant document to collection using the body of the request
app.post('/api/restaurants', async function (req, res) {
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
app.get('/api/restaurants', async function (req, res) {
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
app.get('/api/restaurants/:id', async function (req, res) {
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
app.put('/api/restaurants/:id', async function (req, res) {
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
app.delete('/api/restaurants/:id', async function (req, res) {
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
app.get("/api/filterRestaurants", function (req, res) {
	res.render("restaurantForm", { title: 'Filter Restaurants'});
});

// Get the restaurant data entered in form and display the details in a table
app.post('/api/filterRestaurants', async function (req, res) {
    var page = req.body.page;
    var perPage = req.body.perPage;
    var borough = req.body.borough;
    var result = await db.getAllRestaurants(page, perPage, borough);
    try {  
        res.render("display", { title: 'Filtered Restaurant Results', data: result, page: page, perPage: perPage, borough: borough });
    }
    catch (err) {
        res.status(400).json({ error: `${err}` })
    }
});

app.get('/api/updateRestaurant/:restaurant_id', async function(req, res){
    let Id = req.params.restaurant_id;
    let updatingRestaurant = await db.getRestaurantById(Id)
    console.log(updatingRestaurant);
    res.render('update', {
        data: updatingRestaurant,
        layout: false
    })

   
})

app.post('/api/updateRestaurant', async function(req, res){
    mydate = req.body.gradingDate;
    mygrade = req.body.grade;
    myScore = req.body.score;

     let myGrades = [];

    for(let i = 0; i<mydate.length; i++ ){
        myGrades.push({
            date : mydate[i],
            grade : mygrade[i],
            score : myScore[i]
        })
    }
    
    let restaurant ={
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

        let updating = await db.Restaurant.findOneAndUpdate({restaurant_id: restaurant.restaurant_id}, restaurant);
        let findUpdated = await db.Restaurant.findOne({restaurant_id: restaurant.restaurant_id}).lean();

        res.render('displayOne', {
            data: findUpdated,
            layout: false
        })
})



// Connect to MongoDB Atlas (initialize module before server starts)
db.initialize(connectionString)
    .then(function () {
        // Sets up app to listen on the port
        app.listen(port, () => {
            console.log(`App listening on: ${port}`);
        });
    })
    .catch(function (err) {
        // Show error message if couldn't connect
        console.log(`Could not connect to Atlas server, error: '${err}'`);
    });
