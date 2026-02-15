CREATE TABLE "folder_collaborator" (
	"id" text PRIMARY KEY NOT NULL,
	"folder_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'viewer' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "folder_collaborator" ADD CONSTRAINT "folder_collaborator_folder_id_folder_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folder"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "folder_collaborator" ADD CONSTRAINT "folder_collaborator_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "folder_collab_folder_idx" ON "folder_collaborator" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "folder_collab_user_idx" ON "folder_collaborator" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "folder_collab_unique_idx" ON "folder_collaborator" USING btree ("folder_id","user_id");