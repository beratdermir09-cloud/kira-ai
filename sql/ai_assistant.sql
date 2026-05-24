-- ============================================
-- AI Assistant - MySQL Veritabanı
-- phpMyAdmin'de içe aktarmak için kullanın
-- ============================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- Veritabanını oluştur
CREATE DATABASE IF NOT EXISTS `ai_assistant`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `ai_assistant`;

-- ============================================
-- Tablo: users
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id`             VARCHAR(128)  NOT NULL,
  `email`          VARCHAR(255)  DEFAULT NULL,
  `display_name`   VARCHAR(255)  DEFAULT NULL,
  `photo_url`      VARCHAR(512)  DEFAULT NULL,
  `created_at`     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_seen`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `is_admin`       TINYINT(1)    NOT NULL DEFAULT 0,
  `total_messages` INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tablo: conversations
-- ============================================
CREATE TABLE IF NOT EXISTS `conversations` (
  `id`         VARCHAR(36)   NOT NULL,
  `user_id`    VARCHAR(128)  NOT NULL,
  `title`      VARCHAR(255)  NOT NULL DEFAULT 'Yeni Sohbet',
  `tags`       VARCHAR(255)  DEFAULT NULL,
  `is_pinned`  TINYINT(1)    NOT NULL DEFAULT 0,
  `is_shared`  TINYINT(1)    NOT NULL DEFAULT 0,
  `share_id`   VARCHAR(16)   DEFAULT NULL,
  `model`      VARCHAR(100)  DEFAULT NULL,
  `created_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_updated_at` (`updated_at`),
  KEY `idx_share_id` (`share_id`),
  CONSTRAINT `fk_conv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- Tablo: messages
-- ============================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id`              VARCHAR(36)   NOT NULL,
  `conversation_id` VARCHAR(36)   NOT NULL,
  `role`            VARCHAR(20)   NOT NULL,
  `content`         LONGTEXT      NOT NULL,
  `file_name`       VARCHAR(255)  DEFAULT NULL,
  `is_pinned`       TINYINT(1)    NOT NULL DEFAULT 0,
  `model_used`      VARCHAR(100)  DEFAULT NULL,
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_conversation_id` (`conversation_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_msg_conv` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
