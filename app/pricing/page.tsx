"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useUserStore } from "@/store/user.store";

export default function PricingPage() {
  const { user } = useUserStore();

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white relative overflow-hidden">
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
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-red-900">Narxlar</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-600 hover:text-red-800">
              Bosh sahifa
            </Link>
            <Link href="/#courses" className="text-gray-600 hover:text-red-800">
              Kurslar
            </Link>
            {user ? (
              <Link href="/dashboard" className="text-gray-600 hover:text-red-800">
                {user.first_name}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth"
                  className="text-gray-600 hover:text-red-800"
                >
                  Kirish
                </Link>
                <Link href="/auth">
                  <Button className="bg-red-800 hover:bg-red-900">
                    Ro'yxatdan o'tish
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-4 relative z-10">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-red-900 mb-6">
              O'zingizga mos tarifni tanlang
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Har bir tarif sizning ehtiyojlaringizga moslashtirilgan. Sifatli
              ta'lim va qo'llab-quvvatlash kafolatlanadi.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {/* STANDART */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="h-full"
            >
              <Card className="border-gray-200 h-full flex flex-col">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">STANDART</CardTitle>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    2.799.000 UZS
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">STM darslari</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Ayollik Fiqhi darslari</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Bonus dars "Yoni-steam"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        3 oy davomida kurs materiallariga kirish
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">1 to'liq hayz xaritasi kuzatuvi</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        Foydalanuvchi Sertifikati (o'rgatish huquqisiz)
                      </span>
                    </li>
                  </ul>
                  <Link href={`${user ? `https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men ${user.first_name} ${user.first_name} sizning STANDART kursingizni sotib olmoqchiman.` : '/auth'}`} className="block pt-4">
                    <Button className="w-full bg-red-800 hover:bg-red-900">
                      Sotib olish
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* OPTIMAL */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="h-full"
            >
              <Card className="border-red-500 h-full flex flex-col">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-red-900">OPTIMAL</CardTitle>
                  <div className="text-2xl font-bold text-red-800 mb-1">
                    3.799.000 UZS
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">STM darslari</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Ayollik Fiqhi darslari</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Bonus dars "Yoni-steam"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        Juftlar munosabati bo'yicha dars
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        4 oy davomida kurs materiallariga kirish
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">1 to'liq hayz xaritasi kuzatuvi</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        Foydalanuvchi Sertifikati (o'rgatish huquqisiz)
                      </span>
                    </li>
                  </ul>
                  <Link href={`${user ? `https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men ${user.first_name} ${user.first_name} sizning OPTIMAL kursingizni sotib olmoqchiman.` : '/auth'}`} className="block pt-4">
                    <Button className="w-full bg-red-800 hover:bg-red-900">
                      Sotib olish
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            {/* VIP */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="h-full"
            >
              <Card className="border-red-300 h-full flex flex-col">
                <CardHeader className="text-center">
                  <CardTitle className="text-xl text-red-900">VIP</CardTitle>
                  <div className="text-2xl font-bold text-red-800 mb-1">
                    4.799.000 UZS
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col justify-between">
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">STM darslari</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Ayollik Fiqhi darslari</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Bonus dars "Yoni-steam"</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        Juftlar munosabati bo'yicha dars
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">Sog'lom Ayollik Sirlari darsi</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        6 oy davomida kurs materiallariga kirish
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">3 to'liq hayz xaritasi kuzatuvi</span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm">
                        Foydalanuvchi Sertifikati (o'rgatish huquqisiz)
                      </span>
                    </li>
                    <li className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                      <span className="text-sm font-semibold text-red-600">
                        SOVG'A - ko'p martalik prokladka + maxsus termometr
                      </span>
                    </li>
                  </ul>
                  <Link href={`${user ? `https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men ${user.first_name} ${user.first_name} sizning VIP kursingizni sotib olmoqchiman.` : '/auth'}`} className="block pt-4">
                    <Button className="w-full bg-red-800 hover:bg-red-900">
                      Sotib olish
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 relative z-10">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-red-900 mb-4">
              Bugun o'z sog'ligingizga sarmoya kiriting!
            </h2>
            <p className="text-xl mb-8 text-gray-600">
              Minglab ayollar allaqachon o'z hayotlarini o'zgartirishdi. Siz
              ham qo'shiling!
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/auth">
                <Button
                  size="lg"
                  className="bg-red-800 hover:bg-red-900 text-lg px-8 py-3"
                >
                  Hoziroq boshlash
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 mt-16 relative z-10">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <h3 className="text-xl font-bold">Platform</h3>
              </div>
              <p className="text-gray-400">
                Ayollar uchun tabiiy va xavfsiz homiladorlik rejalashtirish
                kurslari.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Havolalar</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/#courses" className="hover:text-white transition-colors">
                    Kurslar
                  </Link>
                </li>
                <li>
                  <Link href="/#faq" className="hover:text-white transition-colors">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://t.me/uygunlik_uz"
                    target="_blank"
                    className="hover:text-white transition-colors"
                  >
                    Bog'lanish
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Yordam</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/terms" className="hover:text-white transition-colors">
                    Foydalanish shartlari
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition-colors">
                    Maxfiylik siyosati
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Aloqa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="mailto:info@uygunlik.uz"
                    className="hover:text-white transition-colors"
                  >
                    info@uygunlik.uz
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://t.me/uygunlik_uz"
                    target="_blank"
                    className="hover:text-white transition-colors"
                  >
                    Telegram: @uygunlik_uz
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 Platform. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}