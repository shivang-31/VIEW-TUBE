import Playlist from '../models/PlayList.js';
import Video from '../models/videos.js';

// 1️⃣ Create Playlist
export const createPlaylist = async (req, res) => {
  try {
    const { title, description, visibility } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const playlist = new Playlist({
      user: req.user._id,
      title,
      description,
      visibility
    });

    await playlist.save();
    res.status(201).json({ message: "Playlist created", playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2️⃣ Get User's Playlists
export const getUserPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user._id }).populate('videos').sort({ createdAt: -1 });
    res.json({ playlists });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3️⃣ Add Video to Playlist
export const addVideoToPlaylist = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;

    if (!playlistId || !videoId) return res.status(400).json({ error: "playlistId and videoId are required" });

    const playlist = await Playlist.findOne({ _id: playlistId, user: req.user._id });
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });

    // Avoid duplicates
    if (playlist.videos.includes(videoId)) {
      return res.status(400).json({ error: "Video already in playlist" });
    }

    playlist.videos.push(videoId);
    await playlist.save();

    res.json({ message: "Video added to playlist", playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4️⃣ Remove Video from Playlist
export const removeVideoFromPlaylist = async (req, res) => {
  try {
    const { playlistId, videoId } = req.body;

    if (!playlistId || !videoId) return res.status(400).json({ error: "playlistId and videoId are required" });

    const playlist = await Playlist.findOne({ _id: playlistId, user: req.user._id });
    if (!playlist) return res.status(404).json({ error: "Playlist not found" });

    playlist.videos = playlist.videos.filter(id => id.toString() !== videoId);
    await playlist.save();

    res.json({ message: "Video removed from playlist", playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPlaylistById = async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await Playlist.findById(id)
      .populate('videos')
      .populate('user', 'username avatar');  // get uploader info

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found" });
    }

    // Check access for private playlists
    if (
      playlist.visibility === 'private' &&
      (!req.user || playlist.user._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({ error: "Access denied to private playlist" });
    }

    res.json({ playlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePlaylist = async (req, res) => {
  try {
    const { id } = req.params;

    const playlist = await Playlist.findOneAndDelete({ _id: id, user: req.user._id });

    if (!playlist) {
      return res.status(404).json({ error: "Playlist not found or you are not authorized to delete it" });
    }

    res.json({ message: "Playlist deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

