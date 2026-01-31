import { config } from "dotenv";
import {defineConfig} from "drizzle-kit"; 

config({ path: ".env.local" });

export default defineConfig({
    // points to the file where the database tables are defined
    schema: "./src/db/schema.ts",
    // store all the history of my database changes here
    out: "./drizzle", 
    // specifies database type
    dialect: "postgresql",
    dbCredentials: {
        // tells drizzle where the database is located
        url: process.env.DIRECT_URL!,
    }, 
}); 