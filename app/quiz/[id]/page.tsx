"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUserStore } from "@/store/user.store";
import LessonService from "@/services/lesson.service";
import api from "@/lib/api";
import { Lesson } from "@/types/lesson";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Trophy, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function QuizPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user, loading: userLoading } = useUserStore();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<Lesson | null>(null);
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

    const fetchLesson = async () => {
      try {
        setLoading(true);
        const fetchedLesson = await LessonService.findOne(id as string);
        if (!fetchedLesson || !fetchedLesson.test_questions || fetchedLesson.test_questions.length === 0) {
          toast.error("Ushbu dars uchun test mavjud emas.");
          router.back();
          return;
        }
        setLesson(fetchedLesson);
        setSelectedAnswers(new Array(fetchedLesson.test_questions.length).fill(-1));
      } catch (err) {
        toast.error("Testni yuklashda xatolik yuz berdi.");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id, user, userLoading, router]);

  const handleAnswerSelect = (optionIndex: number) => {
    const updatedAnswers = [...selectedAnswers];
    updatedAnswers[currentQuestionIndex] = optionIndex;
    setSelectedAnswers(updatedAnswers);
  };

  const handleNext = () => {
    if (lesson && currentQuestionIndex < lesson.test_questions!.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateAndSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const calculateAndSubmit = async () => {
    if (!lesson || !lesson.test_questions || !user) return;

    let totalScore = 0;
    lesson.test_questions.forEach((q, index) => {
      if (q.correctOptionIndex === selectedAnswers[index]) {
        totalScore++;
      }
    });

    setScore(totalScore);
    setShowResults(true);
    setSubmitting(true);

    try {
      await api.post("/tests/submit", {
        user_id: user.id,
        lesson_id: lesson.id,
        score: totalScore,
        total_questions: lesson.test_questions.length,
        answers: selectedAnswers.map((ans, idx) => ({
          question: lesson.test_questions![idx].question,
          selected: ans,
          correct: lesson.test_questions![idx].correctOptionIndex
        }))
      });
      toast.success("Test natijalari saqlandi!");
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("Natijani saqlashda xatolik yuz berdi.");
    } finally {
      setSubmitting(false);
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

  if (!lesson || !lesson.test_questions) return null;

  const currentQuestion = lesson.test_questions[currentQuestionIndex];
  const progressPercent = ((currentQuestionIndex + 1) / lesson.test_questions.length) * 100;

  if (showResults) {
    const isPassed = score / lesson.test_questions.length >= 0.7;

    return (
      <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
            <div className={`h-3 ${isPassed ? 'bg-green-500' : 'bg-[#5D1111]'}`} />
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#FEFBEE] text-[#5D1111] mb-4">
                {isPassed ? <Trophy className="h-12 w-12 text-yellow-500" /> : <ClipboardList className="h-12 w-12" />}
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-3xl font-serif font-bold text-[#5D1111]">
                  Test yakunlandi!
                </CardTitle>
                <p className="text-[#7A2E2E]/60">
                  {lesson.title} darsining test natijalari
                </p>
              </div>

              <div className="flex justify-center items-baseline gap-2">
                <span className="text-6xl font-bold text-[#5D1111]">{score}</span>
                <span className="text-2xl text-[#7A2E2E]/40">/ {lesson.test_questions.length}</span>
              </div>

              <div className="p-6 rounded-2xl bg-[#FEFBEE]/50 border border-[#7A2E2E]/10">
                <p className="text-[#5D1111] font-semibold">
                  Sizning ko'rsatkichingiz: {Math.round((score / lesson.test_questions.length) * 100)}%
                </p>
                <p className="text-sm text-[#7A2E2E]/70 mt-2">
                  {isPassed 
                    ? "Ajoyib natija! Siz darsni yaxshi o'zlashtirdingiz." 
                    : "Yaxshi urinish! Keyingi darslarda yanada diqqatli bo'ling."}
                </p>
              </div>

              <div className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => router.push(`/watch/${lesson.id}`)}
                  variant="outline"
                  className="rounded-xl h-14 border-[#7A2E2E]/20 text-[#5D1111] hover:bg-[#FEFBEE]"
                >
                  Darsga qaytish
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  className="rounded-xl h-14 bg-[#5D1111] hover:bg-[#7A2E2E] text-white shadow-lg"
                >
                  Qayta topshirish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFBEE] py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Progress Header */}
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-[#5D1111] font-serif text-2xl font-bold">{lesson.title}</h2>
              <p className="text-[#7A2E2E]/60 text-sm">Savol {currentQuestionIndex + 1} / {lesson.test_questions.length}</p>
            </div>
            <div className="text-right">
              <span className="text-[#5D1111] font-bold text-lg">{Math.round(progressPercent)}%</span>
            </div>
          </div>
          <div className="h-2 w-full bg-[#7A2E2E]/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#5D1111] transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Question Card */}
        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-white">
          <CardContent className="p-8 md:p-12 space-y-8">
            <div className="space-y-4">
              <span className="px-3 py-1 rounded-full bg-[#FEFBEE] text-[#5D1111] text-xs font-bold uppercase tracking-wider">
                Savol
              </span>
              <h3 className="text-2xl md:text-3xl font-serif font-bold text-[#5D1111] leading-tight">
                {currentQuestion.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {currentQuestion.options.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  className={`group flex items-center p-6 rounded-2xl border-2 transition-all text-left ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'border-[#5D1111] bg-[#FEFBEE]/30 ring-4 ring-[#5D1111]/5'
                      : 'border-[#7A2E2E]/10 hover:border-[#5D1111]/30 hover:bg-[#FEFBEE]/10'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 mr-4 transition-colors ${
                    selectedAnswers[currentQuestionIndex] === index
                      ? 'bg-[#5D1111] border-[#5D1111] text-white'
                      : 'border-[#7A2E2E]/20 text-[#7A2E2E]/40 group-hover:border-[#5D1111]/40'
                  }`}>
                    {String.fromCharCode(65 + index)}
                  </div>
                  <span className={`text-lg font-medium transition-colors ${
                    selectedAnswers[currentQuestionIndex] === index ? 'text-[#5D1111]' : 'text-[#7A2E2E]/80'
                  }`}>
                    {option}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-[#7A2E2E]/5">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                className="rounded-xl h-12 px-6 text-[#7A2E2E] hover:bg-[#FEFBEE] disabled:opacity-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Orqaga
              </Button>
              <Button
                onClick={handleNext}
                disabled={selectedAnswers[currentQuestionIndex] === -1}
                className="rounded-xl h-12 px-8 bg-[#5D1111] hover:bg-[#7A2E2E] text-white shadow-lg shadow-[#5D1111]/20 font-bold"
              >
                {currentQuestionIndex === lesson.test_questions.length - 1 ? 'Tugatish' : 'Keyingisi'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Footer */}
        <div className="text-center">
          <p className="text-[#7A2E2E]/40 text-sm italic">
            Barcha savollarga javob berganingizdan so'ng natijangiz avtomatik saqlanadi.
          </p>
        </div>
      </div>
    </div>
  );
}
