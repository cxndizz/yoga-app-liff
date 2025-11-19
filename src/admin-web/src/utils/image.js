export function convertImageFileToWebP(file, options = {}) {
  const { quality = 0.85, maxSizeMB = 4 } = options;

  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('กรุณาเลือกรูปภาพ'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น'));
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      return reject(new Error(`ไฟล์ควรมีขนาดไม่เกิน ${maxSizeMB}MB`));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('ไม่สามารถแปลงรูปเป็น WebP ได้'));
              return;
            }

            const blobReader = new FileReader();
            blobReader.onloadend = () => {
              resolve({ dataUrl: blobReader.result, size: blob.size });
            };
            blobReader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
            blobReader.readAsDataURL(blob);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
      img.src = event.target?.result;
    };

    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์จากเครื่องได้'));
    reader.readAsDataURL(file);
  });
}
