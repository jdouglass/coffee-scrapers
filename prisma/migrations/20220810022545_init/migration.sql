/*
  Warnings:

  - You are about to drop the `Products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "Products";

-- CreateTable
CREATE TABLE "products" (
    "id" SERIAL NOT NULL,
    "brand" VARCHAR(50) NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "price" VARCHAR(6) NOT NULL,
    "weight" INTEGER NOT NULL,
    "process" VARCHAR(50) NOT NULL,
    "process_category" VARCHAR(20) NOT NULL,
    "variety" TEXT[],
    "country" VARCHAR(56) NOT NULL,
    "continent" VARCHAR(20) NOT NULL,
    "product_url" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "sold_out" BOOLEAN NOT NULL,
    "date_added" TIMESTAMP NOT NULL,
    "vendor" VARCHAR(20) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "products_product_url_key" ON "products"("product_url");
