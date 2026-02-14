ALTER TABLE "folder" ADD COLUMN "public_slug" text;--> statement-breakpoint
ALTER TABLE "folder" ADD CONSTRAINT "folder_public_slug_unique" UNIQUE("public_slug");