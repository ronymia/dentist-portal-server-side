const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// Mongo DB Connections
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.twtll.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
     useNewUrlParser: true,
     useUnifiedTopology: true,
     serverApi: ServerApiVersion.v1
});


// Middleware Connections
app.use(cors())
app.use(express.json())


// Routes


// Connection
const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
     console.log('App running in port: ' + PORT)
})
