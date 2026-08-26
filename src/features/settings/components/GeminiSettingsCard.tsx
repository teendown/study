'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Key, CheckCircle2, AlertCircle, ExternalLink, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey, getBuiltinDefaultKey } from '@/lib/ai/geminiService';

export function GeminiSettingsCard() {
  const [apiKey, setApiKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'checking' | 'valid' | 'invalid' | 'unknown'>('unknown');

  useEffect(() => {
    const key = getGeminiApiKey();
    if (key) {
      setApiKey(key);
      setKeyStatus('checking');
      testGeminiApiKey(key).then((res) => {
        setKeyStatus(res.success ? 'valid' : 'invalid');
        if (!res.success && res.message) {
          setTestResult(res);
        }
      });
    }
  }, []);

  const handleSave = () => {
    setGeminiApiKey(apiKey);
    setIsSaved(true);
    setKeyStatus('checking');
    testGeminiApiKey(apiKey).then((res) => {
      setKeyStatus(res.success ? 'valid' : 'invalid');
      setTestResult(res);
    });
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleTest = async () => {
    if (!apiKey.trim()) {
      setTestResult({ success: false, message: 'API 키를 먼저 입력해주세요.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    const res = await testGeminiApiKey(apiKey);
    setIsTesting(false);
    setTestResult(res);
    setKeyStatus(res.success ? 'valid' : 'invalid');
  };

  const handleResetToDefault = () => {
    const defaultKey = getBuiltinDefaultKey();
    setGeminiApiKey('');
    setApiKey(defaultKey);
    setTestResult(null);
    setKeyStatus('checking');
    testGeminiApiKey(defaultKey).then((res) => {
      setKeyStatus(res.success ? 'valid' : 'invalid');
      setTestResult(res);
    });
  };

  const handleRemove = () => {
    setGeminiApiKey('');
    setApiKey('');
    setTestResult(null);
    setKeyStatus('unknown');
  };

  return (
    <Card className="border-primary/40 shadow-xs bg-linear-to-br from-card via-card to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            Google Gemini AI 사전 &amp; 지문 번역 설정
          </CardTitle>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
          >
            무료 API 키 발급받기
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <CardDescription className="text-xs">
          Google AI (Gemini 3.6 Flash)를 연동하여 영단어 의미, 정확한 한글 발음, 지문 고품질 번역을 자동 수행합니다. (모든 기기 기본 내장 지원)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3.5 text-sm">

        {keyStatus === 'valid' && (
          <div className="p-2.5 rounded-lg text-xs flex items-center gap-2 bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>✨ Gemini AI 3.6 Flash 연결 정상! 번역 및 단어 분석이 활성화되어 있습니다.</span>
          </div>
        )}

        {keyStatus === 'checking' && (
          <div className="p-2.5 rounded-lg text-xs flex items-center gap-2 bg-muted/50 text-muted-foreground border border-border/50">
            <RefreshCw className="h-3.5 w-3.5 animate-spin shrink-0" />
            <span>AI 연결 상태 확인 중...</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold flex items-center gap-1.5 text-foreground/90">
            <Key className="h-3.5 w-3.5 text-primary" />
            Gemini API Key
          </label>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="AQ.Ab8... 또는 AIzaSy..."
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                setTestResult(null);
                setKeyStatus('unknown');
              }}
              className="font-mono text-xs h-9 bg-background/80"
            />
            <Button
              size="sm"
              onClick={handleSave}
              className="font-bold text-xs h-9 shrink-0"
            >
              {isSaved ? '저장됨 ✓' : '저장'}
            </Button>
          </div>
        </div>

        {/* 연동 테스트 & 복원 액션 */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={isTesting}
              className="text-xs h-8 font-semibold gap-1.5"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  연결 확인 중...
                </>
              ) : (
                '연결 테스트'
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetToDefault}
              className="text-xs h-8 text-primary hover:bg-primary/10"
            >
              기본 키로 재설정
            </Button>
            {apiKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-xs h-8 text-muted-foreground hover:text-destructive"
              >
                키 삭제
              </Button>
            )}
          </div>

          <span className="text-[11px] text-muted-foreground">
            * 키 미설정 시 내장 표준 사전 &amp; 자동 폴백 작동
          </span>
        </div>

        {/* 테스트 결과 안내 */}
        {testResult && (
          <div
            className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
