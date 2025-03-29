import { v2 } from "cloudinary";
import fs from "fs";
import dotenv from "dotenv";
dotenv.config();





v2.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key:process.env.API_KEY,
    api_secret: process.env.SECRET_KEY_CLOUD,
});

 const uploadOnCloudinary=async(file)=>{
    if(!file){
        console.log("No file to upload");
        return null;
    }
    try{
        const uploadResponse=await v2.uploader.upload(file,{
            resource_type:"auto",
        })
        fs.unlinkSync(file);
        return uploadResponse;
    }catch(error){
        console.log("Error uploading to Cloudinary:",error);
        fs.unlinkSync(file);
        return null;
    }
}
export default uploadOnCloudinary;