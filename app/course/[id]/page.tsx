"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Maximize,
  CheckCircle,
  Lock,
  BookOpen,
  Download,
} from "lucide-react"
import Link from "next/link"
import courseService from "@/services/course.service"
import { Course } from "@/types/course"
import { isGoogleDriveUrl } from "@/lib/utils"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

export default function CoursePage() {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0) // Will be set from fetched video
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (!id) return;

    const fetchCourse = async () => {
      try {
        setLoading(true);
        const fetchedCourse = await courseService.findOne(id as string);
        setCourse(fetchedCourse);
        // Assuming the first video is the main one for the course page
        if (fetchedCourse.videos && fetchedCourse.videos.length > 0) {
          // You might want to fetch video details if duration is not directly on the video object
          // For now, assuming duration is available or can be derived.
          setDuration(fetchedCourse.videos[0].duration || 0);
        }
      } catch (err) {
        console.error("Failed to fetch course:", err);
        setError("Kursni yuklashda xatolik yuz berdi.");
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  // Update video when currentVideoIndex changes
  useEffect(() => {
    if (videoRef.current && course?.videos && course.videos.length > 0) {
      videoRef.current.load();
    }
  }, [currentVideoIndex, course]);

  // Security measures for video protection
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && e.key.toLowerCase() === "p") ||
        (e.ctrlKey && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) ||
        e.key === "F12"
      ) {
        e.preventDefault();
      }
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Kurs yuklanmoqda...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  if (!course) {
    return <div className="min-h-screen flex items-center justify-center">Kurs topilmadi.</div>;
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Map server videos to client lessons structure for display
  const lessons = course.videos ? course.videos.map((video, index) => ({
    id: video._id,
    title: video.title,
    duration: video.duration ? `${Math.floor(video.duration / 60)} min` : 'N/A',
    completed: false, // This would come from user progress data
    locked: false, // This would come from user access data
    current: index === currentVideoIndex, // Current video indicator
  })) : [];

  // Get current video URL with streaming API yoki Google Drive preview
  const getVideoUrl = () => {
    if (!course.videos || course.videos.length === 0) return "/placeholder.svg";
    
    const currentVideo = course.videos[currentVideoIndex];
    const videoUrl = currentVideo.url || '';
    
    // Agar Google Drive linki bo'lsa, to'g'ridan-to'g'ri ishlatamiz
    if (isGoogleDriveUrl(videoUrl)) {
      return videoUrl; // Preview URL allaqachon formatida
    }
    
    // Aks holda streaming API orqali
    return `${API_URL}/video-stream/stream/${videoUrl.split("/").pop()}`;
  };

  const mainVideoUrl = getVideoUrl();
  const currentVideoIsGoogleDrive = course.videos && course.videos.length > 0 
    ? isGoogleDriveUrl(course.videos[currentVideoIndex]?.url || '')
    : false;

  const switchVideo = (index: number) => {
    if (course.videos && index >= 0 && index < course.videos.length) {
      setCurrentVideoIndex(index);
      setIsPlaying(false);
      setCurrentTime(0);
      // Force video reload with new URL
      if (videoRef.current) {
        videoRef.current.load();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden">
      {/* Orqa fon rasmi */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/fon.png"
          alt="Background"
              className="w-full h-full object-cover opacity-50"
          style={{ 
            minHeight: '100vh',
            transform: 'scale(1.2)',
            transformOrigin: 'center',
            maxHeight: '100vh'
          }}
        />
      </div>
      {/* Header */}
      <header className="bg-white border-b relative z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-gray-900">Kurs</h1>
          </Link>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-red-100 text-red-800">
              {course.category ? course.category.join(', ') : 'Kategoriya'}
            </Badge>
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                Bosh sahifaga qaytish
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Video Player */}
            <Card className="mb-6">
              <CardContent className="p-0">
                <div className="relative bg-black rounded-t-lg overflow-hidden">
                  {/* Watermark overlay */}
                  <div
                    className="absolute inset-0 z-10 pointer-events-none"
                    style={{
                      background:
                        'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' version=\'1.1\' height=\'100px\' width=\'100px\'><text x=\'0\' y=\'50\' fill=\'rgba(255,255,255,0.03)\' font-size=\'12\'>UYGUNLIK</text></svg>")',
                      backgroundRepeat: "repeat",
                    }}
                  />
                  <div className="aspect-video flex items-center justify-center">
                    {currentVideoIsGoogleDrive ? (
                      // Google Drive preview iframe
                      <iframe
                        src={mainVideoUrl}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media"
                        allowFullScreen
                        style={{ pointerEvents: 'auto' }}
                      />
                    ) : (
                      // Oddiy video player
                      <>
                        <video
                          ref={videoRef}
                          src={mainVideoUrl}
                          className="w-full h-full object-cover"
                          controls={false}
                          controlsList="nodownload"
                          disablePictureInPicture
                          playsInline
                          onLoadedMetadata={() => {
                            if (videoRef.current) {
                              setDuration(videoRef.current.duration);
                            }
                          }}
                          onTimeUpdate={() => {
                            if (videoRef.current) {
                              setCurrentTime(videoRef.current.currentTime);
                            }
                          }}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Button
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 rounded-full w-16 h-16"
                            onClick={() => {
                              if (videoRef.current) {
                                if (isPlaying) {
                                  videoRef.current.pause();
                                } else {
                                  videoRef.current.play();
                                }
                              }
                            }}
                          >
                            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center space-x-4 text-white">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                          }
                        }}
                      >
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          if (videoRef.current) {
                            if (isPlaying) {
                              videoRef.current.pause();
                            } else {
                              videoRef.current.play();
                            }
                          }
                        }}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-white hover:bg-white/20"
                        onClick={() => {
                          if (videoRef.current) {
                            videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
                          }
                        }}
                      >
                        <SkipForward className="h-4 w-4" />
                      </Button>

                      <div className="flex-1 flex items-center space-x-2">
                        <span className="text-sm">{formatTime(currentTime)}</span>
                        <Progress 
                          value={progressPercentage} 
                          className="flex-1 h-1 cursor-pointer"
                          onClick={(e) => {
                            if (videoRef.current && duration > 0) {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const clickX = e.clientX - rect.left;
                              const percentage = clickX / rect.width;
                              videoRef.current.currentTime = percentage * duration;
                            }
                          }}
                        />
                        <span className="text-sm">{formatTime(duration)}</span>
                      </div>

                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <Volume2 className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20">
                        <Maximize className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lesson Info */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl">{course.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      {course.category ? course.category.join(', ') : 'Kategoriya'} • {course.videos ? course.videos.length : 0} ta dars
                    </CardDescription>
                  </div>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Tugallanganini belgilash
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{course.description}</p>
              </CardContent>
            </Card>

            {/* Materials */}
            <Card>
              <CardHeader>
                <CardTitle>Dars materiallari</CardTitle>
                <CardDescription>Qo'shimcha materiallarni yuklab oling</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Assuming materials are part of the course object or fetched separately */}
                  {/* For now, using mock data or an empty array if not available */}
                  {course.videos ? course.videos.map((video, index) => (
                    <div key={video._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium">{video.title}</p>
                          <p className="text-sm text-gray-600">{video.duration ? `${Math.floor(video.duration / 60)} min` : 'N/A'}</p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Yuklab olish
                      </Button>
                    </div>
                  )) : null}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Darslar ro'yxati</CardTitle>
                <CardDescription>{course.title}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lessons.map((lesson, index) => (
                    <div
                      key={lesson.id}
                      onClick={() => switchVideo(index)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        lesson.current
                          ? "bg-red-50 border-red-200"
                          : lesson.completed
                            ? "bg-green-50 border-green-200 hover:bg-green-100"
                            : lesson.locked
                              ? "bg-gray-50 border-gray-200 cursor-not-allowed"
                              : "hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lesson.completed
                              ? "bg-green-600 text-white"
                              : lesson.current
                                ? "bg-red-600 text-white"
                                : lesson.locked
                                  ? "bg-gray-300 text-gray-500"
                                  : "bg-gray-200 text-gray-600"
                          }`}
                        >
                          {lesson.completed ? (
                            <CheckCircle className="h-3 w-3" />
                          ) : lesson.locked ? (
                            <Lock className="h-3 w-3" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${lesson.current ? "text-red-900" : "text-gray-900"}`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-600">{lesson.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* No next lesson logic as we are displaying all videos */}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

