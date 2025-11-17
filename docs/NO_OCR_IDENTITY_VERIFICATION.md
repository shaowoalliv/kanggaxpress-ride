# Identity Verification - Photo Capture Only

## Change Log - 2025-11-17

### ✅ OCR Removed from Identity Verification

The Identity Verification section on `/auth` registration now uses **simple photo capture only** with NO OCR processing.

### What Changed:

1. **Replaced OcrCaptureCard with PhotoCaptureCard**
   - Government ID: Simple photo capture/upload
   - Selfie Photo: Simple photo capture/upload
   
2. **Removed OCR Logic**
   - No text recognition
   - No confidence scores
   - No auto-fill from ID scanning
   - No OCR error messages
   
3. **Simplified Flow**
   ```
   User taps camera button → Camera/file picker opens → 
   Photo captured → Stored in state → Success message shown
   ```

4. **What Users See**
   - Camera icon button (mobile-first, 48px tap target)
   - "or Upload File" option
   - Success indicator when photo captured
   - No OCR processing or errors

### Files Modified:

- `src/pages/auth/Auth.tsx`:
  - Removed `OcrCaptureCard` import
  - Removed `OcrReviewModal` import  
  - Removed `handleOcrComplete` function
  - Removed `handleOcrAccept` function
  - Removed `kycStaged` state (OCR data)
  - Removed `reviewModal` state
  - Added `photosStaged` state (simple images)
  - Added `handlePhotoCapture` function
  - Updated passenger registration to upload photos without OCR data

### KYC Database Records:

Photos are still uploaded to `kyc_documents` table with:
- `image_path`: Full path to stored image
- `parsed`: Empty object `{}` (no OCR data)
- `confidence`: `1.0` (no OCR confidence needed)
- `status`: `'PENDING'` (for admin review)

### Testing:

✅ No OCR errors
✅ Photo capture works on mobile
✅ File upload works
✅ Success messages shown
✅ Photos uploaded to Supabase Storage
✅ KYC records created without OCR data
✅ Registration completes successfully

### User Experience:

**Before (with OCR):**
1. Tap camera → OCR processing → Possible errors → Review modal → Accept
2. Errors like "OCR failed" or "Failed to process document"
3. Waiting for OCR to complete

**After (no OCR):**
1. Tap camera → Photo captured → Success
2. No OCR errors
3. Instant feedback

Simple, fast, reliable! 🎉
