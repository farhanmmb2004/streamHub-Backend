import mongoose,{Schema} from "mongoose";
const likeSchema=new Schema({
likedBy:{
    type:Schema.Types.ObjectId,
    ref:"User"
},
vidio:{
    type:Schema.Types.ObjectId,
    ref:"Vidio"
},comment:{
    type:Schema.Types.ObjectId,
    ref:"Comment"
},tweet:{
    type:Schema.Types.ObjectId,
    ref:"Tweet"
}
})
export const Like=mongoose.model("Like",likeSchema);