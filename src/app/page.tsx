import Link from "next/link";
import styles from "./page.module.css";
import MainPage from "./pages/mainPage";

export default function Home() {
  return (
    <main className={styles.main}>
      <MainPage />
      <div style={{ display: "none" }}>
        <ul>
          <li>
            <Link href="/faceDetection">Face</Link>
          </li>
          <li>
            <Link href="/face-expression-detection">
              Face Expression Detection
            </Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
// "use client";
// import { Router } from "@remix-run/router";
// import styles from "./page.module.css";
// import FaceDetection from "./pages/faceDetection";
// import FaceExpressionDetection from "./pages/faceExpressionDetection";
// import MainPage from "./pages/mainPage";
// import MultipleImageUpload from "./pages/multipleImageUpload";
// import SingleImageComparision from "./pages/singleImageComparision";
// import "bootstrap/dist/css/bootstrap.min.css";
// import { RouterProvider, createBrowserRouter } from "react-router-dom";

// let router: Router;
// if (typeof window !== "undefined") {
//   router = createBrowserRouter([
//     {
//       path: "/",
//       element: <MainPage />,
//     },
//     {
//       path: "/face-detection",
//       element: <FaceDetection />,
//     },
//     {
//       path: "/single-image-comparision",
//       element: <SingleImageComparision />,
//     },
//     {
//       path: "/mutiple-image-comparision",
//       element: <MultipleImageUpload />,
//     },
//     {
//       path: "/face-expression-detection",
//       element: <FaceExpressionDetection />,
//     },
//   ]);
// }

// const Page = () => {
//   return router ? <RouterProvider router={router} /> : null;
// };

// export default Page;
