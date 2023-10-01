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
          const bookingsCollection = client.db('dentist_portal').collection('bookings');

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
                    appointmentDate: date
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
