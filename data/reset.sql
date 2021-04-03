INSERT INTO `block` (`key`, `value`) VALUES
('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e', '{\"name\":\"45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e\",\"height\":1,\"weight\":0.19777150474425764,\"chainWeight\":0.19777150474425764,\"target\":\"0x10000000000000000000000000000000000000000000000000000000000000000\",\"nonce\":\"$2b$04$9FggmRrM/dV4qqEUmaswKe\",\"hash\":\"3045022004b49c986ebfba05960f1cef5f51b8554b440d68cd04cbaa184e9ab12dcbdcf3022100bba486523fc591878ec71cf770f7f96c67f69a6a953338097db272a14a403278\",\"prevBlockName\":\"\",\"timestamp\":\"2021-03-29T16:51:14.274Z\",\"transactionsNames\":[\"c158ce5196a340e4a8a9db11930c6ab20f77136656642f2b6227b8aafe4029f9\"]}'),
('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e.chainWeight', '0.19777150474425764'),
('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e.height', '1'),
('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e.target', '0x10000000000000000000000000000000000000000000000000000000000000000'),
('45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e.timestamp', '2021-03-29T16:51:14.274Z');

INSERT INTO `chain` (`key`, `value`) VALUES
('height_block_names.1', '[\"45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e\"]'),
('height.1', '45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e');


INSERT INTO `setting` (`key`, `value`) VALUES
('last_block_height', '1'),
('last_block_name', '45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e'),
('mining_enabled', 'yes');


INSERT INTO `transaction` (`key`, `value`) VALUES
('c158ce5196a340e4a8a9db11930c6ab20f77136656642f2b6227b8aafe4029f9', '{\"name\":\"c158ce5196a340e4a8a9db11930c6ab20f77136656642f2b6227b8aafe4029f9\",\"num\":0,\"blockName\":\"45036c5304cc511c95d88bcf6b039a25d429b48ce820cad2fd11f0bcdf9cdb2e\",\"inputs\":[{\"num\":0,\"script\":1}],\"outputs\":[{\"num\":0,\"value\":1,\"script\":\"PPK 0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed VALID 3045022100b838902a531620f21885c9d4aea1a9516c31ce028c1af4f2563ef039f52f32dc02201e30121ccaccff9b981a1ce1c34b3ab720bd3fefffa8917c3c9e80ef8f0359ab\"}]}');


INSERT INTO `utxo` (`key`, `value`) VALUES
('output.c158ce5196a340e4a8a9db11930c6ab20f77136656642f2b6227b8aafe4029f9.0', '{\"blockHeight\":1,\"transactionName\":\"c158ce5196a340e4a8a9db11930c6ab20f77136656642f2b6227b8aafe4029f9\",\"transactionNum\":0,\"outputNum\":0,\"value\":1,\"script\":\"PPK 0452b239584f1f9365e6840209423812c6ff58e2df636f76d48ba95b50d4133ed6bd9cdc80815ac286e8c5286607c1a4e68111362b9e432e8311bd3b57264131ed VALID 3045022100b838902a531620f21885c9d4aea1a9516c31ce028c1af4f2563ef039f52f32dc02201e30121ccaccff9b981a1ce1c34b3ab720bd3fefffa8917c3c9e80ef8f0359ab\",\"hashedAddress\":\"39f126091ef3a74964a8221d63edda3b443d5437f489b7248d9d5c7d6d1e7215\"}');
