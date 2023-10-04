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
          const userCollection = client.db('dentist_portal').collection('users');
          const appointmentOptionCollection = client.db('dentist_portal').collection('appointmentOptions');
          const bookingsCollection = client.db('dentist_portal').collection('bookings');

          //user related apis
          app.get("/users", async (req, res) => {
               const users = await userCollection.find().toArray();
               res.send(users);
          })

          app.post("/users", async (req, res) => {
               const user = req.body;
               const query = { email: user.email };
               const existUser = await userCollection.findOne(query);
               if (existUser) {
                    return res.send({
                         message: "user alreafy exist"
                    });
               }
               // new user
               const result = await userCollection.insertOne(user);
               return res.send(result);
          })

          // appointment related apis
          app.get("/appointmentOptions", async (req, res) => {
               const date = req.query.date;
               const query = {};
               // getting all services
               const services = await appointmentOptionCollection.find(query).toArray();

               // getting all booking base on date 
               const bookingQuery = { appointmentDate: date };
               const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();
               // console.log(alreadyBooked);
               services.forEach(service => {
                    const optionBooked = alreadyBooked.filter(booked => booked.treatment === service.name);
                    const bookedslot = optionBooked.map(booked => booked.slot);
                    const remainingSlots = service.slots.filter(slot => !bookedslot.includes(slot));
                    service.slots = remainingSlots;
               })

               res.send(services);
          });

          // booking api base on patient
          app.get("/bookings", async (req, res) => {
               const email = req.query.email;
               const date = req.query.date;
               const query = {
                    appointmentDate: date,
                    email: email
               }
               const bookings = await bookingsCollection.find(query).toArray();
               res.send(bookings);
          })

          //insert patient booking
          app.post("/bookings", async (req, res) => {
               const booking = req.body;
               // console.log(booking);
               const query = {
                    appointmentDate: booking.appointmentDate,
                    treatment: booking.treatment,
                    email: booking.email,
                    slot: booking.slot
               }
               // checking booked or not
               const alreadyBooked = await bookingsCollection.find(query).toArray();
               // console.log(alreadyBooked);
               if (alreadyBooked.length) {
                    const message = `You already have a booking on ${booking.appointmentDate} `;
                    return res.send({ acknowledged: false, message })
               }

               // inserting bookings
               const booked = await bookingsCollection.insertOne(booking);
               return res.send(booked);
          })

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
