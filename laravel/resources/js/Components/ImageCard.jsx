export default function ImageCard({ image, children }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <img src={image} className="w-full h-32 object-cover rounded-md" />
      {children}
    </div>
  );
}
