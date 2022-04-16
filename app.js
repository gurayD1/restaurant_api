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
app.use(session({secret: 'ssshhhhh',saveUninitialized: true,resave: true}));

// Register handlebars as the rendering engine for views
app.engine(".hbs", exphbs.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");

// Routes

// Home Page
// Display index.hbs on the home page
app.get('/', function (req, res) {
	res.render('index', { title: 'Group Project' });
  }); 


  app.get('/api/login', function (req, res) {
	res.render('login');
  }); 

  app.post('/api/login', function (req, res) {
    var user_name = req.body.uName;
    var password = req.body.password;

    var connectionUrl = `mongodb+srv://${user_name}:${password}@cluster0.8w9c9.mongodb.net/sample_restaurants?retryWrites=true&w=majority`

    db.initialize2(connectionUrl)
    .then(function (result) {
       if(result){ 
        res.render("restaurantForm", { title: 'Filter Restaurants'});}
        else{
            res.render('login')
        }

    })
    .catch(function (err) {
        res.render('login')
        // Show error message if couldn't connect
        console.log(`Could not connect to Atlas server, error: '${err}'`);
    });

  }); 


  app.get('/api/update', async function(req, res){
    let Id = req.query.restaurantId;

    let updatingRestaurant = await db.Restaurant.findOne({restaurant_id: Id}).lean();

    console.log(updatingRestaurant);
    res.render('update', {
        data: updatingRestaurant,
        layout: false
    })

})

app.post('/api/update', async function(req, res){
    mydate = req.body.gradingDate;
    mygrade = req.body.grade;
    myScore = req.body.score;

    sess = req.session;

    page = sess.page
    perPage =  sess.perPage
    myborough = sess.borough

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


        res.redirect("filterRestaurants2")
    
        // var result = await db.getAllRestaurants(page, perPage, myborough);
        // try {  
        //     res.render("display", { title: 'Filtered Restaurant Results', data: result, page: page, perPage: perPage, borough: myborough });
        // }
        // catch (err) {
        //     res.status(400).json({ error: `${err}` })
        // }
})

app.get('/api/delete', async function(req, res){
    let Id = req.query.restaurantId;

  let deleting = await db.Restaurant.findOneAndDelete({restaurant_id: Id});
     

    // sess = req.session;

    // page = sess.page
    // perPage =  sess.perPage
    // myborough = sess.borough

    res.redirect("filterRestaurants2")


    // var result = await db.getAllRestaurants(page, perPage, myborough);
    //     try {  
    //         res.render("display", { title: 'Filtered Restaurant Results', data: result, page: page, perPage: perPage, borough: myborough });
    //     }
    //     catch (err) {
    //         res.status(400).json({ error: `${err}` })
    //     }

  

})

app.post('/api/search', async function (req, res) {
    let restaurantId = req.body.restaurantID;
    res.redirect("filterRestaurants2?restaurant_id="+restaurantId);
//let restaurant = await db.getRestaurantByrestaurantId()

  
})



app.get('/api/insert',  function(req, res){

    res.render('insertRestaurant', {
        
        layout: false
    })

    // sess = req.session;

    // page = sess.page
    // perPage =  sess.perPage
    // myborough = sess.borough

   


    // var result = await db.getAllRestaurants(page, perPage, myborough);
    //     try {  
    //         res.render("display", { title: 'Filtered Restaurant Results', data: result, page: page, perPage: perPage, borough: myborough });
    //     }
    //     catch (err) {
    //         res.status(400).json({ error: `${err}` })
    //     }

  

})

app.post('/api/insert', async function (req, res){

    let restaurant ={
        address: {
            building: req.body.buildingNumber,
           //coord: [req.body.longitude, req.body.latitude],
            street: req.body.streetName,
            zipcode: req.body.zipCode
        },
        borough: req.body.borough,
        cuisine: req.body.cuisine,
        grades:[  
            {date : req.body.gradingDate,
            grade : req.body.grade,
            score : req.body.score
            }]
        ,
        name: req.body.restaurantName,
        restaurant_id: req.body.restaurantId
    }

  

  let addRestaurant = await db.Restaurant.create(restaurant, function (err) {
    if (err) {
        console.log(`error occurs: '${err}'`);
    }
});


//   addNewRestaurant(restaurant, function(err, data){
//     if(err){
//       console.log(`error occurs: '${err}'`);
//     }
//     else{
//       console.log("added successfully");
//     }
// });

//  let addedRestaurant = await findByRestaurantID(restaurant.restaurant_id);
 
res.redirect("filterRestaurants2")

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
app.post('/api/filterrestaurants', async function (req, res) {
    var page = req.body.page;
    var perPage = req.body.perPage;
    var borough = req.body.borough;
   // var result = await db.getAllRestaurants(page, perPage, borough);

   console.log(page + " "+perPage+" "+borough )
    sess = req.session;

    sess.page = page;
    sess.perPage = perPage;
    sess.borough = borough;
    res.redirect("filterRestaurants2")

    // var result = await db.getAllRestaurants(page, perPage, borough);

    // try {  
    //     res.render("display", { title: 'Filtered Restaurant Results', data: result, page: page, perPage: perPage, borough: borough });
    // }
    // catch (err) {
    //     res.status(400).json({ error: `${err}` })
    // }
});


// Display handlebar form to filter restaurants
app.get("/api/filterRestaurants2", async function (req, res) {

    let resId = req.query.restaurant_id;
    
    

    sess = req.session;

    page =  sess.page
    perPage = sess.perPage
    borough =  sess.borough
    var result

    if(resId){
       //  result = await db.getRestaurantByrestaurantId(resId)
         result2 =  await db.Restaurant.findOne({restaurant_id: resId}).lean();
         result = [result2]
    }else{ 
     result = await db.getAllRestaurants(page, perPage, borough);}

    

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



//Connect to MongoDB Atlas (initialize module before server starts)
// db.initialize(connectionString)
//     .then(function () {
//         // Sets up app to listen on the port
//         app.listen(port, () => {
//             console.log(`App listening on: ${port}`);
//         });
//     })
//     .catch(function (err) {
//         // Show error message if couldn't connect
//         console.log(`Could not connect to Atlas server, error: '${err}'`);
//     });



    app.listen(port, () => {
        console.log(`App listening on: ${port}`);
    });
