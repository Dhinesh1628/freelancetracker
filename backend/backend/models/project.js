const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    clientName: { type: String, required: true, trim: true },
    projectTitle: { type: String, required: true, trim: true },
    budget: { type: Number, required: true },
    deadline: { type: Date, required: true },
    isCompleted: { type: Boolean, default: false },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
