-- CreateTable
CREATE TABLE "guild_categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6b7280',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_roles2" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guild_roles2_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guild_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guild_templates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "guild_categories_name_key" ON "guild_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guild_roles2_name_key" ON "guild_roles2"("name");

-- CreateIndex
CREATE UNIQUE INDEX "guild_templates_name_key" ON "guild_templates"("name");

-- AddForeignKey
ALTER TABLE "guild_roles2" ADD CONSTRAINT "guild_roles2_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "guild_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
