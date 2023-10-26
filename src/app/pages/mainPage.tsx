"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "react-bootstrap";

const MainPage = () => {
  const router = useRouter();

  return (
    <div style={{ textAlign: "center" }}>
      <h3 style={{ marginTop: "20px" }}>
        Facial Detection, Comparison, and Expression Analysis
      </h3>
      <div style={{ marginTop: "200px" }}>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => router.push("./face-detection")}
        >
          Face Detection
        </Button>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => router.push("./face-expression-detection")}
        >
          Face Expression Detection
        </Button>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => router.push("./single-image-comparision")}
        >
          Compare with Single Image
        </Button>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => router.push("./mutiple-images-comparision")}
        >
          Compare Single face with Multiple Images with Expression
        </Button>
      </div>
    </div>
  );
};

export default MainPage;
