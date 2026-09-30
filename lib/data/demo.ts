export const demoBooks = [
  { id: "demo-pflege", title: "Deutsch in der Pflege", publisher: "Demo", language: "Deutsch", level: "B1" },
  { id: "demo-eigen", title: "Eigenes Kursmaterial", publisher: "", language: "Deutsch", level: "A2–B1" }
];

export const demoLessons = [
  {
    id: "demo-lesson-4",
    book_id: "demo-pflege",
    number: 4,
    title: "Körperpflege",
    topic: "Körperpflege im beruflichen Alltag",
    level: "B1",
    description: "Patientinnen und Patienten bei der Körperpflege sprachlich begleiten.",
    books: { title: "Deutsch in der Pflege" }
  },
  {
    id: "demo-lesson-5",
    book_id: "demo-pflege",
    number: 5,
    title: "Mobilisation",
    topic: "Mobilisation und Unterstützung",
    level: "B1",
    description: "Handlungen ankündigen und Anweisungen geben.",
    books: { title: "Deutsch in der Pflege" }
  }
];
