"use client";
import styles from "./page.module.css";
import WebCamPage from "./pages/webCamPage";
import "bootstrap/dist/css/bootstrap.min.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <WebCamPage />
    </main>
  );
}
