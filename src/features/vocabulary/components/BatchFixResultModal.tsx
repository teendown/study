'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import type { BatchFixResult } from '../services';

interface BatchFixResultModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  result: BatchFixResult | null;
  type?: 'words' | 'phrases';
}

export function BatchFixResultModal({
  open,
  onOpenChange,
  result,
  type = 'words',
}: BatchFixResultModalProps) {
  if (!result) return null;

  const itemLabel = type === 'words' ? '단어' : '숙어';
  const hasFixed = result.fixedCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl border-primary/20">
        {/* Header */}
        <DialogHeader className="p-5 pb-4 bg-gradient-to-r from-primary/10 via-primary/5 to-background border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <span>{itemLabel} 결함 정밀 검사 및 자동 교정 완료</span>
                {hasFixed ? (
                  <Badge className="bg-emerald-500 text-white font-bold hover:bg-emerald-600">
                    {result.fixedCount}개 수정됨
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-500/30">
                    100% 완벽함
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                총 {result.totalInspected}개의 {itemLabel} 항목을 정밀 진단하여 오탈자, 뜻 예문 섞임, 구두점 및 누락 정보를 정제했습니다.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* Summary Banner */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">검사 대상 목록</span>
              <span className="text-base font-extrabold text-foreground">{result.totalInspected}개</span>
            </div>
            <div className={`p-3.5 rounded-xl border flex items-center justify-between ${
              hasFixed
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                : 'bg-blue-500/10 border-blue-500/30 text-blue-900 dark:text-blue-200'
            }`}>
              <span className="text-xs font-semibold">자동 교정된 결함</span>
              <span className="text-base font-extrabold">{result.fixedCount}개</span>
            </div>
          </div>

          {!hasFixed ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2 bg-muted/20 rounded-xl border border-dashed border-border">
              <ShieldCheck className="h-12 w-12 text-emerald-500 mb-1" />
              <h4 className="font-bold text-base">수정이 필요한 오류가 없습니다!</h4>
              <p className="text-xs text-muted-foreground max-w-md">
                검사 대상 모든 {itemLabel}의 철자, 한국어 뜻, 예문 분리 및 부가 정보가 모두 깨끗하고 정확하게 작성되어 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                자동 교정 상세 내역 ({result.details.length}건)
              </h4>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {result.details.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-3.5 rounded-xl border border-border bg-card shadow-xs hover:border-primary/40 transition-all space-y-2"
                  >
                    {/* Item title & badges */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        {item.originalWord !== item.fixedWord ? (
                          <div className="flex items-center gap-1.5 font-bold text-foreground text-sm">
                            <span className="line-through text-muted-foreground">{item.originalWord}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="text-primary">{item.fixedWord}</span>
                          </div>
                        ) : (
                          <span className="font-bold text-foreground text-sm">{item.fixedWord}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 flex-wrap">
                        {item.reasons.map((reason, rIdx) => (
                          <Badge
                            key={rIdx}
                            variant="secondary"
                            className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                          >
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Meaning changes */}
                    {item.originalMeaning !== item.fixedMeaning && (
                      <div className="text-xs space-y-1 p-2 rounded-lg bg-muted/40 font-mono">
                        <div className="flex items-start gap-1 text-muted-foreground">
                          <span className="shrink-0 text-red-500 font-bold">- 기존:</span>
                          <span className="truncate">{item.originalMeaning || '(빈 뜻)'}</span>
                        </div>
                        <div className="flex items-start gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="shrink-0 text-emerald-500 font-bold">+ 교정:</span>
                          <span>{item.fixedMeaning}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 bg-muted/40 border-t border-border flex items-center justify-between">
          <p className="text-xs text-muted-foreground hidden sm:block">
            교정된 결과는 즉시 원격 서버(Turso DB)에 동기화되었습니다.
          </p>
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto font-bold px-6">
            확인 완료
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
