-- AlterTable
ALTER TABLE "loot_tab_sales" ADD COLUMN     "split_at" TIMESTAMP(3),
ADD COLUMN     "split_completed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "loot_tab_participants" (
    "id" TEXT NOT NULL,
    "sale_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "added_by_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "loot_tab_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "loot_tab_participants_sale_id_user_id_key" ON "loot_tab_participants"("sale_id", "user_id");

-- AddForeignKey
ALTER TABLE "loot_tab_participants" ADD CONSTRAINT "loot_tab_participants_sale_id_fkey" FOREIGN KEY ("sale_id") REFERENCES "loot_tab_sales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_participants" ADD CONSTRAINT "loot_tab_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loot_tab_participants" ADD CONSTRAINT "loot_tab_participants_added_by_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
