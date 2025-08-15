import axios from "axios";
import { useEffect, useState, type ChangeEvent } from "react";
import "./App.css";
import Header from "./components/Header";
import ImageCard from "./components/ImageCard";
import PredictionMessage from "./components/PredictionMessage";
import FileUploader from "./components/FileUploader";
import Footer from "./components/Footer";

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  /* Indicates the probablity of the image being a cat */
  const [prediction, setPrediction] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    return () => {
      if (imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }, [imageUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setImageUrl(URL.createObjectURL(selectedFile));
    } else {
      alert("Please update a valid image file.");
    }
    setPrediction(null);
  };

  const handleClearImage = () => {
    setFile(null);
    setImageUrl(null);
    setPrediction(null);
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select an image first!");
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.post<{ cat: number }>(
        process.env.BACKEND_API_INFER_URL || "http://localhost:3001/v1/infer",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      // TODO: validate the server response to ensure it matches the structure
      // { cat: number } and the probability is within the expected range
      // (0.0 to 100.0).
      setPrediction(response.data.cat);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Server error:", error.response?.data || error.message);
        alert("Server error occurred. Please try again later.");
      } else {
        console.error("Unexpected error:", error);
        alert("An unexpected error occurred. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <PredictionMessage prediction={prediction} />
      <ImageCard imageUrl={imageUrl} />
      <FileUploader
        onFileChange={handleFileChange}
        onClear={handleClearImage}
        onUpload={handleUpload}
        file={file}
        loading={loading}
      />
      <Footer />
    </>
  );
}

export default App;
