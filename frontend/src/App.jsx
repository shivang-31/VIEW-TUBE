import { Routes, Route } from "react-router-dom";
import Layout from "./Component/layout";
import Home from "./pages/Home";
import WatchVideo from "./pages/WatchVideo";
import Profile from "./pages/Profile";
import WatchHistory from "./pages/WatchHistory";
import { PlayList } from "./pages/PlayList";
import { Login } from "./pages/Login";
import { Search } from "./pages/Search";
import Createvideo  from "./pages/Createvideo";
import { SignIn } from "./pages/SignIn";
import YouPage from "./pages/YouPage";


function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="Addnew" element={<Createvideo />} />
        <Route path="history" element={<WatchHistory/>}/>
        <Route path="playlists" element={<PlayList />} />
        <Route path="watch/:id" element={<WatchVideo />} />
        <Route path="you" element={<YouPage />} />
        <Route path="search" element={<Search />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignIn />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default App;
