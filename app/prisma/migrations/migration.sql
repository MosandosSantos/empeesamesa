-- AlterTable
ALTER TABLE "loja" ADD COLUMN     "short_name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "loja_short_name_key" ON "loja"("short_name");
