const express = require('express');
const app = express();
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

// Middleware Connections
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 5000;



// Mongo DB Connections
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.iybyxmu.mongodb.net/`;
const client = new MongoClient(uri);

// Routes
async function run() {
     try {
          const appointmentOptionCollection = client.db('dentist_portal').collection('appointmentOptions');

          app.get("/appointmentOptions", async (req, res) => {
               const query = {};
               const options = await appointmentOptionCollection.find(query).toArray();
               res.send(options);
          });

     } finally {

     }
}

run().catch(console.log)

app.get('/', (req, res) => {
     res.send('hello from dentist server :)');
});

// Connection

app.listen(PORT, () => {
     console.log('App running in port: ' + PORT);
});
