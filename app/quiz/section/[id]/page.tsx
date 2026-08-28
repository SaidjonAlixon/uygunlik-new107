"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Trophy, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

type QuizQuestion = {
  question: string;
  options: string[];
  correctOptionIndex: number;
};

export default function SectionQuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user) {
      router.push("/auth");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const sid = Number(id);
        const res = await api.get(`/sections/${sid}/quiz`, {
          params: { user_id: user.id },
        });
        const data = res.data;
        const qs = data.questions || [];
        if (!qs.length) {
          toast.error("Bo'lim testi mavjud emas.");
          router.back();
          return;
        }

        if (data.attempt?.hasAttempt && !data.attempt?.canRetake) {
          setBlocked(true);
          setTitle(data.title);
          setSectionId(data.section_id);
          setQuestions(qs);
          setScore(data.attempt.submission?.score ?? 0);
          setShowResults(true);
          return;
        }

        setTitle(data.title);
        setSectionId(data.section_id);
        setQuestions(qs);
        setSelectedAnswers(new Array(qs.length).fill(-1));
      } catch {
        toast.error("Testni yuklashda xatolik.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user, userLoading, router]);

  const calculateAndSubmit = async () => {
    if (!user || !sectionId || !questions.length) return;
    let totalScore = 0;
    questions.forEach((q, index) => {
      if (q.correctOptionIndex === selectedAnswers[index]) totalScore++;
    });
    setScore(totalScore);
    setShowResults(true);
    setSubmitting(true);
    try {
      await api.post("/tests/submit", {
        user_id: user.id,
        section_id: sectionId,
        score: totalScore,
        total_questions: questions.length,
        answers: selectedAnswers.map((ans, idx) => {
          const q = questions[idx];
          return {
            question: q.question,
            options: q.options,
            selected: ans,
            selectedText: ans >= 0 && q.options?.[ans] ? q.options[ans] : "—",
            correct: q.correctOptionIndex,
            correctText: q.options?.[q.correctOptionIndex] || "—",
            isCorrect: ans === q.correctOptionIndex,
          };
        }),
      });
      toast.success("Test natijalari saqlandi!");
      setBlocked(true);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-[#FEFBEE] flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-[#5D1111]" />
      </div>
    );
  }

  if (showResults) {
    const total = questions.length || 1;
    const isPassed = score / total >= 0.7;
    return (
      <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <div className={`h-3 ${isPassed ? "bg-green-500" : "bg-[#5D1111]"}`} />
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FEFBEE]">
                {isPassed ? (
                  <Trophy className="h-12 w-12 text-yellow-500" />
                ) : (
                  <ClipboardList className="h-12 w-12 text-[#5D1111]" />
                )}
              </div>
              <CardTitle className="text-3xl font-serif font-bold text-[#5D1111]">
                Bo&apos;lim testi yakunlandi
              </CardTitle>
              <p className="text-[#7A2E2E]/60">{title}</p>
              <div className="flex justify-center items-baseline gap-2">
                <span className="text-6xl font-bold text-[#5D1111]">{score}</span>
                <span className="text-2xl text-[#7A2E2E]/40">/ {total}</span>
              </div>
              {blocked && (
                <p className="text-sm text-[#7A2E2E]/80 bg-[#FEFBEE] rounded-xl p-4">
                  Bu testni faqat 1 marta ishlash mumkin. Qayta ishlash uchun admin ruxsati kerak.
                </p>
              )}
              <Button
                onClick={() => router.push(sectionId ? `/dashboard?section=${sectionId}` : "/dashboard")}
                className="rounded-xl h-14 bg-[#5D1111] hover:bg-[#7A2E2E] text-white"
              >
                Dashboardga qaytish
              </Button>
              {submitting && <p className="text-sm text-[#7A2E2E]/60">Saqlanmoqda...</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!questions.length) return null;
  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-[#5D1111] font-serif text-2xl font-bold">{title}</h2>
              <p className="text-[#7A2E2E]/60 text-sm">Bo&apos;lim yakuniy testi</p>
            </div>
            <span className="text-[#5D1111] font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-2 w-full bg-[#7A2E2E]/10 rounded-full overflow-hidden">
            <div className="h-full bg-[#5D1111]" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
        <Card className="border-none shadow-2xl rounded-3xl bg-white">
          <CardContent className="p-8 md:p-12 space-y-8">
            <h3 className="text-xl md:text-2xl font-semibold text-[#5D1111]">
              {currentQuestion.question}
            </h3>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => {
                    const next = [...selectedAnswers];
                    next[currentQuestionIndex] = index;
                    setSelectedAnswers(next);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border-2 ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? "border-[#5D1111] bg-[#FEFBEE]"
                      : "border-[#7A2E2E]/10"
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <Button
                variant="outline"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((i) => i - 1)}
                className="rounded-xl"
              >
                Orqaga
              </Button>
              <Button
                disabled={selectedAnswers[currentQuestionIndex] < 0 || submitting}
                onClick={() => {
                  if (currentQuestionIndex < questions.length - 1) {
                    setCurrentQuestionIndex((i) => i + 1);
                  } else {
                    void calculateAndSubmit();
                  }
                }}
                className="rounded-xl bg-[#5D1111] text-white"
              >
                {currentQuestionIndex === questions.length - 1 ? "Yakunlash" : "Keyingi"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
