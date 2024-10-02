import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
cloudinary.config({ 
    cloud_name: 'dec8y340t', 
    api_key: '753948218833195', 
    api_secret: 'z7Cwm5m8QwUxQcOviX6ugIuswYk'
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
     console.log(response.url);
     return response
    }
    catch(error){
     fs.unlinkSync(loaclFilePath);
     return null
    }
}
export {uploadOnCloudinary}