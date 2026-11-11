import { describe, it, expect, beforeEach } from "vitest";
import { createTestDb, seedBaseData } from "~/test/setup";
import * as schema from "~/db/schema";
import { getNote, listNotes, saveNote } from "./notes.server";

type TestDb = ReturnType<typeof createTestDb>;

const NOW = new Date(2026, 9, 6, 12, 0, 0);

function minutesLater(minutes: number) {
  return new Date(NOW.getTime() + minutes * 60_000);
}

let db: TestDb;
let base: ReturnType<typeof seedBaseData>;
let lessonIds: number[];

beforeEach(() => {
  db = createTestDb();
  base = seedBaseData(db);

  const module = db
    .insert(schema.modules)
    .values({ courseId: base.course.id, title: "Basics", position: 1 })
    .returning()
    .get();

  lessonIds = [1, 2].map(
    (position) =>
      db
        .insert(schema.lessons)
        .values({ moduleId: module.id, title: `Lesson ${position}`, position })
        .returning()
        .get().id
  );
});

describe("saving a Note", () => {
  it("creates a Note on a Lesson with none, body trimmed", () => {
    saveNote(db, base.user.id, lessonIds[0], "  # not a heading  ", NOW);

    expect(getNote(db, base.user.id, lessonIds[0])).toMatchObject({
      body: "# not a heading",
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it("replaces the body and moves the last edited time on when saved again", () => {
    saveNote(db, base.user.id, lessonIds[0], "first", NOW);
    saveNote(db, base.user.id, lessonIds[0], "second", minutesLater(5));

    expect(getNote(db, base.user.id, lessonIds[0])).toMatchObject({
      body: "second",
      createdAt: NOW.toISOString(),
      updatedAt: minutesLater(5).toISOString(),
    });
    expect(listNotes(db, base.user.id)).toHaveLength(1);
  });

  it("accepts a Note of exactly 2,000 characters", () => {
    const result = saveNote(db, base.user.id, lessonIds[0], "a".repeat(2000), NOW);

    expect(result.ok).toBe(true);
    expect(getNote(db, base.user.id, lessonIds[0])?.body).toHaveLength(2000);
  });

  it("refuses a Note over 2,000 characters with a message", () => {
    expect(saveNote(db, base.user.id, lessonIds[0], "a".repeat(2001), NOW)).toEqual({
      ok: false,
      error: "Notes must be 2,000 characters or fewer.",
    });
    expect(getNote(db, base.user.id, lessonIds[0])).toBeUndefined();
  });

  it("clears the Note when an empty box is saved", () => {
    saveNote(db, base.user.id, lessonIds[0], "something", NOW);
    saveNote(db, base.user.id, lessonIds[0], "   ", minutesLater(1));

    expect(getNote(db, base.user.id, lessonIds[0])).toBeUndefined();
  });
});

describe("listing Notes", () => {
  it("lists only the Student's own Notes, last edited first, with Lesson and Course", () => {
    saveNote(db, base.user.id, lessonIds[0], "one", NOW);
    saveNote(db, base.user.id, lessonIds[1], "two", minutesLater(5));
    saveNote(db, base.instructor.id, lessonIds[0], "not yours", minutesLater(10));
    saveNote(db, base.user.id, lessonIds[0], "one, edited", minutesLater(15));

    expect(listNotes(db, base.user.id)).toMatchObject([
      { body: "one, edited", lessonTitle: "Lesson 1", courseTitle: "Test Course", courseSlug: "test-course" },
      { body: "two", lessonTitle: "Lesson 2", courseTitle: "Test Course", courseSlug: "test-course" },
    ]);
  });
});
