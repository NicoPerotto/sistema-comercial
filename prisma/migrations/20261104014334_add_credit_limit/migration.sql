-- AlterTable
ALTER TABLE "CreditCustomer" ADD COLUMN     "creditLimit" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "Sale" ADD COLUMN     "creditLimitAtSale" DECIMAL(65,30),
ADD COLUMN     "creditLimitExceeded" BOOLEAN NOT NULL DEFAULT false;
