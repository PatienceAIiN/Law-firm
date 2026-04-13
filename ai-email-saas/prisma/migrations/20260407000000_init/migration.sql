-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "emails" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "category" TEXT,
    "provider_name" TEXT,
    "npi" TEXT,
    "confidence" INTEGER,
    "actionable" BOOLEAN DEFAULT false,
    "missing_docs" TEXT,
    "summary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "routing_mode" TEXT,
    "ticket_id" TEXT,
    "send_attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "emails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "npi" TEXT NOT NULL,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "logs" (
    "id" TEXT NOT NULL,
    "email_id" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "emails_message_id_key" ON "emails"("message_id");

-- CreateIndex
CREATE INDEX "logs_email_id_idx" ON "logs"("email_id");

-- AddForeignKey
ALTER TABLE "logs" ADD CONSTRAINT "logs_email_id_fkey" FOREIGN KEY ("email_id") REFERENCES "emails"("id") ON DELETE SET NULL ON UPDATE CASCADE;
