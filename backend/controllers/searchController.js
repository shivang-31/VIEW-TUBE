import mongoose from 'mongoose';
import Video from '../models/videos.js';
import User from '../models/User.js';
import GlobalSearchHistory from '../models/SearchHistory.js';

export const search = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const { query, page = 1, limit = 10 } = req.query;

    if (!query?.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    await session.withTransaction(async () => {
      // 1. Update user search history
      const user = await User.findById(req.user.id).session(session);
      if (!user) {
        throw new Error("User not found");
      }

      const updatedHistory = [
        { term: query, searchedAt: new Date() },
        ...(user.searchHistory?.filter(item => item.term !== query) || [])
      ].slice(0, 20);

      user.searchHistory = updatedHistory;
      await user.save({ session });

      // 2. Update global search history
      await GlobalSearchHistory.findOneAndUpdate(
        { term: query.toLowerCase() },
        {
          $inc: { count: 1 },
          $setOnInsert: { firstSearchedAt: new Date() },
          $set: { lastSearchedAt: new Date() }
        },
        { upsert: true, session }
      );
    });

    // 3. Search videos (outside transaction for performance)
    const skip = (page - 1) * limit;

    const totalResults = await Video.countDocuments({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { $text: { $search: query } }
      ]
    });

    const videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { $text: { $search: query } }
      ],
      visibility: 'public'
    })
    .select('title thumbnail views duration uploader')
    .populate('uploader', 'username avatar')
    .sort({ score: { $meta: "textScore" }, createdAt: -1 })
    .skip(skip)
    .limit(limit);

    res.status(200).json({
      results: videos,
      pagination: {
        currentPage: +page,
        resultsPerPage: +limit,
        totalResults,
        totalPages: Math.ceil(totalResults / limit)
      },
      searchTerm: query
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
      suggestion: "Try a different search term or try again later"
    });
  } finally {
    await session.endSession();
  }
};

export const getSearchSuggestions = async (req, res) => {
  try {
    const { q = '' } = req.query;

    if (!q.trim()) {
      return res.json({ suggestions: [] });
    }

    // Find matching terms that start with the input
    const suggestions = await GlobalSearchHistory.find({
      term: { $regex: '^' + q, $options: 'i' }
    })
      .sort({ count: -1 })        // Most searched terms first
      .limit(10)                  // Limit to 10 suggestions
      .select('term -_id');       // Only return the term

    res.json({
      suggestions: suggestions.map(s => s.term)
    });

  } catch (error) {
    console.error('Suggestion fetch error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

