"use client"
import styles from "./page.module.css";
import FaceDetection from "./pages/faceDetection";
import FaceExpressionDetection from "./pages/faceExpressionDetection";
import MainPage from "./pages/mainPage";
import MultipleImageUpload from "./pages/multipleImageUpload";
import SingleImageComparision from "./pages/singleImageComparision";
import "bootstrap/dist/css/bootstrap.min.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

export default function Home() {
  return (
    <Router>
      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/face-detection" element={<FaceDetection />} />
          <Route path="/single-image-comparision" element={<SingleImageComparision />} />
          <Route path="/mutiple-images-comparision" element={<MultipleImageUpload />} />
          <Route path="/face-expression-detection" element={<FaceExpressionDetection />} />

        </Routes>

        {/* <SingleImageComparision /> */}
      </main>
    </Router>
  );
}
