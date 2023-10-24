import React from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const MainPage = () => {
  const navigate = useNavigate();
  
  return (
    <div style={{ textAlign: "center" }}>
      <h3 style={{ marginTop: "20px" }}>
        Facial Detection, Comparison, and Expression Analysis
      </h3>
      <div style={{ marginTop: "200px" }}>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => navigate("./face-detection")}
        >
          Face Detection
        </Button>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => navigate("./single-image-comparision")}
        >
          Compare with Single Image
        </Button>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => navigate("./mutiple-images-comparision")}
        >
          Compare with Multiple Images
        </Button>
        <Button
          style={{ marginLeft: "30px" }}
          onClick={() => navigate("./face-expression-detection")}
        >
          Face Expression Detection
        </Button>
      </div>
    </div>
  );
};

export default MainPage;
