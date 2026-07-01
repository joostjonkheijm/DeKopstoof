import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/home/index.jsx";
import Kamers from "./pages/kamers/index.jsx";
import Omgeving from "./pages/omgeving/index.jsx";
import OverDeKopstoof from "./pages/over-de-kopstoof/index.jsx";
import Reviews from "./pages/reviews/index.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/kamers" element={<Kamers />} />
      <Route path="/omgeving" element={<Omgeving />} />
      <Route path="/over-de-kopstoof" element={<OverDeKopstoof />} />
      <Route path="/reviews" element={<Reviews />} />
    </Routes>
  );
}
