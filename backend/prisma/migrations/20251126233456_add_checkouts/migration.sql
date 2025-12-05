-- CreateTable
CREATE TABLE "checkouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shopify_id" TEXT NOT NULL,
    "total_price" DECIMAL(65,30) NOT NULL DEFAULT 0.0,
    "currency" TEXT,
    "abandoned_checkout_url" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "checkouts_tenant_id_idx" ON "checkouts"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "checkouts_tenant_id_shopify_id_key" ON "checkouts"("tenant_id", "shopify_id");

-- AddForeignKey
ALTER TABLE "checkouts" ADD CONSTRAINT "checkouts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
