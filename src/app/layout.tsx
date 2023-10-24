import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Face Comparion and Expression Detector",
  description: "Face comparision and face expression detection using images",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta
          name="description"
          content="Face Detection: It involves locating and identifying faces within an image, often using techniques like Haar cascades or deep learning models (e.g., CNNs) to draw bounding boxes around detected faces.Face Comparison: It focuses on analyzing and comparing facial features for identity verification or recognition. This typically requires the extraction of facial landmarks and using algorithms to measure the similarity between faces."
        />
        <meta
          name="keywords"
          content="face comparision online for free, face comparision, happy face sad face comparision, face comparision software,face expession detector, human face comparision"
        />
        <meta
          name="google-site-verification"
          content="Zadpj3bBaM7_6ZxzwU8pEi_jFLCN0zQfhoJFA-oghkQ"
        />
        <link
          rel="canonical"
          href="https://face-comparision-with-expression.netlify.app/"
        />
        <link rel="canonical" href="https://nextjs.org" />
        <title>Facial Detection, Comparison, and Expression Analysis</title>
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
