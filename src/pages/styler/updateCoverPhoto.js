import { useState } from "react";
import Back from "../../components/goBack";
import photo from "../../assets/images/photoIllustration.png";
import Buttons from "../../components/button";

const UpdateCoverPhoto = () => {
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  return (
    <div className="border rounded-md">
      <div className="flex items-center gap-3 border-b p-4 text-sm font-medium">
        <Back />
        <span>Update cover photo</span>
      </div>
      <div className="p-4">
        <div className="px-6 pt-4 pb-10 hover:bg-brand/5 transition-colors duration-300 border border-dashed border-brand/50 rounded-md text-center cursor-pointer" onClick={() => document.getElementById("imageInput").click()}>
          <div className="flex justify-center">
            <img src={photo} alt="" className="h-32 mix-blend-luminosity opacity-50"/>
          </div>
          <div className="font-medium mb-2">Click to upload an image</div>
          <div className="text-xs text-gray-500">Supports JPG, JPEG and PNG</div>
          <input type="file" id="imageInput" accept="image/*" className="hidden" onChange={handleImageUpload}/>
        </div>
        {selectedImage && (
          <div>
              <div className="flex justify-between items-center border rounded-md p-2 cursor-default mt-4 mb-6">
                  <div className="flex items-center gap-4">
                    <img src={URL.createObjectURL(selectedImage)} alt="Preview" className="h-16 w-16 object-cover rounded"/>
                    <div className="text-sm grid gap-1">
                      <p>{selectedImage.name}</p>
                      <p className="text-gray-500 font-medium text-xs">{(selectedImage.size / 1024).toFixed(2)} KB</p>
                    </div>
                  </div>
                  <div onClick={removeImage}>Remove image</div>
              </div>
              <Buttons btnText={"Update cover photo"} btnType={"primary"} />
          </div>
        )}
      </div>
    </div>
  );
};

export default UpdateCoverPhoto;