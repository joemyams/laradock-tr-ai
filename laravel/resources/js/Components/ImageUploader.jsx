import InputLabel from "@/Components/InputLabel";
import FileInput from "@/Components/FileInput";
import Image from "@/Components/Image";
import DangerButton from "@/Components/DangerButton";

export default function ImageUploader({
  imageSrc,
  handleImageChanges,
  labelValue,
  inputName,
  inputId,
  fileInputRef,
  imagetype,
  isMultiple,
  removeUploadedImage,
  imageStyle = "",
  children,
}) {
  const checkImageSrcType = () => {
    if (Array.isArray(imageSrc)) {
      return imageSrc.length !== 0;
    } else {
      return imageSrc;
    }
  };

  return (
    <div
      className={`mb-4 ${
        checkImageSrcType() ? "border-solid border-2 p-3" : ""
      }`}
    >
      <div className="flex items-center">
        <InputLabel
          htmlFor={inputId}
          className="pr-2 whitespace-nowrap"
          value={labelValue}
        />
        <FileInput
          imagetype={imagetype}
          id={inputId}
          ref={fileInputRef}
          name={inputName}
          onChange={handleImageChanges}
          multiple={isMultiple}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
        />
      </div>
      {imageSrc && (
        <div className="flex flex-wrap ml-0 md:ml-16">
          {Array.isArray(imageSrc) ? (
            imageSrc.map((image) => (
              <div className="flex flex-col p-2" key={image.key}>
                <figure className="m-0 mr-4">
                  <img className="w-24 md:w-48 h-24 md:h-48" src={image.url} />
                  <DangerButton
                    className="w-24 md:w-48 h-8 md:h-8 mt-1"
                    onClick={() => removeUploadedImage(image.key)}
                  >
                    remove
                  </DangerButton>
                </figure>
              </div>
            ))
          ) : (
            <div className={imageStyle.imgContainer}>
              <Image size={imageStyle.size} imageSrc={imageSrc} />
              {children}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
