import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  // each user has a unique id stored in .primaryKey()
  id: uuid("id").primaryKey().defaultRandom(),
  //every user must have a unique email
  email: text("email").notNull().unique(),
  name: text("name"), 
  //automatically timestamp when the user was created
  createdAt: timestamp("created_at").defaultNow(), 
});

export const couples = pgTable("couples", {
    id: uuid("id").primaryKey().defaultRandom(),
    // a foreign key: the id must match an existing user id in the users table
    partner1Id: uuid("partner_1_id").references(() => users.id).notNull(),
    partner2Id: uuid("partner_2_id").references(() => users.id).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});