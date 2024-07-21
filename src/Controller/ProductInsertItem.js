const mongoose = require('mongoose');
const axios = require('axios');
const { response } = require('express');
const productschemaTransction = require('../models/ProductSchema');

const AddItem = async(req,res)=>{
    try{
       const response =  await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');
        const product = response.data;
   
        await productschemaTransction.deleteMany({});
        const result = await productschemaTransction.insertMany(product);
   
   //console.log("Database initialized with seed data.");
   res.status(200).json({message:"Database initialized with seed data.",product,result});

    }catch(error){
         console.log("Data not add in database",error);
        res.status(500).json({message:"Error initializing database."});
    }
};

// Endpoint to list all transactions with search and pagination
const transactions = async (req, res) => {
    const { month, search = "", page = 1, perPage = 10 } = req.query;
    
    // Validate month input
    if (
      month &&
      !/^(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(
        month
      )
    ) {
      return res.status(400).send("Invalid month provided.");
    }
  
    // Build query
    let query = {};
    if (month) {
      const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth() + 1; // Convert month name to month index
      query.dateOfSale = {
        $gte: new Date(
          `2022-${monthIndex.toString().padStart(2, "0")}-01T00:00:00.000Z`
        ),
        $lt: new Date(
          `2022-${(monthIndex + 1).toString().padStart(2, "0")}-01T00:00:00.000Z`
        ),
      };
    }
  
    // Search query
    if (search) {
      const regex = new RegExp(search, "i"); // Case-insensitive search
      query.$or = [{ title: regex }, { description: regex }, { price: regex }];
    }
  
    // Pagination
    const pageNumber = parseInt(page, 10) || 1;
    const itemsPerPage = parseInt(perPage, 10) || 10;
  
    try {
      const totalItems = await productschemaTransction.countDocuments(query);
      const products = await productschemaTransction.find(query)
        .skip((pageNumber - 1) * itemsPerPage)
        .limit(itemsPerPage);
  
      res.json({
        totalItems,
        totalPages: Math.ceil(totalItems / itemsPerPage),
        currentPage: pageNumber,
        perPage: itemsPerPage,
        products,
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).send("Error fetching transactions.");
    }

  };

 const Statistics = async(req,res)=>{
    const { month } = req.query;

    try {
      if (month) {
        // Single month statistics
        if (
          !/^(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(
            month
          )
        ) {
          return res.status(400).send("Invalid month provided.");
        }
        console.log("month",month);
        const monthIndex =
          new Date(Date.parse(month + " 1, 2022")).getMonth() + 1; // Convert month name to month index
          console.log("monthIndex",monthIndex);
          const startDate = new Date(
          `2022-${monthIndex.toString().padStart(2, "0")}-01T00:00:00.000Z`
        );
        console.log("StartDate",startDate);
        const endDate = new Date(
          `2022-${(monthIndex + 1).toString().padStart(2, "0")}-01T00:00:00.000Z`
        );
        console.log("EndDate",endDate);
        // Calculate total sale amount
        const totalSaleAmount = await productschemaTransction.aggregate([
          {
            $match: { dateOfSale: { $gte: startDate, $lt: endDate }, sold: true },
          },
          { $group: { _id: null, totalAmount: { $sum: "$price" } } },
        ]);
        console.log("totalAmount",totalSaleAmount);
        // Calculate total number of sold items
        const totalSoldItems = await productschemaTransction.countDocuments({
          dateOfSale: { $gte: startDate, $lt: endDate },
          sold: true,
        });
  
        // Calculate total number of not sold items
        const totalNotSoldItems = await productschemaTransction.countDocuments({
          dateOfSale: { $gte: startDate, $lt: endDate },
          sold: false,
        });
  
        res.json({
          totalSaleAmount: totalSaleAmount.length
            ? totalSaleAmount[0].totalAmount
            : 0,
          totalSoldItems,
          totalNotSoldItems,
        });
      } else {
        // All months statistics
        const stats = await productschemaTransction.aggregate([
          {
            $group: {
              _id: {
                year: { $year: "$dateOfSale" },
                month: { $month: "$dateOfSale" },
              },
              totalSaleAmount: {
                $sum: { $cond: [{ $eq: ["$sold", true] }, "$price", 0] },
              },
              totalSoldItems: {
                $sum: { $cond: [{ $eq: ["$sold", true] }, 1, 0] },
              },
              totalNotSoldItems: {
                $sum: { $cond: [{ $eq: ["$sold", false] }, 1, 0] },
              },
            },
          },
          {
            $sort: { "_id.year": 1, "_id.month": 1 },
          },
        ]);
  
        res.json(stats);
      }
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).send("Error fetching statistics.");
    }
  };

  let barChart = async(req, res) => {
    const { month } = req.query;
  
    try {
      if (month) {
        // Validate month input
        if (
          !/^(January|February|March|April|May|June|July|August|September|October|November|December)$/i.test(
            month
          )
        ) {
          return res.status(400).send("Invalid month provided.");
        }
  
        const monthIndex =
          new Date(Date.parse(month + " 1, 2022")).getMonth() + 1; // Convert month name to month index
        const startDate = new Date(
          `2022-${monthIndex.toString().padStart(2, "0")}-01T00:00:00.000Z`
        );
        const endDate = new Date(
          `2022-${(monthIndex + 1).toString().padStart(2, "0")}-01T00:00:00.000Z`
        );
  
        // Calculate item counts for price ranges
        const priceRanges = [
          { range: "0-100", min: 0, max: 100 },
          { range: "101-200", min: 101, max: 200 },
          { range: "201-300", min: 201, max: 300 },
          { range: "301-400", min: 301, max: 400 },
          { range: "401-500", min: 401, max: 500 },
          { range: "501-600", min: 501, max: 600 },
          { range: "601-700", min: 601, max: 700 },
          { range: "701-800", min: 701, max: 800 },
          { range: "801-900", min: 801, max: 900 },
          { range: "901-above", min: 901, max: Infinity },
        ];
  
        const result = await Promise.all(
          priceRanges.map(async (range) => {
            const count = await productschemaTransction.countDocuments({
              dateOfSale: { $gte: startDate, $lt: endDate },
              price: { $gte: range.min, $lte: range.max },
            });
            return { range: range.range, count };
          })
        );
  
        res.json(result);
      } else {
        // If no month is provided, return an error message
        res.status(400).send("Month parameter is required.");
      }
    } catch (error) {
      console.error("Error fetching bar chart data:", error);
      res.status(500).send("Error fetching bar chart data.");
    }
  };

  let categoryChart = async(req, res) => {
    try {
      const { month } = req.query;
      if (!month) {
        return res.status(400).send("Month query parameter is required");
      }
  
      const monthIndex = new Date(Date.parse(month + " 1, 2022")).getMonth();
  
      // Define the start and end dates for the given month
      const startDate = new Date(Date.UTC(2022, monthIndex, 1));
      const endDate = new Date(Date.UTC(2022, monthIndex + 1, 1));
  
      // Aggregate the data
      const result = await productschemaTransction.aggregate([
        {
          $match: {
            dateOfSale: {
              $gte: startDate,
              $lt: endDate
            }
          }
        },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            category: "$_id",
            count: 1
          }
        }
      ]);
  
      console.log("Category Stats:", result);
      res.json(result);
    } catch (error) {
      console.error("Error fetching category stats:", error);
      res.status(500).send("Internal Server Error");
    }
  };

 let allCombinedData = async(req, res) => {
  const API1_URL = 'http://localhost:5000/api/product/statistics';
const API2_URL = 'http://localhost:5000/api/product/barchart';
const API3_URL = 'http://localhost:5000/api/product/piechart';
    try {
      const { month } = req.query; // Extract month from query parameters
  
      if (!month) {
        return res.status(400).send("Month query parameter is required");
      }
      // Fetch data from all three APIs concurrently
      const [api1Response, api2Response, api3Response] = await Promise.all([
        axios.get(API1_URL, { params: { month: req.query.month } }),
        axios.get(API2_URL, { params: { month: req.query.month } }),
        axios.get(API3_URL, { params: { month: req.query.month } }) // Assuming the third API does not require parameters
      ]);
  
      // Combine the responses
      const combinedResponse = {
        api1Data: api1Response.data,
        api2Data: api2Response.data,
        api3Data: api3Response.data
      };
  
      // Send the combined response
      res.json(combinedResponse);
    } catch (error) {
      console.error("Error fetching combined data:", error);
      res.status(500).send("Internal Server Error");
    }
  };
  
  module.exports  = {AddItem,transactions, Statistics ,barChart,categoryChart,allCombinedData};

