import dotenv from "dotenv";
import connect from "./Db/index.js";
import { app } from "./app.js";
dotenv.config({path:'./.env'});
connect()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
    console.log(process.env.PORT);
    });
})
.catch((error)=>{console.error(error)})