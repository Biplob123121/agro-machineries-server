const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion } = require('mongodb');
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

        app.get('/product', async(req, res)=>{
            const products = await productCollection.find().toArray();
            res.send(products);
        })

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