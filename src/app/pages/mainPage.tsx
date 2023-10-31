"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { Button, Col, Row } from "react-bootstrap";

const MainPage = () => {
  const router = useRouter();

  return (
    <div style={{ textAlign: "center" }}>
      <h3 style={{ marginTop: "20px" }}>
        Facial Detection, Comparison, and Expression Analysis
      </h3>
      <Row style={{ marginTop: "100px" }}>
        <Col xs={6}>
          <Button
            style={{
              marginLeft: "10px",
              marginTop: "50px",
              width: "60%",
            }}
            onClick={() => router.push("./face-detection")}
          >
            Face Detection
          </Button>
        </Col>
        <Col xs={6}>
          <Button
            style={{ marginLeft: "0px", marginTop: "50px", width: "60%" }}
            onClick={() => router.push("./face-expression-detection")}
          >
            Face Expression Detection
          </Button>
        </Col>
        <Col xs={6}>
          <Button
            style={{ marginLeft: "0px", marginTop: "50px", width: "60%" }}
            onClick={() => router.push("./single-image-comparision")}
          >
            Compare with Single Image
          </Button>
        </Col>
        <Col xs={6}>
          <Button
            style={{ marginLeft: "10px", marginTop: "50px", width: "60%" }}
            onClick={() => router.push("./mutiple-images-comparision")}
          >
            Compare Single face with Multiple Images with Expression
          </Button>
        </Col>
        <Col xs={12}>
          <Button
            style={{ marginLeft: "10px", marginTop: "50px", width: "40%" }}
            name="Ravi only coordinates with Radha, which is sufficient for Radha. She
          will handle everything."
            onClick={() => router.push("./face-detection-with-live-camera")}
          >
            Face Detection using Live Camera
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default MainPage;
