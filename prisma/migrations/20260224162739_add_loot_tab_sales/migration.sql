/*
  Warnings:

  - A unique constraint covering the columns `[guild_id,name]` on the table `guild_categories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[guild_id,name]` on the table `guild_roles2` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[guild_id,name]` on the table `guild_templates` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `guild_id` to the `events` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guild_id` to the `guild_categories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guild_id` to the `guild_roles2` table without a default value. This is not possible if the table is not empty.
  - Added the required column `guild_id` to the `guild_templates` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'OFFICER', 'PLAYER', 'ALLIANCE');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "RegearStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LootTabSaleStatus" AS ENUM ('OPEN', 'DRAWN', 'CANCELLED');

-- DropIndex
DROP INDEX "guild_categories_name_key";

-- DropIndex
DROP INDEX "guild_roles2_name_key";

-- DropIndex
DROP INDEX "guild_templates_name_key";

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "guild_categories" ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "guild_roles2" ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "guild_templates" ADD COLUMN     "guild_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "role_slots" ADD COLUMN     "notes" TEXT;

-- CreateTable
CREATE TABLE "guilds" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logo_url" TEXT,
    "invite_code" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "discord_guild_id" TEXT,
    "discord_member_role_id" TEXT,
    "discord_alliance_role_id" TEXT,
    "discord_bot_installed" BOOLEAN NOT NULL DEFAULT false,
    "server_region" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_memberships" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'PLAYER',
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "last_seen_balance_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by_id" TEXT,
    "verified_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "balance_transactions" (
    "id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance_after" INTEGER NOT NULL,
    "reason" TEXT,
    "performed_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "balance_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_role_specs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "player_role_specs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regear_requests" (
    "id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "membership_id" TEXT NOT NULL,
    "screenshot_data" TEXT NOT NULL,
    "note" TEXT,
    "status" "RegearStatus" NOT NULL DEFAULT 'PENDING',
    "silver_amount" INTEGER,
    "review_note" TEXT,
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regear_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loot_tab_sales" (
    "id" TEXT NOT NULL,
    "guild_id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "duration_hours" INTEGER NOT NULL,
    "repair_cost" INTEGER NOT NULL DEFAULT 0,
    "silver_bags" INTEGER NOT NULL DEFAULT 0,
    "description" TEXT,
    "status" "LootTabSaleStatus" NOT NULL DEFAULT 'OPEN',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "channel_id" TEXT,
    "message_id" TEXT,
    "winner_id" TEXT,
    "drawn_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loot_tab_sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loot_tab_bids" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loot_tab_bids_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guilds_slug_key" ON "guilds"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_invite_code_key" ON "guilds"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "guilds_discord_guild_id_key" ON "guilds"("discord_guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "guild_memberships_user_id_guild_id_key" ON "guild_memberships"("user_id", "guild_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_role_specs_user_id_role_id_key" ON "player_role_specs"("user_id", "role_id");

-- CreateIndex
CREATE UNIQUE INDEX "regear_requests_event_id_user_id_key" ON "regear_requests"("event_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "loot_tab_bids_sale_id_user_id_key" ON "loot_tab_bids"("sale_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "guild_categories_guild_id_name_key" ON "guild_categories"("guild_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "guild_roles2_guild_id_name_key" ON "guild_roles2"("guild_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "guild_templates_guild_id_name_key" ON "guild_templates"("guild_id", "name");

-- AddForeignKey
ALTER TABLE "guilds" ADD CONSTRAINT "guilds_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_memberships" ADD CONSTRAINT "guild_memberships_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_memberships" ADD CONSTRAINT "guild_memberships_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "guild_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "balance_transactions" ADD CONSTRAINT "balance_transactions_performed_by_id_fkey" FOREIGN KEY ("performed_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_categories" ADD CONSTRAINT "guild_categories_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_roles2" ADD CONSTRAINT "guild_roles2_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_role_specs" ADD CONSTRAINT "player_role_specs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "player_role_specs" ADD CONSTRAINT "player_role_specs_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "guild_roles2"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guild_templates" ADD CONSTRAINT "guild_templates_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regear_requests" ADD CONSTRAINT "regear_requests_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regear_requests" ADD CONSTRAINT "regear_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regear_requests" ADD CONSTRAINT "regear_requests_membership_id_fkey" FOREIGN KEY ("membership_id") REFERENCES "guild_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regear_requests" ADD CONSTRAINT "regear_requests_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_sales" ADD CONSTRAINT "loot_tab_sales_guild_id_fkey" FOREIGN KEY ("guild_id") REFERENCES "guilds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_sales" ADD CONSTRAINT "loot_tab_sales_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_sales" ADD CONSTRAINT "loot_tab_sales_winner_id_fkey" FOREIGN KEY ("winner_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_bids" ADD CONSTRAINT "loot_tab_bids_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "loot_tab_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_bids" ADD CONSTRAINT "loot_tab_bids_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
