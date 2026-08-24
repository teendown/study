'use client';

import { useState } from 'react';
import { BookOpen, Copy, Check, Volume2, Sparkles, FileText, BookmarkPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { extractEnglishPhrases } from '@/lib/ocr/phraseDictionary';

interface OcrPassageReviewProps {
  initialPassageText: string;
  sentences: string[];
  onSavePassage?: (passageData: { title: string; content: string; source: string }) => Promise<void>;
  onCancel: () => void;
}

export function OcrPassageReview({
  initialPassageText,
  sentences,
  onSavePassage,
  onCancel,
}: OcrPassageReviewProps) {
  const [title, setTitle] = useState('영어 지문 ' + new Date().toLocaleDateString('ko-KR'));
  const [content, setContent] = useState(initialPassageText);
  const [source, setSource] = useState('교재 OCR');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSpeak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    setIsSaving(true);
    try {
      if (onSavePassage) {
        await onSavePassage({
          title: title.trim() || '영어 지문',
          content: content.trim(),
          source: source.trim() || '교재 OCR',
        });
      } else {
        handleCopy();
        alert('본문 텍스트가 클립보드에 복사되었습니다!');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const detectedPhrases = extractEnglishPhrases(content);

  return (
    <div className="space-y-4 max-h-[75vh] flex flex-col">
      {/* 상단 정보 */}
      <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-primary flex items-center gap-1">
            <FileText className="h-4 w-4" /> 완성형 본문
          </span>
          <span className="text-xs text-muted-foreground">
            (총 <strong className="text-foreground">{wordCount}</strong>단어, <strong className="text-foreground">{sentences.length}</strong>개 문장, <strong className="text-indigo-600 dark:text-indigo-400">{detectedPhrases.length}</strong>개 숙어 판독)
          </span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="h-7 text-xs gap-1 font-medium"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            {isCopied ? '복사됨' : '본문 복사'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSpeak(content)}
            className="h-7 text-xs gap-1 text-muted-foreground hover:text-primary"
          >
            <Volume2 className="h-3.5 w-3.5" />
            전체 듣기
          </Button>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto flex-1 pr-1">
        {/* 지문 제목 & 출처 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <Label htmlFor="passage-title" className="text-xs font-semibold">
              지문 제목
            </Label>
            <Input
              id="passage-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 2026 수능특강 영어 3강 1번"
              className="h-8 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="passage-source" className="text-xs font-semibold">
              출처
            </Label>
            <Input
              id="passage-source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="교재명, 모의고사 등"
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* 전체 본문 텍스트 에디터 */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="passage-content" className="text-xs font-semibold flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-500" /> 영어 본문 (수정 가능)
            </Label>
            <span className="text-[10px] text-muted-foreground">오탈자가 있다면 직접 편집할 수 있습니다</span>
          </div>
          <Textarea
            id="passage-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            className="text-xs leading-relaxed font-sans bg-background"
            placeholder="인식된 영어 본문이 이곳에 표시됩니다..."
          />
        </div>

        {/* 자동 판독된 숙어 미리보기 */}
        {detectedPhrases.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <BookmarkPlus className="h-3.5 w-3.5" /> 자동 판독된 필수 숙어 ({detectedPhrases.length}개)
            </Label>
            <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border border-indigo-500/20 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs">
              {detectedPhrases.map((p) => (
                <span
                  key={p.phrase}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded bg-background border border-border text-[11px]"
                  title={p.meaning}
                >
                  <strong className="text-foreground">{p.phrase}</strong>
                  <span className="text-muted-foreground">({p.meaning})</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 문장별 분리 뷰 (학습용) */}
        {sentences.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-muted-foreground">
              문장별 분리 목록 ({sentences.length}개)
            </Label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-border p-2 bg-muted/20 text-xs">
              {sentences.map((s, idx) => (
                <div key={idx} className="flex items-start gap-2 group hover:bg-muted/40 p-1 rounded">
                  <span className="text-[10px] font-bold text-primary shrink-0 w-4 pt-0.5">{idx + 1}.</span>
                  <p className="flex-1 text-foreground leading-relaxed">{s}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground"
                    onClick={() => handleSpeak(s)}
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 하단 저장/취소 버튼 */}
      <div className="flex gap-2 pt-2 border-t border-border shrink-0">
        <Button variant="outline" className="flex-1" onClick={onCancel} disabled={isSaving}>
          취소
        </Button>
        <Button className="flex-1 font-bold gap-1.5" onClick={handleSave} disabled={isSaving || !content.trim()}>
          <BookOpen className="h-4 w-4" />
          {isSaving ? '저장 중...' : '본문 복사 및 저장'}
        </Button>
      </div>
    </div>
  );
}
