import { supabase } from '@/integrations/supabase/client';
import { DocType, KycStatus, ParsedData, KycDocument } from '@/types/kyc';

export interface CreateKycDocumentData {
  user_id: string;
  doc_type: DocType;
  parsed: ParsedData;
  confidence: number;
  status: KycStatus;
  image_path?: string;
}

export const kycService = {
  // Create KYC document
  async createKycDocument(data: CreateKycDocumentData) {
    const insertData: any = {
      user_id: data.user_id,
      doc_type: data.doc_type,
      parsed: data.parsed as any,
      confidence: data.confidence,
      status: data.status,
    };
    
    if (data.image_path) {
      insertData.image_path = data.image_path;
    }

    const { data: doc, error } = await supabase
      .from('kyc_documents')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return doc as KycDocument;
  },

  // Get all KYC documents for a user
  async getUserKycDocuments(userId: string) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as KycDocument[];
  },

  // Get KYC document by type for a user
  async getUserKycDocumentByType(userId: string, docType: DocType) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('doc_type', docType)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as KycDocument | null;
  },

  // Update KYC document status (admin only)
  async updateKycDocumentStatus(docId: string, status: KycStatus, reason?: string) {
    const updates: any = { status };
    
    if (reason && status === 'REJECTED') {
      const { data: current } = await supabase
        .from('kyc_documents')
        .select('parsed')
        .eq('id', docId)
        .single();

      if (current && current.parsed) {
        updates.parsed = { ...(current.parsed as any), reject_reason: reason };
      }
    }

    const { data, error } = await supabase
      .from('kyc_documents')
      .update(updates)
      .eq('id', docId)
      .select()
      .single();

    if (error) throw error;
    return data as KycDocument;
  },

  // List all KYC documents (admin)
  async listAllKycDocuments(filters?: {
    status?: KycStatus[];
    docType?: DocType[];
  }) {
    let query = supabase
      .from('kyc_documents')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status?.length) {
      query = query.in('status', filters.status);
    }

    if (filters?.docType?.length) {
      query = query.in('doc_type', filters.docType);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data as KycDocument[];
  },

  // Get vehicle types for all drivers and couriers (admin only)
  async getAllVehicleTypes() {
    const { data: drivers, error: driverError } = await supabase
      .from('driver_profiles')
      .select('user_id, vehicle_type');

    const { data: couriers, error: courierError } = await supabase
      .from('courier_profiles')
      .select('user_id, vehicle_type');

    return {
      drivers: drivers || [],
      couriers: couriers || [],
      errors: {
        driverError,
        courierError
      }
    };
  },

  // Upload document image to storage
  async uploadDocumentImage(
    userId: string,
    docType: DocType,
    imageBlob: Blob
  ): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${docType}-${timestamp}.jpg`;
    const filePath = `${userId}/${fileName}`;

    const { error } = await supabase.storage
      .from('kyc')
      .upload(filePath, imageBlob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      // If bucket doesn't exist, return empty path (non-blocking)
      console.warn('Storage upload failed:', error);
      return '';
    }

    return filePath;
  },

  // Get signed URL for private document
  async getDocumentImageUrl(path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('kyc')
      .createSignedUrl(path, 60); // 60 seconds

    if (error) throw error;
    return data.signedUrl;
  },
};
