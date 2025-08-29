import { useState } from "react";

export default function Createvideo() {
  const [video, setVideo] = useState(null);
  const [thumbnail, setThumbnail] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visiblity, setVisiblity] = useState("public");

const handleSubmit = async (e) => {
  e.preventDefault();

  const token = localStorage.getItem("accessToken");
  console.log("Token:", token);

  const rtoken=localStorage.getItem("refreshToken");
  console.log("Refresh Token:", rtoken);
  
  if (!token) {
    console.error("No token found in localStorage");
    alert("Please log in before uploading a video");
    return;
  }

  const formData = new FormData();
  formData.append("video", video);
  formData.append("thumbnail", thumbnail);
  formData.append("title", title);
  formData.append("description", description);
  formData.append("visibility", visiblity);

  try {
  const res = await fetch("http://localhost:3000/api/videos/upload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`, // ✅ ONLY this header
    },
    credentials: 'include', // ✅ This sends HTTP-only cookies automatically
    body: formData,
  });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.message || "Upload failed");
    }
    console.log("this is done");
    const data = await res.json();
    console.log("Upload success:", data);
    alert("Video uploaded successfully!");
  } catch (err) {
    console.error("Error uploading:", err);
    alert(err.message);
  }
};

  return (
    <div className="max-w-lg mx-auto bg-white shadow-lg p-6 rounded-xl text-black">
      <h2 className="text-2xl font-bold mb-4">Upload New Video</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <input
          type="text"
          placeholder="Video Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />

        {/* Description */}
        <textarea
          placeholder="Video Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded-lg"
        />

        {/* Visibility */}
        <select
          value={visiblity}
          onChange={(e) => setVisiblity(e.target.value)}
          className="w-full p-2 border rounded-lg"
        >
          <option value="public">Public</option>
          <option value="private">Private</option>
        </select>


        {/* Video file */}
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideo(e.target.files[0])}
          className="w-full p-2 border rounded-lg"
        />

        {/* Thumbnail */}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnail(e.target.files[0])}
          className="w-full p-2 border rounded-lg"
        />

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
