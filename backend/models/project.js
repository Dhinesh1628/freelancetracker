const mongoose = require('mongoose');
 
const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'member', 'viewer'], default: 'viewer' },
}, { _id: false });
 
const projectSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  projectTitle: { type: String, required: true },
  budget: { type: Number, default: 0 },
  deadline: { type: Date },
  isCompleted: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // creator
  members: { type: [memberSchema], default: [] }, // includes creator as admin
}, { timestamps: true });
 
module.exports = mongoose.model('Project', projectSchema);