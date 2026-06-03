export const PLAN_LIMITS = {
  free: {
    maxProjects: 3,
    maxPhotosPerProject: 3,
    pdfExport: "branded" as const,
    laborTracking: false,
    shoppingListExport: false,
    receiptUpload: false,
  },
  pro: {
    maxProjects: Infinity,
    maxPhotosPerProject: Infinity,
    pdfExport: "clean" as const,
    laborTracking: true,
    shoppingListExport: true,
    receiptUpload: true,
  },
} as const;

export const PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID!;
