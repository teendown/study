'use client';

import { ArrowRight, SkipForward, Edit3, PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export type DuplicateActionType = 'skip' | 'update' | 'save_as_new';

export interface DuplicateChoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'word' | 'phrase';
  title: string; // 단어 또는 숙어 텍스트
  existingMeaning?: string;
  newMeaning?: string;
  onSelectAction: (action: DuplicateActionType) => Promise<void> | void;
}

export function DuplicateChoiceDialog({
  open,
  onOpenChange,
  type,
  title,
  existingMeaning,
  newMeaning,
  onSelectAction,
}: DuplicateChoiceDialogProps) {
  const typeLabel = type === 'word' ? '단어' : '숙어';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500 font-bold text-lg">
            <span>⚠️ 이미 등록된 {typeLabel}입니다</span>
          </DialogTitle>
          <DialogDescription className="text-sm text-foreground/80 pt-1">
            <strong className="text-primary font-bold text-base">&quot;{title}&quot;</strong> {typeLabel}이(가) 이미 단어장에 존재합니다. 어떻게 처리할까요?
          </DialogDescription>
        </DialogHeader>

        {/* 기존 내용 vs 새 내용 비교 카드 */}
        <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 space-y-2.5 my-1 text-xs">
          <div className="flex items-start justify-between gap-2">
            <span className="text-muted-foreground shrink-0 font-medium">기존 등록 뜻:</span>
            <span className="font-semibold text-foreground text-right">{existingMeaning || '(기존 뜻 없음)'}</span>
          </div>
          {newMeaning && newMeaning !== existingMeaning && (
            <div className="flex items-start justify-between gap-2 pt-2 border-t border-border/50 text-primary font-medium">
              <span className="shrink-0 flex items-center gap-1">
                <ArrowRight className="h-3 w-3" /> 새로 입력한 뜻:
              </span>
              <span className="font-bold text-right">{newMeaning}</span>
            </div>
          )}
        </div>

        {/* 3가지 선택 옵션 버튼 목록 */}
        <div className="space-y-2 pt-2">
          {/* 1. 기존 단어 수정 (덮어쓰기) */}
          <Button
            type="button"
            variant="default"
            className="w-full justify-start h-auto py-3 px-4 text-left font-normal bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={() => {
              onSelectAction('update');
              onOpenChange(false);
            }}
          >
            <Edit3 className="h-5 w-5 mr-3 shrink-0" />
            <div className="flex-1">
              <div className="font-bold text-sm">기존 {typeLabel} 내용 수정 (덮어쓰기)</div>
              <div className="text-[11px] opacity-85">기존 {typeLabel}의 뜻과 예문을 지금 입력한 내용으로 업데이트합니다.</div>
            </div>
          </Button>

          {/* 2. 새로 추가 저장 (중복 허용) */}
          <Button
            type="button"
            variant="secondary"
            className="w-full justify-start h-auto py-3 px-4 text-left font-normal border border-primary/20 hover:bg-primary/10"
            onClick={() => {
              onSelectAction('save_as_new');
              onOpenChange(false);
            }}
          >
            <PlusCircle className="h-5 w-5 mr-3 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-bold text-sm text-foreground">새로 추가 저장 (중복 등록)</div>
              <div className="text-[11px] text-muted-foreground">기존 {typeLabel}은 그대로 두고, 새 항목으로 한 번 더 추가합니다.</div>
            </div>
          </Button>

          {/* 3. 건너뛰기 (취소) */}
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start h-auto py-2.5 px-4 text-left font-normal text-muted-foreground hover:text-foreground"
            onClick={() => {
              onSelectAction('skip');
              onOpenChange(false);
            }}
          >
            <SkipForward className="h-4 w-4 mr-3 shrink-0" />
            <div className="flex-1">
              <div className="font-semibold text-xs">건너뛰기 (등록 안 함)</div>
            </div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
