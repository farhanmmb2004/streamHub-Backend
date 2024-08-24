import dotenv from "dotenv";
import connect from "./Db/index.js";
dotenv.config({path:'./env'});
connect();