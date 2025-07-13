const express = require('express');
const Payment = require('../../models/PaymentSchema'); // Adjust the path as necessary
const router = express.Router();


router.post('/record-payment', async (req, res) => {
  try {
    const { transactionId, amount, upiId } = req.body;

    // Just save the payment, no checks
    const newPayment = new Payment({
      transactionId,
      amount,
      upiId,
      status: 'completed',
      timestamp: new Date()
    });

    await newPayment.save();

    return res.json({
      success: true,
      message: 'Payment recorded successfully'
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});



module.exports = router;