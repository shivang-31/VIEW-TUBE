import { Link } from "react-router-dom";

const VideoCard = ({ videoId, title, thumbnail }) => {
  return (
    <Link
      to={`/watch/${videoId}`}
      className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition duration-300"
    >
      <img
        src={thumbnail}
        alt={title}
        className="w-full h-40 object-cover"
      />
      <div className="p-3">
        <h3 className="text-white font-semibold text-sm truncate">{title}</h3>
      </div>
    </Link>
  );
};

export default VideoCard;
