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

// Load mongoose since we need it to define a model
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Create restaurant schema
RestaurantSchema = new Schema({
    address: {
        building: String,
        coord: [Number],
        street: String,
        zipcode: String
    },
    borough: String,
    cuisine: String,
    grades: [{
        date: Date,
        grade: String,
        score: Number
    }],
    name: String,
    restaurant_id: String
});

class Restaurants {

    // Create initialize method in restaurant database class
    initialize(connectionString) {

        // Have to make a promise so that in app.js we can use .then
        return new Promise((resolve, reject) => {

            // Connect to the database
            var db = mongoose.createConnection(connectionString, { useNewUrlParser: true, useUnifiedTopology: true });
            console.log("Connected to database: " + connectionString);

            // Once open, create a mongoose model on a Restaurant object using the schema
            db.once('open', () => {
                this.Restaurant = db.model('Restaurant', RestaurantSchema);
                resolve();
            });

            // Otherwise, show an error
            db.on('error', (err) => {
                reject(err);
            });

        });        
    
    }

        // Create initialize method in restaurant database class
        async  initialize2(connectionString) {

            try {    
               // connect to the atlas database
               const connectToDB = await mongoose.connect(connectionString);
               this.Restaurant = mongoose.model('Restaurant', RestaurantSchema);
               return true;
       
           } catch (err) {
               
               console.log(`Could not connect to atlas server, error: '${err}'`);
               return false;
           }

        }





    // Add a new document in restaurant collection using data passed
    async addNewRestaurant(data) {
        // Create a new restaurant object with the data inserted
        var resNew = new this.Restaurant(data);

        // Save to the database
        await resNew.save();
        
        // Show success message
        return `${resNew._id} saved successfully!`;
    }

    // Get all restaurants from database depending on user input
    getAllRestaurants(page, perPage, borough) {
        var filter;

        // If borough is input, set filter to the borough
        if (borough) {
            filter = { borough };
        }
        else {
            filter = {};
        }

        // Makes the page and perPage parameters read as numbers instead of strings
        if (page * 1 && perPage * 1) {
            // Find restaurants using the filter, sort by restaurant id in ascending, skip based on inputted page * perPage count, and limit based on perPage
            return this.Restaurant.find(filter).sort({ restaurant_id: 1 }).skip(page * perPage).limit(perPage).lean().exec();
        }
        else {
            return 'You must enter the page and perPage parameters as proper numbers to retrieve results.';
        }
    }

    // Get restaurant by its id from the database
    getRestaurantById(id) {
        // Check if it is a valid object ID that the user enters
        if (mongoose.isValidObjectId(id)) {
            var result = this.Restaurant.findOne({ _id: id }).lean().exec();
        }
        // Return result or error message
        if (result != null) {
            return result;
        }
        else {
            return 'No results found';
        }
    }


  // Get restaurant by its id from the database
  getRestaurantByrestaurantId(id) {
    // Check if it is a valid object ID that the user enters
    if (mongoose.isValidObjectId(id)) {
        var result = this.Restaurant.findOne({ restaurant_id: id }).lean().exec();
    }
    // Return result or error message
    if (result != null) {
        return result;
    }
    else {
        return 'No results found';
    }
}

    // Updates a restaurant by using its id
    async updateRestaurantById(data, id) {
        // $set replaces each field with the data
        if (mongoose.isValidObjectId(id)) {
            var result = this.Restaurant.updateOne({ _id: id }, { $set: data }).lean().exec();
        }
        if (result != null) {
            return `Successful in updating restaurant ${id}!`;
        }
        else {
            return 'No results found';
        }
    }

    // Deletes a restaurant by using its id
    async deleteRestaurantById(id) {
        // Checks if the id is a valid object id then deletes it from the database
        if (mongoose.isValidObjectId(id)) {
            var result = this.Restaurant.deleteOne({ _id: id }).lean().exec();
        }

        if (result != null) {
            return `Successful in deleting restaurant ${id}!`;
        }
        else {
            return 'No results found';
        }
    }
}

// Export the class
module.exports = Restaurants;
