import mongoose from 'mongoose';

const globalSearchSchema = new mongoose.Schema({
  term: { type: String, required: true },
  searchedAt: { type: Date, default: Date.now },
  count: { type: Number, default: 1 }
});

globalSearchSchema.index({ term: 1 });

export default mongoose.model('GlobalSearchHistory', globalSearchSchema);
