import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

async function seedChecklist() {
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const sql = neon(DATABASE_URL);
  const db = drizzle(sql, { schema });

  console.log("Clearing old checklist data...");
  await db.delete(schema.checklistCompletions);
  await db.delete(schema.dailyChecklists);
  await db.delete(schema.checklistItems);
  await db.delete(schema.checklistCategories);

  // ─── Kontrola dyżuru (Shift Control) ───
  const dutyCategories = [
    {
      name: "Defibrylator / monitor",
      items: [
        { name: "Defibrylator-kardiomonitor", unit: "szt.", qty: 1 },
        { name: "Akumulator sprawny / naładowany", unit: "szt.", qty: 2 },
        { name: "Elektrody wielofunkcyjne dorosłe", unit: "amp./op.", qty: 2 },
        { name: "Elektrody pediatryczne", unit: "amp./op.", qty: 1 },
        { name: "Kabel / elektrody EKG 12-odprowadzeniowe", unit: "komplet", qty: 1 },
        { name: "Papier EKG", unit: "szt.", qty: 1 },
        { name: "Czujnik SpO\u2082", unit: "szt.", qty: 1 },
        { name: "Mankiety NIBP \u2013 wymagane rozmiary", unit: "komplet", qty: 1 },
        { name: "Akcesoria EtCO\u2082", unit: "komplet", qty: 1 },
      ],
    },
    {
      name: "Drogi oddechowe",
      items: [
        { name: "Respirator transportowy", unit: "szt.", qty: 2 },
        { name: "Worek samorozpr\u0119\u017Calny dorosły", unit: "szt.", qty: 1 },
        { name: "Worek samorozpr\u0119\u017Calny dziecko/noworodek", unit: "szt.", qty: 1 },
        { name: "Maski do wentylacji \u2013 rozmiary", unit: "komplet", qty: 6 },
        { name: "Rurki ustno-gardłowe \u2013 rozmiary", unit: "komplet", qty: 10 },
        { name: "Rurki nosowo-gardłowe \u2013 rozmiary", unit: "komplet", qty: 10 },
        { name: "Przyrz\u0105dy nadgło\u015Bniowe \u2013 rozmiary", unit: "komplet", qty: 5 },
        { name: "Laryngoskop + łyżki", unit: "szt.", qty: 2 },
        { name: "Rurki intubacyjne \u2013 rozmiary", unit: "komplet", qty: 20 },
        { name: "Prowadnica / akcesoria do intubacji", unit: "komplet", qty: 1 },
        { name: "Zestaw do konikopunkcji", unit: null, qty: null },
        { name: "Ssak transportowy", unit: "szt.", qty: 1 },
        { name: "Cewniki / ko\u0144c\u00F3wki do odsysania", unit: "szt.", qty: 10 },
      ],
    },
    {
      name: "Tlen",
      items: [
        { name: "Tlen \u2013 instalacja główna", unit: "kpl.", qty: 4 },
        { name: "Maski tlenowe / z rezerwuarem", unit: "komplet", qty: 6 },
        { name: "W\u0105sy tlenowe", unit: "szt.", qty: 3 },
        { name: "Zestawy do nebulizacji dorosły/dziecko", unit: "komplet", qty: 6 },
      ],
    },
    {
      name: "Dost\u0119p IV / IO",
      items: [
        { name: "Kaniule IV \u2013 wymagane rozmiary", unit: "komplet", qty: 4 },
        { name: "Stazy", unit: "szt.", qty: 2 },
        { name: "Strzykawki / igły", unit: "komplet", qty: 4 },
        { name: "Przedłu\u017Cacze / kraniki / korki", unit: "szt.", qty: 5 },
        { name: "Urz\u0105dzenie / zestaw IO", unit: "komplet", qty: 2 },
        { name: "Igły IO \u2013 wymagane rozmiary", unit: null, qty: null },
      ],
    },
    {
      name: "Urazy / krwotok",
      items: [
        { name: "Opatrunki jałowe i uciskowe", unit: "szt.", qty: 10 },
        { name: "Opatrunki hemostatyczne", unit: null, qty: null },
        { name: "Opaski uciskowe", unit: "szt.", qty: 2 },
        { name: "Zestaw do odbarczenia odmy", unit: "komplet", qty: 1 },
        { name: "Materiały na oparzenia", unit: "szt.", qty: 6 },
        { name: "Folie termoizolacyjne", unit: "szt.", qty: 6 },
      ],
    },
    {
      name: "Unieruchomienie",
      items: [
        { name: "Nosze główne + pasy", unit: "szt.", qty: 1 },
        { name: "Krzesło transportowe", unit: "szt.", qty: 1 },
        { name: "Nosze podbierakowe", unit: "szt.", qty: 1 },
        { name: "Materac próżniowy + pompa", unit: "szt.", qty: 1 },
        { name: "Kołnierze \u2013 wymagane rozmiary", unit: "komplet", qty: 1 },
        { name: "Szyny \u2013 komplet", unit: "komplet", qty: 1 },
      ],
    },
    {
      name: "Diagnostyka",
      items: [
        { name: "Glukometr", unit: "szt.", qty: 2 },
        { name: "Paski do glukometru", unit: "szt.", qty: 2 },
        { name: "Termometr", unit: "szt.", qty: 1 },
        { name: "Stetoskop", unit: "szt.", qty: 1 },
      ],
    },
    {
      name: "Pediatria / por\u00F3d",
      items: [
        { name: "Zestaw pediatryczny", unit: "komplet", qty: 1 },
        { name: "Zestaw do RKO noworodka", unit: "komplet", qty: 1 },
        { name: "Zestaw porodowy", unit: "komplet", qty: 1 },
      ],
    },
    {
      name: "Leki",
      items: [
        { name: "Płyny infuzyjne", unit: "szt.", qty: 20 },
      ],
    },
    {
      name: "Leki kontrolowane",
      items: [
        { name: "Fentanyl", unit: "amp./op.", qty: 5 },
        { name: "Morfina", unit: "amp./op.", qty: 4 },
        { name: "Pozostałe leki kontrolowane", unit: "amp./op.", qty: 14 },
      ],
    },
    {
      name: "\u0141\u0105czno\u015B\u0107 / SWD",
      items: [
        { name: "Terminal SWD PRM", unit: "szt.", qty: 1 },
        { name: "Radiostacja samochodowa", unit: "szt.", qty: 1 },
        { name: "Radiostacja przeno\u015Bna", unit: "szt.", qty: 1 },
      ],
    },
    {
      name: "Gotowo\u015B\u0107",
      items: [
        { name: "\u015AOI / r\u0119kawiczki / \u015Brodki dezynfekcyjne", unit: "szt.", qty: 2 },
        { name: "Pojemnik na odpady ostre", unit: "szt.", qty: 2 },
        { name: "Worki na odpady medyczne", unit: "szt.", qty: 1 },
      ],
    },
  ];

  // ─── Kierowca - ambulans (Driver Vehicle Inspection) ───
  const driverCategories = [
    {
      name: "\u{1F698} Nadwozie",
      items: [
        { name: "Karoseria \u2013 nowe wgniecenia, rysy, p\u0119kni\u0119cia" },
        { name: "Zderzaki, listwy, lusterka i elementy zewn\u0119trzne" },
        { name: "Szyby \u2013 p\u0119kni\u0119cia / odpryski / widoczno\u015B\u0107" },
        { name: "Drzwi kabiny i przedziału medycznego" },
        { name: "Drzwi boczne / tylne, zamki i klamki" },
        { name: "Stopnie wej\u015Bciowe i uchwyty" },
      ],
    },
    {
      name: "\u{1F698} O\u015Bwietlenie",
      items: [
        { name: "\u015Awiatła mijania / drogowe / pozycyjne" },
        { name: "Kierunkowskazy / STOP / cofania" },
      ],
    },
    {
      name: "\u{1F698} Uprzywilejowanie",
      items: [
        { name: "Sygnały \u015Bwietlne pojazdu uprzywilejowanego" },
        { name: "Sygnały d\u017Awi\u0119kowe pojazdu uprzywilejowanego" },
      ],
    },
    {
      name: "\u{1F698} Koła",
      items: [
        { name: "Opony \u2013 widoczne uszkodzenia / ci\u015Bnienie / stan" },
        { name: "Felgi / koła \u2013 widoczne uszkodzenia" },
      ],
    },
    {
      name: "\u{1F698} Kabina",
      items: [
        { name: "Kontrolki ostrzegawcze po uruchomieniu pojazdu" },
        { name: "Wycieraczki i spryskiwacze" },
        { name: "Klakson" },
        { name: "Pasy bezpiecze\u0144stwa" },
        { name: "Lusterka / kamera cofania" },
      ],
    },
    {
      name: "\u{1F698} Eksploatacja",
      items: [
        { name: "Poziom paliwa / gotowo\u015B\u0107 do wyjazdu" },
        { name: "AdBlue \u2013 je\u015Bli dotyczy" },
        { name: "Widoczne wycieki pod pojazdem" },
        { name: "Nietypowe komunikaty / odgłosy / zachowanie pojazdu" },
      ],
    },
    {
      name: "\u{1F698} Przedział medyczny",
      items: [
        { name: "O\u015Bwietlenie przedziału medycznego" },
        { name: "Klimatyzacja / ogrzewanie / wentylacja" },
        { name: "Gniazda i zasilanie w przedziale medycznym" },
        { name: "Szafki, zamki i elementy zabudowy" },
        { name: "Podłoga, \u015Bciany i sufit \u2013 brak uszkodze\u0144" },
      ],
    },
    {
      name: "\u{1F698} Mocowanie",
      items: [
        { name: "Mocowanie noszy głównych" },
        { name: "Mocowania foteli i pasów w przedziale medycznym" },
        { name: "Mocowania butli tlenowych" },
        { name: "Mocowania sprz\u0119tu medycznego" },
      ],
    },
    {
      name: "\u{1F698} Bezpiecze\u0144stwo",
      items: [
        { name: "Ga\u015Bnica \u2013 obecna i zabezpieczona" },
        { name: "Trójk\u0105t / wyposa\u017Cenie drogowe" },
        { name: "Brak lu\u017Anych przedmiotów mogących stwarzać zagrożenie" },
      ],
    },
  ];

  let sortOrder = 0;

  // Insert duty checklist categories
  for (const cat of dutyCategories) {
    const [category] = await db
      .insert(schema.checklistCategories)
      .values({ name: cat.name, sortOrder: sortOrder++ })
      .returning();

    for (let j = 0; j < cat.items.length; j++) {
      const item = cat.items[j];
      await db.insert(schema.checklistItems).values({
        categoryId: category.id,
        name: item.name,
        description: item.unit ? `Wymagane: ${item.qty} ${item.unit}` : null,
        expectedQuantity: item.qty ?? null,
        sortOrder: j,
      });
    }
    console.log(`  ${cat.name}: ${cat.items.length} items`);
  }

  // Insert driver checklist categories
  for (const cat of driverCategories) {
    const [category] = await db
      .insert(schema.checklistCategories)
      .values({ name: cat.name, sortOrder: sortOrder++ })
      .returning();

    for (let j = 0; j < cat.items.length; j++) {
      const item = cat.items[j];
      await db.insert(schema.checklistItems).values({
        categoryId: category.id,
        name: item.name,
        description: null,
        expectedQuantity: null,
        sortOrder: j,
      });
    }
    console.log(`  ${cat.name}: ${cat.items.length} items`);
  }

  const totalDuty = dutyCategories.reduce((s, c) => s + c.items.length, 0);
  const totalDriver = driverCategories.reduce((s, c) => s + c.items.length, 0);
  console.log(`\nDone! ${dutyCategories.length + driverCategories.length} categories, ${totalDuty + totalDriver} items total`);
  console.log(`  Kontrola dyżuru: ${dutyCategories.length} categories, ${totalDuty} items`);
  console.log(`  Kierowca - ambulans: ${driverCategories.length} categories, ${totalDriver} items`);
}

seedChecklist().catch(console.error);
