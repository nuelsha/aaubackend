import Partnership from "../Models/partnershipModel.js";
import { sendNotification } from "./sendNotification.js";

export async function notifyExpiringPartnerships() {
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  // Find partnerships expiring in 30 days
  const partnerships = await Partnership.find({
    potentialStartDate: { $exists: true },
    durationOfPartnership: { $exists: true },
    status: "Active",
  });
  for (const p of partnerships) {
    // Calculate expiration date
    const years = parseInt(p.durationOfPartnership);
    if (!years || isNaN(years)) continue;
    const expiration = new Date(p.potentialStartDate);
    expiration.setFullYear(expiration.getFullYear() + years);
    // If expiring in 30 days
    if (
      expiration > now &&
      expiration <= in30Days
    ) {
      await sendNotification({
        title: "Partnership Expiring Soon",
        message: `The partnership with ${p.partnerInstitution.name} will expire in 30 days.`,
        type: "Alerts",
      });
    }
  }
} 