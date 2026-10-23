-- Migration: tambah kolom payment_method dan payment_proof ke tabel orders
-- Jalankan query ini sekali di database arliphone

USE `arliphone`;

ALTER TABLE `orders`
  ADD COLUMN `payment_method` ENUM('cod', 'transfer') NOT NULL DEFAULT 'cod'
    AFTER `shipping_address`,
  ADD COLUMN `payment_proof` VARCHAR(255) DEFAULT NULL
    AFTER `payment_method`;
