import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});
const uploadOnCloudinary=async (loaclFilePath)=>{
    try{
     if(!loaclFilePath){
     return 
     }
     const response=await cloudinary.uploader
     .upload(
         loaclFilePath, {
            resource_type: 'auto',
         }
     )
     fs.unlinkSync(loaclFilePath);
     return response
    }
    catch(error){
     fs.unlinkSync(loaclFilePath);
     return null
    }
}
const removeFromCloudinary=async(url)=>{
    try{
        const urlParts=new URL(url);
        const uploadPath = urlParts.pathname.split('/upload/')[1];
        const publicId = uploadPath.replace(/^v\d+\//, '').replace(/\.[^/.]+$/, '');
        const res=await cloudinary.uploader.destroy(publicId, (error, result) => {
            // if (error) {
            //   console.error('Error deleting image:', error);
            // } else {
            //   console.log('Image deleted successfully:', result);
            // }
          });
    }
    catch(error){

    }
}
export {uploadOnCloudinary,removeFromCloudinary}