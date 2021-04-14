-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 05, 2021 at 06:20 PM
-- Server version: 10.2.34-MariaDB
-- PHP Version: 7.2.34
SET
  SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";

START TRANSACTION;

SET
  time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */
;

/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */
;

/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */
;

/*!40101 SET NAMES utf8mb4 */
;

--
-- Database: `coint3_node2`
--
-- --------------------------------------------------------
--
-- Table structure for table `block`
--
CREATE TABLE `block` (
  `key` varchar(200) NOT NULL,
  `value` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- --------------------------------------------------------
--
-- Table structure for table `chain`
--
CREATE TABLE `chain` (
  `key` varchar(200) COLLATE utf8_unicode_ci NOT NULL,
  `value` text COLLATE utf8_unicode_ci NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 COLLATE = utf8_unicode_ci;

-- --------------------------------------------------------
--
-- Table structure for table `pool`
--
CREATE TABLE `pool` (
  `key` varchar(200) NOT NULL,
  `value` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- --------------------------------------------------------
--
-- Table structure for table `queue`
--
CREATE TABLE `queue` (
  `key` varchar(200) NOT NULL,
  `value` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

-- --------------------------------------------------------
--
-- Table structure for table `setting`
--
CREATE TABLE `setting` (
  `key` varchar(200) NOT NULL,
  `value` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 ROW_FORMAT = COMPACT;

-- --------------------------------------------------------
--
-- Table structure for table `transaction`
--
CREATE TABLE `transaction` (
  `key` varchar(200) NOT NULL,
  `value` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8 ROW_FORMAT = COMPACT;

-- --------------------------------------------------------
--
-- Table structure for table `utxo`
--
CREATE TABLE `utxo` (
  `key` varchar(200) NOT NULL,
  `value` longtext NOT NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8;

CREATE TABLE `account` (
  `key` VARCHAR(200) NOT NULL,
  `value` LONGTEXT NOT NULL
) ENGINE = InnoDB;

ALTER TABLE
  `account`
ADD
  UNIQUE(`key`);

--
-- Indexes for dumped tables
--
--
-- Indexes for table `block`
--
ALTER TABLE
  `block`
ADD
  UNIQUE KEY `key` (`key`) USING BTREE;

--
-- Indexes for table `chain`
--
ALTER TABLE
  `chain`
ADD
  UNIQUE KEY `key` (`key`);

--
-- Indexes for table `pool`
--
ALTER TABLE
  `pool`
ADD
  UNIQUE KEY `key` (`key`);

--
-- Indexes for table `queue`
--
ALTER TABLE
  `queue`
ADD
  UNIQUE KEY `key` (`key`);

--
-- Indexes for table `setting`
--
ALTER TABLE
  `setting`
ADD
  UNIQUE KEY `key` (`key`);

--
-- Indexes for table `transaction`
--
ALTER TABLE
  `transaction`
ADD
  UNIQUE KEY `key` (`key`);

--
-- Indexes for table `utxo`
--
ALTER TABLE
  `utxo`
ADD
  UNIQUE KEY `key` (`key`);

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */
;

/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */
;

/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */
;