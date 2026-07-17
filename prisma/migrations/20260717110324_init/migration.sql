-- CreateTable
CREATE TABLE "url_shortener" (
    "id" BIGSERIAL NOT NULL,
    "short_code" VARCHAR(8) NOT NULL,
    "original_url" TEXT NOT NULL,
    "is_custom_alias" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "url_shortener_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "url_shortener_original_url_short_code_idx" ON "url_shortener"("original_url", "short_code");
