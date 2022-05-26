const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;


//midleware
app.use(cors());
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

        // get method to find all product
        app.get('/product', async(req, res)=>{
            const products = await productCollection.find().toArray();
            res.send(products);
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
        app.get('/order/:email', async (req, res) => {
          const mail = req.params.email;
          const query = ({ email : mail });
          const product = await orderCollection.findOne(query);
          res.send(product);
        });

        app.post('/review', async (req, res) => {
          const reviews = req.body;
          const result = await reviewCollection.insertOne(reviews);
          res.send(result);
        })

        app.get('/review', async(req, res)=>{
          const reviews = await reviewCollection.find().toArray();
          res.send(reviews);
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