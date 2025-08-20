import axios from "axios";

const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "q7bbyte9");

  const res = await axios.post(
    `https://api.cloudinary.com/v1_1/doiymxwet/image/upload`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  if (res.status !== 200) throw new Error("Upload failed");

  return res.data.secure_url as string; // URL gambar
};

export default uploadToCloudinary;
