
const express = require('express')
var Twitter = require('twitter');
const cors = require('cors')
const moment = require('moment')
var bodyParser = require('body-parser')
require('dotenv').config()

const today = moment().format('YYYY-MM-DD')

const app = express()
const port = 3002

app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.use(cors())

var env = process.env;
var client = new Twitter({
    consumer_key: env.consumer_key,
    consumer_secret: env.consumer_secret,
    access_token_key: env.access_token_key,
    access_token_secret: env.access_token_secret
});

const getReuqest = ({ name, date, favorite_count }) => {
    const count = 100;
    date = date || today
    favorite_count = favorite_count || 2000
    var params = {
        screen_name: name,
        count: count,
        result_type: 'popular',
        since: date,
        until: date
    };

    return new Promise((resolve, reject) => {
        client.get('statuses/user_timeline', params, function (error, tweets, response) {
            if (error) {
                resolve(error)
            }
            else {
                tweets = tweets.filter(t => t.favorite_count >= favorite_count)
                resolve({ [name]: tweets })
            }
        });
    })


}
app.put('/', async (req, res) => {
    try {
        var users = req.body.users;
        var date = req.body.date;
        var favorite_count = req.body.favorite_count

        if (!users || !users.length) {
            return res.status(300).json({ message: "something went wrong", error: "users is required", status: 400 })
        }

        if (date && moment(date).diff(moment(today)) > 0) {
            return res.status(300).json({ message: "something went wrong", error: "date cant be greater than today", status: 400 })

        }
        if (favorite_count && favorite_count > 100) {
            return res.status(300).json({ message: "something went wrong", error: "favorite_count cant be greater 100", status: 400 })

        }

        console.log("users", req.body)
        const promiseArray = []
        for (let user of users) {
            promiseArray.push(getReuqest({ name: user, date, favorite_count }))
        }
        const result = await Promise.all(promiseArray)
        res.status(200).json({ result, message: "tweets found successfull", status: 200 })
    } catch (err) {
        console.log(err)
        res.status(400).json({ message: "something went wrong", error: err.message(), status: 400 })
    }



})
app.listen(port, () => console.log(`Server listening on port ${port}!`));

