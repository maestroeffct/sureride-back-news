/*
  Warnings:

  - A unique constraint covering the columns `[phoneCountry,phoneNumber]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_phoneCountry_phoneNumber_key" ON "User"("phoneCountry", "phoneNumber");
