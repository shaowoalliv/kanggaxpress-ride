export type DocType = 'GOVT_ID' | 'PRIVATE_ID' | 'DRIVER_LICENSE' | 'OR' | 'CR' | 'SELFIE';
export type KycStatus = 'PENDING' | 'REVIEW' | 'APPROVED' | 'REJECTED';

export interface FieldConfidence {
  [field: string]: number;
}

export interface GovtIdData {
  id_type?: string;
  id_no?: string;
  fullname?: string;
  name_last?: string;
  name_first?: string;
  name_middle?: string;
  birthdate?: string;
  sex?: string;
  nationality?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
  expiry_date?: string;
  field_confidences?: FieldConfidence;
}

export interface DriverLicenseData {
  license_no?: string;
  fullname?: string;
  name_last?: string;
  name_first?: string;
  name_middle?: string;
  birthdate?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  expiry_date?: string;
  restrictions?: string;
  dl_codes?: string;
  field_confidences?: FieldConfidence;
}

export interface ORData {
  or_no?: string;
  plate_no?: string;
  owner_name?: string;
  vehicle_brand?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  transaction_date?: string;
  amount_paid?: string;
  field_confidences?: FieldConfidence;
}

export interface CRData {
  cr_no?: string;
  plate_no?: string;
  mv_file_no?: string;
  engine_no?: string;
  chassis_no?: string;
  vehicle_type?: string;
  make?: string;
  series_model?: string;
  year_model?: string;
  color?: string;
  owner_name?: string;
  owner_address?: string;
  field_confidences?: FieldConfidence;
}

export interface SelfieData {
  pose_hint?: string;
  lighting_hint?: string;
  notes?: string;
}

export type ParsedData = GovtIdData | DriverLicenseData | ORData | CRData | SelfieData;

export interface KycDocument {
  id: string;
  user_id: string;
  doc_type: DocType;
  parsed: ParsedData;
  confidence: number;
  status: KycStatus;
  image_path?: string;
  created_at: string;
  updated_at: string;
}
