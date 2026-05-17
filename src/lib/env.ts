export function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getInvoiceStoragePath() {
  return process.env.INVOICE_STORAGE_PATH ?? "./storage/invoices";
}

export function getPhotoStoragePath() {
  return process.env.PHOTO_STORAGE_PATH ?? "./storage/properties";
}
