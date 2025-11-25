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
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(value || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setPreview(value || '');
  }, [value]);

  const resetState = () => {
    setError('');
    setDragActive(false);
  };

  const validateFile = (file) => {
    if (!file) {
      setError('ไม่พบไฟล์ที่เลือก');
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setError(`กรุณาอัปโหลดไฟล์ประเภท ${allowedTypes.join(', ')}`);
      return false;
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`ขนาดไฟล์ต้องไม่เกิน ${maxSizeMB}MB (ปัจจุบัน ${formatMB(file.size)}MB)`);
      return false;
    }

    setError('');
    return true;
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
          reject(
            `สัดส่วนไฟล์ควรใกล้เคียง ${recommendedRatio.width}:${recommendedRatio.height} (ปัจจุบัน ${(ratio).toFixed(2)}:1)`
          );
        } else {
          resolve();
        }
      };
      img.onerror = () => reject('ไม่สามารถอ่านขนาดรูปภาพได้');
      img.src = dataUrl;
    });

  const handleFile = async (file) => {
    if (!validateFile(file)) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result;
      if (!dataUrl) return;

      try {
        await validateAspectRatio(file, dataUrl);
      } catch (ratioError) {
        setError(typeof ratioError === 'string' ? ratioError : ratioError?.message);
        return;
      }

      try {
        setUploading(true);
        const uploadedUrl = await onUpload(file);
        setPreview(uploadedUrl || dataUrl);
        setError('');
      } catch (uploadError) {
        setError(uploadError?.message || 'เกิดข้อผิดพลาดระหว่างอัปโหลด');
      } finally {
        setUploading(false);
      }
    };

    reader.onerror = () => setError('ไม่สามารถอ่านไฟล์จากเครื่องได้');
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
      {error && <p className="field__error">{error}</p>}
    </div>
  );
}

export default AssetDropzone;
