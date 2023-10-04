const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const PORT = process.env.PORT || 5000;

// Middleware Connections
app.use(cors())
app.use(express.json())

// token verify
const verifyJWT = (req, res, next) => {
     const authorization = req.headers.authorization;
     if (!authorization) {
          return res.status(401).send({ error: true, message: 'unauthorized access' })
     }

     //bearer token
     const token = authorization.split(' ')[1];

     jwt.verify(token, process.env.ACCES_TOKEN_SECRET, (error, decoded) => {
          if (error) {
               return res.status(401).send({ error: true, message: 'Invalid token' })
          }
          req.decoded = decoded;
          next();
     })
}




// Mongo DB Connections
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.iybyxmu.mongodb.net/`;
const client = new MongoClient(uri);

// Routes
async function run() {
     try {
          const userCollection = client.db('dentist_portal').collection('users');
          const appointmentOptionCollection = client.db('dentist_portal').collection('appointmentOptions');
          const bookingsCollection = client.db('dentist_portal').collection('bookings');

          //middleware 
          const verifyAdmin = async (req, res, next) => {
               const email = req.decoded.email;
               const query = { email: email };
               const user = await userCollection.findOne(query);
               if (user?.role !== 'admin') {
                    return res.status(403).send({ error: true, message: "Forbidden access" })
               }
               next();
          }

          // jwt related
          app.post("/jwt", (req, res) => {
               const email = req.body;
               // create token
               const token = jwt.sign(email, process.env.ACCES_TOKEN_SECRET, { expiresIn: '1000000h' });
               res.send(token);
          })

          //user related apis
          app.get("/users", verifyJWT, verifyAdmin, async (req, res) => {
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

          app.get("/users/admin/:email", verifyJWT, async (req, res) => {
               const email = req.params;
               // CHECKING ADMIN
               if (req.decoded.email !== email) {
                    return res.send({ admin: false });
               }

               const query = { email: email };
               const user = await userCollection.findOne(query);
               const result = { admin: user?.role === 'admin' };
               res.send(result);
          })

          app.patch(("/users/admin/:id"), async (req, res) => {
               const id = req.params.id;
               const filter = { _id: new ObjectId(id) };
               const updateDoc = {
                    $set: {
                         role: "admin"
                    },
               };
               const result = await userCollection.updateOne(filter, updateDoc);
               res.send(result);
          })

          app.delete("/user/:id", async (req, res) => {
               const id = req.params.id;
               const filter = { _id: new ObjectId(id) };
               const result = await userCollection.deleteOne(filter);
               res.send({
                    result,
                    message: "succesfully delete"
               })
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
          app.get("/bookings", verifyJWT, async (req, res) => {
               const email = req.query.email;
               const date = req.query.date;

               //checking token
               const decodedEmail = req.decoded.email;
               if (email !== decodedEmail) {
                    return res.status(403).send({ error: true, message: 'forbidden access' })
               }

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
