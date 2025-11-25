import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const formatMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2);

function AssetDropzone({
  label,
  description,
  value,
  onUpload,
  onRemove,
  maxSizeMB = 5,
  allowedTypes = DEFAULT_TYPES,
  recommendedRatio,
  recommendedText,
}) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const [uploadState, setUploadState] = useState({ type: 'idle', message: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(value || '');
    if (value) {
      setUploadState({ type: 'success', message: 'อัปโหลดสำเร็จแล้ว' });
    } else {
      setUploadState({ type: 'idle', message: '' });
    }
  }, [value]);

  const resetState = () => {
    setError(null);
    setDragActive(false);
    setUploadState({ type: 'idle', message: '' });
  };

  const buildError = (code, extra = {}) => ({ code, ...extra });

  const getErrorMessage = (errorState) => {
    if (!errorState) return '';

    switch (errorState.code) {
      case 'unsupported_type':
        return `ไม่รองรับประเภทไฟล์นี้ รองรับ ${allowedTypes.join(', ')}`;
      case 'file_too_large':
        return `ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB (ปัจจุบัน ${formatMB(errorState.size)}MB)`;
      case 'invalid_ratio': {
        const ratioText = (errorState.ratio || 0).toFixed(2);
        return `สัดส่วนไฟล์ควรใกล้เคียง ${recommendedRatio.width}:${recommendedRatio.height} (ปัจจุบัน ${ratioText}:1)`;
      }
      case 'unreadable_file':
        return 'ไม่สามารถอ่านไฟล์จากเครื่องได้';
      case 'no_file':
        return 'ไม่พบไฟล์ที่เลือก';
      case 'upload_failed':
        return errorState.message || 'เกิดข้อผิดพลาดระหว่างอัปโหลด';
      default:
        return errorState.message || 'เกิดข้อผิดพลาด';
    }
  };

  const validateFile = (file) => {
    if (!file) {
      return buildError('no_file');
    }

    if (!allowedTypes.includes(file.type)) {
      return buildError('unsupported_type');
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return buildError('file_too_large', { size: file.size });
    }

    return null;
  };

  const validateAspectRatio = (file, dataUrl) =>
    new Promise((resolve, reject) => {
      if (!recommendedRatio) {
        resolve();
        return;
      }

      const img = new Image();
      img.onload = () => {
        const ratio = img.width / img.height;
        const expected = recommendedRatio.width / recommendedRatio.height;
        const delta = Math.abs(ratio - expected);
        const tolerance = 0.05; // allow small deviation
        if (delta > tolerance) {
          reject(buildError('invalid_ratio', { ratio }));
        } else {
          resolve();
        }
      };
      img.onerror = () => reject(buildError('unreadable_file'));
      img.src = dataUrl;
    });

  const handleFile = async (file) => {
    setError(null);
    setUploadState({ type: 'uploading', message: 'กำลังอัปโหลดไฟล์...' });

    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setUploadState({ type: 'error', message: getErrorMessage(validationError) });
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (!dataUrl) return;

      try {
        await validateAspectRatio(file, dataUrl);
      } catch (ratioError) {
        setError(ratioError);
        setUploadState({ type: 'error', message: getErrorMessage(ratioError) });
        return;
      }

      try {
        setUploading(true);
        const uploadedUrl = await onUpload(file);
        setPreview(uploadedUrl || dataUrl);
        setError(null);
        setUploadState({ type: 'success', message: 'อัปโหลดสำเร็จแล้ว' });
      } catch (uploadError) {
        const errorState = buildError('upload_failed', { message: uploadError?.message });
        setError(errorState);
        setUploadState({ type: 'error', message: getErrorMessage(errorState) });
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => {
      const nextError = buildError('unreadable_file');
      setError(nextError);
      setUploadState({ type: 'error', message: getErrorMessage(nextError) });
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleClick = () => fileInputRef.current?.click();

  return (
    <div className="field">
      {label && (
        <div className="field__label" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <span>{label}</span>
          {recommendedText && <span className="field__hint">{recommendedText}</span>}
        </div>
      )}
      {description && <p className="field__hint">{description}</p>}
      <div
        className={`upload-dropzone${dragActive ? ' is-active' : ''}`}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={label || 'อัปโหลดไฟล์'}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={allowedTypes.join(',')}
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div style={{ position: 'relative', width: '100%' }}>
            <img
              src={preview}
              alt="Preview"
              style={{ width: '100%', maxHeight: 240, objectFit: 'contain', borderRadius: '12px' }}
            />
            {onRemove && (
              <button
                type="button"
                className="btn btn--ghost btn--small"
                style={{ position: 'absolute', top: 10, right: 10 }}
                onClick={(e) => {
                  e.stopPropagation();
                  resetState();
                  onRemove();
                }}
              >
                ลบรูป
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="upload-dropzone__icon" aria-hidden="true">{uploading ? '⏳' : '📁'}</div>
            <p className="upload-dropzone__title">{uploading ? 'กำลังอัปโหลด...' : 'คลิกหรือลากไฟล์มาวางที่นี่'}</p>
            <p className="upload-dropzone__hint">
              รองรับ {allowedTypes.join(', ')} (สูงสุด {maxSizeMB}MB)
            </p>
            {recommendedText && <p className="upload-dropzone__hint">แนะนำ: {recommendedText}</p>}
          </div>
        )}
      </div>
      {uploadState.message && (
        <p
          className={`field__hint${uploadState.type === 'error' ? ' field__error' : ''}`}
          style={{ marginTop: 8 }}
        >
          {uploadState.message}
        </p>
      )}
      {error && <p className="field__error">{getErrorMessage(error)}</p>}
    </div>
  );
}

export default AssetDropzone;
