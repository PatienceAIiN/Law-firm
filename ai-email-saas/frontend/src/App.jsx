import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Emails from "./pages/Emails.jsx";
import Review from "./pages/Review.jsx";
import Logs from "./pages/Logs.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/emails" element={<Emails />} />
        <Route path="/review" element={<Review />} />
        <Route path="/logs" element={<Logs />} />
      </Route>
    </Routes>
  );
}
