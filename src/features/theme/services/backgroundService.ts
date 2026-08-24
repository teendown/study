// ===========================
// Custom Background Wallpaper & Theme Management Service
// ===========================
// 사용자 갤러리/로컬 사진 업로드, 압축 저장, 오버레이 밝기 및 블러 조절, 프리셋 테마

export interface BackgroundConfig {
  type: 'default' | 'custom' | 'preset';
  customImageUrl?: string;
  presetId?: string;
  overlayOpacity: number; // 0.1 ~ 0.95 (기본: 0.85)
  blur: number; // 0 ~ 10 (기본: 1)
}

export const PRESET_BACKGROUNDS = [
  {
    id: 'nature',
    name: '싱그러운 숲길',
    description: '눈이 편안한 자연 힐링 풍경',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=300&q=60',
  },
  {
    id: 'space',
    name: '신비로운 은하수',
    description: '집중력을 높여주는 우주 밤하늘',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=300&q=60',
  },
  {
    id: 'library',
    name: '아늑한 클래식 서재',
    description: '도서관에 온 듯한 몰입감',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=60',
  },
  {
    id: 'cherry',
    name: '봄날 벚꽃길',
    description: '화사하고 기분 좋은 감성 테마',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=300&q=60',
  },
  {
    id: 'night_city',
    name: '모던 시티 야경',
    description: '세련된 도시 불빛 배경',
    url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1920&q=80',
    thumb: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=300&q=60',
  },
];

const STORAGE_KEY_BG = 'study_quest_bg_config_v1';
export const BG_CHANGE_EVENT = 'study_quest_bg_changed';

export const DEFAULT_BG_CONFIG: BackgroundConfig = {
  type: 'default',
  overlayOpacity: 0.85,
  blur: 1,
};

/**
 * 로컬스토리지에서 현재 배경 설정 조회
 */
export function getBackgroundConfig(): BackgroundConfig {
  if (typeof window === 'undefined') return DEFAULT_BG_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_BG);
    if (!raw) return DEFAULT_BG_CONFIG;
    return { ...DEFAULT_BG_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BG_CONFIG;
  }
}

/**
 * 배경 설정 저장 및 실시간 이벤트 발생
 */
export function saveBackgroundConfig(config: BackgroundConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_BG, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(BG_CHANGE_EVENT, { detail: config }));
  } catch (err) {
    console.error('Failed to save background config:', err);
  }
}

/**
 * 사용자 이미지 파일 리사이즈 및 DataURL 변환 (최대 1920x1080 고품질 압축)
 */
export function processCustomImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 업로드할 수 있습니다.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context 생성 실패'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // JPEG/WebP 0.85 퀄리티 압축
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('이미지를 로드하지 못했습니다.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('파일을 읽지 못했습니다.'));
    reader.readAsDataURL(file);
  });
}
