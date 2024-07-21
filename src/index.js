const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const dbConnect = require('./Config/DatabaseConnect');
// const AddItem = require('./Controller/ProductInsertItem');
const ProductRoutes = require('./Router/ProductRouter');
const cors = require('cors');
dotenv.config();
const app = express();
const PORT = 5000;

// Using middleware;
app.use(express.json());
app.use(cors())
app.use((req,res,next)=>{
    // console.log(req.path, req.method);
    next();
});


dbConnect();
app.get('/',async(req,res)=>{
    console.log("successfully ogin")
})
app.use('/api/product',ProductRoutes);

// AddItem();



app.listen(5000,()=>{
    console.log(`Server Runing localhost PORT: ${PORT}`);
})
