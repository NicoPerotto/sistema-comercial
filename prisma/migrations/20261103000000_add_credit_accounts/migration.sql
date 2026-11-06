-- AlterTable: flag que marca un método de pago como "cuenta corriente"
ALTER TABLE "PaymentMethod" ADD COLUMN "isCredit" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: cliente a cuenta asociado a la venta
ALTER TABLE "Sale" ADD COLUMN "creditCustomerId" TEXT;

-- CreateTable: clientes / deudores
CREATE TABLE "CreditCustomer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dni" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditCustomer_pkey" PRIMARY KEY ("id")
);

-- CreateTable: cobros de deuda
CREATE TABLE "CreditPayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "customerId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "cashRegisterId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreditCustomer_dni_key" ON "CreditCustomer"("dni");

-- CreateIndex
CREATE INDEX "CreditCustomer_name_idx" ON "CreditCustomer"("name");

-- CreateIndex
CREATE INDEX "Sale_creditCustomerId_status_idx" ON "Sale"("creditCustomerId", "status");

-- CreateIndex
CREATE INDEX "CreditPayment_customerId_createdAt_idx" ON "CreditPayment"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CreditPayment_cashRegisterId_idx" ON "CreditPayment"("cashRegisterId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_creditCustomerId_fkey" FOREIGN KEY ("creditCustomerId") REFERENCES "CreditCustomer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CreditCustomer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "PaymentMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_cashRegisterId_fkey" FOREIGN KEY ("cashRegisterId") REFERENCES "CashRegister"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditPayment" ADD CONSTRAINT "CreditPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
