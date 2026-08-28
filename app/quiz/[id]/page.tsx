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

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [title, setTitle] = useState("");
  const [sourceLessonId, setSourceLessonId] = useState<number | null>(null);
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
        const lessonId = Number(id);
        const quizRes = await api.get(`/lessons/${lessonId}/quiz`, {
          params: { user_id: user.id },
        });
        const data = quizRes.data;
        const qs = data.questions || [];
        if (!qs.length) {
          toast.error("Ushbu dars uchun test mavjud emas.");
          router.back();
          return;
        }

        if (data.attempt?.hasAttempt && !data.attempt?.canRetake) {
          setBlocked(true);
          setTitle(data.title);
          setSourceLessonId(data.lesson_id);
          setQuestions(qs);
          setScore(data.attempt.submission?.score ?? 0);
          setShowResults(true);
          return;
        }

        setTitle(data.title);
        setSourceLessonId(data.lesson_id);
        setQuestions(qs);
        setSelectedAnswers(new Array(qs.length).fill(-1));
      } catch {
        toast.error("Testni yuklashda xatolik yuz berdi.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user, userLoading, router]);

  const handleAnswerSelect = (optionIndex: number) => {
    const updatedAnswers = [...selectedAnswers];
    updatedAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(updatedAnswers);
  };

  const calculateAndSubmit = async () => {
    if (!user || !sourceLessonId || !questions.length) return;

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
        lesson_id: sourceLessonId,
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
      toast.error(err?.response?.data?.error || "Natijani saqlashda xatolik.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      void calculateAndSubmit();
    }
  };

  if (loading || userLoading) {
    return (
      <div className="min-h-screen bg-[#FEFBEE] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-[#5D1111] mx-auto" />
          <p className="text-[#5D1111] font-medium">Test tayyorlanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!questions.length && !showResults) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const progressPercent = questions.length
    ? ((currentQuestionIndex + 1) / questions.length) * 100
    : 0;

  if (showResults) {
    const total = questions.length || 1;
    const isPassed = score / total >= 0.7;

    return (
      <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <div className={`h-3 ${isPassed ? "bg-green-500" : "bg-[#5D1111]"}`} />
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FEFBEE] text-[#5D1111] mb-4">
                {isPassed ? (
                  <Trophy className="h-12 w-12 text-yellow-500" />
                ) : (
                  <ClipboardList className="h-12 w-12" />
                )}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl font-serif font-bold text-[#5D1111]">
                  {blocked ? "Test yakunlangan" : "Test yakunlandi!"}
                </CardTitle>
                <p className="text-[#7A2E2E]/60">{title}</p>
              </div>
              <div className="flex justify-center items-baseline gap-2">
                <span className="text-6xl font-bold text-[#5D1111]">{score}</span>
                <span className="text-2xl text-[#7A2E2E]/40">/ {total}</span>
              </div>
              {blocked && (
                <p className="text-sm text-[#7A2E2E]/80 bg-[#FEFBEE] rounded-xl p-4 border border-[#7A2E2E]/10">
                  Bu testni faqat 1 marta ishlash mumkin. Qayta ishlash uchun admin ruxsati kerak.
                </p>
              )}
              <div className="pt-4">
                <Button
                  onClick={() => router.push(`/watch/${id}`)}
                  className="rounded-xl h-14 w-full sm:w-auto px-8 bg-[#5D1111] hover:bg-[#7A2E2E] text-white"
                >
                  Darsga qaytish
                </Button>
              </div>
              {submitting && (
                <p className="text-sm text-[#7A2E2E]/60">Saqlanmoqda...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-[#5D1111] font-serif text-2xl font-bold">{title}</h2>
              <p className="text-[#7A2E2E]/60 text-sm">
                Savol {currentQuestionIndex + 1} / {questions.length}
              </p>
            </div>
            <span className="text-[#5D1111] font-bold text-lg">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div className="h-2 w-full bg-[#7A2E2E]/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#5D1111] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-[#FEFBEE] text-[#5D1111] text-xs font-bold uppercase tracking-wider">
                Savol
              </span>
              <h3 className="text-xl md:text-2xl font-semibold text-[#5D1111] leading-snug">
                {currentQuestion.question}
              </h3>
            </div>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAnswerSelect(index)}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? "border-[#5D1111] bg-[#FEFBEE] shadow-md"
                      : "border-[#7A2E2E]/10 hover:border-[#7A2E2E]/30 bg-white"
                  }`}
                >
                  <span className="font-medium text-[#5D1111]">{option}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
                className="rounded-xl"
              >
                Orqaga
              </Button>
              <Button
                type="button"
                disabled={selectedAnswers[currentQuestionIndex] < 0 || submitting}
                onClick={handleNext}
                className="rounded-xl bg-[#5D1111] hover:bg-[#7A2E2E] text-white"
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
