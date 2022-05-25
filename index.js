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

async function run(){
    try{
        await client.connect();

        const productCollection = client.db('agro_machineries').collection('product');
        const orderCollection = client.db('agro_machineries').collection('order');

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

        app.get('/order/:email', async (req, res) => {
          const mail = req.params.email;
          const query = ({ email : mail });
          const product = await orderCollection.findOne(query);
          res.send(product);
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