import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { hash } from "bcryptjs";
import * as schema from "./schema";

async function seed() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("🌱 Seeding database...");

  // ─── Users (from Excel: G01042 team) ───
  const defaultPin = await hash("1234", 10);

  const teamMembers = [
    { name: "Reszczyński Łukasz", role: "kierowca" as const, isLeader: true },
    { name: "Ceplin Waldemar", role: "ratownik" as const, isLeader: false },
    { name: "Martyna Paweł", role: "kierowca" as const, isLeader: false },
    { name: "Michniewicz Tomasz", role: "kierowca" as const, isLeader: false },
    { name: "Porzeziński Mateusz", role: "kierowca" as const, isLeader: false },
    { name: "Rogiński Tomasz", role: "ratownik" as const, isLeader: false },
    { name: "Szaryński Tomasz", role: "ratownik" as const, isLeader: false },
    { name: "Szymański Tomasz", role: "ratownik" as const, isLeader: false },
    { name: "Tekien Marek", role: "kierowca" as const, isLeader: false },
    { name: "Turzyński Krystian", role: "kierowca" as const, isLeader: false },
  ];

  for (const member of teamMembers) {
    await db.insert(schema.users).values({
      name: member.name,
      pin: defaultPin,
      role: member.role,
      isLeader: member.isLeader,
    });
  }
  console.log(`✅ Created ${teamMembers.length} users (default PIN: 1234)`);

  // ─── Checklist Categories & Items ───
  const categories = [
    {
      name: "Sprzęt medyczny",
      items: [
        { name: "Defibrylator AED", description: "Sprawdź stan baterii i elektrod" },
        { name: "Kardiomonitor", description: "Test włączenia, kable, elektrody" },
        { name: "Pulsoksymetr", description: "Sprawdź czujnik i baterie" },
        { name: "Glukometr", description: "Paski testowe, bateria" },
        { name: "Ciśnieniomierz", description: "Mankiet, sprawność" },
        { name: "Ssak elektryczny", description: "Sprawdź działanie, cewniki" },
        { name: "Respirator transportowy", description: "Test, obwód oddechowy" },
        { name: "Worek samorozprężalny (ambu)", description: "Maski, rezerwuar" },
        { name: "Zestaw intubacyjny", description: "Laryngoskop, rurki, prowadnica" },
        { name: "Butle tlenowe", description: "Sprawdź ciśnienie" },
        { name: "Deski ortopedyczne", description: "Pasy mocujące" },
        { name: "Szyny Kramera", description: "Komplet rozmiarów" },
        { name: "Kołnierze szyjne", description: "Rozmiary S, M, L" },
        { name: "Nosze główne", description: "Mechanizm, pasy" },
        { name: "Krzesełko kardiologiczne", description: "Sprawność" },
      ],
    },
    {
      name: "Leki",
      items: [
        { name: "Adrenalina 1mg/ml", description: null, expectedQuantity: 10 },
        { name: "Atropina 1mg/ml", description: null, expectedQuantity: 5 },
        { name: "Amiodaron 150mg/3ml", description: null, expectedQuantity: 6 },
        { name: "Morfina 10mg/ml", description: "Sprawdź termin ważności", expectedQuantity: 3 },
        { name: "Fentanyl 0.1mg/2ml", description: null, expectedQuantity: 5 },
        { name: "Ketamina 200mg/20ml", description: null, expectedQuantity: 2 },
        { name: "Midazolam 5mg/ml", description: null, expectedQuantity: 5 },
        { name: "NaCl 0.9% 500ml", description: null, expectedQuantity: 6 },
        { name: "Glukoza 20% 10ml", description: null, expectedQuantity: 5 },
        { name: "Heparyna", description: null, expectedQuantity: 2 },
        { name: "Salbutamol (inhalator)", description: null, expectedQuantity: 1 },
        { name: "Captopril 25mg", description: "Tabletki", expectedQuantity: 10 },
        { name: "Nitrogliceryna spray", description: null, expectedQuantity: 1 },
        { name: "Paracetamol 1g IV", description: null, expectedQuantity: 3 },
        { name: "Ondansetron 4mg/2ml", description: null, expectedQuantity: 3 },
      ],
    },
    {
      name: "Materiały jednorazowe",
      items: [
        { name: "Wenflon (kaniule)", description: "Rozmiary 18G, 20G, 22G", expectedQuantity: 10 },
        { name: "Strzykawki 2ml", description: null, expectedQuantity: 10 },
        { name: "Strzykawki 5ml", description: null, expectedQuantity: 10 },
        { name: "Strzykawki 10ml", description: null, expectedQuantity: 5 },
        { name: "Strzykawki 20ml", description: null, expectedQuantity: 5 },
        { name: "Igły", description: "Różne rozmiary", expectedQuantity: 20 },
        { name: "Plaster i opatrunki", description: "Zestaw" },
        { name: "Rękawiczki nitrylowe", description: "S, M, L", expectedQuantity: 50 },
        { name: "Aparaty do kroplówek", description: null, expectedQuantity: 5 },
        { name: "Przedłużacze do wlewów", description: null, expectedQuantity: 5 },
        { name: "Elektrodы EKG", description: null, expectedQuantity: 20 },
        { name: "Maski tlenowe", description: "Różne rozmiary", expectedQuantity: 5 },
        { name: "Wąsy tlenowe", description: null, expectedQuantity: 5 },
      ],
    },
    {
      name: "Pojazd - czynności dzienne",
      items: [
        { name: "Poziom paliwa", description: "Minimum 3/4 baku" },
        { name: "Światła sygnalizacyjne", description: "Test wszystkich lamp błyskowych" },
        { name: "Syrena", description: "Test wszystkich tonów" },
        { name: "Klimatyzacja / ogrzewanie", description: "Sprawdź działanie w przedziale medycznym" },
        { name: "Oświetlenie przedziału", description: "Wszystkie lampki" },
        { name: "Czystość przedziału medycznego", description: "Dezynfekcja powierzchni" },
        { name: "Czystość kabiny kierowcy", description: null },
        { name: "Stan ogumienia", description: "Wzrokowa kontrola" },
        { name: "Apteczka kierowcy", description: "Komplet" },
        { name: "Gaśnica", description: "Termin ważności, plomba" },
        { name: "Trójkąt ostrzegawczy", description: null },
        { name: "Dokumenty pojazdu", description: "Dowód rejestracyjny, ubezpieczenie" },
      ],
    },
  ];

  for (let i = 0; i < categories.length; i++) {
    const cat = categories[i];
    const [category] = await db
      .insert(schema.checklistCategories)
      .values({ name: cat.name, sortOrder: i })
      .returning();

    for (let j = 0; j < cat.items.length; j++) {
      const item = cat.items[j];
      await db.insert(schema.checklistItems).values({
        categoryId: category.id,
        name: item.name,
        description: item.description || null,
        expectedQuantity: (item as any).expectedQuantity || null,
        sortOrder: j,
      });
    }
    console.log(`✅ Category "${cat.name}" with ${cat.items.length} items`);
  }

  // ─── Materials for usage tracking ───
  const materialsList = [
    { name: "Adrenalina 1mg/ml", unit: "amp" },
    { name: "Atropina 1mg/ml", unit: "amp" },
    { name: "Amiodaron 150mg/3ml", unit: "amp" },
    { name: "Morfina 10mg/ml", unit: "amp" },
    { name: "Fentanyl 0.1mg/2ml", unit: "amp" },
    { name: "Midazolam 5mg/ml", unit: "amp" },
    { name: "NaCl 0.9% 500ml", unit: "szt" },
    { name: "Glukoza 20% 10ml", unit: "amp" },
    { name: "Wenflon 18G", unit: "szt" },
    { name: "Wenflon 20G", unit: "szt" },
    { name: "Wenflon 22G", unit: "szt" },
    { name: "Strzykawki 2ml", unit: "szt" },
    { name: "Strzykawki 5ml", unit: "szt" },
    { name: "Strzykawki 10ml", unit: "szt" },
    { name: "Strzykawki 20ml", unit: "szt" },
    { name: "Igły", unit: "szt" },
    { name: "Aparat do kroplówki", unit: "szt" },
    { name: "Przedłużacz do wlewu", unit: "szt" },
    { name: "Rękawiczki nitrylowe", unit: "par" },
    { name: "Elektrody EKG", unit: "szt" },
    { name: "Maska tlenowa", unit: "szt" },
    { name: "Wąsy tlenowe", unit: "szt" },
    { name: "Plaster", unit: "szt" },
    { name: "Opatrunek jałowy", unit: "szt" },
    { name: "Bandaż elastyczny", unit: "szt" },
    { name: "Koc termiczny NRC", unit: "szt" },
    { name: "Paracetamol 1g IV", unit: "szt" },
    { name: "Ondansetron 4mg/2ml", unit: "amp" },
    { name: "Captopril 25mg tbl", unit: "szt" },
    { name: "Nitrogliceryna spray", unit: "szt" },
  ];

  for (const mat of materialsList) {
    await db.insert(schema.materials).values({
      name: mat.name,
      unit: mat.unit,
      minStock: 5,
    });
  }
  console.log(`✅ Created ${materialsList.length} materials`);

  console.log("\n🎉 Seeding complete!");
  console.log("📌 All users have default PIN: 1234");
  console.log("📌 Leader: Reszczyński Łukasz");
}

seed().catch(console.error);
