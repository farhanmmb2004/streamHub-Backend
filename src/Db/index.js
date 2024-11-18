import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";
export default async function connect() {
    try{
    const connection=await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`);
    console.log(`\n MongooDB Connected !! ${connection.connection.host}`);
        
}
    catch(error){
        console.log(process.env.MONGODB_URI);
     console.error("mongo DB connecting error",error);
     process.exit(1);
    }
}