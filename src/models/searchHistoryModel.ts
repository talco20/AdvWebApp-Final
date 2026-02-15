import mongoose, { Schema } from 'mongoose';
import { ISearchHistory } from '../types';

const searchHistorySchema = new Schema<ISearchHistory>(
  {
    userId: {
      type: String,
      required: true,
      ref: 'User',
      index: true,
    },
    query: {
      type: String,
      required: true,
    },
    results: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
searchHistorySchema.index({ userId: 1, createdAt: -1 });

const SearchHistory = mongoose.model<ISearchHistory>('SearchHistory', searchHistorySchema);

export default SearchHistory;


