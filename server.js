'use strict';
const PORT = 3000;
require('dotenv').config();
const express = require('express'); // express framwork
const cors = require('cors'); //api call out of domain
const pg = require('pg');
const superagent = require('superagent');
const app = express();

const client = new pg.Client(process.env.DATABASE_URL);
console.log(process.env.DATABASE_URL);
// client.on('error', err => console.log("PG PROBLEM!!!"));
app.use(cors());


client.connect().then(() => {
    console.log('Runnnnnnnnnn');
    app.listen(process.env.PORT || PORT, () => {
        console.log('Server Start at ' + PORT + ' .... ');
    })
});

// constrctur function handle city location
let localCity = [];
function City(city, geoData) {
    this.search_query = city;
    this.formatted_query = geoData.display_name;
    this.latitude = geoData.lat;
    this.longitude = geoData.lon;
    localCity.push(this);
}


app.get('/', (req, res) => {
    let name = req.query.name;
    let SQL = 'SELECT * FROM location WHERE name=$1';
    client.query(SQL, [name] ).then(result => {
        res.send(result.rows);
    });
});





app.get('/location', handleLocation);
const myLocalLocations = {};

function handleLocation(req, response) {
    let city = req.query.city;
    console.log(city)
    let key = process.env.GEOCODE_API_KEY;
    let SQL = 'SELECT * FROM location where name = $1';
    
    client.query(SQL, [city]).then(result => {
       console.log("result >>> ", result);
        if (result.rowCount > 0) {
            response.send(result.rows[0]);
        } else {
            const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
            superagent.get(url).then(res => {
                const locationData = res.body[0];
                const location = new City(city, locationData);
                myLocalLocations.lat = locationData.lat;
                myLocalLocations.lon = locationData.lon;
                let SQL = 'INSERT INTO location (name, display_name,latitude,longitude) VALUES($1, $2,$3,$4) RETURNING *';
                let values = [city, locationData.display_name, locationData.lat, locationData.lon];
                client.query(SQL, values).then(result => {
                    response.send(location);
                });
               
            }).catch((err) => {
                console.log('ERROR !! ', err);
            });
        }

    });

    // if (checkDb(city) !== []) {
    //     console.log('FOUND')
    // } else {
    // const url = `https://us1.locationiq.com/v1/search.php?key=${key}&q=${city}&format=json`;
    // superagent.get(url).then(res => {
    //     const locationData = res.body[0];
    //     const location = new City(city, locationData);
    //     myLocalLocations.lat = locationData.lat;
    //     myLocalLocations.lon = locationData.lon;
    //     let SQL = 'INSERT INTO location (name, display_name,latitude,longitude) VALUES($1, $2,$3,$4) RETURNING *';
    //     let values = [city, locationData.display_name, locationData.lat, locationData.lon];
    //     client.query(SQL, values).then(result => {
    //         console.log('INSERT DONE');
    //     })
    //     response.send(location);
    // }).catch((err) => {
    //     console.log('ERROR !! ', err);
    // });
    // }
}

// function checkDb(locationName) {
//     let SQL = `SELECT * FROM location WHERE name='${locationName}'`;
//     client.query(SQL).then(result => {
//         return result.rows;
//     });
// }

// app.post('/location', (req, res) => {
//     let SQL = 'INSERT INTO location (name, display_name,latitude,longitude) VALUES($1, $2,$3,$4) RETURNING *';
//     let values = [city, locationData.display_name, locationData.lat, locationData.lon];
//     client.query(SQL, values).then(result => {
//         console.log(result.rows);
//         response.send(result.rows);
//     });
// })
/* constractor function that handel the weather in the same location */

function Weather(item) {
    this.time = item.datetime,
        this.forecast = item.weather.description
}
app.get('/weather', handleWeather);

function handleWeather(request, response) {
    let lat = myLocalLocations.lat;
    let lon = myLocalLocations.lon;
    let key = process.env.WEATHER_API_KEY;
    const url = `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${key}`;
    superagent.get(url).then(res => {
        let currentWeather = [];
        res.body.data.map(item => {
            currentWeather.push(new Weather(item));
            return currentWeather;
        })
        response.send(currentWeather);
    }).catch(err => {
        response.status(404).send('requested API is Not Found!');
    })
}

function Park(park) {
    this.name = park.fullName,
    this.park_url = park.url,
    // this.location=park[0].addresses,
    this.fee = '0',
    this.description = park.description
}
app.get('/parks', handelPark);

function handelPark(request, response) {
    let key = process.env.PARKS_API_KEY;
    let city = request.query.city;
    const url = `https://developer.nps.gov/api/v1/parks?q=${city}&limit=10&api_key=${key}`;
    superagent.get(url)
        .then(res => {
            let parks = [];
            res.body.data.map(item => {
                parks.push(new Park(item))
                return parks;
            })
            response.send(parks)
        })
        .catch(err => {
            response.status(404).send('ERROR !!', err);
        })
}


app.use('*', (req, res) => {
    let status = 404;
    res.status().send({ status: status, message: 'Page Not Found' });
})

app.use(errorHandler);


function errorHandler(err, request, response, next) {
    response.status(500).send('something is wrong in server');
}
