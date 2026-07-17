-- CreateIndex
CREATE UNIQUE INDEX "url_shortener_short_code_key" ON "url_shortener"("short_code");

-- CreateIndex
CREATE UNIQUE INDEX "url_shortener_original_url_key" ON "url_shortener"("original_url");
