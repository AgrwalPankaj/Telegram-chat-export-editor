ALTER TABLE `messages` MODIFY COLUMN `participantId` int;--> statement-breakpoint
ALTER TABLE `participants` MODIFY COLUMN `initials` varchar(10);