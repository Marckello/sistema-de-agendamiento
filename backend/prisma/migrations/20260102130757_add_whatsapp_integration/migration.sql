-- CreateEnum
CREATE TYPE "WhatsAppStatus" AS ENUM ('DISCONNECTED', 'CONNECTING', 'QR_READY', 'AUTHENTICATED', 'CONNECTED', 'SLEEPING');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('IN', 'OUT');

-- CreateTable
CREATE TABLE "whatsapp_sessions" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" "WhatsAppStatus" NOT NULL DEFAULT 'DISCONNECTED',
    "phone" TEXT,
    "pushName" TEXT,
    "sessionData" JSONB,
    "dailyMessageCount" INTEGER NOT NULL DEFAULT 0,
    "lastMessageAt" TIMESTAMP(3),
    "dailyLimitReached" BOOLEAN NOT NULL DEFAULT false,
    "autoConnectEnabled" BOOLEAN NOT NULL DEFAULT false,
    "connectAt" TEXT,
    "disconnectAt" TEXT,
    "reminderEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder24hEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminder1hEnabled" BOOLEAN NOT NULL DEFAULT true,
    "reminderMessage24h" TEXT NOT NULL DEFAULT 'Hola {clientName}, te recordamos tu cita de {serviceName} mañana a las {time}. 📅',
    "reminderMessage1h" TEXT NOT NULL DEFAULT 'Hola {clientName}, tu cita de {serviceName} es en 1 hora ({time}). ¡Te esperamos! 🕐',
    "autoReplyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "autoReplyMessage" TEXT NOT NULL DEFAULT 'Gracias por tu mensaje. Te responderemos pronto.',
    "totalMessagesSent" INTEGER NOT NULL DEFAULT 0,
    "totalMessagesReceived" INTEGER NOT NULL DEFAULT 0,
    "connectedAt" TIMESTAMP(3),
    "disconnectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_message_logs" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "messageType" TEXT NOT NULL DEFAULT 'text',
    "appointmentId" TEXT,
    "isReminder" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_message_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_sessions_tenantId_key" ON "whatsapp_sessions"("tenantId");

-- CreateIndex
CREATE INDEX "whatsapp_message_logs_sessionId_createdAt_idx" ON "whatsapp_message_logs"("sessionId", "createdAt");

-- CreateIndex
CREATE INDEX "whatsapp_message_logs_phone_idx" ON "whatsapp_message_logs"("phone");

-- AddForeignKey
ALTER TABLE "whatsapp_message_logs" ADD CONSTRAINT "whatsapp_message_logs_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "whatsapp_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
