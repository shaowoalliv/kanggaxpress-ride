import { DocType, ParsedData } from '@/types/kyc';

/**
 * Normalize field names to lower_snake_case and map to strict schemas
 */
export function normalizeFieldName(key: string): string {
  return key
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

/**
 * Map parsed OCR data to strict schema based on document type
 */
export function mapFieldsToSchema(docType: DocType, rawParsed: any): ParsedData {
  switch (docType) {
    case 'GOVT_ID':
    case 'PRIVATE_ID':
      return {
        id_type: rawParsed.id_type || '',
        id_no: rawParsed.id_no || '',
        fullname: rawParsed.fullname || '',
        name_last: rawParsed.name_last || '',
        name_first: rawParsed.name_first || '',
        name_middle: rawParsed.name_middle || '',
        birthdate: rawParsed.birthdate || '',
        sex: rawParsed.sex || '',
        nationality: rawParsed.nationality || '',
        address_line1: rawParsed.address_line1 || '',
        address_line2: rawParsed.address_line2 || '',
        city: rawParsed.city || '',
        province: rawParsed.province || '',
        postal_code: rawParsed.postal_code || '',
        country: rawParsed.country || '',
        expiry_date: rawParsed.expiry_date || '',
        field_confidences: rawParsed.field_confidences || {},
      };

    case 'DRIVER_LICENSE':
      return {
        license_no: rawParsed.license_no || '',
        fullname: rawParsed.fullname || '',
        name_last: rawParsed.name_last || '',
        name_first: rawParsed.name_first || '',
        name_middle: rawParsed.name_middle || '',
        birthdate: rawParsed.birthdate || '',
        address_line1: rawParsed.address_line1 || '',
        address_line2: rawParsed.address_line2 || '',
        city: rawParsed.city || '',
        province: rawParsed.province || '',
        postal_code: rawParsed.postal_code || '',
        expiry_date: rawParsed.expiry_date || '',
        restrictions: rawParsed.restrictions || '',
        dl_codes: rawParsed.dl_codes || '',
        field_confidences: rawParsed.field_confidences || {},
      };

    case 'OR':
      return {
        or_no: rawParsed.or_no || '',
        plate_no: rawParsed.plate_no || '',
        owner_name: rawParsed.owner_name || '',
        vehicle_brand: rawParsed.vehicle_brand || '',
        vehicle_model: rawParsed.vehicle_model || '',
        vehicle_color: rawParsed.vehicle_color || '',
        transaction_date: rawParsed.transaction_date || '',
        amount_paid: rawParsed.amount_paid || '',
        field_confidences: rawParsed.field_confidences || {},
      };

    case 'CR':
      return {
        cr_no: rawParsed.cr_no || '',
        plate_no: rawParsed.plate_no || '',
        mv_file_no: rawParsed.mv_file_no || '',
        engine_no: rawParsed.engine_no || '',
        chassis_no: rawParsed.chassis_no || '',
        vehicle_type: rawParsed.vehicle_type || '',
        make: rawParsed.make || '',
        series_model: rawParsed.series_model || '',
        year_model: rawParsed.year_model || '',
        color: rawParsed.color || '',
        owner_name: rawParsed.owner_name || '',
        owner_address: rawParsed.owner_address || '',
        field_confidences: rawParsed.field_confidences || {},
      };

    case 'SELFIE':
      return {
        pose_hint: rawParsed.pose_hint || 'Face forward',
        lighting_hint: rawParsed.lighting_hint || 'Good lighting',
        notes: rawParsed.notes || '',
      };

    default:
      return { field_confidences: {} };
  }
}

/**
 * Get human-readable label for field name
 */
export function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    id_type: 'ID Type',
    id_no: 'ID Number',
    fullname: 'Full Name',
    name_last: 'Last Name',
    name_first: 'First Name',
    name_middle: 'Middle Name',
    birthdate: 'Birth Date',
    sex: 'Sex',
    nationality: 'Nationality',
    address_line1: 'Address Line 1',
    address_line2: 'Address Line 2',
    city: 'City',
    province: 'Province',
    postal_code: 'Postal Code',
    country: 'Country',
    expiry_date: 'Expiry Date',
    license_no: 'License Number',
    restrictions: 'Restrictions',
    dl_codes: 'DL Codes',
    or_no: 'OR Number',
    plate_no: 'Plate Number',
    owner_name: 'Owner Name',
    vehicle_brand: 'Vehicle Brand',
    vehicle_model: 'Vehicle Model',
    vehicle_color: 'Vehicle Color',
    transaction_date: 'Transaction Date',
    amount_paid: 'Amount Paid',
    cr_no: 'CR Number',
    mv_file_no: 'MV File Number',
    engine_no: 'Engine Number',
    chassis_no: 'Chassis Number',
    vehicle_type: 'Vehicle Type',
    make: 'Make',
    series_model: 'Series/Model',
    year_model: 'Year Model',
    color: 'Color',
    owner_address: 'Owner Address',
    pose_hint: 'Pose',
    lighting_hint: 'Lighting',
    notes: 'Notes',
  };

  return labels[fieldName] || fieldName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
