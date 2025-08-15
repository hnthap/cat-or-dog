import "./PredictionMessage.css";

interface PredictionMessageProps {
  prediction: number | null;
}

export default function PredictionMessage({
  prediction,
}: PredictionMessageProps) {
  const getPredictionMessage = () => {
    if (prediction === null) {
      return (
        "Upload an image of a cat or dog, and we'll tell you which" +
        " one it is."
      );
    }
    if (prediction < 30.0) {
      return "This is a Dog (" + Math.round(100.0 - prediction) + "%). 🐶";
    }
    if (prediction > 70.0) {
      return "This is a Cat (" + Math.round(prediction) + "%). 😺";
    }
    return "We are not sure about this image... 😅";
  };

  return (
    <div className="card">
      <p>{getPredictionMessage()}</p>
    </div>
  );
}
