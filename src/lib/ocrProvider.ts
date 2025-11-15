import Tesseract from 'tesseract.js';
import { DocType, ParsedData, FieldConfidence } from '@/types/kyc';

const OCR_CONFIDENCE_MIN = Number(import.meta.env.VITE_OCR_CONFIDENCE_MIN) || 0.65;

export interface OcrResult {
  text: string;
  confidence: number;
  parsed: ParsedData;
}

// Extract common patterns from OCR text
function extractPattern(text: string, pattern: RegExp): string | undefined {
  const match = text.match(pattern);
  return match ? match[1]?.trim() : undefined;
}

// Parse based on document type
function parseByDocType(text: string, docType: DocType): ParsedData {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  switch (docType) {
    case 'GOVT_ID':
    case 'PRIVATE_ID':
      return {
        id_no: extractPattern(text, /(?:ID|NO|NUMBER)[:\s]*([A-Z0-9-]+)/i),
        fullname: extractPattern(text, /(?:NAME|FULL NAME)[:\s]*([A-Z\s]+)/i),
        birthdate: extractPattern(text, /(?:BIRTH|DOB|DATE OF BIRTH)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i),
        sex: extractPattern(text, /(?:SEX|GENDER)[:\s]*(M|F|MALE|FEMALE)/i),
        address_line1: extractPattern(text, /(?:ADDRESS|ADD)[:\s]*([^\n]+)/i),
        expiry_date: extractPattern(text, /(?:EXPIRY|VALID UNTIL|EXPIRES)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i),
        field_confidences: {},
      };

    case 'DRIVER_LICENSE':
      return {
        license_no: extractPattern(text, /(?:LICENSE|LIC|DL)[:\s#]*([A-Z0-9-]+)/i),
        fullname: extractPattern(text, /(?:NAME|FULL NAME)[:\s]*([A-Z\s]+)/i),
        birthdate: extractPattern(text, /(?:BIRTH|DOB|DATE OF BIRTH)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i),
        address_line1: extractPattern(text, /(?:ADDRESS|ADD)[:\s]*([^\n]+)/i),
        expiry_date: extractPattern(text, /(?:EXPIRY|VALID UNTIL|EXPIRES)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i),
        restrictions: extractPattern(text, /(?:RESTRICTIONS?|RESTR)[:\s]*([A-Z0-9,\s]+)/i),
        field_confidences: {},
      };

    case 'OR':
      return {
        or_no: extractPattern(text, /(?:OR|OFFICIAL RECEIPT)[:\s#]*([A-Z0-9-]+)/i),
        plate_no: extractPattern(text, /(?:PLATE|PLATE NO)[:\s]*([A-Z0-9-]+)/i),
        owner_name: extractPattern(text, /(?:OWNER|NAME)[:\s]*([A-Z\s]+)/i),
        vehicle_brand: extractPattern(text, /(?:MAKE|BRAND)[:\s]*([A-Z\s]+)/i),
        transaction_date: extractPattern(text, /(?:DATE|TRANSACTION DATE)[:\s]*(\d{2}[-/]\d{2}[-/]\d{4})/i),
        field_confidences: {},
      };

    case 'CR':
      return {
        cr_no: extractPattern(text, /(?:CR|CERTIFICATE)[:\s#]*([A-Z0-9-]+)/i),
        plate_no: extractPattern(text, /(?:PLATE|PLATE NO)[:\s]*([A-Z0-9-]+)/i),
        engine_no: extractPattern(text, /(?:ENGINE|ENGINE NO)[:\s]*([A-Z0-9-]+)/i),
        chassis_no: extractPattern(text, /(?:CHASSIS|CHASSIS NO)[:\s]*([A-Z0-9-]+)/i),
        make: extractPattern(text, /(?:MAKE)[:\s]*([A-Z\s]+)/i),
        color: extractPattern(text, /(?:COLOR)[:\s]*([A-Z\s]+)/i),
        owner_name: extractPattern(text, /(?:OWNER|REGISTERED OWNER)[:\s]*([A-Z\s]+)/i),
        field_confidences: {},
      };

    case 'SELFIE':
      return {
        pose_hint: 'Face forward',
        lighting_hint: 'Good lighting detected',
        notes: 'Selfie captured successfully',
      };

    default:
      return { field_confidences: {} };
  }
}

export async function performOcr(
  imageSource: string | File | Blob,
  docType: DocType
): Promise<OcrResult> {
  try {
    const { data } = await Tesseract.recognize(imageSource, 'eng', {
      logger: (m) => {
        if (m.status === 'recognizing text') {
          console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const confidence = data.confidence / 100; // Normalize to 0-1
    const parsed = parseByDocType(data.text, docType);

    return {
      text: data.text,
      confidence,
      parsed,
    };
  } catch (error) {
    console.error('OCR Error:', error);
    throw new Error('Failed to process document');
  }
}

export function isConfidenceAcceptable(confidence: number): boolean {
  return confidence >= OCR_CONFIDENCE_MIN;
}

export function getConfidenceThreshold(): number {
  return OCR_CONFIDENCE_MIN;
}
