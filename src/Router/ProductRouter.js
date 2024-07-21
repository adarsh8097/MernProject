const express = require('express');
const { AddItem,transactions,Statistics,barChart,categoryChart,allCombinedData } = require('../Controller/ProductInsertItem');

const router = express.Router();

// Get all Data;
router.get('/initialize',AddItem);

router.get('/transactions',transactions);

router.get('/statistics', Statistics);

router.get('/barchart',barChart);

router.get('/piechart',categoryChart);

router.get('/allcombineddata',allCombinedData);


module.exports = router;