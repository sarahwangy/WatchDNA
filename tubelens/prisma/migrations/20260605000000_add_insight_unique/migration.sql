-- AddUniqueConstraint
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_userId_type_key" UNIQUE ("userId", "type");
