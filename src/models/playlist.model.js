import mongoose,{Schema} from "mongoose";
const playlistSchema=new Schema({
name:{
    type:String,
    req:true
},
description:{
    type:String
},
vidios:[{
    type:Schema.Types.ObjectId,
    ref:"Vidio"
}],
owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
}
},{
    timestamps:true
})
export const Playlist=mongoose.model("Playlist",plalistSchema);