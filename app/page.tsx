"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Shield,
  Users,
  Award,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Minus,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useUserStore } from "@/store/user.store";

// Loading Screen Component
const LoadingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [showScrollHint, setShowScrollHint] = useState(false);

  useEffect(() => {
    // Darhol scroll belgisini ko'rsatish
    setShowScrollHint(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Har qanday scroll harakatida loading ni tugatish
      onComplete();
    };

    const handleWheel = () => {
      // Mouse wheel scroll
      onComplete();
    };

    const handleTouchMove = () => {
      // Touch scroll (mobile)
      onComplete();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Klaviatura scroll (arrow keys, space, page down)
      if (['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'PageUp'].includes(e.key)) {
        onComplete();
      }
    };

    if (showScrollHint) {
      window.addEventListener('scroll', handleScroll);
      window.addEventListener('wheel', handleWheel);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showScrollHint, onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-[#FEFBEE] flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.5,
          ease: "easeOut"
        }}
        className="text-center"
      >
        <motion.img
          src="/images/logo-main.png"
          alt="Platform Logo"
          className="h-40 md:h-56 lg:h-64 mx-auto mb-8"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{
            duration: 0.4,
            delay: 0.1,
            ease: "easeOut"
          }}
        />

        {/* Scroll qilish belgisi */}
        <AnimatePresence>
          {showScrollHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="mt-8 flex flex-col items-center text-[#5D1111]"
            >
              <motion.div
                className="flex flex-col items-center gap-2"
                animate={{ y: [0, 8, 0] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#5D1111]"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#5D1111] -mt-4"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// FAQ Accordion Component
const FAQAccordion = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems((prev) =>
      prev.includes(index)
        ? prev.filter((item) => item !== index)
        : [...prev, index]
    );
  };

  const faqData = [
    {
      question: "Metod qanchalik ishonchli? Homilador bo'lib qolmaymanmi?",
      answer: `Simptotermal metod - ayol tabiatiga mos, ilmiy asoslangan va 99,6% aniqlikka ega usuldir. Agar er-xotin o‘z fertilligini (nasl qoldirish qobiliyatini) aniq va mas'uliyat bilan kuzatib borsa, homiladorlikni tabiiy ravishda rejalashtirish imkoniga ega bo‘ladi. Natija bevosita juftlikning qoidalarga bo‘lgan intizomiga bog‘liq.`,
    },
    {
      question: "Spiralim bor, kursda qatnashish uchun oldirishim kerakmi?",
      answer: `Spiral va boshqa sun'iy vositalar organizmning tabiiy ritmini buzadi. Metoddan to'liq foydalanish uchun tanani begona jism va gormonlardan xoli qilish tavsiya etiladi.`,
    },
    {
      question: `Metodni tug'ruqdan keyin, hayz ko'rmay turib ham, emizikli davrda qo'llay olamanmi?`,
      answer: `Albatta. Kuzatuvlarga asoslanib, barcha ayollar tug'ruqdan keyingi 3 haftada fertil (unumdor) bo'lmasliklari aniqlangan. Undan keyingi davrda, emizishning to'liq yoki aralash ekanligiga qarab, STM qoidalari bo'yicha kuzatuvni boshlashingiz mumkin.`,
    },
    {
      question:
        "Hali turmushga chiqmagan qiz bolaman. Kurs men uchun foydali bo'ladimi?",
      answer: `Bu kursda har bir qiz va ayol bilishi shart bo'lgan hayz ilmi, o'ziga g'amxo'rlik qilish, hayz davrining har kunida - tana, hissiyotlar, va garmonlardagi tabiiy o'zgarishlarni kuzatish va tushunish kabi muhim bilimlar beriladi. Turmush qurishdan avval o'z tanangizni, ayollik tabiatingizni chuqurroq anglab, uning ritmiga mos yashashni o'rganish - bo'lajak sog'lom homiladorlikka tayyorgarlik bo'lishi bilan birga, kelajakda dunyoga keladigan qiz farzandingiz tarbiyasida ham bebaho poydevor bo'lib xizmat qiladi. Bu - nafaqat bugungi salomatligingizga, balki ertangi avlodingizga ham qaratilgan eng dono sarmoyalardan biridir.`,
    },
    {
      question: "Homiladorman, kursda ishtirok etsam bo'ladimi?",
      answer: `Homiladorlik har bir ayol uchun ajoyib davr. Bu vaqtni to'laligicha sog'lom tug'ruqqa tayyorlanish, bolaning ilk kunlaridagi parvarish va to'g'ri emizishga qaratganingiz afzal. Agar, 40 kun chilla davridan keyin, o'zingizni tayyor deb xisoblasangiz, kursda qatnashish uchun murojaat qilishingiz mumkin.`,
    },
    {
      question: "Metodni qo'llashda maxsus termometr kerakmi? Termometrda doimiy o'lchash shartmi?",
      answer: `Metod o'z nomi bilan "simpto" – belgi, "termal" – harorat, bo'lgani uchun, haroratingizni doimiy o'lchash juda muhim. Buning uchun maxsus termometrlar bor, lekin topolmasangiz, oddiy simob termometrdan ham foydalansangiz bo'ladi.`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-4 sm:px-6">
      {faqData.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-red-100 overflow-hidden"
        >
          <button
            onClick={() => toggleItem(index)}
            className="w-full p-6 text-left flex items-center justify-between hover/50 transition-colors duration-300"
          >
            <h3 className="text-lg font-semibold text-red-900 pr-4">
              {item.question}
            </h3>
            <div className="flex-shrink-0 text-red-600">
              {openItems.includes(index) ? (
                <Minus className="h-6 w-6" />
              ) : (
                <Plus className="h-6 w-6" />
              )}
            </div>
          </button>
          <AnimatePresence>
            {openItems.includes(index) && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-6 pt-2">
                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

// Reviews Carousel komponenti
const ReviewsCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [expandedReviews, setExpandedReviews] = useState<Set<number>>(new Set());

  const reviews = [
    {
      name: "Asiya Ameen",
      handle: "@Ameenasiyaa",
      initial: "A",
      text: "Bismillah! Kurs haqidagi taassurotlarim judayam ijobiy. Uzoq yozib o'tirmiyman, bitta qilib etganda manga bu kurs bergan eng ASOSIY narsa ANIQLIK bo'ldi. Ko'nglim shunaqangi hotirjamki endi nimani qachon qanaqa qilish kereligini bilaman. O'z sog'ligimga zarar qilib saqlanuvchi vositalardan davomiy foydalanishdan qutulganimga va tanamga avvalgidan ko'ra ko'proq yaqinlashganimga o'zimni judayam yaxshi his qivomman. Undan tashqari kursning asosiy mavzusidan tashqari berilgan qo'shimcha ma'lumotlarning sifatiga ham gap yo'q. Aslida ular bo'lmaganda ham, faqat metodning o'zi haqida o'rgatilganda ham yetib ortardi kurs foydali bo'lishiga, lekin muallif judayam shedriy bo'ganlari uchun o'quvchilarga ham o'zlaridan, ham boshqa mutaxassislardan ayol sog'ligi uchun eng dolzarb bo'lgan mavzularni qo'shgani nur ustiga a'lo nur bo'lgan. Bu kursda o'rganganlarim sababli endi man havotirli Asiyadan, hotirjam Asiyaga aylanvomman Allohning izni bilan. Tashkillashtirgan Nozima opamga Robbim ikki dunyo barakasini yog'dirsin amiyn! Farzandli bo'lishni reja qilayotganlar ham, va tanaffus olishni reja qilayotganlar ham BIRDEK foydalana oladigan mahsulot bo'lgan. Chin dilimdan har bir ayol/qiz uchun tavsiya qilaman!",
    },
    {
      name: "Dildora Baxtiyorovna",
      handle: "@hafiza_my",
      initial: "D",
      text: "Tabiiylikka avvaldan qiziqardim lekin sizni darslarizdan keyin organizmimiz naqadar mukammal ekanligini va biz sezmagan ahamiyat bermagan holatda ichimizda qancha o'zgarishlar, naslni davom ettrish uchun kurashlar bo'lib o'tar ekanligini bildim. Shunchaki hayratdaman.Biz esa faqat va faqat o'zimizni noqis aqlimiz bilan mukammal tizimga qanaqdir simlar (spiral) tiqib bu jarayonni toxtatmoqchi bolamiz. Aslida shunchaki tanamizni eshitish biroz etiborli bo'lish va qanday yaratilgan bolsak shunday yashab bersak boldi ekan❤️ Va avvaldan aytilganidek bu sehrli tayoqcha emas, natijaga erishish uchun mehnat, sabr va intizom kerak ekan. Meni tarbiyalagan jihatlari aynan shu har kuni ertaroq yotishga, sifatli uyquga, bir vaqtda turishga odatlantirdi. Fiqh darslari uchun alohida rahmat. Ozimcha bilaman deb yurardim 90% bu ilmlarni bilmas ekanman. Yana shu kunlarda eshitgan eng hayratlanarli gaplarimdan boshqa davlatlarda saqlanish uchun ayol va erkak teng harakat qilishi va bazan erkak borib urug' chiqmaydigan qilib operatsiya qilib kelishi Bizda esa💔💔💔 ahvol juda achinarli. 9 oy bola kotarib yurgan ham o'lim bn yuzlashib tug'gan ham, saqlanishi shart bolgan ham ayol…",
    },
    {
      name: "Elnora Rustamova",
      handle: "@russtamovae",
      initial: "E",
      text: "Assalamu Alaykum va rahmatullohi va barakatuh. Avvalosi Ummu Umayr darsida aytib o'tganidek Niyat To'gri qilib 2 dunyomizga manfaatli bo'lishni so'rab qolaman. darslar judayam tushinarli tilda har hil katta tushinarsiz jumlalarsiz yoritib berilgan. Ayniqsa manga yoqgani birinchi kirish darsini animatsiyalari xuddi miyyamga chizilganday yodimda qoldi. Bu darslarni har bir ayol bilishi kerak deb o'ylayman. Biz qanday tabiiy usulda saqlanishni emas balki qanday vahtda homilador bo'lishni hamda o'zimizni tushinishni o'zimizni o'rganishni boshladik. Spiral gormonal tabletkalar implantlar hammasi huddi bir tanamiz aytayotgan gaplarni og'zini bekib qo'yishga o'xshatdim. Tanamizni eshitmay og'zini yopish emas u bilan birga til topishishga qadam desam adashmagan bo'laman STMni. Yana Shuni tushindimki Alloh Ayol hilqati uchun uyni juda yaxshi maskan qilgan Ayol uchun stressdan yiroq bo'lish ko'cha kuyda og'ir ishlar qilish bularning hammasi u uchun emas u nozik. Masalan erkak oilasi ayoli uchun yedirish kiydirshga masul ayol esa farzandlari tarbiyasiga masulligi ham bejizga emas. Ayniqsa manga yoqgan insaytlardan biri bu pragesteron va estrogen garmonlarini homilador bo'lsak va ovulyatsiyada haroratning o'zgarib bola uchun issiqina joy tayyorlashi butun vujudimiz bunga tayyorlanishi bu faqat mo'jiza. Undan tashqari kurs uchun tayyorlanga logotiplar ham judayam chiroyli tanlagan dars mavzularni eshitib kursni logotiplarini bekorga unday tanlanmagani sezildi. Yana muxim jihati erkak va ayol bunga massuligi xozirgi kunga kelib ayolni vazifalari juda ko'pki xatto o'ziga vaqt ajratolmaydi. Shuning uchun nima qilib bo'lsa ham ikkqat bo'lib qolmasa bo'ldi xatto sogligdan kechib bo'lsa ham bu juda achinarli holat. Boshida bu kursda ko'p ayolllar bo'ladi deb man ham o'ylagandim lekin ko'p ayollarni xatosi kiyim kechak to'y hashamlarga 300 dollar hech narsa emas lekin o'zini eshitishga kelganda bu summa juda balan hisoblashadi. Nega unday axir o'zini eshitish bu distiplinga asoslandi har kuni oz bo'lsada mehnat talab qiladi. Xozirgilarga bo'lsa shu nimadir bo'lsa bittada ikkqat qimdigan spiralni taqib olsa bo'ldi. Aslida bilmaydiki spiraldan qon ketganda u qon emas kichikina vujud nobud bo'ladi😢 Afsuski shuni bilishmaydi. Bizga bu usulni osson o'rganishga yordam berganiz uchun alohida rahmat. O'zi sizni Pediatr Nodira opa orqali taniman ota onaylarga rahmat shunaqa ko'p ayollarni islohiga sababchi bo'layotgan farzandlarni yetishtirgani uchun. In shaa Alloh qiz farzandim bo'lsa albatta bu bilimlar bilan bo'lishaman. Toki u yoshligidan avvalo o'zini tanasni eshitishni tushinishni bilib ulg'aysin. Biz bekorga bu bilimlarni o'rganmadik jamiyatdagi ayollarning noto'g'ri streotiplarni o'zgartirishga o'z hissamizni qo'shsakkina albatta bunday noxush hollar kam bo'ladi.",
    },
    {
      name: "Xadicha Jo'rayeva",
      handle: "@zxadicha",
      initial: "X",
      text: "Hayz haqida ma'lumotlar, ayniqsa uni kasallik emas, ona bo'lish qobilyati ekanini eslatganiz yoqdi. Man birinchi hayzimni ko'rganimda qo'rqib ketganman, nimaligini bilmaganman. Buni yomon ish dib o'ylaganman. Hammadan yashirganman. Shu bilan 18-20 yoshimgacha siklim umuman buzilib ketgan. Endi tartibga keldi. Mana shu travmacham esimga tushdi. Hayz haqida shar'iy va tibbiy bilimga birinchi o'rinda ega bo'lishimiz kerak boshqa bilimladan oldin. Mana shu narsani tushundim. Karta yuritish esa qiyin emas qiziqarli tuyildi manga. Organizmimdagi ruhiy, jismoniy holatni chizma varianti desa bo'larkan. Bizani hissiy holatimiz, sog'ligimiz kartamizda aks etarkan. Karta faqat homiladorlikdan saqlanish uchun emas salomatlikni nazorat qilish uchun ham kerak ekan",
    },
    {
      name: "Robiya Muhammedova",
      handle: "@uxti_ra",
      initial: "R",
      text: "Ассаламу алейкум ва рахматуллоҳи ва барокатух✍ Нозимапа ман сизга шунчеки курсмас, балки ўз ҳаётимми, саломатлигимми ва аёллик ҳақида чуқурроқ тушунишимми таъминлаган, ҳақиқий билим манбаига айланган котта имконият учун миннатдорлик билдирмоқчиман. Бу курсга қатнашиш довомида аёлларни овуляция бўлиш ва бўлмаслиги вақти, естроген ва прогестерон даврлари ҳақида кенг ва асосли билимлани ўргандим. Бу билимла ман учун шунчеки маълумотмас, балки ўзимми ички органларимми янада яхши чуниш, ўз саломатлигимми назорат қилиш ва аёллик қадримми оширишга ёрдам берди. Бу курс асосан хомиладан сақланишчун мўлжалланган бўлса-да, хомиладор бўла олмаяпкан аёллар учун ҳам, жуда фойдали бўлади. Ман учун курсси энг қимматли томонларидан биттаси, Yoni Stim номи билан бонус дарсларини қўлга киритиш бўлди. Бу усул аёл организми учун нафақат рохатбахш, балки соғлиқ учун ҳам жуда муҳимдир. Чунки, бу стимуляция айолнинг ички органларини қувватлайди, қон айланишини яхшилайди, ва айниқса, аёл жинсий фаолиятини ошишда муҳим роль ўйнайди. Билиб олдим: Yoni Stim методининг асосий тамойиллари - бу табиий ва хавфсиз усул бўлиб, у шифобахш ва айниқса, аёлнинг нафақат жисмоний балки руҳий жиҳатдан холатини яхшилашга ёрдам беради, стрессни нормаллаштиради. Бу усул аёлнинг эҳтироси ва роҳат каби ҳис-туйғуларини оширади, уларнинг жинсий фаолиятидан кўнгли тўлади ва шахсий ҳаётига янги маънo ва қувват қўшади. Бундан ташқари, ман муслима аёллага жуда муҳим бўган, икки дунйосига манфаатли, фиқхий масалалага чуқур ва жиддий ёндашган илм сохибаси Сумаййа исмли Устоза билан олиб борилган дарслардан ҳам манфаат олдим. Бу ўзларидеги ажойиб билимлани бир жойга тўплаб, бошқа муслима аёллар билан бўлишган азиз Нозимапанинг бу курсини чин дилдан Аллоҳ улани илмларини бунданда зиёда қисин. Уларнинг меҳнати, дарсларни сокин ҳаммага бирдай тушунарли қилиб йозилгани, видео дарсликларни жуда сифатли ишлангани ва илмга бўлган муҳаббатлари учун самимий ташаккурлар айтаман. Ҳурматли аёллар, агар сиз ҳаётида янгича ёндашув, соғлом турмуш тарзини ва айоллик сирларини ўрганишни истасангиз, бу курс сиз учун ҳақиқий топилма. Бу курс, нархидан ҳам юқори қийматда, жуда бой ва қимматли маълумотларни ўз ичига олади. Мен ундан олган билимларим ҳаётимда катта ўзгаришлар келтирди ва шуни айтмоқчиманки бошқаларга ҳам ана шу курсни тавсия қиламан, чунки бу ажойиб имконини қўлдан бой бермаган яхши) Билим — энг катта бойликдир📚",
    },
    {
      name: "Ummu Muhsin",
      handle: "@toolibah_",
      initial: "U",
      text: "Har bitta darssi ko'rganimda ko'zimdan yulduzchala chiqadi, taassurotlarim judayam ko'p. Qisqa qib etadigan bo'sam, stm darsi har bitta ayol kishi bilishi kere bo'gan ilmligiga amin bo'ldim, bu faqatgina homiladorlidan saqlanishshi o'zimas, ayollaga tanasi bn aloqa o'rnatish, o'ziga ahamiyatli bo'lish, sog'lig'i haqida qayg'urishshi o'rgatarkan va homilador bo'moqchi bo'ganla uchunam ayni muddao. Darsla qiziqarli va oson qib chuntirilgan, ayniqsa animatsiyala mavzuni yanayam aniqro chunishga yordam berdi. Vaaa gap ayollik haqida ketvotkanakan, kursda faqatgina stm ni o'zimas, fiqh, seksologiya, yoni steam va qo'shimcha ayollar salomatligi mavzulariniyam qamragani bomba bo'ldi ❤️‍🔥 Fiqh darsidan bilganlarimmi takrorlab, bilmaganlarimmi o'rgandim, Sumayya Hanafi mavzulani misolla bilan aniq tiniq qib, hamma mayda detallarigacha sodda qib chuntirib berdila. Yoni steam darsiniyam mazza qib ko'zlarim quvnab ko'rdim, Sohibapani o'z ishini ustasi ekanlilari shundo bilinib turipti. Ummu Umayr alohida shedevr 💕 Sizziyam samimiyligiz, guruhda har bitta ayol-qiz bn individual ishlashiz, savollarimizaga erinmiy bittalab javob berishiz judayam judayam yoqdi, bu kotta vaqt va energiya oladi. Hamma hammaga tavsiya qigan bo'lardim bu kursda o'qishshi Alloh siladan rozi bo'sin, ikki dunyo ajrilani ko'paytirib bersin",
    },
    {
      name: "Muhammad's wife",
      handle: "@zavjatuM",
      initial: "M",
      text: "Assalamu alaykum Nozima opa darsliklar juda sifatli tayyorlangan ozimni anchagina angladim ozimni kuzatishni organdim tahlil qilishni ham. Avvalgi homiladorlik vaqtimda bolgan muammolarni sababini bilmasdim tabiiyki vrachlar ham tushuntirib bermagan edi har bir darslikda man homilador vaqtimda bolgan muammolarni ildizini ham topdim va keyingi homilada albatta buni oz nazoratimga olaman deb niyat qildim. Kurs faqat saqlanish emas balki ongli ravishda farzandli bolish va tugruqqa tayarlov desa ham boladi. Bu kursdan song avval ozimda va birga oqigan qizlarda ham kutilgan farzand boladi deya olaman. 💯 sodda chuntirgansiz guruhda ham activsiz Nozima opa ochiq samimiy ekansiz ozizni hecham katta tutib gapirmadiz bizaga oson bolishi chunarli va qollashimizga oson qilib berdiz hammasini astoydil harakat qildiz va qilib kevos rahmat kottakon tolagan pulimga hecham afsuslanmadim",
    },
    {
      name: "Aisha Shoakmalova",
      handle: "@shoakmalova_a",
      initial: "A",
      text: "Kursda qatnashishdan maqsad stm haqidagi bilimlarni qaytarish, yangilash va puxtalash edi... Lekin aslida bundan avvalgi kursim stmga progrev bo'lgandek tuyylib qoldi to'g'risi. Savollarimga aqlim qoniqadigan darajada javob ololyotganimdan judayam hursand bo'vomman, darslarga alohida mehr berib o'tilishi shundoq sezilib turibdi, mazza qilib ko'raman. Qo'shimcha materiallarni aytmasam xato qilgan bölaman. Faqatgina stmning özi bilan cheklanib qolinmaganligi bu kursni yanada sayqallagan. Ummu Umayrning darslari erimga qanday tushuntiraman, qanaqasiga ma'lum muddat j.a. bo'lmaydi deyman, va h.k. deydiganlar uchun to'liq javob bo'la oladi. Sohiba opaning yoni steam haqidagi videolari (webinar desa ham bo'ladi) sog'lig'iga befarq bo'lmasdan stm kursini sotib olganlar uchun tabiiy tiklanish haqidagi savollarini yopib ketdi. Man hozir qilolmiman, homiladorman lekin tug'ganimdan keyin tiklanish uchun inshaAlloh albatta qilaman, shoshib ketyapman. Shoshganimdan onamlarga qilib ko'rmoqchi edim hozir issiqda parlamoqchimisan mani didila ^^ Uyam otmen böldi hullas. Ruvayha opa как всегда в своём репертуаре: ko'p eslatmalar oldim, masalan toksik narsalardan organizmni himoyalash, bizning salomatligimizga bizning nabirayu evaralarimizni ham salomatligi bog'lik ekanligi... Ora orada shunaqa qayta qayta eslatma olib turish juda foydalide özi. Yangiliklar ham böldi, masalan kökrak salomatligiga oid ba'zi ma'lumotlar, hususan lyugol yodni ishlatish. Miyyam mazza qivvottide hullas informatsiyaladan. E'tirof etmasa bo'midigan silsilaviy darslar (alohida kurs): ayollarga oid fiqhiy masalalar-hanafiy fiqhi.... Вишенка на торте. Huddi kursni nomidek, stm darslari va fiqh darslari bir biri bilan shunaqangi uyg'unki, endi stmni ayollar fiqhi bilan ko'rish majburiydek tuyulib qoldi... Kursda ayol/qizlar (ha-ha, qizlar ham) o'qishini juddayam qattiq tavsiya qilgan bölar edim. Hattoki shu darajadaki, berilayotgan ma'lumotlar maktablarda örgatilinsa vashshe ideal bölardi. Ya'ni shu darajada kerakli, tushunyapsizmi, huddi masalan ПДД fanini muhim deb örgatishadiku, shu kabi, juda muhim ya'ni.",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
    }, 15000); // 15 soniya

    return () => clearInterval(interval);
  }, [reviews.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? reviews.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % reviews.length);
  };

  const toggleExpanded = (index: number) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const getDisplayText = (text: string, index: number) => {
    const isExpanded = expandedReviews.has(index);

    if (isExpanded) {
      // To'liq matn ko'rsatish
      return text;
    } else {
      // Faqat 4 qator ko'rsatish
      const words = text.split(' ');
      const wordsPerLine = 8; // Har qatorda taxminan 8 so'z
      const maxWords = wordsPerLine * 4; // 4 qator uchun 32 so'z

      if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ') + "...";
      }
      return text;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6">
      <div className="relative overflow-hidden">
        {/* Navigation buttons */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Oldingi sharh"
        >
          <ArrowLeft className="h-6 w-6 text-red-600" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
          aria-label="Keyingi sharh"
        >
          <ArrowRight className="h-6 w-6 text-red-600" />
        </button>

        <motion.div
          className="flex"
          animate={{ x: -currentIndex * 100 + "%" }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {reviews.map((review, index) => (
            <div key={index} className="w-full flex-shrink-0 px-4">
              <div className="bg-white p-6 rounded-lg shadow-md border border-red-100 text-center min-h-[350px] flex flex-col">
                <div className="flex items-center justify-center mb-6">
                  <div className="w-20 h-20 bg-gray-200 rounded-full overflow-hidden mr-4 flex items-center justify-center">
                    <img
                      className="w-full h-full object-cover"
                      src={`/images/sharh/${index + 1}.jpg`}
                      alt=""
                    />
                  </div>
                  <div>
                    <h4 className="font-semibold text-red-800 text-lg">
                      {review.name}
                    </h4>
                    <p className="text-sm text-gray-600">{review.handle}</p>
                  </div>
                </div>
                <div className="text-gray-700 leading-relaxed text-lg flex-1 flex flex-col">
                  <div className="mb-2 flex-1 overflow-y-auto">
                    <p>
                      "{getDisplayText(review.text, index)}"
                    </p>
                  </div>
                  {review.text.split(' ').length > 32 && (
                    <div className="mt-4 flex-shrink-0">
                      <button
                        onClick={() => toggleExpanded(index)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm transition-colors duration-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-full border border-red-200"
                      >
                        {expandedReviews.has(index) ? "Qisqartish" : "To'liq o'qish"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-8 space-x-2">
        {reviews.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-3 h-3 rounded-full transition-colors ${index === currentIndex ? "bg-red-600" : "bg-gray-300"
              }`}
          />
        ))}
      </div>
    </div>
  );
};

export default function HomePage() {
  const { user, clearUser } = useUserStore();
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 1080]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showMainContent, setShowMainContent] = useState(false);

  const handleLogout = () => {
    // Clear token
    localStorage.removeItem('auth_token');
    // Reload page
    window.location.reload();
  };

  // Loading completion handler
  const handleLoadingComplete = () => {
    setIsLoading(false);
    // Kichik kechikish bilan asosiy kontentni ko'rsatish
    setTimeout(() => {
      setShowMainContent(true);
    }, 500);
  };

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      // Agar scroll pastga qilingan bo'lsa, animatsiyalarni ishga tushirish
      if (scrollY > windowHeight * 0.1) {
        setShowMainContent(true);
      }
    };

    if (!isLoading) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [isLoading]);

  const navLinks = [
    { href: "/#main", label: "Bosh sahifa" },
    { href: "#courses", label: "Kurs haqida" },
    { href: "#author", label: "Muallif haqida" },
    { href: "#faq", label: "FAQ" },
    { href: "#pricing", label: "Tariflar" },
    { href: "#reviews", label: "Sharhlar" },
  ];

  return (
    <div className="min-h-screen bg-[#FEFBEE] text-gray-800 overflow-x-hidden">
      {/* Loading Screen */}
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={handleLoadingComplete} />
        )}
      </AnimatePresence>
      {/* --- Sticky Mobile Menu Button --- */}
      <div className="fixed top-4 right-4 z-40 lg:hidden">
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button className="p-3 rounded-full text-white bg-red-800 shadow-lg hover:bg-red-900 transition-all duration-300 hover:scale-110">
              <span className="sr-only">Open menu</span>
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="bg-red-900 text-white border-none p-8"
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <SheetHeader className="mb-8">
              <SheetTitle className="text-white text-2xl font-bold text-left"></SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-3">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className="text-2xl hover:underline underline-offset-4 text-left"
                  >
                    {link.label}
                  </Link>
                </SheetClose>
              ))}
              {user ? (
                <>
                  <SheetClose asChild>
                    <Link
                      href={"/dashboard"}
                      className="text-2xl hover:underline underline-offset-4 text-left"
                    >
                      {user.first_name}
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <button
                      onClick={handleLogout}
                      className="text-2xl hover:underline underline-offset-4 text-left text-red-600"
                    >
                      Chiqish
                    </button>
                  </SheetClose>
                </>
              ) : (
                <>
                  <SheetClose asChild>
                    <Link
                      href={"/auth"}
                      className="text-2xl hover:underline underline-offset-4 text-left"
                    >
                      Kirish
                    </Link>
                  </SheetClose>
                  <SheetClose asChild>
                    <Link
                      href={"/register"}
                      className="text-2xl hover:underline underline-offset-4 text-left"
                    >
                      Ro'yxatdan o'tish
                    </Link>
                  </SheetClose>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* --- Desktop Header --- */}
      <div
        id="main"
        className="container mx-auto px-4 sm:px-6 lg:px-8 top-0 left-0 absolute lg:static z-30"
      >
        <div className="flex items-center lg:justify-end py-2">
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xl font-medium text-gray-600 hover:text-red-800 transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4 ml-10">
            {user ? (
              <>
                <Link href="/dashboard">
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-800 hover:bg-red-50"
                  >
                    {user.first_name}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Chiqish
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth">
                  <Button
                    variant="outline"
                    className="border-red-800 text-red-800 hover:bg-red-50"
                  >
                    Kirish
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-red-800 hover:bg-red-900 text-white">
                    Ro'yxatdan o'tish
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      <main>
        {/* --- Hero Section --- */}
        <motion.section
          className="relative w-full"
          initial={{ opacity: 0 }}
          animate={{
            opacity: showMainContent ? 1 : 0,
            y: showMainContent ? 0 : 50
          }}
          transition={{
            duration: 1,
            ease: "easeOut"
          }}
        >
          {/* Top Content (Logos & Text) */}
          <div className="relative z-20 w-full bg-[#FEFBEE] pt-8 pb-10">
            <div className="flex flex-col items-center justify-center text-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showMainContent ? 1 : 0,
                  y: showMainContent ? 0 : 20
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative z-50"
              >
                <img
                  src="/images/logo-decorated.png"
                  alt="Platform Logo"
                  className="h-28 md:h-56 lg:h-64 w-auto object-contain [filter:drop-shadow(0_0_8px_rgba(255,255,255,0.7))]"
                />
              </motion.div>
              <motion.h1
                className="text-xl sm:text-3xl md:text-5xl relative z-50 text-[#5D1111]"
                style={{ fontFamily: 'Bergstena Decorated, serif' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showMainContent ? 1 : 0,
                  y: showMainContent ? 0 : 20
                }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                Ayollik tabiatingiz bilan hamohanglikda yashang
              </motion.h1>
              <motion.p
                className="mx-auto text-base sm:text-xl md:text-2xl font-semibold text-[#7A2E2E] mb-4 relative z-40"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showMainContent ? 1 : 0,
                  y: showMainContent ? 0 : 20
                }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                Tabiiy usul bilan homiladorlikni<br />
                rejalashtiring yoki oldini oling
              </motion.p>
              <motion.p
                className="mx-auto border-t border-b border-[#5D1111] max-w-[120px] w-full mb-2 relative z-50"
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: showMainContent ? 1 : 0,
                  y: showMainContent ? 0 : 20
                }}
                transition={{ duration: 0.8, delay: 0.6 }}
              ></motion.p>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: showMainContent ? 1 : 0,
                  scale: showMainContent ? 1 : 0.8
                }}
                transition={{ duration: 0.5, delay: 0.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="relative z-50"
              >
                <ul className="text-[#5D1111] flex items-center flex-col sm:flex-row gap-x-1">
                  <li className="font-bold">Start:</li>
                  <li>Iyul, 2026</li>
                  <li className="font-bold">Davomiyligi:</li>
                  <li>12 hafta</li>
                </ul>
              </motion.div>
            </div>
          </div>

          {/* Bottom Video Section */}
          <div className="relative w-full h-[80vh] overflow-hidden">
            <motion.video
              src="/women.mp4"
              poster="/images/header.jpg"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover object-top"
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{
                opacity: showMainContent ? 1 : 0,
                scale: showMainContent ? 1 : 1.1
              }}
              transition={{ duration: 1.2, delay: 1 }}
            />
            {/* CTA Button Overlay */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{
                opacity: showMainContent ? 1 : 0,
                scale: showMainContent ? 1 : 0.8
              }}
              transition={{ duration: 0.8, delay: 1.5 }}
              className="absolute top-[65%] left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 focus:outline-none"
              style={{ marginLeft: '-40px' }}
            >
              <Link
                href={"#pricing"}
                className="h-32 w-32 border-2 border-white rounded-full flex items-center justify-center text-white hover:scale-105 transition-transform duration-300 relative"
              >
                <p className="text-lg text-center font-medium">
                  ISHTIROK <br /> ETAMAN
                </p>
                {/* Rotating Dot */}
                <motion.div
                  style={{ rotate }}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                >
                  <span className="h-4 w-4 bg-white rounded-full absolute -right-2 top-1/2 -translate-y-1/2 shadow-lg"></span>
                </motion.div>
              </Link>
            </motion.div>
            <div className="absolute z-10 bottom-0 h-[200px] w-full left-0 bg-gradient-to-t from-red-900 via-red-900/50 to-transparent"></div>
          </div>
        </motion.section>

        {/* STM BU bo'limi */}
        <section className="py-20 px-4 min-h-screen flex items-center" style={{ backgroundColor: '#801d1d', backgroundImage: 'none', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed', backgroundClip: 'padding-box', zIndex: 1, position: 'relative', overflow: 'hidden' }}>
          <div className="container mx-auto">
            <div className="w-full text-white flex flex-col items-center justify-center p-2 sm:p-5 relative z-10">
              <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center">
                
                <div className="w-full grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-4 lg:gap-8 items-center justify-center">
                  
                  {/* Left Texts */}
                  <div className="flex flex-col justify-between h-[130px] sm:h-[180px] md:h-[350px] text-right z-20">
                    <p className="text-[10px] sm:text-sm md:text-base lg:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] md:drop-shadow-none font-medium leading-snug">
                      Harorat va ajralmalarni tahlil qilish
                    </p>
                    <p className="text-[10px] sm:text-sm md:text-base lg:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] md:drop-shadow-none font-medium leading-snug">
                      Hayz ritmingizga mos, ongli va muvozanatli hayot
                    </p>
                  </div>

                  {/* Doira + rasm + halqalar + nuqtalar */}
                  <div className="relative z-10 w-[150px] h-[150px] sm:w-[220px] sm:h-[220px] md:w-[28rem] md:h-[28rem] shrink-0 mx-auto">
                    {/* Tashqi halqa */}
                    <div className="absolute inset-0 rounded-full border border-[0.5px] sm:border border-white/60" />
                    {/* Ichki halqa (biroz kichikroq) */}
                    <div className="absolute inset-1 sm:inset-2 md:inset-3 rounded-full border border-[0.5px] sm:border border-white/80" />

                    {/* Rasm (doira ichida) */}
                    <div className="absolute inset-2 sm:inset-4 md:inset-6 rounded-full overflow-hidden">
                      <img
                        src="/images/hero-woman.png"
                        alt="STM BU"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>

                    {/* Aylanib turadigan anor logolari */}
                    {/* O'ng tomonga aylanadigan logo */}
                    <motion.div
                      className="absolute inset-0 z-20"
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 12,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop"
                      }}
                    >
                      <img
                        src="/images/anor.png"
                        alt="Anor logo"
                        className="absolute top-[2px] sm:top-2 md:top-3 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
                      />
                    </motion.div>

                    {/* Chap tomonga aylanadigan logo */}
                    <motion.div
                      className="absolute inset-0 z-20"
                      animate={{ rotate: -360 }}
                      transition={{
                        duration: 12,
                        ease: "linear",
                        repeat: Infinity,
                        repeatType: "loop",
                        delay: 6
                      }}
                    >
                      <img
                        src="/images/anor.png"
                        alt="Anor logo"
                        className="absolute top-[2px] sm:top-2 md:top-3 left-1/2 -translate-x-1/2 w-5 h-5 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
                      />
                    </motion.div>

                    {/* Markaziy sarlavha */}
                    <div className="absolute inset-0 flex items-center justify-center z-30">
                      <span className="font-extrabold tracking-wide text-[20px] sm:text-[28px] md:text-[40px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        STM BU
                      </span>
                    </div>
                  </div>

                  {/* Right Texts */}
                  <div className="flex flex-col justify-between h-[130px] sm:h-[180px] md:h-[350px] text-left z-20">
                    <p className="text-[10px] sm:text-sm md:text-base lg:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] md:drop-shadow-none font-medium leading-snug">
                      Spiral va gormonal tabletkalarsiz qo'rquvsiz yaqinlik
                    </p>
                    <p className="text-[10px] sm:text-sm md:text-base lg:text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] md:drop-shadow-none font-medium leading-snug">
                      99,6% aniqlik bilan tabiiy rejalashtirish
                    </p>
                  </div>

                </div>

                {/* Slogan */}
                <p className="mt-12 text-center text-lg sm:text-xl md:text-2xl font-bold text-white/95 drop-shadow-md" style={{ fontFamily: 'Bergstena Script, cursive' }}>
                  Bu – tanangiz bilan hamohanglikda yashash san'ati.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* kurslar kimlar uchun */}
        <section className="py-0 px-4 relative min-h-screen overflow-hidden -mt-8" style={{ marginTop: '-2rem' }}>
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto relative z-10 py-12 px-4 sm:px-6 lg:px-8">
            <motion.h2
              className="text-3xl font-bold text-center mb-6 text-red-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              KURS KIMLAR UCHUN?
            </motion.h2>

            <div className="grid md:grid-cols-3 gap-4">
              {/* 1. Doimiy xavotirda yashaydigan ayollar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <CardTitle className="text-red-900 text-center">
                      Doimiy xavotirda yashaydigan ayollar uchun
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                        <img
                          src="/images/icons/women-group.png"
                          alt="Doimiy xavotirda yashaydigan ayollar"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'block';
                            }
                          }}
                        />
                        <Users className="h-12 w-12 text-red-800 hidden" />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 text-center font-bold">
                      “Hayzim kechikyapti, homilador bo’lib qoldimmikin?” degan
                      qo’rquvda yashashdan charchadingizmi? Simptotermal Metod
                      (STM) yordamida siz:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          99,6% aniqlik bilan homiladorlikni ortga surishni
                          o’rganasiz.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Tanangiz, kayfiyatingizdagi o'zgarishlar va hayz
                          davringizni tushuna boshlaysiz
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Hayzingiz qachon boshlanishini aniq bilib, stressiz
                          yashaysiz.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Juftingiz bilan ishonchli va ochiq munosabatlar
                          o'rnatishga erishasiz.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 2. Homilador bo'lishni xohlayotgan ayollar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <CardTitle className="text-red-900 text-center">
                      Homilador bo'lishni xohlayotgan, ammo qiyinchiliklarga
                      duch kelayotgan juftliklar uchun
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                        <img
                          src="/images/icons/pregnancy-heart.png"
                          alt="Homilador bo'lishni xohlayotgan ayollar"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'block';
                            }
                          }}
                        />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 text-center font-bold">
                      Agar sizga va juftingizga bepushtlik tashxisi
                      qo’yilmagan bo’lsa, STM orqali tabiiy usulda, farzandli
                      bo’lish imkoniyatini oshirishingiz mumkin
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Eng yuqori ehtimolli homiladorlik kunlarini
                          aniqlaysiz.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Homiladorlikning dastlabki 10 haftasida, tanangiz
                          resurslari bola rivojlanishi uchun yetarli bo’lishini
                          kuzatib borasiz
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Tug'ish sanangizni homiladorlik yuzaga kelgan kundan
                          boshlab hisoblay olasiz
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>

              {/* 3. Yaqinda ona bo'lgan ayollar */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <CardTitle className="text-red-900 text-center">
                      Yaqinda ona bo'lgan va darhol homilador bo'lishni
                      istamaydigan ayollar uchun
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="w-32 h-32 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                        <img
                          src="/images/icons/mother-baby.png"
                          alt="Yaqinda ona bo'lgan ayollar"
                          className="w-full h-full object-cover rounded-full"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                            if (nextElement) {
                              nextElement.style.display = 'block';
                            }
                          }}
                        />
                        <Award className="h-12 w-12 text-red-800 hidden" />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-4 text-center font-bold">
                      Ko’plab emizikli onalar: “bolamni emizishdan
                      chiqarmaguncha homilador bo’lib qolmayman” degan
                      notoʻgʻri tushunchaga ega. STM yordamida siz:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Hayzingiz hali tiklanmagan boʻlsa ham, 99,6% aniqlik
                          bilan, keyingi homiladorlikni ortga sura olasiz
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Tug'ruqdan keyingi birinchi ovulyatsiyangizni
                          kuzatasiz.
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Organizmga zarar yetkazmaydigan va juftingiz bilan
                          ishonchli munosabatda bo'lish imkonini beradigan
                          tabiiy usuldan foydalanasiz.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- Features Section --- */}
        {/* <section id="about" className="py-20 sm:py-28">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-red-900 mb-4">
                Nima uchun bizni tanlaysiz?
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-gray-600">
                Bizning platformamiz ayollarga o'z salomatligini tabiiy va ilmiy
                asoslangan usullar bilan boshqarishga yordam beradi.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15 }}
                >
                  <Card className="text-center border-red-100/70 h-full hover:shadow-xl hover:-translate-y-2 transition-all duration-300 bg-white/50">
                    <CardHeader>
                      <div className="mx-auto w-20 h-20 mb-4 bg-red-100/70 rounded-full flex items-center justify-center">
                        <Shield className="h-8 w-8 text-red-700" />
                      </div>
                      <CardTitle className="text-xl font-semibold text-red-900">
                        Xavfsiz va tabiiy
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Hech qanday kimyoviy preparatlar va yon ta'sirlarsiz,
                        faqat tabiiy usullar orqali o'z tanangizni nazorat
                        qiling.
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section> */}

        {/* --- Course Content Section --- */}
        <section id="courses" className="py-0 px-4 relative overflow-hidden -mt-8" style={{ marginTop: '-2rem' }}>
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto relative z-10 py-16">
            <motion.h2
              className="text-3xl font-bold text-center mb-12 text-red-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              KURS TARKIBI
            </motion.h2>

            <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-8">
              {/* I MODUL */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src="/images/muallif.jpg"
                          alt="Nozima Khamraeva"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-red-900 text-lg">
                          I MODUL
                        </CardTitle>
                        <CardDescription className="font-semibold text-gray-700">
                          Nozima Khamraeva
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Buyuk Britaniya "Natural Family Planning Teachers'
                      Association" uyushmasining sertifikatli treneri.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Videodarslar (20-30 daq.):
                      </h4>
                      <ul className="space-y-1">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Ayol va erkak reproduktiv tizimining anatomiya va
                            fiziologiyasi
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Simptotermal metod darslari
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Gormonlar, hayot tarzi va hayz ritmida yashash
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* II MODUL */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src="/images/module-2.jpg"
                          alt="Sumayya Hanafi"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-red-900 text-lg">
                          II MODUL
                        </CardTitle>
                        <CardDescription className="font-semibold text-gray-700">
                          Sumayya Hanafi
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Islom fiqhi bo'yicha mutaxassis, Iordaniya qirolligida
                      Usul va Fiqh yo'nalishida bakalavr darajasiga ega.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Videodarslar (10-15 daq.):
                      </h4>
                      <ul className="space-y-1">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Ayollik fiqhini o'rganish ahamiyati
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Hayz, istihoza, nifos tushunchalari
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Tahorat, g'usl, oq ajralmalar haqida
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Er bilan yaqinlik masalalari
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* III MODUL */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src="/images/module-3.jpg"
                          alt="Ummu Umayr"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-red-900 text-lg">
                          III MODUL
                        </CardTitle>
                        <CardDescription className="font-semibold text-gray-700">
                          Ummu Umayr
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Diplomli psixolog-seksolog, integrativ nutritsiolog. 15+
                      kurs va loyihalar asoschisi; 2000+ ayol-qizlarni ijobiy
                      natijaga olib chiqqan mutaxassis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Videodarslik (35 daq.):
                      </h4>
                      <ul className="space-y-1">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Ruhiy va jismoniy omillarning ahamiyati
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            To'shak masalasidagi kelishmovchiliklar
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Oilani tabiiy rejalashtirishning jinsiy hayotga
                            ijobiy ta’siri
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Tiyilish kunlari uchun tavsiyalar
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* IV MODUL */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src="/images/module-4.jpg"
                          alt="Sohiba Abdalniyozova"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-red-900 text-lg">
                          IV MODUL
                        </CardTitle>
                        <CardDescription className="font-semibold text-gray-700">
                          Sohiba Abdalniyozova
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Doula, prenatal nutritsiolog. Ayollarga homiladorlik, oson
                      tug'ruq va tug'ruqdan keyingi tiklanishga yordam beradigan
                      mutaxassis.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Videodarslik (25 daqiqa):
                      </h4>
                      <ul className="space-y-1">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Yoni-steam foydalari va uni uy sharoitida qilish
                          </span>
                        </li>
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Oyoq parlash ahamiyati
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* V MODUL */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="md:col-span-2 lg:col-span-1"
              >
                <Card className="border-red-200 h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        <img
                          src="/images/module-5.jpg"
                          alt="Ruvayha"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <CardTitle className="text-red-900 text-lg">
                          V MODUL
                        </CardTitle>
                        <CardDescription className="font-semibold text-gray-700">
                          Ruvayha
                        </CardDescription>
                      </div>
                    </div>
                    <CardDescription className="text-sm text-gray-600">
                      Diplom va sertifikatli Tabiiy Tibbiyot yo'lovchisi, doula,
                      tug'ruqqa tayyorlovchi murabbiy, gomeopat.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">
                        Videodarslik (40 daqiqa):
                      </h4>
                      <ul className="space-y-1">
                        <li className="flex items-start">
                          <CheckCircle className="h-4 w-4 text-red-800 mr-2 mt-1 flex-shrink-0" />
                          <span className="text-sm">
                            Sog'lom ayol bo'lish sirlari
                          </span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Ilmiy Asoslangan Samaradorlik */}
        <section className="py-0 px-4 relative overflow-hidden -mt-8" style={{ marginTop: '-2rem' }}>
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto relative z-10 py-16">
            <motion.h2
              className="text-3xl font-bold text-center mb-12 text-red-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              ILMIY ASOSLANGAN SAMARADORLIK
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-7xl mx-auto px-4 sm:px-6">
              {/* Chap qism: Ideal va Oddiy qo'llashda */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <div className="space-y-6">
                  {/* Ideal qo'llashda */}
                  <Card className="border-red-200 bg-white">
                    <CardHeader className="text-center">
                      <CardTitle className="text-red-900 text-xl mb-2">
                        Ideal qo'llashda
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Har bir tavsiyaga qat'iy amal qilinganda
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-6xl font-bold text-red-800 mb-2">
                        99,6%
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        (Pearl ko'rsatkichi: 0,4)
                      </p>
                      <p className="text-xs text-gray-500">
                        Manba: Human Reproduction, 2007
                      </p>
                    </CardContent>
                  </Card>

                  {/* Oddiy qo'llashda */}
                  <Card className="border-red-200 bg-white">
                    <CardHeader className="text-center">
                      <CardTitle className="text-red-900 text-xl mb-2">
                        Oddiy qo'llashda
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        Qo'llashda kamchiliklarga yo'l qo'yilganda
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                      <div className="text-6xl font-bold text-red-800 mb-2">
                        98,2%
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        (Pearl ko'rsatkichi: 1,8)
                      </p>
                      <p className="text-xs text-gray-500">
                        Manba: Osteopath Fam Physician, 2013
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>

              {/* O'ng qism: Taqqoslash */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <Card className="border-red-200 bg-white h-full">
                  <CardHeader className="text-center">
                    <CardTitle className="text-red-900 text-xl mb-2">
                      Taqqoslash
                    </CardTitle>
                    <CardDescription className="text-sm text-gray-600">
                      (oddiy foydalanish)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Grafik */}
                    <div className="mb-6">
                      <div className="flex items-end justify-between h-32 bg-gray-50 p-4 rounded-lg">
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-20 bg-red-300 rounded-t"></div>
                          <span className="text-xs mt-2">15</span>
                          <span className="text-xs text-gray-600">
                            Prezervativ
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-12 bg-red-400 rounded-t"></div>
                          <span className="text-xs mt-2">9</span>
                          <span className="text-xs text-gray-600">
                            Gormonal
                          </span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div className="w-4 h-4 bg-red-600 rounded-t"></div>
                          <span className="text-xs mt-2">1.8</span>
                          <span className="text-xs text-gray-600">STM</span>
                        </div>
                      </div>
                    </div>

                    {/* Jadval */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="font-semibold text-gray-700">Usul</div>
                        <div className="font-semibold text-gray-700">
                          Pearl ko'rsatkichi
                        </div>
                        <div className="font-semibold text-gray-700">
                          Samaradorlik
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                        <div className="text-sm">Prezervativ</div>
                        <div className="text-sm font-semibold text-red-600">
                          15
                        </div>
                        <div className="text-sm font-semibold text-red-600">
                          85%
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center py-2 border-t">
                        <div className="text-sm">Gormonal tabletkalar</div>
                        <div className="text-sm font-semibold text-red-600">
                          9
                        </div>
                        <div className="text-sm font-semibold text-red-600">
                          91%
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center py-2 border-t rounded">
                        <div className="text-sm font-semibold">
                          Simptotermal usul
                        </div>
                        <div className="text-sm font-bold text-red-800">
                          1.8
                        </div>
                        <div className="text-sm font-bold text-red-800">
                          98.2%
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Kurs Muallifi */}
        <section id="author" className="py-0 px-4 relative overflow-hidden -mt-8">
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto relative z-10 py-16">
            <motion.h2
              className="text-3xl font-bold text-center mb-12 text-red-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              Kurs muallifi
            </motion.h2>

            <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto items-center px-4 sm:px-6">
              {/* Chap qism: Portret va ma'lumotlar */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="text-center md:text-left"
              >
                <div className="mb-8">
                  <div className="w-48 h-48 mx-auto md:mx-0 rounded-full overflow-hidden bg-gray-200 mb-6">
                    <img
                      src="/images/muallif.jpg"
                      alt="Nozima Khamraeva"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="text-2xl font-bold text-red-900 mb-2">
                    Kurs muallifi
                  </h3>
                  <h4 className="text-3xl font-serif font-bold text-red-800 mb-6">
                    Nozima Khamraeva
                  </h4>
                </div>

                <div className="space-y-4 text-gray-700">
                  <p className="text-lg leading-relaxed">
                    Buyuk Britaniya "Natural Family Planning Teachers'
                    Association" uyushmasining sertifikatli treneri.
                  </p>
                  <p className="text-lg leading-relaxed">
                    O'zbekistonda ilk marotaba ayollar uchun ko'p martalik
                    matoli tagliklarni tanishtirgan ayol.
                  </p>
                  <p className="text-lg leading-relaxed">
                    2 ta farzandini tibbiy xodimlar va aralashuvlarsiz, ongli yondashib, oʻz uyida dunyoga keltirgan ona.
                  </p>
                </div>
              </motion.div>

              {/* O'ng qism: Sertifikat */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="border-red-200 bg-white shadow-lg max-w-sm">
                  <img className="h-full w-full" src="/nfp.jpg" alt="" />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* --- FAQ Section --- */}
        <section className="py-0 relative overflow-hidden -mt-8" style={{ marginTop: '-2rem' }}>
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-red-900 mb-4">
                Ko'p beriladigan savollar
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-gray-600">
                Kurs haqida sizni qiziqtirgan savollarga javoblar.
              </p>
            </motion.div>
            <FAQAccordion />
          </div>
        </section>

        {/* Sharhlar */}
        <section id="reviews" className="py-0 px-4 relative overflow-hidden -mt-8">
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto relative z-10 py-16">
            <motion.h2
              className="text-3xl font-bold text-center mb-12 text-red-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              SHARHLAR
            </motion.h2>

            <ReviewsCarousel />
          </div>
        </section>

        {/* --- Pricing Section --- */}
        <section id="pricing" className="py-0 relative overflow-hidden -mt-8">
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20">
            <motion.div
              className="text-center mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-red-900 mb-4">
                Tariflar
              </h2>
              <p className="max-w-3xl mx-auto text-lg text-gray-600">
                O'zingizga mos tarifni tanlang va sog'lom hayot sari ilk qadamni
                tashlang.
              </p>
            </motion.div>
            <div className="grid lg:grid-cols-3 gap-6 max-w-7xl mx-auto items-stretch">
              {/* STANDART */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="h-full"
              >
                <Card className="border-gray-200 h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
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
                        <span className="text-sm">
                          1 to'liq hayz xaritasi kuzatuvi
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Foydalanuvchi Sertifikati (o'rgatish huquqisiz)
                        </span>
                      </li>
                    </ul>
                    <Link
                      href={`https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men sizning STANDART kursingizni sotib olmoqchiman.`}
                      className="block pt-4"
                    >
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
                className="h-full"
              >
                <Card className="border-red-500 h-full flex flex-col shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                  <CardHeader className="text-center">
                    <CardTitle className="text-xl text-red-900">
                      OPTIMAL
                    </CardTitle>
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
                        <span className="text-sm">
                          1 to'liq hayz xaritasi kuzatuvi
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          Foydalanuvchi Sertifikati (o'rgatish huquqisiz)
                        </span>
                      </li>
                    </ul>
                    <Link
                      href={`https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men sizning OPTIMAL kursingizni sotib olmoqchiman.`}
                      className="block pt-4"
                    >
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
                className="h-full"
              >
                <Card className="border-red-300 h-full flex flex-col hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
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
                        <span className="text-sm">
                          Sog'lom Ayollik Sirlari darsi
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          6 oy davomida kurs materiallariga kirish
                        </span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                        <span className="text-sm">
                          3 to'liq hayz xaritasi kuzatuvi
                        </span>
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
                    <Link
                      href={`https://t.me/stm_kurs?text=Assalomu alaykum yaxshimisiz. Men sizning VIP kursingizni sotib olmoqchiman.`}
                      className="block pt-4"
                    >
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

        {/* --- CTA Section --- */}
        <section className="py-0 bg-[#FEFBEE] text-red-900 relative overflow-hidden -mt-8" style={{ marginTop: '-2rem' }}>
          {/* Orqa fon rasmi */}
          <div className="absolute inset-0 z-0">
            <div
              className="w-full h-full opacity-70 hidden md:block"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'fixed'
              }}
            />
            {/* Mobil qurilmalar uchun alohida fon */}
            <div
              className="w-full h-full opacity-60 md:hidden"
              style={{
                minHeight: '100vh',
                backgroundImage: 'url(/images/fon.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center center',
                backgroundRepeat: 'no-repeat',
                backgroundAttachment: 'scroll'
              }}
            />
          </div>
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-8 text-red-900">
                SIZGA MO'JIZA TAKLIF QILMAYMAN
              </h2>

              <div className="max-w-4xl mx-auto mb-8">
                <div className="text-center text-lg text-red-900 leading-relaxed">
                  <p className="mb-8">
                    O'zingizni anglash yo'lida yo'lboshchilik, Sizni tushunuvchi, qo'llab-quvvatlovchi yo'ldoshlikni, <br />Tinglash, <br />O'z yo'lingizni hurmat qilishni taklif qilaman.
                  </p>
                </div>

                <div className="text-center">
                  <p className="text-red-1000 italic font-serif text-xl font-bold">
                    (C) Nozima Khamraeva
                  </p>
                </div>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.90 }}
                className="mt-8 mb-20"
              >
                <Link href="/auth">
                  <Button
                    size="lg"
                    className="bg-red-800 hover:bg-red-900 text-white text-lg px-8 py-6 rounded-full font-bold shadow-lg"
                  >
                    Hoziroq boshlash
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">

                <h3 className="text-xl font-bold"></h3>
              </div>
              <p className="text-gray-400 text-sm">

              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">
                Tezkor havolalar
              </h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="#courses"
                    className="hover:text-white transition-colors text-sm"
                  >
                    Kurslar
                  </Link>
                </li>
                <li>
                  <Link
                    href="#pricing"
                    className="hover:text-white transition-colors text-sm"
                  >
                    Tariflar
                  </Link>
                </li>
                <li>
                  <Link
                    href="#faq"
                    className="hover:text-white transition-colors text-sm"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Yordam</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="https://t.me/stm_kurs"
                    target="_blank"
                    className="hover:text-white transition-colors text-sm"
                  >
                    Qo'llab-quvvatlash
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-white transition-colors text-sm"
                  >
                    Foydalanish shartlari
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-200">Aloqa</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link
                    href="mailto:info@uygunlik.uz"
                    className="hover:text-white transition-colors text-sm"
                  >
                    info@uygunlik.uz
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://t.me/stm_kurs"
                    target="_blank"
                    className="hover:text-white transition-colors text-sm"
                  >
                    Telegram: @stm_kurs
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2025 Platform. Barcha huquqlar himoyalangan.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
