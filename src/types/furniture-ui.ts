export type ImageUI = {
  id?: string; // DB ID (server)

  // client-side stable identity (REQUIRED)
  clientId: string;

  // file system
  file?: File;

  // server value / preview
  url: string;

  isPrimary: boolean;

  isDeleted?: boolean;
};

export type VariantUI = {
  id?: string; // DB ID (server)

  // client-side stable identity (REQUIRED)
  clientId: string;

  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  isActive: boolean;

  materialFile?: File;

  previewUrl?: string;

  isDeleted?: boolean;

  sortOrder?: number;
};