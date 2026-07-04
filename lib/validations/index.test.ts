import { describe, it, expect } from "vitest";
import {
  tourSchema,
  eligibilityTestSchema,
  dynamicFormSchema,
  testAttemptSchema,
  certificateSchema,
  visitSchema,
  careerInquirySchema,
} from "./index";

describe("tourSchema", () => {
  const valid = {
    title: "Himalayan Exchange",
    description: "A ten day cultural exchange programme.",
    destination: "Himachal Pradesh",
    start_date: "2026-08-01",
    end_date: "2026-08-10",
    capacity: 20,
  };

  it("accepts a valid tour and defaults status to draft", () => {
    const parsed = tourSchema.parse(valid);
    expect(parsed.status).toBe("draft");
  });

  it("rejects a non-positive capacity", () => {
    expect(() => tourSchema.parse({ ...valid, capacity: 0 })).toThrow();
  });

  it("rejects an unknown status", () => {
    expect(() => tourSchema.parse({ ...valid, status: "cancelled" })).toThrow();
  });

  it("rejects a title that is too short", () => {
    expect(() => tourSchema.parse({ ...valid, title: "ab" })).toThrow();
  });
});

describe("eligibilityTestSchema", () => {
  const base = {
    title: "Screening Test",
    tour_id: "123e4567-e89b-12d3-a456-426614174000",
    duration_minutes: 30,
    passing_score: 60,
  };

  it("accepts a test with at least one valid question", () => {
    const parsed = eligibilityTestSchema.parse({
      ...base,
      questions: [{ id: "q1", type: "mcq", question: "Why volunteer?", marks: 10 }],
    });
    expect(parsed.questions).toHaveLength(1);
  });

  it("rejects a test with zero questions", () => {
    expect(() => eligibilityTestSchema.parse({ ...base, questions: [] })).toThrow();
  });

  it("rejects a passing_score outside 0-100", () => {
    expect(() =>
      eligibilityTestSchema.parse({
        ...base,
        passing_score: 150,
        questions: [{ id: "q1", type: "mcq", question: "Why volunteer?", marks: 10 }],
      })
    ).toThrow();
  });

  it("rejects an invalid tour_id (not a uuid)", () => {
    expect(() =>
      eligibilityTestSchema.parse({
        ...base,
        tour_id: "not-a-uuid",
        questions: [{ id: "q1", type: "mcq", question: "Why volunteer?", marks: 10 }],
      })
    ).toThrow();
  });
});

describe("dynamicFormSchema", () => {
  it("accepts a form with a valid field", () => {
    const parsed = dynamicFormSchema.parse({
      title: "Daily Report",
      fields: [{ id: "activity", type: "textarea", label: "Activities Conducted" }],
      target_role: "volunteer",
      status: "active",
    });
    expect(parsed.is_template).toBe(false);
  });

  it("rejects a field with an unsupported type", () => {
    expect(() =>
      dynamicFormSchema.parse({
        title: "Daily Report",
        fields: [{ id: "activity", type: "richtext", label: "Activities Conducted" }],
        target_role: "volunteer",
        status: "active",
      })
    ).toThrow();
  });

  it("rejects zero fields", () => {
    expect(() =>
      dynamicFormSchema.parse({
        title: "Daily Report",
        fields: [],
        target_role: "volunteer",
        status: "active",
      })
    ).toThrow();
  });
});

describe("testAttemptSchema", () => {
  it("accepts string and array answers", () => {
    const parsed = testAttemptSchema.parse({
      test_id: "123e4567-e89b-12d3-a456-426614174000",
      answers: { q1: "a", q2: ["a", "b"] },
    });
    expect(parsed.answers.q1).toBe("a");
  });

  it("rejects a non-uuid test_id", () => {
    expect(() => testAttemptSchema.parse({ test_id: "abc", answers: {} })).toThrow();
  });
});

describe("certificateSchema", () => {
  it("rejects an unknown certificate_type", () => {
    expect(() =>
      certificateSchema.parse({
        user_id: "123e4567-e89b-12d3-a456-426614174000",
        certificate_type: "gold-star",
      })
    ).toThrow();
  });
});

describe("visitSchema", () => {
  const valid = {
    title: "College Visit",
    destination: "Pune",
    start_date: "2026-09-01",
    end_date: "2026-09-02",
  };

  it("accepts an empty string for timetable_url (optional field left blank in a form)", () => {
    const parsed = visitSchema.parse({ ...valid, timetable_url: "" });
    expect(parsed.timetable_url).toBe("");
  });

  it("rejects a non-empty, non-URL timetable_url", () => {
    expect(() => visitSchema.parse({ ...valid, timetable_url: "not a url" })).toThrow();
  });
});

describe("careerInquirySchema", () => {
  it("rejects an invalid email", () => {
    expect(() =>
      careerInquirySchema.parse({ name: "A Student", email: "not-an-email", age: 20 })
    ).toThrow();
  });

  it("rejects an age outside 1-120", () => {
    expect(() =>
      careerInquirySchema.parse({ name: "A Student", email: "a@example.com", age: 0 })
    ).toThrow();
  });
});
