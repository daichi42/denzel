const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const {PORT} = require('./constants');
const db = require('./db');
const app = express();

module.exports = app;

app.use(require('body-parser').json());
app.use(cors());
app.use(helmet());

app.options('*', cors());
const dbName = "data";
const dbCollectionName = "movies";
db.initialize(dbName,dbCollectionName,function(dbCollection)
{
  app.get('/movies/populate/', (request, response) => {
    dbCollection.find().toArray((error, result) => {
            if (error) throw error;
            response.json(result);
        });
  });
  app.get('/movies', (request, response) => {
        // return random must-watch movie
        var query = {"metascore":{$gte:70}};

        dbCollection.aggregate([
            { $match: query },
            { $sample: {size: 1}}
        ]).toArray((error, result) => {
            if (error) throw error;
            response.json(result);
        });
    });

    app.get('/movies/search', (request, response) => {
        //get the id from params & return the movie corresponding
        let limit = parseInt(request.query.limit, 10);
        let metascore = parseInt(request.query.metascore, 10);
        limit = limit?limit:5;
        metascore = metascore?metascore:0;

        var query = {"metascore":{$gte:metascore}};
        dbCollection.find(query).sort({metascore: -1}).limit(limit).toArray((error, result) => {
            if (error) throw error;
            response.json(result);
        });
    });

    app.put('/movies/:id', (request, response) => {
        const itemId = request.params.id;
        const item = request.body;
        console.log("Editing item: ", itemId, " to be ", item);

        dbCollection.updateOne({id: itemId}, {$set: item}, (error, result) => {
            if (error) throw error;
            dbCollection.find().toArray(function(_error, _result) {
                if(_error) throw _error;
                response.json(_result);
            });
        });
    });
    app.get('/movies/:id', (request, response) => {
        //get the id from params & return the movie corresponding
        const itemId = request.params.id;
        dbCollection.findOne({id: itemId}, (error, result) => {
            if (error) throw error;
            response.json(result);
        });
    });
});

app.listen(PORT);
console.log(`📡 Running on port ${PORT}`);
