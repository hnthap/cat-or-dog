import "./ImageCard.css";

interface ImageCardProps {
    imageUrl: string | null;
}

export default function ImageCard({ imageUrl }: ImageCardProps) {
    return (
      <div className="card image-card">
        {imageUrl && <img src={imageUrl} alt="Uploaded image" />}
      </div>
    );
}
