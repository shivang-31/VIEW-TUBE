import Video from '../models/videos.js';
import User from '../models/User.js';
import GlobalSearchHistory from '../models/SearchHistory.js';

export const search = async (req, res) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;

    // Validation
    if (!query?.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // 1. Update user search history
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user's search history (no duplicates, limit to 20)
    const updatedHistory = [
      { term: query, searchedAt: new Date() },
      ...(user.searchHistory?.filter(item => item.term !== query) || [])
    ].slice(0, 20);
    user.searchHistory = updatedHistory;
    await user.save();

    // 2. Update global search trends
    await GlobalSearchHistory.findOneAndUpdate(
      { term: query.toLowerCase() }, // Case-insensitive tracking
      {
        $inc: { count: 1 },
        $setOnInsert: { firstSearchedAt: new Date() },
        $set: { lastSearchedAt: new Date() }
      },
      { upsert: true }
    );

    // 3. Perform search with pagination
    const skip = (page - 1) * limit;

    // Get total count first
    const totalResults = await Video.countDocuments({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { $text: { $search: query } }
      ]
    });

    // Then get paginated results
    const videos = await Video.find({
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { $text: { $search: query } }
      ],
      visibility: 'public'
    })
    .select('title thumbnail views duration uploader')
    .populate('uploader', 'username avatar') // Include uploader info
    .sort({ score: { $meta: "textScore" }, createdAt: -1 }) // Sort by relevance
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
  }
};