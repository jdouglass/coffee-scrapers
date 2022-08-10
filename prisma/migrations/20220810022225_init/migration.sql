-- CreateTable
CREATE TABLE "Products" (
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

    CONSTRAINT "Products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Products_product_url_key" ON "Products"("product_url");
