"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FEFBEE] text-gray-800 relative overflow-hidden">
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
          <Link href="/" className="flex items-center space-x-2">
                       <h1 className="text-2xl font-bold text-gray-900"></h1>
          </Link>
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Bosh sahifaga qaytish
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl relative z-10">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-red-900 mb-8 text-center">
            Foydalanish shartlari
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6 text-center">
              <strong>Oxirgi yangilanish:</strong> 2025-yil 19-sentabr
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">1. Umumiy qoidalar</h2>
              <p className="text-gray-700 mb-4">
                Ushbu foydalanish shartlari platformasi (keyingi o'rinlarda "Platforma" yoki "Xizmat") 
                foydalanuvchilari uchun amal qiladi. Platformadan foydalanish orqali siz ushbu shartlarni to'liq 
                qabul qilganingizni bildirasiz.
              </p>
              <p className="text-gray-700 mb-4">
                Agar siz ushbu shartlar bilan rozi bo'lmasangiz, platformadan foydalanishni to'xtating.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">2. Xizmat haqida</h2>
              <p className="text-gray-700 mb-4">
                Platformasi ayollar uchun tabiiy va xavfsiz homiladorlik rejalashtirish kurslarini 
                taqdim etadi. Platforma quyidagi xizmatlarni o'z ichiga oladi:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Simptotermal Metod (STM) bo'yicha onlayn kurs</li>
                <li>Video darslar va o'quv materiallari</li>
                <li>Mutaxassislardan maslahat olish imkoniyati</li>
                <li>Jamiyat va qo'llab-quvvatlash guruhi</li>
                <li>Shaxsiy kuzatuv jurnallari</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">3. Foydalanuvchi majburiyatlari</h2>
              <p className="text-gray-700 mb-4">
                Platformadan foydalanishda quyidagi qoidalarga rioya qilishingiz shart:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>To'g'ri va to'liq ma'lumotlar berish</li>
                <li>Platforma xavfsizligini buzmaslik</li>
                <li>Boshqa foydalanuvchilarga nisbatan hurmatli munosabatda bo'lish</li>
                <li>Mualliflik huquqlarini buzmaslik</li>
                <li>Video darsliklarni ko'chirish, ekrandan yozib olish qat'iyan man etiladi</li>
                <li>Platforma qoidalariga amal qilish</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">4. Maxfiylik va ma'lumotlar himoyasi</h2>
              <p className="text-gray-700 mb-4">
                Biz sizning shaxsiy ma'lumotlaringizni himoya qilish uchun barcha zarur choralarni ko'ramiz:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Shaxsiy ma'lumotlar faqat xizmat ko'rsatish uchun ishlatiladi</li>
                <li>Ma'lumotlar uchinchi shaxslarga o'tkazilmaydi</li>
                <li>Xavfsizlik protokollariga qat'iy rioya qilinadi</li>
                <li>Siz o'z ma'lumotlaringizni istalgan vaqtda o'chirish huquqiga egasiz</li>
              </ul>
            </section>

            
            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">5. Mas'uliyat cheklashlari</h2>
              <p className="text-gray-700 mb-4">
                Platforma faqat ma'lumot berish va o'quv materiallarini taqdim etish uchun javobgar. 
                Tibbiy maslahat berilmaydi va har qanday tibbiy muammolar uchun mutaxassis shifokorga 
                murojaat qilish tavsiya etiladi.
              </p>
              <p className="text-gray-700 mb-4">
                Platforma texnik uzilishlar, server muammolari yoki boshqa kutilmagan holatlar uchun 
                javobgar emas.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">6. Shartlarni o'zgartirish</h2>
              <p className="text-gray-700 mb-4">
                Biz ushbu shartlarni istalgan vaqtda o'zgartirish huquqini o'z zimmamizga olamiz. 
                O'zgarishlar platformada e'lon qilinadi va darhol kuchga kiradi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">7. Aloqa ma'lumotlari</h2>
              <p className="text-gray-700 mb-4">
                Savollar yoki shikoyatlar uchun biz bilan bog'laning:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-2">
                <li>Telegram: @stm_kurs</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-red-800 mb-4">8. Qonuniy asos</h2>
              <p className="text-gray-700 mb-4">
                Ushbu shartlar O'zbekiston Respublikasi qonunlari asosida tuzilgan va ularga muvofiq 
                talqin qilinadi.
              </p>
            </section>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-gray-500 text-center">
                © 2025 Platform. Barcha huquqlar himoyalangan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
