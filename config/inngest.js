// /app/api/inngest/route.js
import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

// Initialize Inngest client
export const inngest = new Inngest({ id: "quickcart-next" });

// Function to sync user creation
export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    name: "Sync User Creation from Clerk",
    description: "Saves new users from Clerk into the database",
  },
  {
    event: "clerk/user.created",
  },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      if (!id || !email_addresses || !email_addresses[0]?.email_address) {
        console.warn("Invalid event data:", event.data);
        return;
      }

      const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        imageUrl: image_url ?? null,
      };

      await connectDB();
      await User.create(userData);
    } catch (error) {
      console.error("Error syncing user creation:", error);
    }
  }
);

// Function to sync user update
export const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    name: "Sync User Update from Clerk",
    description: "Updates user info in the database when Clerk updates user",
  },
  {
    event: "clerk/user.updated",
  },
  async ({ event }) => {
    try {
      const { id, first_name, last_name, email_addresses, image_url } = event.data;

      if (!id) {
        console.warn("No user ID in update event:", event.data);
        return;
      }

      const updatedData = {
        email: email_addresses?.[0]?.email_address ?? undefined,
        name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
        imageUrl: image_url ?? null,
      };

      await connectDB();
      await User.findByIdAndUpdate(id, updatedData);
    } catch (error) {
      console.error("Error syncing user update:", error);
    }
  }
);

// Function to sync user deletion
export const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-from-clerk",
    name: "Sync User Deletion from Clerk",
    description: "Deletes user from database when Clerk deletes user",
  },
  {
    event: "clerk/user.deleted",
  },
  async ({ event }) => {
    try {
      const { id } = event.data;

      if (!id) {
        console.warn("No user ID in deletion event:", event.data);
        return;
      }

      await connectDB();
      await User.findByIdAndDelete(id);
    } catch (error) {
      console.error("Error syncing user deletion:", error);
    }
  }
);
