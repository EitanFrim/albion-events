-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('MEMBERS_ONLY', 'PUBLIC');

-- AlterEnum
ALTER TYPE "MemberRole" ADD VALUE 'GUEST';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "visibility" "EventVisibility" NOT NULL DEFAULT 'MEMBERS_ONLY';
