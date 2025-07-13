const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  transactionId: { 
    type: String, 
    required: true
  },
  upiId: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed'], 
    default: 'pending' 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Payment', PaymentSchema);