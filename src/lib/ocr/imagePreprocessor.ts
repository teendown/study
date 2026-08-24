// ===========================
// OCR Image Preprocessing Pipeline (Canvas-based)
// ===========================
// 모바일/카메라 사진의 그림자 제거, 대비 극대화, 선명화, 흑백 이진화로 OCR 인식률 극대화

/**
 * 이미지를 OCR 인식에 최적화된 고대비/선명화 캔버스 이미지로 전처리합니다.
 */
export async function preprocessImageForOcr(
  imageSource: File | Blob | string
): Promise<string> {
  return new Promise((resolve) => {
    // 1. Image 엘리먼트 로드
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
          return;
        }

        // 2. 해상도 최적화 (가로 기준 최소 1800px ~ 최대 2600px 유지)
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        const TARGET_MIN_WIDTH = 1800;
        const TARGET_MAX_WIDTH = 2600;

        if (width < TARGET_MIN_WIDTH) {
          const scale = TARGET_MIN_WIDTH / width;
          width = TARGET_MIN_WIDTH;
          height = Math.round(height * scale);
        } else if (width > TARGET_MAX_WIDTH) {
          const scale = TARGET_MAX_WIDTH / width;
          width = TARGET_MAX_WIDTH;
          height = Math.round(height * scale);
        }

        canvas.width = width;
        canvas.height = height;

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0, width, height);

        // 3. 픽셀 데이터 추출
        const imgData = ctx.getImageData(0, 0, width, height);
        const data = imgData.data;
        const totalPixels = width * height;

        // 4. 그레이스케일 변환 및 평균 밝기 계산
        let totalBrightness = 0;
        for (let i = 0; i < data.length; i += 4) {
          // 가중치 그레이스케일 (ITU-R BT.709)
          const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
          totalBrightness += gray;
        }

        const avgBrightness = totalBrightness / totalPixels;

        // 5. 적응형 대비 강화 및 텍스처 노이즈 제거 (Shadow Removal & Contrast Stretching)
        // 종이 배경의 그림자나 어두운 조명을 밝히고 글자는 더 진하게
        const contrastFactor = 1.35;
        const thresholdMid = avgBrightness * 0.95;

        for (let i = 0; i < data.length; i += 4) {
          let v = data[i];

          // 대비 스트레칭
          v = (v - thresholdMid) * contrastFactor + 128;

          // 부드러운 이진화 보정 (글자 검정색화, 배경 흰색화)
          if (v > 150) {
            v = Math.min(255, v + 40); // 배경을 깨끗한 흰색에 가깝게
          } else if (v < 110) {
            v = Math.max(0, v - 40); // 글자를 더 진한 검정색으로
          }

          data[i] = v;
          data[i + 1] = v;
          data[i + 2] = v;
        }

        ctx.putImageData(imgData, 0, 0);

        // 6. 결과 반환 (고품질 PNG DataURL)
        const processedDataUrl = canvas.toDataURL('image/png', 0.95);
        resolve(processedDataUrl);
      } catch (err) {
        console.warn('Preprocessing canvas error, falling back to original:', err);
        resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
      }
    };

    img.onerror = () => {
      resolve(typeof imageSource === 'string' ? imageSource : URL.createObjectURL(imageSource));
    };

    if (typeof imageSource === 'string') {
      img.src = imageSource;
    } else {
      img.src = URL.createObjectURL(imageSource);
    }
  });
}
