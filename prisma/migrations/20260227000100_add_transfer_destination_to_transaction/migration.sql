ALTER TABLE `Transaction`
    ADD COLUMN `transferToAccountId` VARCHAR(191) NULL;

CREATE INDEX `Transaction_transferToAccountId_idx` ON `Transaction`(`transferToAccountId`);

ALTER TABLE `Transaction`
    ADD CONSTRAINT `Transaction_transferToAccountId_fkey`
    FOREIGN KEY (`transferToAccountId`) REFERENCES `BankAccount`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;

