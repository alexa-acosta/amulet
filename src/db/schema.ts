import { pgTable, text, timestamp, uuid, boolean, date, integer } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  inviteCode: text("invite_code"),
  coupleId: uuid("couple_id"),
});

export const couples = pgTable("couples", {
  id: uuid("id").primaryKey().defaultRandom(),
  partner1Id: uuid("partner_1_id").references(() => users.id).notNull(),
  partner2Id: uuid("partner_2_id").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  anniversary: date("anniversary"),
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id"),
  userId: uuid("user_id"),
  title: text("title"),
  description: text("description"),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  location: text("location"),
  googleEventId: text("google_event_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  hexColor: text("hex_color"),
  isAmuletDate: boolean("is_amulet_date"),
});

export const qaAnswers = pgTable("qa_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  coupleId: uuid("couple_id"),
  userId: uuid("user_id"),
  question: text("question"),
  answer: text("answer"),
});

export const qaQuestions = pgTable("qa_questions", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  coupleId: uuid("couple_id"),
  questions: text("questions"),
  currentIndex: integer("current_index"),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  coupleId: uuid("couple_id"),
  userId: uuid("user_id"),
  text: text("text"),
  sender: text("sender"),
  chatId: uuid("chat_id"),
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  userId: uuid("user_id"),
  coupleId: uuid("couple_id"),
  title: text("title"),
  shared: boolean("shared"),
});

export const mems = pgTable("mems", {
  id: uuid("id").primaryKey().defaultRandom(),
  coupleId: uuid("couple_id").references(() => couples.id).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  imageUrl: text("image_url").notNull(),
  storagePath: text("storage_path").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});