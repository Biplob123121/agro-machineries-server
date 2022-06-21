const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const port = process.env.PORT || 5000;


//midleware
// const corsConfig = {
//   origin : true,
//   credentials : true
// }
app.use(cors());
//app.options('*', cors(corsConfig));
app.use(express.json());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rv1lb.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function VerifyJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: 'Unauthorized access' });
  }

  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: 'Forbidden access' });
    }
    req.decoded = decoded;
    next();
  })

};

async function run(){
    try{
        await client.connect();

        const productCollection = client.db('agro_machineries').collection('product');
        const orderCollection = client.db('agro_machineries').collection('order');
        const reviewCollection = client.db('agro_machineries').collection('review');
        const userCollection = client.db('agro_machineries').collection('user');
        const paymentCollection = client.db('agro_machineries').collection('payment');


        app.post('/create-payment-intent', VerifyJwt, async(req, res) =>{
          const service = req.body;
          const price = service.price;
          const amount = price*100;
          const paymentIntent = await stripe.paymentIntents.create({
            amount : amount,
            currency: 'BDT',
            payment_method_types:['card']
          });
          res.send({clientSecret: paymentIntent.client_secret})
        });

        // get method to find all product
        app.get('/product', async(req, res)=>{
            const products = await productCollection.find().toArray();
            res.send(products);
        });

        app.post('/product', async (req, res) => {
          const newProduct = req.body;
          const result = await productCollection.insertOne(newProduct);
          res.send(result);
        });

        // get method to find specific product
        app.get('/product/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const product = await productCollection.findOne(query);
          res.send(product);
        });

        // post method for the order
        app.post('/order', async (req, res) => {
          const orderProduct = req.body;
          const result = await orderCollection.insertOne(orderProduct);
          res.send(result);
        })

        // get method for the order
        app.get('/dashboard/order/:email', async (req, res) => {
          const mail = req.params.email;
          const query = ({ email : mail });
          const product = await orderCollection.find(query).toArray();
          res.send(product);
        });

        app.get('/order/:id', async (req, res) => {
          const id = req.params.id;
          const query = { _id: ObjectId(id) };
          const result = await orderCollection.findOne(query);
          res.send(result);
        });

        // patch method for updating order
        app.patch('/order/:id', VerifyJwt, async(req, res) =>{
          const id  = req.params.id;
          const payment = req.body;
          const filter = {_id: ObjectId(id)};
          const updatedDoc = {
            $set: {
              paid: true,
              transactionId: payment.transactionId
            }
          }
    
          const result = await paymentCollection.insertOne(payment);
          const updatedOrder = await orderCollection.updateOne(filter, updatedDoc);
          res.send(updatedOrder);
        })

        //for the review
        app.post('/review', async (req, res) => {
          const reviews = req.body;
          const result = await reviewCollection.insertOne(reviews);
          res.send(result);
        });

        app.get('/review', async(req, res)=>{
          const reviews = await reviewCollection.find().toArray();
          res.send(reviews.reverse());
      });

     
     
      //api for user

      app.get('/user', VerifyJwt, async (req, res) => {
        const users = await userCollection.find().toArray();
        res.send(users);
      });
  
      app.get('/admin/:email', async(req, res) =>{
        const email = req.params.email;
        const user = await userCollection.findOne({email : email});
        const isAdmin = user.role === 'admin';
        res.send({admin : isAdmin});
      });

      app.put('/user/admin/:email', VerifyJwt, async (req, res) => {
        const email = req.params.email;
        const requester = req.decoded.email;
        const requesterAccount = await userCollection.findOne({ email: requester });
        if (requesterAccount.role === 'admin') {
          const filter = { email: email };
          const updateDoc = {
            $set: { role: 'admin' },
          };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.send(result);
        }
        else {
          res.status(403).send({message : 'forbidden access'});
        }
  
      });

      // for the user update

      app.put('/user/:email', async (req, res) => {
        const email = req.params.email;
        const user = req.body;
        const filter = { email: email };
        const options = { upsert: true };
        const updateDoc = {
          $set: user
        };
        const result = await userCollection.updateOne(filter, updateDoc, options);
        const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
        res.send({ result, token });
      });
        

    }
    finally{

    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
  res.send('Hello From Agro Machineries!')
});

app.listen(port, () => {
  console.log(`Agro Machineries app listening on port ${port}`)
});